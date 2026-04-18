"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

import { DivisionProvider } from "@/context/DivisionContext";
import DivisionSelector from "@/components/admin/DivisionSelector";
import DepartmentSelector from "@/components/admin/DepartmentSelector";
import BatchSelector from "@/components/admin/BatchSelector";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, user, isLoading, logout, divisionId } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCertOpen, setIsCertOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const ADMIN_ROLES = ["ADMIN", "SUB_ADMIN", "STAFF"];

    useEffect(() => {
        if (!isLoading && !ADMIN_ROLES.includes(role || "")) {
            router.push("/login");
        }
    }, [role, isLoading, router]);

    useEffect(() => {
        if (pathname.includes("/admin/certification/")) {
            setIsCertOpen(true);
        }
        // Close mobile menu on route change
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (isLoading || !ADMIN_ROLES.includes(role || "")) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const isManagement = role === "ADMIN" && !divisionId;
    const isInstitutional = role === "ADMIN" && divisionId;
    const isHOD = role === "SUB_ADMIN";

    const getManagementHeader = () => {
        if (isManagement) return "Institution Management";
        if (isInstitutional) return "Department Management";
        if (isHOD) return "Staff Management";
        return "Student Management";
    };

    const navLinkClass = (path: string) =>
        `group flex items-center gap-3 px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all duration-200 ${pathname.startsWith(path) ? "bg-[rgba(99,102,241,0.1)] text-[var(--color-primary)]" : "text-slate-500 hover:bg-indigo-50 hover:text-[var(--color-primary)]"}`;

    const navHeadingClass = "px-3 mb-1.5 text-[8px] font-black   text-slate-400";

    return (
        <DivisionProvider>
            <div className="flex h-screen bg-white overflow-hidden">
                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 text-slate-800 flex flex-col h-full transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:w-72
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="p-4 shrink-0 border-b border-slate-200 flex items-center justify-between gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/Academik_logo.png" alt="Academik.ai" className="h-7 object-contain" />
                            <span className="bg-slate-100 text-[8px] font-black px-1.5 py-0.5 rounded text-slate-500  mt-0.5 border border-slate-200">BETA</span>
                        </Link>
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden text-slate-400 hover:text-slate-600"
                        >
                            <span className="material-icons-outlined">close</span>
                        </button>
                    </div>

                    <nav className="mt-4 flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pb-10">
                        <Link href="/admin/dashboard" className={navLinkClass("/admin/dashboard")}>
                            <span className="material-icons-outlined text-xl">dashboard</span>
                            Dashboard
                        </Link>

                        <div className="pt-3 pb-1">
                            <p className={navHeadingClass}>Learning & Skills</p>
                        </div>
                        {/* <Link href="/admin/job-simulation" className={navLinkClass("/admin/job-simulation")}>
                            <span className="material-icons-outlined text-xl">psychology</span>
                            Neural Coaching Lab
                        </Link> */}
                        <Link href="/admin/aptitude" className={navLinkClass("/admin/aptitude")}>
                            <span className="material-icons-outlined text-xl">calculate</span>
                            Aptitude
                        </Link>
                        <Link href="/admin/coding" className={navLinkClass("/admin/coding")}>
                            <span className="material-icons-outlined text-xl">code</span>
                            Coding
                        </Link>
                        <Link href="/admin/communication" className={navLinkClass("/admin/communication")}>
                            <span className="material-icons-outlined text-xl">record_voice_over</span>
                            Communication
                        </Link>

                        <div className="pt-3 pb-1">
                            <p className={navHeadingClass}>Assessments</p>
                        </div>
                        <Link href="/admin/psychometric" className={navLinkClass("/admin/psychometric")}>
                            <span className="material-icons-outlined text-xl">psychology_alt</span>
                            Psychometric Assessment
                        </Link>
                        <Link href="/admin/assessments" className={navLinkClass("/admin/assessments")}>
                            <span className="material-icons-outlined text-xl">assignment</span>
                            Skill Assessment
                        </Link>
                        <Link href="/admin/evaluator" className={navLinkClass("/admin/evaluator")}>
                            <span className="material-icons-outlined text-xl">rate_review</span>
                            AI Evaluation
                        </Link>

                        <div className="pt-3 pb-1">
                            <p className={navHeadingClass}>Resume & Career</p>
                        </div>
                        <Link href="/admin/resume-builder" className={navLinkClass("/admin/resume-builder")}>
                            <span className="material-icons-outlined text-xl">build</span>
                            Resume Builder
                        </Link>
                        <Link href="/admin/resume-scorer" className={navLinkClass("/admin/resume-scorer")}>
                            <span className="material-icons-outlined text-xl">description</span>
                            Resume Analyzer
                        </Link>

                        <div className="pt-3 pb-1">
                            <p className={navHeadingClass}>Interviews</p>
                        </div>
                        <Link href="/admin/interviews" className={navLinkClass("/admin/interviews")}>
                            <span className="material-icons-outlined text-xl">smart_toy</span>
                            AI Mock Interview
                        </Link>
                        <Link href="/admin/discussion" className={navLinkClass("/admin/discussion")}>
                            <span className="material-icons-outlined text-xl">groups</span>
                            Group Discussion
                        </Link>
                        <Link href="/admin/automated-video-interviews" className={navLinkClass("/admin/automated-video-interviews")}>
                            <span className="material-icons-outlined text-xl">videocam</span>
                            Video Interview
                        </Link>

                        <div className="pt-3 pb-1">
                            <button
                                onClick={() => setIsCertOpen(!isCertOpen)}
                                className="w-full flex items-center justify-between px-3 py-1 text-[8px] font-black   text-slate-400 hover:text-[var(--color-primary)] transition-colors group"
                            >
                                <span>Certification Prep</span>
                                <span className={`material-icons-outlined text-sm transition-transform duration-200 ${isCertOpen ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCertOpen ? 'max-h-[800px] opacity-100 py-1' : 'max-h-0 opacity-0'}`}>
                            {[
                                { name: "AWS", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
                                { name: "Microsoft", logo: "https://www.vectorlogo.zone/logos/microsoft/microsoft-icon.svg" },
                                { name: "GCP", logo: "https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg" },
                                { name: "Cybersecurity", logo: "https://www.comptia.org/_next/image/?url=https%3A%2F%2Fimages.cmp.optimizely.com%2F8623b0fab71111efac96d615e91762a5%3Fwidth%3D300%26height%3D300&w=640&q=90" },
                                { name: "Salesforce", logo: "https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg" },
                                { name: "ServiceNow", logo: "https://www.vectorlogo.zone/logos/servicenow/servicenow-icon.svg" },
                                { name: "NVIDIA", logo: "https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg" },
                                { name: "AMD", logo: "https://www.vectorlogo.zone/logos/amd/amd-icon.svg" },
                                { name: "Intel", logo: "https://www.vectorlogo.zone/logos/intel/intel-icon.svg" },
                                { name: "IBM", logo: "https://www.vectorlogo.zone/logos/ibm/ibm-icon.svg" },
                                { name: "Blockchain", logo: "https://www.vectorlogo.zone/logos/ethereum/ethereum-icon.svg" },
                                { name: "Web3", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Web3_logo.svg" },
                                { name: "AI", logo: "https://static.vecteezy.com/system/resources/previews/003/479/994/original/ai-artificial-intelligence-logo-in-hands-artificial-intelligence-and-machine-learning-concept-sphere-grid-wave-with-binary-code-big-data-innovation-technology-neural-networks-illustration-vector.jpg" }
                            ].map(cert => (
                                <Link key={cert.name} href={`/admin/certification/${cert.name.toLowerCase()}`} className={`${navLinkClass(`/admin/certification/${cert.name.toLowerCase()}`)} ml-2 mb-0.5`}>
                                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                        <img
                                            src={cert.logo}
                                            alt={cert.name}
                                            className="w-full h-full object-contain filter grayscale-0 group-hover:grayscale-0"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                // Prevent infinite loop by checking if we've already tried the fallback
                                                if (target.src.includes('/verified.svg')) return;
                                                target.src = '/verified.svg';
                                            }}
                                        />
                                    </div>
                                    <span>{cert.name}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="pt-3 pb-1">
                            <p className={navHeadingClass}>{getManagementHeader()}</p>
                        </div>

                        {isManagement && (
                            <Link href="/admin/divisions" className={navLinkClass("/admin/divisions")}>
                                <span className="material-icons-outlined text-xl">account_balance</span>
                                College Divisions
                            </Link>
                        )}

                        {isInstitutional && (
                            <Link href="/admin/departments" className={navLinkClass("/admin/departments")}>
                                <span className="material-icons-outlined text-xl">domain</span>
                                Departments
                            </Link>
                        )}

                        {isHOD && (
                            <Link href="/admin/staff" className={navLinkClass("/admin/staff")}>
                                <span className="material-icons-outlined text-xl">badge</span>
                                Staff Management
                            </Link>
                        )}

                        <Link href="/admin/students" className={navLinkClass("/admin/students")}>
                            <span className="material-icons-outlined text-xl">people</span>
                            Student Registry
                        </Link>

                        <Link href="/admin/student-reports" className={navLinkClass("/admin/student-reports")}>
                            <span className="material-icons-outlined text-xl">insights</span>
                            Student Performance Report
                        </Link>

                        {(role === "ADMIN" || role === "SUB_ADMIN") && (
                            <Link href="/admin/department-reports" className={navLinkClass("/admin/department-reports")}>
                                <span className="material-icons-outlined text-xl">analytics</span>
                                HOD Reports
                            </Link>
                        )}

                        {isManagement && (
                            <Link href="/admin/institution-reports" className={navLinkClass("/admin/institution-reports")}>
                                <span className="material-icons-outlined text-xl">corporate_fare</span>
                                Institution Reports
                            </Link>
                        )}

                        <div className="pt-3 pb-1">
                            <p className={navHeadingClass}>System</p>
                        </div>
                        <Link href="/admin/activity" className={navLinkClass("/admin/activity")}>
                            <span className="material-icons-outlined text-xl">history</span>
                            Activity Logs
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-slate-200 shrink-0">
                        <button onClick={logout} className="group flex items-center gap-3 w-full px-3 py-2 text-[10px] font-bold rounded-xl text-slate-500 hover:bg-slate-100 transition-all duration-200">
                            <span className="material-icons-outlined text-xl">logout</span>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
                    {/* Header */}
                    <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30">
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden text-slate-500 hover:bg-slate-100 p-1 rounded-lg transition-colors"
                            >
                                <span className="material-icons-outlined text-2xl">menu</span>
                            </button>

                            <h1 className="text-lg md:text-xl font-bold text-gray-800  tracking-tight truncate max-w-[200px] md:max-w-none">
                                {role === "ADMIN" && !divisionId && "Management Admin"}
                                {role === "ADMIN" && divisionId && "Institutional Admin"}
                                {role === "SUB_ADMIN" && "HOD Admin"}
                                {role === "STAFF" && "Staff Admin"}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="hidden md:flex items-center gap-4">
                                <DivisionSelector />
                                <DepartmentSelector />
                                <BatchSelector />
                            </div>

                            <div className="hidden lg:block h-8 w-[1px] bg-slate-200 mx-2"></div>

                            <Link href="/admin/profile" className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-gray-700 leading-tight">{user || "Administrator"}</p>
                                    <p className="text-[10px] font-black text-slate-500   leading-tight">{role}</p>
                                </div>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-lg shadow-indigo-100">
                                    {user ? user.charAt(0).toUpperCase() : "A"}
                                </div>
                            </Link>
                        </div>
                    </header>

                    {/* Mobile Filters Bar */}
                    <div className="md:hidden flex items-center gap-2 p-2 bg-slate-50 border-b border-gray-200 overflow-x-auto justify-end">
                        <div className="flex items-center gap-2 min-w-max px-2">
                            <DivisionSelector />
                            <DepartmentSelector />
                            <BatchSelector />
                        </div>
                    </div>

                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </DivisionProvider>
    );
}
