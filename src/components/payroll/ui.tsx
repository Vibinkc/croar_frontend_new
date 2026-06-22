"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CycleStatus } from "@/utils/payroll/api";

// Map payroll statuses onto Croar's <Badge> variants so payroll badges match the
// rest of the Croar app exactly.
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

const CYCLE_BADGE: Record<CycleStatus, BadgeVariant> = {
  DRAFT: "secondary",
  PROCESSING: "outline",
  APPROVED: "success",
  PAID: "default",
  CANCELLED: "destructive",
};

// Croar-style page header: a violet icon chip + font-black title + subtitle,
// with an optional right-aligned actions slot. Matches the enterprise pages
// (e.g. Employees, Dashboard).
export function PageHeader({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 shadow-sm shadow-[#7C3AED]/5">
          <span className="material-symbols-rounded text-2xl text-[#7C3AED]">{icon}</span>
        </div>
        <div>
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

// Croar-style metric card: white panel, icon, font-black value, muted label.
export function StatCard({
  icon,
  value,
  label,
  tone = "text-slate-900",
}: {
  icon: string;
  value: React.ReactNode;
  label: React.ReactNode;
  /** Optional Tailwind text-color class for the value. */
  tone?: string;
}) {
  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#7C3AED]/20 hover:shadow-md">
      <span className="material-symbols-rounded mb-3 text-[#7C3AED]">{icon}</span>
      <div className={`text-2xl font-black tracking-tight ${tone}`}>{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = CYCLE_BADGE[status as CycleStatus] ?? "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function PayslipBadge({ status }: { status: string }) {
  return <Badge variant={status === "PAID" ? "success" : "secondary"}>{status}</Badge>;
}

export function Modal({
  title,
  onClose,
  children,
  width = "max-w-2xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind max-width class controlling the dialog width. */
  width?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="payroll-scope fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[calc(100vh-3rem)] w-full ${width} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <span className="material-symbols-rounded text-[20px]">close</span>
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Banner({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "warn";
  children: React.ReactNode;
}) {
  const cls =
    tone === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
