"use client";

// Payroll section layout. The outer chrome (sidebar, top bar, auth guard) comes
// from Croar's enterprise layout; this only supplies the payroll DialogProvider
// context (async confirm/alert) that the ported payroll pages depend on.

import type React from "react";

import { DialogProvider } from "@/components/payroll/DialogProvider";

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <DialogProvider>
      {/* No padding/background here — each payroll page owns its spacing via the
          standard `px-4 sm:px-5 md:px-7 max-w-[1320px] mx-auto` container, exactly
          like the Jobs page. The `payroll-scope` class is kept for legacy CSS vars. */}
      <div className="payroll-scope">{children}</div>
    </DialogProvider>
  );
}
