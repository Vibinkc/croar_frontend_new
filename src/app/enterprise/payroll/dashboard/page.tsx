"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import { payrollApi, inr, type DashboardSummary } from "@/utils/payroll/api";
import { Badge, Button, Card, CardHeader, PageHeader, StatCard, StatGrid, jetbrainsMono } from "@/components/ds";
import { useAuth } from "@/components/payroll/AuthProvider";

const STATUS_ORDER = ["DRAFT", "PROCESSING", "APPROVED", "PAID", "CANCELLED"] as const;

// Map payroll cycle statuses onto the design-system Badge tones.
const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "indigo" | "danger"> = {
  DRAFT: "neutral",
  PROCESSING: "info",
  APPROVED: "success",
  PAID: "indigo",
  CANCELLED: "danger",
};

function CycleBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>
      {status}
    </Badge>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
    const { t: tr } = useI18n();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payrollApi
      .getDashboard()
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
        <div className="h-12 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
        <StatGrid>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[108px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
          ))}
        </StatGrid>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-[220px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
          <div className="h-[220px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
        <div className="rounded-[14px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cur = data.currency;
  const cc = data.current_cycle;
  const firstName = (user?.full_name || user?.email || "").split(/[\s@]/)[0];

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.dashboardTitle")}
        subtitle={`${firstName ? `Welcome back, ${firstName}. ` : ""}Here's your payroll at a glance.`}
        help={<>
          <p>Your payroll at a glance — current cycle, salary coverage and disbursement.</p>
          <p>Start or continue running payroll from here, or jump to any payroll page.</p>
        </>}
        actions={
          <Link href="/enterprise/payroll">
            <Button icon="account_balance_wallet">{tr("payroll.goToPayroll")}</Button>
          </Link>
        }
      />

      {/* Headline metrics */}
      <StatGrid>
        <Link href="/enterprise/employees" className="block">
          <StatCard
            icon="groups"
            label={tr("payroll.statEmployees")}
            value={data.employees.total}
            gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
            glow="rgba(91,83,224,0.28)"
            className="h-full"
          />
        </Link>
        <Link href="/enterprise/payroll/structures" className="block">
          <StatCard
            icon="tune"
            label={tr("payroll.statActiveStructures")}
            value={data.active_structures}
            gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
            glow="rgba(53,89,199,0.25)"
            className="h-full"
          />
        </Link>
        <Link href="/enterprise/payroll" className="block">
          <StatCard
            icon="calendar_month"
            label={tr("payroll.statPayrollCycles")}
            value={data.cycles.total}
            gradient="linear-gradient(135deg,#F6B65C,#D97706)"
            glow="rgba(217,119,6,0.25)"
            className="h-full"
          />
        </Link>
        <StatCard
          icon="payments"
          label={tr("payroll.statNetDisbursed")}
          value={inr(data.payroll.net_paid, cur)}
          gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
          glow="rgba(14,138,110,0.25)"
          className="h-full"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Current cycle */}
        <Card padding="lg" className="lg:col-span-2">
          <CardHeader
            title={tr("payroll.currentCycleTitle")}
            action={cc ? <CycleBadge status={cc.status} /> : undefined}
          />
          {cc ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[18px] font-bold text-[#15171C]">{cc.name}</div>
                  <div className="text-[12.5px] text-[#8A929E] mt-0.5">
                    {cc.period_start} → {cc.period_end} · Pay date {cc.pay_date}
                  </div>
                </div>
                <Link href={`/enterprise/payroll/${cc.id}`}>
                  <Button size="sm">{tr("payroll.manage")}</Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Mini label={tr("payroll.miniHeadcount")} value={String(cc.headcount)} />
                <Mini label={tr("payroll.miniNetPay")} value={inr(cc.net, cur)} tone="text-[#0E8A6E]" />
                <Mini label={tr("payroll.miniPendingNet")} value={inr(data.payroll.pending_net, cur)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-14 h-14 rounded-[14px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center">
                <span className="material-symbols-rounded text-[28px]">event_busy</span>
              </div>
              <p className="text-[13px] text-[#8A929E]">{tr("payroll.noPayrollCyclesYet")}</p>
              <Link href="/enterprise/payroll" className="text-[13px] font-semibold text-[#5B53E0] hover:underline">
                Create the first cycle →
              </Link>
            </div>
          )}
        </Card>

        {/* Salary coverage + status breakdown */}
        <div className="flex flex-col gap-5">
          <Card padding="lg">
            <CardHeader title={tr("payroll.salaryCoverageTitle")} />
            <Coverage configured={data.employees.configured} total={data.employees.total} />
            <div className="mt-4 flex justify-between text-[13px]">
              <span className="text-[#8A929E]">{tr("payroll.configured")}</span>
              <span className={`font-semibold text-[#0E8A6E] ${jetbrainsMono.className}`}>{data.employees.configured}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-[13px]">
              <span className="text-[#8A929E]">{tr("payroll.missingSetup")}</span>
              {data.employees.missing > 0 ? (
                <Link href="/enterprise/payroll/structures" className={`font-semibold text-[#C0383C] underline ${jetbrainsMono.className}`}>
                  {data.employees.missing}
                </Link>
              ) : (
                <span className={`font-semibold text-[#15171C] ${jetbrainsMono.className}`}>0</span>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <CardHeader title={tr("payroll.cyclesByStatusTitle")} />
            <div className="flex flex-col gap-2.5">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <CycleBadge status={s} />
                  <span className={`text-[13.5px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>
                    {data.cycles.by_status[s] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent cycles */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-[#E8EAED]">
          <h3 className="text-[15px] font-bold text-[#15171C]">{tr("payroll.recentCycles")}</h3>
          <Link href="/enterprise/payroll" className="text-[12.5px] font-semibold text-[#5B53E0] hover:underline">
            View all →
          </Link>
        </div>
        {data.recent_cycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-[14px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center mb-3">
              <span className="material-symbols-rounded text-[28px]">history</span>
            </div>
            <p className="text-[13px] text-[#8A929E]">{tr("payroll.noCyclesYet")}</p>
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1.6fr_1fr_0.8fr_1fr] gap-4 px-6 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.cycle")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.period")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("payroll.status")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.headcount")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{tr("payroll.netPay")}</span>
            </div>

            <div className="divide-y divide-[#F0F0F1]">
              {data.recent_cycles.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.6fr_1fr_0.8fr_1fr] gap-x-4 gap-y-1.5 items-center px-4 md:px-6 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                >
                  {/* Cycle */}
                  <div className="min-w-0">
                    <Link
                      href={`/enterprise/payroll/${c.id}`}
                      className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate"
                    >
                      {c.name}
                    </Link>
                    {/* mobile-only meta */}
                    <div className="md:hidden mt-1 text-[12px] text-[#8A929E]">
                      {c.period_start} → {c.period_end}
                    </div>
                  </div>

                  {/* Period (desktop) */}
                  <div className="hidden md:block text-[13px] text-[#374151] truncate">
                    {c.period_start} → {c.period_end}
                  </div>

                  {/* Status (desktop) */}
                  <div className="hidden md:flex items-center">
                    <CycleBadge status={c.status} />
                  </div>

                  {/* Headcount (desktop) */}
                  <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                    {c.headcount || "—"}
                  </div>

                  {/* Net pay + mobile status */}
                  <div className="flex items-center justify-end gap-2.5">
                    <span className="md:hidden">
                      <CycleBadge status={c.status} />
                    </span>
                    <span className={`text-[13.5px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>
                      {inr(c.net, cur)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Mini({ label, value, tone = "text-[#15171C]" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[12px] border border-[#E8EAED] bg-[#F8FAFC] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{label}</div>
      <div className={`text-[17px] font-bold mt-1 ${tone} ${jetbrainsMono.className}`}>{value}</div>
    </div>
  );
}

function Coverage({ configured, total }: { configured: number; total: number }) {
  const pct = total > 0 ? Math.round((configured / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className={`font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{pct}%</span>
        <span className={`text-[#8A929E] ${jetbrainsMono.className}`}>{configured}/{total}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F2F5]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#34D399,#0E8A6E)" }}
        />
      </div>
    </div>
  );
}
