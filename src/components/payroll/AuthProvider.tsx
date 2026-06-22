"use client";

// Compatibility shim: the ported payroll pages were written against the payroll
// module's own AuthProvider (`{ user, can, loading, logout }`). On integration we
// back that surface with Croar's AuthContext so there is a single login + user
// store. `can()` translates payroll's permission names onto Croar's RBAC strings
// (which are formatted "<module>:<action>" and use different action verbs).

import type React from "react";

import { useAuth as useCroarAuth } from "@/context/AuthContext";
import type { AuthUser, Permission } from "@/utils/payroll/auth";

// payroll permission -> Croar "<module>:<action>" string (mirrors backend _PERM_MAP).
const PERMISSION_MAP: Record<Permission, string> = {
  "payroll:read": "payroll:read",
  "payroll:configure": "payroll:update",
  "payroll:run": "payroll:generate",
  "payroll:approve": "payroll:review",
  "payroll:pay": "payroll:finalize",
  "payroll:manage": "payroll:delete",
  "users:manage": "organization:create",
};

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

export function useAuth(): AuthContextValue {
  const croar = useCroarAuth();

  const user: AuthUser | null = croar.token
    ? {
        id: croar.userId ?? "",
        company_id: "",
        email: croar.user ?? "",
        full_name: croar.user ?? "",
        role: croar.role ?? "",
        is_active: true,
        permissions: croar.permissions ?? [],
      }
    : null;

  const can = (permission: Permission): boolean =>
    croar.canAccess(PERMISSION_MAP[permission] ?? permission);

  return { user, loading: croar.isLoading, logout: croar.logout, can };
}

// The real provider lives at Croar's app root; this passthrough exists only so any
// `<AuthProvider>` usage carried over from the payroll module still compiles.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
