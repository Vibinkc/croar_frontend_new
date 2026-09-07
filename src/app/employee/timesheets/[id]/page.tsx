"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  meApi,
  DAY_STATUS_OPTIONS,
  type DayStatus,
  type TimesheetDetail,
  type TimesheetEntryEdit,
} from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, Badge, Button, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

const STATUS_LABEL: Record<string, string> = Object.fromEntries(DAY_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const SELF_MARK: DayStatus[] = ["PRESENT", "WFH"];
const NON_WORKING = ["HOLIDAY", "WEEKLY_OFF"];
const LEAVE_LOCKED = ["PAID_LEAVE", "UNPAID_LEAVE", "HALF_DAY", "HALF_DAY_PAID"];
const TODAY = new Date().toISOString().slice(0, 10);

const statusTone = (s: string): "success" | "warning" | "danger" | "info" | "neutral" => {
  const u = (s || "").toUpperCase();
  if (u === "APPROVED" || u === "FINALIZED") return "success";
  if (u === "SUBMITTED") return "info";
  if (u === "REJECTED") return "danger";
  if (u === "DRAFT") return "warning";
  return "neutral";
};

export default function MyTimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [ts, setTs] = useState<TimesheetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, TimesheetEntryEdit>>({});

  async function load() {
    try {
      setTs(await meApi.timesheet(id));
      setEdits({});
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  const isHourly = ts?.mode === "HOURLY";
  const editable = ts?.status === "DRAFT" || ts?.status === "REJECTED";
  const dirty = Object.keys(edits).length > 0;

  const canMark = (e: TimesheetDetail["entries"][number]) =>
    !!editable && !NON_WORKING.includes(e.day_status) && !LEAVE_LOCKED.includes(e.day_status) && e.entry_date <= TODAY;

  const statusFor = (date: string, server: DayStatus): DayStatus => (edits[date]?.day_status as DayStatus) ?? server;
  const hoursFor = (date: string, server: number | string | null): string => {
    const e = edits[date];
    if (e && e.hours !== undefined) return e.hours === null ? "" : String(e.hours);
    return server === null ? "" : String(server);
  };
  function setStatus(date: string, value: DayStatus) {
    setEdits((p) => ({ ...p, [date]: { ...p[date], entry_date: date, day_status: value } }));
  }
  function setHours(date: string, value: string) {
    const hours = value === "" ? null : Number(value);
    setEdits((p) => ({ ...p, [date]: { ...p[date], entry_date: date, hours } }));
  }
  async function save() {
    setBusy(true);
    try {
      await meApi.markTimesheet(id, Object.values(edits));
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const summary = !ts
    ? []
    : isHourly
      ? [{ label: t("employee.totalHours"), value: ts.total_hours, icon: "timer", grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.28)" }]
      : [
          { label: t("employee.workedDays"), value: ts.worked_days, icon: "task_alt", grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
          { label: t("employee.lopDays"), value: ts.lop_days, icon: "money_off", grad: "linear-gradient(135deg,#FFB74D,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
          { label: t("employee.halfDays"), value: ts.half_days, icon: "hourglass_bottom", grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
        ];

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={ts ? `${ts.period_start} → ${ts.period_end}` : t("employee.timesheet")}
        subtitle={ts ? (editable ? t("employee.timesheetEditableSubtitle") : t("employee.timesheetReadOnlySubtitle", { status: ts.status.toLowerCase() })) : undefined}
        onBack={() => router.push("/employee/timesheets")}
        actions={ts && (
          <div className="flex items-center gap-2.5">
            <Badge tone={statusTone(ts.status)} dot>{ts.status.charAt(0) + ts.status.slice(1).toLowerCase()}</Badge>
            {editable && <Button icon="save" disabled={!dirty || busy} onClick={save}>{busy ? t("employee.saving") : t("employee.saveAttendance")}</Button>}
          </div>
        )}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      {!ts && !error ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />)}</div>
          <div className="h-64 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />
        </div>
      ) : ts ? (
        <>
          <StatGrid className={summary.length === 1 ? "lg:grid-cols-3" : "lg:grid-cols-3"}>
            {summary.map((s) => (
              <StatCard key={s.label} label={s.label} value={Number(s.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} icon={s.icon} gradient={s.grad} glow={s.glow} />
            ))}
          </StatGrid>

          <Card padding="none" className="overflow-hidden">
            <CardHeader className="px-6 pt-6" title={t("employee.dailyAttendance")} subtitle={editable ? t("employee.dailyAttendanceEditable") : t("employee.readOnly")} />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-y border-[#E0E0E0] bg-[#FAFAFA] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">
                    <th className="px-6 py-3">{t("employee.colDate")}</th>
                    <th className="px-6 py-3">{t("employee.colDay")}</th>
                    <th className="px-6 py-3">{isHourly ? t("employee.colHours") : t("employee.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEE]">
                  {ts.entries.map((e) => {
                    const dow = t(`employee.dow${new Date(e.entry_date + "T00:00:00").getDay()}`);
                    const markable = canMark(e);
                    return (
                      <tr key={e.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className={`px-6 py-3 font-semibold text-[#212121] ${jetbrainsMono.className}`}>{e.entry_date}</td>
                        <td className="px-6 py-3 text-[#757575]">{dow}</td>
                        <td className="px-6 py-3">
                          {isHourly ? (
                            markable ? (
                              <input type="number" min={0} max={24} step="0.25" value={hoursFor(e.entry_date, e.hours)} onChange={(ev) => setHours(e.entry_date, ev.target.value)}
                                className="w-28 rounded-[4px] border border-[#E0E0E0] bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20" />
                            ) : (
                              <span className="text-[#9E9E9E]">{e.hours === null ? "—" : Number(e.hours)}</span>
                            )
                          ) : markable ? (
                            <select value={statusFor(e.entry_date, e.day_status)} onChange={(ev) => setStatus(e.entry_date, ev.target.value as DayStatus)}
                              className="rounded-[4px] border border-[#E0E0E0] bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20">
                              {SELF_MARK.map((v) => <option key={v} value={v}>{t(`employee.selfMark_${v}`)}</option>)}
                            </select>
                          ) : (
                            <span className="text-[#424242]">{STATUS_LABEL[e.day_status] ?? e.day_status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
