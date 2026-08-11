"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Hanken_Grotesk } from "next/font/google";
import CommandPalette from "@/components/enterprise/CommandPalette";
import { GuideProvider, Tour, HelpButton, GuideBook } from "@/components/guide";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/context/I18nContext";

// Maps known nav labels to i18n keys (Talent Search section is translated in this slice;
// other labels fall back to their English text until they're migrated).
const NAV_I18N: Record<string, string> = {
    // Section titles
    "Hiring Hub": "nav.hiringHub",
    "Talent Search": "nav.talentSearch",
    "Automation": "nav.automation",
    "Post Onboarding": "nav.postOnboarding",
    "Payroll": "nav.payroll",
    "AI & Training": "nav.aiTraining",
    "General": "nav.general",
    // Items
    "Dashboard": "nav.dashboard",
    "Croar Pilot": "nav.croarPilot",
    "Jobs": "nav.jobs",
    "Pipeline": "nav.pipeline",
    "Mail": "nav.mail",
    "Job Portals": "nav.jobPortals",
    "Onboarding Hub": "nav.onboardingHub",
    "Projects": "nav.projects",
    "Sequences": "nav.sequences",
    "Integrations": "nav.integrations",
    "Profile Sourcing": "nav.profileSourcing",
    "Shortlisted Talent": "nav.shortlistedTalent",
    "Candidates": "nav.candidates",
    "Canvas": "nav.canvas",
    "Assessment": "nav.assessment",
    "Interview": "nav.interview",
    "Onboarding": "nav.onboarding",
    "Employees": "nav.employees",
    "Tasks": "nav.tasks",
    "Skill Assessments": "nav.skillAssessments",
    "360 Assessments": "nav.assessments360",
    "HR Surveys": "nav.hrSurveys",
    "Payroll Dashboard": "nav.payrollDashboard",
    "Salary Templates": "nav.salaryTemplates",
    "Salary Structures": "nav.salaryStructures",
    "Timesheets": "nav.timesheets",
    "Leave": "nav.leave",
    "Taxes & Forms": "nav.taxesForms",
    "Payroll Reports": "nav.payrollReports",
    "Payroll Activity": "nav.payrollActivity",
    "Payroll Settings": "nav.payrollSettings",
    "Scenario Architect": "nav.scenarioArchitect",
    "Settings": "nav.settings",
    "Team": "nav.team",
    "Permissions": "nav.permissions",
    "Partners": "nav.partners",
    "Templates": "nav.templates",
};

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

