"use client";

/**
 * Enterprise dashboard.
 *
 * Rebuilt around one question: what needs a person today. The previous version led with a
 * greeting, four decorative module cards carrying hardcoded English feature lists, and a donut
 * that summed candidates, applications, interviews and AI matches into a single total — which is
 * not a quantity of anything, since those are different entities at different stages and one
 * candidate can be several applications.
 *
 * What replaces it:
 *   Queues      work waiting on somebody, biggest first, each one a link to where you clear it.
 *   Pipeline    where live applications stand right now, as a share of those still open.
 *               Deliberately not a funnel: status_id is a current state, so the stages
 *               are disjoint buckets and a stage-to-stage conversion would be
 *               meaningless — and no stage history is kept anywhere to compute one.
 *   Workforce   headcount, probation, recent joiners.
 *   Payroll     the open cycle and the last one paid, including who it skipped.
 *
 * Anything the signed-in user cannot see is absent from the response, so the section simply does
 * not render. A zero would read as "nothing to do", which is a different claim.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import { Badge, Card, Icon, PageHelp } from "@/components/ds";
import ThemeToggle from "@/components/ThemeToggle";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type Tone = "info" | "success" | "warning" | "danger";

interface Queue {
  key: string;
  label: string;
  count: number;
  href: string;
  hint: string;
  tone: Tone;
}

interface Overview {
  as_of: string;
  queues: Queue[];
  pipeline: {
    stages: { stage: string; count: number; share: number }[];
    in_play: number;
    total_applications: number;
    hired: number;
    rejected: number;
    withdrawn: number;
    hire_rate: number;
    job_id: string | null;
  } | null;
  workforce: {
    headcount: number;
    on_probation: number;
    joined_last_30_days: number;
    assets_issued: number;
  } | null;
  upcoming?: UpcomingItem[];
  upcoming_window_days?: number;
  payroll: {
    open_cycle: CycleBrief | null;
    last_paid_cycle: CycleBrief | null;
    currency: string;
    payslips_last_cycle: number;
  } | null;
  hiring?: {
    active_jobs: number;
    total_jobs: number;
    candidates: number;
    applications_30d: number;
    applications_prev_30d: number;
  };
  job_options?: JobOption[];
}

interface UpcomingItem {
  date: string;
  days_away: number;
  label: string;
  detail: string;
  kind: "holiday" | "payroll" | "probation" | "asset" | "interview";
  href: string;
}

interface JobOption {
  id: string;
  title: string;
  status: string;
  /** Applications on this requisition. Shown in the dropdown so you can see which
   *  roles have anybody in them without opening each one. */
  applications: number;
}

type Pipeline = NonNullable<Overview["pipeline"]>;

interface CycleBrief {
  id: string;
  name: string;
  status: string;
  pay_date: string;
  headcount: number;
  net: number;
  skipped: number;
}

const TONE: Record<Tone, { fg: string; bg: string; border: string }> = {
  info: { fg: "#1565C0", bg: "#E3F2FD", border: "#BBDEFB" },
  success: { fg: "#2E7D32", bg: "#E8F5E9", border: "#C8E6C9" },
  warning: { fg: "#E65100", bg: "#FFF3E0", border: "#FFE0B2" },
  danger: { fg: "#C62828", bg: "#FFEBEE", border: "#FFCDD2" },
};

const UPCOMING_KIND: Record<string, { icon: string; fg: string; bg: string }> = {
  holiday: { icon: "mdi-calendar-star", fg: "#00695C", bg: "#E0F2F1" },
  payroll: { icon: "mdi-cash-clock", fg: "#1565C0", bg: "#E3F2FD" },
  probation: { icon: "mdi-account-clock", fg: "#E65100", bg: "#FFF3E0" },
  asset: { icon: "mdi-laptop", fg: "#5E35B1", bg: "#EDE7F6" },
  interview: { icon: "mdi-account-voice", fg: "#00838F", bg: "#E0F7FA" },
};

const CYCLE_TONE: Record<string, "neutral" | "info" | "success" | "indigo" | "danger"> = {
  DRAFT: "neutral",
  PROCESSING: "info",
  APPROVED: "success",
  PAID: "indigo",
  CANCELLED: "danger",
};

