"use client";

import { useI18n } from "@/context/I18nContext";

/**
 * Shown on employee self-service pages when the signed-in user has no linked
 * Employee record. Every `/api/v1/me` endpoint 404s with "No employee record is
 * linked to your account." for such users (admins, recruiters, self-registered
 * accounts). Without this they'd see a raw red error banner on every page.
 */

/** True when an error is the backend's "your account isn't an employee" signal. */
export function isNoEmployeeLink(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("employee record") || m.includes("not associated with a company");
}

export default function NotLinkedNotice() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-[#E0E0E0] bg-white px-6 py-16 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[4px] bg-[#E3F2FD] text-[#1976D2]">
        <span className="material-symbols-rounded text-[32px]">badge</span>
      </span>
      <h2 className="text-[18px] font-bold tracking-tight text-[#212121]">
        {t("employee.notLinkedTitle")}
      </h2>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-[#757575]">
        {t("employee.notLinkedBody")}
      </p>
    </div>
  );
}
