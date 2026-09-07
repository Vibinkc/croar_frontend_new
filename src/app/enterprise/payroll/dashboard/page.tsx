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
        <div className="h-12 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
        <StatGrid>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[108px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
          ))}
        </StatGrid>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-[220px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
          <div className="h-[220px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
        <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
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
            gradient="linear-gradient(135deg,#42A5F5,#1976D2)"
            glow="rgba(25,118,210,0.28)"
            className="h-full"
          />
        </Link>
        <Link href="/enterprise/payroll/structures" className="block">
          <StatCard
            icon="tune"
            label={tr("payroll.statActiveStructures")}
            value={data.active_structures}
            gradient="linear-gradient(135deg,#42A5F5,#1565C0)"
            glow="rgba(21,101,192,0.25)"
            className="h-full"
          />
        </Link>
        <Link href="/enterprise/payroll" className="block">
          <StatCard
            icon="calendar_month"
            label={tr("payroll.statPayrollCycles")}
            value={data.cycles.total}
            gradient="linear-gradient(135deg,#FFB74D,#EF6C00)"
            glow="rgba(239,108,0,0.25)"
            className="h-full"
          />
        </Link>
        <StatCard
          icon="payments"
          label={tr("payroll.statNetDisbursed")}
          value={inr(data.payroll.net_paid, cur)}
          gradient="linear-gradient(135deg,#66BB6A,#2E7D32)"
          glow="rgba(46,125,50,0.25)"
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
                  <div className="text-[18px] font-bold text-[#212121]">{cc.name}</div>
                  <div className="text-[12.5px] text-[#757575] mt-0.5">
                    {cc.period_start} → {cc.period_end} · Pay date {cc.pay_date}
                  </div>
                </div>
                <Link href={`/enterprise/payroll/${cc.id}`}>
                  <Button size="sm">{tr("payroll.manage")}</Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Mini label={tr("payroll.miniHeadcount")} value={String(cc.headcount)} />
                <Mini label={tr("payroll.miniNetPay")} value={inr(cc.net, cur)} tone="text-[#2E7D32]" />
                <Mini label={tr("payroll.miniPendingNet")} value={inr(data.payroll.pending_net, cur)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-14 h-14 rounded-[4px] bg-[#F5F6F8] text-[#757575] flex items-center justify-center">
                <i className="mdi mdi-calendar-remove text-[28px]" />
              </div>
              <p className="text-[13px] text-[#757575]">{tr("payroll.noPayrollCyclesYet")}</p>
              <Link href="/enterprise/payroll" className="text-[13px] font-semibold text-[#1976D2] hover:underline">
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
              <span className="text-[#757575]">{tr("payroll.configured")}</span>
              <span className={`font-semibold text-[#2E7D32] ${jetbrainsMono.className}`}>{data.employees.configured}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-[13px]">
              <span className="text-[#757575]">{tr("payroll.missingSetup")}</span>
              {data.employees.missing > 0 ? (
                <Link href="/enterprise/payroll/structures" className={`font-semibold text-[#C62828] underline ${jetbrainsMono.className}`}>
                  {data.employees.missing}
                </Link>
              ) : (
                <span className={`font-semibold text-[#212121] ${jetbrainsMono.className}`}>0</span>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <CardHeader title={tr("payroll.cyclesByStatusTitle")} />
            <div className="flex flex-col gap-2.5">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <CycleBadge status={s} />
                  <span className={`text-[13.5px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>
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
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-[#E0E0E0]">
          <h3 className="text-[15px] font-bold text-[#212121]">{tr("payroll.recentCycles")}</h3>
          <Link href="/enterprise/payroll" className="text-[12.5px] font-semibold text-[#1976D2] hover:underline">
            View all →
          </Link>
        </div>
        {data.recent_cycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-[4px] bg-[#F5F6F8] text-[#757575] flex items-center justify-center mb-3">
              <i className="mdi mdi-history text-[28px]" />
            </div>
            <p className="text-[13px] text-[#757575]">{tr("payroll.noCyclesYet")}</p>
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1.6fr_1fr_0.8fr_1fr] gap-4 px-6 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.cycle")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.period")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("payroll.status")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("payroll.headcount")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("payroll.netPay")}</span>
            </div>

            <div className="divide-y divide-[#EEEEEE]">
              {data.recent_cycles.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.6fr_1fr_0.8fr_1fr] gap-x-4 gap-y-1.5 items-center px-4 md:px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                >
                  {/* Cycle */}
                  <div className="min-w-0">
                    <Link
                      href={`/enterprise/payroll/${c.id}`}
                      className="block text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate"
                    >
                      {c.name}
                    </Link>
                    {/* mobile-only meta */}
                    <div className="md:hidden mt-1 text-[12px] text-[#757575]">
                      {c.period_start} → {c.period_end}
                    </div>
                  </div>

                  {/* Period (desktop) */}
                  <div className="hidden md:block text-[13px] text-[#424242] truncate">
                    {c.period_start} → {c.period_end}
                  </div>

                  {/* Status (desktop) */}
                  <div className="hidden md:flex items-center">
                    <CycleBadge status={c.status} />
                  </div>

                  {/* Headcount (desktop) */}
                  <div className={`hidden md:block text-[13px] text-[#424242] text-right ${jetbrainsMono.className}`}>
                    {c.headcount || "—"}
                  </div>

                  {/* Net pay + mobile status */}
                  <div className="flex items-center justify-end gap-2.5">
                    <span className="md:hidden">
                      <CycleBadge status={c.status} />
                    </span>
                    <span className={`text-[13.5px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>
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

function Mini({ label, value, tone = "text-[#212121]" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{label}</div>
      <div className={`text-[17px] font-bold mt-1 ${tone} ${jetbrainsMono.className}`}>{value}</div>
    </div>
  );
}

function Coverage({ configured, total }: { configured: number; total: number }) {
  const pct = total > 0 ? Math.round((configured / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className={`font-semibold text-[#212121] ${jetbrainsMono.className}`}>{pct}%</span>
        <span className={`text-[#757575] ${jetbrainsMono.className}`}>{configured}/{total}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEEEEE]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#66BB6A,#2E7D32)" }}
        />
      </div>
    </div>
  );
}
