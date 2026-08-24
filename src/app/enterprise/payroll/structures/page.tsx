"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import {
  payrollApi,
  settingsApi,
  estimateSalary,
  inr,
  type Employee,
  type MoneyLine,
  type PayFrequency,
  type ResolvedLine,
  type SalaryStructure,
  type StructurePreviewOut,
} from "@/utils/payroll/api";
import { Banner, Modal } from "@/components/payroll/ui";
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
import {
  Search,
  Filter,
  ChevronDown,
  Plus,
  Trash2,
  Calculator,
  ShieldCheck,
  PiggyBank,
  HeartPulse,
  Wallet,
  Landmark,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";

interface LineDraft {
  code: string;
  label: string;
  type: "fixed" | "percent" | "balance";
  amount: string;
  percent: string;
  percent_of: string;
}

const emptyLine = (): LineDraft => ({
  code: "",
  label: "",
  type: "fixed",
  amount: "",
  percent: "",
  percent_of: "",
});

function toMoneyLines(rows: LineDraft[]): MoneyLine[] {
  return rows
    .filter((r) => r.code.trim())
    .map((r) => {
      const base = { code: r.code.trim(), label: r.label.trim() || r.code.trim() };
      if (r.type === "balance") return { ...base, type: "balance" as const };
      if (r.type === "fixed") return { ...base, type: "fixed" as const, amount: Number(r.amount) || 0 };
      return {
        ...base,
        type: "percent" as const,
        percent: Number(r.percent) || 0,
        percent_of: r.percent_of || null,
      };
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

const selectCls =
  "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

export default function StructuresPage() {
  const { can } = useAuth();
    const { t: tr } = useI18n();
  const { confirm, alert } = useDialog();
  const canEdit = can("payroll:configure");
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statutoryFilter, setStatutoryFilter] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [ctc, setCtc] = useState("1200000");
  const [currency, setCurrency] = useState("INR");
  // The company's default currency (KRW/JPY/USD/INR…) — new structures start with it.
  const [orgCurrency, setOrgCurrency] = useState("INR");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("MONTHLY");
  const [hourlyRate, setHourlyRate] = useState("");
  // Local calendar date (en-CA → YYYY-MM-DD); toISOString() would give the UTC
  // date, which reads as "yesterday" for +TZ users late in the day.
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toLocaleDateString("en-CA"));
  const [earnings, setEarnings] = useState<LineDraft[]>([]);
  const [deductions, setDeductions] = useState<LineDraft[]>([]);
  const [lopDays, setLopDays] = useState("0");
  // Statutory toggles (Phase 1)
  const [pfEnabled, setPfEnabled] = useState(false);
  const [pfCap, setPfCap] = useState(true);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [ptEnabled, setPtEnabled] = useState(false);
  const [tdsEnabled, setTdsEnabled] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([payrollApi.listStructures(), payrollApi.listEmployees()]);
      setStructures(s);
      setEmployees(e);
      // Pick up the company's currency so new structures default to it (not INR).
      try {
        const org = await settingsApi.getOrganization();
        if (org?.currency) { setOrgCurrency(org.currency); setCurrency((c) => (c === "INR" ? org.currency : c)); }
      } catch { /* keep default */ }
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

  const empOf = (eid: string) => employees.find((x) => x.id === eid);
  const empName = (eid: string) => {
    const e = empOf(eid);
    return e ? `${e.first_name} ${e.last_name}`.trim() : tr("payroll.employeeShort", { id: eid.slice(0, 8) });
  };

  // Instant local estimate (manual lines only) — shown immediately while the
  // authoritative server preview (which also includes statutory + TDS) loads.
  const estimate = useMemo(
    () =>
      estimateSalary(
        toMoneyLines(earnings),
        toMoneyLines(deductions),
        Number(lopDays) || 0,
        undefined,
        Number(ctc) || 0,
        payFrequency
      ),
    [earnings, deductions, lopDays, ctc, payFrequency]
  );
  // Which codes a `percent … of X` line may reference, matching the engine's
  // resolution order (compute_payslip / estimateSalary):
  //  - Earnings resolve top-to-bottom with balance lines deferred to a last
  //    pass, so an earning percent-line can only reference an EARLIER,
  //    non-balance earning — a balance line or a line below always resolves to 0.
  //  - Deductions resolve after ALL earnings (incl. balance), so a deduction may
  //    reference any earning code.
  const earningRefCodesFor = (rowIndex: number, rowCode: string) =>
    earnings
      .slice(0, rowIndex)
      .filter((e) => e.type !== "balance" && e.code && e.code !== rowCode)
      .map((e) => e.code);
  const deductionRefCodesFor = (_rowIndex: number, rowCode: string) =>
    earnings.map((e) => e.code).filter((c) => c && c !== rowCode);

  // Authoritative live preview from the backend — same engine a payroll run
  // uses, so PF/ESI/PT/TDS deductions update in real time as toggles change.
  const [preview, setPreview] = useState<StructurePreviewOut | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewing(true);
    const handle = setTimeout(() => {
      payrollApi
        .previewStructure({
          employee_id: employeeId || null,
          ctc: Number(ctc) || 0,
          pay_frequency: payFrequency,
          components: toMoneyLines(earnings),
          default_deductions: toMoneyLines(deductions),
          lop_days: Number(lopDays) || 0,
          pf_enabled: pfEnabled,
          pf_cap_at_ceiling: pfCap,
          esi_enabled: esiEnabled,
          pt_enabled: ptEnabled,
          tds_enabled: tdsEnabled,
        })
        .then((res) => {
          if (!cancelled) setPreview(res);
        })
        .catch(() => {
          if (!cancelled) setPreview(null);
        })
        .finally(() => {
          if (!cancelled) setPreviewing(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, employeeId, ctc, payFrequency, earnings, deductions, lopDays, pfEnabled, pfCap, esiEnabled, ptEnabled, tdsEnabled]);

  // Prefer the server figures once available; fall back to the local estimate.
  const gross = preview ? Number(preview.gross_earnings) : estimate.gross;
  const totalDeductions = preview ? Number(preview.total_deductions) : estimate.totalDeductions;
  const net = preview ? Number(preview.net_pay) : estimate.net;
  const deductionLines: ResolvedLine[] = preview
    ? (preview.deductions ?? [])
    : estimate.deductions;

  function openCreate() {
    setEditingId(null);
    setEmployeeId(employees[0]?.id ?? "");
    setCtc("1200000");
    setCurrency(orgCurrency);
    setPayFrequency("MONTHLY");
    setHourlyRate("");
    setEffectiveFrom(new Date().toLocaleDateString("en-CA"));
    setEarnings([
      { ...emptyLine(), code: "BASIC", label: "Basic", type: "fixed", amount: "40000" },
      { ...emptyLine(), code: "HRA", label: "HRA", type: "percent", percent: "40", percent_of: "BASIC" },
    ]);
    setDeductions([]);
    setLopDays("0");
    setPfEnabled(false);
    setPfCap(true);
    setEsiEnabled(false);
    setPtEnabled(false);
    setTdsEnabled(false);
    setFormErr(null);
    setOpen(true);
  }

  function openEdit(s: SalaryStructure) {
    setEditingId(s.id);
    setEmployeeId(s.employee_id);
    setCtc(String(s.ctc));
    setCurrency(s.currency);
    setPayFrequency(s.pay_frequency);
    setHourlyRate(s.hourly_rate != null ? String(s.hourly_rate) : "");
    setEffectiveFrom(s.effective_from);
    setEarnings(fromMoneyLines(s.components));
    setDeductions(fromMoneyLines(s.default_deductions));
    setLopDays(String(s.lop_days ?? 0));
    setPfEnabled(s.pf_enabled ?? false);
    setPfCap(s.pf_cap_at_ceiling ?? true);
    setEsiEnabled(s.esi_enabled ?? false);
    setPtEnabled(s.pt_enabled ?? false);
    setTdsEnabled(s.tds_enabled ?? false);
    setFormErr(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!employeeId) {
      setFormErr(tr("payroll.selectAnEmployee"));
      return;
    }
    const body = {
      ctc: Number(ctc),
      currency,
      pay_frequency: payFrequency,
      hourly_rate: payFrequency === "HOURLY" ? Number(hourlyRate) || 0 : null,
      effective_from: effectiveFrom,
      components: toMoneyLines(earnings),
      default_deductions: toMoneyLines(deductions),
      lop_days: Number(lopDays) || 0,
      is_active: true,
      pf_enabled: pfEnabled,
      pf_cap_at_ceiling: pfCap,
      esi_enabled: esiEnabled,
      pt_enabled: ptEnabled,
      tds_enabled: tdsEnabled,
    };
    setSaving(true);
    try {
      if (editingId) {
        await payrollApi.updateStructure(editingId, body);
      } else {
        await payrollApi.createStructure({ ...body, employee_id: employeeId });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormErr((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: tr("payroll.deleteStructureTitle"),
      message: tr("payroll.deleteStructureConfirm"),
      confirmLabel: tr("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    try {
      await payrollApi.deleteStructure(id);
      await load();
    } catch (err) {
      await alert({ message: (err as Error).message, tone: "danger" });
    }
  }

  const filteredStructures = structures.filter((s) => {
    const e = empOf(s.employee_id);
    const haystack = `${empName(s.employee_id)} ${e?.email ?? ""}`.toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesStatutory =
      statutoryFilter === "ALL" ||
      (statutoryFilter === "EPF" && s.pf_enabled) ||
      (statutoryFilter === "ESI" && s.esi_enabled) ||
      (statutoryFilter === "PT" && s.pt_enabled) ||
      (statutoryFilter === "TDS" && s.tds_enabled) ||
      (statutoryFilter === "NONE" &&
        !s.pf_enabled &&
        !s.esi_enabled &&
        !s.pt_enabled &&
        !s.tds_enabled);
    return matchesSearch && matchesStatutory;
  });

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.salaryStructures")}
        subtitle={tr("payroll.salaryStructuresSubtitle")}
        help={<><p>{tr("payroll.structuresHelp1")}</p><p>{tr("payroll.structuresHelp2")}</p></>}
        actions={
          canEdit && (
            <Button size="sm" icon="add" onClick={openCreate}>
              {tr("payroll.addStructure")}
            </Button>
          )
        }
      />

      {error && <Banner>{error}</Banner>}

      {/* Stat cards */}
      {!loading && structures.length > 0 && (
        <StatGrid>
          <StatCard
            label={tr("payroll.structuresLabel")}
            value={structures.length}
            icon="group"
            gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
            glow="rgba(91,83,224,0.25)"
          />
          <StatCard
            label={tr("payroll.epfEnabled")}
            value={structures.filter((s) => s.pf_enabled).length}
            icon="savings"
            gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
            glow="rgba(14,138,110,0.25)"
          />
          <StatCard
            label={tr("payroll.esiEnabled")}
            value={structures.filter((s) => s.esi_enabled).length}
            icon="health_and_safety"
            gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
            glow="rgba(53,89,199,0.25)"
          />
          <StatCard
            label={tr("payroll.tdsEnabled")}
            value={structures.filter((s) => s.tds_enabled).length}
            icon="account_balance"
            gradient="linear-gradient(135deg,#FBBF24,#D97706)"
            glow="rgba(217,119,6,0.25)"
          />
        </StatGrid>
      )}

      {/* Toolbar: search + filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("payroll.searchByEmployee")}
            className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
          />
        </div>
        <div className="relative flex-1 md:flex-none">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
          <select
            value={statutoryFilter}
            onChange={(e) => setStatutoryFilter(e.target.value)}
            className={`${selectCls} w-full md:min-w-[170px]`}
          >
            <option value="ALL">{tr("payroll.allStructures")}</option>
            <option value="EPF">{tr("payroll.epfEnabled")}</option>
            <option value="ESI">{tr("payroll.esiEnabled")}</option>
            <option value="PT">{tr("payroll.ptEnabled")}</option>
            <option value="TDS">{tr("payroll.tdsEnabled")}</option>
            <option value="NONE">{tr("payroll.noStatutory")}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
        </div>
      </div>

      {/* Structures list */}
      <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : filteredStructures.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
              <SlidersHorizontal className="w-8 h-8 text-[#C7CCD4]" />
            </div>
            {structures.length === 0 ? (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">
                  {tr("payroll.noStructuresYet")}
                </h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                  {tr("payroll.noStructuresYetDesc")}
                </p>
                {canEdit && (
                  <Button icon="add" onClick={openCreate}>
                    {tr("payroll.addFirstStructure")}
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">
                  {tr("payroll.noStructuresMatch")}
                </h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                  {tr("payroll.noStructuresMatchDesc")}
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setStatutoryFilter("ALL");
                  }}
                >
                  {tr("payroll.clearAllFilters")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div
              className={`hidden md:grid ${canEdit ? "grid-cols-[2.4fr_1.2fr_1.4fr_1fr_120px]" : "grid-cols-[2.4fr_1.2fr_1.4fr_1fr]"} gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.employee")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.ctcAnnual")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.statutory")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.effective")}</span>
              {canEdit && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.actions")}</span>
              )}
            </div>

            <div className="divide-y divide-[#F0F0F1]">
              {filteredStructures.map((s) => {
                const e = empOf(s.employee_id);
                const initials = e
                  ? `${e.first_name?.[0] ?? ""}${e.last_name?.[0] ?? ""}`.toUpperCase()
                  : "—";
                const hasStatutory = s.pf_enabled || s.esi_enabled || s.pt_enabled || s.tds_enabled;
                return (
                  <div
                    key={s.id}
                    className={`grid grid-cols-[1fr_auto] ${canEdit ? "md:grid-cols-[2.4fr_1.2fr_1.4fr_1fr_120px]" : "md:grid-cols-[2.4fr_1.2fr_1.4fr_1fr]"} gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group`}
                  >
                    {/* Employee */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0 text-[12px] font-extrabold uppercase">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#15171C] truncate">{empName(s.employee_id)}</div>
                        {e?.email && <div className="truncate text-[12px] text-[#8A929E]">{e.email}</div>}
                        {/* mobile-only meta */}
                        <div className="flex items-center gap-2 mt-1 md:hidden">
                          <span className={`text-[12.5px] font-bold text-[#15171C] ${jetbrainsMono.className}`}>
                            {inr(s.ctc, s.currency)}
                          </span>
                          <span className="text-[11px] text-[#8A929E]">{s.effective_from}</span>
                        </div>
                      </div>
                    </div>

                    {/* CTC (desktop) */}
                    <div className="hidden md:block text-right">
                      <div className={`text-[14px] font-bold text-[#15171C] ${jetbrainsMono.className}`}>
                        {inr(s.ctc, s.currency)}
                      </div>
                      <div className="text-[11px] text-[#8A929E] lowercase">{s.pay_frequency.toLowerCase()}</div>
                    </div>

                    {/* Statutory */}
                    <div className="hidden md:flex flex-wrap items-center gap-1.5">
                      {s.pf_enabled && <Badge tone="indigo">EPF</Badge>}
                      {s.esi_enabled && <Badge tone="indigo">ESI</Badge>}
                      {s.pt_enabled && <Badge tone="indigo">PT</Badge>}
                      {s.tds_enabled && <Badge tone="indigo">TDS</Badge>}
                      {!hasStatutory && <Badge tone="neutral">{tr("payroll.none")}</Badge>}
                    </div>

                    {/* Effective (desktop) */}
                    <div className={`hidden md:block text-[13px] text-[#374151] ${jetbrainsMono.className}`}>
                      {s.effective_from}
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-1 justify-end">
                        {/* mobile statutory chips */}
                        <div className="md:hidden flex flex-wrap gap-1 mr-1">
                          {s.pf_enabled && <Badge tone="indigo">EPF</Badge>}
                          {s.esi_enabled && <Badge tone="indigo">ESI</Badge>}
                          {s.pt_enabled && <Badge tone="indigo">PT</Badge>}
                          {s.tds_enabled && <Badge tone="indigo">TDS</Badge>}
                          {!hasStatutory && <Badge tone="neutral">{tr("payroll.none")}</Badge>}
                        </div>
                        <button
                          onClick={() => openEdit(s)}
                          className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                          title={tr("payroll.editStructure")}
                        >
                          <span className="material-symbols-rounded text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => remove(s.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                          title={tr("payroll.deleteStructure")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {open && (
        <Modal
          title={editingId ? tr("payroll.editSalaryStructure") : tr("payroll.newSalaryStructure")}
          onClose={() => setOpen(false)}
          width="max-w-[1600px]"
        >
          <form onSubmit={save} className="flex flex-col gap-6">
            {formErr && <Banner>{formErr}</Banner>}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              {/* Left column — the editable structure */}
              <div className="flex min-w-0 flex-col gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={tr("payroll.employee")}>
                    <Select
                      value={employeeId}
                      disabled={!!editingId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    >
                      {employees.length === 0 && <option value="">{tr("payroll.noEmployeesAddFirst")}</option>}
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.first_name} {e.last_name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={tr("payroll.annualCtc")}>
                    <Input
                      type="number"
                      className={jetbrainsMono.className}
                      value={ctc}
                      onChange={(e) => setCtc(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={tr("payroll.currency")}>
                    <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                  </Field>
                  <Field label={tr("payroll.payFrequency")}>
                    <Select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}>
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="HOURLY">HOURLY</option>
                    </Select>
                  </Field>
                  <Field label={tr("payroll.effectiveFrom")}>
                    <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
                  </Field>
                  {payFrequency === "HOURLY" && (
                    <Field
                      label={tr("payroll.hourlyRate")}
                      hint={tr("payroll.hourlyRateHint")}
                    >
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className={jetbrainsMono.className}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder={tr("payroll.hourlyRateExample")}
                      />
                    </Field>
                  )}
                </div>

                <LineSection
                  title={tr("payroll.earnings")}
                  rows={earnings}
                  setRows={setEarnings}
                  refCodesFor={earningRefCodesFor}
                />
                <LineSection
                  title={tr("payroll.deductions")}
                  rows={deductions}
                  setRows={setDeductions}
                  refCodesFor={deductionRefCodesFor}
                  footer={
                    <Field
                      label={tr("payroll.lossOfPay")}
                      className="border-t border-[#E8EAED] pt-3"
                      hint={tr("payroll.lossOfPayHint")}
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        className={`w-40 ${jetbrainsMono.className}`}
                        value={lopDays}
                        onChange={(e) => setLopDays(e.target.value)}
                      />
                    </Field>
                  }
                />

                {/* Statutory compliance (Phase 1: PF / ESI / PT / TDS) */}
                <Card padding="sm" className="bg-[#FAFBFC]">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-[18px] h-[18px] text-[#5B53E0]" />
                    <span className="text-[14px] font-bold text-[#15171C]">{tr("payroll.statutoryCompliance")}</span>
                    <span className="ml-auto text-[11.5px] text-[#8A929E]">{tr("payroll.autoComputedWhenOn")}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <ToggleRow
                      Icon={PiggyBank}
                      title={tr("payroll.providentFund")}
                      desc={tr("payroll.pfDescStructures")}
                      checked={pfEnabled}
                      onChange={setPfEnabled}
                    >
                      {pfEnabled && (
                        <label className="mt-2 flex items-center gap-2 text-[12px] text-[#8A929E]">
                          <input type="checkbox" checked={pfCap} onChange={(e) => setPfCap(e.target.checked)} />
                          <span>{tr("payroll.capPfWageStatutory")}</span>
                        </label>
                      )}
                    </ToggleRow>
                    <ToggleRow
                      Icon={HeartPulse}
                      title={tr("payroll.esi")}
                      desc={tr("payroll.esiDescStructures")}
                      checked={esiEnabled}
                      onChange={setEsiEnabled}
                    />
                    <ToggleRow
                      Icon={Wallet}
                      title={tr("payroll.professionalTax")}
                      desc={tr("payroll.ptDescStructures")}
                      checked={ptEnabled}
                      onChange={setPtEnabled}
                    />
                    <ToggleRow
                      Icon={Landmark}
                      title={tr("payroll.incomeTaxTds")}
                      desc={tr("payroll.tdsDescStructures")}
                      checked={tdsEnabled}
                      onChange={setTdsEnabled}
                    >
                      {tdsEnabled && (
                        <p className="mt-2 text-[12px] text-[#8A929E]">
                          {tr("payroll.tdsRegimeNote")}
                        </p>
                      )}
                    </ToggleRow>
                  </div>
                  <p className="mt-3 text-[12px] text-[#8A929E]">
                    {tr("payroll.statutoryAmountsNote")}
                  </p>
                </Card>
              </div>

              {/* Right column — live estimate (server-computed; sticky) */}
              <div className="lg:sticky lg:top-0 lg:self-start">
                <div className="overflow-hidden rounded-[14px] border border-[#DAD7F6] bg-gradient-to-br from-[#ECEBFB] to-white">
                  <div className="flex items-center justify-between border-b border-[#E8EAED] px-4 py-2.5">
                    <span className="flex items-center gap-2 text-[13.5px] font-bold text-[#15171C]">
                      <Calculator className="w-[16px] h-[16px] text-[#5B53E0]" />
                      {tr("payroll.estimatedMonthlySalary")}
                      {previewing && <span className="text-[11.5px] font-normal text-[#8A929E]">{tr("payroll.updating")}</span>}
                    </span>
                    <span className="text-[11.5px] text-[#8A929E]">
                      {Number(lopDays) > 0 ? tr("payroll.afterLopDays", { count: Number(lopDays) }) : tr("payroll.fullMonthNoLop")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-4">
                    <Stat label={tr("payroll.gross")} value={inr(gross, currency)} />
                    <Stat label={tr("payroll.deductions")} value={`- ${inr(totalDeductions, currency)}`} tone="text-[#C0383C]" />
                    <Stat label={tr("payroll.netPay")} value={inr(net, currency)} tone="text-[#0E8A6E]" big />
                  </div>
                  {deductionLines.length > 0 && (
                    <div className="border-t border-[#E8EAED] px-4 py-3">
                      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                        {tr("payroll.deductionBreakdown")}
                      </div>
                      <div className="flex flex-col gap-1">
                        {deductionLines.map((l) => (
                          <div key={l.code} className="flex justify-between text-[13px]">
                            <span className="text-[#8A929E]">{l.label}</span>
                            <span className={`font-semibold text-[#C0383C] ${jetbrainsMono.className}`}>
                              - {inr(l.amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!preview && !previewing && (
                    <p className="px-4 pb-3 text-[12px] text-[#8A929E]">
                      {tr("payroll.localEstimateNote")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#E8EAED] pt-4">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="px-8">
                {tr("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="px-8">
                {saving ? tr("payroll.saving") : editingId ? tr("payroll.updateStructure") : tr("payroll.saveStructure")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "text-[#15171C]", big = false }: { label: string; value: string; tone?: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{label}</div>
      <div
        className={`font-bold leading-tight break-words ${tone} ${jetbrainsMono.className} ${big ? "text-[16px]" : "text-[14px]"}`}
      >
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
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  Icon,
  title,
  desc,
  checked,
  onChange,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[10px] border p-3 transition-colors ${
        checked ? "border-[#DAD7F6] bg-[#ECEBFB]/50" : "border-[#E8EAED] bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
            checked ? "bg-[#ECEBFB] text-[#5B53E0]" : "bg-[#F1F2F5] text-[#8A929E]"
          }`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-[#15171C]">{title}</div>
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
  footer,
}: {
  title: string;
  rows: LineDraft[];
  setRows: (r: LineDraft[]) => void;
  refCodesFor: (rowIndex: number, rowCode: string) => string[];
  footer?: React.ReactNode;
}) {
  const { t: tr } = useI18n();
  const update = (i: number, patch: Partial<LineDraft>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <Card padding="sm" className="bg-[#FAFBFC]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-bold text-[#15171C]">{title}</span>
        <button
          type="button"
          onClick={() => setRows([...rows, emptyLine()])}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E1E4E8] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#374151] hover:bg-[#F4F5F7] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> {tr("payroll.addLine")}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <p className="text-[12px] text-[#8A929E]">{tr("payroll.noLines")}</p>}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <Input
              className="col-span-2 h-10 text-[13px]"
              placeholder={tr("payroll.codePlaceholder")}
              value={r.code}
              onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
            />
            <Input
              className="col-span-3 h-10 text-[13px]"
              placeholder={tr("payroll.label")}
              value={r.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <Select
              className="col-span-2 h-10 text-[13px]"
              value={r.type}
              onChange={(e) => update(i, { type: e.target.value as LineDraft["type"] })}
            >
              <option value="fixed">{tr("payroll.lineFixed")}</option>
              <option value="percent">{tr("payroll.linePercent")}</option>
              <option value="balance">{tr("payroll.lineBalanceCtc")}</option>
            </Select>
            {r.type === "fixed" ? (
              <Input
                className={`col-span-4 h-10 text-[13px] ${jetbrainsMono.className}`}
                type="number"
                placeholder={tr("payroll.amount")}
                value={r.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
              />
            ) : r.type === "balance" ? (
              <span className="col-span-4 self-center text-[12px] text-[#8A929E]">
                {tr("payroll.absorbsRemainingAfter")}
              </span>
            ) : (
              <>
                <Input
                  className={`col-span-2 h-10 text-[13px] ${jetbrainsMono.className}`}
                  type="number"
                  placeholder="%"
                  value={r.percent}
                  onChange={(e) => update(i, { percent: e.target.value })}
                />
                <Select
                  className="col-span-2 h-10 text-[13px]"
                  value={r.percent_of}
                  onChange={(e) => update(i, { percent_of: e.target.value })}
                >
                  <option value="">{tr("payroll.ofGross")}</option>
                  <option value="CTC">{tr("payroll.ofCtc")}</option>
                  {refCodesFor(i, r.code).map((c) => (
                    <option key={c} value={c}>
                      {tr("payroll.ofCode", { code: c })}
                    </option>
                  ))}
                </Select>
              </>
            )}
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="col-span-1 flex justify-center text-[#9AA3AF] hover:text-[#C0383C] transition-colors"
              title={tr("payroll.removeLine")}
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        ))}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
