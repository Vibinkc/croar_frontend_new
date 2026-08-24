"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import {
  settingsApi,
  type OrganizationUpdate,
  type PayslipSettings,
  type PayslipDocScan,
  type PayslipDocSlot,
  type StatutoryConfig,
  type StatutoryConfigUpdate,
} from "@/utils/payroll/api";
import { Banner } from "@/components/payroll/ui";
import { useAuth } from "@/components/payroll/AuthProvider";
import {
  Button,
  Card,
  Field as DSField,
  PageHeader,
  jetbrainsMono,
} from "@/components/ds";

// Shared field control classes — aligns every native <input>/<select> in this
// page with the design-system Input/Select look (hairline border, indigo focus).
const INPUT_CLS =
  "w-full h-11 px-3.5 rounded-[10px] border border-[#E1E4E8] bg-white text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const SELECT_CLS = `${INPUT_CLS} appearance-none pr-9 cursor-pointer`;

// value is the stored/API value (kept English); key resolves the display label.
const INDUSTRIES: { value: string; key: string }[] = [
  { value: "Information Technology", key: "payroll.industry_it" },
  { value: "Financial Services", key: "payroll.industry_financial" },
  { value: "Manufacturing", key: "payroll.industry_manufacturing" },
  { value: "Construction", key: "payroll.industry_construction" },
  { value: "Education", key: "payroll.industry_education" },
  { value: "Healthcare", key: "payroll.industry_healthcare" },
  { value: "Retail", key: "payroll.industry_retail" },
  { value: "Hospitality", key: "payroll.industry_hospitality" },
  { value: "Logistics", key: "payroll.industry_logistics" },
  { value: "Automotive", key: "payroll.industry_automotive" },
  { value: "Media & Entertainment", key: "payroll.industry_media" },
  { value: "Consulting", key: "payroll.industry_consulting" },
  { value: "Other", key: "payroll.industry_other" },
];

// Common ISO-4217 currencies offered out of the box. Users can still enter any
// code via the "Custom…" option below.
const CURRENCIES: { code: string; label: string }[] = [
  { code: "INR", label: "Indian Rupee" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "HKD", label: "Hong Kong Dollar" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "ZAR", label: "South African Rand" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "QAR", label: "Qatari Riyal" },
  { code: "MYR", label: "Malaysian Ringgit" },
  { code: "THB", label: "Thai Baht" },
  { code: "IDR", label: "Indonesian Rupiah" },
  { code: "PHP", label: "Philippine Peso" },
  { code: "LKR", label: "Sri Lankan Rupee" },
  { code: "BDT", label: "Bangladeshi Taka" },
  { code: "NPR", label: "Nepalese Rupee" },
];
const CUSTOM_CURRENCY = "__custom__";

// All form values are kept as strings (nulls from the API are coerced to "").
type OrgField =
  | "name"
  | "currency"
  | "legal_name"
  | "industry"
  | "contact_email"
  | "contact_phone"
  | "address_line1"
  | "address_line2"
  | "city"
  | "state"
  | "pincode"
  | "country"
  | "pan"
  | "tan";
type FormState = Record<OrgField, string>;

const BLANK: FormState = {
  name: "",
  currency: "INR",
  legal_name: "",
  industry: "",
  contact_email: "",
  contact_phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  pan: "",
  tan: "",
};

type TabKey = "organisation" | "payslip" | "statutory";
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "organisation", label: "Organisation", icon: "apartment" },
  { key: "payslip", label: "Payslip Template", icon: "receipt" },
  { key: "statutory", label: "Statutory Compliance", icon: "verified_user" },
];

// Build a fully-stringified FormState from an API payload, coercing any
// null/undefined fields to "" so the inputs stay controlled.
function toFormState(o: Partial<Record<OrgField, unknown>>): FormState {
  const next = { ...BLANK };
  (Object.keys(BLANK) as OrgField[]).forEach((k) => {
    const v = o[k];
    next[k] = v == null ? "" : String(v);
  });
  return next;
}

