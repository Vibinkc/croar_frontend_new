"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/payroll/AuthProvider";
import { DialogProvider } from "@/components/payroll/DialogProvider";
import { isSelfServiceUser } from "@/utils/payroll/auth";

const NAV = [
    { label: "Dashboard", icon: "space_dashboard", path: "/employee/dashboard" },
    { label: "Timesheets", icon: "schedule", path: "/employee/timesheets" },
    { label: "Leave", icon: "event_available", path: "/employee/leave" },
    { label: "Payslips", icon: "receipt_long", path: "/employee/payslips" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();

    // Guard: unauthenticated -> enterprise login; non-self-service (admin/HR) ->
    // the enterprise app (this area is only for linked employees).
    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/enterprise/login");
        else if (!isSelfServiceUser(user)) router.replace("/enterprise/dashboard");
    }, [loading, user, router]);

    if (loading || !user || !isSelfServiceUser(user)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] font-sans text-slate-500">
                Loading…
            </div>
        );
    }

    const initials =
        (user.full_name || user.email || "?")
            .split(" ")
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?";

    const navLinkClass = (path: string) => {
        const active = pathname === path || pathname.startsWith(path + "/");
        return `group flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            active
                ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                : "text-slate-500 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]"
        }`;
    };

    return (
        <DialogProvider>
            <div className="flex w-full h-screen bg-[#F8FAFC] overflow-hidden font-sans">
                {/* Sidebar — matches the enterprise admin portal */}
                <aside className="sticky top-0 h-screen w-52 shrink-0 bg-white border-r border-slate-100 flex flex-col">
                    <div className="p-2 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                        {/* Logo */}
                        <div className="p-4 flex items-center justify-between shrink-0 mb-4 border-b border-slate-50">
                            <Link href="/employee/dashboard" className="flex items-center gap-2 tracking-tighter">
                                <span className="text-2xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent">
                                    Croar.ai
                                </span>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-4 px-1">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 mb-2 px-3">My Workspace</p>
                                <div className="space-y-0.5">
                                    {NAV.map((item) => (
                                        <Link key={item.path} href={item.path} className={navLinkClass(item.path)}>
                                            <span className="material-symbols-rounded text-xl">{item.icon}</span>
                                            <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Footer: user + logout */}
                    <div className="p-3 border-t border-slate-50 shrink-0">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-700 truncate">
                                    {user.full_name || user.email}
                                </p>
                                <p className="text-[10px] font-medium text-slate-400">Employee</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-all duration-200 group"
                        >
                            <span className="material-symbols-rounded text-slate-500 text-[20px]">logout</span>
                            <span className="text-[10px] font-bold">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden w-full">
                    <main className="flex-1 w-full overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
                        <div className="payroll-scope p-6 md:p-8">{children}</div>
                    </main>
                </div>
            </div>
        </DialogProvider>
    );
}
