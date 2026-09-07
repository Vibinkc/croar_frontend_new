"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import {
  payrollApi,
  settingsApi,
  inr,
  type Employee,
  type MoneyLine,
  type PayFrequency,
  type ResolvedLine,
  type SalaryTemplate,
  type StructurePreviewOut,
  type TemplateAssignment,
} from "@/utils/payroll/api";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";
import {
  Search,
  Filter,
  ChevronDown,
  Plus,
  Copy,
  X,
  Calculator,
  ShieldCheck,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Card,
  Input,
  Select,
  Field,
  Badge,
  StatCard,
  StatGrid,
  PageHeader,
  jetbrainsMono,
} from "@/components/ds";

// ---------------------------------------------------------------------------
// A template is a reusable, CTC-driven salary package: its lines are *rules*
// (percent-of-CTC + a balance line), so applying it to an employee scales the
// amounts to that employee's CTC. This page manages templates and applies them.
// ---------------------------------------------------------------------------

interface LineDraft {
  code: string;
  label: string;
  type: "fixed" | "percent" | "balance";
  amount: string;
  percent: string;
  percent_of: string;
}

const emptyLine = (): LineDraft => ({ code: "", label: "", type: "fixed", amount: "", percent: "", percent_of: "" });

function toMoneyLines(rows: LineDraft[]): MoneyLine[] {
  return rows
    .filter((r) => r.code.trim())
    .map((r) => {
      const base = { code: r.code.trim(), label: r.label.trim() || r.code.trim() };
      if (r.type === "balance") return { ...base, type: "balance" as const };
      if (r.type === "fixed") return { ...base, type: "fixed" as const, amount: Number(r.amount) || 0 };
      return { ...base, type: "percent" as const, percent: Number(r.percent) || 0, percent_of: r.percent_of || null };
    });
}

function fromMoneyLines(lines: MoneyLine[]): LineDraft[] {
  return (lines || []).map((l) => ({
    code: l.code,
    label: l.label,
    type: l.type,
    amount: l.amount != null ? String(l.amount) : "",
    percent: l.percent != null ? String(l.percent) : "",
    percent_of: l.percent_of || "",
  }));
}

const SAMPLE_CTC_DEFAULT = "1200000";

const selectCls =
  "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

