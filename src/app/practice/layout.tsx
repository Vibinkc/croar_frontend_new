"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PracticeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}

function LayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && role !== "STUDENT") {
            router.push("/login");
        }
    }, [role, isLoading, router]);


    useEffect(() => {
        // Close mobile menu on route change
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (isLoading || role !== "STUDENT") {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const navGroups = [
        {
            title: "Dashboard",
            items: [
                { name: "Dashboard", path: "/practice", icon: "dashboard" },
            ]
        },
        {
            title: "Learning & Skills",
            items: [
                // { name: "Neural Coaching Lab", path: "/practice/job-simulation", icon: "psychology" },
                { name: "Aptitude", path: "/practice/aptitude", icon: "calculate" },
                { name: "Coding", path: "/practice/coding", icon: "code" },
                { name: "Communication", path: "/practice/communication", icon: "record_voice_over" },
                { name: "AI Adaptive Practice", path: "/practice/ai-practice", icon: "auto_awesome" },
            ]
        },
        {
            title: "Assessments",
            items: [
                { name: "Psychometric Assessment", path: "/practice/psychometric", icon: "psychology_alt" },
                { name: "Skill Assessment", path: "/practice/assessments", icon: "assignment" },
                { name: "AI Evaluation", path: "/practice/evaluator", icon: "rate_review" },

            ]
        },
        {
            title: "Resume & Career",
            items: [
                { name: "Resume Builder", path: "/practice/resume-builder", icon: "build" },
                { name: "Resume Analyzer", path: "/practice/resume-scorer", icon: "description" },
            ]
        },
        {
            title: "Interviews",
            items: [
                { name: "AI Mock Interview", path: "/practice/interviews", icon: "smart_toy" },
                { name: "Group Discussion", path: "/practice/discussion", icon: "groups" },
                { name: "Video Interview", path: "/practice/automated-video-interviews", icon: "videocam" },
            ]
        },
        {
            title: "Reports",
            items: [
                { name: "My Performance Report", path: "/practice/reports", icon: "analytics" },
            ]
        }
    ];

    const isActive = (path: string) => {
        // AI flow override: if on an assessment/result page with ?from=ai, highlight AI Practice
        const isAIFlow = (pathname.startsWith("/practice/assessments") || pathname.startsWith("/practice/assessments/results")) && searchParams.get("from") === "ai";

        if (isAIFlow) {
            return path === "/practice/ai-practice";
        }

        if (path === "/practice") {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const isFullScreen = searchParams.get('mode') === 'fullscreen';

    const isSimulationSession = pathname.startsWith('/practice/job-simulation/') &&
        pathname.replace(/\/$/, '') !== '/practice/job-simulation';

    const isAptitudeSession = pathname.startsWith('/practice/aptitude/') &&
        pathname !== '/practice/aptitude' &&
        pathname !== '/practice/aptitude/';

    const isCodingSession = pathname.startsWith('/practice/coding/') &&
        pathname !== '/practice/coding' &&
        pathname !== '/practice/coding/';

    const isAssessmentSession = (pathname.startsWith('/practice/assessments') || pathname.startsWith('/practice/evaluator')) &&
        pathname.replace(/\/$/, '') !== '/practice/assessments' &&
        pathname.replace(/\/$/, '') !== '/practice/evaluator' &&
        !pathname.includes('/results/');

    const isInterviewSession = pathname.startsWith('/practice/interviews/') &&
        pathname.replace(/\/$/, '') !== '/practice/interviews';

    const isVideoInterviewSession = pathname.startsWith('/practice/automated-video-interviews/') &&
        pathname.replace(/\/$/, '') !== '/practice/automated-video-interviews';

    const isSessionPage = pathname.includes('/room') ||
        pathname.includes('/waiting') ||
        isSimulationSession ||
        isFullScreen ||
        isAptitudeSession ||
        isCodingSession ||
        isAssessmentSession ||
        isInterviewSession ||
        isVideoInterviewSession;

    if (isSessionPage) {
        const isSimulation = pathname.startsWith('/practice/job-simulation/');
        return (
            <main className={`flex-1 flex flex-col overflow-hidden h-screen ${isSimulation ? 'bg-slate-50' : 'bg-slate-900'}`}>
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        );
    }

    return (
        <div className="flex min-h-screen relative">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out h-full
                md:sticky md:top-0 md:translate-x-0 md:w-72 md:h-screen
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className="p-4 flex items-center justify-between shrink-0">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/Academik_logo.png"
                            alt="Academik.ai"
                            width={120}
                            height={32}
                            className="h-7 w-auto object-contain"
                            unoptimized
                        />
                        <span className="bg-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-500 mt-0.5 border border-slate-200">BETA</span>
                    </Link>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-slate-400 hover:text-slate-600"
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-4 overflow-y-auto scrollbar-none pb-6">
                    {navGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            <h3 className="px-3 mb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 hidden md:block">
                                {group.title}
                            </h3>
                            {/* Mobile Section Title */}
                            <h3 className="px-3 mb-1.5 text-[10px] font-bold   text-slate-400 dark:text-slate-500 md:hidden mt-2">
                                {group.title}
                            </h3>

                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all group ${isActive(item.path)
                                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                            : 'text-slate-500 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                            }`}
                                    >
                                        <span className={`material-symbols-rounded text-xl transition-colors ${isActive(item.path) ? 'text-[var(--color-primary)]' : 'text-slate-400 group-hover:text-[var(--color-primary)]'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-[10px] font-bold md:block whitespace-nowrap">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <span className="material-symbols-rounded text-slate-500 text-[20px]">logout</span>
                        <span className="text-[10px] font-semibold md:block">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden h-screen bg-slate-50 dark:bg-slate-900 w-full relative">
                {/* Header */}
                <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-lg transition-colors"
                        >
                            <span className="material-icons-outlined text-2xl">menu</span>
                        </button>

                        <h1 className="text-sm font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
                            {navGroups.flatMap(g => g.items).find(i => isActive(i.path) && (i.path === pathname || i.path === '/practice' && pathname === '/practice'))?.name || "Mission Control"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/practice/profile" className="flex items-center gap-3 pl-2 md:pl-6 border-l-0 md:border-l border-slate-200 dark:border-slate-800 h-8 hover:opacity-80 transition-opacity cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{user || "Student Account"}</p>
                                <p className="text-[9px] font-semibold text-slate-400 leading-tight">{role ? role.charAt(0) + role.slice(1).toLowerCase() : ""}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-slate-200 dark:shadow-none">
                                {user ? user.charAt(0).toUpperCase() : "SA"}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Content */}
                <div className={`flex-1 relative z-0 ${pathname.startsWith('/practice/communication/') && pathname !== '/practice/communication' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6'}`}>
                    {children}
                </div>
            </main>
        </div >
    );
}
