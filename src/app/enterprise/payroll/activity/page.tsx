"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { auditApi, type AuditEntry } from "@/utils/payroll/api";
import { Banner } from "@/components/payroll/ui";
import { Badge, Card, PageHeader, jetbrainsMono } from "@/components/ds";
import { Activity, ChevronLeft, ChevronRight, History } from "@/components/icons";

const PAGE_SIZE = 10;

type StatusTone = "success" | "info" | "warning" | "danger";

function statusTone(code: number): StatusTone {
  if (code < 300) return "success";
  if (code < 400) return "info";
  if (code < 500) return "warning";
  return "danger";
}

// The backend derives a friendly label for known payroll actions (e.g.
// "Ran payroll cycle"). Anything it can't map falls back to the raw request
// signature "<METHOD> <path>". The audit middleware only records *mutations*
// (POST/PUT/PATCH/DELETE), so a raw entry is still a real action — we must NOT
// hide it just because it lacks a label (that dropped genuine events like leave
// approvals). We only filter raw *read* signatures (GET/HEAD/OPTIONS), which are
// legacy noise from older builds that recorded reads.
const RAW_READ_ACTIVITY = /^(GET|HEAD|OPTIONS)\s+\/api\//i;

function isRawRead(entry: AuditEntry): boolean {
  return RAW_READ_ACTIVITY.test(entry.action);
}

function when(iso: string): string {
  // Backend audit timestamps are naive server-LOCAL (Postgres now()), not UTC.
  // A datetime string without a timezone is parsed as local time by JS, which
  // matches how it was stored — so don't append "Z" (that shifted it by the
  // local offset and showed the wrong time).
  return new Date(iso).toLocaleString();
}

export default function ActivityPage() {
  const { t: tr } = useI18n();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    auditApi
      .list(200)
      .then((rows) => setEntries(rows.filter((row) => !isRawRead(row))))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  // Clamp the page if the data shrinks (e.g. after a refetch).
  const currentPage = Math.min(page, totalPages);
  const pageEntries = useMemo(
    () => entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [entries, currentPage]
  );
  const rangeStart = entries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, entries.length);

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.activityTitle")}
        subtitle={tr("payroll.activitySubtitle")}
        help={<><p>{tr("payroll.activityHelp")}</p></>}
      />

      {error && <Banner>{error}</Banner>}

      {loading ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
            ))}
          </div>
        </Card>
      ) : entries.length === 0 ? (
        <Card padding="none">
          <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
            <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5">
              <History className="w-8 h-8 text-[#BDBDBD]" />
            </div>
            <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">
              {tr("payroll.noActivity")}
            </h3>
            <p className="text-[#757575] text-[14px] max-w-xs mx-auto">
              {tr("payroll.noActivityDesc")}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-[#EEEEEE]">
              {pageEntries.map((e) => {
                const tone = statusTone(e.status_code);
                return (
                  <div
                    key={e.id}
                    className="flex items-start gap-3.5 px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors"
                  >
                    {/* Icon chip / timeline rail */}
                    <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-[17px] h-[17px]" />
                    </span>

                    {/* Actor + action */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[14px] font-bold text-[#212121] truncate">
                          {e.actor_email ?? tr("payroll.unknown")}
                        </span>
                        <Badge tone={tone}>{e.status_code}</Badge>
                      </div>
                      <p className="text-[13px] text-[#424242] mt-0.5 break-words">{e.action}</p>
                      <span
                        className={`block text-[11.5px] text-[#757575] mt-1 ${jetbrainsMono.className}`}
                      >
                        {when(e.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-[13px] text-[#757575]">
              {tr("payroll.showingRange", { start: rangeStart, end: rangeEnd, total: entries.length })}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-[4px] bg-white border border-[#E0E0E0] text-[13px] font-semibold text-[#424242] hover:bg-[#F5F6F8] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> {tr("payroll.prev")}
              </button>
              <span className={`text-[12.5px] text-[#757575] ${jetbrainsMono.className}`}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-[4px] bg-white border border-[#E0E0E0] text-[13px] font-semibold text-[#424242] hover:bg-[#F5F6F8] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                {tr("payroll.next")} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
