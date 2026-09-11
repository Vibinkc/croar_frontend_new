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

/**
 * A report with no parameters: two buttons, CSV and PDF.
 *
 * Most of the new reports take nothing but a format, so the card is factored out rather
 * than repeated six times. The ones that need a cycle picker stay written out in full.
 */
function SimpleReport({
  icon, tone, bg, title, hint, busy, keyBase, run, download,
}: {
  icon: string;
  tone: string;
  bg: string;
  title: string;
  hint: string;
  busy: string | null;
  keyBase: string;
  run: (format: "csv" | "pdf") => Promise<void>;
  download: (key: string, fn: () => Promise<void>) => Promise<void>;
}) {
  return (
    <Card interactive padding="lg" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4 min-w-0">
        <span
          className="w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0"
          style={{ background: bg, color: tone }}
        >
          <i className={`mdi ${icon} text-[22px]`} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#212121]">{title}</h3>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{hint}</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="secondary" size="sm"
          icon={busy === `${keyBase}-csv` ? "hourglass_empty" : "table_view"}
          disabled={busy === `${keyBase}-csv`}
          onClick={() => download(`${keyBase}-csv`, () => run("csv"))}
        >CSV</Button>
        <Button
          variant="secondary" size="sm"
          icon={busy === `${keyBase}-pdf` ? "hourglass_empty" : "picture_as_pdf"}
          disabled={busy === `${keyBase}-pdf`}
          onClick={() => download(`${keyBase}-pdf`, () => run("pdf"))}
        >PDF</Button>
      </div>
    </Card>
  );
}

