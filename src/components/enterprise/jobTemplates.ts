/**
 * Starter job templates offered on the "Create Job" screen.
 *
 * Picking one pre-fills step 1 (role, type, experience, skills), the job description, and the
 * interview rounds, so a recruiter posting a common role has a complete draft to edit instead of
 * a blank form. Everything a template sets stays fully editable afterwards — a template is a
 * starting point, never a constraint.
 *
 * `stages[].type` MUST be one of the six values in the form's stage dropdown
 * (Screening / Aptitude / Coding / Technical Interview / HR Interview / Final Selection);
 * anything else renders as an unrecognised stage.
 */

export interface JobTemplateStage {
    name: string;
    type: string;
    icon: string;
}

export interface JobTemplate {
    /** Stable key — used for the picker's value and for React keys. */
    id: string;
    /** Shown in the dropdown. */
    name: string;
    /** Groups the dropdown into <optgroup>s. */
    category: string;
    /** One line under the picker once selected, so the choice is confirmable before Continue. */
    summary: string;
    title: string;
    department: string;
    job_type: string;
    work_mode: string;
    experience_min: string;
    experience_max: string;
    /** Comma-separated, matching the form's required_skills input. */
    required_skills: string;
    /** HTML for the rich-text JD editor (TipTap StarterKit: h2 / p / ul / li / strong). */
    description: string;
    stages: JobTemplateStage[];
}

// Interview round sets reused across templates.
const ENGINEERING_STAGES: JobTemplateStage[] = [
    { name: 'Resume Screening', type: 'Screening', icon: 'Search' },
    { name: 'Coding Assessment', type: 'Coding', icon: 'Code' },
    { name: 'Technical Interview', type: 'Technical Interview', icon: 'Zap' },
    { name: 'HR Discussion', type: 'HR Interview', icon: 'Users' },
    { name: 'Offer', type: 'Final Selection', icon: 'ShieldCheck' },
];

const BUSINESS_STAGES: JobTemplateStage[] = [
    { name: 'Resume Screening', type: 'Screening', icon: 'Search' },
    { name: 'Hiring Manager Interview', type: 'Technical Interview', icon: 'Zap' },
    { name: 'HR Discussion', type: 'HR Interview', icon: 'Users' },
    { name: 'Offer', type: 'Final Selection', icon: 'ShieldCheck' },
];

const VOLUME_STAGES: JobTemplateStage[] = [
    { name: 'Resume Screening', type: 'Screening', icon: 'Search' },
    { name: 'Aptitude Test', type: 'Aptitude', icon: 'Brain' },
    { name: 'Interview', type: 'HR Interview', icon: 'Users' },
    { name: 'Offer', type: 'Final Selection', icon: 'ShieldCheck' },
];

