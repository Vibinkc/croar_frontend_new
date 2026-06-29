// Single source of truth for the Enterprise portal navigation.
//
// The portal has ~36 destinations. Showing them all in one flat sidebar is
// overwhelming, so we group them into a handful of top-level MODULES (the icon
// rail) and only render the active module's items in the contextual sidebar.
//
// This config is consumed by:
//   - the icon rail + contextual sidebar (enterprise/layout.tsx)
//   - the ⌘K command palette (flattened list of every accessible item)
//   - the route guard (permission per prefix)
// Keep it framework-free so it can be imported anywhere.

export interface NavItem {
    label: string;
    icon: string; // Material Symbols Rounded ligature
    path: string;
    permission: string;
}

export interface NavSection {
    /** Optional sub-heading shown above the items inside a module. */
    title?: string;
    items: NavItem[];
}

export interface NavModule {
    id: string;
    /** Short label shown under the rail icon. */
    label: string;
    icon: string;
    /** One-line description used for tooltips / module headers. */
    blurb: string;
    sections: NavSection[];
}

export const ENTERPRISE_MODULES: NavModule[] = [
    {
        id: "recruit",
        label: "Recruit",
        icon: "work",
        blurb: "Hire, source and automate your recruiting pipeline",
        sections: [
            {
                title: "Hiring Hub",
                items: [
                    { label: "Dashboard", icon: "grid_view", path: "/enterprise/dashboard", permission: "organization:read" },
                    { label: "Croar Pilot", icon: "smart_toy", path: "/enterprise/croar-pilot", permission: "jobs:read" },
                    { label: "Jobs", icon: "business_center", path: "/enterprise/jobs", permission: "jobs:read" },
                    { label: "Pipeline", icon: "filter_list", path: "/enterprise/candidates/kanban", permission: "candidates:read" },
                    { label: "Mail", icon: "alternate_email", path: "/enterprise/communication", permission: "communications:read" },
                    { label: "Job Portals", icon: "rocket_launch", path: "/enterprise/settings/job-portals", permission: "jobs:read" },
                    { label: "Onboarding Hub", icon: "person_add", path: "/enterprise/onboarding", permission: "onboarding:read" },
                ],
            },
            {
                title: "Talent Search",
                items: [
                    { label: "Candidate Search", icon: "person_search", path: "/enterprise/candidates", permission: "candidates:read" },
                    { label: "Profile Sourcing", icon: "share_location", path: "/enterprise/sourcing/chat", permission: "candidates:read" },
                    { label: "Shortlisted Talent", icon: "how_to_reg", path: "/enterprise/sourcing/shortlisted", permission: "candidates:read" },
                ],
            },
            {
                title: "Automation",
                items: [
                    { label: "Canvas", icon: "account_tree", path: "/enterprise/automation", permission: "automation:read" },
                    { label: "Mail", icon: "mark_email_unread", path: "/enterprise/automation/mail", permission: "communications:moderate" },
                    { label: "Assessment", icon: "psychology", path: "/enterprise/automation/assessment", permission: "assessments:moderate" },
                    { label: "Interview", icon: "event_available", path: "/enterprise/automation/interview", permission: "interviews:moderate" },
                    { label: "Onboarding", icon: "person_add", path: "/enterprise/automation/onboarding", permission: "onboarding:moderate" },
                ],
            },
        ],
    },
    {
        id: "people",
        label: "People",
        icon: "groups",
        blurb: "Manage employees, performance and engagement",
        sections: [
            {
                title: "Post Onboarding",
                items: [
                    { label: "Employees", icon: "badge", path: "/enterprise/employees", permission: "employees:read" },
                    { label: "Projects", icon: "lan", path: "/enterprise/projects", permission: "projects:read" },
                    { label: "Tasks", icon: "checklist", path: "/enterprise/tasks", permission: "tasks:read" },
                    { label: "360 Assessments", icon: "360", path: "/enterprise/assessments-360", permission: "assessments:read" },
                    { label: "HR Surveys", icon: "poll", path: "/enterprise/surveys", permission: "surveys:read" },
                ],
            },
            /*
            {
                title: "AI & Training",
                items: [
                    { label: "Scenario Architect", icon: "architecture", path: "/enterprise/ai-training/scenarios", permission: "ai_training:read" },
                ],
            },
            */
        ],
    },
    {
        id: "payroll",
        label: "Payroll",
        icon: "account_balance_wallet",
        blurb: "Run payroll, timesheets, leave and tax filings",
        sections: [
            {
                items: [
                    { label: "Payroll Dashboard", icon: "space_dashboard", path: "/enterprise/payroll/dashboard", permission: "payroll:read" },
                    { label: "Payroll", icon: "payments", path: "/enterprise/payroll", permission: "payroll:read" },
                    { label: "Salary Templates", icon: "content_copy", path: "/enterprise/payroll/templates", permission: "payroll:read" },
                    { label: "Salary Structures", icon: "tune", path: "/enterprise/payroll/structures", permission: "payroll:read" },
                    { label: "Timesheets", icon: "schedule", path: "/enterprise/payroll/timesheets", permission: "payroll:read" },
                    { label: "Leave", icon: "event_available", path: "/enterprise/payroll/leave", permission: "payroll:read" },
                    { label: "Taxes & Forms", icon: "request_quote", path: "/enterprise/payroll/taxes", permission: "payroll:read" },
                    { label: "Payroll Reports", icon: "summarize", path: "/enterprise/payroll/reports", permission: "payroll:read" },
                    { label: "Payroll Activity", icon: "history", path: "/enterprise/payroll/activity", permission: "payroll:read" },
                    { label: "Payroll Settings", icon: "settings_applications", path: "/enterprise/payroll/settings", permission: "payroll:read" },
                ],
            },
        ],
    },
    {
        id: "admin",
        label: "Admin",
        icon: "settings",
        blurb: "Organisation settings, team and permissions",
        sections: [
            {
                title: "General",
                items: [
                    { label: "Settings", icon: "business", path: "/enterprise/settings", permission: "organization:read" },
                    { label: "Team", icon: "groups", path: "/enterprise/team", permission: "organization:moderate" },
                    { label: "Permissions", icon: "security", path: "/enterprise/settings/roles", permission: "organization:moderate" },
                    { label: "Partners", icon: "corporate_fare", path: "/enterprise/companies", permission: "platform:read" },
                    { label: "Templates", icon: "dashboard_customize", path: "/enterprise/templates", permission: "organization:read" },
                ],
            },
        ],
    },
];

