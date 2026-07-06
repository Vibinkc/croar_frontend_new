"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      <div className="divide-y divide-[#F0F0F1]">
        {lines.map((l, i) => (
          <div key={`${l.code}-${i}`} className="flex items-center justify-between px-6 py-3">
            <span className="text-[13px] text-[#374151]">{l.label}</span>
            <span className={`text-[13px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{money(l.amount, currency)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function MyPayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      {!ps && !error ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[14px] bg-[#F4F5F7] border border-[#E8EAED] animate-pulse" />)}</div>
          <div className="h-48 rounded-[14px] bg-[#F4F5F7] border border-[#E8EAED] animate-pulse" />
        </div>
      ) : ps ? (
        <>
          <StatGrid className="lg:grid-cols-3">
            <StatCard label="Gross earnings" value={money(ps.gross_earnings, currency)} icon="trending_up" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
            <StatCard label="Total deductions" value={money(ps.total_deductions, currency)} icon="trending_down" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
            <StatCard label="Net pay" value={money(ps.net_pay, currency)} icon="payments" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
          </StatGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LineTable title="Earnings" lines={ps.earnings ?? []} currency={currency} />
            <LineTable title="Deductions" lines={ps.deductions ?? []} currency={currency} />
          </div>
        </>
      ) : null}
    </div>
  );
}
