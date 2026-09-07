"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  meApi,
  type LeaveBalance,
  type LeaveRequest,
  type MyPayslip,
  type Timesheet,
} from "@/utils/payroll/api";
import { useAuth } from "@/components/payroll/AuthProvider";
import {
  Badge, Card, CardHeader, HeroBand, PageHeader, StatCard, jetbrainsMono,
} from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/context/I18nContext";

const money = (n: number | string, currency = "INR") =>
  Number(n).toLocaleString("en-IN", { style: "currency", currency, maximumFractionDigits: 0 });

// Module quick-access cards — mirrors the enterprise dashboard module grid.
const MODULES = [
  { titleKey: "navTimesheets", descKey: "moduleTimesheetsDesc", icon: "schedule", path: "/employee/timesheets", color: "indigo" },
  { titleKey: "navLeave", descKey: "moduleLeaveDesc", icon: "event_available", path: "/employee/leave", color: "emerald" },
  { titleKey: "navPayslips", descKey: "modulePayslipsDesc", icon: "receipt_long", path: "/employee/payslips", color: "indigo" },
  { titleKey: "navSkillAssessments", descKey: "moduleSkillAssessmentsDesc", icon: "quiz", path: "/employee/skill-assessments", color: "amber" },
];

const moduleChip: Record<string, string> = {
  indigo: "bg-[#E3F2FD] text-[#1976D2]",
  emerald: "bg-[#E8F5E9] text-[#2E7D32]",
  amber: "bg-[#FFF3E0] text-[#EF6C00]",
};