/** Module shape after permission filtering (empty sections/modules removed). */
export type AccessibleModule = NavModule;

/**
 * Filter the whole tree by the user's permissions. Items the user can't access
 * are dropped; sections/modules that end up empty are removed entirely.
 */
export function getAccessibleModules(
    canAccess: (permission?: string) => boolean,
): AccessibleModule[] {
    return ENTERPRISE_MODULES.map((mod) => ({
        ...mod,
        sections: mod.sections
            .map((sec) => ({ ...sec, items: sec.items.filter((i) => canAccess(i.permission)) }))
            .filter((sec) => sec.items.length > 0),
    })).filter((mod) => mod.sections.length > 0);
}

/** Every accessible item, flattened — used by the ⌘K command palette. */
export function flattenItems(
    modules: AccessibleModule[],
): { label: string; icon: string; path: string; group: string }[] {
    return modules.flatMap((mod) =>
        mod.sections.flatMap((sec) =>
            sec.items.map((i) => ({ label: i.label, icon: i.icon, path: i.path, group: sec.title || mod.label })),
        ),
    );
}

/**
 * Decide which module "owns" the current pathname by longest matching item
 * path. Falls back to the first accessible module so the rail always has a
 * selection.
 */
export function resolveActiveModuleId(
    pathname: string,
    modules: AccessibleModule[],
): string {
    let bestId = modules[0]?.id ?? "recruit";
    let bestLen = -1;
    for (const mod of modules) {
        for (const sec of mod.sections) {
            for (const item of sec.items) {
                const matches = pathname === item.path || pathname.startsWith(item.path + "/");
                if (matches && item.path.length > bestLen) {
                    bestLen = item.path.length;
                    bestId = mod.id;
                }
            }
        }
    }
    return bestId;
}
