"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, ChevronDown } from "lucide-react";
import {
  calendarApi,
  payrollApi,
  timesheetApi,
  type Holiday,
  type PayrollCycle,
  type Timesheet,
  type TimesheetStatus,
  type WorkCalendarConfig,
} from "@/utils/payroll/api";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";
import { Badge, StatCard, StatGrid, PageHeader, jetbrainsMono } from "@/components/ds";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const STATUS_TONE: Record<TimesheetStatus, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  SUBMITTED: "warning",
  REJECTED: "danger",
  DRAFT: "neutral",
};

function TimesheetBadge({ status }: { status: TimesheetStatus }) {
  return (
    <Badge tone={STATUS_TONE[status] || "neutral"} dot>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

const selectCls =
  "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

export default function TimesheetsPage() {
  const { can } = useAuth();
  const { confirm } = useDialog();
  const canEdit = can("payroll:configure");
  const canApprove = can("payroll:approve");

  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [cycleId, setCycleId] = useState<string>("");
  const [rows, setRows] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Work-calendar config (lives with timesheets — drives working-day derivation).
  const [config, setConfig] = useState<WorkCalendarConfig | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holForm, setHolForm] = useState({ holiday_date: "", name: "" });

  const cycle = cycles.find((c) => c.id === cycleId) || null;
  const cycleEditable = cycle?.status === "DRAFT" || cycle?.status === "PROCESSING";

  async function loadCycles() {
    setLoading(true);
    try {
      const cs = await payrollApi.listCycles();
      setCycles(cs);
      if (cs.length && !cycleId) setCycleId(cs[0].id);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendar() {
    try {
      const [cfg, hols] = await Promise.all([
        calendarApi.getConfig(),
        calendarApi.listHolidays(),
      ]);
      setConfig(cfg);
      setHolidays(hols);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function loadRows(id: string) {
    if (!id) {
      setRows([]);
      return;
    }
    try {
      setRows(await timesheetApi.listForCycle(id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    loadCycles();
    loadCalendar();
  }, []);

  useEffect(() => {
    loadRows(cycleId);
  }, [cycleId]);

  async function generate() {
    if (!cycleId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await timesheetApi.generate(cycleId);
      const parts = [`${res.created} created`, `${res.existing} already existed`];
      if (res.skipped.length) parts.push(`${res.skipped.length} skipped (no salary structure)`);
      setNotice(parts.join(" · "));
      await loadRows(cycleId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await loadRows(cycleId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleCalendar() {
    if (!config) return;
    const next = !config.use_calendar_working_days;
    try {
      setConfig(await calendarApi.updateConfig({ use_calendar_working_days: next }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleMakerChecker() {
    if (!config) return;
    try {
      setConfig(
        await calendarApi.updateConfig({ enforce_maker_checker: !config.enforce_maker_checker }),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleWeeklyOff(day: string) {
    if (!config) return;
    const set = new Set(config.weekly_offs);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    try {
      setConfig(await calendarApi.updateConfig({ weekly_offs: [...set] }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addHoliday() {
    if (!holForm.holiday_date || !holForm.name.trim()) return;
    try {
      await calendarApi.createHoliday(holForm.holiday_date, holForm.name.trim());
      setHolForm({ holiday_date: "", name: "" });
      setHolidays(await calendarApi.listHolidays());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeHoliday(h: Holiday) {
    if (!(await confirm({ title: "Remove holiday", message: `Delete "${h.name}"?` }))) return;
    try {
      await calendarApi.deleteHoliday(h.id);
      setHolidays(await calendarApi.listHolidays());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const num = (v: number | string) => Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  // Metrics derived from current rows (presentation only).
  const stats = {
    total: rows.length,
    approved: rows.filter((t) => t.status === "APPROVED").length,
    pending: rows.filter((t) => t.status === "SUBMITTED").length,
    rejected: rows.filter((t) => t.status === "REJECTED").length,
  };

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title="Timesheets"
        subtitle="Capture attendance per cycle. Approved timesheets drive loss-of-pay (and hours for hourly staff) on the next payroll run."
        help={<><p>Track and approve worked hours for a period.</p><p>Approve them before running payroll so pay is calculated correctly.</p></>}
      />

      {error && (
        <div className="rounded-[12px] border border-[#FAC5C5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-[12px] border border-[#5B53E0]/30 bg-[#ECEBFB] px-4 py-3 text-[13px] font-medium text-[#5B53E0]">
          {notice}
        </div>
      )}

      {/* Metrics */}
      <StatGrid>
        <StatCard label="Total Timesheets" value={stats.total} icon="schedule" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
        <StatCard label="Approved" value={stats.approved} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
        <StatCard label="Pending Approval" value={stats.pending} icon="hourglass_top" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
        <StatCard label="Rejected" value={stats.rejected} icon="cancel" gradient="linear-gradient(135deg,#F87171,#DC2626)" glow="rgba(220,38,38,0.25)" />
      </StatGrid>

      {/* Toolbar: cycle selector + generate */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className={`${selectCls} w-full pr-9`}
          >
            {cycles.length === 0 && <option value="">No cycles yet</option>}
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
        </div>
        {canEdit && (
          <button
            onClick={generate}
            disabled={!cycleId || busy || !cycleEditable}
            title={!cycleEditable ? "Cycle must be DRAFT or PROCESSING" : ""}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            Generate timesheets
          </button>
        )}
      </div>

      {/* Timesheet rows */}
      <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : !cycleId ? (
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
              <span className="material-symbols-rounded text-[32px] text-[#C7CCD4]">schedule</span>
            </div>
            <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">No payroll cycle</h3>
            <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto">Create a payroll cycle first to capture timesheets.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
              <span className="material-symbols-rounded text-[32px] text-[#C7CCD4]">schedule</span>
            </div>
            <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">No timesheets yet</h3>
            <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto">
              No timesheets for this cycle yet. {canEdit && "Use “Generate timesheets” above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px] md:min-w-0">
              {/* Column header (desktop) */}
              <div className="hidden md:grid grid-cols-[2.4fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1.6fr] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Employee</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Mode</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Worked</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">LOP</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Hours</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
              </div>

              <div className="divide-y divide-[#F0F0F1]">
                {rows.map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-1 md:grid-cols-[2.4fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1.6fr] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                  >
                    {/* Employee */}
                    <div className="min-w-0">
                      <Link
                        href={`/enterprise/payroll/timesheets/${t.id}`}
                        className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate"
                      >
                        {t.employee_name || t.employee_id.slice(0, 8)}
                      </Link>
                      {t.employee_code && (
                        <span className={`block text-[11px] text-[#8A929E] mt-0.5 ${jetbrainsMono.className}`}>{t.employee_code}</span>
                      )}
                      {/* mobile-only meta */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-[#374151] md:hidden">
                        <span className="text-[#8A929E]">{t.mode}</span>
                        <span className={jetbrainsMono.className}>Worked {num(t.worked_days)}</span>
                        <span className={jetbrainsMono.className}>LOP {num(t.lop_days)}</span>
                        {t.mode === "HOURLY" && <span className={jetbrainsMono.className}>{num(t.total_hours)} hrs</span>}
                      </div>
                    </div>

                    {/* Mode (desktop) */}
                    <div className="hidden md:block text-[13px] text-[#8A929E]">{t.mode}</div>

                    {/* Worked (desktop) */}
                    <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>{num(t.worked_days)}</div>

                    {/* LOP (desktop) */}
                    <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>{num(t.lop_days)}</div>

                    {/* Hours (desktop) */}
                    <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                      {t.mode === "HOURLY" ? num(t.total_hours) : "—"}
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center"><TimesheetBadge status={t.status} /></div>

                    {/* Status (mobile) + actions */}
                    <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap">
                      <div className="md:hidden mr-1"><TimesheetBadge status={t.status} /></div>

                      {canApprove && t.status === "SUBMITTED" && (
                        <>
                          <button
                            onClick={() => act(t.id, () => timesheetApi.approve(t.id))}
                            disabled={busy}
                            className="inline-flex items-center h-8 px-3 rounded-[9px] bg-[#0E8A6E] text-white text-[12px] font-semibold hover:bg-[#0c7a61] transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => act(t.id, () => timesheetApi.reject(t.id))}
                            disabled={busy}
                            className="inline-flex items-center h-8 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[12px] font-semibold text-[#374151] hover:bg-[#F4F5F7] transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {canApprove && t.status === "APPROVED" && (
                        <button
                          onClick={() => act(t.id, () => timesheetApi.reopen(t.id))}
                          disabled={busy}
                          className="inline-flex items-center h-8 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[12px] font-semibold text-[#374151] hover:bg-[#F4F5F7] transition-colors disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                      <Link
                        href={`/enterprise/payroll/timesheets/${t.id}`}
                        className="inline-flex items-center h-8 px-3 rounded-[9px] bg-white border border-[#E1E4E8] text-[12px] font-semibold text-[#374151] hover:bg-[#ECEBFB] hover:text-[#5B53E0] hover:border-[#D4D7DC] transition-colors"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work calendar config */}
      <div className="rounded-[14px] border border-[#E8EAED] bg-white p-5 md:p-6">
        <h2 className="text-[17px] font-bold tracking-[-0.3px] text-[#15171C] mb-1">Work calendar</h2>
        <p className="mb-5 text-[13px] text-[#8A929E] leading-relaxed">
          Weekly-offs and holidays are excluded when deriving the working days a payroll run
          pro-rates against.
        </p>

        {config && (
          <div className="flex flex-col gap-5">
            <label className="flex items-center gap-3 text-[13px] text-[#374151]">
              <input
                type="checkbox"
                checked={config.use_calendar_working_days}
                onChange={toggleCalendar}
                disabled={!canEdit}
                className="h-4 w-4 accent-[#5B53E0]"
              />
              <span>
                Derive working days from the calendar{" "}
                <span className="ml-1 text-[12px] text-[#8A929E]">
                  (off = fixed 30-day basis)
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 text-[13px] text-[#374151]">
              <input
                type="checkbox"
                checked={config.enforce_maker_checker}
                onChange={toggleMakerChecker}
                disabled={!canEdit}
                className="h-4 w-4 accent-[#5B53E0]"
              />
              <span>
                Enforce segregation of duties{" "}
                <span className="ml-1 text-[12px] text-[#8A929E]">
                  (the user who submits a timesheet/leave can’t approve it)
                </span>
              </span>
            </label>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                Weekly offs
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const on = config.weekly_offs.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleWeeklyOff(d)}
                      disabled={!canEdit}
                      className={`rounded-[10px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        on
                          ? "bg-[#5B53E0] text-white"
                          : "bg-white border border-[#E1E4E8] text-[#8A929E] hover:bg-[#F4F5F7]"
                      } disabled:opacity-50`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                Holidays
              </div>
              {holidays.length === 0 ? (
                <p className="text-[13px] text-[#8A929E]">No holidays configured.</p>
              ) : (
                <ul className="mb-3 flex flex-col gap-1.5">
                  {holidays.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between rounded-[10px] bg-[#F7F8FA] border border-[#E8EAED] px-3 py-2 text-[13px]"
                    >
                      <span className="min-w-0">
                        <span className={`font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{h.holiday_date}</span>
                        <span className="ml-2 text-[#374151]">{h.name}</span>
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => removeHoliday(h)}
                          className="text-[12px] font-semibold text-[#C0383C] hover:underline shrink-0 ml-3"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="date"
                    value={holForm.holiday_date}
                    onChange={(e) => setHolForm({ ...holForm, holiday_date: e.target.value })}
                    className="h-10 rounded-[10px] border border-[#E1E4E8] bg-white px-3 text-[13px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Holiday name"
                    value={holForm.name}
                    onChange={(e) => setHolForm({ ...holForm, name: e.target.value })}
                    className="h-10 flex-1 min-w-[160px] rounded-[10px] border border-[#E1E4E8] bg-white px-3 text-[13px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                  />
                  <button
                    onClick={addHoliday}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                  >
                    Add holiday
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