export const JOB_TEMPLATES: JobTemplate[] = [
    {
        id: 'software-engineer',
        name: 'Software Engineer',
        category: 'Engineering & Product',
        summary: 'Full-stack developer role with a coding assessment round.',
        title: 'Software Engineer',
        department: 'Engineering',
        job_type: 'Full Time',
        work_mode: 'Hybrid',
        experience_min: '2',
        experience_max: '5',
        required_skills: 'JavaScript, TypeScript, React, Node.js, REST APIs, SQL, Git',
        description: `<h2>About the role</h2>
<p>We are looking for a Software Engineer to design, build and ship features across our product. You will work closely with product managers and designers, own your work from specification through to production, and help keep our codebase healthy as the team grows.</p>
<h2>Responsibilities</h2>
<ul>
<li>Build and maintain features across the front end and back end.</li>
<li>Write clear, tested code and take part in code reviews.</li>
<li>Translate product requirements into technical designs and realistic estimates.</li>
<li>Debug and resolve production issues, including occasional on-call support.</li>
<li>Contribute to improving our tooling, CI pipeline and engineering standards.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>2+ years building web applications in a professional setting.</li>
<li>Strong JavaScript/TypeScript skills and experience with a modern framework such as React.</li>
<li>Comfortable with server-side development and relational databases.</li>
<li>Familiarity with Git, code review and automated testing.</li>
<li>Able to communicate technical trade-offs clearly to non-engineers.</li>
</ul>
<h2>Nice to have</h2>
<ul>
<li>Experience with cloud platforms (AWS, GCP or Azure) and containers.</li>
<li>Exposure to CI/CD, observability or performance tuning.</li>
</ul>`,
        stages: ENGINEERING_STAGES,
    },
    {
        id: 'senior-software-engineer',
        name: 'Senior Software Engineer',
        category: 'Engineering & Product',
        summary: 'Senior IC role weighted toward design and mentoring.',
        title: 'Senior Software Engineer',
        department: 'Engineering',
        job_type: 'Full Time',
        work_mode: 'Hybrid',
        experience_min: '5',
        experience_max: '10',
        required_skills: 'System Design, TypeScript, React, Node.js, Cloud (AWS/GCP), CI/CD, Mentoring',
        description: `<h2>About the role</h2>
<p>We are hiring a Senior Software Engineer to lead the design and delivery of significant parts of our platform. This is a hands-on role: you will still write code every week, but you will also set technical direction and raise the bar for the engineers around you.</p>
<h2>Responsibilities</h2>
<ul>
<li>Lead the design and delivery of complex features end to end.</li>
<li>Break large, ambiguous problems into workstreams the team can execute.</li>
<li>Mentor engineers through code review, pairing and design feedback.</li>
<li>Own reliability, performance and security in the areas you lead.</li>
<li>Work with product and design to shape scope and sequencing.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>5+ years of professional software engineering experience.</li>
<li>Proven track record designing systems that other engineers build on.</li>
<li>Depth in at least one part of the stack and competence across the rest.</li>
<li>Experience running services in production on a major cloud platform.</li>
<li>Strong written communication — design documents, RFCs and reviews.</li>
</ul>`,
        stages: ENGINEERING_STAGES,
    },
    {
        id: 'digital-marketing-manager',
        name: 'Digital Marketing Manager',
        category: 'Marketing & Sales',
        summary: 'Owns online presence, campaigns and channel performance.',
        title: 'Digital Marketing Manager',
        department: 'Marketing',
        job_type: 'Full Time',
        work_mode: 'Hybrid',
        experience_min: '3',
        experience_max: '7',
        required_skills: 'SEO, SEM, Google Analytics, Google Ads, Email Marketing, Content Strategy, Social Media',
        description: `<h2>About the role</h2>
<p>We are seeking a Digital Marketing Manager to build our online presence and run the campaigns behind our growth targets. You will own the channel mix, the budget and the numbers that come out of it.</p>
<h2>Responsibilities</h2>
<ul>
<li>Plan and execute digital campaigns across search, social, email and display.</li>
<li>Measure and report on campaign performance (ROI, CTR, CAC, conversion rate).</li>
<li>Own the SEO roadmap and work with content and engineering to deliver it.</li>
<li>Coordinate with internal teams to create landing pages and improve conversion.</li>
<li>Manage the marketing budget and allocate spend against results.</li>
<li>Brief and manage external agencies and freelancers where needed.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>3+ years in a digital marketing role with direct budget ownership.</li>
<li>Hands-on experience with Google Ads, Google Analytics and at least one marketing automation tool.</li>
<li>Demonstrable results — bring the numbers from campaigns you have run.</li>
<li>Strong writing skills and an eye for design and messaging.</li>
<li>Comfortable working from data rather than opinion.</li>
</ul>`,
        stages: BUSINESS_STAGES,
    },
    {
        id: 'sales-executive',
        name: 'Sales Executive',
        category: 'Marketing & Sales',
        summary: 'Quota-carrying new-business role with a pipeline focus.',
        title: 'Sales Executive',
        department: 'Sales',
        job_type: 'Full Time',
        work_mode: 'On-Site',
        experience_min: '2',
        experience_max: '6',
        required_skills: 'B2B Sales, Lead Generation, CRM, Negotiation, Pipeline Management, Presentation Skills',
        description: `<h2>About the role</h2>
<p>We are looking for a Sales Executive to generate new business and grow revenue in your territory. You will own your pipeline from first contact through to a signed contract.</p>
<h2>Responsibilities</h2>
<ul>
<li>Identify and qualify new prospects through outbound and inbound channels.</li>
<li>Run discovery calls and product demonstrations tailored to the customer's needs.</li>
<li>Build and manage a healthy pipeline, keeping the CRM accurate and current.</li>
<li>Negotiate commercial terms and close deals against a monthly or quarterly quota.</li>
<li>Hand over new customers cleanly to onboarding and account management.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>2+ years of B2B sales experience with a record of hitting quota.</li>
<li>Confident running a full sales cycle without hand-holding.</li>
<li>Disciplined about CRM hygiene and pipeline reporting.</li>
<li>Excellent verbal and written communication.</li>
<li>Resilient, self-directed and comfortable with rejection.</li>
</ul>`,
        stages: BUSINESS_STAGES,
    },
    {
        id: 'hr-recruiter',
        name: 'HR Recruiter',
        category: 'People & Operations',
        summary: 'End-to-end recruiter owning sourcing through offer.',
        title: 'HR Recruiter',
        department: 'Human Resources',
        job_type: 'Full Time',
        work_mode: 'On-Site',
        experience_min: '1',
        experience_max: '5',
        required_skills: 'Talent Sourcing, Screening, Interviewing, ATS, Employer Branding, Offer Negotiation',
        description: `<h2>About the role</h2>
<p>We are hiring an HR Recruiter to own hiring end to end for the roles assigned to you — from writing the brief with the hiring manager through to the accepted offer.</p>
<h2>Responsibilities</h2>
<ul>
<li>Partner with hiring managers to define the role, the must-haves and the process.</li>
<li>Source candidates through job boards, referrals and direct outreach.</li>
<li>Screen applications and run first-round interviews.</li>
<li>Coordinate interview schedules and keep candidates informed at every stage.</li>
<li>Extend offers, negotiate terms and support the candidate up to their start date.</li>
<li>Keep the ATS accurate and report on funnel metrics and time-to-hire.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>1+ years of recruiting experience, in-house or agency.</li>
<li>Comfortable sourcing passive candidates, not just processing applicants.</li>
<li>Strong organisational skills — you will run several roles in parallel.</li>
<li>Genuine care for the candidate experience.</li>
</ul>`,
        stages: BUSINESS_STAGES,
    },
    {
        id: 'data-analyst',
        name: 'Data Analyst',
        category: 'Engineering & Product',
        summary: 'Reporting and analysis role with an SQL-led assessment.',
        title: 'Data Analyst',
        department: 'Analytics',
        job_type: 'Full Time',
        work_mode: 'Hybrid',
        experience_min: '1',
        experience_max: '4',
        required_skills: 'SQL, Excel, Python, Data Visualisation, Power BI / Tableau, Statistics',
        description: `<h2>About the role</h2>
<p>We are looking for a Data Analyst to turn our data into decisions. You will build the reporting the business runs on and answer the questions behind it.</p>
<h2>Responsibilities</h2>
<ul>
<li>Build and maintain dashboards and recurring reports for business teams.</li>
<li>Write SQL to extract, clean and combine data from multiple sources.</li>
<li>Investigate trends and anomalies and present findings clearly.</li>
<li>Partner with teams to define the metrics that matter and keep them consistent.</li>
<li>Support data quality — spot problems at the source and get them fixed.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>1+ years in an analytics or reporting role.</li>
<li>Strong SQL, including joins, window functions and aggregation.</li>
<li>Experience with a BI tool such as Power BI, Tableau or Looker.</li>
<li>Able to explain an analysis to someone who has never seen the data.</li>
</ul>`,
        stages: [
            { name: 'Resume Screening', type: 'Screening', icon: 'Search' },
            { name: 'SQL / Analytics Test', type: 'Aptitude', icon: 'Brain' },
            { name: 'Technical Interview', type: 'Technical Interview', icon: 'Zap' },
            { name: 'HR Discussion', type: 'HR Interview', icon: 'Users' },
            { name: 'Offer', type: 'Final Selection', icon: 'ShieldCheck' },
        ],
    },
    {
        id: 'customer-support',
        name: 'Customer Support Executive',
        category: 'People & Operations',
        summary: 'High-volume support role with an aptitude screen.',
        title: 'Customer Support Executive',
        department: 'Customer Success',
        job_type: 'Full Time',
        work_mode: 'On-Site',
        experience_min: '0',
        experience_max: '3',
        required_skills: 'Customer Service, Communication, Ticketing Systems, Problem Solving, Empathy',
        description: `<h2>About the role</h2>
<p>We are hiring a Customer Support Executive to be the first person our customers hear from. You will resolve issues quickly, kindly and completely.</p>
<h2>Responsibilities</h2>
<ul>
<li>Respond to customer queries over email, chat and phone within agreed SLAs.</li>
<li>Diagnose issues, resolve what you can and escalate what you cannot.</li>
<li>Keep accurate records of every interaction in the support system.</li>
<li>Spot recurring problems and feed them back to product and engineering.</li>
<li>Help build and maintain help-centre articles and canned responses.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>Excellent spoken and written communication.</li>
<li>Patience and genuine empathy under pressure.</li>
<li>Comfortable learning a technical product well enough to explain it simply.</li>
<li>Freshers welcome — attitude matters more than years here.</li>
</ul>`,
        stages: VOLUME_STAGES,
    },
    {
        id: 'accountant',
        name: 'Accountant',
        category: 'Finance & Legal',
        summary: 'Bookkeeping, closing and compliance role.',
        title: 'Accountant',
        department: 'Finance',
        job_type: 'Full Time',
        work_mode: 'On-Site',
        experience_min: '2',
        experience_max: '6',
        required_skills: 'Accounting, Bookkeeping, Tax Compliance, Reconciliation, Excel, Tally / QuickBooks / SAP',
        description: `<h2>About the role</h2>
<p>We are looking for an Accountant to keep our books accurate and our filings on time. You will own day-to-day accounting and support the monthly close.</p>
<h2>Responsibilities</h2>
<ul>
<li>Maintain the general ledger and post journal entries accurately.</li>
<li>Run accounts payable and receivable, including vendor and customer follow-up.</li>
<li>Perform bank and account reconciliations.</li>
<li>Support the monthly and annual close and prepare supporting schedules.</li>
<li>Prepare statutory filings and assist with audits.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>2+ years in an accounting role; a relevant degree or professional qualification.</li>
<li>Working knowledge of an accounting package such as Tally, QuickBooks or SAP.</li>
<li>Strong Excel skills and real attention to detail.</li>
<li>Familiarity with local tax and statutory requirements.</li>
</ul>`,
        stages: BUSINESS_STAGES,
    },
    {
        id: 'project-manager',
        name: 'Project Manager',
        category: 'People & Operations',
        summary: 'Delivery role owning scope, schedule and stakeholders.',
        title: 'Project Manager',
        department: 'Operations',
        job_type: 'Full Time',
        work_mode: 'Hybrid',
        experience_min: '3',
        experience_max: '8',
        required_skills: 'Project Planning, Stakeholder Management, Agile / Scrum, Risk Management, Budgeting, Reporting',
        description: `<h2>About the role</h2>
<p>We are hiring a Project Manager to take projects from kick-off to delivery — on scope, on schedule and with everyone informed along the way.</p>
<h2>Responsibilities</h2>
<ul>
<li>Define project scope, plan, milestones and success criteria with stakeholders.</li>
<li>Coordinate cross-functional teams and keep work unblocked.</li>
<li>Track progress, manage risks and escalate early when something slips.</li>
<li>Own project budget and resourcing decisions.</li>
<li>Report status clearly to leadership and to the client where applicable.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>3+ years managing projects with multiple stakeholders.</li>
<li>Experience with Agile or Scrum and a project tracking tool.</li>
<li>Strong written communication — status reports people actually read.</li>
<li>Calm and decisive when plans change.</li>
</ul>`,
        stages: BUSINESS_STAGES,
    },
];

/** Picker groups, in display order, derived from the templates themselves. */
export const JOB_TEMPLATE_CATEGORIES: string[] = JOB_TEMPLATES.reduce<string[]>((acc, tpl) => {
    if (!acc.includes(tpl.category)) acc.push(tpl.category);
    return acc;
}, []);

export const findJobTemplate = (id: string): JobTemplate | undefined =>
    JOB_TEMPLATES.find(tpl => tpl.id === id);
