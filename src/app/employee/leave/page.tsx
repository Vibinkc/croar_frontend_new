"use client";

import { useEffect, useState } from "react";
import {
  meApi,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveType,
} from "@/utils/payroll/api";
import { useDialog } from "@/components/payroll/DialogProvider";
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, Badge, Button,
  Field, Input, Select, Textarea, EmptyState, jetbrainsMono,
} from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

const EMPTY = { leave_type_id: "", start_date: "", end_date: "", half_day: false, reason: "" };

const statusTone = (s: string): "success" | "warning" | "danger" | "neutral" => {
  const u = (s || "").toUpperCase();
  if (u === "APPROVED") return "success";
  if (u === "PENDING") return "warning";
  if (u === "REJECTED" || u === "CANCELLED") return "danger";
  return "neutral";
};

export default function MyLeavePage() {
  const { confirm } = useDialog();
  const { t: tr } = useI18n();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    try {
      const [b, r, t] = await Promise.all([
        meApi.leaveBalances(),
        meApi.leaveRequests(),
        meApi.leaveTypes(),
      ]);
      setBalances(b);
      setRequests(r);
      setTypes(t);
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

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    try {
      await meApi.fileLeave({
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.half_day ? form.start_date : form.end_date,
        half_day: form.half_day,
        reason: form.reason || null,
      });
      setOpen(false);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setFormErr((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    if (!(await confirm(tr("employee.confirmCancelLeave")))) return;
    setBusy(true);
    try {
      await meApi.cancelLeave(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  const available = balances.filter((b) => b.is_paid !== false).reduce((s, b) => s + Number(b.balance), 0);
  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={tr("employee.myLeaveTitle")}
        subtitle={tr("employee.myLeaveSubtitle")}
        help={<><p>{tr("employee.myLeaveHelp1")}</p><p>{tr("employee.myLeaveHelp2")}</p></>}
        actions={<Button icon="add" onClick={() => { setFormErr(null); setForm(EMPTY); setOpen(true); }}>{tr("employee.requestLeave")}</Button>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <StatGrid>
        <StatCard label={tr("employee.paidDaysavailable")} value={loading ? "—" : available} icon="event_available" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
        <StatCard label={tr("employee.pendingRequests")} value={loading ? "—" : pending} icon="hourglass_top" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
        <StatCard label={tr("employee.leaveTypes")} value={loading ? "—" : types.length} icon="category" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
        <StatCard label={tr("employee.totalRequests")} value={loading ? "—" : requests.length} icon="fact_check" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
      </StatGrid>

      {/* Balances */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title={tr("employee.leaveBalances")} subtitle={tr("employee.daysRemainingPerType")} />
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-6 pb-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-[12px] bg-[#F4F5F7] animate-pulse" />)}
          </div>
        ) : balances.length === 0 ? (
          <p className="px-6 pb-6 pt-1 text-center text-[13px] text-[#8A929E]">{tr("employee.noLeaveBalances")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-6 pb-6">
            {balances.map((b) => (
              <div key={b.id} className="rounded-[12px] border border-[#E8EAED] bg-[#F8FAFC] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{b.leave_type_name || b.leave_type_code}</div>
                <div className={`text-[24px] font-semibold text-[#15171C] mt-1 ${jetbrainsMono.className}`}>{Number(b.balance)}</div>
                <div className="text-[11.5px] text-[#8A929E] mt-0.5">{tr("employee.usedOf", { used: Number(b.used), accrued: Number(b.accrued) })}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Requests */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title={tr("employee.myRequests")} subtitle={tr("employee.myRequestsSubtitle")} />
        {loading ? (
          <div className="px-6 pb-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-[10px] bg-[#F4F5F7] animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <EmptyState tone="brand" icon="event_available" title={tr("employee.noLeaveRequests")} description={tr("employee.noLeaveRequestsDesc")} action={<Button icon="add" onClick={() => setOpen(true)}>{tr("employee.requestLeave")}</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-[#E8EAED] bg-[#F7F8FA] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">
                  <th className="px-6 py-3">{tr("employee.colType")}</th>
                  <th className="px-6 py-3">{tr("employee.colDates")}</th>
                  <th className="px-6 py-3">{tr("employee.colDays")}</th>
                  <th className="px-6 py-3">{tr("employee.colStatus")}</th>
                  <th className="px-6 py-3 text-right">{tr("employee.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F1]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F7F8] transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-[#15171C]">{r.leave_type_name || r.leave_type_code}</td>
                    <td className={`px-6 py-3.5 text-[#8A929E] ${jetbrainsMono.className}`}>
                      {r.start_date}{r.end_date !== r.start_date ? ` → ${r.end_date}` : ""}{r.half_day ? " (½)" : ""}
                    </td>
                    <td className={`px-6 py-3.5 text-[#374151] ${jetbrainsMono.className}`}>{Number(r.days)}</td>
                    <td className="px-6 py-3.5"><Badge tone={statusTone(r.status)} dot>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Badge></td>
                    <td className="px-6 py-3.5 text-right">
                      {(r.status === "PENDING" || r.status === "APPROVED") && (
                        <button onClick={() => cancel(r.id)} disabled={busy} className="text-[12.5px] font-semibold text-[#8A929E] hover:text-[#C0383C] disabled:opacity-50 transition-colors">{tr("employee.cancel")}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Request modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
          <Card padding="none" className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED]">
              <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#15171C]">{tr("employee.requestLeave")}</h2>
              <button onClick={() => setOpen(false)} aria-label={tr("employee.close")} className="w-8 h-8 rounded-[9px] text-[#8A929E] hover:bg-[#F1F2F5] flex items-center justify-center">
                <span className="material-symbols-rounded text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={apply} className="px-6 py-6 space-y-4">
              {formErr && (
                <div className="flex items-center gap-2 rounded-[10px] border border-[#FBD5D5] bg-[#FDECEC] px-3.5 py-2.5 text-[12.5px] font-medium text-[#C0383C]">
                  <span className="material-symbols-rounded text-[17px]">error</span> {formErr}
                </div>
              )}
              <Field label={tr("employee.leaveType")} htmlFor="lv-type" required>
                <Select id="lv-type" required value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
                  <option value="" disabled>{tr("employee.selectPlaceholder")}</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code}){t.is_paid ? "" : tr("employee.unpaidSuffix")}</option>)}
                </Select>
              </Field>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.half_day} onChange={(e) => setForm({ ...form, half_day: e.target.checked })} className="h-4 w-4 accent-[#5B53E0]" />
                <span className="text-[13px] font-semibold text-[#374151]">{tr("employee.halfDay")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={form.half_day ? tr("employee.date") : tr("employee.startDate")} htmlFor="lv-start" required>
                  <Input id="lv-start" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </Field>
                {!form.half_day && (
                  <Field label={tr("employee.endDate")} htmlFor="lv-end" required>
                    <Input id="lv-end" type="date" required min={form.start_date || undefined} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </Field>
                )}
              </div>
              <Field label={tr("employee.reasonOptional")} htmlFor="lv-reason">
                <Textarea id="lv-reason" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </Field>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{tr("employee.cancel")}</Button>
                <Button type="submit" icon="send" disabled={saving}>{saving ? tr("employee.submitting") : tr("employee.submitRequest")}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
