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
    const { role, token, user, isLoading, logout, permissions, canAccess } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // List of allowed roles for the Enterprise Portal
    const ALLOWED_ENTERPRISE_ROLES = ["ADMIN", "RECRUITER", "SUPER_ADMIN", "CONSULTANCY", "RESTRICTED_ACCESS"];

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
            // 1. Check basic authentication
            if (!role || !token) {
                router.push("/enterprise/login");
                return;
            } 
            
            // 2. Check Role Whitelist
            if (!ALLOWED_ENTERPRISE_ROLES.includes(role)) {
                console.warn(`[AUTH] Unauthorized access attempt. Role: "${role}" is not in whitelist:`, ALLOWED_ENTERPRISE_ROLES);
                router.push("/enterprise/login?error=unauthorized");
                return;
            }

            // 3. Granular Route Guard
            // Define mapping of route prefixes to required permissions
            const routePermissions: Record<string, string> = {
                "/enterprise/jobs": "jobs:read",
                "/enterprise/candidates": "candidates:read",
                "/enterprise/communication": "communications:read",
                "/enterprise/automation": "automation:read",
                "/enterprise/employees": "employees:read",
                "/enterprise/projects": "projects:read",
                "/enterprise/tasks": "tasks:read",
                "/enterprise/assessments-360": "assessments:read",
                "/enterprise/surveys": "surveys:read",
                "/enterprise/team": "organization:moderate",
                "/enterprise/ai-training": "ai_training:read"
            };

            // Find matching prefix
            const matchedRoute = Object.keys(routePermissions).find(prefix => pathname.startsWith(prefix));
            if (matchedRoute && !canAccess(routePermissions[matchedRoute])) {
                console.warn(`[AUTH] Access Denied for route: ${pathname}. Missing permission: ${routePermissions[matchedRoute]}`);
                router.push("/enterprise/dashboard?error=access_denied");
                return;
            }

            console.log(`[AUTH] Authorized access granted for role: ${role}`);
        }
        setIsMobileMenuOpen(false);
    }, [role, token, isLoading, router, pathname, isLoginPage, canAccess]);

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
                { label: "Overview", icon: "grid_view", path: "/enterprise/dashboard", permission: "organization:read" },
                { label: "Job Management", icon: "business_center", path: "/enterprise/jobs", permission: "jobs:read" },
                { label: "Applicant Pipeline", icon: "filter_list", path: "/enterprise/candidates/kanban", permission: "candidates:read" },
                { label: "Candidate Mailbox", icon: "alternate_email", path: "/enterprise/communication", permission: "communications:read" },
            ]
        },
        {
            title: "TALENT SEARCH",
            items: [
                { label: "Candidate Search", icon: "person_search", path: "/enterprise/candidates", permission: "candidates:read" },
            ]
        },
        {
            title: "AUTOMATION",
            items: [
                { label: "Automation Canvas", icon: "account_tree", path: "/enterprise/automation", permission: "automation:read" },
                { label: "Mail Automation", icon: "mark_email_unread", path: "/enterprise/automation/mail", permission: "communications:moderate" },
                { label: "Assessment Automation", icon: "psychology", path: "/enterprise/automation/assessment", permission: "assessments:moderate" },
                { label: "Interview Automation", icon: "event_available", path: "/enterprise/automation/interview", permission: "interviews:moderate" },
                { label: "Onboarding Automation", icon: "person_add", path: "/enterprise/automation/onboarding", permission: "onboarding:moderate" },
            ]
        },
        {
            title: "POST ONBOARDING",
            items: [
                { label: "Employees", icon: "badge", path: "/enterprise/employees", permission: "employees:read" },
                { label: "Projects", icon: "account_tree", path: "/enterprise/projects", permission: "projects:read" },
                { label: "Tasks", icon: "checklist", path: "/enterprise/tasks", permission: "tasks:read" },
                { label: "360 Assessments", icon: "360", path: "/enterprise/assessments-360", permission: "assessments:read" },
                { label: "HR Surveys", icon: "poll", path: "/enterprise/surveys", permission: "surveys:read" },
            ]
        },
        {
            title: "AI & TRAINING",
            items: [
                { label: "Scenario Architect", icon: "architecture", path: "/enterprise/ai-training/scenarios", permission: "ai_training:read" },
            ]
        },
        {
            title: "GENERAL",
            items: [
                { label: "Organization Profile", icon: "business", path: "/enterprise/settings", permission: "organization:read" },
                { label: "Team Management", icon: "groups", path: "/enterprise/team", permission: "organization:moderate" },
                { label: "Roles & Permissions", icon: "security", path: "/enterprise/settings/roles", permission: "organization:moderate" },
                { label: "Enterprise Partners", icon: "corporate_fare", path: "/enterprise/companies", permission: "platform:read" },
                { label: "Email Templates", icon: "mail", path: "/enterprise/settings/templates", permission: "communications:read" },
                { label: "Assessment Templates", icon: "quiz", path: "/enterprise/settings/assessments", permission: "assessments:read" },
                { label: "Interview Templates", icon: "psychology", path: "/enterprise/settings/interview-templates", permission: "interviews:read" },
                { label: "Onboarding Hub", icon: "person_add", path: "/enterprise/onboarding", permission: "onboarding:read" },
                { label: "Onboarding Templates", icon: "rule", path: "/enterprise/settings/onboarding-templates", permission: "onboarding:read" },
            ]
        }
    ];

    // Filter navGroups and items based on permissions
    const accessibleNavGroups = navGroups
        .map(group => ({
            ...group,
            items: group.items.filter(item => canAccess(item.permission))
        }))
        .filter(group => group.items.length > 0);

    const navLinkClass = (path: string) => {
        // Collect all possible navigation paths to find the most specific match
        const allPaths = accessibleNavGroups.flatMap(g => g.items.map(i => i.path));

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
                fixed inset-y-0 left-0 z-50 w-52 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                    {/* Logo Section (Standard Student Portal Logo) */}
                    <div className="p-4 flex items-center justify-between shrink-0 mb-4 border-b border-slate-50">
                        <Link href="/enterprise/dashboard" className="flex items-center gap-2 tracking-tighter">
                            <span className="text-2xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent italic">CROAR.AI</span>
                        </Link>
                    </div>

                    {/* Navigation Groups */}
                    <nav className="space-y-4 px-1">
                        {accessibleNavGroups.map((group) => (
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
                <div className="p-3 border-t border-slate-50 shrink-0">
                    <div className="flex items-center gap-2 mb-4 px-2">
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
