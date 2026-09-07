"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { meApi, type MyPayslip, type ResolvedLine } from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";

const money = (n: number | string, currency = "INR") =>
  Number(n).toLocaleString("en-IN", { style: "currency", currency, maximumFractionDigits: 2 });

function LineTable({ title, lines, currency }: { title: string; lines: ResolvedLine[]; currency: string }) {
  if (!lines || lines.length === 0) return null;
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="px-6 pt-6" title={title} />
      <div className="divide-y divide-[#EEEEEE]">
        {lines.map((l, i) => (
          <div key={`${l.code}-${i}`} className="flex items-center justify-between px-6 py-3">
            <span className="text-[13px] text-[#424242]">{l.label}</span>
            <span className={`text-[13px] font-semibold text-[#212121] ${jetbrainsMono.className}`}>{money(l.amount, currency)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function MyPayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [ps, setPs] = useState<MyPayslip | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    meApi.payslip(id).then(setPs).catch((err) => setError((err as Error).message));
  }, [id]);

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  const currency = ps?.currency || "INR";

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={ps ? (ps.cycle_name || `${ps.period_start} → ${ps.period_end}`) : "Payslip"}
        subtitle={ps ? `Pay date ${ps.pay_date}` : undefined}
        onBack={() => router.push("/employee/payslips")}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <i className="mdi mdi-alert-circle text-[18px]" /> {error}
        </div>
      )}

      {!ps && !error ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />)}</div>
          <div className="h-48 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />
        </div>
      ) : ps ? (
        <>
          <StatGrid className="lg:grid-cols-3">
            <StatCard label={t("employee.grossEarnings")} value={money(ps.gross_earnings, currency)} icon="trending_up" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
            <StatCard label={t("employee.totalDeductions")} value={money(ps.total_deductions, currency)} icon="trending_down" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
            <StatCard label={t("employee.netPay")} value={money(ps.net_pay, currency)} icon="payments" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LineTable title={t("employee.earnings")} lines={ps.earnings ?? []} currency={currency} />
            <LineTable title={t("employee.deductions")} lines={ps.deductions ?? []} currency={currency} />
          </div>
        </>
      ) : null}
    </div>
  );
}
