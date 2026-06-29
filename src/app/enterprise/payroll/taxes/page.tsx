"use client";

import { useEffect, useState } from "react";
import {
  payrollApi,
  taxesApi,
  inr,
  type Employee,
  type TaxProfile,
  type TaxRegime,
  type TdsChallan,
  type TdsLiabilityRow,
} from "@/utils/payroll/api";
import { Banner, Modal } from "@/components/payroll/ui";
import { useAuth } from "@/components/payroll/AuthProvider";
import { useDialog } from "@/components/payroll/DialogProvider";
import {
  Button,
  PageHeader,
  Card,
  Badge,
  StatCard,
  StatGrid,
  Field,
  Input,
  Select,
  jetbrainsMono,
} from "@/components/ds";

const DECLARATION_FIELDS: { key: keyof DeclForm; label: string; hint?: string }[] = [
  { key: "declared_80c", label: "Section 80C", hint: "PF, ELSS, LIC, etc. (max ₹1.5L)" },
  { key: "declared_80d", label: "Section 80D", hint: "Medical insurance premium" },
  { key: "declared_hra_rent", label: "Annual Rent (HRA)", hint: "For HRA exemption" },
  { key: "declared_home_loan_interest", label: "Home Loan Interest", hint: "Section 24(b)" },
  { key: "declared_other", label: "Other Exemptions" },
  { key: "prev_employer_income", label: "Previous Employer Income" },
  { key: "prev_employer_tds", label: "Previous Employer TDS" },
];

interface DeclForm {
  tax_regime: TaxRegime;
  declared_80c: string;
  declared_80d: string;
  declared_hra_rent: string;
  declared_home_loan_interest: string;
  declared_other: string;
  prev_employer_income: string;
  prev_employer_tds: string;
}

const BLANK_DECL: DeclForm = {
  tax_regime: "NEW",
  declared_80c: "",
  declared_80d: "",
  declared_hra_rent: "",
  declared_home_loan_interest: "",
  declared_other: "",
  prev_employer_income: "",
  prev_employer_tds: "",
};

const BLANK_CHALLAN = {
  period_month: "",
  amount: "",
  challan_number: "",
  bsr_code: "",
  deposit_date: "",
  interest: "",
  penalty: "",
  notes: "",
};

const declaredTotal = (p: TaxProfile) =>
  Number(p.declared_80c) +
  Number(p.declared_80d) +
  Number(p.declared_hra_rent) +
  Number(p.declared_home_loan_interest) +
  Number(p.declared_other);

