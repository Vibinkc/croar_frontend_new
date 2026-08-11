"use client";

import { use, useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import {
  payrollApi,
  type Adjustment,
  type AdjustmentKind,
  type Employee,
  type PayrollCycle,
  type Payslip,
  type SkippedEmployee,
  inr,
} from "@/utils/payroll/api";
import { Banner, Modal, StatusBadge } from "@/components/payroll/ui";
import { PageHeader } from "@/components/ds";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";

export default function CycleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { can } = useAuth();
  const { t: tr } = useI18n();
  const { confirm } = useDialog();
  const canEdit = can("payroll:configure");
  const [cycle, setCycle] = useState<PayrollCycle | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skipped, setSkipped] = useState<SkippedEmployee[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sentinel select value meaning "apply this adjustment to every employee".
  const ALL_EMPLOYEES = "__all__";
  const emptyAdj = { employee_id: "", kind: "earning" as AdjustmentKind, code: "", label: "", amount: "", note: "" };
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjErr, setAdjErr] = useState<string | null>(null);
  const [adjForm, setAdjForm] = useState(emptyAdj);

  async function load() {
    setLoading(true);
    try {
      const c = await payrollApi.getCycle(id);
      setCycle(c);
      // Payslips (computed summary) are available as soon as a run generates
      // them — i.e. any status past DRAFT. The backend gates DRAFT/CANCELLED.
      if (c.status !== "DRAFT" && c.status !== "CANCELLED") {
        setPayslips(await payrollApi.listCyclePayslips(id));
      } else {
        setPayslips([]);
      }
      // Adjustments are editable only before approval; load them then.
      if (c.status === "DRAFT" || c.status === "PROCESSING") {
        setAdjustments(await payrollApi.listAdjustments(id));
      } else {
        setAdjustments([]);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function addAdjustment(e: React.FormEvent) {
    e.preventDefault();
    setAdjErr(null);
    setAdjSaving(true);
    try {
      const base = {
        kind: adjForm.kind,
        code: adjForm.code,
        label: adjForm.label,
        amount: Number(adjForm.amount),
        note: adjForm.note || null,
      };
      if (adjForm.employee_id === ALL_EMPLOYEES) {
        if (employees.length === 0) throw new Error(tr("payroll.noEmployeesToApply"));
        // Fan out: one adjustment per employee (backend takes a single employee_id).
        await Promise.all(
          employees.map((emp) => payrollApi.addAdjustment(id, { ...base, employee_id: emp.id }))
        );
      } else {
        await payrollApi.addAdjustment(id, { ...base, employee_id: adjForm.employee_id });
      }
      setAdjOpen(false);
      setAdjForm(emptyAdj);
      await load();
    } catch (err) {
      setAdjErr((err as Error).message);
    } finally {
      setAdjSaving(false);
    }
  }

  async function removeAdjustment(a: Adjustment) {
    await act(
      () => payrollApi.deleteAdjustment(a.id),
      tr("payroll.removeAdjustmentConfirm", { label: a.label, amount: inr(a.amount) })
    );
  }

  useEffect(() => {
    load();
    payrollApi.listEmployees().then(setEmployees).catch(() => {});
  }, [id]);

  const name = (eid: string) => {
    const e = employees.find((x) => x.id === eid);
    return e ? `${e.first_name} ${e.last_name}`.trim() : tr("payroll.employeeShort", { id: eid.slice(0, 8) });
  };

  async function act(fn: () => Promise<unknown>, confirmMsg?: string) {
    if (confirmMsg && !(await confirm(confirmMsg))) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await payrollApi.runCycle(id);
      setSkipped(res.skipped);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-12 text-center text-[var(--color-muted)]">{tr("common.loading")}</p>;
  if (!cycle) return <p className="p-12 text-center text-[var(--color-muted)]">{tr("payroll.cycleNotFound")}</p>;

  const t = cycle.totals ?? {};

  return (
    <div className="px-4 sm:px-5 md:px-7 py-6 max-w-[1320px] mx-auto w-full animate-fade-in flex flex-col gap-6">
      <div>
        <Link href="/enterprise/payroll" className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-primary)]">
          <span className="material-symbols-rounded text-[18px]">arrow_back</span> {tr("payroll.backToPayroll")}
        </Link>
        <PageHeader
          title={cycle.name}
          subtitle={`${cycle.period_start} → ${cycle.period_end} · ${tr("payroll.payDate")} ${cycle.pay_date}`}
          help={tr("payroll.cycleDetailHelp")}
          actions={<StatusBadge status={cycle.status} />}
        />
      </div>

      {error && <Banner>{error}</Banner>}

      {skipped.length > 0 && (
        <Banner tone="warn">
          <div className="mb-1 flex items-center justify-between">
            <strong>
              {tr("payroll.employeesSkipped", { count: skipped.length })}
            </strong>
            <button onClick={() => setSkipped([])} className="text-xs underline">
              {tr("payroll.dismiss")}
            </button>
          </div>
          <ul className="list-disc pl-5">
            {skipped.map((s) => (
              <li key={s.employee_id}>
                {name(s.employee_id)} —{" "}
                <Link href="/enterprise/payroll/structures" className="underline">
                  {tr("payroll.configureSalary")}
                </Link>
              </li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {cycle.status !== "DRAFT" && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <h3 className="mb-4 border-b border-[var(--color-border)] pb-2 font-semibold">{tr("payroll.cycleTotals")}</h3>
              <Row label={tr("payroll.headcount")} value={String(t.headcount ?? 0)} />
              <Row label={tr("payroll.gross")} value={inr(t.gross ?? 0)} />
              <Row label={tr("payroll.deductions")} value={`- ${inr(t.deductions ?? 0)}`} tone="text-[var(--color-danger)]" />
              <div className="mt-2 border-t border-dashed border-[var(--color-border)] pt-2">
                <Row label={tr("payroll.netPayout")} value={inr(t.net ?? 0)} big tone="text-[var(--color-accent)]" />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <h3 className="mb-4 border-b border-[var(--color-border)] pb-2 font-semibold">{tr("payroll.lifecycle")}</h3>
            <div className="flex flex-col gap-3">
              {(cycle.status === "DRAFT" || cycle.status === "PROCESSING") && can("payroll:run") && (
                <button onClick={run} disabled={busy} className="btn-primary">
                  {busy ? tr("payroll.runProcessing") : cycle.status === "DRAFT" ? tr("payroll.runPayroll") : tr("payroll.rerunRecalculate")}
                </button>
              )}
              {cycle.status === "PROCESSING" && can("payroll:approve") && (
                <button
                  onClick={() => act(() => payrollApi.approveCycle(id), tr("payroll.approveConfirm"))}
                  disabled={busy}
                  className="btn-accent"
                >
                  {tr("payroll.approvePayroll")}
                </button>
              )}
              {cycle.status === "APPROVED" && can("payroll:pay") && (
                <button
                  onClick={() => act(() => payrollApi.markPaidCycle(id), tr("payroll.markPaidConfirm"))}
                  disabled={busy}
                  className="btn-accent"
                >
                  {tr("payroll.markAsPaid")}
                </button>
              )}
              {cycle.status !== "PAID" && cycle.status !== "CANCELLED" && can("payroll:manage") && (
                <button
                  onClick={() => act(() => payrollApi.cancelCycle(id), tr("payroll.cancelCycleConfirm"))}
                  disabled={busy}
                  className="rounded-lg border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  {tr("payroll.cancelCycle")}
                </button>
              )}
              {cycle.status === "PAID" && (
                <p className="text-center text-sm italic text-[var(--color-muted)]">
                  {tr("payroll.cycleDisbursed")}
                </p>
              )}
              {cycle.status === "CANCELLED" && (
                <p className="text-center text-sm italic text-[var(--color-muted)]">{tr("payroll.cycleWasCancelled")}</p>
              )}
              {!can("payroll:run") && !can("payroll:approve") && !can("payroll:pay") && !can("payroll:manage") && (
                <p className="text-center text-sm italic text-[var(--color-muted)]">
                  {tr("payroll.readOnlyAccess")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: payslips */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-semibold">{tr("payroll.employeePayslips")}</h3>
            {payslips.length > 0 && (
              <span className="text-xs text-[var(--color-muted)]">
                {tr("payroll.employeesCalculated", { count: payslips.length })}
              </span>
            )}
          </div>
          {cycle.status === "DRAFT" || cycle.status === "CANCELLED" ? (
            <div className="py-12 text-center text-[var(--color-muted)]">
              <span className="material-symbols-rounded mb-2 text-4xl text-[var(--color-dim)]">receipt_long</span>
              <p>
                {cycle.status === "DRAFT"
                  ? tr("payroll.runToGeneratePayslips")
                  : tr("payroll.cycleWasCancelled")}
              </p>
            </div>
          ) : payslips.length === 0 ? (
            <p className="py-8 text-center text-[var(--color-muted)]">{tr("payroll.noPayslipsInCycle")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-[var(--color-muted)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-3 py-3">{tr("payroll.employee")}</th>
                    <th className="px-3 py-3">{tr("payroll.lopPaid")}</th>
                    <th className="px-3 py-3 text-right">{tr("payroll.gross")}</th>
                    <th className="px-3 py-3 text-right">{tr("payroll.deductions")}</th>
                    <th className="px-3 py-3 text-right">{tr("payroll.net")}</th>
                    <th className="px-3 py-3 text-right">{tr("payroll.slip")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-3 py-3 font-medium">{name(p.employee_id)}</td>
                      <td className="px-3 py-3 text-[var(--color-muted)]">
                        {Number(p.lop_days)} / {Number(p.paid_days ?? 0)}
                      </td>
                      <td className="px-3 py-3 text-right">{inr(p.gross_earnings)}</td>
                      <td className="px-3 py-3 text-right text-[var(--color-danger)]">- {inr(p.total_deductions)}</td>
                      <td className="px-3 py-3 text-right font-semibold">{inr(p.net_pay)}</td>
                      <td className="px-3 py-3 text-right">
                        {cycle.status === "PAID" ? (
                          <Link
                            href={`/enterprise/payroll/payslips/${p.id}`}
                            className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs hover:bg-[var(--color-hover)]"
                          >
                            {tr("payroll.view")}
                          </Link>
                        ) : (
                          <span
                            title={tr("payroll.payslipReleasedTitle")}
                            className="text-xs italic text-[var(--color-dim)]"
                          >
                            {tr("payroll.pending")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(cycle.status === "DRAFT" || cycle.status === "PROCESSING") && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <div>
              <h3 className="font-semibold">{tr("payroll.adjustments")}</h3>
              <p className="text-xs text-[var(--color-muted)]">
                {tr("payroll.adjustmentsDesc")}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => {
                  setAdjErr(null);
                  setAdjForm(emptyAdj);
                  setAdjOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                <span className="material-symbols-rounded text-[18px]">add</span>{" "}
                {tr("payroll.addAdjustment")}
              </button>
            )}
          </div>
          {adjustments.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">
              {tr("payroll.noAdjustments")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-[var(--color-muted)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-3 py-2">{tr("payroll.employee")}</th>
                    <th className="px-3 py-2">{tr("payroll.type")}</th>
                    <th className="px-3 py-2">{tr("payroll.detail")}</th>
                    <th className="px-3 py-2 text-right">{tr("payroll.amount")}</th>
                    {canEdit && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((a) => (
                    <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-3 py-2 font-medium">{name(a.employee_id)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            a.kind === "earning"
                              ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                              : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                          }`}
                        >
                          {a.kind === "earning" ? tr("payroll.earning") : tr("payroll.deduction")}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {a.label}{" "}
                        <span className="font-mono text-xs text-[var(--color-dim)]">{a.code}</span>
                        {a.note && <div className="text-xs text-[var(--color-muted)]">{a.note}</div>}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          a.kind === "earning" ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"
                        }`}
                      >
                        {a.kind === "earning" ? "+ " : "- "}
                        {inr(a.amount)}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => removeAdjustment(a)}
                            disabled={busy}
                            title={tr("payroll.removeAdjustment")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-dim)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                          >
                            <span className="material-symbols-rounded text-[18px]">delete</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {adjOpen && (
        <Modal title={tr("payroll.addAdjustment")} onClose={() => setAdjOpen(false)}>
          <form onSubmit={addAdjustment} className="flex flex-col gap-4">
            {adjErr && <Banner>{adjErr}</Banner>}
            <label className="flex flex-col gap-1.5">
              <span className="lbl">{tr("payroll.employee")}</span>
              <select
                className="input"
                required
                value={adjForm.employee_id}
                onChange={(e) => setAdjForm({ ...adjForm, employee_id: e.target.value })}
              >
                <option value="">{tr("payroll.select")}</option>
                {employees.length > 0 && (
                  <option value={ALL_EMPLOYEES}>
                    {tr("payroll.allEmployeesCount", { count: employees.length })}
                  </option>
                )}
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="lbl">{tr("payroll.type")}</span>
                <select
                  className="input"
                  value={adjForm.kind}
                  onChange={(e) => setAdjForm({ ...adjForm, kind: e.target.value as AdjustmentKind })}
                >
                  <option value="earning">{tr("payroll.earningAddsToPay")}</option>
                  <option value="deduction">{tr("payroll.deductionSubtracts")}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="lbl">{tr("payroll.amount")}</span>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={adjForm.amount}
                  onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="lbl">{tr("payroll.code")}</span>
                <input
                  className="input uppercase"
                  maxLength={64}
                  required
                  placeholder="BONUS"
                  value={adjForm.code}
                  onChange={(e) => setAdjForm({ ...adjForm, code: e.target.value.toUpperCase() })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="lbl">{tr("payroll.label")}</span>
                <input
                  className="input"
                  maxLength={120}
                  required
                  placeholder={tr("payroll.festivalBonusExample")}
                  value={adjForm.label}
                  onChange={(e) => setAdjForm({ ...adjForm, label: e.target.value })}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="lbl">{tr("payroll.noteOptional")}</span>
              <input
                className="input"
                maxLength={500}
                value={adjForm.note}
                onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
              />
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={adjSaving} className="btn-primary">
                {adjSaving ? tr("payroll.adding") : tr("payroll.addAdjustment")}
              </button>
              <button
                type="button"
                onClick={() => setAdjOpen(false)}
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-hover)] py-2.5 text-sm font-semibold"
              >
                {tr("common.cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone = "text-[var(--color-text)]",
  big = false,
}: {
  label: string;
  value: string;
  tone?: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className={`font-semibold ${tone} ${big ? "text-2xl" : "text-base"}`}>{value}</span>
    </div>
  );
}