export default function SettingsPage() {
  const { can } = useAuth();
    const { t: tr } = useI18n();
  const canEdit = can("users:manage");
  const [form, setForm] = useState<FormState>(BLANK);
  const [initial, setInitial] = useState<FormState>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabKey>("organisation");
  // True once the user picks "Custom…" so the input stays visible even while
  // the typed code is empty or partially typed.
  const [customCurrency, setCustomCurrency] = useState(false);

  useEffect(() => {
    settingsApi
      .getOrganization()
      .then((o) => {
        const next = toFormState(o as Partial<Record<OrgField, unknown>>);
        setForm(next);
        setInitial(next);
        // Saved a code that isn't one of the presets → start in custom mode.
        if (next.currency && !CURRENCIES.some((c) => c.code === next.currency)) {
          setCustomCurrency(true);
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const updated = await settingsApi.updateOrganization(form as OrganizationUpdate);
      // Coerce the response (which may contain nulls) back into string fields,
      // falling back to the submitted form for anything the API omits.
      const merged = toFormState({
        ...form,
        ...(updated as Partial<Record<OrgField, unknown>>),
      });
      setForm(merged);
      setInitial(merged);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <p className="p-12 text-center text-[#8A929E]">{tr("common.loading")}</p>;

  const initials = (form.name || "?").trim().charAt(0).toUpperCase() || "?";
  const locality = [form.city, form.state].filter(Boolean).join(", ");
  // Display label for a stored industry value (falls back to the raw value).
  const industryLabel = (v: string) => {
    const found = INDUSTRIES.find((i) => i.value === v);
    return found ? tr(found.key) : v;
  };

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-24 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader title={tr("common.settings")} subtitle={tr("payroll.settingsSubtitle")} help={tr("payroll.settingsHelp")} />

      {/* Organisation hero */}
      <Card padding="lg" className="flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-[#5B53E0] text-[26px] font-extrabold text-white shadow-[0_8px_24px_rgba(91,83,224,0.3)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C]">
            {form.name || tr("payroll.yourOrganisation")}
          </h2>
          <p className="truncate text-[13px] text-[#8A929E] mt-0.5">
            {form.legal_name || tr("payroll.completeProfilePrompt")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {form.industry && <Chip icon="business_center">{industryLabel(form.industry)}</Chip>}
            {locality && <Chip icon="location_on">{locality}</Chip>}
            <Chip icon="payments">{form.currency}</Chip>
            {form.pan && <Chip icon="badge">PAN {form.pan}</Chip>}
          </div>
        </div>
      </Card>

      {!canEdit && (
        <Banner tone="warn">
          {tr("payroll.readOnlyAdmins")}
        </Banner>
      )}

      {/* Section tabs (segmented control) */}
      <div className="flex flex-wrap gap-1 bg-[#E8EAED] rounded-[12px] p-1 w-full sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-2 rounded-[9px] px-4 h-9 text-[13px] font-semibold transition-all flex-1 sm:flex-none ${
              tab === t.key
                ? "bg-white text-[#15171C] shadow-sm"
                : "text-[#6B6F76] hover:text-[#374151]"
            }`}
          >
            <span className="material-symbols-rounded text-[18px]">{t.icon}</span>
            {tr(`payroll.settingsTab_${t.key}`)}
          </button>
        ))}
      </div>

      {/* Organisation Profile */}
      <div className={tab === "organisation" ? "flex flex-col gap-6" : "hidden"}>
        {error && <Banner>{error}</Banner>}
        {saved && <SavedNote>{tr("payroll.orgProfileSaved")}</SavedNote>}

      <form onSubmit={save} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Section
          icon="apartment"
          title={tr("payroll.basicDetails")}
          subtitle={tr("payroll.orgIdentity")}
        >
          <Field label={tr("payroll.orgName")} required>
            <input
              className={INPUT_CLS}
              required
              placeholder={tr("payroll.orgNamePlaceholder")}
              disabled={!canEdit}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label={tr("payroll.legalName")} hint={tr("payroll.legalNameHint")}>
            <input
              className={INPUT_CLS}
              placeholder={tr("payroll.legalNamePlaceholder")}
              disabled={!canEdit}
              value={form.legal_name}
              onChange={(e) => set("legal_name", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={tr("payroll.industry")}>
              <SelectWrap>
                <select
                  className={SELECT_CLS}
                  disabled={!canEdit}
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                >
                  <option value="">{tr("payroll.select")}</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>
                      {tr(i.key)}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </Field>
            <Field label={tr("payroll.currency")}>
              <div className="flex flex-col gap-2">
                <SelectWrap>
                <select
                  className={SELECT_CLS}
                  disabled={!canEdit}
                  value={customCurrency ? CUSTOM_CURRENCY : form.currency}
                  onChange={(e) => {
                    if (e.target.value === CUSTOM_CURRENCY) {
                      // Enter custom mode and clear the value so the user types
                      // their own code; the input below stays visible.
                      setCustomCurrency(true);
                      set("currency", "");
                    } else {
                      setCustomCurrency(false);
                      set("currency", e.target.value);
                    }
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {tr(`payroll.currency_${c.code}`)}
                    </option>
                  ))}
                  <option value={CUSTOM_CURRENCY}>{tr("payroll.customEllipsis")}</option>
                </select>
                </SelectWrap>
                {customCurrency && (
                  <input
                    className={INPUT_CLS}
                    autoFocus
                    required
                    maxLength={8}
                    placeholder={tr("payroll.currencyCodePlaceholder")}
                    disabled={!canEdit}
                    value={form.currency}
                    onChange={(e) =>
                      set("currency", e.target.value.toUpperCase())
                    }
                  />
                )}
              </div>
            </Field>
          </div>
        </Section>

        <Section
          icon="contact_mail"
          title={tr("payroll.contact")}
          subtitle={tr("payroll.contactSubtitle")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={tr("payroll.contactEmail")}>
              <input
                className={INPUT_CLS}
                type="email"
                placeholder="hello@acme.com"
                disabled={!canEdit}
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
              />
            </Field>
            <Field label={tr("payroll.contactPhone")}>
              <input
                className={INPUT_CLS}
                placeholder="+91 98765 43210"
                disabled={!canEdit}
                value={form.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          icon="location_on"
          title={tr("payroll.address")}
          subtitle={tr("payroll.addressSubtitle")}
          wide
        >
          <Field label={tr("payroll.addressLine1")}>
            <input
              className={INPUT_CLS}
              placeholder={tr("payroll.addressLine1Placeholder")}
              disabled={!canEdit}
              value={form.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
            />
          </Field>
          <Field label={tr("payroll.addressLine2")}>
            <input
              className={INPUT_CLS}
              placeholder={tr("payroll.addressLine2Placeholder")}
              disabled={!canEdit}
              value={form.address_line2}
              onChange={(e) => set("address_line2", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={tr("payroll.city")}>
              <input className={INPUT_CLS} disabled={!canEdit} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label={tr("payroll.state")}>
              <input className={INPUT_CLS} disabled={!canEdit} value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label={tr("payroll.pincode")}>
              <input className={INPUT_CLS} inputMode="numeric" disabled={!canEdit} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </Field>
            <Field label={tr("payroll.country")}>
              {/* Country drives the statutory payroll engine: India (PF/ESI/TDS), South Korea
                  (4대보험 + 소득세), Japan (社会保険 + 源泉税), United States (FICA + federal). */}
              <select className={INPUT_CLS} disabled={!canEdit} value={form.country} onChange={(e) => set("country", e.target.value)}>
                {["India", "South Korea", "Japan", "United States"].map((c) => <option key={c} value={c}>{c}</option>)}
                {form.country && !["India", "South Korea", "Japan", "United States"].includes(form.country) && <option value={form.country}>{form.country}</option>}
              </select>
            </Field>
          </div>
        </Section>

        <Section
          icon="receipt_long"
          title={tr("payroll.taxInformation")}
          subtitle={tr("payroll.taxInfoSubtitle")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={tr("payroll.panLabel")} hint={tr("payroll.panHint")}>
              <input
                className={`${INPUT_CLS} font-mono uppercase tracking-wider`}
                maxLength={10}
                placeholder="AAAAA9999A"
                disabled={!canEdit}
                value={form.pan}
                onChange={(e) => set("pan", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label={tr("payroll.tanLabel")} hint={tr("payroll.tanHint")}>
              <input
                className={`${INPUT_CLS} font-mono uppercase tracking-wider`}
                maxLength={10}
                placeholder="AAAA99999A"
                disabled={!canEdit}
                value={form.tan}
                onChange={(e) => set("tan", e.target.value.toUpperCase())}
              />
            </Field>
          </div>
        </Section>

        {/* More settings — surface adjacent admin areas. */}
        <Section
          icon="tune"
          title={tr("payroll.moreSettings")}
          subtitle={tr("payroll.moreSettingsSubtitle")}
          wide
        >
          <Link
            href="/enterprise/payroll/team"
            className="flex items-center justify-between rounded-[12px] border border-[#E8EAED] px-4 py-3 transition-colors hover:border-[#5B53E0]/40 hover:bg-[#F4F5F7]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#ECEBFB] text-[#5B53E0]">
                <span className="material-symbols-rounded text-[20px]">manage_accounts</span>
              </span>
              <span>
                <span className="block text-[13.5px] font-bold text-[#15171C]">{tr("payroll.usersRoles")}</span>
                <span className="block text-[12px] text-[#8A929E]">
                  {tr("payroll.usersRolesDesc")}
                </span>
              </span>
            </span>
            <span className="material-symbols-rounded text-[#C7CCD4]">chevron_right</span>
          </Link>
        </Section>

        {/* Sticky save bar */}
        {canEdit && (
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-[14px] border border-[#E8EAED] bg-white/95 px-5 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur xl:col-span-2">
            <span className="flex items-center gap-2 text-[13px] text-[#8A929E]">
              <span
                className={`h-2 w-2 rounded-full ${dirty ? "bg-[#D97706]" : "bg-[#0E8A6E]"}`}
              />
              {dirty ? tr("payroll.unsavedChanges") : tr("payroll.allChangesSaved")}
            </span>
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? tr("payroll.saving") : tr("payroll.saveChanges")}
            </Button>
          </div>
        )}
      </form>
      </div>

      {/* Payslip Template */}
      <div className={tab === "payslip" ? "" : "hidden"}>
        <PayslipTemplateSection canEdit={canEdit} />
      </div>

      {/* Statutory Compliance */}
      <div className={tab === "statutory" ? "" : "hidden"}>
        <StatutoryComplianceSection canEdit={canEdit} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Statutory compliance — editable rates & thresholds applied to every payroll
// run, payslip and the live preview (PUT /settings/statutory). Rates are stored
// as fractions; this form edits them as percentages.
// ---------------------------------------------------------------------------
type RateKey =
  | "pf_employee_rate"
  | "pf_employer_rate"
  | "eps_rate"
  | "esi_employee_rate"
  | "esi_employer_rate";
type AmountKey =
  | "pf_wage_ceiling"
  | "eps_wage_ceiling"
  | "esi_wage_limit"
  | "tds_new_rebate_limit"
  | "tds_old_rebate_limit"
  | "tds_new_std_deduction"
  | "tds_old_std_deduction";

const STAT_GROUPS: {
  id: string;
  group: string;
  icon: string;
  rates: { key: RateKey; label: string; hint?: string }[];
  amounts: { key: AmountKey; label: string; hint?: string }[];
}[] = [
  {
    id: "epf",
    group: "Provident Fund (EPF)",
    icon: "savings",
    rates: [
      { key: "pf_employee_rate", label: "Employee rate %" },
      { key: "pf_employer_rate", label: "Employer rate %" },
      { key: "eps_rate", label: "EPS rate %", hint: "Pension share within the employer contribution." },
    ],
    amounts: [
      { key: "pf_wage_ceiling", label: "PF wage ceiling", hint: "Contributory wage is capped here when the structure caps PF." },
      { key: "eps_wage_ceiling", label: "EPS wage ceiling" },
    ],
  },
  {
    id: "esi",
    group: "ESI",
    icon: "health_and_safety",
    rates: [
      { key: "esi_employee_rate", label: "Employee rate %" },
      { key: "esi_employer_rate", label: "Employer rate %" },
    ],
    amounts: [{ key: "esi_wage_limit", label: "Wage limit", hint: "ESI applies only when monthly gross ≤ this." }],
  },
  {
    id: "tds",
    group: "Income Tax (TDS)",
    icon: "account_balance",
    rates: [],
    amounts: [
      { key: "tds_new_rebate_limit", label: "New regime — 87A rebate limit" },
      { key: "tds_new_std_deduction", label: "New regime — standard deduction" },
      { key: "tds_old_rebate_limit", label: "Old regime — 87A rebate limit" },
      { key: "tds_old_std_deduction", label: "Old regime — standard deduction" },
    ],
  },
];

const RATE_KEYS: RateKey[] = [
  "pf_employee_rate",
  "pf_employer_rate",
  "eps_rate",
  "esi_employee_rate",
  "esi_employer_rate",
];

// Round a fraction->percent (and back) without float noise like 8.3299999.
const toPct = (frac: number) => +(frac * 100).toFixed(4);

function StatutoryComplianceSection({ canEdit }: { canEdit: boolean }) {
  const { t: tr } = useI18n();
  // Form holds display strings: rates as percentages, amounts as plain numbers.
  const [form, setForm] = useState<Record<RateKey | AmountKey, string>>(
    {} as Record<RateKey | AmountKey, string>
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function fromConfig(c: StatutoryConfig): Record<RateKey | AmountKey, string> {
    const out = {} as Record<RateKey | AmountKey, string>;
    (Object.keys(c) as (RateKey | AmountKey)[]).forEach((k) => {
      out[k] = RATE_KEYS.includes(k as RateKey)
        ? String(toPct(c[k] as number))
        : String(c[k]);
    });
    return out;
  }

  useEffect(() => {
    settingsApi
      .getStatutoryConfig()
      .then((c) => setForm(fromConfig(c)))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  function set(key: RateKey | AmountKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    setSaving(true);
    try {
      const body = {} as StatutoryConfigUpdate;
      (Object.keys(form) as (RateKey | AmountKey)[]).forEach((k) => {
        // A blank field means "leave this one unchanged" — send only real values.
        // Coercing "" via Number() yields 0, which would silently zero a
        // statutory rate/threshold for the whole company; the backend applies a
        // partial merge, so omitting a field preserves the stored value.
        const raw = (form[k] ?? "").trim();
        if (raw === "") return;
        const n = Number(raw);
        if (Number.isFinite(n)) {
          body[k] = RATE_KEYS.includes(k as RateKey) ? n / 100 : n;
        }
      });
      const updated = await settingsApi.updateStatutoryConfig(body);
      setForm(fromConfig(updated));
      setSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Section
        icon="verified_user"
        title={tr("payroll.statutoryCompliance")}
        subtitle={tr("payroll.statutorySubtitle")}
        wide
      >
        {err && <Banner>{err}</Banner>}
        {saved && <SavedNote>{tr("payroll.statutorySaved")}</SavedNote>}

        <Banner tone="warn">
          {tr("payroll.statutoryOverrideWarn")}
        </Banner>

        {STAT_GROUPS.map((g) => (
          <div key={g.group} className="rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] p-4">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="material-symbols-rounded text-[20px] text-[#5B53E0]">{g.icon}</span>
              <span className="text-[14px] font-bold text-[#15171C]">{tr(`payroll.statGroup_${g.id}`)}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {g.rates.map((f) => (
                <Field key={f.key} label={tr(`payroll.statLabel_${f.key}`)} hint={f.hint ? tr(`payroll.statHint_${f.key}`) : undefined}>
                  <input
                    className={`${INPUT_CLS} ${jetbrainsMono.className}`}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!canEdit}
                    value={form[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </Field>
              ))}
              {g.amounts.map((f) => (
                <Field key={f.key} label={tr(`payroll.statLabel_${f.key}`)} hint={f.hint ? tr(`payroll.statHint_${f.key}`) : undefined}>
                  <input
                    className={`${INPUT_CLS} ${jetbrainsMono.className}`}
                    type="number"
                    step="1"
                    min="0"
                    disabled={!canEdit}
                    value={form[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? tr("payroll.saving") : tr("payroll.saveStatutorySettings")}
            </Button>
          </div>
        )}
      </Section>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Payslip template — branding + section toggles applied to every payslip
// (PDF, email attachment and the web/print view). Self-contained: own load,
// state and save (PUT /settings/payslip).
// ---------------------------------------------------------------------------
const PAYSLIP_BLANK: PayslipSettings = {
  display_name: "",
  logo_url: "",
  accent_color: "",
  footer_note: "",
  show_employer_contributions: true,
  show_tax_block: true,
  show_attendance: true,
  use_doc_template: false,
  company_name: "",
  has_doc_template: false,
  doc_filename: null,
  doc_mapped: false,
  doc_has_tokens: false,
};

function PayslipTemplateSection({ canEdit }: { canEdit: boolean }) {
  const { t: tr } = useI18n();
  const [ps, setPs] = useState<PayslipSettings>(PAYSLIP_BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Smart mapping wizard state. `scan` non-null means the wizard is open;
  // `mapping` is slot-index -> chosen token (built from the auto-detected
  // suggestions, editable by the admin).
  const [scan, setScan] = useState<PayslipDocScan | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function startWizard(s: PayslipDocScan) {
    const init: Record<string, string> = {};
    for (const slot of s.slots) {
      if (slot.suggested_token) init[String(slot.index)] = slot.suggested_token;
    }
    setMapping(init);
    setScan(s);
  }

  async function scanDoc(file: File) {
    setErr(null);
    setBusy(true);
    try {
      startWizard(await settingsApi.scanPayslipDocument(file));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function editMapping() {
    setErr(null);
    setBusy(true);
    try {
      startWizard(await settingsApi.getPayslipMapping());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function applyMapping() {
    setErr(null);
    setBusy(true);
    try {
      applySettings(await settingsApi.applyPayslipMapping(mapping));
      setScan(null);
      setSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function applySettings(s: PayslipSettings) {
    setPs({
      ...s,
      display_name: s.display_name ?? "",
      logo_url: s.logo_url ?? "",
      accent_color: s.accent_color ?? "",
      footer_note: s.footer_note ?? "",
    });
  }

  useEffect(() => {
    settingsApi
      .getPayslipSettings()
      .then(applySettings)
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function uploadDoc(file: File) {
    setErr(null);
    setUploading(true);
    try {
      applySettings(await settingsApi.uploadPayslipDocument(file));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function removeDoc() {
    setErr(null);
    setUploading(true);
    try {
      applySettings(await settingsApi.deletePayslipDocument());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function set<K extends keyof PayslipSettings>(key: K, value: PayslipSettings[K]) {
    setPs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    setSaving(true);
    try {
      applySettings(
        await settingsApi.updatePayslipSettings({
          display_name: ps.display_name || null,
          logo_url: ps.logo_url || null,
          accent_color: ps.accent_color || null,
          footer_note: ps.footer_note || null,
          show_employer_contributions: ps.show_employer_contributions,
          show_tax_block: ps.show_tax_block,
          show_attendance: ps.show_attendance,
          use_doc_template: ps.use_doc_template,
        })
      );
      setSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const accentPreview = ps.accent_color || "#5B53E0";

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Section
        icon="receipt"
        title={tr("payroll.payslipTemplate")}
        subtitle={tr("payroll.payslipTemplateSubtitle")}
        wide
      >
        {err && <Banner>{err}</Banner>}
        {saved && <SavedNote>{tr("payroll.payslipTemplateSaved")}</SavedNote>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={tr("payroll.displayName")} hint={tr("payroll.displayNameHint", { name: ps.company_name })}>
            <input
              className={INPUT_CLS}
              placeholder={ps.company_name}
              disabled={!canEdit}
              value={ps.display_name ?? ""}
              onChange={(e) => set("display_name", e.target.value)}
            />
          </Field>
          <Field label={tr("payroll.accentColour")} hint={tr("payroll.accentColourHint")}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={!canEdit}
                value={ps.accent_color || "#2563eb"}
                onChange={(e) => set("accent_color", e.target.value)}
                className="h-11 w-11 shrink-0 cursor-pointer rounded-[10px] border border-[#E1E4E8] bg-transparent p-1"
                aria-label={tr("payroll.accentColourAria")}
              />
              <input
                className={`${INPUT_CLS} ${jetbrainsMono.className}`}
                placeholder="#2563eb"
                maxLength={7}
                disabled={!canEdit}
                value={ps.accent_color ?? ""}
                onChange={(e) => set("accent_color", e.target.value)}
              />
              <span className="h-11 w-11 shrink-0 rounded-[10px] border border-[#E1E4E8]" style={{ background: accentPreview }} />
            </div>
          </Field>
        </div>

        <Field label={tr("payroll.logoUrl")} hint={tr("payroll.logoUrlHint")}>
          <input
            className={INPUT_CLS}
            type="url"
            placeholder="https://example.com/logo.png"
            disabled={!canEdit}
            value={ps.logo_url ?? ""}
            onChange={(e) => set("logo_url", e.target.value)}
          />
        </Field>

        <Field label={tr("payroll.footerNote")} hint={tr("payroll.footerNoteHint")}>
          <input
            className={INPUT_CLS}
            maxLength={300}
            placeholder={tr("payroll.footerNotePlaceholder")}
            disabled={!canEdit}
            value={ps.footer_note ?? ""}
            onChange={(e) => set("footer_note", e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="block text-[12.5px] font-semibold text-[#374151] mb-0.5">{tr("payroll.sections")}</span>
          <PayslipToggle
            label={tr("payroll.employerContributions")}
            desc={tr("payroll.employerContributionsDesc")}
            disabled={!canEdit}
            checked={ps.show_employer_contributions}
            onChange={(v) => set("show_employer_contributions", v)}
          />
          <PayslipToggle
            label={tr("payroll.incomeTaxDetails")}
            desc={tr("payroll.incomeTaxDetailsDesc")}
            disabled={!canEdit}
            checked={ps.show_tax_block}
            onChange={(v) => set("show_tax_block", v)}
          />
          <PayslipToggle
            label={tr("payroll.attendance")}
            desc={tr("payroll.attendanceDesc")}
            disabled={!canEdit}
            checked={ps.show_attendance}
            onChange={(v) => set("show_attendance", v)}
          />
        </div>

        {/* Uploaded Word (.docx) template */}
        <div className="rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="material-symbols-rounded text-[20px] text-[#5B53E0]">description</span>
            <span className="text-[14px] font-bold text-[#15171C]">{tr("payroll.advancedDocTemplate")}</span>
          </div>
          <p className="mb-2 text-[12px] leading-relaxed text-[#8A929E] [&_code]:rounded-[6px] [&_code]:bg-[#ECEBFB] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[11px] [&_code]:font-semibold [&_code]:text-[#5B53E0]">
            {tr("payroll.alreadyAdded")} <code>{"{{ tokens }}"}</code> {tr("payroll.docTemplateP1")}{" "}
            <strong>{tr("payroll.docBlankLines")}</strong> {tr("payroll.docCommonOnes")}{" "}
            <code>{"{{ company_name }}"}</code>, <code>{"{{ employee.name }}"}</code>,{" "}
            <code>{"{{ employee.code }}"}</code>, <code>{"{{ period_start }}"}</code>,{" "}
            <code>{"{{ gross }}"}</code>, <code>{"{{ total_deductions }}"}</code>,{" "}
            <code>{"{{ net }}"}</code>. {tr("payroll.docForSpecificRow")}{" "}
            <code>{"{{ amount.BASIC }}"}</code>, <code>{"{{ amount.HRA }}"}</code>,{" "}
            <code>{"{{ amount.PF }}"}</code>, <code>{"{{ amount.TDS }}"}</code> {tr("payroll.docByComponentCode")}{" "}
            <code>{"{{ earnings_lines }}"}</code> /{" "}
            <code>{"{{ deductions_lines }}"}</code>.
          </p>
          <p className="mb-3 text-[12px] leading-relaxed text-[#8A929E]">
            <strong>{tr("payroll.docTipLabel")}</strong> {tr("payroll.docTipText")}{" "}
            <button
              type="button"
              onClick={() => settingsApi.downloadSampleTemplate()}
              className="font-semibold text-[#5B53E0] underline hover:text-[#4A43C9]"
            >
              {tr("payroll.downloadSampleTemplate")}
            </button>
          </p>

          {ps.has_doc_template ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E8EAED] bg-white px-3 py-2.5">
              <span className="material-symbols-rounded text-[20px] text-[#0E8A6E]">check_circle</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#374151]">{ps.doc_filename || "template.docx"}</span>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeDoc}
                  disabled={uploading}
                  className="text-[#C0383C] hover:bg-[#FDECEC]"
                >
                  {tr("payroll.remove")}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#8A929E]">{tr("payroll.noTemplateUploaded")}</p>
          )}

          {ps.has_doc_template && !ps.doc_has_tokens && (
            <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-[#F7D7D7] bg-[#FDECEC] px-3 py-2.5 text-[13px] text-[#C0383C]">
              <span className="material-symbols-rounded text-[20px]">warning</span>
              <span>
                {tr("payroll.thisTemplateHas")} <strong>{tr("payroll.docNoFillableFields")}</strong>{tr("payroll.docSoPayslips")} <strong>{tr("payroll.docNoData")}</strong>. {tr("payroll.docUse")}{" "}
                <strong>{tr("payroll.docMapYourOwnQuoted")}</strong> {tr("payroll.docBelowMapEachRow")}
              </span>
            </div>
          )}

          {canEdit && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center rounded-[10px] border border-[#E1E4E8] bg-white px-3.5 text-[13px] font-semibold text-[#374151] hover:bg-[#F4F5F7] transition-colors">
                {uploading ? tr("payroll.uploading") : ps.has_doc_template ? tr("payroll.replaceFile") : tr("payroll.uploadDocx")}
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDoc(f);
                    e.target.value = ""; // allow re-selecting the same file
                  }}
                />
              </label>
              {ps.has_doc_template && (
                <PayslipToggle
                  label={tr("payroll.useDocForPayslips")}
                  desc={tr("payroll.useDocForPayslipsDesc")}
                  disabled={!canEdit}
                  checked={ps.use_doc_template}
                  onChange={(v) => set("use_doc_template", v)}
                />
              )}
            </div>
          )}
        </div>

        {/* Smart mapping wizard — upload YOUR template, map fields, no tokens */}
        <div className="rounded-[12px] border border-[#5B53E0]/25 bg-[#ECEBFB]/40 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="material-symbols-rounded text-[20px] text-[#5B53E0]">auto_fix_high</span>
            <span className="text-[14px] font-bold text-[#15171C]">{tr("payroll.mapOwnTemplate")}</span>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-[#8A929E]">
            {tr("payroll.mapOwnDesc1")}{" "}
            <em>Basic</em>, <em>Net Pay</em> {tr("payroll.mapOwnAnd")} <em>Employee Name</em>,{" "}
            {tr("payroll.mapOwnDesc2")}
          </p>

          {ps.doc_mapped && (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E8EAED] bg-white px-3 py-2.5">
              <span className="material-symbols-rounded text-[20px] text-[#0E8A6E]">link</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#374151]">
                {tr("payroll.mappedFrom")} <strong>{ps.doc_filename || tr("payroll.yourTemplate")}</strong>
              </span>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={editMapping}
                  disabled={busy}
                  className="text-[#5B53E0] hover:bg-[#ECEBFB]"
                >
                  {tr("payroll.editMapping")}
                </Button>
              )}
            </div>
          )}

          {canEdit && (
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-[#5B53E0]/40 bg-white px-3.5 text-[13px] font-semibold text-[#5B53E0] hover:bg-[#ECEBFB] transition-colors">
              <span className="material-symbols-rounded text-[18px]">upload_file</span>
              {busy ? tr("payroll.scanning") : ps.doc_mapped ? tr("payroll.rescanReplace") : tr("payroll.uploadMyTemplate")}
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) scanDoc(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? tr("payroll.saving") : tr("payroll.savePayslipTemplate")}
            </Button>
          </div>
        )}
      </Section>

      {scan && (
        <MappingWizard
          scan={scan}
          mapping={mapping}
          busy={busy}
          onChange={setMapping}
          onCancel={() => setScan(null)}
          onApply={applyMapping}
        />
      )}
    </form>
  );
}

function PayslipToggle({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-[10px] border border-[#E8EAED] bg-white px-4 py-3 transition-colors ${disabled ? "opacity-60" : "cursor-pointer hover:border-[#D4D7DC]"}`}>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[#15171C]">{label}</span>
        <span className="block text-[12px] text-[#8A929E] mt-0.5">{desc}</span>
      </span>
      <input
        type="checkbox"
        aria-label={label}
        className="peer sr-only"
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#D4D7DC] transition-colors peer-checked:bg-[#5B53E0] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5B53E0]/40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

// Modal wizard: review the auto-detected slots and map each to a payroll field.
function MappingWizard({
  scan,
  mapping,
  busy,
  onChange,
  onCancel,
  onApply,
}: {
  scan: PayslipDocScan;
  mapping: Record<string, string>;
  busy: boolean;
  onChange: (m: Record<string, string>) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const { t: tr } = useI18n();
  const groups = Array.from(new Set(scan.fields.map((f) => f.group)));
  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const fieldLabel = (key: string) =>
    scan.fields.find((f) => f.key === key)?.label ?? key;

  function setSlot(index: number, token: string) {
    const next = { ...mapping };
    if (token) next[String(index)] = token;
    else delete next[String(index)];
    onChange(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15171C]/40 backdrop-blur-sm p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-[14px] border border-[#E8EAED] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#E8EAED] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#15171C]">{tr("payroll.mapTemplateFields")}</h3>
            <p className="truncate text-[12px] text-[#8A929E] mt-0.5">
              {tr("payroll.fieldsDetected", { filename: scan.filename, count: scan.slots.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-[8px] text-[#8A929E] hover:bg-[#F4F5F7] hover:text-[#374151] flex items-center justify-center transition-colors"
            aria-label={tr("common.close")}
          >
            <span className="material-symbols-rounded text-[22px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {scan.slots.length === 0 ? (
            <div className="rounded-[10px] border border-[#E8EAED] bg-[#F7F8FA] p-4 text-[13px] text-[#8A929E]">
              {tr("payroll.wizNoSlots1")} <strong>{tr("payroll.wizTable")}</strong> {tr("payroll.wizNoSlots2")} <em>Basic | 0.00</em>{tr("payroll.wizNoSlots3")} <em>Label: value</em> {tr("payroll.wizNoSlots4")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-[12px] text-[#8A929E]">
                {tr("payroll.mapEachLineIntroA")}{" "}
                <strong>{tr("payroll.ignore")}</strong> {tr("payroll.mapEachLineIntroB")}
              </p>
              {scan.slots.map((slot: PayslipDocSlot) => {
                const value = mapping[String(slot.index)] || "";
                return (
                  <div
                    key={slot.index}
                    className="grid grid-cols-1 items-center gap-2 rounded-[10px] border border-[#E8EAED] bg-[#F7F8FA] px-3 py-2.5 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#15171C]">
                        {slot.label || <span className="italic text-[#8A929E]">{tr("payroll.blank")}</span>}
                      </div>
                      <div className="truncate text-[12px] text-[#8A929E]">
                        {slot.context}
                        {slot.current ? ` → ${slot.current}` : ""}
                      </div>
                    </div>
                    <SelectWrap className="sm:w-64">
                      <select
                        className={`${SELECT_CLS} sm:w-64`}
                        value={value}
                        onChange={(e) => setSlot(slot.index, e.target.value)}
                        title={value ? fieldLabel(value) : tr("payroll.ignore")}
                      >
                        <option value="">{tr("payroll.ignoreOption")}</option>
                        {groups.map((g) => (
                          <optgroup key={g} label={g}>
                            {scan.fields
                              .filter((f) => f.group === g)
                              .map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    </SelectWrap>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E8EAED] px-5 py-4">
          <span className="text-[12px] text-[#8A929E]">
            {tr("payroll.fieldsMapped", { count: mappedCount })}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
              {tr("common.cancel")}
            </Button>
            <Button type="button" onClick={onApply} disabled={busy || mappedCount === 0}>
              {busy ? tr("payroll.applying") : tr("payroll.applyMappingBtn")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small success confirmation strip shown after a save.
function SavedNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[#BBE7CE] bg-[#E6F4EA] px-4 py-3 text-[13px] font-medium text-[#15803D]">
      <span className="material-symbols-rounded text-[20px]">check_circle</span>
      {children}
    </div>
  );
}

// Wraps a native <select> to add the design-system chevron affordance.
function SelectWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {children}
      <span className="material-symbols-rounded absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-[20px] pointer-events-none">expand_more</span>
    </div>
  );
}

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#F1F2F5] px-2.5 py-0.5 text-[12px] font-semibold text-[#4B5563]">
      <span className="material-symbols-rounded text-[14px] text-[#5B53E0]">{icon}</span>
      {children}
    </span>
  );
}

function Section({
  icon,
  title,
  subtitle,
  wide,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg" className={wide ? "xl:col-span-2" : ""}>
      <div className="mb-5 flex items-center gap-3 border-b border-[#E8EAED] pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#ECEBFB] text-[#5B53E0]">
          <span className="material-symbols-rounded text-[22px]">{icon}</span>
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-[#15171C]">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-[#8A929E] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <DSField label={label} required={required} hint={hint}>
      {children}
    </DSField>
  );
}
