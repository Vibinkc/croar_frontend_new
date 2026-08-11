"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { authApi, type UserRole } from "@/utils/payroll/api";
import type { AuthUser } from "@/utils/payroll/auth";
import { Banner, Modal } from "@/components/payroll/ui";
import { PageHeader } from "@/components/ds";
import { useAuth } from "@/components/payroll/AuthProvider";

const ROLES: { value: UserRole; label: string; hint: string }[] = [
  { value: "ADMIN", label: "Admin", hint: "Full access, including managing users" },
  { value: "HR", label: "HR", hint: "Full payroll lifecycle, no user management" },
  { value: "VIEWER", label: "Viewer", hint: "Read-only access to payroll data" },
];

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
  HR: "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
  VIEWER: "bg-[var(--color-hover)] text-[var(--color-muted)]",
};

const EMPTY = { email: "", full_name: "", password: "", role: "VIEWER" as UserRole };

export default function TeamPage() {
  const { user: me } = useAuth();
  const { t: tr } = useI18n();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try {
      setUsers(await authApi.listUsers());
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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    try {
      await authApi.createUser({
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        role: form.role,
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

  const initials = (u: AuthUser) =>
    u.full_name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    u.email[0]?.toUpperCase() ||
    "?";

  return (
    <div className="px-4 sm:px-5 md:px-7 py-6 max-w-[1320px] mx-auto w-full animate-fade-in flex flex-col gap-6">
      <PageHeader
        title={tr("nav.team")}
        subtitle={tr("payroll.teamSubtitle")}
        help={tr("payroll.teamHelp")}
        actions={
          <button
            onClick={() => {
              setFormErr(null);
              setForm(EMPTY);
              setOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            <span className="material-symbols-rounded text-[20px]">person_add</span>{" "}
            {tr("payroll.addUser")}
          </button>
        }
      />

      {error && <Banner>{error}</Banner>}

      {loading ? (
        <p className="p-8 text-center text-[var(--color-muted)]">{tr("common.loading")}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <th className="px-5 py-3 font-semibold">{tr("payroll.user")}</th>
                <th className="px-5 py-3 font-semibold">{tr("payroll.email")}</th>
                <th className="px-5 py-3 font-semibold">{tr("payroll.role")}</th>
                <th className="px-5 py-3 font-semibold">{tr("payroll.status")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-purple-400 text-xs font-bold text-white">
                        {initials(u)}
                      </div>
                      <span className="font-semibold">
                        {u.full_name || "—"}
                        {me?.id === u.id && (
                          <span className="ml-2 text-xs font-normal text-[var(--color-dim)]">{tr("payroll.you")}</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        ROLE_BADGE[u.role] ?? "bg-[var(--color-hover)] text-[var(--color-muted)]"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    {u.is_active ? tr("payroll.active") : tr("payroll.inactive")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title={tr("payroll.addUser")} onClose={() => setOpen(false)}>
          <form onSubmit={create} className="flex flex-col gap-4">
            {formErr && <Banner>{formErr}</Banner>}
            <label className="flex flex-col gap-1.5">
              <span className="lbl">{tr("payroll.fullName")}</span>
              <input
                className="input"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="lbl">{tr("payroll.email")}</span>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="lbl">{tr("payroll.temporaryPassword")}</span>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <span className="text-xs text-[var(--color-dim)]">
                {tr("payroll.passwordHint")}
              </span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="lbl">{tr("payroll.role")}</span>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {tr(`payroll.role_${r.value}`)} — {tr(`payroll.roleHint_${r.value}`)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? tr("payroll.adding") : tr("payroll.addUser")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
