"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import {
  payrollApi,
  leaveApi,
  type AccrualMethod,
  type Employee,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveType,
} from "@/utils/payroll/api";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  StatGrid,
  jetbrainsMono,
} from "@/components/ds";

const num = (v: number | string) =>
  Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const empName = (e: Employee) => `${e.first_name} ${e.last_name}`.trim() || e.email;

const statusBadge = (status: string) => {
  const s = status.toUpperCase();
  if (s === "APPROVED") return <Badge tone="success" dot>Approved</Badge>;
  if (s === "REJECTED") return <Badge tone="danger" dot>Rejected</Badge>;
  if (s === "CANCELLED") return <Badge tone="neutral" dot>Cancelled</Badge>;
  if (s === "PENDING") return <Badge tone="warning" dot>Pending</Badge>;
  return <Badge tone="neutral" dot>{status}</Badge>;
};

const selectCls =
  "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

export default function LeavePage() {
  const { can } = useAuth();
  const { confirm } = useDialog();
  const canEdit = can("payroll:configure");
  const canApprove = can("payroll:approve");

  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Presentational-only toolbar state (filters the displayed request rows).
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // New leave request form.
  const [reqForm, setReqForm] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    half_day: false,
    reason: "",
  });
  // New leave type form.
  const [typeForm, setTypeForm] = useState<{
    name: string;
    code: string;
    is_paid: boolean;
    annual_quota: number;
    accrual: AccrualMethod;
  }>({ name: "", code: "", is_paid: true, annual_quota: 0, accrual: "ANNUAL" });

  async function loadAll() {
    setLoading(true);
    try {
      const [t, b, r, e] = await Promise.all([
        leaveApi.listTypes(),
        leaveApi.listBalances(),
        leaveApi.listRequests(),
        payrollApi.listEmployees(),
      ]);
      setTypes(t);
      setBalances(b);
      setRequests(r);
      setEmployees(e);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function createRequest() {
    const { employee_id, leave_type_id, start_date, end_date, half_day } = reqForm;
    // A half-day request derives its end date from the start date (the "To"
    // field is disabled and never sets end_date), so don't require end_date then —
    // otherwise the half-day submit silently no-ops.
    if (!employee_id || !leave_type_id || !start_date || (!half_day && !end_date)) return;
    await run(async () => {
      await leaveApi.createRequest({
        employee_id,
        leave_type_id,
        start_date,
        end_date: reqForm.half_day ? start_date : end_date,
        half_day: reqForm.half_day,
        reason: reqForm.reason || null,
      });
      setReqForm({
        employee_id: "",
        leave_type_id: "",
        start_date: "",
        end_date: "",
        half_day: false,
        reason: "",
      });
    });
  }

  async function createType() {
    if (!typeForm.name.trim() || !typeForm.code.trim()) return;
    await run(async () => {
      await leaveApi.createType(typeForm);
      setTypeForm({ name: "", code: "", is_paid: true, annual_quota: 0, accrual: "ANNUAL" });
    });
  }

  async function decide(
    r: LeaveRequest,
    action: "approve" | "reject" | "cancel",
  ) {
    const verb = action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Cancel";
    if (!(await confirm({ title: `${verb} leave`, message: `${verb} this leave request?` }))) return;
    await run(() =>
      action === "approve"
        ? leaveApi.approveRequest(r.id)
        : action === "reject"
          ? leaveApi.rejectRequest(r.id)
          : leaveApi.cancelRequest(r.id),
    );
  }

  const pending = useMemo(() => requests.filter((r) => r.status === "PENDING"), [requests]);
  const history = useMemo(() => requests.filter((r) => r.status !== "PENDING"), [requests]);

  // Presentational filtering for the displayed rows (does not touch data/logic).
  const matchesToolbar = (r: LeaveRequest) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (r.employee_name || r.employee_id).toLowerCase().includes(q) ||
      (r.leave_type_name || r.leave_type_code || "").toLowerCase().includes(q);
    const matchesType = typeFilter === "ALL" || r.leave_type_code === typeFilter;
    return matchesSearch && matchesType;
  };
  const pendingShown = pending.filter(matchesToolbar);
  const historyShown = history.filter(matchesToolbar);

  // Balance metrics for the StatGrid.
  const totalEntitled = balances.reduce((s, b) => s + Number(b.entitled || 0), 0);
  const totalUsed = balances.reduce((s, b) => s + Number(b.used || 0), 0);
  const totalRemaining = balances.reduce((s, b) => s + Number(b.balance || 0), 0);

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title="Leave"
        subtitle="Leave types and balances drive paid-vs-unpaid decisions. Approving a request decrements the balance and marks the matching timesheet days (paid leave = no LOP, unpaid = LOP)."
        help={<><p>Review and approve leave requests and manage balances.</p><p>Approvals update balances and flow into payroll automatically.</p></>}
      />

      {error && (
        <div className="rounded-[10px] border border-[#FADADA] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          {error}
        </div>
      )}

      {/* Balance metrics */}
      <StatGrid>
        <StatCard
          label="Pending Requests"
          value={pending.length}
          icon="pending_actions"
          gradient="linear-gradient(135deg,#F6B65C,#D97706)"
          glow="rgba(217,119,6,0.25)"
        />
        <StatCard
          label="Days Entitled"
          value={num(totalEntitled)}
          icon="event_available"
          gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
          glow="rgba(91,83,224,0.28)"
        />
        <StatCard
          label="Days Used"
          value={num(totalUsed)}
          icon="event_busy"
          gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
          glow="rgba(53,89,199,0.25)"
        />
        <StatCard
          label="Days Remaining"
          value={num(totalRemaining)}
          icon="account_balance_wallet"
          gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
          glow="rgba(14,138,110,0.25)"
        />
      </StatGrid>

      {/* File a leave request */}
      {canEdit && (
        <Card>
          <CardHeader title="Apply for leave" subtitle="File a request on behalf of an employee." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Employee">
              <Select
                value={reqForm.employee_id}
                onChange={(e) => setReqForm({ ...reqForm, employee_id: e.target.value })}
              >
                <option value="">Select…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {empName(e)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Leave type">
              <Select
                value={reqForm.leave_type_id}
                onChange={(e) => setReqForm({ ...reqForm, leave_type_id: e.target.value })}
              >
                <option value="">Select…</option>
                {types
                  .filter((t) => t.is_active)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.is_paid ? "paid" : "unpaid"})
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="From">
              <Input
                type="date"
                value={reqForm.start_date}
                onChange={(e) => setReqForm({ ...reqForm, start_date: e.target.value })}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={reqForm.half_day ? reqForm.start_date : reqForm.end_date}
                disabled={reqForm.half_day}
                onChange={(e) => setReqForm({ ...reqForm, end_date: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151] cursor-pointer">
              <input
                type="checkbox"
                checked={reqForm.half_day}
                onChange={(e) => setReqForm({ ...reqForm, half_day: e.target.checked })}
                className="h-4 w-4 rounded accent-[#5B53E0]"
              />
              Half day
            </label>
            <Button onClick={createRequest} disabled={busy} size="sm" icon="send">
              Submit request
            </Button>
          </div>
        </Card>
      )}

      {/* Toolbar: search + type filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests by employee or leave type…"
            className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`${selectCls} w-full md:min-w-[170px]`}
            >
              <option value="ALL">All leave types</option>
              {types.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Pending requests */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-[#15171C]">Pending approvals</h2>
        <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
              ))}
            </div>
          ) : pendingShown.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-4">
                <span className="material-symbols-rounded text-[28px] text-[#C7CCD4]">pending_actions</span>
              </div>
              <h3 className="text-[16px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-1.5">No pending leave requests</h3>
              <p className="text-[#8A929E] text-[13.5px] max-w-xs mx-auto">All caught up — new requests will appear here for approval.</p>
            </div>
          ) : (
            <>
              {/* Column header (desktop) */}
              <div className="hidden md:grid grid-cols-[2fr_1.2fr_1.4fr_0.7fr_180px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Employee</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Type</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Dates</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Days</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
              </div>
              <div className="divide-y divide-[#F0F0F1]">
                {pendingShown.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.2fr_1.4fr_0.7fr_180px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                  >
                    {/* Employee */}
                    <div className="min-w-0">
                      <span className="block text-[14px] font-bold text-[#15171C] truncate">
                        {r.employee_name || r.employee_id.slice(0, 8)}
                      </span>
                      {/* mobile-only meta */}
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[12px] text-[#8A929E] md:hidden">
                        <span>{r.leave_type_name || r.leave_type_code}</span>
                        <span className={jetbrainsMono.className}>
                          {r.start_date}
                          {r.start_date !== r.end_date && <> → {r.end_date}</>}
                          {r.half_day && " (½)"}
                        </span>
                        <span className={jetbrainsMono.className}>· {num(r.days)}d</span>
                      </div>
                    </div>

                    {/* Type (desktop) */}
                    <div className="hidden md:block text-[13px] text-[#374151] truncate">
                      {r.leave_type_name || r.leave_type_code}
                    </div>

                    {/* Dates (desktop) */}
                    <div className={`hidden md:block text-[13px] text-[#374151] ${jetbrainsMono.className}`}>
                      {r.start_date}
                      {r.start_date !== r.end_date && <> → {r.end_date}</>}
                      {r.half_day && " (½)"}
                    </div>

                    {/* Days (desktop) */}
                    <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                      {num(r.days)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end">
                      {canApprove && (
                        <>
                          <Button
                            onClick={() => decide(r, "approve")}
                            disabled={busy}
                            size="sm"
                            variant="primary"
                            className="bg-[#16A34A] hover:bg-[#15803D] shadow-[0_6px_16px_rgba(22,163,74,0.22)]"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => decide(r, "reject")}
                            disabled={busy}
                            size="sm"
                            variant="danger"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {canEdit && (
                        <Button
                          onClick={() => decide(r, "cancel")}
                          disabled={busy}
                          size="sm"
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Balances */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-[#15171C]">Leave balances</h2>
        <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
              ))}
            </div>
          ) : balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-4">
                <span className="material-symbols-rounded text-[28px] text-[#C7CCD4]">account_balance_wallet</span>
              </div>
              <h3 className="text-[16px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-1.5">No balances yet</h3>
              <p className="text-[#8A929E] text-[13.5px] max-w-xs mx-auto">Add a paid leave type below to start accruing balances.</p>
            </div>
          ) : (
            <>
              {/* Column header (desktop) */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_repeat(4,0.8fr)] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Employee</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Type</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Entitled</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Accrued</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Used</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Balance</span>
              </div>
              <div className="divide-y divide-[#F0F0F1]">
                {balances.map((b) => (
                  <div
                    key={b.id}
                    className="grid grid-cols-2 md:grid-cols-[2fr_1fr_repeat(4,0.8fr)] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                  >
                    {/* Employee */}
                    <div className="min-w-0 col-span-2 md:col-span-1">
                      <span className="block text-[14px] font-bold text-[#15171C] truncate">
                        {b.employee_name || b.employee_id.slice(0, 8)}
                      </span>
                      <span className="block text-[12px] text-[#8A929E] md:hidden">{b.leave_type_code || b.leave_type_name}</span>
                    </div>

                    {/* Type (desktop) */}
                    <div className="hidden md:block text-[13px] text-[#374151] truncate">
                      {b.leave_type_code || b.leave_type_name}
                    </div>

                    <div className="md:hidden text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Entitled</div>
                    <div className={`text-[13px] text-[#374151] md:text-right text-right ${jetbrainsMono.className}`}>{num(b.entitled)}</div>

                    <div className="md:hidden text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Accrued</div>
                    <div className={`text-[13px] text-[#374151] md:text-right text-right ${jetbrainsMono.className}`}>{num(b.accrued)}</div>

                    <div className="md:hidden text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Used</div>
                    <div className={`text-[13px] text-[#374151] md:text-right text-right ${jetbrainsMono.className}`}>{num(b.used)}</div>

                    <div className="md:hidden text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Balance</div>
                    <div className={`text-[13px] font-bold text-[#15171C] md:text-right text-right ${jetbrainsMono.className}`}>{num(b.balance)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Leave types config */}
      <Card>
        <CardHeader
          title="Leave types"
          subtitle="Paid types carry an annual quota that accrues into each employee's balance. Unpaid types (loss of pay) always land as LOP."
        />

        {types.length > 0 && (
          <ul className="mb-5 flex flex-col gap-2">
            {types.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E8EAED] bg-[#F7F8FA] px-3.5 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-[14px] font-bold text-[#15171C]">{t.name}</span>
                  <Badge tone="neutral" className={jetbrainsMono.className}>{t.code}</Badge>
                  <span className="text-[12.5px] text-[#8A929E]">
                    {t.is_paid ? `${num(t.annual_quota)} days/yr · ${t.accrual.toLowerCase()}` : "unpaid (LOP)"}
                  </span>
                  {!t.is_active && <Badge tone="danger">inactive</Badge>}
                </div>
                {canEdit && (
                  <button
                    onClick={() => run(() => leaveApi.updateType(t.id, { is_active: !t.is_active }))}
                    className="text-[12.5px] font-semibold text-[#5B53E0] hover:text-[#4A43C9] hover:underline shrink-0"
                  >
                    {t.is_active ? "Deactivate" : "Activate"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="rounded-[10px] border border-dashed border-[#E1E4E8] bg-[#FBFBFC] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Name">
                <Input
                  type="text"
                  placeholder="Casual Leave"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                />
              </Field>
              <Field label="Code">
                <Input
                  type="text"
                  placeholder="CL"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                />
              </Field>
              {typeForm.is_paid && (
                <>
                  <Field label="Quota / yr">
                    <Input
                      type="number"
                      min={0}
                      value={typeForm.annual_quota}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, annual_quota: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Accrual">
                    <Select
                      value={typeForm.accrual}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, accrual: e.target.value as AccrualMethod })
                      }
                    >
                      <option value="ANNUAL">Annual (full up front)</option>
                      <option value="MONTHLY">Monthly (1/12 per month)</option>
                    </Select>
                  </Field>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151] cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.is_paid}
                  onChange={(e) => setTypeForm({ ...typeForm, is_paid: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#5B53E0]"
                />
                Paid
              </label>
              <Button onClick={createType} disabled={busy} size="sm" icon="add">
                Add leave type
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* History */}
      {historyShown.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[15px] font-bold text-[#15171C]">Recent decisions</h2>
          <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden">
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1.4fr_0.7fr_1fr] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Employee</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Type</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Dates</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Days</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Status</span>
            </div>
            <div className="divide-y divide-[#F0F0F1]">
              {historyShown.slice(0, 20).map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1.4fr_0.7fr_1fr] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                >
                  {/* Employee */}
                  <div className="min-w-0">
                    <span className="block text-[14px] font-bold text-[#15171C] truncate">
                      {r.employee_name || r.employee_id.slice(0, 8)}
                    </span>
                    {/* mobile-only meta */}
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[12px] text-[#8A929E] md:hidden">
                      <span>{r.leave_type_code}</span>
                      <span className={jetbrainsMono.className}>
                        {r.start_date}
                        {r.start_date !== r.end_date && <> → {r.end_date}</>}
                      </span>
                      <span className={jetbrainsMono.className}>· {num(r.days)}d</span>
                    </div>
                  </div>

                  {/* Type (desktop) */}
                  <div className="hidden md:block text-[13px] text-[#374151] truncate">{r.leave_type_code}</div>

                  {/* Dates (desktop) */}
                  <div className={`hidden md:block text-[13px] text-[#374151] ${jetbrainsMono.className}`}>
                    {r.start_date}
                    {r.start_date !== r.end_date && <> → {r.end_date}</>}
                  </div>

                  {/* Days (desktop) */}
                  <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                    {num(r.days)}
                  </div>

                  {/* Status */}
                  <div className="flex md:justify-end">{statusBadge(r.status)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