export default function ReportsPage() {
    const { t: tr } = useI18n();
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [skippedCycle, setSkippedCycle] = useState("");
  const [varFrom, setVarFrom] = useState("");
  const [varTo, setVarTo] = useState("");

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

  // Skipped Summary and Variance both read payslip data, so a never-run cycle has
  // nothing to say. Offering it in the picker only produces a 409.
  const ranCycles = cycles.filter((c) => c.status !== "DRAFT");
  // Comparing a cycle with itself is rejected by the API; disable rather than let
  // the user press it and read an error.
  const varReady = Boolean(varFrom && varTo && varFrom !== varTo);

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("payroll.reportsTitle")}
        subtitle={tr("payroll.reportsSubtitle")}
        help={<><p>{tr("payroll.exportSummaryHelp")}</p><p>{tr("payroll.runCycleFirstHelp")}</p></>}
      />

      {error && (
        <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          {error}
        </div>
      )}

      {/* Stats */}
      <StatGrid className="grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={tr("payroll.statPayrollCycles")}
          value={loading ? "—" : cycles.length}
          icon="event_repeat"
          gradient="linear-gradient(135deg,#42A5F5,#1976D2)"
          glow="rgba(25,118,210,0.28)"
        />
        <StatCard
          label={tr("payroll.statRegisterReady")}
          value={loading ? "—" : readyCount}
          icon="task_alt"
          gradient="linear-gradient(135deg,#66BB6A,#2E7D32)"
          glow="rgba(46,125,50,0.25)"
        />
        <StatCard
          label={tr("payroll.statExportFormats")}
          value="2"
          icon="download"
          gradient="linear-gradient(135deg,#42A5F5,#1565C0)"
          glow="rgba(21,101,192,0.25)"
        />
      </StatGrid>

      {/* ── Reports that answer "why wasn't this person paid?" ──────────────
          Missing Information runs before a cycle, Skipped Summary after it.
          Between them they catch nearly every reason somebody is left out, so
          they lead the page rather than sitting below the registers. */}
      <div className="space-y-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">{tr("payroll.beforeAndAfter")}</h2>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("payroll.beforeAndAfterHint")}</p>
        </div>

        <SimpleReport
          icon="mdi-account-alert"
          tone="#E65100"
          bg="#FFF3E0"
          title={tr("payroll.missingInfoTitle")}
          hint={tr("payroll.missingInfoHint")}
          busy={busy}
          keyBase="missing"
          run={(fmt) => reportsApi.missingInformation(fmt)}
          download={download}
        />

        {/* Skipped Summary needs a cycle, and only a cycle that has been run. */}
        <Card interactive padding="lg" className="flex flex-col gap-3">
          <div className="flex items-start gap-4 min-w-0">
            <span className="w-11 h-11 rounded-[4px] bg-[#FFEBEE] text-[#C62828] flex items-center justify-center shrink-0">
              <i className="mdi mdi-account-off text-[22px]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#212121]">{tr("payroll.skippedTitle")}</h3>
              <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("payroll.skippedHint")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={skippedCycle}
              onChange={(e) => setSkippedCycle(e.target.value)}
              className="h-9 min-w-[200px] rounded-[4px] border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#212121]"
            >
              <option value="">{tr("payroll.chooseCycle")}</option>
              {ranCycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Button
              variant="secondary" size="sm"
              icon={busy === "skipped-csv" ? "hourglass_empty" : "table_view"}
              disabled={!skippedCycle || busy === "skipped-csv"}
              onClick={() => download("skipped-csv", () => reportsApi.skippedSummary(skippedCycle, "csv"))}
            >CSV</Button>
            <Button
              variant="secondary" size="sm"
              icon={busy === "skipped-pdf" ? "hourglass_empty" : "picture_as_pdf"}
              disabled={!skippedCycle || busy === "skipped-pdf"}
              onClick={() => download("skipped-pdf", () => reportsApi.skippedSummary(skippedCycle, "pdf"))}
            >PDF</Button>
          </div>
        </Card>

        {/* Variance compares two cycles, so it needs two pickers. */}
        <Card interactive padding="lg" className="flex flex-col gap-3">
          <div className="flex items-start gap-4 min-w-0">
            <span className="w-11 h-11 rounded-[4px] bg-[#EDE7F6] text-[#5E35B1] flex items-center justify-center shrink-0">
              <i className="mdi mdi-swap-vertical-bold text-[22px]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#212121]">{tr("payroll.varianceTitle")}</h3>
              <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("payroll.varianceHint")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={varFrom}
              onChange={(e) => setVarFrom(e.target.value)}
              className="h-9 min-w-[180px] rounded-[4px] border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#212121]"
            >
              <option value="">{tr("payroll.fromCycle")}</option>
              {ranCycles.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <i className="mdi mdi-arrow-right text-[#9E9E9E]" />
            <select
              value={varTo}
              onChange={(e) => setVarTo(e.target.value)}
              className="h-9 min-w-[180px] rounded-[4px] border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#212121]"
            >
              <option value="">{tr("payroll.toCycle")}</option>
              {ranCycles.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <Button
              variant="secondary" size="sm"
              icon={busy === "variance-csv" ? "hourglass_empty" : "table_view"}
              disabled={!varReady || busy === "variance-csv"}
              title={varFrom && varFrom === varTo ? tr("payroll.pickTwoCycles") : undefined}
              onClick={() => download("variance-csv", () => reportsApi.variance(varFrom, varTo, "csv"))}
            >CSV</Button>
            <Button
              variant="secondary" size="sm"
              icon={busy === "variance-pdf" ? "hourglass_empty" : "picture_as_pdf"}
              disabled={!varReady || busy === "variance-pdf"}
              onClick={() => download("variance-pdf", () => reportsApi.variance(varFrom, varTo, "pdf"))}
            >PDF</Button>
          </div>
          {varFrom && varFrom === varTo && (
            <p className="text-[12px] text-[#E65100]">{tr("payroll.pickTwoCycles")}</p>
          )}
        </Card>
      </div>

      {/* ── Registers and statutory ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">{tr("payroll.registersTitle")}</h2>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("payroll.registersHint")}</p>
        </div>

        <SimpleReport
          icon="mdi-cash-multiple" tone="#00695C" bg="#E0F2F1"
          title={tr("payroll.masterCtcTitle")} hint={tr("payroll.masterCtcHint")}
          busy={busy} keyBase="ctc"
          run={(fmt) => reportsApi.masterCtc(fmt)} download={download}
        />
        <SimpleReport
          icon="mdi-account-group" tone="#1565C0" bg="#E3F2FD"
          title={tr("payroll.hrRegisterTitle")} hint={tr("payroll.hrRegisterHint")}
          busy={busy} keyBase="hrreg"
          run={(fmt) => reportsApi.hrRegister(fmt)} download={download}
        />
        <SimpleReport
          icon="mdi-calculator-variant" tone="#4527A0" bg="#EDE7F6"
          title={tr("payroll.taxComputationTitle")} hint={tr("payroll.taxComputationHint")}
          busy={busy} keyBase="taxcomp"
          run={(fmt) => reportsApi.taxComputation(fmt)} download={download}
        />
        <SimpleReport
          icon="mdi-bank-transfer" tone="#AD1457" bg="#FCE4EC"
          title={tr("payroll.tdsReportTitle")} hint={tr("payroll.tdsReportHint")}
          busy={busy} keyBase="tds"
          run={(fmt) => reportsApi.tds(fmt)} download={download}
        />
      </div>

      {/* Payroll summary (all cycles) */}
      <Card interactive padding="lg" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="w-11 h-11 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
            <i className="mdi mdi-text-box text-[22px]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#212121]">{tr("payroll.payrollSummary")}</h3>
            <p className="text-[12.5px] text-[#757575] mt-0.5">
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
          <h2 className="text-[15px] font-bold text-[#212121]">{tr("payroll.salaryRegister")}</h2>
          <p className="text-[12.5px] text-[#757575] mt-0.5">
            Per-employee earnings, deductions and net pay for a cycle. Available once
            a cycle has been run.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[176px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
            ))}
          </div>
        ) : cycles.length === 0 ? (
          <Card padding="lg" className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5">
              <i className="mdi mdi-receipt text-[32px] text-[#BDBDBD]" />
            </div>
            <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("payroll.noCyclesYet")}</h3>
            <p className="text-[#757575] text-[14px] max-w-xs mx-auto">
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
                    <span className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                      <i className="mdi mdi-receipt text-[20px]" />
                    </span>
                    <Badge tone={STATUS_TONE[c.status as CycleStatus] ?? "neutral"} dot>
                      {c.status}
                    </Badge>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-[#212121] truncate">{c.name}</h3>
                    <p className={`text-[12px] text-[#757575] mt-1 ${jetbrainsMono.className}`}>
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
                      <div className="flex items-center gap-1.5 text-[12px] italic text-[#757575]">
                        <i className="mdi mdi-lock text-[16px]" />
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
