"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { meApi, type MyPayslip } from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, Button, EmptyState, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";

const money = (n: number | string, currency = "INR") =>
  Number(n).toLocaleString("en-IN", { style: "currency", currency, maximumFractionDigits: 0 });

export default function MyPayslipsPage() {
  const [rows, setRows] = useState<MyPayslip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    meApi.payslips().then(setRows).catch((err) => setError((err as Error).message));
  }, []);

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  const latest = rows?.[0] ?? null;

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title="My Payslips"
        subtitle="Released payslips for your paid pay periods"
        help={<p>Only payslips for finalised (paid) pay periods appear here. Open one to see the full earnings & deductions breakdown.</p>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <StatGrid>
        <StatCard label="Payslips" value={rows ? rows.length : "—"} icon="receipt_long" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
        <StatCard label="Latest net pay" value={latest ? money(latest.net_pay, latest.currency) : "—"} icon="payments" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
        <StatCard label="Latest period" value={latest?.cycle_name || "—"} icon="calendar_month" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
        <StatCard label="Total net paid" value={rows ? money(rows.reduce((s, p) => s + Number(p.net_pay || 0), 0), latest?.currency) : "—"} icon="account_balance_wallet" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title="Payslip history" subtitle="Newest first" />
        {!rows ? (
          <div className="px-6 pb-6 space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-[10px] bg-[#F4F5F7] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="receipt_long" title="No payslips yet" description="Once a pay period is finalised, your payslip will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-[#E8EAED] bg-[#F7F8FA] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Pay date</th>
                  <th className="px-6 py-3">Net pay</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F1]">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F7F8] transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-[#15171C]">{p.cycle_name || `${p.period_start} → ${p.period_end}`}</td>
                    <td className={`px-6 py-3.5 text-[#8A929E] ${jetbrainsMono.className}`}>{p.pay_date}</td>
                    <td className={`px-6 py-3.5 font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{money(p.net_pay, p.currency)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/employee/payslips/${p.id}`} className="text-[12.5px] font-semibold text-[#5B53E0] hover:underline">View</Link>
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
