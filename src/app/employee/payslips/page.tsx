"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { meApi, type MyPayslip } from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, Button, EmptyState, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

const money = (n: number | string, currency = "INR") =>
  Number(n).toLocaleString("en-IN", { style: "currency", currency, maximumFractionDigits: 0 });

export default function MyPayslipsPage() {
  const { t } = useI18n();
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
        title={t("employee.myPayslipsTitle")}
        subtitle={t("employee.myPayslipsSubtitle")}
        help={<p>{t("employee.myPayslipsHelp")}</p>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <i className="mdi mdi-alert-circle text-[18px]" /> {error}
        </div>
      )}

      <StatGrid>
        <StatCard label={t("employee.payslips")} value={rows ? rows.length : "—"} icon="receipt_long" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
        <StatCard label={t("employee.latestNetPay")} value={latest ? money(latest.net_pay, latest.currency) : "—"} icon="payments" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
        <StatCard label={t("employee.latestPeriod")} value={latest?.cycle_name || "—"} icon="calendar_month" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
        <StatCard label={t("employee.totalNetPaid")} value={rows ? money(rows.reduce((s, p) => s + Number(p.net_pay || 0), 0), latest?.currency) : "—"} icon="account_balance_wallet" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title={t("employee.payslipHistory")} subtitle={t("employee.newestFirst")} />
        {!rows ? (
          <div className="px-6 pb-6 space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-[4px] bg-[#F5F6F8] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="receipt_long" title={t("employee.noPayslips")} description={t("employee.noPayslipsDesc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-[#E0E0E0] bg-[#FAFAFA] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">
                  <th className="px-6 py-3">{t("employee.colPeriod")}</th>
                  <th className="px-6 py-3">{t("employee.colPayDate")}</th>
                  <th className="px-6 py-3">{t("employee.colNetPay")}</th>
                  <th className="px-6 py-3 text-right">{t("employee.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-[#212121]">{p.cycle_name || `${p.period_start} → ${p.period_end}`}</td>
                    <td className={`px-6 py-3.5 text-[#757575] ${jetbrainsMono.className}`}>{p.pay_date}</td>
                    <td className={`px-6 py-3.5 font-semibold text-[#212121] ${jetbrainsMono.className}`}>{money(p.net_pay, p.currency)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/employee/payslips/${p.id}`} className="text-[12.5px] font-semibold text-[#1976D2] hover:underline">{t("employee.view")}</Link>
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
