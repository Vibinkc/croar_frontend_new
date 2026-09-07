"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Roboto } from "next/font/google";
import CommandPalette from "@/components/enterprise/CommandPalette";
import { GuideProvider, Tour, HelpButton, GuideBook } from "@/components/guide";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

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
    "Career Page": "nav.careerPage",
    "Job Posts": "nav.jobPosts",
    "Career Page Settings": "nav.careerPageSettings",
    "Embed & Share": "nav.embedShare",
    "Back to Croar": "nav.backToCroar",
    "Onboarding Hub": "nav.onboardingHub",
    "Projects": "nav.projects",
    "Sequences": "nav.sequences",
    "Integrations": "nav.integrations",
    "Profile Sourcing": "nav.profileSourcing",
    "Sourcing Hub": "nav.sourcingHub",
    "Candidates List": "nav.candidatesList",
    "Advanced Search": "nav.advancedSearch",
    "Folders": "nav.folders",
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

// Roboto, matching Manatal. Named as before so the two usages below need no churn.
const hankenGrotesk = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });

// Croar lightning brand mark (indigo gradient chip).
function CroarMark({ size = 36 }: { size?: number }) {
    const inner = Math.round(size * 0.58);
    return (
        <div
            className="flex items-center justify-center rounded-[4px] shrink-0 shadow-[0_6px_18px_rgba(25,118,210,0.4)]"
            style={{ width: size, height: size, background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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
                "/enterprise/integrations": "jobs:read",
                "/enterprise/career-page": "jobs:read",
                "/enterprise/candidates": "candidates:read",
                "/enterprise/candidates/search": "candidates:read",
                "/enterprise/candidates/folders": "candidates:read",
                "/enterprise/sourcing/hub": "candidates:read",
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
            <div className={`flex justify-center items-center h-screen bg-[#F5F6F8] ${hankenGrotesk.className}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#757575] text-sm font-medium">Loading Enterprise Portal…</p>
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
                { label: "Mail", icon: "mail", path: "/enterprise/communication", permission: "communications:read" },
                { label: "Career Page", icon: "public", path: "/enterprise/career-page", permission: "jobs:read" },
                { label: "Job Portals", icon: "share", path: "/enterprise/settings/job-portals", permission: "jobs:read" },
                { label: "Onboarding Hub", icon: "hub", path: "/enterprise/onboarding", permission: "onboarding:read" },
            ]
        },
        // Talent Search is commented out in favour of the Sourcing Hub, which covers the same
        // ground in one screen: filters, results, and the path onto a job. Kept rather than
        // deleted — Projects, Sequences and Shortlisted Talent still have working pages behind
        // them, and this is a presentation decision that may well be reversed.
        //
        // {
        //     title: "Talent Search",
        //     icon: "person_search",
        //     items: [
        //         { label: "Projects", icon: "folder_open", path: "/enterprise/sourcing/projects", permission: "candidates:read" },
        //         { label: "Sequences", icon: "mail", path: "/enterprise/sourcing/sequences", permission: "candidates:read" },
        //         { label: "Profile Sourcing", icon: "travel_explore", path: "/enterprise/sourcing/chat", permission: "candidates:read" },
        //         { label: "Shortlisted Talent", icon: "how_to_reg", path: "/enterprise/sourcing/shortlisted", permission: "candidates:read" },
        //     ]
        // },
        // Candidates and Sourcing Hub are deliberately two groups, matching Manatal. They answer
        // different questions: Candidates is "who do we already know?", the hub is "who else is
        // out there?". Folding them together buries the database under the search.
        {
            title: "Candidates",
            icon: "groups",
            items: [
                { label: "Candidates List", icon: "format_list_bulleted", path: "/enterprise/candidates", permission: "candidates:read" },
                { label: "Advanced Search", icon: "search", path: "/enterprise/candidates/search", permission: "candidates:read" },
                { label: "Folders", icon: "folder", path: "/enterprise/candidates/folders", permission: "candidates:read" },
            ]
        },
        {
            title: "Sourcing Hub",
            icon: "travel_explore",
            items: [
                { label: "Sourcing Hub", icon: "travel_explore", path: "/enterprise/sourcing/hub", permission: "candidates:read" },
                // Hidden from the nav, matching Manatal, which has no equivalent of these three.
                // Commented rather than deleted: all three still have working pages and live
                // routes behind them, so this is a presentation decision that can be reversed by
                // uncommenting. Note they also disappear from the command palette, which builds
                // its list from these items.
                // { label: "Shortlisted Talent", icon: "how_to_reg", path: "/enterprise/sourcing/shortlisted", permission: "candidates:read" },
                // { label: "Projects", icon: "folder_open", path: "/enterprise/sourcing/projects", permission: "candidates:read" },
                // { label: "Sequences", icon: "mail", path: "/enterprise/sourcing/sequences", permission: "candidates:read" },
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
                { label: "Video Reviews", icon: "smart_display", path: "/enterprise/skill-assessments/video-reviews", permission: "assessments:read" },
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
                { label: "Integrations", icon: "extension", path: "/enterprise/integrations", permission: "jobs:read" },
                { label: "Credits", icon: "account_balance_wallet", path: "/enterprise/credits", permission: "organization:read" },
                { label: "Team", icon: "groups", path: "/enterprise/team", permission: "organization:moderate" },
                { label: "Permissions", icon: "admin_panel_settings", path: "/enterprise/settings/roles", permission: "organization:moderate" },
                { label: "Partners", icon: "corporate_fare", path: "/enterprise/companies", permission: "platform:read" },
                { label: "Templates", icon: "dashboard_customize", path: "/enterprise/templates", permission: "organization:read" },
            ]
        }
    ];

    // The career page is a section of its own: once you are inside it the sidebar shows its
    // screens instead of the whole portal, with a way back at the top. The ⌘K palette still
    // works off the full portal nav below, so nothing becomes unreachable while you are here.
    const inCareerPage = pathname.startsWith("/enterprise/career-page");
    const careerPageGroups = [
        {
            title: "Career Page",
            icon: "public",
            items: [
                { label: "Job Posts", icon: "list_alt", path: "/enterprise/career-page", permission: "jobs:read" },
                { label: "Career Page Settings", icon: "tune", path: "/enterprise/career-page/settings", permission: "jobs:read" },
                { label: "Embed & Share", icon: "code", path: "/enterprise/career-page/embed", permission: "jobs:read" },
            ],
        },
    ];

    // Filter navGroups and items based on permissions
    const accessibleNavGroups = navGroups
        .map(group => ({
            ...group,
            items: group.items.filter(item => canAccess(item.permission))
        }))
        .filter(group => group.items.length > 0);

    const sidebarGroups = inCareerPage
        ? careerPageGroups.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(i.permission)) }))
        : accessibleNavGroups;

    // Flattened list for the ⌘K command palette. Always the full portal, never the section —
    // the palette is how you leave a section without hunting for the back link.
    const commandItems = accessibleNavGroups.flatMap(g =>
        g.items.map(i => ({ label: navLabel(i.label), icon: i.icon, path: i.path, group: navLabel(g.title) }))
    );

    // True when the given path is the best (most specific) match for the current route.
    const isItemActive = (path: string) => {
        // Section paths belong here too. The "is there a longer match?" test is what stops a
        // parent from lighting up on its children, and it can only see paths it is given —
        // without the career-page sub-routes, Job Posts stayed active on Settings and Embed.
        const allPaths = [
            ...accessibleNavGroups.flatMap(g => g.items.map(i => i.path)),
            ...careerPageGroups.flatMap(g => g.items.map(i => i.path)),
        ];
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
        if (path === "/enterprise/candidates" && (pathname.startsWith("/enterprise/candidates/search") || pathname.startsWith("/enterprise/candidates/folders"))) {
            return false;
        }
        if (path === "/enterprise/candidates" && pathname.startsWith("/enterprise/candidates/kanban")) {
            isActive = false;
        }

        return isActive;
    };

    const navLinkClass = (path: string) => {
        const isActive = isItemActive(path);
        return `group flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] transition-all duration-150 text-[12.5px] ${
            isActive
                ? "bg-[#E3F2FD] text-[#1976D2] font-medium border-l-[3px] border-[#1976D2] pl-[11px]"
                : "text-[#424242] hover:bg-[#F5F6F8] hover:text-[#212121] font-normal"
        } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`;
    };

    const activeGroupTitle = sidebarGroups.find(g => g.items.some(i => isItemActive(i.path)))?.title;
    const isGroupOpen = (title: string) => openGroups[title] ?? (title === activeGroupTitle);
    const toggleGroup = (title: string) =>
        setOpenGroups(prev => ({ ...prev, [title]: !(prev[title] ?? (title === activeGroupTitle)) }));

    return (
        <GuideProvider>
        <div className={`flex flex-col w-full h-screen bg-[#F5F6F8] overflow-hidden ${hankenGrotesk.className}`}>

            {/* ── top bar ──────────────────────────────────────────────────────
                Manatal's chrome: one blue band across the whole width, with the
                sidebar below it rather than beside it. The search box is the
                visual centre of their app, so it is the centre of this one; it
                opens the command palette, which is what actually does the
                searching. */}
            <header className="h-14 shrink-0 bg-[#1976D2] text-white flex items-center gap-2 px-2 md:px-3 shadow-[0_2px_4px_rgba(0,0,0,0.16)] z-[60]">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label={t("nav.openMenu")}
                    className="md:hidden w-9 h-9 rounded-[4px] hover:bg-white/15 flex items-center justify-center transition-colors"
                >
                    <i className="mdi mdi-menu text-[22px]" />
                </button>
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    aria-label={t("nav.toggleSidebar")}
                    title={t("nav.toggleSidebar")}
                    className="hidden md:flex w-9 h-9 rounded-[4px] hover:bg-white/15 items-center justify-center transition-colors shrink-0"
                >
                    <i className="mdi mdi-dock-right text-[21px]" />
                </button>

                <Link href="/enterprise/dashboard" className="flex items-center gap-2 min-w-0 shrink-0 px-1">
                    <CroarMark size={26} />
                    <span className="hidden sm:block text-[17px] font-medium truncate">Croar</span>
                </Link>

                <button
                    data-tour="search"
                    onClick={() => setIsPaletteOpen(true)}
                    title={t("nav.searchHint")}
                    className="flex-1 max-w-[600px] mx-auto h-9 rounded-[4px] bg-white/15 hover:bg-white/25 transition-colors flex items-center gap-2 px-3 text-white/85 min-w-0"
                >
                    <i className="mdi mdi-magnify text-[20px] shrink-0" />
                    <span className="text-[13.5px] truncate text-left flex-1">{t("nav.searchPlaceholder")}</span>
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                    <LanguageSwitcher compact />
                    <Link
                        href="/enterprise/settings"
                        title={t("nav.settings")}
                        className="hidden sm:flex w-9 h-9 rounded-full hover:bg-white/15 items-center justify-center transition-colors"
                    >
                        <i className="mdi mdi-cog text-[21px]" />
                    </Link>

                    {/* The avatar is the only place the signed-in identity is stated now that
                        the sidebar is no longer dark enough to carry it quietly. */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen((v) => !v)}
                            aria-label={t("nav.account")}
                            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-[13px] font-medium ml-0.5"
                        >
                            {user ? user.charAt(0).toUpperCase() : "R"}
                        </button>
                        {isUserMenuOpen && (
                            <>
                                <div
                                    role="button"
                                    tabIndex={-1}
                                    aria-label={t("nav.closeMenu")}
                                    className="fixed inset-0 z-[70] cursor-default"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    onKeyDown={(e) => { if (e.key === "Escape") setIsUserMenuOpen(false); }}
                                />
                                <div className="absolute right-0 top-11 z-[80] w-64 bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.18)] py-1.5">
                                    <div className="px-3 py-2 border-b border-[#EEEEEE]">
                                        <p className="text-[13px] font-medium text-[#212121] truncate">{user || "recruiter@techcorp.com"}</p>
                                        <p className="text-[11.5px] text-[#757575]">{role ? role.charAt(0) + role.slice(1).toLowerCase() : "Recruiter"}</p>
                                    </div>
                                    <Link
                                        href="/enterprise/settings"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#424242] hover:bg-[#F5F6F8] transition-colors"
                                    >
                                        <i className="mdi mdi-cog text-[19px] text-[#757575]" />
                                        {t("nav.settings")}
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                    >
                                        <i className="mdi mdi-logout text-[19px]" />
                                        {t("general.logout")}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 w-full">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    role="button"
                    tabIndex={0}
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setIsMobileMenuOpen(false); } }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                fixed inset-y-0 left-0 z-50 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[248px]'} flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 md:relative md:h-auto border-r border-[#E0E0E0]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
                style={{ background: "#FFFFFF" }}
            >
                <div className="p-3 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                    {/* Navigation Groups — collapsible accordion (keeps the long menu scannable) */}
                    {inCareerPage && (
                        <Link
                            href="/enterprise/jobs"
                            className={`flex items-center gap-2 mb-3 mx-1 px-3.5 h-9 rounded-[4px] text-[12px] font-medium text-[#616161] hover:text-[#1976D2] hover:bg-[#F5F6F8] transition-colors ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
                        >
                            <i className="mdi mdi-arrow-left text-[18px]" />
                            {!isSidebarCollapsed && navLabel("Back to Croar")}
                        </Link>
                    )}

                    <nav data-tour="nav" className={isSidebarCollapsed ? "space-y-4 px-1" : "space-y-1 px-1"}>
                        {sidebarGroups.map((group) => {
                            const open = isSidebarCollapsed ? true : isGroupOpen(group.title);
                            const hasActive = group.items.some((i) => isItemActive(i.path));

                            // One child means there is nothing to disclose: render it flat, with
                            // the group's icon, so it reads as the destination it is. The label
                            // comes from the child unless the child just repeats the group name.
                            if (!isSidebarCollapsed && group.items.length === 1) {
                                const only = group.items[0];
                                const active = isItemActive(only.path);
                                return (
                                    <Link
                                        key={group.title}
                                        href={only.path}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 mb-2 rounded-[4px] transition-all duration-150 text-[12.5px] ${
                                            active
                                                ? "bg-[#E3F2FD] text-[#1976D2] font-medium border-l-[3px] border-[#1976D2] pl-[11px]"
                                                : "text-[#424242] hover:bg-[#F5F6F8] hover:text-[#212121] font-normal border-l-[3px] border-transparent pl-[11px]"
                                        }`}
                                    >
                                        <Icon name={group.icon} className={`text-[18px] ${active ? "text-[#1976D2]" : "text-[#757575]"}`} />
                                        <span className="whitespace-nowrap">{navLabel(only.label === group.title ? group.title : only.label)}</span>
                                    </Link>
                                );
                            }

                            return (
                                <div key={group.title} className={isSidebarCollapsed ? "" : "mb-2"}>
                                    {isSidebarCollapsed && (
                                        <div className="text-center mt-4 mb-2 px-1 select-none">
                                            <span className="text-[10px] font-medium tracking-widest uppercase text-[#9E9E9E] block whitespace-nowrap truncate">
                                                {getCollapsedGroupTitle(group.title)}
                                            </span>
                                        </div>
                                    )}
                                    {!isSidebarCollapsed && (
                                        <button
                                            onClick={() => toggleGroup(group.title)}
                                            className={`group/hdr flex items-center justify-between w-full px-3.5 py-2.5 rounded-[4px] transition-all duration-150 text-[12.5px] cursor-pointer ${
                                                hasActive
                                                    ? "text-[#1976D2] font-medium bg-[#E3F2FD]"
                                                    : "text-[#424242] hover:bg-[#F5F6F8] hover:text-[#212121] font-normal"
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon name={group.icon} className={`text-[18px] ${hasActive ? 'text-[#1976D2]' : 'text-[#757575] group-hover/hdr:text-[#424242] transition-colors'}`} />
                                                <span className="whitespace-nowrap">{navLabel(group.title)}</span>
                                            </span>
                                            <svg className={`w-3.5 h-3.5 ${hasActive ? 'text-[#1976D2]' : 'text-[#757575] group-hover/hdr:text-[#424242]'} transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                                            <Icon name={item.icon} className={`text-[18px] ${isActive ? 'text-[#1976D2]' : 'text-[#757575] group-hover:text-[#424242] transition-colors'}`} />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="relative pl-5 ml-[22px] border-l border-[#E0E0E0] mt-1 mb-2 space-y-1">
                                                {group.items.map((item) => {
                                                    const isActive = isItemActive(item.path);
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            href={item.path}
                                                            className={`flex items-center justify-between px-3 py-1.5 rounded-[4px] text-[12.5px] transition-all duration-150 ${
                                                                isActive
                                                                    ? "bg-[#E3F2FD] text-[#1976D2] font-medium border-l-[3px] border-[#1976D2] pl-[9px]"
                                                                    : "text-[#424242] hover:text-[#212121] hover:bg-[#F5F6F8] border-l-[3px] border-transparent font-normal"
                                                            }`}
                                                        >
                                                            <span>{navLabel(item.label)}</span>
                                                            {item.label === "Croar Pilot" && (
                                                                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1976D2] text-[9.5px] font-extrabold uppercase tracking-wider leading-none">
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
                <div className={`p-3 border-t border-[#E0E0E0] shrink-0 ${isSidebarCollapsed ? 'px-1' : ''}`}>
                    {!isSidebarCollapsed && (
                        <div className="mb-3">
                            <LanguageSwitcher />
                        </div>
                    )}
                    <div className={`flex items-center gap-2.5 mb-3 px-2 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
                        <div className="w-8 h-8 rounded-[4px] bg-[#1976D2] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_2px_8px_rgba(25,118,210,0.3)]">
                            {user ? user.charAt(0).toUpperCase() : 'R'}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-[#424242] truncate">{user || "recruiter@techcorp.com"}</p>
                                <p className="text-[10px] text-[#757575]">{role ? role.charAt(0) + role.slice(1).toLowerCase() : 'Recruiter'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[#616161] hover:bg-[#FFEBEE] hover:text-[#C62828] rounded-[4px] transition-colors duration-150 group cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        title={isSidebarCollapsed ? t("general.logout") : ''}
                    >
                        <i className="mdi mdi-logout text-[18px] text-[#9E9E9E] group-hover:text-[#C62828]" />
                        {!isSidebarCollapsed && <span className="text-[12.5px] font-medium">{t("general.logout")}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden w-full">
                {/* Content */}
                <main className="flex-1 w-full overflow-y-auto bg-[#F5F6F8] custom-scrollbar">
                    {children}
                </main>
            </div>

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
