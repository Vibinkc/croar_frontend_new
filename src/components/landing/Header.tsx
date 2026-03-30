"use client";

import Link from "next/link";
import { useState } from "react";
import MegaMenu from "@/components/landing/MegaMenu";
import { usePathname } from "next/navigation";

const studentFeatures = [
    {
        title: "Skill Practice",
        items: [
            { name: "Aptitude", description: "Master quantitative & logical reasoning", path: "/products/aptitude", icon: "calculate" },
            { name: "Communication", description: "Practice speaking with AI feedback", path: "/products/communication", icon: "mic" },
            { name: "Coding Labs", description: "Real-world programming challenges", path: "/products/coding-labs", icon: "code" },
        ]
    },
    {
        title: "Real World Sim",
        items: [
            { name: "Job Simulator", description: "Experience real workplace scenarios", path: "/products/job-simulator", icon: "work_outline" },
            { name: "Group Discussion", description: "AI-led collaborative discussions", path: "/products/discussion", icon: "groups" },
        ]
    },
    {
        title: "Smart Assessments",
        items: [
            { name: "AI Interviews", description: "Intelligent conversational practice", path: "/products/interviews", icon: "smart_toy" },
            { name: "Video Interviews", description: "Automated video interview training", path: "/products/video-interviews", icon: "video_camera_front" },
            { name: "AI Resume Scorer", description: "Instant feedback on your resume", path: "/products/resume-scorer", icon: "description" },
            { name: "AI Evaluator", description: "Subjective task and email evaluation", path: "/products/evaluator", icon: "rate_review" },
            { name: "Psychometric", description: "Assess behavioral and personality traits", path: "/products/psychometric", icon: "psychology_alt" },
        ]
    }
];

export default function Header() {
    const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {showBanner && (
                <div className="bg-indigo-600 text-white text-xs py-2 px-4 text-center font-medium relative">
                    <span>NEW: Multi-Tenant Architecture is Live. Access your college or university portal below.</span>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white focus:outline-none"
                    >
                        <span className="material-icons-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            <nav
                className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
                onMouseLeave={() => setActiveMegaMenu(null)}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/Academik_logo.png" alt="Academik.ai" className="h-8 object-contain" />
                        </Link>

                        <div className="hidden md:flex items-center space-x-8 text-sm font-medium h-full">
                            {['Home', 'Products', 'About', 'Contact Us'].map((item) => {
                                const href = item === 'Home' ? '/' : item === 'About' ? '/about' : item === 'Contact Us' ? '/contact' : '#';
                                const isLinkActive = item === 'Products' ? activeMegaMenu === 'Products' : isActive(href);

                                return (
                                    <div
                                        key={item}
                                        className="h-full flex items-center relative"
                                        onMouseEnter={() => item === 'Products' ? setActiveMegaMenu('Products') : setActiveMegaMenu(null)}
                                    >
                                        <Link
                                            href={href}
                                            className={`flex items-center gap-1 transition-colors ${isLinkActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                        >
                                            {item}
                                            {item === 'Products' && (
                                                <span className={`material-icons-outlined text-xs transition-transform duration-200 ${activeMegaMenu === item ? 'rotate-180' : ''}`}>expand_more</span>
                                            )}
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex items-center gap-4">
                            <Link href="/contact" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg hover:opacity-90 transition-all">Get Started</Link>

                            <button
                                className="md:hidden text-slate-600 dark:text-slate-300"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span className="material-icons-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto max-h-[calc(100vh-4rem)]">
                        <div className="px-4 py-6 space-y-6">
                            {['Home', 'Products', 'About', 'Contact Us'].map((item) => {
                                const href = item === 'Home' ? '/' : item === 'About' ? '/about' : item === 'Contact Us' ? '/contact' : '#';
                                const isItemActive = item === 'Products' ? activeMegaMenu === 'Products' : isActive(href);

                                if (item === 'Products') {
                                    return (
                                        <div key={item} className="space-y-3">
                                            <button
                                                onClick={() => setActiveMegaMenu(activeMegaMenu === 'Products' ? null : 'Products')}
                                                className={`flex items-center justify-between w-full text-base font-medium transition-colors ${isItemActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
                                            >
                                                {item}
                                                <span className={`material-icons-outlined text-sm transition-transform duration-200 ${activeMegaMenu === 'Products' ? 'rotate-180' : ''}`}>expand_more</span>
                                            </button>

                                            {/* Mobile Products Accordion */}
                                            {activeMegaMenu === 'Products' && (
                                                <div className="pl-4 space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                                                    {studentFeatures.map((category, idx) => (
                                                        <div key={idx} className="space-y-3">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{category.title}</h4>
                                                            <div className="space-y-3">
                                                                {category.items.map((subItem, subIdx) => (
                                                                    <Link
                                                                        key={subIdx}
                                                                        href={subItem.path}
                                                                        onClick={() => setIsMenuOpen(false)}
                                                                        className="flex items-center gap-3 group"
                                                                    >
                                                                        <span className="material-icons-outlined text-slate-400 text-lg group-hover:text-indigo-600 transition-colors">{subItem.icon}</span>
                                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{subItem.name}</span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item}
                                        href={href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block text-base font-medium transition-colors ${isItemActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                    >
                                        {item}
                                    </Link>
                                );
                            })}

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link
                                    href="/contact"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full bg-indigo-600 text-white text-center px-5 py-3 rounded-xl text-sm font-bold hover:shadow-lg hover:opacity-90 transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="hidden md:block">
                    <MegaMenu
                        categories={studentFeatures}
                        isOpen={activeMegaMenu === 'Products'}
                        onClose={() => setActiveMegaMenu(null)}
                    />
                </div>
            </nav>
        </>
    );
}
