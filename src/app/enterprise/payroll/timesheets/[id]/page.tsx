"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import {
  timesheetApi,
  DAY_STATUS_OPTIONS,
  type DayStatus,
  type TimesheetDetail,
  type TimesheetEntryEdit,
} from "@/utils/payroll/api";
import { Banner, StatCard, StatusBadge } from "@/components/payroll/ui";
import { PageHeader } from "@/components/ds";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";

// Statuses HR controls per working day. HOLIDAY / WEEKLY_OFF are set by the
// calendar at generate time and shown read-only.
const EDITABLE_DAY = DAY_STATUS_OPTIONS.filter(
  (o) => o.value !== "HOLIDAY" && o.value !== "WEEKLY_OFF"
);
const NON_WORKING: DayStatus[] = ["HOLIDAY", "WEEKLY_OFF"];

export default function TimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { can } = useAuth();
  const { t: tr } = useI18n();
  const { confirm } = useDialog();
  const canEdit = can("payroll:configure");
  const canApprove = can("payroll:approve");
  const DOW_LABELS = [
    tr("payroll.sun"), tr("payroll.mon"), tr("payroll.tue"), tr("payroll.wed"),
    tr("payroll.thu"), tr("payroll.fri"), tr("payroll.sat"),
  ];

  const [ts, setTs] = useState<TimesheetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local edits keyed by entry_date.
  const [edits, setEdits] = useState<Record<string, TimesheetEntryEdit>>({});

  async function load() {
    setLoading(true);
    try {
      setTs(await timesheetApi.get(id));
      setEdits({});
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const editable = ts?.status === "DRAFT" || ts?.status === "REJECTED";
  const isHourly = ts?.mode === "HOURLY";
  const dirty = Object.keys(edits).length > 0;

  // Effective value for a row = local edit if present, else the server value.
  const dayStatusFor = (date: string, server: DayStatus): DayStatus =>
    (edits[date]?.day_status as DayStatus) ?? server;
  const hoursFor = (date: string, server: number | string | null): string => {
    const e = edits[date];
    if (e && e.hours !== undefined) return e.hours === null ? "" : String(e.hours);
    return server === null ? "" : String(server);
  };

  function setDayStatus(date: string, value: DayStatus) {
    setEdits((prev) => ({ ...prev, [date]: { ...prev[date], entry_date: date, day_status: value } }));
  }
  function setHours(date: string, value: string) {
    const hours = value === "" ? null : Number(value);
    setEdits((prev) => ({ ...prev, [date]: { ...prev[date], entry_date: date, hours } }));
  }

  async function save() {
    if (!ts || !dirty) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await timesheetApi.updateEntries(ts.id, Object.values(edits));
      setTs(updated);
      setEdits({});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<unknown>, confirmMsg?: string) {
    if (confirmMsg && !(await confirm({ message: confirmMsg }))) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const summary = useMemo(() => {
    if (!ts) return null;
    return [
      { icon: "event_available", label: tr("payroll.workedDays"), value: ts.worked_days },
      { icon: "event_busy", label: tr("payroll.lopDays"), value: ts.lop_days },
      { icon: "hourglass_bottom", label: tr("payroll.halfDays"), value: ts.half_days },
      ...(isHourly ? [{ icon: "schedule", label: tr("payroll.totalHours"), value: ts.total_hours }] : []),
    ];
  }, [ts, isHourly, tr]);

  if (loading) return <p className="text-sm text-[var(--color-muted)]">{tr("common.loading")}</p>;
  if (!ts)
    return (
      <div>
        <Banner>{error || tr("payroll.timesheetNotFound")}</Banner>
      </div>
    );

  return (
    <div className="px-4 sm:px-5 md:px-7 py-6 mx-auto max-w-4xl w-full">
      <Link href="/enterprise/payroll/timesheets" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
        <span className="material-symbols-rounded text-[18px]">arrow_back</span> {tr("nav.timesheets")}
      </Link>

      <div className="mb-5">
        <PageHeader
          title={ts.employee_name || ts.employee_id.slice(0, 8)}
          subtitle={
            <>
              {ts.period_start} → {ts.period_end} · {ts.mode}
              {(ts.submitted_by_name || ts.approved_by_name) && (
                <span className="mt-1 block text-xs text-[var(--color-dim)]">
                  {ts.submitted_by_name && <>{tr("payroll.submittedBy", { name: ts.submitted_by_name })}</>}
                  {ts.submitted_by_name && ts.approved_by_name && " · "}
                  {ts.approved_by_name && <>{tr("payroll.approvedBy", { name: ts.approved_by_name })}</>}
                </span>
              )}
            </>
          }
          help={<>{tr("payroll.timesheetDetailHelp")}</>}
          actions={<StatusBadge status={ts.status} />}
        />
      </div>

      {error && (
        <div className="mb-4">
          <Banner>{error}</Banner>
        </div>
      )}

      {/* Aggregate summary */}
      {summary && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={Number(s.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {canEdit && editable && (
          <button
            onClick={save}
            disabled={!dirty || busy}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {tr("payroll.saveChanges")}
          </button>
        )}
        {canEdit && editable && (
          <button
            onClick={() => act(() => timesheetApi.submit(ts.id), dirty ? tr("payroll.submitUnsavedConfirm") : undefined)}
            disabled={busy || dirty}
            title={dirty ? tr("payroll.saveChangesFirst") : ""}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"
          >
            {tr("payroll.submitForApproval")}
          </button>
        )}
        {canApprove && ts.status === "SUBMITTED" && (
          <>
            <button
              onClick={() => act(() => timesheetApi.approve(ts.id))}
              disabled={busy}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {tr("payroll.approve")}
            </button>
            <button
              onClick={() => act(() => timesheetApi.reject(ts.id))}
              disabled={busy}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] disabled:opacity-50"
            >
              {tr("payroll.reject")}
            </button>
          </>
        )}
        {canApprove && ts.status === "APPROVED" && (
          <button
            onClick={() => act(() => timesheetApi.reopen(ts.id), tr("payroll.reopenConfirm"))}
            disabled={busy}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] disabled:opacity-50"
          >
            {tr("payroll.reopen")}
          </button>
        )}
      </div>

      {!editable && (
        <p className="mb-3 text-sm text-[var(--color-dim)]">
          {tr("payroll.timesheetReadOnly", {
            status:
              ts.status === "APPROVED"
                ? tr("payroll.approved")
                : ts.status === "SUBMITTED"
                  ? tr("payroll.submitted")
                  : ts.status.toLowerCase(),
          })}
          {ts.status === "APPROVED" && tr("payroll.reopenToChange")}
        </p>
      )}

      {/* Daily grid */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3">{tr("payroll.date")}</th>
              <th className="px-4 py-3">{tr("payroll.day")}</th>
              <th className="px-4 py-3">{isHourly ? tr("payroll.hours") : tr("payroll.status")}</th>
            </tr>
          </thead>
          <tbody>
            {ts.entries.map((e) => {
              const status = dayStatusFor(e.entry_date, e.day_status);
              const nonWorking = NON_WORKING.includes(e.day_status);
              const dow = DOW_LABELS[new Date(e.entry_date + "T00:00:00").getDay()];
              return (
                <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-2.5 font-medium">{e.entry_date}</td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{dow}</td>
                  <td className="px-4 py-2.5">
                    {isHourly ? (
                      nonWorking ? (
                        <span className="text-[var(--color-dim)]">{e.day_status}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step="0.25"
                          value={hoursFor(e.entry_date, e.hours)}
                          onChange={(ev) => setHours(e.entry_date, ev.target.value)}
                          disabled={!canEdit || !editable}
                          className="w-28 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 disabled:opacity-60"
                        />
                      )
                    ) : nonWorking ? (
                      <span className="text-[var(--color-dim)]">
                        {e.day_status === "WEEKLY_OFF" ? tr("payroll.weeklyOff") : tr("payroll.holiday")}
                      </span>
                    ) : (
                      <select
                        value={status}
                        onChange={(ev) => setDayStatus(e.entry_date, ev.target.value as DayStatus)}
                        disabled={!canEdit || !editable}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 disabled:opacity-60"
                      >
                        {EDITABLE_DAY.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
