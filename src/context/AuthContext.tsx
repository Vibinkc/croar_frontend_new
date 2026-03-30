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
    login: (token: string, role: string) => void;
    logout: () => void;
    isLoading: boolean;
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
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        // Check for cookie on mount
        const token = Cookies.get("auth_");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
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

            } catch (e) {
                console.error("Invalid token", e);
                Cookies.remove("auth_");
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, userRole: string) => {
        Cookies.set("auth_", token, { expires: 1, secure: false }); // secure: true in prod
        setAccessToken(token);
        setRole(userRole);
        try {
            const decoded: any = jwtDecode(token);
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

        } catch (e) {
            console.error("Invalid token on login", e);
        }
    };

    const logout = () => {
        Cookies.remove("auth_");
        setAccessToken(null);
        setRole(null);
        setUser(null);
        setUserId(null);
        setDepartmentId(null);

        setDepartmentName(null);
        setDivisionId(null);
        setDivisionName(null);
        setBatch(null);
        router.push("/login");
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
            login,
            logout,
            isLoading
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