export default function TaxesPage() {
  const { can } = useAuth();
  const { confirm } = useDialog();
  const canEdit = can("payroll:configure");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [profiles, setProfiles] = useState<TaxProfile[]>([]);
  const [challans, setChallans] = useState<TdsChallan[]>([]);
  const [liabilities, setLiabilities] = useState<TdsLiabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Declaration modal
  const [declEmp, setDeclEmp] = useState<Employee | null>(null);
  const [declForm, setDeclForm] = useState<DeclForm>(BLANK_DECL);
  const [declErr, setDeclErr] = useState<string | null>(null);
  const [declSaving, setDeclSaving] = useState(false);

  // Challan modal
  const [challanOpen, setChallanOpen] = useState(false);
  const [challanForm, setChallanForm] = useState(BLANK_CHALLAN);
  const [challanErr, setChallanErr] = useState<string | null>(null);
  const [challanSaving, setChallanSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [emps, profs, chs, libs] = await Promise.all([
        payrollApi.listEmployees(),
        taxesApi.listProfiles(),
        taxesApi.listChallans(),
        taxesApi.tdsLiabilities(),
      ]);
      setEmployees(emps);
      setProfiles(profs);
      setChallans(chs);
      setLiabilities(libs);
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

  const profileFor = (employeeId: string) =>
    profiles.find((p) => p.employee_id === employeeId) ?? null;

  function openDeclaration(emp: Employee) {
    const p = profileFor(emp.id);
    setDeclEmp(emp);
    setDeclErr(null);
    setDeclForm(
      p
        ? {
            tax_regime: p.tax_regime,
            declared_80c: String(p.declared_80c),
            declared_80d: String(p.declared_80d),
            declared_hra_rent: String(p.declared_hra_rent),
            declared_home_loan_interest: String(p.declared_home_loan_interest),
            declared_other: String(p.declared_other),
            prev_employer_income: String(p.prev_employer_income),
            prev_employer_tds: String(p.prev_employer_tds),
          }
        : BLANK_DECL
    );
  }

  async function saveDeclaration(e: React.FormEvent) {
    e.preventDefault();
    if (!declEmp) return;
    setDeclErr(null);
    setDeclSaving(true);
    try {
      await taxesApi.upsertProfile(declEmp.id, {
        tax_regime: declForm.tax_regime,
        declared_80c: Number(declForm.declared_80c) || 0,
        declared_80d: Number(declForm.declared_80d) || 0,
        declared_hra_rent: Number(declForm.declared_hra_rent) || 0,
        declared_home_loan_interest: Number(declForm.declared_home_loan_interest) || 0,
        declared_other: Number(declForm.declared_other) || 0,
        prev_employer_income: Number(declForm.prev_employer_income) || 0,
        prev_employer_tds: Number(declForm.prev_employer_tds) || 0,
      });
      setDeclEmp(null);
      await load();
    } catch (err) {
      setDeclErr((err as Error).message);
    } finally {
      setDeclSaving(false);
    }
  }

  async function saveChallan(e: React.FormEvent) {
    e.preventDefault();
    setChallanErr(null);
    setChallanSaving(true);
    try {
      await taxesApi.createChallan({
        period_month: challanForm.period_month,
        amount: Number(challanForm.amount) || 0,
        challan_number: challanForm.challan_number,
        bsr_code: challanForm.bsr_code || null,
        deposit_date: challanForm.deposit_date,
        interest: Number(challanForm.interest) || 0,
        penalty: Number(challanForm.penalty) || 0,
        notes: challanForm.notes || null,
      });
      setChallanOpen(false);
      setChallanForm(BLANK_CHALLAN);
      await load();
    } catch (err) {
      setChallanErr((err as Error).message);
    } finally {
      setChallanSaving(false);
    }
  }

  async function removeChallan(ch: TdsChallan) {
    const ok = await confirm({
      title: "Delete challan",
      message: `Delete challan ${ch.challan_number} (${inr(ch.amount)})?`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await taxesApi.deleteChallan(ch.id);
      setChallans((prev) => prev.filter((c) => c.id !== ch.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const empName = (e: Employee) => `${e.first_name} ${e.last_name}`.trim();

  // Derived stats (presentation-only)
  const totalDue = liabilities.reduce(
    (sum, row) => sum + Math.max(0, Number(row.difference)),
    0
  );
  const totalDeposited = challans.reduce((sum, ch) => sum + Number(ch.amount), 0);
  const declaredCount = profiles.length;

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title="Taxes & Forms"
        subtitle="Income-tax declarations and TDS challan records."
        help={<><p>Manage tax profiles, TDS liability and statutory forms.</p><p>Record challans and download the forms you need to file.</p></>}
        actions={
          canEdit ? (
            <Button
              icon="add"
              onClick={() => {
                setChallanErr(null);
                setChallanForm(BLANK_CHALLAN);
                setChallanOpen(true);
              }}
            >
              Record Challan
            </Button>
          ) : undefined
        }
      />

      <Banner tone="warn">
        TDS is computed automatically as an <strong>estimate</strong> (versioned, FY2025-26 basis) when
        enabled on a salary structure — it&apos;s not filing-grade. Form 16 and Form 24Q are still to come.
      </Banner>

      {error && <Banner>{error}</Banner>}

      {/* --- Stats --- */}
      <StatGrid>
        <StatCard
          label="Employees"
          value={employees.length}
          icon="group"
          gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
          glow="rgba(91,83,224,0.25)"
        />
        <StatCard
          label="Declarations"
          value={declaredCount}
          icon="description"
          gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
          glow="rgba(14,138,110,0.25)"
        />
        <StatCard
          label="TDS Deposited"
          value={inr(totalDeposited)}
          icon="account_balance"
          gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
          glow="rgba(53,89,199,0.25)"
        />
        <StatCard
          label="TDS Due"
          value={inr(totalDue)}
          icon="warning"
          gradient="linear-gradient(135deg,#F6B65C,#D97706)"
          glow="rgba(217,119,6,0.25)"
        />
      </StatGrid>

      {/* --- TDS Liabilities (deducted vs deposited) --- */}
      <Card padding="none">
        <div className="p-5 md:p-6 border-b border-[#E8EAED]">
          <h2 className="text-[15px] font-bold text-[#15171C]">TDS Liabilities</h2>
          <p className="text-[12.5px] text-[#8A929E] mt-0.5">
            TDS withheld on payslips vs. deposited via recorded challans, by month.
          </p>
        </div>
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : liabilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-[16px] bg-[#F4F5F7] flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-[26px] text-[#C7CCD4]">receipt_long</span>
            </div>
            <p className="text-[13.5px] text-[#8A929E] max-w-sm">
              No TDS withheld yet. Enable Income Tax (TDS) on a salary structure and run payroll.
            </p>
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Month</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Deducted</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Deposited</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Balance</span>
            </div>
            <div className="divide-y divide-[#F0F0F1]">
              {liabilities.map((row) => {
                const bal = Number(row.difference);
                return (
                  <div
                    key={row.period_month}
                    className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-x-4 gap-y-1.5 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                  >
                    <span className={`text-[13.5px] font-bold text-[#15171C] ${jetbrainsMono.className}`}>{row.period_month}</span>
                    <span className={`text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                      <span className="md:hidden text-[10px] uppercase tracking-[0.04em] text-[#8A929E] mr-1.5 font-sans">Ded</span>
                      {inr(row.tds_deducted)}
                    </span>
                    <span className={`text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                      <span className="md:hidden text-[10px] uppercase tracking-[0.04em] text-[#8A929E] mr-1.5 font-sans">Dep</span>
                      {inr(row.tds_deposited)}
                    </span>
                    <div className="col-span-2 md:col-span-1 flex md:justify-end">
                      {bal > 0 ? (
                        <Badge tone="danger">
                          <span className={jetbrainsMono.className}>{inr(bal)}</span> due
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>Settled</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* --- TDS Challans --- */}
      <Card padding="none">
        <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b border-[#E8EAED]">
          <div>
            <h2 className="text-[15px] font-bold text-[#15171C]">TDS Challans</h2>
            <p className="text-[12.5px] text-[#8A929E] mt-0.5">
              Record TDS payments made to the government.
            </p>
          </div>
          {canEdit && (
            <Button
              size="sm"
              icon="add"
              onClick={() => {
                setChallanErr(null);
                setChallanForm(BLANK_CHALLAN);
                setChallanOpen(true);
              }}
            >
              Record Challan
            </Button>
          )}
        </div>
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : challans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-[16px] bg-[#F4F5F7] flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-[26px] text-[#C7CCD4]">request_quote</span>
            </div>
            <p className="text-[13.5px] text-[#8A929E]">No challans recorded yet.</p>
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr_60px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Period</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Challan No.</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">BSR Code</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Deposited</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Amount</span>
              {canEdit && <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>}
            </div>
            <div className="divide-y divide-[#F0F0F1]">
              {challans.map((ch) => (
                <div
                  key={ch.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1.2fr_1fr_1fr_1fr_60px] gap-x-4 gap-y-1.5 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                >
                  <span className={`text-[13.5px] font-bold text-[#15171C] ${jetbrainsMono.className}`}>{ch.period_month}</span>
                  <span className={`text-[12.5px] text-[#374151] ${jetbrainsMono.className} truncate`}>{ch.challan_number}</span>
                  <span className={`hidden md:block text-[12.5px] text-[#374151] ${jetbrainsMono.className}`}>{ch.bsr_code || "—"}</span>
                  <span className="hidden md:block text-[13px] text-[#8A929E]">{ch.deposit_date}</span>
                  <span className={`hidden md:block text-[13px] font-semibold text-[#15171C] text-right ${jetbrainsMono.className}`}>{inr(ch.amount)}</span>
                  {/* Mobile meta + amount + action */}
                  <div className="flex items-center justify-end gap-2 md:hidden">
                    <span className={`text-[13px] font-semibold text-[#15171C] ${jetbrainsMono.className}`}>{inr(ch.amount)}</span>
                  </div>
                  {canEdit && (
                    <div className="hidden md:flex justify-end">
                      <button
                        onClick={() => removeChallan(ch)}
                        title="Delete challan"
                        className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                      >
                        <span className="material-symbols-rounded text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                  {/* Mobile-only sub row: bsr/date + delete */}
                  <div className="col-span-2 md:hidden flex items-center justify-between text-[12px] text-[#8A929E]">
                    <span className="flex items-center gap-3">
                      <span className={jetbrainsMono.className}>{ch.bsr_code || "—"}</span>
                      <span>{ch.deposit_date}</span>
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => removeChallan(ch)}
                        title="Delete challan"
                        className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                      >
                        <span className="material-symbols-rounded text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* --- IT Declarations --- */}
      <Card padding="none">
        <div className="p-5 md:p-6 border-b border-[#E8EAED]">
          <h2 className="text-[15px] font-bold text-[#15171C]">Income-Tax Declarations</h2>
          <p className="text-[12.5px] text-[#8A929E] mt-0.5">
            Each employee&apos;s tax regime and declared investments/exemptions for the year.
          </p>
        </div>
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-[16px] bg-[#F4F5F7] flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-[26px] text-[#C7CCD4]">group</span>
            </div>
            <p className="text-[13.5px] text-[#8A929E]">No employees yet.</p>
          </div>
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1.2fr_1fr_80px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Employee</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Regime</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Total Declared</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
              {canEdit && <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>}
            </div>
            <div className="divide-y divide-[#F0F0F1]">
              {employees.map((emp) => {
                const p = profileFor(emp.id);
                return (
                  <div
                    key={emp.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1.2fr_1fr_80px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                  >
                    {/* Employee */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-extrabold text-[12px] uppercase shrink-0">
                        {((emp.first_name?.[0] || "") + (emp.last_name?.[0] || "")).toUpperCase() || "?"}
                      </span>
                      <span className="text-[13.5px] font-bold text-[#15171C] truncate">{empName(emp)}</span>
                    </div>

                    {/* Regime */}
                    <div className="hidden md:flex items-center">
                      {p ? (
                        <Badge tone={p.tax_regime === "NEW" ? "indigo" : "teal"}>{p.tax_regime}</Badge>
                      ) : (
                        <span className="text-[#C7CCD4]">—</span>
                      )}
                    </div>

                    {/* Total Declared */}
                    <div className={`hidden md:block text-[13px] text-[#374151] text-right ${jetbrainsMono.className}`}>
                      {p ? inr(declaredTotal(p)) : "—"}
                    </div>

                    {/* Status */}
                    <div className="hidden md:flex items-center">
                      {p ? (
                        <Badge tone="success" dot>Declared</Badge>
                      ) : (
                        <Badge tone="neutral">Not declared</Badge>
                      )}
                    </div>

                    {/* Action (desktop) */}
                    {canEdit && (
                      <div className="hidden md:flex justify-end">
                        <Button variant="secondary" size="sm" onClick={() => openDeclaration(emp)}>
                          {p ? "Edit" : "Add"}
                        </Button>
                      </div>
                    )}

                    {/* Mobile: regime/status/total + action */}
                    <div className="flex items-center gap-2 justify-end md:hidden">
                      {p ? (
                        <Badge tone={p.tax_regime === "NEW" ? "indigo" : "teal"}>{p.tax_regime}</Badge>
                      ) : (
                        <Badge tone="neutral">—</Badge>
                      )}
                      {canEdit && (
                        <Button variant="secondary" size="sm" onClick={() => openDeclaration(emp)}>
                          {p ? "Edit" : "Add"}
                        </Button>
                      )}
                    </div>
                    <div className="col-span-2 md:hidden flex items-center justify-between text-[12px] text-[#8A929E]">
                      <span>{p ? "Declared" : "Not declared"}</span>
                      <span className={jetbrainsMono.className}>{p ? inr(declaredTotal(p)) : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Challan modal */}
      {challanOpen && (
        <Modal title="Record TDS Challan" onClose={() => setChallanOpen(false)}>
          <form onSubmit={saveChallan} className="flex flex-col gap-4">
            {challanErr && <Banner>{challanErr}</Banner>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Liability Month">
                <Input
                  type="month"
                  required
                  value={challanForm.period_month}
                  onChange={(e) => setChallanForm({ ...challanForm, period_month: e.target.value })}
                />
              </Field>
              <Field label="Amount">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={challanForm.amount}
                  onChange={(e) => setChallanForm({ ...challanForm, amount: e.target.value })}
                />
              </Field>
              <Field label="Challan Number">
                <Input
                  required
                  value={challanForm.challan_number}
                  onChange={(e) => setChallanForm({ ...challanForm, challan_number: e.target.value })}
                />
              </Field>
              <Field label="BSR Code">
                <Input
                  value={challanForm.bsr_code}
                  onChange={(e) => setChallanForm({ ...challanForm, bsr_code: e.target.value })}
                />
              </Field>
              <Field label="Deposit Date">
                <Input
                  type="date"
                  required
                  value={challanForm.deposit_date}
                  onChange={(e) => setChallanForm({ ...challanForm, deposit_date: e.target.value })}
                />
              </Field>
              <Field label="Interest">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={challanForm.interest}
                  onChange={(e) => setChallanForm({ ...challanForm, interest: e.target.value })}
                />
              </Field>
              <Field label="Penalty">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={challanForm.penalty}
                  onChange={(e) => setChallanForm({ ...challanForm, penalty: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <Input
                value={challanForm.notes}
                onChange={(e) => setChallanForm({ ...challanForm, notes: e.target.value })}
              />
            </Field>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={challanSaving}>
                {challanSaving ? "Saving…" : "Record Challan"}
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setChallanOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Declaration modal */}
      {declEmp && (
        <Modal title={`IT Declaration — ${empName(declEmp)}`} onClose={() => setDeclEmp(null)}>
          <form onSubmit={saveDeclaration} className="flex flex-col gap-4">
            {declErr && <Banner>{declErr}</Banner>}
            <Field label="Tax Regime">
              <Select
                value={declForm.tax_regime}
                onChange={(e) => setDeclForm({ ...declForm, tax_regime: e.target.value as TaxRegime })}
              >
                <option value="NEW">New Regime (default)</option>
                <option value="OLD">Old Regime</option>
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DECLARATION_FIELDS.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={declForm[f.key]}
                    onChange={(e) => setDeclForm({ ...declForm, [f.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={declSaving}>
                {declSaving ? "Saving…" : "Save Declaration"}
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setDeclEmp(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
