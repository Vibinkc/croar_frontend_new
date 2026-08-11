"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import {
  payrollApi,
  reportsApi,
  type PayrollCycle,
  type CycleStatus,
} from "@/utils/payroll/api";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  StatCard,
  StatGrid,
  jetbrainsMono,
} from "@/components/ds";

const STATUS_TONE: Record<
  CycleStatus,
  "indigo" | "neutral" | "success" | "info" | "warning" | "danger" | "teal"
> = {
  DRAFT: "neutral",
  PROCESSING: "info",
  APPROVED: "success",
  PAID: "indigo",
  CANCELLED: "danger",
};

export default function ReportsPage() {
    const { t: tr } = useI18n();
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    payrollApi
      .listCycles()
      .then(setCycles)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function download(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // A salary register exists only once a cycle has actually been run (payslips
  // created → reflected in totals.headcount). Gating on this instead of
  // "status !== DRAFT" keeps run-then-cancelled cycles exportable for audit
  // while locking never-run ones (incl. cancelled-before-run) that would
  // otherwise export an empty file.
  const hasRegister = (c: PayrollCycle) => (c.totals?.headcount ?? 0) > 0;
  const readyCount = cycles.filter(hasRegister).length;
  const noCycles = cycles.length === 0;

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.reportsTitle")}
        subtitle={tr("payroll.reportsSubtitle")}
        help={<><p>{tr("payroll.exportSummaryHelp")}</p><p>{tr("payroll.runCycleFirstHelp")}</p></>}
      />

      {error && (
        <div className="rounded-[10px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          {error}
        </div>
      )}

      {/* Stats */}
      <StatGrid className="grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={tr("payroll.statPayrollCycles")}
          value={loading ? "—" : cycles.length}
          icon="event_repeat"
          gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
          glow="rgba(91,83,224,0.28)"
        />
        <StatCard
          label={tr("payroll.statRegisterReady")}
          value={loading ? "—" : readyCount}
          icon="task_alt"
          gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
          glow="rgba(14,138,110,0.25)"
        />
        <StatCard
          label={tr("payroll.statExportFormats")}
          value="2"
          icon="download"
          gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
          glow="rgba(53,89,199,0.25)"
        />
      </StatGrid>

      {/* Payroll summary (all cycles) */}
      <Card interactive padding="lg" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="w-11 h-11 rounded-[12px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded text-[22px]">summarize</span>
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#15171C]">{tr("payroll.payrollSummary")}</h3>
            <p className="text-[12.5px] text-[#8A929E] mt-0.5">
              {tr("payroll.cycleLevelTotals")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={busy === "summary-csv" ? "hourglass_empty" : "table_view"}
            disabled={busy === "summary-csv" || noCycles}
            title={noCycles ? "No payroll cycles to summarise yet" : undefined}
            onClick={() => download("summary-csv", () => reportsApi.payrollSummary("csv"))}
          >
            CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={busy === "summary-pdf" ? "hourglass_empty" : "picture_as_pdf"}
            disabled={busy === "summary-pdf" || noCycles}
            title={noCycles ? "No payroll cycles to summarise yet" : undefined}
            onClick={() => download("summary-pdf", () => reportsApi.payrollSummary("pdf"))}
          >
            PDF
          </Button>
        </div>
      </Card>

      {/* Salary register per cycle */}
      <div className="space-y-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#15171C]">{tr("payroll.salaryRegister")}</h2>
          <p className="text-[12.5px] text-[#8A929E] mt-0.5">
            Per-employee earnings, deductions and net pay for a cycle. Available once
            a cycle has been run.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[176px] bg-[#F4F5F7] rounded-[14px] animate-pulse" />
            ))}
          </div>
        ) : cycles.length === 0 ? (
          <Card padding="lg" className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
              <span className="material-symbols-rounded text-[32px] text-[#C7CCD4]">receipt_long</span>
            </div>
            <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">{tr("payroll.noCyclesYet")}</h3>
            <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto">
              Once you create and run a payroll cycle, its salary register will be available to export here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.map((c) => {
              const ready = hasRegister(c);
              return (
                <Card
                  key={c.id}
                  interactive
                  padding="md"
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-[20px]">receipt_long</span>
                    </span>
                    <Badge tone={STATUS_TONE[c.status as CycleStatus] ?? "neutral"} dot>
                      {c.status}
                    </Badge>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-[#15171C] truncate">{c.name}</h3>
                    <p className={`text-[12px] text-[#8A929E] mt-1 ${jetbrainsMono.className}`}>
                      {c.period_start} → {c.period_end}
                    </p>
                  </div>

                  <div className="mt-auto pt-1">
                    {ready ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          icon={busy === `reg-csv-${c.id}` ? "hourglass_empty" : "table_view"}
                          disabled={busy === `reg-csv-${c.id}`}
                          onClick={() =>
                            download(`reg-csv-${c.id}`, () =>
                              reportsApi.salaryRegister(c.id, "csv")
                            )
                          }
                        >
                          CSV
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          icon={busy === `reg-pdf-${c.id}` ? "hourglass_empty" : "picture_as_pdf"}
                          disabled={busy === `reg-pdf-${c.id}`}
                          onClick={() =>
                            download(`reg-pdf-${c.id}`, () =>
                              reportsApi.salaryRegister(c.id, "pdf")
                            )
                          }
                        >
                          PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[12px] italic text-[#8A929E]">
                        <span className="material-symbols-rounded text-[16px]">lock</span>
                        {c.status === "CANCELLED" ? "Cancelled — no register" : "Run the cycle first"}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
