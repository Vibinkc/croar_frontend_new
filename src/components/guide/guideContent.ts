/**
 * The detailed in-app guide content. Structured (not JSX) so it can be searched
 * and rendered consistently by <GuideBook/>. Keep it accurate to the real nav
 * (src/config/enterpriseNav.ts) — every link points at a live route.
 */

export interface GuideLink {
    label: string;
    href: string;
    desc: string;
}

/** A concrete, worked example: a named scenario followed by the exact steps to do it. */
export interface GuideExample {
    scenario: string;
    steps: string[];
}

export interface GuideBlock {
    heading?: string;
    /** Plain explanatory paragraphs. */
    paragraphs?: string[];
    /** An ordered, numbered workflow (generic). */
    steps?: string[];
    /** Links to real pages. */
    links?: GuideLink[];
    /** A highlighted, concrete example with sample data. */
    example?: GuideExample;
}

export interface GuideTopic {
    id: string;
    title: string;
    /** Material Symbols glyph. */
    icon: string;
    summary: string;
    blocks: GuideBlock[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
    {
        id: "overview",
        title: "Getting started",
        icon: "rocket_launch",
        summary: "The big picture and how to get around.",
        blocks: [
            {
                paragraphs: [
                    "Croar is your all-in-one HR cloud — from sourcing and hiring, through onboarding and day-to-day people management, all the way to payroll.",
                    "Everything is organised into four areas in the left sidebar. Pick an area and the sidebar shows that area's pages, grouped into sections.",
                ],
            },
            {
                heading: "The four modules",
                links: [
                    { label: "Recruit", href: "/enterprise/dashboard", desc: "Source, hire and automate your recruiting pipeline." },
                    { label: "People", href: "/enterprise/employees", desc: "Manage employees, performance and engagement." },
                    { label: "Payroll", href: "/enterprise/payroll/dashboard", desc: "Run payroll, timesheets, leave and tax filings." },
                    { label: "Admin", href: "/enterprise/settings", desc: "Organisation settings, team and permissions." },
                ],
            },
            {
                heading: "Finding things fast",
                paragraphs: [
                    "Press ⌘K (Ctrl + K on Windows) anywhere to jump straight to any page or action — the quickest way to move around.",
                    "The “?” next to a page title explains what that page is for. The Help button in the bottom-right corner reopens this guide and the product tour anytime.",
                ],
                example: {
                    scenario: "You want to open the Jobs page but don't know where it is.",
                    steps: [
                        "Press ⌘K (or Ctrl + K).",
                        "Type “jobs”.",
                        "Press Enter on the “Jobs” result — you're there. No menu-hunting needed.",
                    ],
                },
            },
            {
                heading: "The usual journey",
                steps: [
                    "Recruit: post a job and hire a candidate.",
                    "Onboard the hire and convert them into an employee.",
                    "People: manage their work, performance (360) and engagement (surveys).",
                    "Payroll: pay them — structures, timesheets, leave, then run payroll.",
                    "Admin: configure the organisation and control who can do what.",
                ],
            },
        ],
    },
    {
        id: "recruit",
        title: "Recruit",
        icon: "work",
        summary: "Source, hire and automate your recruiting pipeline.",
        blocks: [
            {
                paragraphs: [
                    "The Recruit module covers the full hiring funnel — from posting a role to onboarding the new hire — plus AI sourcing and no-code automation.",
                ],
            },
            {
                heading: "Hiring Hub",
                links: [
                    { label: "Dashboard", href: "/enterprise/dashboard", desc: "Your hiring overview — funnel, pipeline and key metrics." },
                    { label: "Croar Pilot", href: "/enterprise/croar-pilot", desc: "Let AI set up an entire hiring pipeline for a role." },
                    { label: "Jobs", href: "/enterprise/jobs", desc: "Create and manage open positions; each job has its own candidate pipeline." },
                    { label: "Pipeline", href: "/enterprise/candidates/kanban", desc: "Drag candidates through stages — applied, interview, offer, hired." },
                    { label: "Mail", href: "/enterprise/communication", desc: "Email candidates and keep the conversation in one place." },
                    { label: "Job Portals", href: "/enterprise/settings/job-portals", desc: "Publish your jobs to external job boards." },
                    { label: "Onboarding Hub", href: "/enterprise/onboarding", desc: "Run onboarding and convert hires into employees." },
                ],
            },
            {
                heading: "How to post a job",
                paragraphs: ["Open Jobs and create a position. Each job gets its own candidate pipeline."],
                example: {
                    scenario: "You're hiring a Senior Backend Engineer.",
                    steps: [
                        "Go to Jobs and click “New Position”.",
                        "Enter the title “Senior Backend Engineer”, location “Remote — India”, type “Full-time”.",
                        "Set experience 4–8 years and salary ₹18–28 LPA.",
                        "Write the description, or click “Draft with AI” to generate one.",
                        "Save. The job appears in your list with an empty pipeline.",
                        "Open the job's “⋯” menu → “Publish job” to push it to job portals, or copy its public link to share.",
                    ],
                },
            },
            {
                heading: "How to move a candidate through the pipeline",
                example: {
                    scenario: "Someone applied to your Senior Backend Engineer role.",
                    steps: [
                        "Open Pipeline (or the job's own pipeline).",
                        "Find the candidate's card in the “Applied” column.",
                        "Drag it to “Screening”, then “Interview” as they progress.",
                        "Use Mail to email them and schedule interviews from their profile.",
                        "When they accept, drag the card to “Hired” and send them to the Onboarding Hub.",
                    ],
                },
            },
            {
                heading: "Talent Search & Automation",
                paragraphs: ["Source new profiles with AI, and build no-code workflows that run recruiting steps for you."],
                links: [
                    { label: "Candidate Bank", href: "/enterprise/candidates", desc: "Search and review your candidate database." },
                    { label: "Profile Sourcing", href: "/enterprise/sourcing/chat", desc: "Source new profiles with AI assistance." },
                    { label: "Canvas (Automation)", href: "/enterprise/automation", desc: "Visually automate emails, assessments, interviews and onboarding." },
                ],
            },
        ],
    },
    {
        id: "people",
        title: "People",
        icon: "groups",
        summary: "Manage your workforce, performance and engagement.",
        blocks: [
            {
                paragraphs: ["Once people are hired, the People module is where you manage them day-to-day — records, work, performance feedback and engagement."],
            },
            {
                heading: "Pages",
                links: [
                    { label: "Employees", href: "/enterprise/employees", desc: "Your directory — records, departments and documents." },
                    { label: "Projects", href: "/enterprise/projects", desc: "Organise work into projects with teams and boards." },
                    { label: "Tasks", href: "/enterprise/tasks", desc: "Assign and track tasks across projects." },
                    { label: "360 Assessments", href: "/enterprise/assessments-360", desc: "Run multi-rater performance feedback cycles." },
                    { label: "HR Surveys", href: "/enterprise/surveys", desc: "Launch engagement and culture surveys, then read the results." },
                ],
            },
            {
                heading: "How to add an employee",
                example: {
                    scenario: "A new hire, Aarav Sharma, is joining Engineering.",
                    steps: [
                        "Go to Employees and click “Add Employee”.",
                        "Enter name “Aarav Sharma”, work email and an employee ID.",
                        "Pick the “Engineering” department — or click “+ Add New” to create it.",
                        "Add his role, hire date and any documents (offer letter, ID).",
                        "Save. Aarav now appears in the directory; open his record anytime to edit details or create a workspace login.",
                    ],
                },
            },
            {
                heading: "How to run a 360° feedback cycle",
                example: {
                    scenario: "A Q3 Leadership Review for your 5 managers.",
                    steps: [
                        "In 360 Assessments → Templates, build a framework “Leadership Competencies” (or reuse one).",
                        "Click “Start New Cycle” and name it “Q3 Leadership Review”.",
                        "Pick the 5 managers as the people being reviewed (ratees).",
                        "Choose each one's raters — their manager, peers and reports.",
                        "Launch. Raters complete their assessments from the portal.",
                        "Track completion on the cycle page, then open each manager's report.",
                    ],
                },
            },
            {
                heading: "How to launch an HR survey",
                example: {
                    scenario: "A quarterly engagement (eNPS) survey to all staff.",
                    steps: [
                        "In HR Surveys → Templates, create a template with your questions (e.g. an eNPS rating + a comment box).",
                        "Click “Launch Survey” and name the campaign “Q3 Engagement”.",
                        "Choose the audience: “Entire Organisation”.",
                        "Deploy. Everyone gets a secure link to respond anonymously.",
                        "Track participation and read the results on the campaign's page.",
                    ],
                },
            },
        ],
    },
    {
        id: "payroll",
        title: "Payroll",
        icon: "account_balance_wallet",
        summary: "Run payroll, timesheets, leave and tax filings.",
        blocks: [
            {
                paragraphs: ["The Payroll module handles compensation end-to-end — from how salary is structured to running each pay cycle and filing statutory taxes."],
            },
            {
                heading: "Pages",
                links: [
                    { label: "Payroll Dashboard", href: "/enterprise/payroll/dashboard", desc: "Payroll at a glance — cycles, coverage and disbursement." },
                    { label: "Payroll", href: "/enterprise/payroll", desc: "Create, process and pay each payroll cycle." },
                    { label: "Salary Templates", href: "/enterprise/payroll/templates", desc: "Reusable earning/deduction templates to apply to employees." },
                    { label: "Salary Structures", href: "/enterprise/payroll/structures", desc: "Each employee's salary breakdown." },
                    { label: "Timesheets", href: "/enterprise/payroll/timesheets", desc: "Track and approve worked hours." },
                    { label: "Leave", href: "/enterprise/payroll/leave", desc: "Leave requests, balances and approvals." },
                    { label: "Taxes & Forms", href: "/enterprise/payroll/taxes", desc: "Tax profiles, TDS liability and statutory forms." },
                    { label: "Payroll Reports", href: "/enterprise/payroll/reports", desc: "Export the payroll summary and salary register." },
                ],
            },
            {
                heading: "How to set up an employee's salary",
                paragraphs: ["Salary structures drive every payslip, so set these up before running payroll."],
                example: {
                    scenario: "Put Aarav on ₹24 LPA.",
                    steps: [
                        "In Salary Templates, create a template (Basic, HRA, deductions, statutory) — or reuse one.",
                        "Go to Salary Structures → “Add Structure” and pick Aarav.",
                        "Apply the template and set CTC ₹24,00,000 / year.",
                        "The live estimate panel shows his monthly take-home breakdown.",
                        "Save. Aarav's structure is now ready for payroll.",
                    ],
                },
            },
            {
                heading: "How to run payroll for a period",
                example: {
                    scenario: "Pay everyone for March 2026.",
                    steps: [
                        "Make sure March Timesheets and Leave are approved (amounts depend on them).",
                        "In Payroll, click “New Cycle” and select the March 2026 period.",
                        "Process the cycle — Croar computes each payslip from the salary structures.",
                        "Review the cycle, then mark it paid.",
                        "In Payroll Reports, export the salary register; file TDS in Taxes & Forms.",
                    ],
                },
            },
            {
                heading: "How to approve leave",
                example: {
                    scenario: "Aarav requested 2 days off.",
                    steps: [
                        "Go to Leave — pending requests are at the top.",
                        "Find Aarav's request and check the dates and his remaining balance.",
                        "Click “Approve” (or “Reject”). His balance updates automatically and it flows into payroll.",
                    ],
                },
            },
        ],
    },
    {
        id: "admin",
        title: "Admin",
        icon: "settings",
        summary: "Organisation settings, team and access control.",
        blocks: [
            {
                paragraphs: ["The Admin module is where you configure the organisation and control who can do what."],
            },
            {
                heading: "Pages",
                links: [
                    { label: "Settings", href: "/enterprise/settings", desc: "Company profile and organisation-wide settings." },
                    { label: "Team", href: "/enterprise/team", desc: "Invite members and assign them roles." },
                    { label: "Permissions", href: "/enterprise/settings/roles", desc: "Define roles and exactly what each can access." },
                    { label: "Partners", href: "/enterprise/companies", desc: "Manage partner / client companies." },
                    { label: "Templates", href: "/enterprise/templates", desc: "Reusable templates shared across the organisation." },
                ],
            },
            {
                heading: "How to give a teammate access",
                paragraphs: ["Roles decide what a person can see and do. Create the role first, then invite the person and assign it."],
                example: {
                    scenario: "Give Priya recruiter-only access.",
                    steps: [
                        "In Permissions, create a role “Recruiter” and tick the recruiting scopes (jobs, candidates, interviews).",
                        "In Team, click “Invite Member” and enter priya@yourco.com with a temporary password.",
                        "Assign her the “Recruiter” role and save.",
                        "Priya can now sign in and will only see the Recruit module — nothing else.",
                    ],
                },
            },
        ],
    },
    {
        id: "tips",
        title: "Tips & shortcuts",
        icon: "bolt",
        summary: "Move faster and find help.",
        blocks: [
            {
                heading: "Move faster",
                paragraphs: [
                    "⌘K / Ctrl + K — open search and jump to any page or action instantly.",
                    "Esc — close dialogs, the product tour, or this guide.",
                ],
            },
            {
                heading: "Get help in context",
                paragraphs: [
                    "The “?” next to a page title explains what that specific page does and its key actions.",
                    "The Help button (bottom-right) has a Getting-Started checklist, reopens the product tour, and brings you back to this guide whenever you need it.",
                ],
            },
        ],
    },
];