const statusTone = (s: string): "success" | "warning" | "danger" | "neutral" => {
  const u = (s || "").toUpperCase();
  if (u === "APPROVED") return "success";
  if (u === "PENDING") return "warning";
  if (u === "REJECTED") return "danger";
  return "neutral";
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [payslips, setPayslips] = useState<MyPayslip[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [surveyCount, setSurveyCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("welcomeBack");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "goodMorning" : h < 18 ? "goodAfternoon" : "goodEvening");
  }, []);

  useEffect(() => {
    Promise.all([
      meApi.leaveBalances(),
      meApi.leaveRequests(),
      meApi.payslips(),
      meApi.timesheets(),
      meApi.my360Assignments(),
      meApi.mySurveyInvites(),
    ])
      .then(([b, r, p, t, fb, sv]) => {
        setBalances(b);
        setRequests(r);
        setPayslips(p);
        setTimesheets(t);
        setFeedbackCount(fb.length);
        setSurveyCount(sv.length);
        setError(null);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const firstName = (user?.full_name || user?.email || "").split(" ")[0] || t("employee.there");
  const leaveAvailable = balances.filter((b) => b.is_paid !== false).reduce((s, b) => s + Number(b.balance), 0);
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const latestPayslip = payslips[0] ?? null;
  const latestTimesheet = timesheets[0] ?? null;
  const pendingTasks = feedbackCount + surveyCount;

  const stats = [
    { label: t("employee.leaveAvailable"), value: leaveAvailable, icon: "event_available", grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
    { label: t("employee.pendingRequests"), value: pending, icon: "hourglass_top", grad: "linear-gradient(135deg,#FFB74D,#EF6C00)", glow: "rgba(239,108,0,0.25)" },
    { label: t("employee.latestNetPay"), value: latestPayslip ? money(latestPayslip.net_pay, latestPayslip.currency) : "—", icon: "payments", grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.28)" },
    { label: t("employee.timesheet"), value: latestTimesheet?.status ?? "—", icon: "schedule", grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)" },
  ];

  if (loading) {
    return (
      <div className="px-4 sm:px-5 md:px-7 pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
        <div className="h-14 rounded-[4px] bg-[#F5F6F8] animate-pulse" />
        <div className="h-52 rounded-[4px] bg-[#E0E0E0] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-56 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />
          <div className="lg:col-span-4 h-56 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />
        </div>
      </div>
    );
  }

  if (isNoEmployeeLink(error)) {
    return <div className="px-4 sm:px-5 md:px-7 pb-7 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;
  }

  const needsAttention = [
    { show: feedbackCount > 0, count: feedbackCount, label: t("employee.attn360"), icon: "rate_review", href: "/employee/feedback", color: "text-[#1976D2] bg-[#E3F2FD]" },
    { show: surveyCount > 0, count: surveyCount, label: t("employee.attnSurveys"), icon: "poll", href: "/employee/surveys", color: "text-[#EF6C00] bg-[#FFF3E0]" },
    { show: pending > 0, count: pending, label: t("employee.attnLeave"), icon: "hourglass_top", href: "/employee/leave", color: "text-[#2E7D32] bg-[#E8F5E9]" },
  ].filter((i) => i.show);

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={t("employee.dashboardTitle")}
        subtitle={t("employee.dashboardSubtitle")}
        help={<><p>{t("employee.dashboardHelp1")}</p><p>{t("employee.dashboardHelp2")}</p></>}
        actions={<ThemeToggle />}
      />

      {error && !isNoEmployeeLink(error) && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <span className="material-symbols-rounded text-[18px]">error</span> {t("employee.dashLoadError")} {error}
        </div>
      )}

      {/* Hero band with embedded stat cards (mirrors enterprise dashboard) */}
      <HeroBand>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-7">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-white/[0.08] border border-white/10 text-[10px] font-semibold text-[#BDBDBD] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#66BB6A] animate-pulse" />
              {t("employee.myWorkspaceLower")}
            </div>
            <h1 className="text-[30px] md:text-[38px] font-extrabold tracking-[-1px] leading-[1.05]" style={{ color: "#ffffff" }}>
              {t(`employee.${greeting}`)}, <span style={{ color: "#42A5F5" }}>{firstName}</span>
            </h1>
            <p className="text-[#9E9E9E] text-[14.5px] leading-relaxed mt-3 max-w-md">
              {pendingTasks > 0 ? (
                <>{t("employee.youHave")} <span className={`text-white font-semibold ${jetbrainsMono.className}`}>{pendingTasks}</span> {pendingTasks === 1 ? t("employee.taskToCompleteSuffix") : t("employee.tasksToCompleteSuffix")}</>
              ) : (
                t("employee.allCaughtUpSnapshot")
              )}
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <Link href="/employee/leave" className="h-[44px] px-5 bg-[#1976D2] text-white rounded-[4px] text-[14px] font-semibold hover:bg-[#1565C0] transition-colors shadow-[0_8px_20px_rgba(25,118,210,0.4)] flex items-center gap-2">
                <span className="material-symbols-rounded text-[19px]">event_available</span> {t("employee.requestLeave")}
              </Link>
              <Link href="/employee/timesheets" className="h-[44px] px-5 bg-white/[0.08] border border-white/15 text-white rounded-[4px] text-[14px] font-semibold hover:bg-white/[0.14] transition-colors flex items-center gap-2">
                <span className="material-symbols-rounded text-[19px]">schedule</span> {t("employee.markAttendance")}
              </Link>
            </div>
          </div>

          <div className="relative z-10 w-full lg:w-[360px] shrink-0 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <StatCard key={s.label} dark label={s.label} value={s.value} icon={s.icon} gradient={s.grad} glow={s.glow} />
            ))}
          </div>
        </div>
      </HeroBand>

      {/* Modules + needs-attention */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((m) => (
            <Link href={m.path} key={m.titleKey} className="group h-full">
              <Card interactive className="h-full flex flex-col">
                <div className={`w-11 h-11 rounded-[4px] ${moduleChip[m.color]} flex items-center justify-center mb-4`}>
                  <span className="material-symbols-rounded text-xl">{m.icon}</span>
                </div>
                <h3 className="text-[15px] font-bold text-[#212121] tracking-[-0.2px] group-hover:text-[#1976D2] transition-colors">{t(`employee.${m.titleKey}`)}</h3>
                <p className="text-[13px] text-[#757575] leading-relaxed mt-1 mb-4 flex-1">{t(`employee.${m.descKey}`)}</p>
                <div className="flex items-center gap-1 text-[12px] font-semibold text-[#1976D2]">
                  {t("employee.open")} <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="lg:col-span-4 h-full">
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[15px] font-bold text-[#212121]">{t("employee.needsAttention")}</span>
              <div className="w-2.5 h-2.5 rounded-full bg-[#66BB6A] border-4 border-[#E8F5E9]" />
            </div>
            {needsAttention.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-3">
                  <span className="material-symbols-rounded text-2xl">task_alt</span>
                </div>
                <p className="text-[14px] font-semibold text-[#212121]">{t("employee.allCaughtUp")}</p>
                <p className="text-[12px] text-[#757575] mt-1">{t("employee.tasksShowUpHere")}</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {needsAttention.map((i) => (
                  <Link key={i.label} href={i.href} className="flex items-center gap-3 p-3 rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 hover:bg-[#F5F6F8]/60 transition-colors group">
                    <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 ${i.color}`}>
                      <span className="material-symbols-rounded text-xl">{i.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[19px] font-semibold text-[#212121] leading-none ${jetbrainsMono.className}`}>{i.count}</span>
                      <p className="text-[12px] text-[#757575] leading-tight mt-1">{i.label}</p>
                    </div>
                    <span className="material-symbols-rounded text-[#BDBDBD] group-hover:text-[#1976D2] group-hover:translate-x-0.5 transition-all">chevron_right</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Leave balances + recent requests */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="none" className="overflow-hidden">
          <CardHeader className="px-6 pt-6" title={t("employee.leaveBalances")} subtitle={t("employee.leaveBalancesSubtitle")}
            action={<Link href="/employee/leave" className="text-[12.5px] font-semibold text-[#1976D2] hover:underline">{t("employee.viewAll")}</Link>} />
          {balances.length === 0 ? (
            <p className="px-6 pb-6 pt-1 text-center text-[13px] text-[#757575]">{t("employee.noLeaveBalances")}</p>
          ) : (
            <div className="divide-y divide-[#EEEEEE]">
              {balances.map((b) => {
                const left = Number(b.balance);
                const total = Number(b.accrued) || 1;
                const pct = Math.max(0, Math.min(100, (left / total) * 100));
                return (
                  <div key={b.id} className="px-6 py-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#212121]">{b.leave_type_name || b.leave_type_code}</span>
                      <span className="text-[12px] text-[#757575]">
                        <span className={`font-bold text-[#212121] ${jetbrainsMono.className}`}>{left}</span> {t("employee.left")} · {Number(b.used)} {t("employee.used")}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEEEEE]">
                      <div className="h-full rounded-full bg-[#1976D2]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card padding="none" className="overflow-hidden">
          <CardHeader className="px-6 pt-6" title={t("employee.recentLeaveRequests")} subtitle={t("employee.recentLeaveRequestsSubtitle")}
            action={<Link href="/employee/leave" className="text-[12.5px] font-semibold text-[#1976D2] hover:underline">{t("employee.viewAll")}</Link>} />
          {requests.length === 0 ? (
            <p className="px-6 pb-6 pt-1 text-center text-[13px] text-[#757575]">{t("employee.noLeaveRequests")}</p>
          ) : (
            <div className="divide-y divide-[#EEEEEE]">
              {requests.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#212121]">{r.leave_type_name || r.leave_type_code}</div>
                    <div className={`text-[12px] text-[#757575] ${jetbrainsMono.className}`}>
                      {r.start_date}{r.start_date !== r.end_date ? ` → ${r.end_date}` : ""}
                    </div>
                  </div>
                  <Badge tone={statusTone(r.status)} dot>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
