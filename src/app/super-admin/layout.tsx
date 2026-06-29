"use client";

import SuperAdminSidebar from "@/components/super-admin/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { CroarMark } from "@/components/ds";

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
            <div className="flex h-screen items-center justify-center bg-[#F4F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#8A929E] text-[13px] font-medium">Verifying platform authority…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-screen bg-[#F4F5F7] overflow-hidden">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    role="button"
                    tabIndex={0}
                    className="fixed inset-0 bg-[#0E1014]/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                        }
                    }}
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
                <header className="h-16 bg-white border-b border-[#E8EAED] flex items-center justify-between px-6 md:hidden shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 rounded-[10px] hover:bg-[#F4F5F7] flex items-center justify-center transition-colors"
                        >
                            <span className="material-icons-outlined text-[#374151]">menu</span>
                        </button>
                        <span className="flex items-center gap-2">
                            <CroarMark size={28} />
                            <span className="text-[17px] font-extrabold tracking-[-0.3px] text-[#15171C]">Croar</span>
                        </span>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 w-full overflow-y-auto bg-[#F4F5F7] custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
