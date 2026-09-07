"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/payroll/AuthProvider";
import { DialogProvider } from "@/components/payroll/DialogProvider";
import { isSelfServiceUser } from "@/utils/payroll/auth";
import { CroarMark, Icon } from "@/components/ds";
import { useI18n } from "@/context/I18nContext";

const NAV = [
    { labelKey: "navDashboard", icon: "space_dashboard", path: "/employee/dashboard" },
    { labelKey: "navTimesheets", icon: "schedule", path: "/employee/timesheets" },
    { labelKey: "navLeave", icon: "event_available", path: "/employee/leave" },
    { labelKey: "navPayslips", icon: "receipt_long", path: "/employee/payslips" },
    { labelKey: "navSkillAssessments", icon: "quiz", path: "/employee/skill-assessments" },
    { labelKey: "navFeedback", icon: "rate_review", path: "/employee/feedback" },
    { labelKey: "navSurveys", icon: "poll", path: "/employee/surveys" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();
    const { t } = useI18n();

    // Guard: unauthenticated -> enterprise login; non-self-service (admin/HR) ->
    // the enterprise app (this area is only for linked employees).
    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/enterprise/login");
        else if (!isSelfServiceUser(user)) router.replace("/enterprise/dashboard");
    }, [loading, user, router]);

    if (loading || !user || !isSelfServiceUser(user)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] font-sans text-[13px] font-semibold text-[#757575]">
                {t("employee.loading")}
            </div>
        );
    }

    // The skill-assessment take route is an immersive, full-screen test (like the
    // candidate assessment player) — render it without the workspace sidebar/shell.
    const isImmersive = /^\/employee\/skill-assessments\/[^/]+$/.test(pathname);
    if (isImmersive) {
        return <DialogProvider>{children}</DialogProvider>;
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
        return `group flex items-center gap-3 px-3 h-10 rounded-[4px] border transition-colors ${
            active
                ? "bg-[#1976D2]/15 border-[#1976D2]/30 text-[#42A5F5] font-semibold"
                : "border-transparent text-[#BAC1CC] hover:bg-white/[0.04] hover:text-white"
        }`;
    };

    return (
        <DialogProvider>
            <div className="flex w-full h-screen bg-[#F5F6F8] overflow-hidden font-sans">
                {/* Sidebar */}
                <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-[#263238] flex flex-col" style={{ background: "#090A0C" }}>
                    <div className="p-3 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                        {/* Logo */}
                        <div className="px-2 pt-2.5 pb-4 flex items-center shrink-0 mb-3 border-b border-[#263238]">
                            <Link href="/employee/dashboard" aria-label="Croar HR Cloud" className="flex items-center gap-2.5">
                                <CroarMark size={32} />
                                <span className="flex flex-col leading-none">
                                    <span className="text-[17px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                                    <span className="text-[9.5px] text-[#4F5564] font-semibold uppercase mt-0.5 tracking-wider">HR Cloud</span>
                                </span>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5C6370] mb-2 px-3">{t("employee.myWorkspace")}</p>
                            <div className="space-y-0.5">
                                {NAV.map((item) => (
                                    <Link key={item.path} href={item.path} className={navLinkClass(item.path)}>
                                        <Icon name={item.icon} className="text-[20px]" />
                                        <span className="text-[13px] font-semibold whitespace-nowrap">{t(`employee.${item.labelKey}`)}</span>
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    </div>

                    {/* Footer: user + logout */}
                    <div className="p-3 border-t border-[#263238] shrink-0">
                        <div className="flex items-center gap-2.5 mb-3 px-1.5">
                            <div className="w-9 h-9 rounded-[4px] bg-[#1976D2] text-white flex items-center justify-center font-bold text-[12px] uppercase shrink-0 shadow-[0_2px_8px_rgba(25,118,210,0.3)]">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12.5px] font-semibold text-[#BDBDBD] truncate">
                                    {user.full_name || user.email}
                                </p>
                                <p className="text-[11px] font-medium text-[#525969]">{t("employee.roleEmployee")}</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="group w-full flex items-center gap-3 px-3 h-10 rounded-[4px] text-[#757575] hover:bg-white/[0.04] hover:text-rose-400 transition-colors"
                        >
                            <i className="mdi mdi-logout text-[20px] text-[#525969] group-hover:text-rose-400" />
                            <span className="text-[13px] font-semibold">{t("employee.logout")}</span>
                        </button>
                    </div>
                </aside>

                {/* Main content — pages own their padding (enterprise-style containers) */}
                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden w-full">
                    <main className="flex-1 w-full overflow-y-auto bg-[#F5F6F8] custom-scrollbar payroll-scope">{children}</main>
                </div>
            </div>
        </DialogProvider>
    );
}
