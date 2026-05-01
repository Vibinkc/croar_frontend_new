"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface AuthContextType {
    accessToken: string | null;
    token: string | null; // Alias for accessToken
    role: string | null; // "SUPER_ADMIN" | "ADMIN" | "STUDENT"
    user: string | null;
    userId: string | null;
    departmentId: number | null;
    departmentName: string | null;
    divisionId: number | null;
    divisionName: string | null;
    batch: string | null;
    permissions: string[];
    canAccess: (permission?: string) => boolean;
    isLoading: boolean;
    login: (token: string, userRole: string) => void;
    logout: () => void;
    ssoProvider: string | null;
}

interface JWTPayload {
    role?: string;
    sub?: string;
    user_id?: string;
    department_id?: number;
    department_name?: string;
    division_id?: number;
    division_name?: string;
    batch?: string;
    sso?: string;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [user, setUser] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [departmentId, setDepartmentId] = useState<number | null>(null);
    const [departmentName, setDepartmentName] = useState<string | null>(null);
    const [divisionId, setDivisionId] = useState<number | null>(null);
    const [divisionName, setDivisionName] = useState<string | null>(null);
    const [batch, setBatch] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [ssoProvider, setSsoProvider] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        // Check for cookie on mount
        const token = Cookies.get("auth_");
        if (token) {
            fetchMe(token);
            try {
                const decoded = jwtDecode<JWTPayload>(token);
                setAccessToken(token);
                if (decoded.role) {
                    setRole(decoded.role);
                } else {
                    setRole("STUDENT"); // Fallback
                }
                if (decoded.sub) {
                    setUser(decoded.sub);
                }
                if (decoded.user_id) {
                    setUserId(decoded.user_id);
                }
                if (decoded.department_id) {
                    setDepartmentId(decoded.department_id);
                }
                if (decoded.department_name) {
                    setDepartmentName(decoded.department_name);
                }
                if (decoded.division_id) {
                    setDivisionId(decoded.division_id);
                }
                if (decoded.division_name) {
                    setDivisionName(decoded.division_name);
                }
                if (decoded.batch) {
                    setBatch(decoded.batch);
                }
                if (decoded.sso) {
                    setSsoProvider(decoded.sso);
                }

            } catch (e) {
                console.error("Invalid token", e);
                Cookies.remove("auth_");
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchMe = async (token: string) => {
        try {
            const { BACKEND_URL } = await import("@/utils/api");
            const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPermissions(data.permissions || []);
                if (data.role) setRole(data.role);
                if (data.first_name || data.last_name) {
                    setUser(`${data.first_name} ${data.last_name}`.trim());
                }
            }
        } catch (e) {
            console.error("Error fetching user context", e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string, userRole: string) => {
        Cookies.set("auth_", token, { expires: 1, secure: false }); // secure: true in prod
        setAccessToken(token);
        setRole(userRole);
        fetchMe(token);
        try {
            const decoded = jwtDecode<JWTPayload>(token);
            if (decoded.sub) {
                setUser(decoded.sub);
            }
            if (decoded.user_id) {
                setUserId(decoded.user_id);
            }
            if (decoded.department_id) {
                setDepartmentId(decoded.department_id);
            }
            if (decoded.division_id) {
                setDivisionId(decoded.division_id);
            }
            if (decoded.division_name) {
                setDivisionName(decoded.division_name);
            }
            if (decoded.batch) {
                setBatch(decoded.batch);
            }
            if (decoded.sso) {
                setSsoProvider(decoded.sso);
            }

        } catch (e) {
            console.error("Invalid token on login", e);
        }
    };

    const logout = async () => {
        const isEnterprise = window.location.pathname.startsWith('/enterprise');
        const currentSso = ssoProvider;
        
        Cookies.remove("auth_");
        setAccessToken(null);
        setRole(null);
        setUser(null);
        setUserId(null);
        setSsoProvider(null);
        setDepartmentId(null);
        setDepartmentName(null);
        setDivisionId(null);
        setDivisionName(null);
        setBatch(null);

        if (currentSso === "microsoft") {
            try {
                const { getMsalInstance } = await import("@/utils/microsoftAuth");
                const msal = await getMsalInstance();
                await msal.logoutRedirect({
                    postLogoutRedirectUri: window.location.origin + (isEnterprise ? "/enterprise/login" : "/login")
                });
                return; // Redirect handled by MSAL
            } catch (e) {
                console.error("Microsoft logout error", e);
            }
        }
        
        if (isEnterprise) {
            router.push("/enterprise/login");
        } else {
            router.push("/login");
        }
    };

    const canAccess = (requiredPermission?: string) => {
        if (role === "SUPER_ADMIN") return true;
        if (!requiredPermission) return true;
        return permissions.includes(requiredPermission);
    };

    return (
        <AuthContext.Provider value={{
            accessToken,
            token: accessToken,
            role,
            user,
            userId,
            departmentId,
            departmentName,
            divisionId,
            divisionName,
            batch,
            permissions,
            canAccess,
            login,
            logout,
            isLoading,
            ssoProvider
        }}>
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
