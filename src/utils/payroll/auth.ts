// Client-side session helpers — integrated with Croar auth.
// The JWT lives in the shared "auth_" cookie (set by Croar's AuthContext on
// login); api.ts reads it via getToken() for the Authorization header.
// Permission strings mirror the backend `payroll:*`.
import Cookies from "js-cookie";

const TOKEN_KEY = "auth_";

export type Permission =
  | "payroll:read"
  | "payroll:configure"
  | "payroll:run"
  | "payroll:approve"
  | "payroll:pay"
  | "payroll:manage"
  | "users:manage";

export interface AuthUser {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(TOKEN_KEY) ?? null;
}

export function getStoredUser(): AuthUser | null {
  // Croar's AuthContext owns the user object; payroll reads live auth via the
  // useAuth shim, so there is no separately-stored payroll user.
  return null;
}

export function setSession(token: string, _user: AuthUser): void {
  // Login is handled by Croar's AuthContext (it sets the cookie); kept for API
  // compatibility with the original payroll auth module.
  Cookies.set(TOKEN_KEY, token, { expires: 1 });
}

export function clearSession(): void {
  Cookies.remove(TOKEN_KEY);
}

export function userCan(user: AuthUser | null, permission: Permission): boolean {
  return !!user && user.permissions.includes(permission);
}

// Whether a user may use the employee self-service portal (/employee).
// In Croar there's no dedicated "self:read" permission — any authenticated user
// can open the portal; the backend self-scopes every /me response to the
// employee record linked (by email) to the signed-in user, and returns 404 if
// none exists. So this is simply "is signed in".
export function isSelfServiceUser(user: AuthUser | null): boolean {
  return !!user;
}

// Single source of truth for which permission an enterprise route requires.
// Checked in the enterprise layout so direct-URL navigation is gated, not just
// the sidebar links (defense in depth — the API also returns 403). List the
// most specific prefixes first; the first matching prefix wins.
export const routePermissions: ReadonlyArray<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: "/enterprise/payroll/dashboard", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/structures", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/templates", permission: "payroll:read" },
  { prefix: "/enterprise/payroll", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/timesheets", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/leave", permission: "payroll:read" },
  { prefix: "/enterprise/employees", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/taxes", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/reports", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/activity", permission: "payroll:read" },
  { prefix: "/enterprise/payroll/team", permission: "users:manage" },
  { prefix: "/enterprise/payroll/settings", permission: "users:manage" },
];

/** Permission required to view `pathname`, or null when the route is ungated. */
export function permissionForRoute(pathname: string): Permission | null {
  const match = routePermissions.find((r) => pathname.startsWith(r.prefix));
  return match ? match.permission : null;
}