// Croar lightning brand mark (indigo gradient chip).
function CroarMark({ size = 36 }: { size?: number }) {
    const inner = Math.round(size * 0.58);
    return (
        <div
            className="flex items-center justify-center rounded-[10px] shrink-0 shadow-[0_6px_18px_rgba(91,83,224,0.4)]"
            style={{ width: size, height: size, background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
        >
            <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
        </div>
    );
}

function getCollapsedGroupTitle(title: string) {
    const map: Record<string, string> = {
        "Hiring Hub": "Hiring",
        "Talent Search": "Talent",
        "Automation": "Auto",
        "Post Onboarding": "Post",
        "Payroll": "Payroll",
        "AI & Training": "AI",
        "General": "General"
    };
    return map[title] || title;
}

export default function EnterprisePortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, token, user, isLoading, logout, permissions, canAccess } = useAuth();
    const { t } = useI18n();
    // Translate a nav label when we have a mapping; otherwise show the original text.
    const navLabel = (label: string) => (NAV_I18N[label] ? t(NAV_I18N[label]) : label);
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    // Accordion state for the nav groups (collapsible sections keep the long menu scannable).
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    // List of allowed roles for the Enterprise Portal
    const ALLOWED_ENTERPRISE_ROLES = ["ADMIN", "RECRUITER", "SUPER_ADMIN", "CONSULTANCY", "RESTRICTED_ACCESS"];

    // Skip layout for login, portal and assessment pages
    const isLoginPage = 
        pathname.startsWith("/enterprise/login") || 
        pathname.startsWith("/enterprise/signup") || 
        pathname.startsWith("/enterprise/forgot-password") || 
        pathname.startsWith("/enterprise/reset-password") ||
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
            
            // 2a. Employee self-service users belong in their own workspace, not the admin area.
            if (role === "EMPLOYEE") {
                router.replace("/employee/dashboard");
                return;
            }

            // 2. Check Role Whitelist
            if (!ALLOWED_ENTERPRISE_ROLES.includes(role)) {
                console.warn(`[AUTH] Unauthorized access attempt. Role: "${role}" is not in whitelist:`, ALLOWED_ENTERPRISE_ROLES);
                router.push("/enterprise/login?error=unauthorized");
                return;
            }

            // 3. Granular Route Guard
            const routePermissions: Record<string, string> = {
                "/enterprise/croar-pilot": "jobs:read",
                "/enterprise/jobs": "jobs:read",
                "/enterprise/candidates": "candidates:read",
                "/enterprise/communication": "communications:read",
                "/enterprise/automation": "automation:read",
                "/enterprise/employees": "employees:read",
                "/enterprise/projects": "projects:read",
                "/enterprise/tasks": "tasks:read",
                "/enterprise/skill-assessments": "assessments:read",
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
    }, [role, token, isLoading, router, pathname, isLoginPage, canAccess]);

    useEffect(() => {
        setIsMobileMenuOpen(prev => prev ? false : prev);
    }, [pathname]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading || !role) {
        return (
            <div className={`flex justify-center items-center h-screen bg-[#F4F5F7] ${hankenGrotesk.className}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#8A929E] text-sm font-medium">Loading Enterprise Portal…</p>
                </div>
            </div>
        );
    }

    const navGroups = [
        {
            title: "Hiring Hub",
            icon: "business_center",
            items: [
                { label: "Dashboard", icon: "dashboard", path: "/enterprise/dashboard", permission: "organization:read" },
                { label: "Croar Pilot", icon: "smart_toy", path: "/enterprise/croar-pilot", permission: "jobs:read" },
                { label: "Jobs", icon: "work", path: "/enterprise/jobs", permission: "jobs:read" },
                { label: "Pipeline", icon: "view_kanban", path: "/enterprise/candidates/kanban", permission: "candidates:read" },
                { label: "Mail", icon: "mail", path: "/enterprise/communication", permission: "communications:read" },
                { label: "Job Portals", icon: "share", path: "/enterprise/settings/job-portals", permission: "jobs:read" },
                { label: "Onboarding Hub", icon: "hub", path: "/enterprise/onboarding", permission: "onboarding:read" },
            ]
        },
        {
            title: "Talent Search",
            icon: "person_search",
            items: [
                // Hidden for now — re-enable to bring the Candidate Bank back into the sidebar.
                // { label: "Candidate Bank", icon: "person_search", path: "/enterprise/candidates", permission: "candidates:read" },
                { label: "Projects", icon: "folder_open", path: "/enterprise/sourcing/projects", permission: "candidates:read" },
                { label: "Sequences", icon: "mail", path: "/enterprise/sourcing/sequences", permission: "candidates:read" },
                { label: "Integrations", icon: "extension", path: "/enterprise/sourcing/connections", permission: "candidates:read" },
                { label: "Profile Sourcing", icon: "travel_explore", path: "/enterprise/sourcing/chat", permission: "candidates:read" },
                { label: "Shortlisted Talent", icon: "how_to_reg", path: "/enterprise/sourcing/shortlisted", permission: "candidates:read" },
            ]
        },
        {
            title: "Automation",
            icon: "rocket_launch",
            items: [
                { label: "Canvas", icon: "account_tree", path: "/enterprise/automation", permission: "automation:read" },
                { label: "Mail", icon: "forward_to_inbox", path: "/enterprise/automation/mail", permission: "communications:moderate" },
                { label: "Assessment", icon: "psychology", path: "/enterprise/automation/assessment", permission: "assessments:moderate" },
                { label: "Interview", icon: "co_present", path: "/enterprise/automation/interview", permission: "interviews:moderate" },
                { label: "Onboarding", icon: "person_add", path: "/enterprise/automation/onboarding", permission: "onboarding:moderate" },
            ]
        },
        {
            title: "Post Onboarding",
            icon: "groups",
            items: [
                { label: "Employees", icon: "badge", path: "/enterprise/employees", permission: "employees:read" },
                { label: "Projects", icon: "workspaces", path: "/enterprise/projects", permission: "projects:read" },
                { label: "Tasks", icon: "checklist", path: "/enterprise/tasks", permission: "tasks:read" },
                { label: "Skill Assessments", icon: "quiz", path: "/enterprise/skill-assessments", permission: "assessments:read" },
                { label: "360 Assessments", icon: "360", path: "/enterprise/assessments-360", permission: "assessments:read" },
                { label: "HR Surveys", icon: "poll", path: "/enterprise/surveys", permission: "surveys:read" },
            ]
        },
        {
            title: "Payroll",
            icon: "account_balance_wallet",
            items: [
                { label: "Payroll Dashboard", icon: "space_dashboard", path: "/enterprise/payroll/dashboard", permission: "payroll:read" },
                { label: "Payroll", icon: "payments", path: "/enterprise/payroll", permission: "payroll:read" },
                { label: "Salary Templates", icon: "description", path: "/enterprise/payroll/templates", permission: "payroll:read" },
                { label: "Salary Structures", icon: "tune", path: "/enterprise/payroll/structures", permission: "payroll:read" },
                { label: "Timesheets", icon: "schedule", path: "/enterprise/payroll/timesheets", permission: "payroll:read" },
                { label: "Leave", icon: "event_available", path: "/enterprise/payroll/leave", permission: "payroll:read" },
                { label: "Taxes & Forms", icon: "request_quote", path: "/enterprise/payroll/taxes", permission: "payroll:read" },
                { label: "Payroll Reports", icon: "summarize", path: "/enterprise/payroll/reports", permission: "payroll:read" },
                { label: "Payroll Activity", icon: "history", path: "/enterprise/payroll/activity", permission: "payroll:read" },
                { label: "Payroll Settings", icon: "settings_applications", path: "/enterprise/payroll/settings", permission: "payroll:read" },
            ]
        },
        /*
        {
            title: "AI & Training",
            icon: "psychology",
            items: [
                { label: "Scenario Architect", icon: "architecture", path: "/enterprise/ai-training/scenarios", permission: "ai_training:read" },
            ]
        },
        */
        {
            title: "General",
            icon: "settings",
            items: [
                { label: "Settings", icon: "settings", path: "/enterprise/settings", permission: "organization:read" },
                { label: "Team", icon: "groups", path: "/enterprise/team", permission: "organization:moderate" },
                { label: "Permissions", icon: "admin_panel_settings", path: "/enterprise/settings/roles", permission: "organization:moderate" },
                { label: "Partners", icon: "corporate_fare", path: "/enterprise/companies", permission: "platform:read" },
                { label: "Templates", icon: "dashboard_customize", path: "/enterprise/templates", permission: "organization:read" },
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

    // Flattened list for the ⌘K command palette.
    const commandItems = accessibleNavGroups.flatMap(g =>
        g.items.map(i => ({ label: navLabel(i.label), icon: i.icon, path: i.path, group: navLabel(g.title) }))
    );

    // True when the given path is the best (most specific) match for the current route.
    const isItemActive = (path: string) => {
        const allPaths = accessibleNavGroups.flatMap(g => g.items.map(i => i.path));
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

        // Exception: "Candidate Bank" should NOT be active if we are on "Applicant Pipeline"
        if (path === "/enterprise/candidates" && pathname.startsWith("/enterprise/candidates/kanban")) {
            isActive = false;
        }

        return isActive;
    };

    const navLinkClass = (path: string) => {
        const isActive = isItemActive(path);
        return `group flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] transition-all duration-150 text-[12.5px] ${
            isActive
                ? "bg-[#5B53E0] text-white shadow-[0_4px_12px_rgba(91,83,224,0.25)] font-semibold"
                : "text-[#BAC1CC] hover:bg-white/[0.04] hover:text-white font-medium"
        } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`;
    };

    const activeGroupTitle = accessibleNavGroups.find(g => g.items.some(i => isItemActive(i.path)))?.title;
    const isGroupOpen = (title: string) => openGroups[title] ?? (title === activeGroupTitle);
    const toggleGroup = (title: string) =>
        setOpenGroups(prev => ({ ...prev, [title]: !(prev[title] ?? (title === activeGroupTitle)) }));

    return (
        <GuideProvider>
        <div className={`flex w-full h-screen bg-[#F4F5F7] overflow-hidden ${hankenGrotesk.className}`}>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    role="button"
                    tabIndex={0}
                    className="fixed inset-0 bg-[#0E1014]/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setIsMobileMenuOpen(false); } }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                fixed inset-y-0 left-0 z-50 ${isSidebarCollapsed ? 'w-[90px]' : 'w-[236px]'} flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:h-screen border-r border-[#1C1F26]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
                style={{ background: "#090A0C" }}
            >
                <div className="p-3 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                    {/* Logo Section */}
                    <div className={`px-2 pt-2.5 pb-4 flex items-center justify-between shrink-0 mb-3 border-b border-[#1C1F26] relative ${isSidebarCollapsed ? 'px-0 flex-col gap-4 justify-center' : ''}`}>
                        <Link href="/enterprise/dashboard" className="flex items-center gap-2.5">
                            <CroarMark size={32} />
                            {!isSidebarCollapsed && (
                                <span className="flex flex-col leading-none">
                                    <span className="text-[17px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                                    <span className="text-[9.5px] text-[#4F5564] font-semibold uppercase mt-0.5 tracking-wider">HR Cloud</span>
                                </span>
                            )}
                        </Link>

                        {/* Toggle Button Positioned on Edge */}
                        {!isSidebarCollapsed && (
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="w-6 h-6 rounded-full border border-[#252A33] bg-[#1A1E25] hover:bg-[#23272F] text-[#8A929E] hover:text-white transition-colors flex items-center justify-center cursor-pointer absolute -right-3 top-6 shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>
                        )}
                        {isSidebarCollapsed && (
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="w-6 h-6 rounded-full border border-[#252A33] bg-[#1A1E25] hover:bg-[#23272F] text-[#8A929E] hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Quick search (opens the ⌘K command palette) */}
                    <button
                        data-tour="search"
                        onClick={() => setIsPaletteOpen(true)}
                        title="Search (Ctrl/Cmd + K)"
                        className={`flex items-center gap-2 mb-4 mx-1 px-3.5 h-10 rounded-[10px] border border-[#1F242E] bg-[#13161C]/50 text-[#6B7280] hover:text-[#9CA3AF] hover:border-[#5B53E0]/50 hover:bg-[#161A22] transition-all duration-200 cursor-pointer shrink-0 ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        {!isSidebarCollapsed && (
                            <>
                                <span className="text-[12.5px] font-medium flex-1 text-left">Search…</span>
                                <span className="text-[10px] font-bold bg-[#1E2330]/60 border border-[#2B3142]/60 text-[#5B6376] rounded-[5px] px-1.5 h-5 leading-none shrink-0 inline-flex items-center justify-center">⌘K</span>
                            </>
                        )}
                    </button>

                    {/* Navigation Groups — collapsible accordion (keeps the long menu scannable) */}
                    <nav data-tour="nav" className={isSidebarCollapsed ? "space-y-4 px-1" : "space-y-1 px-1"}>
                        {accessibleNavGroups.map((group) => {
                            const open = isSidebarCollapsed ? true : isGroupOpen(group.title);
                            const hasActive = group.items.some((i) => isItemActive(i.path));
                            return (
                                <div key={group.title} className={isSidebarCollapsed ? "" : "mb-2"}>
                                    {isSidebarCollapsed && (
                                        <div className="text-center mt-4 mb-2 px-1 select-none">
                                            <span className="text-[11px] font-bold tracking-widest uppercase text-[#5C6370] block whitespace-nowrap truncate">
                                                {getCollapsedGroupTitle(group.title)}
                                            </span>
                                        </div>
                                    )}
                                    {!isSidebarCollapsed && (
                                        <button
                                            onClick={() => toggleGroup(group.title)}
                                            className={`group/hdr flex items-center justify-between w-full px-3.5 py-2.5 rounded-[10px] transition-all duration-150 text-[12.5px] cursor-pointer ${
                                                hasActive
                                                    ? "text-[#8B7DFF] font-semibold bg-white/[0.02]"
                                                    : "text-[#BAC1CC] hover:bg-white/[0.04] hover:text-white font-medium"
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className={`material-symbols-rounded text-[18px] ${hasActive ? 'text-[#8B7DFF]' : 'text-[#656D7A] group-hover/hdr:text-white transition-colors'}`}>{group.icon}</span>
                                                <span className="whitespace-nowrap">{navLabel(group.title)}</span>
                                            </span>
                                            <svg className={`w-3.5 h-3.5 ${hasActive ? 'text-[#8B7DFF]' : 'text-[#656D7A] group-hover/hdr:text-white'} transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m6 9 6 6 6-6"/>
                                            </svg>
                                        </button>
                                    )}
                                    {open && (
                                        isSidebarCollapsed ? (
                                            <div className="space-y-0.5">
                                                {group.items.map((item) => {
                                                    const isActive = isItemActive(item.path);
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            href={item.path}
                                                            className={navLinkClass(item.path)}
                                                            title={item.label}
                                                        >
                                                            <span className={`material-symbols-rounded text-[18px] ${isActive ? 'text-white' : 'text-[#656D7A] group-hover:text-white transition-colors'}`}>{item.icon}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="relative pl-5 ml-[22px] border-l border-white/10 mt-1 mb-2 space-y-1">
                                                {group.items.map((item) => {
                                                    const isActive = isItemActive(item.path);
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            href={item.path}
                                                            className={`flex items-center justify-between px-3 py-1.5 rounded-[8px] text-[12.5px] transition-all duration-150 ${
                                                                isActive
                                                                    ? "bg-[#5B53E0]/15 border border-[#5B53E0]/30 text-[#8B7DFF] font-bold"
                                                                    : "text-[#BAC1CC] hover:text-white hover:bg-white/[0.02] border border-transparent font-medium"
                                                            }`}
                                                        >
                                                            <span>{navLabel(item.label)}</span>
                                                            {item.label === "Croar Pilot" && (
                                                                <span className="px-1.5 py-0.5 rounded-[6px] bg-[#14161F] border border-[#5B53E0]/20 text-[#8B7DFF] text-[9.5px] font-extrabold uppercase tracking-wider leading-none">
                                                                    AI
                                                                </span>
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer User Info */}
                <div className={`p-3 border-t border-[#1C1F26] shrink-0 ${isSidebarCollapsed ? 'px-1' : ''}`}>
                    {!isSidebarCollapsed && (
                        <div className="mb-3">
                            <LanguageSwitcher variant="dark" />
                        </div>
                    )}
                    <div className={`flex items-center gap-2.5 mb-3 px-2 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
                        <div className="w-8 h-8 rounded-[8px] bg-[#5B53E0] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_2px_8px_rgba(91,83,224,0.3)]">
                            {user ? user.charAt(0).toUpperCase() : 'R'}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#C7CCD4] truncate">{user || "recruiter@techcorp.com"}</p>
                                <p className="text-[10px] font-medium text-[#525969]">{role ? role.charAt(0) + role.slice(1).toLowerCase() : 'Recruiter'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[#8A929E] hover:bg-white/[0.04] hover:text-rose-400 rounded-[10px] transition-colors duration-150 group cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        title={isSidebarCollapsed ? t("general.logout") : ''}
                    >
                        <span className="material-symbols-rounded text-[18px] text-[#525969] group-hover:text-rose-400">logout</span>
                        {!isSidebarCollapsed && <span className="text-[12.5px] font-medium">{t("general.logout")}</span>}
                    </button>
                </div>
            </aside>

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
                    <LanguageSwitcher compact />
                </header>

                {/* Content */}
                <main className="flex-1 w-full overflow-y-auto bg-[#F4F5F7] custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Global command palette (⌘K) — jump to any accessible page */}
            <CommandPalette open={isPaletteOpen} onOpenChange={setIsPaletteOpen} items={commandItems} />
        </div>

        {/* In-app onboarding: first-run coach-mark tour, persistent Help launcher,
            and the detailed product guide. */}
        <Tour />
        <HelpButton />
        <GuideBook />
        </GuideProvider>
    );
}
