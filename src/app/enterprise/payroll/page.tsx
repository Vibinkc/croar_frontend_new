"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import {
  payrollApi,
  settingsApi,
  type Employee,
  type PayrollCycle,
  type SalaryStructure,
  inr,
} from "@/utils/payroll/api";
import { Banner, Modal } from "@/components/payroll/ui";
import { Money } from "@/components/payroll/Money";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";
import {
  Search,
  Filter,
  ChevronDown,
  CalendarRange,
} from "lucide-react";
import {
  Button,
  Badge,
  StatGrid,
  StatCard,
  PageHeader,
  jetbrainsMono,
} from "@/components/ds";

const CYCLE_TONE: Record<string, "neutral" | "info" | "success" | "indigo" | "danger"> = {
  DRAFT: "neutral",
  PROCESSING: "info",
  APPROVED: "success",
  PAID: "indigo",
  CANCELLED: "danger",
};

export default function PayrollHome() {
  const { can } = useAuth();
    const { t: tr } = useI18n();
  const { confirm, alert } = useDialog();
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgCurrency, setOrgCurrency] = useState("INR");

  // Presentation-only list view state (search + status filter).
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    period_start: "",
    period_end: "",
    pay_date: "",
    notes: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [c, e, s, org] = await Promise.all([
        payrollApi.listCycles(),
        payrollApi.listEmployees(),
        payrollApi.listStructures(),
        settingsApi.getOrganization().catch(() => null),
      ]);
      setCycles(c);
      setEmployees(e);
      setStructures(s);
      if (org?.currency) setOrgCurrency(org.currency);
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

  const configuredIds = useMemo(
    () => new Set(structures.filter((s) => s.is_active).map((s) => s.employee_id)),
    [structures]
  );
  const missing = employees.filter((e) => !configuredIds.has(e.id)).length;
  const current = cycles.find((c) => c.status !== "PAID" && c.status !== "CANCELLED") ?? cycles[0];

  // Presentation-only filtered view of the cycles list.
  const visibleCycles = cycles.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${c.period_start} ${c.period_end}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openModal() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${y}-${pad(m + 1)}-01`;
    const endDate = new Date(y, m + 1, 0);
    const end = `${y}-${pad(m + 1)}-${pad(endDate.getDate())}`;
    setForm({
      name: `${now.toLocaleString("en-US", { month: "long" })} ${y}`,
      period_start: start,
      period_end: end,
      pay_date: end,
      notes: "",
    });
    setShowModal(true);
  }

  async function createCycle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await payrollApi.createCycle(form);
      setShowModal(false);
      await load();
    } catch (err) {
      await alert({ message: (err as Error).message, tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: tr("payroll.deleteDraftCycleTitle"),
      message: tr("payroll.deleteDraftCycleMsg"),
      confirmLabel: tr("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    try {
      await payrollApi.deleteCycle(id);
      await load();
    } catch (err) {
      await alert({ message: (err as Error).message, tone: "danger" });
    }
  }

  const selectCls =
    "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.payrollTitle")}
        subtitle={tr("payroll.payrollSubtitle")}
        help={<>
          <p>{tr("payroll.createProcess")}</p>
          <p>{tr("payroll.startA")} <strong>{tr("payroll.newCycle")}</strong> {tr("payroll.startB")}</p>
        </>}
        actions={
          can("payroll:configure") && (
            <Button size="sm" icon="add" onClick={openModal}>
              {tr("payroll.newCycle")}
            </Button>
          )
        }
      />

      {error && <Banner>{error}</Banner>}

      {/* Stat cards */}
      <StatGrid>
        <StatCard
          label={tr("payroll.statTotalEmployees")}
          value={loading ? "…" : employees.length}
          icon="group"
          gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
          glow="rgba(91,83,224,0.28)"
        />
        <StatCard
          label={tr("payroll.statSalaryConfigured")}
          value={loading ? "…" : configuredIds.size}
          icon="task_alt"
          gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
          glow="rgba(14,138,110,0.25)"
        />
        <Link href="/enterprise/payroll/structures" className="block">
          <StatCard
            label={missing > 0 ? tr("payroll.missingSetupConfigure") : tr("payroll.missingSetup")}
            value={loading ? "…" : missing}
            icon="warning"
            gradient="linear-gradient(135deg,#F6B65C,#D97706)"
            glow="rgba(217,119,6,0.25)"
          />
        </Link>
        <StatCard
          label={current ? tr("payroll.currentNetNamed", { name: current.name }) : tr("payroll.currentNet")}
          value={loading ? "…" : <Money value={current?.totals?.net ?? 0} currency={orgCurrency} className="text-[20px]" />}
          icon="payments"
          gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
          glow="rgba(53,89,199,0.25)"
        />
      </StatGrid>

      {/* Toolbar: search + filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("payroll.searchCyclesPlaceholder")}
            className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${selectCls} w-full md:min-w-[170px]`}
            >
              <option value="ALL">{tr("payroll.allStatuses")}</option>
              <option value="DRAFT">{tr("payroll.draft")}</option>
              <option value="PROCESSING">{tr("payroll.processing")}</option>
              <option value="APPROVED">{tr("payroll.approved")}</option>
              <option value="PAID">{tr("payroll.paid")}</option>
              <option value="CANCELLED">{tr("payroll.cancelled")}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Cycles list */}
      <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : visibleCycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
              <CalendarRange className="w-8 h-8 text-[#C7CCD4]" />
            </div>
            {cycles.length === 0 ? (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("payroll.noCyclesYet")}</h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">{tr("payroll.createFirstCycle")}</p>
                {can("payroll:configure") && (
                  <Button icon="add" onClick={openModal}>
                    {tr("payroll.newCycle")}
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("payroll.noCyclesMatch")}</h3>
                <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">{tr("payroll.tryAdjusting")}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                >
                  {tr("payroll.clearFilters")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1.6fr_1fr_0.8fr_1fr_150px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.cycle")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.period")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.status")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.headcount")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.netPay")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.actions")}</span>
            </div>

            <div className="divide-y divide-[#F0F0F1]">
              {visibleCycles.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.6fr_1fr_0.8fr_1fr_150px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                >
                  {/* Cycle */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                      <CalendarRange className="w-[17px] h-[17px]" />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/enterprise/payroll/${c.id}`}
                        className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate"
                      >
                        {c.name}
                      </Link>
                      {/* mobile-only meta */}
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[12px] text-[#8A929E] md:hidden">
                        <span className={jetbrainsMono.className}>{c.period_start} → {c.period_end}</span>
                      </div>
                    </div>
                  </div>

                  {/* Period (desktop) */}
                  <div className={`hidden md:block text-[13px] text-[#374151] truncate ${jetbrainsMono.className}`}>
                    {c.period_start} → {c.period_end}
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center">
                    <Badge tone={CYCLE_TONE[c.status] ?? "neutral"} dot>{c.status}</Badge>
                  </div>

                  {/* Headcount (desktop) */}
                  <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                    {c.totals?.headcount ?? "—"}
                  </div>

                  {/* Net Pay (desktop) */}
                  <div className={`hidden md:block text-[13px] font-semibold text-[#15171C] text-right ${jetbrainsMono.className}`}>
                    {inr(c.totals?.net ?? 0, orgCurrency)}
                  </div>

                  {/* Status (mobile) + actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="md:hidden mr-1">
                      <Badge tone={CYCLE_TONE[c.status] ?? "neutral"} dot>{c.status}</Badge>
                    </div>

                    {c.status === "DRAFT" && can("payroll:manage") && (
                      <button
                        onClick={() => remove(c.id)}
                        className="h-8 px-3 rounded-[9px] text-[12px] font-semibold text-[#C0383C] hover:bg-[#FDECEC] transition-colors"
                      >
                        {tr("payroll.delete")}
                      </button>
                    )}
                    <Link
                      href={`/enterprise/payroll/${c.id}`}
                      className="inline-flex items-center h-8 px-3 rounded-[9px] bg-[#5B53E0] text-white text-[12px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                    >
                      {tr("payroll.manage")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal title={tr("payroll.createCycleModalTitle")} onClose={() => setShowModal(false)}>
          <form onSubmit={createCycle} className="flex flex-col gap-4">
            <Field label={tr("payroll.fieldCycleName")}>
              <input
                required
                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={tr("payroll.fieldPeriodStart")}>
                <input
                  required
                  type="date"
                  className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                />
              </Field>
              <Field label={tr("payroll.fieldPeriodEnd")}>
                <input
                  required
                  type="date"
                  className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                />
              </Field>
            </div>
            <Field label={tr("payroll.fieldPayDate")}>
              <input
                required
                type="date"
                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                value={form.pay_date}
                onChange={(e) => setForm({ ...form, pay_date: e.target.value })}
              />
            </Field>
            <Field label={tr("payroll.fieldNotesOptional")}>
              <textarea
                className="w-full min-h-20 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 py-2.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <div className="mt-2 flex gap-3">
              <Button type="submit" disabled={saving} fullWidth>
                {saving ? tr("payroll.creating") : tr("payroll.createCycle")}
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>
                {tr("payroll.cancel")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
        {label}
      </span>
      {children}
    </label>
  );
}