function money(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    // An unrecognised currency code should not take the tile down.
    return `${currency} ${Math.round(n).toLocaleString("en-IN")}`;
  }
}

export default function EnterpriseDashboard() {
  const { token } = useAuth();
  const { t } = useI18n();

  const { data, isLoading, error, mutate } = useCachedFetch<Overview>(
    token ? `${BACKEND_URL}/api/v1/enterprise/dashboard/overview` : null,
    { token },
  );

  // On a failed fetch with nothing cached we must not render zeros: an established company
  // would look empty, which is worse than showing an error.
  const loadFailed = !!error && !data;

  // `data?.queues ?? []` creates a fresh array on every render when data is absent, which
  // would make the two memos below recompute each time. Splitting them apart keeps the
  // dependency stable.
  const queues = useMemo(() => data?.queues ?? [], [data]);
  const needsAction = useMemo(() => queues.filter((q) => q.count > 0), [queues]);
  const clear = useMemo(() => queues.filter((q) => q.count === 0), [queues]);

  // ── Pipeline job filter ────────────────────────────────────────────────
  // Filtering is its own fetch against /dashboard/pipeline rather than a parameter on the
  // overview, because narrowing by job must not narrow the queues, workforce or payroll —
  // none of those belong to a single requisition.
  const [jobFilter, setJobFilter] = useState("");
  // The result carries the job it belongs to. That makes a stale result detectable on read,
  // so the effect never has to clear state synchronously just to stay honest.
  const [filtered, setFiltered] = useState<{ jobId: string; data: Pipeline } | null>(null);
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    if (!token || !jobFilter) return;

    let cancelled = false;
    fetch(`${BACKEND_URL}/api/v1/enterprise/dashboard/pipeline?job_id=${jobFilter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      // A late response from a filter the user has already moved off must not land, so the
      // cancelled flag gates the write rather than the request.
      .then((p: Pipeline) => {
        if (!cancelled) setFiltered({ jobId: jobFilter, data: p });
      })
      .catch(() => {
        if (!cancelled) setFiltered(null);
      })
      .finally(() => {
        if (!cancelled) setFiltering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, jobFilter]);

  // The filtered result replaces the company-wide one while a job is selected, and only when
  // it actually belongs to the selected job.
  const forThisJob = filtered?.jobId === jobFilter ? filtered.data : null;
  const pipeline = (jobFilter ? forThisJob : data?.pipeline) ?? null;
  const jobOptions = data?.job_options ?? [];
  const selectedJob = jobOptions.find((j) => j.id === jobFilter) ?? null;

  /**
   * A one-line reading of the pipeline, because a bar chart built from three applications
   * tells you nothing a sentence cannot. This is what the card leads with.
   */
  const pipelineSummary = useMemo(() => {
    if (!pipeline) return null;
    const { in_play, total_applications, stages } = pipeline;
    if (total_applications === 0) return t("dashboard.pipeNoApplications");
    if (in_play === 0) return t("dashboard.pipeNoneOpen", { total: total_applications });
    const busiest = [...stages].sort((a, b) => b.count - a.count)[0];
    const onlyStage = stages.filter((s) => s.count > 0).length === 1;
    return onlyStage
      ? t("dashboard.pipeAllAtOneStage", {
          n: in_play,
          stage: t(`dashboard.stage.${busiest.stage}`),
        })
      : t("dashboard.pipeSpread", {
          n: in_play,
          stage: t(`dashboard.stage.${busiest.stage}`),
          at: busiest.count,
        });
  }, [pipeline, t]);

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">
              {t("dashboard.title")}
            </h1>
            <PageHelp title={t("dashboard.title")}>
              <p>{t("dashboard.helpQueues")}</p>
              <p>{t("dashboard.helpPermissions")}</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{t("dashboard.subtitleNew")}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => void mutate()}
            className="h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] font-semibold text-[#424242] hover:bg-[#F5F6F8] transition-colors flex items-center gap-1.5"
          >
            <Icon name="refresh" className="text-[16px]" />
            {t("common.refresh")}
          </button>
          <ThemeToggle />
        </div>
      </header>

      {loadFailed && (
        <div className="flex items-center justify-between gap-4 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <i className="mdi mdi-alert-circle text-[#E53935]" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#212121]">{t("dashboard.loadFailedTitle")}</p>
              <p className="text-[12px] text-[#757575]">{t("dashboard.loadFailedDesc")}</p>
            </div>
          </div>
          <button
            onClick={() => void mutate()}
            className="shrink-0 px-3 py-1.5 rounded-[4px] bg-[#E53935] text-white text-[12px] font-semibold hover:bg-[#DC2626] transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* ── Needs your attention ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[16px] font-bold text-[#212121]">{t("dashboard.needsAttention")}</h2>
            <p className="text-[12.5px] text-[#757575] mt-0.5">{t("dashboard.needsAttentionHint")}</p>
          </div>
          {data?.as_of && (
            <span className={`text-[11.5px] text-[#9E9E9E] ${mono.className}`}>
              {t("dashboard.asOf")} {new Date(data.as_of).toLocaleTimeString()}
            </span>
          )}
        </div>

        {isLoading && !data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[104px] rounded-[4px] border border-[#E0E0E0] bg-white animate-pulse" />
            ))}
          </div>
        ) : needsAction.length === 0 && !loadFailed ? (
          <Card padding="lg" className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center shrink-0">
              <i className="mdi mdi-check-all text-[24px]" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-[#212121]">{t("dashboard.allClearTitle")}</h3>
              <p className="text-[13px] text-[#757575] mt-0.5">{t("dashboard.allClearDesc")}</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {needsAction.map((q) => {
              const tone = TONE[q.tone] ?? TONE.info;
              return (
                <Link key={q.key} href={q.href} className="group">
                  <div
                    className="h-full rounded-[4px] border bg-white p-4 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                    style={{ borderColor: tone.border }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`text-[30px] font-semibold leading-none ${mono.className}`}
                        style={{ color: tone.fg }}
                      >
                        {q.count}
                      </div>
                      <span
                        className="w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        <i className="mdi mdi-arrow-right text-[16px]" />
                      </span>
                    </div>
                    <div className="text-[13.5px] font-semibold text-[#212121] mt-2.5 group-hover:text-[#1976D2] transition-colors">
                      {q.label}
                    </div>
                    <p className="text-[12px] text-[#757575] mt-1 leading-snug">{q.hint}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Cleared queues stay visible, small — a queue at zero is information, and hiding it
            makes it impossible to tell "nothing waiting" from "not shown to you". */}
        {clear.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {clear.map((q) => (
              <Link
                key={q.key}
                href={q.href}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA] px-2.5 py-1.5 text-[12px] text-[#757575] hover:bg-white hover:text-[#424242] transition-colors"
              >
                <i className="mdi mdi-check text-[14px] text-[#81C784]" />
                {q.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Where candidates are now ─────────────────────────────────────── */}
      {pipeline && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <Card padding="lg" className="lg:col-span-8 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-[16px] font-bold text-[#212121]">{t("dashboard.pipelineTitle")}</h2>

                {jobOptions.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={jobFilter}
                      onChange={(e) => {
                        // Set the loading flag here rather than inside the effect: the effect
                        // may not fire at all (no token), and a spinner that never clears is
                        // worse than no spinner.
                        setFiltering(Boolean(e.target.value));
                        setJobFilter(e.target.value);
                      }}
                      className="h-8 max-w-[260px] rounded-[4px] border border-[#E0E0E0] bg-white px-2 text-[12.5px] text-[#212121] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 outline-none transition-all"
                    >
                      <option value="">{t("dashboard.allJobs")}</option>
                      {jobOptions.map((j) => (
                        <option key={j.id} value={j.id}>
                          {/* The count sits in the label because most requisitions have none,
                              and a list of bare titles hides that. */}
                          {j.title} ({j.applications})
                        </option>
                      ))}
                    </select>
                    {jobFilter && (
                      <button
                        onClick={() => {
                          setFiltering(false);
                          setJobFilter("");
                        }}
                        className="h-8 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[12px] font-semibold text-[#757575] hover:text-[#424242] hover:bg-[#F5F6F8] transition-colors"
                      >
                        {t("dashboard.clearFilter")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* The sentence, not the chart, is the headline. Three applications do not need
                  a visualisation to be understood. */}
              {filtering ? (
                <p className="text-[13px] text-[#9E9E9E]">{t("dashboard.filtering")}</p>
              ) : (
                <p className="text-[13px] text-[#424242] leading-relaxed">
                  {selectedJob && (
                    <span className="font-semibold text-[#212121]">{selectedJob.title}: </span>
                  )}
                  {pipelineSummary}
                </p>
              )}
            </div>

            {pipeline.in_play > 0 && (
              <div className="rounded-[4px] border border-[#EEEEEE] overflow-hidden">
                {pipeline.stages.map((s) => (
                  <div
                    key={s.stage}
                    className="flex items-center gap-3 px-3.5 py-2.5 border-b border-[#F5F5F5] last:border-0"
                  >
                    <span className="w-[104px] shrink-0 text-[13px] font-medium text-[#424242]">
                      {t(`dashboard.stage.${s.stage}`)}
                    </span>
                    {/* Bars are shares of the open pipeline, which is a real proportion of a
                        real total — unlike a stage-to-stage conversion, which this data
                        cannot support. An empty stage shows a hairline so the row still
                        reads as a row. */}
                    <div className="flex-1 h-5 rounded-[3px] bg-[#F5F6F8] overflow-hidden">
                      <div
                        className="h-full rounded-[3px] bg-[#1976D2] transition-all"
                        style={{ width: s.count > 0 ? `${Math.max(s.share, 4)}%` : "0%" }}
                      />
                    </div>
                    <span
                      className={`w-8 shrink-0 text-right text-[14px] font-semibold ${mono.className} ${
                        s.count > 0 ? "text-[#212121]" : "text-[#BDBDBD]"
                      }`}
                    >
                      {s.count}
                    </span>
                    <span
                      className={`w-11 shrink-0 text-right text-[12px] ${mono.className} ${
                        s.count > 0 ? "text-[#757575]" : "text-[#D0D0D0]"
                      }`}
                    >
                      {s.count > 0 ? `${s.share}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Outcomes are separate from stages on purpose: hired, rejected and withdrawn are
                endings, not places an application waits. Mixing them into the same bars is
                what made the old chart unreadable. */}
            <div className="pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9E9E9E] mb-2">
                {t("dashboard.outcomesLabel")}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: t("dashboard.stage.Hired"), value: pipeline.hired, color: "#2E7D32", bg: "#E8F5E9" },
                  { label: t("dashboard.rejected"), value: pipeline.rejected, color: "#C62828", bg: "#FFEBEE" },
                  { label: t("dashboard.withdrawn"), value: pipeline.withdrawn, color: "#757575", bg: "#F5F6F8" },
                  { label: t("dashboard.hireRate"), value: `${pipeline.hire_rate}%`, color: "#1565C0", bg: "#E3F2FD" },
                ].map((o) => (
                  <div key={o.label} className="rounded-[4px] px-3 py-2" style={{ background: o.bg }}>
                    <div className={`text-[17px] font-semibold leading-none ${mono.className}`} style={{ color: o.color }}>
                      {o.value}
                    </div>
                    <div className="text-[11px] text-[#757575] mt-1">{o.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11.5px] text-[#9E9E9E] leading-snug pt-1 border-t border-[#F5F5F5]">
              {t(selectedJob ? "dashboard.pipelineFootnoteJob" : "dashboard.pipelineFootnote", {
                total: pipeline.total_applications,
              })}
            </p>
          </Card>

          {/* Hiring + workforce, compact */}
          <div className="lg:col-span-4 space-y-5">
            {data?.hiring && (
              <Card padding="lg" className="space-y-3">
                <h3 className="text-[14px] font-bold text-[#212121]">{t("dashboard.openRoles")}</h3>
                <div className="flex items-end gap-2">
                  <span className={`text-[34px] font-semibold leading-none text-[#1565C0] ${mono.className}`}>
                    {data.hiring.active_jobs}
                  </span>
                  <span className="text-[12.5px] text-[#757575] pb-1">
                    {t("dashboard.ofTotalJobs", { total: data.hiring.total_jobs })}
                  </span>
                </div>
                <p className="text-[12px] text-[#757575] leading-snug">{t("dashboard.openRolesHint")}</p>
                <div className="pt-2 border-t border-[#EEEEEE] space-y-1.5 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#757575]">{t("dashboard.candidatePool")}</span>
                    <b className={`text-[#212121] ${mono.className}`}>{data.hiring.candidates}</b>
                  </div>
                  {/* A count alone cannot tell a filling pipeline from a dried-up one, so the
                      previous 30 days sits beside it. */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#757575]">{t("dashboard.apps30d")}</span>
                    <span className={mono.className}>
                      <b className="text-[#212121]">{data.hiring.applications_30d}</b>
                      <span className="text-[#9E9E9E]"> / {data.hiring.applications_prev_30d}</span>
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#9E9E9E] leading-snug pt-0.5">
                    {data.hiring.applications_30d === 0 && data.hiring.applications_prev_30d === 0
                      ? t("dashboard.apps30dNone")
                      : t("dashboard.apps30dHint")}
                  </p>
                </div>
              </Card>
            )}

            {data?.workforce && (
              <Card padding="lg" className="space-y-3">
                <h3 className="text-[14px] font-bold text-[#212121]">{t("dashboard.workforceTitle")}</h3>
                {[
                  { label: t("dashboard.headcount"), value: data.workforce.headcount },
                  { label: t("dashboard.onProbation"), value: data.workforce.on_probation },
                  { label: t("dashboard.joined30"), value: data.workforce.joined_last_30_days },
                  { label: t("dashboard.assetsIssued"), value: data.workforce.assets_issued },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-[13px]">
                    <span className="text-[#616161]">{row.label}</span>
                    <b className={`text-[#212121] ${mono.className}`}>{row.value}</b>
                  </div>
                ))}
                <Link href="/enterprise/employees" className="block pt-1 text-[12.5px] font-semibold text-[#1976D2] hover:underline">
                  {t("dashboard.viewEmployees")}
                </Link>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ── Payroll ──────────────────────────────────────────────────────── */}
      {data?.payroll && (
        <section className="space-y-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#212121]">{t("dashboard.payrollTitle")}</h2>
            <p className="text-[12.5px] text-[#757575] mt-0.5">{t("dashboard.payrollHint")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ["open", data.payroll.open_cycle, t("dashboard.openCycle"), t("dashboard.noOpenCycle")],
              ["paid", data.payroll.last_paid_cycle, t("dashboard.lastPaid"), t("dashboard.noPaidCycle")],
            ] as [string, CycleBrief | null, string, string][]).map(([key, cycle, heading, empty]) => (
              <Card key={key} padding="lg" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[14px] font-bold text-[#212121]">{heading}</h3>
                  {cycle && <Badge tone={CYCLE_TONE[cycle.status] ?? "neutral"}>{cycle.status}</Badge>}
                </div>
                {!cycle ? (
                  <p className="text-[13px] text-[#757575]">{empty}</p>
                ) : (
                  <>
                    <div className="text-[15px] font-semibold text-[#212121]">{cycle.name}</div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.05em] text-[#9E9E9E]">
                          {t("dashboard.netPay")}
                        </div>
                        <div className={`text-[18px] font-semibold text-[#212121] ${mono.className}`}>
                          {money(cycle.net, data.payroll!.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.05em] text-[#9E9E9E]">
                          {t("dashboard.employeesPaid")}
                        </div>
                        <div className={`text-[18px] font-semibold text-[#212121] ${mono.className}`}>
                          {cycle.headcount}
                        </div>
                      </div>
                    </div>
                    {/* Who the run left out. Reading zero here is the point — a non-zero is
                        the first thing to chase after a run. */}
                    {cycle.skipped > 0 && (
                      <Link
                        href="/enterprise/payroll/reports"
                        className="flex items-center gap-2 rounded-[4px] bg-[#FFEBEE] border border-[#FFCDD2] px-3 py-2 text-[12.5px] font-semibold text-[#C62828] hover:bg-[#FFE5E5] transition-colors"
                      >
                        <i className="mdi mdi-account-off text-[15px]" />
                        {t("dashboard.skippedCount", { n: cycle.skipped })}
                      </Link>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[#EEEEEE] text-[12.5px]">
                      <span className="text-[#757575]">
                        {t("dashboard.payDate")}{" "}
                        <span className={mono.className}>{cycle.pay_date}</span>
                      </span>
                      <Link href={`/enterprise/payroll/${cycle.id}`} className="font-semibold text-[#1976D2] hover:underline">
                        {t("dashboard.openCycleLink")}
                      </Link>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Coming up ────────────────────────────────────────────────────────
          The only section that looks forwards. The queues say what is late and the counts
          say what exists; a probation decision or a public holiday is only useful to know
          before the date, so it gets its own dated list. */}
      {data?.upcoming && (
        <section className="space-y-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#212121]">{t("dashboard.upcomingTitle")}</h2>
            <p className="text-[12.5px] text-[#757575] mt-0.5">
              {t("dashboard.upcomingHint", { days: data.upcoming_window_days ?? 30 })}
            </p>
          </div>

          {data.upcoming.length === 0 ? (
            <Card padding="lg">
              <p className="text-[13px] text-[#757575]">
                {t("dashboard.upcomingEmpty", { days: data.upcoming_window_days ?? 30 })}
              </p>
            </Card>
          ) : (
            <Card padding="none" className="overflow-hidden">
              {data.upcoming.map((e, i) => {
                const kind = UPCOMING_KIND[e.kind] ?? UPCOMING_KIND.holiday;
                // "Today" and "Tomorrow" read better than "+0d"; past that, a day count is
                // clearer than a date the reader has to subtract from.
                const when =
                  e.days_away === 0
                    ? t("dashboard.today")
                    : e.days_away === 1
                      ? t("dashboard.tomorrow")
                      : t("dashboard.inDays", { n: e.days_away });
                return (
                  <Link
                    key={`${e.kind}-${e.date}-${i}`}
                    href={e.href}
                    className="flex items-start gap-3.5 px-4 py-3 border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors group"
                  >
                    <span
                      className="w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: kind.bg, color: kind.fg }}
                    >
                      <i className={`mdi ${kind.icon} text-[18px]`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[13.5px] font-semibold text-[#212121] group-hover:text-[#1976D2] transition-colors">
                          {e.label}
                        </span>
                        <span className={`text-[12px] ${mono.className} text-[#9E9E9E]`}>{e.date}</span>
                      </div>
                      <p className="text-[12px] text-[#757575] mt-0.5 leading-snug">{e.detail}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[12px] font-semibold whitespace-nowrap mt-1 ${mono.className}`}
                      style={{ color: e.days_away <= 3 ? "#E65100" : "#9E9E9E" }}
                    >
                      {when}
                    </span>
                  </Link>
                );
              })}
            </Card>
          )}
        </section>
      )}

      {/* ── Jump to ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-bold text-[#212121]">{t("dashboard.jumpTo")}</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: t("dashboard.linkPilot"), href: "/enterprise/croar-pilot", icon: "robot" },
            { label: t("dashboard.linkPostJob"), href: "/enterprise/jobs/create", icon: "plus-box" },
            { label: t("dashboard.linkAttendance"), href: "/enterprise/attendance", icon: "fingerprint" },
            { label: t("dashboard.linkPayroll"), href: "/enterprise/payroll", icon: "cash-multiple" },
            { label: t("dashboard.linkReports"), href: "/enterprise/payroll/reports", icon: "file-chart" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-2 rounded-[4px] border border-[#E0E0E0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#424242] hover:border-[#90CAF9] hover:text-[#1565C0] hover:bg-[#F5FAFE] transition-colors"
            >
              <i className={`mdi mdi-${l.icon} text-[17px]`} />
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
