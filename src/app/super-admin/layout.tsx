"use client";

import SuperAdminSidebar from "@/components/super-admin/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { role, token, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const isLoginPage = pathname?.startsWith("/super-admin/login");

    useEffect(() => {
        if (!isLoading && !isLoginPage) {
            // Require SUPER_ADMIN role for any page under /super-admin/
            if (!token || role !== "SUPER_ADMIN") {
                console.warn("Unauthorized access to Super Admin dashboard. Redirecting to login.");
                router.push("/super-admin/login");
            }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobileMenuOpen(prev => prev ? false : prev);
    }, [role, token, isLoading, isLoginPage, router, pathname]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading || (!role && !isLoginPage)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Verifying Platform Authority...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen bg-[#FDFDFF] overflow-hidden font-sans">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar with Responsive Visibility */}
            <div className={`
                fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <SuperAdminSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden w-full">
                {/* Mobile Top Bar */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:hidden shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors"
                        >
                            <span className="material-icons-outlined text-slate-600">menu</span>
                        </button>
                        <span className="text-xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent tracking-tighter">Croar.ai</span>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 w-full overflow-y-auto bg-[#FDFDFF] custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
