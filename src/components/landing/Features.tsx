"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const FEATURES = [
    {
        id: "coding",
        icon: "code",
        title: "AI Coding Mentor",
        desc: "Get instant, line-by-line feedback on code complexity, style, and correctness in 50+ languages.",
        color: "from-emerald-500/20 to-teal-500/20",
        iconColor: "text-emerald-500",
        size: "md:col-span-2",
        graphic: "code_snippet",
        path: "/products/coding-labs"
    },
    {
        id: "speech",
        icon: "record_voice_over",
        title: "Speech Lab",
        desc: "AI-driven analysis of your grammar, confidence, and fluency with real-time feedback.",
        color: "from-blue-500/20 to-indigo-500/20",
        iconColor: "text-blue-500",
        size: "md:col-span-1",
        graphic: "wave",
        path: "/products/communication"
    },
    {
        id: "aptitude",
        icon: "psychology",
        title: "Adaptive Aptitude",
        desc: "Questions that adapt to your skill level, ensuring you master concepts from basic to advanced.",
        color: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-500",
        size: "md:col-span-1",
        path: "/products/aptitude"
    },
    {
        id: "resume",
        icon: "description",
        title: "ATS Resume Scorer",
        desc: "Upload your resume and get a precise ATS score with actionable tips to beat the recruiter bots.",
        color: "from-rose-500/20 to-pink-500/20",
        iconColor: "text-rose-500",
        size: "md:col-span-1",
        graphic: "stats",
        path: "/products/resume-scorer"
    },
    {
        id: "builder",
        icon: "construction",
        title: "ATS Resume Builder",
        desc: "Create a professional, ATS-friendly resume from scratch with our AI-powered builder.",
        color: "from-emerald-500/20 to-teal-500/20",
        iconColor: "text-emerald-500",
        size: "md:col-span-1",
        path: "/products/resume-builder"
    },
    {
        id: "interviews",
        icon: "mic",
        title: "AI Mock Interviews",
        desc: "Voice-enabled simulations for HR and Technical rounds with personalized performance reports.",
        color: "from-purple-500/20 to-violet-500/20",
        iconColor: "text-purple-500",
        size: "md:col-span-2",
        graphic: "interview_avatar",
        path: "/products/interviews"
    },
    {
        id: "simulation",
        icon: "hub",
        title: "Job Simulations",
        desc: "Experience real-world work scenarios and solve company-specific tasks before your first day.",
        color: "from-cyan-500/20 to-sky-500/20",
        iconColor: "text-cyan-500",
        size: "md:col-span-1",
        path: "/products/job-simulator"
    },
    {
        id: "analytics",
        icon: "trending_up",
        title: "Pro-Track Analytics",
        desc: "Visualize your growth with deep insights into your speed, accuracy, and skill gaps.",
        color: "from-slate-500/20 to-gray-500/20",
        iconColor: "text-slate-500",
        size: "md:col-span-1",
        path: "/products/evaluator"
    },
    {
        id: "placement",
        icon: "business_center",
        title: "Placement Hub",
        desc: "Connect direct with 300+ hiring partners and showcase your verified skill badges.",
        color: "from-indigo-600/10 to-blue-600/10",
        iconColor: "text-indigo-600",
        size: "md:col-span-1",
        path: "/about"
    },
    {
        id: "gd",
        icon: "groups",
        title: "AI Group Discussion",
        desc: "Practice group dynamics and contribution with AI feedback on your relevance and leadership.",
        color: "from-yellow-500/20 to-orange-500/20",
        iconColor: "text-yellow-600",
        size: "md:col-span-1",
        path: "/products/discussion"
    }
];

export default function Features() {
    return (
        <section className="py-24 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4 block">The Academik Ecosystem</span>
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white tracking-tight">
                            Everything You Need to <br />
                            <span className="ai-text-gradient">Crack the Interview</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                            Academik blends standard curriculum with advanced AI mentorship to ensure you are 100% ready for your dream job.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[minmax(16rem,_auto)]">
                    {FEATURES.map((feature, idx) => (
                        <Link
                            key={feature.id}
                            href={feature.path}
                            className={`${feature.size} group relative overflow-hidden p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-indigo-500/50 transition-all duration-500 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 block`}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="h-full flex flex-col"
                            >
                                {/* Abstract Graphic Ornaments */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} blur-[50px] opacity-100 transition-opacity duration-700`}></div>

                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 ring-1 ring-inset ring-indigo-500/10 group-hover:scale-110 transition-transform duration-500`}>
                                        <span className={`material-icons-outlined ${feature.iconColor} text-2xl`}>{feature.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-black mb-3 tracking-tight text-indigo-600 dark:text-indigo-400 transition-colors uppercase">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        {feature.desc}
                                    </p>
                                </div>

                                <div className="relative z-10 flex items-center justify-between pt-6 mt-auto">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 transition-colors">Explore Feature</div>
                                    <div className="w-8 h-8 rounded-full border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center transition-all duration-300">
                                        <span className="material-icons-outlined text-sm">arrow_outward</span>
                                    </div>
                                </div>

                                {/* Decorative Graphic Element for larger cards */}
                                {feature.graphic === 'code_snippet' && (
                                    <div className="absolute -bottom-6 -right-6 w-48 h-32 bg-slate-950 rounded-tl-2xl border-t border-l border-slate-800 opacity-40 transition-opacity p-4 hidden md:block select-none overflow-hidden">
                                        <div className="w-full h-2 bg-emerald-500/20 rounded-full mb-2"></div>
                                        <div className="w-2/3 h-2 bg-slate-700 rounded-full mb-2"></div>
                                        <div className="w-3/4 h-2 bg-slate-700 rounded-full"></div>
                                    </div>
                                )}

                                {feature.graphic === 'wave' && (
                                    <div className="absolute -bottom-2 right-0 left-0 h-10 opacity-25 transition-opacity pointer-events-none flex items-end justify-center gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((h, i) => (
                                            <div key={i} className="w-1 bg-blue-500 rounded-full" style={{ height: `${h * 4}px` }}></div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}
