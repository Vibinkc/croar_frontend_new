"use client";

import { useEffect, useMemo, useState } from "react";
import {
  payrollApi,
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
  "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

export default function TemplatesPage() {
  const { can } = useAuth();
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
    setCurrency("INR");
    setPayFrequency("MONTHLY");
    setEarnings([
      { ...emptyLine(), code: "BASIC", label: "Basic", type: "percent", percent: "40", percent_of: "CTC" },
      { ...emptyLine(), code: "HRA", label: "HRA", type: "percent", percent: "50", percent_of: "BASIC" },
      { ...emptyLine(), code: "SPECIAL", label: "Special Allowance", type: "balance" },
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
      setFormErr("Give the template a name.");
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
      title: "Delete template",
      message: `Delete "${t.name}"? Structures already created from it are unaffected.`,
      confirmLabel: "Delete",
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
    { label: "Templates", value: templates.length, icon: "content_copy", gradient: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
    { label: "With Statutory", value: templates.filter(hasStatutory).length, icon: "verified_user", gradient: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
    { label: "Employees", value: employees.length, icon: "group", gradient: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
    { label: "Avg. Components", value: templates.length ? Math.round(templates.reduce((a, t) => a + t.components.length, 0) / templates.length) : "—", icon: "layers", gradient: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" },
  ];

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title="Salary Templates"
        subtitle="Reusable, CTC-driven packages. Define the rules once, apply to many employees."
        help={<><p>Create reusable salary templates — earnings, deductions and statutory items.</p><p>Apply a template to employees from Salary Structures.</p></>}
        actions={
          canEdit && (
            <Button icon="add" onClick={openCreate}>
              New Template
            </Button>
          )
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#F7D7D7] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name, description or code…"
            className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
          />
        </div>
        <div className="relative flex-1 md:flex-none">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
          <select
            value={statutoryFilter}
            onChange={(e) => setStatutoryFilter(e.target.value as "ALL" | "WITH" | "WITHOUT")}
            className={`${selectCls} w-full md:min-w-[170px]`}
          >
            <option value="ALL">Any statutory</option>
            <option value="WITH">With statutory</option>
            <option value="WITHOUT">Without statutory</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
        </div>
      </div>

      {/* Templates list */}
      <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
              <Copy className="w-8 h-8 text-[#C7CCD4]" />
            </div>
            {templates.length === 0 ? (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">No salary templates yet</h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                  Create a template (e.g. &ldquo;Engineer L1&rdquo;) with percentage-of-CTC rules, then apply it to employees at their own CTC.
                </p>
                {canEdit && (
                  <Button icon="add" onClick={openCreate}>
                    Create your first template
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">No templates match your filters</h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">Try adjusting your search or filter to find what you&apos;re looking for.</p>
                <Button onClick={() => { setSearchQuery(""); setStatutoryFilter("ALL"); }}>Clear filters</Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2.4fr_1.6fr_1.2fr_200px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Template</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Earnings</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Statutory</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
            </div>

            <div className="divide-y divide-[#F0F0F1]">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-1 md:grid-cols-[2.4fr_1.6fr_1.2fr_200px] gap-x-4 gap-y-3 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                >
                  {/* Template */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                      <Copy className="w-[17px] h-[17px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[#15171C] truncate">{t.name}</div>
                      {t.description && <div className="text-[12px] text-[#8A929E] truncate">{t.description}</div>}
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
                      <span className="text-[12px] text-[#9AA3AF]">None</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-start md:justify-end gap-2">
                    {canEdit && (
                      <Button size="sm" onClick={() => setApplyFor(t)}>Apply</Button>
                    )}
                    {canEdit && (
                      <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => remove(t)}
                        title="Delete template"
                        className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-[#15171C]/40 backdrop-blur-sm">
          <Card padding="none" className="w-full max-w-6xl my-auto shadow-[0_24px_60px_rgba(15,23,42,0.22)] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E8EAED]">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                  <Copy className="w-[18px] h-[18px]" />
                </span>
                <h3 className="text-[16px] font-bold text-[#15171C]">{editingId ? "Edit Template" : "New Template"}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-[8px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={save} className="flex flex-col gap-6 p-6">
              {formErr && (
                <div className="flex items-start gap-2.5 rounded-[12px] border border-[#F7D7D7] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formErr}</span>
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-w-0 flex-col gap-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Template Name" htmlFor="tpl-name" required>
                      <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineer L1" required />
                    </Field>
                    <Field label="Pay Frequency" htmlFor="tpl-freq">
                      <Select id="tpl-freq" value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}>
                        <option value="MONTHLY">MONTHLY</option>
                        <option value="WEEKLY">WEEKLY</option>
                      </Select>
                    </Field>
                    <Field label="Description (optional)" htmlFor="tpl-desc" className="sm:col-span-2">
                      <Input id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Standard package for L1 engineers" />
                    </Field>
                  </div>

                  <LineSection title="Earnings" rows={earnings} setRows={setEarnings} refCodesFor={earningRefCodesFor} />
                  <LineSection title="Deductions" rows={deductions} setRows={setDeductions} refCodesFor={deductionRefCodesFor} />

                  <div className="rounded-[14px] border border-[#E8EAED] bg-[#F7F8FA]/60 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-[18px] h-[18px] text-[#5B53E0]" />
                      <span className="text-[14px] font-bold text-[#15171C]">Statutory Compliance</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <ToggleRow icon="savings" title="Provident Fund (EPF)" desc="12% employee + employer." checked={pfEnabled} onChange={setPfEnabled}>
                        {pfEnabled && (
                          <label className="mt-2 flex items-center gap-2 text-[12px] text-[#8A929E]">
                            <input type="checkbox" className="accent-[#5B53E0]" checked={pfCap} onChange={(e) => setPfCap(e.target.checked)} />
                            <span>Cap PF wage at the ₹15,000 ceiling</span>
                          </label>
                        )}
                      </ToggleRow>
                      <ToggleRow icon="health_and_safety" title="ESI" desc="When gross ≤ ₹21,000." checked={esiEnabled} onChange={setEsiEnabled} />
                      <ToggleRow icon="account_balance_wallet" title="Professional Tax" desc="By the employee's state slab." checked={ptEnabled} onChange={setPtEnabled} />
                      <ToggleRow icon="account_balance" title="Income Tax (TDS)" desc="Estimated from the IT declaration." checked={tdsEnabled} onChange={setTdsEnabled} />
                    </div>
                  </div>
                </div>

                {/* Live preview at a sample CTC */}
                <div className="lg:sticky lg:top-0 lg:self-start">
                  <div className="overflow-hidden rounded-[14px] border border-[#DAD7F6] bg-gradient-to-br from-[#ECEBFB] to-white">
                    <div className="border-b border-[#E8EAED] px-4 py-3">
                      <span className="flex items-center gap-2 text-[13.5px] font-bold text-[#15171C]">
                        <Calculator className="w-4 h-4 text-[#5B53E0]" />
                        Preview at sample CTC
                        {previewing && <span className="text-[11px] font-medium text-[#8A929E]">updating…</span>}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <Field label="Sample Annual CTC" htmlFor="tpl-sample-ctc">
                        <Input id="tpl-sample-ctc" type="number" value={sampleCtc} onChange={(e) => setSampleCtc(e.target.value)} />
                      </Field>
                      {!ctcDriven && (
                        <p className="mt-1.5 text-[12px] text-[#D97706]">
                          No earning line is anchored to CTC, so changing this won&apos;t affect the numbers. Add a{" "}
                          <strong>Balance (CTC)</strong> line or a <strong>Percent … of CTC</strong> line to make the package CTC-driven.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 px-4 pb-3">
                      <PreviewStat label="Gross" value={inr(gross, currency)} />
                      <PreviewStat label="Deductions" value={`- ${inr(totalDeductions, currency)}`} tone="text-[#C0383C]" />
                      <PreviewStat label="Net" value={inr(net, currency)} tone="text-[#0E8A6E]" big />
                    </div>
                    {earningLines.length > 0 && (
                      <div className="border-t border-[#E8EAED] px-4 py-3">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Earnings breakdown</div>
                        <div className="flex flex-col gap-1">
                          {earningLines.map((l) => (
                            <div key={l.code} className="flex justify-between text-[13px]">
                              <span className="text-[#8A929E]">{l.label}</span>
                              <span className={`font-medium text-[#15171C] ${jetbrainsMono.className}`}>{inr(l.amount, currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {deductionLines.length > 0 && (
                      <div className="border-t border-[#E8EAED] px-4 py-3">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Deduction breakdown</div>
                        <div className="flex flex-col gap-1">
                          {deductionLines.map((l) => (
                            <div key={l.code} className="flex justify-between text-[13px]">
                              <span className="text-[#8A929E]">{l.label}</span>
                              <span className={`font-medium text-[#C0383C] ${jetbrainsMono.className}`}>- {inr(l.amount, currency)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E8EAED] pt-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update Template" : "Save Template"}
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
      setErr("Select at least one employee.");
      return;
    }
    const assignments: TemplateAssignment[] = selected.map((e) => ({
      employee_id: e.id,
      ctc: Number(rows[e.id].ctc || defaultCtc) || 0,
      effective_from: effectiveFrom,
    }));
    if (assignments.some((a) => a.ctc <= 0)) {
      setErr("Every selected employee needs a CTC greater than zero.");
      return;
    }
    setBusy(true);
    try {
      const res = await payrollApi.applyTemplate(template.id, assignments, replaceExisting);
      await alert({
        title: "Template applied",
        message:
          `${res.created.length} structure(s) created.` +
          (res.skipped.length ? ` ${res.skipped.length} skipped (already configured).` : ""),
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-[#15171C]/40 backdrop-blur-sm">
      <Card padding="none" className="w-full max-w-3xl my-auto shadow-[0_24px_60px_rgba(15,23,42,0.22)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E8EAED]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-[18px] h-[18px]" />
            </span>
            <h3 className="text-[16px] font-bold text-[#15171C]">Apply &ldquo;{template.name}&rdquo;</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {err && (
            <div className="flex items-start gap-2.5 rounded-[12px] border border-[#F7D7D7] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          )}
          <p className="text-[13px] text-[#8A929E]">
            Each selected employee gets a salary structure generated from this template, scaled to their own CTC. Leave an employee&apos;s CTC blank to use the default.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Default Annual CTC" htmlFor="apply-default-ctc">
              <Input id="apply-default-ctc" type="number" value={defaultCtc} onChange={(e) => setDefaultCtc(e.target.value)} />
            </Field>
            <Field label="Effective From" htmlFor="apply-effective-from">
              <Input id="apply-effective-from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </Field>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-[12px] border border-[#E8EAED]">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[#F7F8FA] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                <tr className="border-b border-[#E8EAED]">
                  <th className="px-4 py-2.5 w-10" />
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5 text-right">CTC (override)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F1]">
                {employees.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-[#8A929E]">No employees.</td></tr>
                )}
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="accent-[#5B53E0]" checked={rows[e.id]?.checked ?? false} onChange={() => toggle(e.id)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-[#15171C]">{e.first_name} {e.last_name}</div>
                      {e.email && <div className="text-[12px] text-[#8A929E]">{e.email}</div>}
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

          <label className="flex items-center gap-2 text-[13px] text-[#374151]">
            <input type="checkbox" className="accent-[#5B53E0]" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />
            <span>Replace an existing active structure (otherwise that employee is skipped)</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-[#E8EAED] pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy ? "Applying…" : `Apply to ${selected.length || ""} employee${selected.length === 1 ? "" : "s"}`.trim()}
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
function PreviewStat({ label, value, tone = "text-[#15171C]", big = false }: { label: string; value: string; tone?: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{label}</div>
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
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"}`}
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
    <div className={`rounded-[10px] border p-3 transition-colors ${checked ? "border-[#DAD7F6] bg-[#ECEBFB]/50" : "border-[#E8EAED] bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] ${checked ? "bg-[#ECEBFB] text-[#5B53E0]" : "bg-[#F1F2F5] text-[#8A929E]"}`}>
          <span className="material-symbols-rounded text-[18px]">{icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-[#15171C]">{title}</div>
          <div className="text-[12px] text-[#8A929E]">{desc}</div>
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
  const update = (i: number, patch: Partial<LineDraft>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="rounded-[14px] border border-[#E8EAED] bg-[#F7F8FA]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-bold text-[#15171C]">
          <Layers className="w-4 h-4 text-[#5B53E0]" />
          {title}
        </span>
        <button
          type="button"
          onClick={() => setRows([...rows, emptyLine()])}
          className="inline-flex items-center gap-1 rounded-[8px] border border-[#E1E4E8] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#374151] hover:bg-[#F4F5F7] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add line
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <p className="text-[12px] text-[#8A929E]">No lines.</p>}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <Input className="col-span-2 h-10" placeholder="CODE" value={r.code} onChange={(e) => update(i, { code: e.target.value.toUpperCase() })} />
            <Input className="col-span-3 h-10" placeholder="Label" value={r.label} onChange={(e) => update(i, { label: e.target.value })} />
            <Select className="col-span-2 h-10" value={r.type} onChange={(e) => update(i, { type: e.target.value as LineDraft["type"] })}>
              <option value="fixed">Fixed</option>
              <option value="percent">Percent</option>
              <option value="balance">Balance (CTC)</option>
            </Select>
            {r.type === "fixed" ? (
              <Input className="col-span-4 h-10" type="number" placeholder="Amount" value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} />
            ) : r.type === "balance" ? (
              <span className="col-span-4 self-center text-[12px] text-[#8A929E]">Absorbs the remaining CTC.</span>
            ) : (
              <>
                <Input className="col-span-2 h-10" type="number" placeholder="%" value={r.percent} onChange={(e) => update(i, { percent: e.target.value })} />
                <Select className="col-span-2 h-10" value={r.percent_of} onChange={(e) => update(i, { percent_of: e.target.value })}>
                  <option value="">of gross</option>
                  <option value="CTC">of CTC</option>
                  {refCodesFor(i, r.code).map((c) => (
                    <option key={c} value={c}>of {c}</option>
                  ))}
                </Select>
              </>
            )}
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="col-span-1 flex justify-center text-[#9AA3AF] hover:text-[#C0383C] transition-colors"
              title="Remove line"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
