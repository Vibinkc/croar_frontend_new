"use client";

// Payroll section layout. The outer chrome (sidebar, top bar, auth guard) comes
// from Croar's enterprise layout; this only supplies the payroll DialogProvider
// context (async confirm/alert) that the ported payroll pages depend on.

import type React from "react";

import { DialogProvider } from "@/components/payroll/DialogProvider";

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <DialogProvider>
      <div className="payroll-scope min-h-screen bg-[var(--color-bg)] p-6 md:p-8">{children}</div>
    </DialogProvider>
  );
}