export default function TemplatesPage() {
  const { can } = useAuth();
    const { t: tr } = useI18n();
  const { confirm, alert } = useDialog();
  const canEdit = can("payroll:configure");

  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar (presentation-only filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const [statutoryFilter, setStatutoryFilter] = useState<"ALL" | "WITH" | "WITHOUT">("ALL");

  // Editor modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [orgCurrency, setOrgCurrency] = useState("INR");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("MONTHLY");
  const [earnings, setEarnings] = useState<LineDraft[]>([]);
  const [deductions, setDeductions] = useState<LineDraft[]>([]);
  const [pfEnabled, setPfEnabled] = useState(false);
  const [pfCap, setPfCap] = useState(true);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [ptEnabled, setPtEnabled] = useState(false);
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [sampleCtc, setSampleCtc] = useState(SAMPLE_CTC_DEFAULT);

  async function load() {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([payrollApi.listTemplates(), payrollApi.listEmployees()]);
      setTemplates(t);
      setEmployees(e);
      settingsApi.getOrganization().then((org) => {
        if (org?.currency) { setOrgCurrency(org.currency); setCurrency((c) => (c === "INR" ? org.currency : c)); }
      }).catch(() => {});
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Which codes a `percent … of X` line may reference, matching the engine's
  // resolution order (see compute_payslip):
  //  - Earnings resolve top-to-bottom, with balance lines deferred to a last
  //    pass. So an earning percent-line can only reference an EARLIER,
  //    non-balance earning — referencing a balance line or a line below it
  //    always resolves to 0. Offer only the safe refs.
  //  - Deductions resolve after ALL earnings (incl. balance), so a deduction
  //    may reference any earning code.
  const earningRefCodesFor = (rowIndex: number, rowCode: string) =>
    earnings
      .slice(0, rowIndex)
      .filter((e) => e.type !== "balance" && e.code && e.code !== rowCode)
      .map((e) => e.code);
  const deductionRefCodesFor = (_rowIndex: number, rowCode: string) =>
    earnings.map((e) => e.code).filter((c) => c && c !== rowCode);

  // The sample CTC only moves the numbers when at least one earning line is
  // anchored to CTC — a "balance" line (absorbs the CTC remainder) or a
  // percent-of-CTC line. With only fixed / percent-of-other lines the gross is
  // independent of CTC, so editing it does nothing (by design).
  const ctcDriven = useMemo(
    () =>
      earnings.some(
        (e) => e.type === "balance" || (e.type === "percent" && e.percent_of === "CTC")
      ),
    [earnings]
  );

  // Live preview from the real engine, resolved at the sample CTC so the author
  // sees how the rules break down (incl. statutory) before applying.
  const [preview, setPreview] = useState<StructurePreviewOut | null>(null);
  const [previewing, setPreviewing] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewing(true);
    const handle = setTimeout(() => {
      payrollApi
        .previewStructure({
          ctc: Number(sampleCtc) || 0,
          pay_frequency: payFrequency,
          components: toMoneyLines(earnings),
          default_deductions: toMoneyLines(deductions),
          lop_days: 0,
          pf_enabled: pfEnabled,
          pf_cap_at_ceiling: pfCap,
          esi_enabled: esiEnabled,
          pt_enabled: ptEnabled,
          tds_enabled: tdsEnabled,
        })
        .then((res) => !cancelled && setPreview(res))
        .catch(() => !cancelled && setPreview(null))
        .finally(() => !cancelled && setPreviewing(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, sampleCtc, payFrequency, earnings, deductions, pfEnabled, pfCap, esiEnabled, ptEnabled, tdsEnabled]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setDescription("");
    setCurrency(orgCurrency);
    setPayFrequency("MONTHLY");
    setEarnings([
      { ...emptyLine(), code: "BASIC", label: tr("payroll.componentBasic"), type: "percent", percent: "40", percent_of: "CTC" },
      { ...emptyLine(), code: "HRA", label: "HRA", type: "percent", percent: "50", percent_of: "BASIC" },
      { ...emptyLine(), code: "SPECIAL", label: tr("payroll.componentSpecialAllowance"), type: "balance" },
    ]);
    setDeductions([]);
    setPfEnabled(false);
    setPfCap(true);
    setEsiEnabled(false);
    setPtEnabled(false);
    setTdsEnabled(false);
    setSampleCtc(SAMPLE_CTC_DEFAULT);
    setFormErr(null);
    setOpen(true);
  }

  function openEdit(t: SalaryTemplate) {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description ?? "");
    setCurrency(t.currency);
    setPayFrequency(t.pay_frequency);
    setEarnings(fromMoneyLines(t.components));
    setDeductions(fromMoneyLines(t.default_deductions));
    setPfEnabled(t.pf_enabled);
    setPfCap(t.pf_cap_at_ceiling);
    setEsiEnabled(t.esi_enabled);
    setPtEnabled(t.pt_enabled);
    setTdsEnabled(t.tds_enabled);
    setSampleCtc(SAMPLE_CTC_DEFAULT);
    setFormErr(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!name.trim()) {
      setFormErr(tr("payroll.giveTemplateName"));
      return;
    }
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      currency,
      pay_frequency: payFrequency,
      components: toMoneyLines(earnings),
      default_deductions: toMoneyLines(deductions),
      pf_enabled: pfEnabled,
      pf_cap_at_ceiling: pfCap,
      esi_enabled: esiEnabled,
      pt_enabled: ptEnabled,
      tds_enabled: tdsEnabled,
    };
    setSaving(true);
    try {
      if (editingId) await payrollApi.updateTemplate(editingId, body);
      else await payrollApi.createTemplate(body);
      setOpen(false);
      await load();
    } catch (err) {
      setFormErr((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: SalaryTemplate) {
    const ok = await confirm({
      title: tr("payroll.deleteTemplateTitle"),
      message: tr("payroll.deleteTemplateConfirm", { name: t.name }),
      confirmLabel: tr("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    try {
      await payrollApi.deleteTemplate(t.id);
      await load();
    } catch (err) {
      await alert({ message: (err as Error).message, tone: "danger" });
    }
  }

  // ---- Apply flow ----
  const [applyFor, setApplyFor] = useState<SalaryTemplate | null>(null);

  const gross = preview ? Number(preview.gross_earnings) : 0;
  const totalDeductions = preview ? Number(preview.total_deductions) : 0;
  const net = preview ? Number(preview.net_pay) : 0;
  const earningLines: ResolvedLine[] = preview?.earnings ?? [];
  const deductionLines: ResolvedLine[] = preview?.deductions ?? [];

  // Presentation-only list filtering (no logic/data mutation).
  const hasStatutory = (t: SalaryTemplate) => t.pf_enabled || t.esi_enabled || t.pt_enabled || t.tds_enabled;
  const filteredTemplates = templates.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      t.components.some((c) => c.code.toLowerCase().includes(q));
    const matchesStatutory =
      statutoryFilter === "ALL" ||
      (statutoryFilter === "WITH" && hasStatutory(t)) ||
      (statutoryFilter === "WITHOUT" && !hasStatutory(t));
    return matchesSearch && matchesStatutory;
  });

  const statCards = [
    { label: tr("payroll.templatesLabel"), value: templates.length, icon: "content_copy", gradient: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)" },
    { label: tr("payroll.withStatutoryLabel"), value: templates.filter(hasStatutory).length, icon: "verified_user", gradient: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
    { label: tr("payroll.employeesLabel"), value: employees.length, icon: "group", gradient: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
    { label: tr("payroll.avgComponents"), value: templates.length ? Math.round(templates.reduce((a, t) => a + t.components.length, 0) / templates.length) : "—", icon: "layers", gradient: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
  ];

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.salaryTemplates")}
        subtitle={tr("payroll.salaryTemplatesSubtitle")}
        help={<><p>{tr("payroll.templatesHelp1")}</p><p>{tr("payroll.templatesHelp2")}</p></>}
        actions={
          canEdit && (
            <Button icon="add" onClick={openCreate}>
              {tr("payroll.newTemplate")}
            </Button>
          )
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stat cards */}
      <StatGrid>
        {statCards.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} gradient={s.gradient} glow={s.glow} />
        ))}
      </StatGrid>

      {/* Toolbar: search + filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("payroll.searchTemplates")}
            className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
          />
        </div>
        <div className="relative flex-1 md:flex-none">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
          <select
            value={statutoryFilter}
            onChange={(e) => setStatutoryFilter(e.target.value as "ALL" | "WITH" | "WITHOUT")}
            className={`${selectCls} w-full md:min-w-[170px]`}
          >
            <option value="ALL">{tr("payroll.anyStatutory")}</option>
            <option value="WITH">{tr("payroll.withStatutory")}</option>
            <option value="WITHOUT">{tr("payroll.withoutStatutory")}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
        </div>
      </div>

      {/* Templates list */}
      <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5">
              <Copy className="w-8 h-8 text-[#BDBDBD]" />
            </div>
            {templates.length === 0 ? (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("payroll.noTemplatesYet")}</h3>
                <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-7">
                  {tr("payroll.noTemplatesYetDesc")}
                </p>
                {canEdit && (
                  <Button icon="add" onClick={openCreate}>
                    {tr("payroll.createFirstTemplate")}
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("payroll.noTemplatesMatch")}</h3>
                <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-7">{tr("payroll.noTemplatesMatchDesc")}</p>
                <Button onClick={() => { setSearchQuery(""); setStatutoryFilter("ALL"); }}>{tr("payroll.clearFilters")}</Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2.4fr_1.6fr_1.2fr_200px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.template")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.earnings")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.statutory")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("payroll.actions")}</span>
            </div>

            <div className="divide-y divide-[#EEEEEE]">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-1 md:grid-cols-[2.4fr_1.6fr_1.2fr_200px] gap-x-4 gap-y-3 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                >
                  {/* Template */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                      <Copy className="w-[17px] h-[17px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[#212121] truncate">{t.name}</div>
                      {t.description && <div className="text-[12px] text-[#757575] truncate">{t.description}</div>}
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="flex flex-wrap gap-1.5">
                    {t.components.map((c) => (
                      <Badge key={c.code} tone="indigo">{c.code}</Badge>
                    ))}
                  </div>

                  {/* Statutory */}
                  <div className="flex flex-wrap gap-1.5">
                    {t.pf_enabled && <Badge tone="teal">EPF</Badge>}
                    {t.esi_enabled && <Badge tone="teal">ESI</Badge>}
                    {t.pt_enabled && <Badge tone="teal">PT</Badge>}
                    {t.tds_enabled && <Badge tone="teal">TDS</Badge>}
                    {!t.pf_enabled && !t.esi_enabled && !t.pt_enabled && !t.tds_enabled && (
                      <span className="text-[12px] text-[#9E9E9E]">{tr("payroll.none")}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-start md:justify-end gap-2">
                    {canEdit && (
                      <Button size="sm" onClick={() => setApplyFor(t)}>{tr("payroll.apply")}</Button>
                    )}
                    {canEdit && (
                      <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>{tr("payroll.edit")}</Button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => remove(t)}
                        title={tr("payroll.deleteTemplateTitle")}
                        className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-[#212121]/40 backdrop-blur-sm">
          <Card padding="none" className="w-full max-w-6xl my-auto shadow-[0_24px_60px_rgba(0,0,0,0.22)] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                  <Copy className="w-[18px] h-[18px]" />
                </span>
                <h3 className="text-[16px] font-bold text-[#212121]">{editingId ? tr("payroll.editTemplate") : tr("payroll.newTemplate")}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-[4px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={save} className="flex flex-col gap-6 p-6">
              {formErr && (
                <div className="flex items-start gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formErr}</span>
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-w-0 flex-col gap-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={tr("payroll.templateName")} htmlFor="tpl-name" required>
                      <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("payroll.engineerL1Example")} required />
                    </Field>
                    <Field label={tr("payroll.payFrequency")} htmlFor="tpl-freq">
                      <Select id="tpl-freq" value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}>
                        <option value="MONTHLY">{tr("payroll.freqMonthly")}</option>
                        <option value="WEEKLY">{tr("payroll.freqWeekly")}</option>
                      </Select>
                    </Field>
                    <Field label={tr("payroll.descriptionOptional")} htmlFor="tpl-desc" className="sm:col-span-2">
                      <Input id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={tr("payroll.descriptionExample")} />
                    </Field>
                  </div>

                  <LineSection title={tr("payroll.earnings")} rows={earnings} setRows={setEarnings} refCodesFor={earningRefCodesFor} />
                  <LineSection title={tr("payroll.deductions")} rows={deductions} setRows={setDeductions} refCodesFor={deductionRefCodesFor} />

                  <div className="rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA]/60 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-[18px] h-[18px] text-[#1976D2]" />
                      <span className="text-[14px] font-bold text-[#212121]">{tr("payroll.statutoryCompliance")}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <ToggleRow icon="savings" title={tr("payroll.providentFund")} desc={tr("payroll.pfDescTemplates")} checked={pfEnabled} onChange={setPfEnabled}>
                        {pfEnabled && (
                          <label className="mt-2 flex items-center gap-2 text-[12px] text-[#757575]">
                            <input type="checkbox" className="accent-[#1976D2]" checked={pfCap} onChange={(e) => setPfCap(e.target.checked)} />
                            <span>{tr("payroll.capPfWageCeiling")}</span>
                          </label>
                        )}
                      </ToggleRow>
                      <ToggleRow icon="health_and_safety" title={tr("payroll.esi")} desc={tr("payroll.esiDescTemplates")} checked={esiEnabled} onChange={setEsiEnabled} />
                      <ToggleRow icon="account_balance_wallet" title={tr("payroll.professionalTax")} desc={tr("payroll.ptDescTemplates")} checked={ptEnabled} onChange={setPtEnabled} />
                      <ToggleRow icon="account_balance" title={tr("payroll.incomeTaxTds")} desc={tr("payroll.tdsDescTemplates")} checked={tdsEnabled} onChange={setTdsEnabled} />
                    </div>
                  </div>
                </div>

                {/* Live preview at a sample CTC */}
                <div className="lg:sticky lg:top-0 lg:self-start">
                  <div className="overflow-hidden rounded-[4px] border border-[#BBDEFB] bg-gradient-to-br from-[#E3F2FD] to-white">
                    <div className="border-b border-[#E0E0E0] px-4 py-3">
                      <span className="flex items-center gap-2 text-[13.5px] font-bold text-[#212121]">
                        <Calculator className="w-4 h-4 text-[#1976D2]" />
                        {tr("payroll.previewAtSampleCtc")}
                        {previewing && <span className="text-[11px] font-medium text-[#757575]">{tr("payroll.updating")}</span>}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <Field label={tr("payroll.sampleAnnualCtc")} htmlFor="tpl-sample-ctc">
                        <Input id="tpl-sample-ctc" type="number" value={sampleCtc} onChange={(e) => setSampleCtc(e.target.value)} />
                      </Field>
                      {!ctcDriven && (
                        <p className="mt-1.5 text-[12px] text-[#EF6C00]">
                          {tr("payroll.ctcWarnA")}{" "}
                          <strong>{tr("payroll.lineBalanceCtc")}</strong> {tr("payroll.ctcWarnB")} <strong>{tr("payroll.percentOfCtc")}</strong> {tr("payroll.ctcWarnC")}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 px-4 pb-3">
                      <PreviewStat label={tr("payroll.gross")} value={inr(gross, currency)} />
                      <PreviewStat label={tr("payroll.deductions")} value={`- ${inr(totalDeductions, currency)}`} tone="text-[#C62828]" />
                      <PreviewStat label={tr("payroll.net")} value={inr(net, currency)} tone="text-[#2E7D32]" big />
                    </div>
                    {earningLines.length > 0 && (
                      <div className="border-t border-[#E0E0E0] px-4 py-3">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.earningsBreakdown")}</div>
                        <div className="flex flex-col gap-1">
                          {earningLines.map((l) => (
                            <div key={l.code} className="flex justify-between text-[13px]">
                              <span className="text-[#757575]">{l.label}</span>
                              <span className={`font-medium text-[#212121] ${jetbrainsMono.className}`}>{inr(l.amount, currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {deductionLines.length > 0 && (
                      <div className="border-t border-[#E0E0E0] px-4 py-3">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.deductionBreakdown")}</div>
                        <div className="flex flex-col gap-1">
                          {deductionLines.map((l) => (
                            <div key={l.code} className="flex justify-between text-[13px]">
                              <span className="text-[#757575]">{l.label}</span>
                              <span className={`font-medium text-[#C62828] ${jetbrainsMono.className}`}>- {inr(l.amount, currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E0E0E0] pt-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{tr("common.cancel")}</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? tr("payroll.saving") : editingId ? tr("payroll.updateTemplate") : tr("payroll.saveTemplate")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {applyFor && (
        <ApplyModal
          template={applyFor}
          employees={employees}
          onClose={() => setApplyFor(null)}
          onApplied={async () => {
            setApplyFor(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apply-to-employees modal
// ---------------------------------------------------------------------------
function ApplyModal({
  template,
  employees,
  onClose,
  onApplied,
}: {
  template: SalaryTemplate;
  employees: Employee[];
  onClose: () => void;
  onApplied: () => void | Promise<void>;
}) {
  const { alert } = useDialog();
  const { t: tr } = useI18n();
  // Local calendar date (en-CA → YYYY-MM-DD). Using toISOString() would give the
  // UTC date, which can read as "yesterday" for +TZ users late in the day.
  const today = new Date().toLocaleDateString("en-CA");
  const [defaultCtc, setDefaultCtc] = useState("1200000");
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [rows, setRows] = useState<Record<string, { checked: boolean; ctc: string }>>(
    () => Object.fromEntries(employees.map((e) => [e.id, { checked: false, ctc: "" }]))
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo(() => employees.filter((e) => rows[e.id]?.checked), [employees, rows]);

  function toggle(id: string) {
    setRows((r) => ({ ...r, [id]: { ...r[id], checked: !r[id].checked } }));
  }

  async function submit() {
    setErr(null);
    if (selected.length === 0) {
      setErr(tr("payroll.selectAtLeastOne"));
      return;
    }
    const assignments: TemplateAssignment[] = selected.map((e) => ({
      employee_id: e.id,
      ctc: Number(rows[e.id].ctc || defaultCtc) || 0,
      effective_from: effectiveFrom,
    }));
    if (assignments.some((a) => a.ctc <= 0)) {
      setErr(tr("payroll.ctcGreaterThanZero"));
      return;
    }
    setBusy(true);
    try {
      const res = await payrollApi.applyTemplate(template.id, assignments, replaceExisting);
      await alert({
        title: tr("payroll.templateApplied"),
        message:
          tr("payroll.structuresCreated", { count: res.created.length }) +
          (res.skipped.length ? " " + tr("payroll.structuresSkipped", { count: res.skipped.length }) : ""),
        tone: res.skipped.length ? "danger" : "default",
      });
      await onApplied();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-[#212121]/40 backdrop-blur-sm">
      <Card padding="none" className="w-full max-w-3xl my-auto shadow-[0_24px_60px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E0E0E0]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-[18px] h-[18px]" />
            </span>
            <h3 className="text-[16px] font-bold text-[#212121]">{tr("payroll.applyQuoted", { name: template.name })}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {err && (
            <div className="flex items-start gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          )}
          <p className="text-[13px] text-[#757575]">
            {tr("payroll.applyModalIntro")}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={tr("payroll.defaultAnnualCtc")} htmlFor="apply-default-ctc">
              <Input id="apply-default-ctc" type="number" value={defaultCtc} onChange={(e) => setDefaultCtc(e.target.value)} />
            </Field>
            <Field label={tr("payroll.effectiveFrom")} htmlFor="apply-effective-from">
              <Input id="apply-effective-from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </Field>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-[4px] border border-[#E0E0E0]">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[#FAFAFA] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">
                <tr className="border-b border-[#E0E0E0]">
                  <th className="px-4 py-2.5 w-10" />
                  <th className="px-4 py-2.5">{tr("payroll.employee")}</th>
                  <th className="px-4 py-2.5 text-right">{tr("payroll.ctcOverride")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {employees.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-[#757575]">{tr("payroll.noEmployees")}</td></tr>
                )}
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FAFAFA]/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="accent-[#1976D2]" checked={rows[e.id]?.checked ?? false} onChange={() => toggle(e.id)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-[#212121]">{e.first_name} {e.last_name}</div>
                      {e.email && <div className="text-[12px] text-[#757575]">{e.email}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        type="number"
                        className={`w-36 ml-auto text-right ${jetbrainsMono.className}`}
                        placeholder={defaultCtc}
                        value={rows[e.id]?.ctc ?? ""}
                        onChange={(ev) => setRows((r) => ({ ...r, [e.id]: { ...r[e.id], ctc: ev.target.value } }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-[#424242]">
            <input type="checkbox" className="accent-[#1976D2]" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />
            <span>{tr("payroll.replaceExisting")}</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-[#E0E0E0] pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>{tr("common.cancel")}</Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy ? tr("payroll.applying") : tr("payroll.applyToEmployees", { count: selected.length || "" }).trim()}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function PreviewStat({ label, value, tone = "text-[#212121]", big = false }: { label: string; value: string; tone?: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{label}</div>
      <div className={`font-bold tabular-nums leading-tight break-words ${tone} ${jetbrainsMono.className} ${big ? "text-[15px]" : "text-[13px]"}`}>
        {value}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  checked,
  onChange,
  children,
}: {
  icon: string;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-[4px] border p-3 transition-colors ${checked ? "border-[#BBDEFB] bg-[#E3F2FD]/50" : "border-[#E0E0E0] bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] ${checked ? "bg-[#E3F2FD] text-[#1976D2]" : "bg-[#EEEEEE] text-[#757575]"}`}>
          <span className="material-symbols-rounded text-[18px]">{icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-[#212121]">{title}</div>
          <div className="text-[12px] text-[#757575]">{desc}</div>
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      {children && <div className="pl-11">{children}</div>}
    </div>
  );
}

function LineSection({
  title,
  rows,
  setRows,
  refCodesFor,
}: {
  title: string;
  rows: LineDraft[];
  setRows: (r: LineDraft[]) => void;
  refCodesFor: (rowIndex: number, rowCode: string) => string[];
}) {
  const { t: tr } = useI18n();
  const update = (i: number, patch: Partial<LineDraft>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-bold text-[#212121]">
          <Layers className="w-4 h-4 text-[#1976D2]" />
          {title}
        </span>
        <button
          type="button"
          onClick={() => setRows([...rows, emptyLine()])}
          className="inline-flex items-center gap-1 rounded-[4px] border border-[#E0E0E0] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#424242] hover:bg-[#F5F6F8] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> {tr("payroll.addLine")}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <p className="text-[12px] text-[#757575]">{tr("payroll.noLines")}</p>}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <Input className="col-span-2 h-10" placeholder={tr("payroll.codePlaceholder")} value={r.code} onChange={(e) => update(i, { code: e.target.value.toUpperCase() })} />
            <Input className="col-span-3 h-10" placeholder={tr("payroll.label")} value={r.label} onChange={(e) => update(i, { label: e.target.value })} />
            <Select className="col-span-2 h-10" value={r.type} onChange={(e) => update(i, { type: e.target.value as LineDraft["type"] })}>
              <option value="fixed">{tr("payroll.lineFixed")}</option>
              <option value="percent">{tr("payroll.linePercent")}</option>
              <option value="balance">{tr("payroll.lineBalanceCtc")}</option>
            </Select>
            {r.type === "fixed" ? (
              <Input className="col-span-4 h-10" type="number" placeholder={tr("payroll.amount")} value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} />
            ) : r.type === "balance" ? (
              <span className="col-span-4 self-center text-[12px] text-[#757575]">{tr("payroll.absorbsRemaining")}</span>
            ) : (
              <>
                <Input className="col-span-2 h-10" type="number" placeholder="%" value={r.percent} onChange={(e) => update(i, { percent: e.target.value })} />
                <Select className="col-span-2 h-10" value={r.percent_of} onChange={(e) => update(i, { percent_of: e.target.value })}>
                  <option value="">{tr("payroll.ofGross")}</option>
                  <option value="CTC">{tr("payroll.ofCtc")}</option>
                  {refCodesFor(i, r.code).map((c) => (
                    <option key={c} value={c}>{tr("payroll.ofCode", { code: c })}</option>
                  ))}
                </Select>
              </>
            )}
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="col-span-1 flex justify-center text-[#9E9E9E] hover:text-[#C62828] transition-colors"
              title={tr("payroll.removeLine")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
