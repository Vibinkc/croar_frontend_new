"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function EnterprisePortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, token, user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // List of allowed roles for the Enterprise Portal
    const ALLOWED_ENTERPRISE_ROLES = ["ADMIN", "RECRUITER", "SUPER_ADMIN", "CONSULTANCY"];

    // Skip layout for login, portal and assessment pages
    const isLoginPage = 
        pathname === "/enterprise/login" || 
        pathname === "/enterprise/login/" || 
        pathname.startsWith("/enterprise/assessments-360/portal") ||
        pathname.startsWith("/enterprise/surveys/fill") ||
        pathname.startsWith("/enterprise/ai-training/portal") ||
        (/^\/enterprise\/assessments-360\/[0-9a-f-]{36}$/i).test(pathname);

    useEffect(() => {
        if (!isLoading && !isLoginPage) {
            // Check if user is authenticated and has an allowed role
            if (!role || !token) {
                router.push("/enterprise/login");
            } else if (!ALLOWED_ENTERPRISE_ROLES.includes(role)) {
                console.warn(`Unauthorized access attempt to Enterprise Portal by role: ${role}`);
                router.push("/enterprise/login?error=unauthorized");
            }
        }
        setIsMobileMenuOpen(false);
    }, [role, token, isLoading, router, pathname, isLoginPage]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading || !role) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading Enterprise Portal...</p>
                </div>
            </div>
        );
    }

    const navGroups = [
        {
            title: "HIRING HUB",
            items: [
                { label: "Overview", icon: "grid_view", path: "/enterprise/dashboard" },
                { label: "Job Management", icon: "business_center", path: "/enterprise/jobs" },
                { label: "Applicant Pipeline", icon: "filter_list", path: "/enterprise/candidates/kanban" },
                { label: "Candidate Mailbox", icon: "alternate_email", path: "/enterprise/communication" },
            ]
        },
        {
            title: "TALENT SEARCH",
            items: [
                { label: "Candidate Search", icon: "person_search", path: "/enterprise/candidates" },
            ]
        },
        {
            title: "AUTOMATION",
            items: [
                { label: "Automation Canvas", icon: "account_tree", path: "/enterprise/automation" },
                { label: "Mail Automation", icon: "mark_email_unread", path: "/enterprise/automation/mail" },
                { label: "Assessment Automation", icon: "psychology", path: "/enterprise/automation/assessment" },
                { label: "Interview Automation", icon: "event_available", path: "/enterprise/automation/interview" },
                { label: "Onboarding Automation", icon: "person_add", path: "/enterprise/automation/onboarding" },
            ]
        },
        {
            title: "POST ONBOARDING",
            items: [
                { label: "Employees", icon: "badge", path: "/enterprise/employees" },
                { label: "Projects", icon: "account_tree", path: "/enterprise/projects" },
                { label: "Tasks", icon: "checklist", path: "/enterprise/tasks" },
                { label: "360 Assessments", icon: "360", path: "/enterprise/assessments-360" },
                { label: "HR Surveys", icon: "poll", path: "/enterprise/surveys" },
            ]
        },
        {
            title: "AI & TRAINING",
            items: [
                // { label: "Neural Coaching Lab", icon: "psychology", path: "/enterprise/ai-training/portal" },
                { label: "Scenario Architect", icon: "architecture", path: "/enterprise/ai-training/scenarios" },
            ]
        },
        {
            title: "GENERAL",
            items: [
                { label: "Organization Profile", icon: "business", path: "/enterprise/settings" },
                ...(role === "CONSULTANCY" ? [{ label: "Enterprise Partners", icon: "corporate_fare", path: "/enterprise/companies" }] : []),
                { label: "Email Templates", icon: "mail", path: "/enterprise/settings/templates" },
                { label: "Assessment Templates", icon: "quiz", path: "/enterprise/settings/assessments" },
                { label: "Interview Templates", icon: "psychology", path: "/enterprise/settings/interview-templates" },
                { label: "Onboarding Hub", icon: "person_add", path: "/enterprise/onboarding" },
                { label: "Onboarding Templates", icon: "rule", path: "/enterprise/settings/onboarding-templates" },
            ]
        }
    ];

    const navLinkClass = (path: string) => {
        // Collect all possible navigation paths to find the most specific match
        const allPaths = navGroups.flatMap(g => g.items.map(i => i.path));

        // A path is active if:
        // 1. It's an exact match
        // 2. The current pathname starts with this path AND there isn't a more specific registered path that also matches
        let isActive = pathname === path;

        if (!isActive && pathname.startsWith(path + "/")) {
            const hasBetterMatch = allPaths.some(p =>
                p !== path &&
                pathname.startsWith(p) &&
                p.length > path.length
            );
            if (!hasBetterMatch) {
                isActive = true;
            }
        }

        // Exception: "Candidate Search" should NOT be active if we are on "Applicant Pipeline"
        if (path === "/enterprise/candidates" && pathname.startsWith("/enterprise/candidates/kanban")) {
            isActive = false;
        }

        return `group flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive
            ? "bg-[#7C3AED]/10 text-[#7C3AED]"
            : "text-slate-500 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]"
            }`;
    };

    return (
        <div className="flex w-full h-screen bg-[#FDFDFF] overflow-hidden font-sans">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                    {/* Logo Section (Standard Student Portal Logo) */}
                    <div className="p-4 flex items-center justify-between shrink-0 mb-6 border-b border-slate-50">
                        <Link href="/enterprise/dashboard" className="flex items-center gap-2 tracking-tighter">
                            <span className="text-3xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent italic">CROAR.AI</span>
                        </Link>
                    </div>

                    {/* Navigation Groups */}
                    <nav className="space-y-6 px-1">
                        {navGroups.map((group) => (
                            <div key={group.title}>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3">{group.title}</p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <Link key={item.path} href={item.path} className={navLinkClass(item.path)}>
                                            <span className="material-symbols-rounded text-xl">{item.icon}</span>
                                            <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Sidebar Footer User Info (Student Portal Style) */}
                <div className="p-4 border-t border-slate-50 shrink-0">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                            {user ? user.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-700 truncate">{user || "recruiter@techcorp.com"}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{role || 'RECRUITER'}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all duration-200 group"
                    >
                        <span className="material-symbols-rounded text-slate-500 text-[20px]">logout</span>
                        <span className="text-[10px] font-bold">Logout</span>
                    </button>
                </div>
            </aside>

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
                        <span className="text-xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent italic tracking-tighter">CROAR.AI</span>
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
