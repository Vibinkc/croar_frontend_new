"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  payrollApi,
  type Employee,
  type PayrollCycle,
  type SalaryStructure,
  inr,
} from "@/utils/payroll/api";
import { Banner, Modal, PageHeader, StatCard, StatusBadge } from "@/components/payroll/ui";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";

export default function PayrollHome() {
  const { can } = useAuth();
  const { confirm, alert } = useDialog();
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    period_start: "",
    period_end: "",
    pay_date: "",
    notes: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [c, e, s] = await Promise.all([
        payrollApi.listCycles(),
        payrollApi.listEmployees(),
        payrollApi.listStructures(),
      ]);
      setCycles(c);
      setEmployees(e);
      setStructures(s);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const configuredIds = useMemo(
    () => new Set(structures.filter((s) => s.is_active).map((s) => s.employee_id)),
    [structures]
  );
  const missing = employees.filter((e) => !configuredIds.has(e.id)).length;
  const current = cycles.find((c) => c.status !== "PAID" && c.status !== "CANCELLED") ?? cycles[0];

  function openModal() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${y}-${pad(m + 1)}-01`;
    const endDate = new Date(y, m + 1, 0);
    const end = `${y}-${pad(m + 1)}-${pad(endDate.getDate())}`;
    setForm({
      name: `${now.toLocaleString("en-US", { month: "long" })} ${y}`,
      period_start: start,
      period_end: end,
      pay_date: end,
      notes: "",
    });
    setShowModal(true);
  }

  async function createCycle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await payrollApi.createCycle(form);
      setShowModal(false);
      await load();
    } catch (err) {
      await alert({ message: (err as Error).message, tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const ok = await confirm({
      title: "Delete draft cycle",
      message: "Delete this draft cycle? This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await payrollApi.deleteCycle(id);
      await load();
    } catch (err) {
      await alert({ message: (err as Error).message, tone: "danger" });
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        icon="payments"
        title="Payroll"
        subtitle="Run monthly payroll cycles and review payslips."
      >
        {can("payroll:configure") && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            <span className="material-symbols-rounded text-[20px]">add</span>
            New Cycle
          </button>
        )}
      </PageHeader>

      {error && <Banner>{error}</Banner>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="groups" label="Total Employees" value={loading ? "…" : employees.length} />
        <StatCard icon="task_alt" label="Salary Configured" value={loading ? "…" : configuredIds.size} />
        <Link href="/enterprise/payroll/structures">
          <StatCard
            icon="warning"
            label={missing > 0 ? "Missing Setup — configure" : "Missing Setup"}
            value={loading ? "…" : missing}
            tone={missing > 0 ? "text-[var(--color-danger)]" : "text-slate-900"}
          />
        </Link>
        <StatCard
          icon="payments"
          label={current ? `Current Net (${current.name})` : "Current Net"}
          value={loading ? "…" : inr(current?.totals?.net ?? 0)}
          tone="text-emerald-600"
        />
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="font-semibold">Payroll Cycles</h2>
        </div>
        {loading ? (
          <p className="p-8 text-center text-[var(--color-muted)]">Loading…</p>
        ) : cycles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="material-symbols-rounded text-4xl text-[var(--color-dim)]">calendar_month</span>
            <p className="text-[var(--color-muted)]">No payroll cycles yet. Create one to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-muted)]">
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-6 py-3">Cycle</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Headcount</th>
                  <th className="px-6 py-3 text-right">Net Pay</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-6 py-4 font-semibold">{c.name}</td>
                    <td className="px-6 py-4 text-[var(--color-muted)]">
                      {c.period_start} → {c.period_end}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">{c.totals?.headcount ?? "—"}</td>
                    <td className="px-6 py-4 text-right">{inr(c.totals?.net ?? 0)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === "DRAFT" && can("payroll:manage") && (
                          <button
                            onClick={() => remove(c.id)}
                            className="rounded-md px-2 py-1 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                          >
                            Delete
                          </button>
                        )}
                        <Link
                          href={`/enterprise/payroll/${c.id}`}
                          className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <Modal title="Create Payroll Cycle" onClose={() => setShowModal(false)}>
          <form onSubmit={createCycle} className="flex flex-col gap-4">
            <Field label="Cycle Name">
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Period Start">
                <input
                  required
                  type="date"
                  className="input"
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                />
              </Field>
              <Field label="Period End">
                <input
                  required
                  type="date"
                  className="input"
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Pay Date">
              <input
                required
                type="date"
                className="input"
                value={form.pay_date}
                onChange={(e) => setForm({ ...form, pay_date: e.target.value })}
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                className="input min-h-20"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <div className="mt-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create Cycle"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-hover)] py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
