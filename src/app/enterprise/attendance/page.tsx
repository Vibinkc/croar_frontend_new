"use client";

/**
 * Attendance — presence, which is not the same thing as a timesheet.
 *
 * Three tabs because there are three audiences and they want different things:
 *   My day    an employee punching in and out, and raising a correction when a punch was missed
 *   Everyone  HR reading the month, marking a day by hand, and deciding regularizations
 *   Shifts    the one-time setup that decides what counts as a half or full day
 *
 * The employee can never edit a day directly. That is deliberate: letting people write their own
 * attendance makes the record worthless, so a correction goes through request-and-approve.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import {
  attendanceApi,
  type AttendanceDay,
  type AttendanceMonth,
  type AttendanceStatus,
  type MyAttendance,
  type Regularization,
  type Shift,
} from "@/utils/payroll/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
  jetbrainsMono,
} from "@/components/ds";

type TabKey = "me" | "everyone" | "shifts";

const STATUS_TONE: Record<
  AttendanceStatus,
  "success" | "danger" | "warning" | "info" | "neutral" | "teal"
> = {
  present: "success",
  absent: "danger",
  half_day: "warning",
  leave: "info",
  holiday: "teal",
  weekly_off: "neutral",
};

const ALL_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "half_day",
  "leave",
  "holiday",
  "weekly_off",
];

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-09-10T09:30:00" → "09:30". Blank stays blank rather than showing "Invalid Date". */
function clock(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function hhmm(minutes: number): string {
  if (!minutes) return "—";
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export default function AttendancePage() {
  const { t: tr } = useI18n();

  // Confirmation is inline rather than a modal. DialogProvider is mounted only by the
  // payroll and employee layouts, and this page sits under /enterprise — calling useDialog
  // here threw at render. The sibling enterprise pages confirm inline too, so this matches
  // them instead of pulling a provider up the tree for one dialog.
  const [pendingDecision, setPendingDecision] = useState<{
    id: string;
    decision: "approved" | "rejected";
  } | null>(null);

  const [tab, setTab] = useState<TabKey>("me");
  const [month, setMonth] = useState(thisMonth());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [mine, setMine] = useState<MyAttendance | null>(null);
  // The signed-in account may have no employee record — attendance belongs to an
  // employee, not a user. That is a legitimate state, not an error to shout about.
  const [noEmployeeRecord, setNoEmployeeRecord] = useState(false);

  const [everyone, setEveryone] = useState<AttendanceMonth | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "">("");
  const [pending, setPending] = useState<Regularization[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  async function guard(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const loadMine = useCallback(async () => {
    try {
      setMine(await attendanceApi.mine(month));
      setNoEmployeeRecord(false);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.toLowerCase().includes("not linked to an employee")) {
        setNoEmployeeRecord(true);
        setMine(null);
      } else {
        setError(msg);
      }
    }
  }, [month]);

  const loadEveryone = useCallback(async () => {
    try {
      const [rows, regs] = await Promise.all([
        attendanceApi.month({ month, status: statusFilter || undefined }),
        attendanceApi.listRegularizations({ status: "pending" }),
      ]);
      setEveryone(rows);
      setPending(regs);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [month, statusFilter]);

  const loadShifts = useCallback(async () => {
    try {
      setShifts(await attendanceApi.listShifts());
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (tab === "me") void loadMine();
    if (tab === "everyone") void loadEveryone();
    if (tab === "shifts") void loadShifts();
  }, [tab, loadMine, loadEveryone, loadShifts]);

  async function punch(direction: "in" | "out") {
    await guard(`punch-${direction}`, async () => {
      await attendanceApi.punch({ direction });
      await loadMine();
    });
  }

  async function decide(r: Regularization, decision: "approved" | "rejected") {
    await guard(`decide-${r.id}`, async () => {
      await attendanceApi.decideRegularization(r.id, decision);
      setPendingDecision(null);
      await loadEveryone();
    });
  }

  const totals = tab === "me" ? mine?.totals : everyone?.totals;

  const days = useMemo<AttendanceDay[]>(
    () => (tab === "me" ? (mine?.days ?? []) : (everyone?.days ?? [])),
    [tab, mine, everyone],
  );

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("attendance.title")}
        subtitle={tr("attendance.subtitle")}
        help={
          <>
            <p>{tr("attendance.help1")}</p>
            <p>{tr("attendance.help2")}</p>
          </>
        }
      />

      {error && (
        <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E0E0E0]">
        {(
          [
            ["me", tr("attendance.tabMe")],
            ["everyone", tr("attendance.tabEveryone")],
            ["shifts", tr("attendance.tabShifts")],
          ] as [TabKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-[#1976D2] text-[#1976D2]"
                : "border-transparent text-[#757575] hover:text-[#212121]"
            }`}
          >
            {label}
            {key === "everyone" && pending.length > 0 && (
              <span className="ml-2 rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[11px] font-bold text-[#E65100]">
                {pending.length}
              </span>
            )}
          </button>
        ))}

        {tab !== "shifts" && (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="ml-auto mb-1 h-9 rounded-[4px] border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#212121]"
          />
        )}
      </div>

      {/* Totals */}
      {totals && tab !== "shifts" && (
        <StatGrid className="grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={tr("attendance.statPayable")}
            value={totals.payable_days}
            icon="event_available"
            gradient="linear-gradient(135deg,#66BB6A,#2E7D32)"
            glow="rgba(46,125,50,0.25)"
          />
          <StatCard
            label={tr("attendance.statPresent")}
            value={totals.present}
            icon="how_to_reg"
            gradient="linear-gradient(135deg,#42A5F5,#1565C0)"
            glow="rgba(21,101,192,0.25)"
          />
          <StatCard
            label={tr("attendance.statAbsent")}
            value={totals.absent}
            icon="person_off"
            gradient="linear-gradient(135deg,#EF5350,#C62828)"
            glow="rgba(198,40,40,0.25)"
          />
          <StatCard
            label={tr("attendance.statHours")}
            value={totals.work_hours}
            icon="schedule"
            gradient="linear-gradient(135deg,#AB47BC,#6A1B9A)"
            glow="rgba(106,27,154,0.25)"
          />
        </StatGrid>
      )}

      {/* ── My day ───────────────────────────────────────────────────────── */}
      {tab === "me" && (
        <>
          {noEmployeeRecord ? (
            <EmptyState
              icon="badge"
              title={tr("attendance.noRecordTitle")}
              description={tr("attendance.noRecordDesc")}
            />
          ) : (
            <Card padding="lg" className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575]">
                  {tr("attendance.today")}
                </div>
                <div className={`${jetbrainsMono.className} text-[26px] font-bold text-[#212121] mt-1`}>
                  {mine?.today ? hhmm(mine.today.work_minutes) : "—"}
                </div>
                <div className="text-[12.5px] text-[#757575] mt-0.5">
                  {mine?.today
                    ? `${tr("attendance.firstIn")} ${clock(mine.today.first_in)} · ${tr("attendance.lastOut")} ${clock(mine.today.last_out)}`
                    : tr("attendance.notStarted")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={mine?.punched_in ? "secondary" : "primary"}
                  icon="login"
                  disabled={Boolean(mine?.punched_in) || busy === "punch-in"}
                  onClick={() => punch("in")}
                >
                  {tr("attendance.punchIn")}
                </Button>
                <Button
                  variant={mine?.punched_in ? "primary" : "secondary"}
                  icon="logout"
                  disabled={!mine?.punched_in || busy === "punch-out"}
                  onClick={() => punch("out")}
                >
                  {tr("attendance.punchOut")}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Pending regularizations (HR) ─────────────────────────────────── */}
      {tab === "everyone" && pending.length > 0 && (
        <Card padding="lg" className="space-y-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#212121]">
              {tr("attendance.pendingTitle")}
            </h3>
            <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("attendance.pendingHint")}</p>
          </div>
          <div className="space-y-2">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-[4px] border border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#212121]">
                    {r.employee_name || "—"}{" "}
                    <span className={`${jetbrainsMono.className} text-[12px] text-[#757575]`}>
                      {r.work_date}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-[#616161] mt-0.5">
                    {tr("attendance.wants")}{" "}
                    <Badge tone={STATUS_TONE[r.requested_status]}>
                      {tr(`attendance.status.${r.requested_status}`)}
                    </Badge>{" "}
                    — {r.reason}
                  </div>
                </div>
                {/* A decision cannot be changed afterwards, so the button asks once before
                    acting. Two taps, no modal. */}
                {pendingDecision?.id === r.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12.5px] font-semibold text-[#E65100]">
                      {pendingDecision.decision === "approved"
                        ? tr("attendance.approveConfirm")
                        : tr("attendance.rejectConfirm")}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy === `decide-${r.id}`}
                      onClick={() => setPendingDecision(null)}
                    >
                      {tr("attendance.cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon="check"
                      disabled={busy === `decide-${r.id}`}
                      onClick={() => decide(r, pendingDecision.decision)}
                    >
                      {tr("attendance.yes")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="close"
                      disabled={busy === `decide-${r.id}`}
                      onClick={() => setPendingDecision({ id: r.id, decision: "rejected" })}
                    >
                      {tr("attendance.reject")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon="check"
                      disabled={busy === `decide-${r.id}`}
                      onClick={() => setPendingDecision({ id: r.id, decision: "approved" })}
                    >
                      {tr("attendance.approve")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── The day table (both me and everyone) ─────────────────────────── */}
      {tab !== "shifts" && (
        <Card padding="none" className="overflow-hidden">
          {tab === "everyone" && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#EEEEEE] px-4 py-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#757575]">
                {tr("attendance.filterStatus")}
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | "")}
                className="h-8 rounded-[4px] border border-[#E0E0E0] bg-white px-2 text-[13px]"
              >
                <option value="">{tr("attendance.allStatuses")}</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tr(`attendance.status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {days.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="event_busy"
                title={tr("attendance.noDaysTitle")}
                description={tr("attendance.noDaysDesc")}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
                    {[
                      tr("attendance.colDate"),
                      ...(tab === "everyone" ? [tr("attendance.colEmployee")] : []),
                      tr("attendance.colShift"),
                      tr("attendance.colStatus"),
                      tr("attendance.colIn"),
                      tr("attendance.colOut"),
                      tr("attendance.colWorked"),
                      tr("attendance.colMode"),
                      tr("attendance.colSource"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.id} className="border-b border-[#F5F5F5] last:border-0">
                      <td className={`${jetbrainsMono.className} px-4 py-2.5 text-[12.5px] text-[#212121]`}>
                        {d.work_date}
                      </td>
                      {tab === "everyone" && (
                        <td className="px-4 py-2.5 text-[13px] text-[#212121]">
                          {d.employee_name || "—"}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-[13px] text-[#616161]">{d.shift || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[d.status]}>
                          {tr(`attendance.status.${d.status}`)}
                        </Badge>
                      </td>
                      <td className={`${jetbrainsMono.className} px-4 py-2.5 text-[12.5px] text-[#616161]`}>
                        {clock(d.first_in)}
                      </td>
                      <td className={`${jetbrainsMono.className} px-4 py-2.5 text-[12.5px] text-[#616161]`}>
                        {clock(d.last_out)}
                      </td>
                      <td className={`${jetbrainsMono.className} px-4 py-2.5 text-[12.5px] text-[#212121]`}>
                        {hhmm(d.work_minutes)}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[#616161]">{d.work_mode || "—"}</td>
                      <td className="px-4 py-2.5 text-[12px] text-[#9E9E9E]">{d.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Shifts ───────────────────────────────────────────────────────── */}
      {tab === "shifts" && (
        <Card padding="none" className="overflow-hidden">
          {shifts.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="schedule"
                title={tr("attendance.noShiftsTitle")}
                description={tr("attendance.noShiftsDesc")}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
                    {[
                      tr("attendance.colShiftName"),
                      tr("attendance.colStart"),
                      tr("attendance.colEnd"),
                      tr("attendance.colBreak"),
                      tr("attendance.colHalfAfter"),
                      tr("attendance.colFullAfter"),
                      tr("attendance.colDefault"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => (
                    <tr key={s.id} className="border-b border-[#F5F5F5] last:border-0">
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-[#212121]">{s.name}</td>
                      <td className={`${jetbrainsMono.className} px-4 py-2.5 text-[12.5px] text-[#616161]`}>
                        {s.starts_at.slice(0, 5)}
                      </td>
                      <td className={`${jetbrainsMono.className} px-4 py-2.5 text-[12.5px] text-[#616161]`}>
                        {s.ends_at.slice(0, 5)}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[#616161]">{s.break_minutes}m</td>
                      <td className="px-4 py-2.5 text-[13px] text-[#616161]">
                        {hhmm(s.half_day_after_minutes)}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[#616161]">
                        {hhmm(s.full_day_after_minutes)}
                      </td>
                      <td className="px-4 py-2.5">
                        {s.is_default ? (
                          <Badge tone="success">{tr("attendance.default")}</Badge>
                        ) : (
                          <span className="text-[13px] text-[#BDBDBD]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
