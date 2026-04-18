"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-slate-50 dark:bg-slate-950 pt-20 pb-10 border-t border-slate-200 dark:border-slate-900">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-20">
                    <div className="flex flex-col gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/Academik_logo.png" alt="Academik.ai" className="h-8 object-contain" />
                        </Link>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Empowering students with AI-driven tools to master skills and land their dream jobs.
                        </p>
                    </div>

                    <div>
                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white   mb-6">Skill Practice</h5>
                        <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <li><Link href="/products/aptitude" className="hover:text-indigo-600 transition-colors">Aptitude</Link></li>
                            <li><Link href="/products/communication" className="hover:text-indigo-600 transition-colors">Communication</Link></li>
                            <li><Link href="/products/coding-labs" className="hover:text-indigo-600 transition-colors">Coding Labs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white   mb-6">Real World Sim</h5>
                        <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <li><Link href="/products/job-simulator" className="hover:text-indigo-600 transition-colors">Job Simulator</Link></li>
                            <li><Link href="/products/discussion" className="hover:text-indigo-600 transition-colors">Group Discussion</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white   mb-6">Smart Assessments</h5>
                        <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <li><Link href="/products/interviews" className="hover:text-indigo-600 transition-colors">AI Interviews</Link></li>
                            <li><Link href="/products/video-interviews" className="hover:text-indigo-600 transition-colors">Video Interviews</Link></li>
                            <li><Link href="/products/resume-scorer" className="hover:text-indigo-600 transition-colors">Resume Scorer</Link></li>
                            <li><Link href="/products/evaluator" className="hover:text-indigo-600 transition-colors">AI Evaluator</Link></li>
                            <li><Link href="/products/psychometric" className="hover:text-indigo-600 transition-colors">Psychometric</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="text-sm font-extrabold text-slate-900 dark:text-white   mb-6">Company</h5>
                        <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <li><Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link></li>
                            <li><Link href="/about" className="hover:text-indigo-600 transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
                    <p>© 2026 Academik.ai. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
