"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { meApi, type Timesheet } from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, Badge, EmptyState, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

const statusTone = (s: string): "success" | "warning" | "danger" | "neutral" | "info" => {
  const u = (s || "").toUpperCase();
  if (u === "APPROVED" || u === "FINALIZED") return "success";
  if (u === "SUBMITTED") return "info";
  if (u === "REJECTED") return "danger";
  if (u === "DRAFT") return "warning";
  return "neutral";
};

export default function MyTimesheetsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Timesheet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    meApi.timesheets().then(setRows).catch((err) => setError((err as Error).message));
  }, []);

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  const current = rows?.[0] ?? null;
  const totalWorked = (rows ?? []).reduce((s, t) => s + Number(t.worked_days || 0), 0);

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={t("employee.myTimesheetsTitle")}
        subtitle={t("employee.myTimesheetsSubtitle")}
        help={<><p>{t("employee.myTimesheetsHelp1")}</p><p>{t("employee.myTimesheetsHelp2")}</p></>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <StatGrid>
        <StatCard label={t("employee.timesheets")} value={rows ? rows.length : "—"} icon="schedule" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
        <StatCard label={t("employee.currentStatus")} value={current?.status ?? "—"} icon="event_note" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
        <StatCard label={t("employee.daysWorked")} value={rows ? totalWorked : "—"} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title={t("employee.payPeriods")} subtitle={t("employee.newestFirst")} />
        {!rows ? (
          <div className="px-6 pb-6 space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-[10px] bg-[#F4F5F7] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="schedule" title={t("employee.noTimesheets")} description={t("employee.noTimesheetsDesc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-[#E8EAED] bg-[#F7F8FA] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                  <th className="px-6 py-3">{t("employee.colPeriod")}</th>
                  <th className="px-6 py-3">{t("employee.colWorked")}</th>
                  <th className="px-6 py-3">{t("employee.colLOP")}</th>
                  <th className="px-6 py-3">{t("employee.colStatus")}</th>
                  <th className="px-6 py-3 text-right">{t("employee.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F1]">
                {rows.map((ts) => (
                  <tr key={ts.id} className="hover:bg-[#F7F7F8] transition-colors">
                    <td className={`px-6 py-3.5 font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{ts.period_start} → {ts.period_end}</td>
                    <td className={`px-6 py-3.5 text-[#374151] ${jetbrainsMono.className}`}>{Number(ts.worked_days)}</td>
                    <td className={`px-6 py-3.5 text-[#374151] ${jetbrainsMono.className}`}>{Number(ts.lop_days)}</td>
                    <td className="px-6 py-3.5"><Badge tone={statusTone(ts.status)} dot>{ts.status.charAt(0) + ts.status.slice(1).toLowerCase()}</Badge></td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/employee/timesheets/${ts.id}`} className="text-[12.5px] font-semibold text-[#5B53E0] hover:underline">{t("employee.view")}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
