"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

interface Track {
    icon: string;
    label: string;
    category: string;
    desc: string;
    color: string;
    stats: string;
    isCustom?: boolean;
}

const CATEGORIES = ["Coding", "Aptitude", "Communication", "Interviews"];

const TRACKS: Track[] = [
    // Coding
    { icon: "code", label: "DS & Algorithms", category: "Coding", desc: "Master fundamental data structures and complex algorithms.", color: "bg-emerald-500", stats: "5.1k+ Students" },
    { icon: "layers", label: "System Design", category: "Coding", desc: "Learn to build scalable, distributed systems from scratch.", color: "bg-blue-600", stats: "3.2k+ Students" },
    { icon: "terminal", label: "Competitive Coding", category: "Coding", desc: "Ace coding contests with speed and optimized logic.", color: "bg-indigo-600", stats: "4.5k+ Students" },

    // Aptitude
    { icon: "calculate", label: "Quantitative Aptitude", category: "Aptitude", desc: "Master numbers, logic, and data interpretation with ease.", color: "bg-blue-500", stats: "2.4k+ Students" },
    { icon: "lightbulb", label: "Logical Reasoning", category: "Aptitude", desc: "Sharpen your analytical and puzzle-solving abilities.", color: "bg-amber-500", stats: "3.2k+ Students" },
    { icon: "show_chart", label: "Data Interpretation", category: "Aptitude", desc: "Analyze charts, tables, and graphs like a pro.", color: "bg-cyan-500", stats: "1.9k+ Students" },

    // Communication
    { icon: "record_voice_over", label: "Verbal Ability", category: "Communication", desc: "Enhance your grammar, vocabulary, and reading skills.", color: "bg-purple-500", stats: "1.8k+ Students" },
    { icon: "forum", label: "Group Discussion", category: "Communication", desc: "Master the art of storytelling and professional speaking.", color: "bg-rose-500", stats: "2.1k+ Students" },
    { icon: "translate", label: "Business English", category: "Communication", desc: "Professional communication for corporate success.", color: "bg-slate-700", stats: "1.5k+ Students" },

    // Interviews
    { icon: "mic", label: "Mock Interviews", category: "Interviews", desc: "Face real HR and technical rounds with high confidence.", color: "bg-indigo-500", stats: "4.5k+ Students" },
    { icon: "psychology", label: "Behavioral Prep", category: "Interviews", desc: "Master standard HR and situational interview questions.", color: "bg-pink-500", stats: "2.8k+ Students" },
    { icon: "description", label: "Resume Strategy", category: "Interviews", desc: "Build a high-intent resume that beats the ATS every time.", color: "bg-sky-600", stats: "3.9k+ Students" },
];

export default function LearningTracks() {
    const [activeCategory, setActiveCategory] = useState("Coding");

    const categoryTracks = TRACKS.filter(track => track.category === activeCategory).slice(0, 3);

    const customCard: Track = {
        icon: "auto_fix_high",
        label: "CUSTOM YOUR TOPICS",
        category: activeCategory,
        desc: "Build a well-rounded professional profile by targeting specific areas tailored to your needs.",
        color: "bg-gradient-to-br from-indigo-600 to-purple-600",
        stats: "Always Open",
        isCustom: true
    };

    const displayTracks = [...categoryTracks, customCard];

    return (
        <section className="py-16 bg-white dark:bg-slate-950/50 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold   text-xs mb-4 block">Recommended for your journey</span>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 dark:text-white">
                            Explore Learning <span className="ai-text-gradient">Tracks</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                            Target specific areas to build a well-rounded professional profile and stay ahead in the placement race.
                        </p>
                    </motion.div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-8 py-2.5 rounded-full text-sm font-black transition-all duration-300 border-2  tracking-tight ${activeCategory === category
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 -translate-y-0.5"
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-600/30"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {displayTracks.map((track) => {
                            const getPath = (category: string) => {
                                switch (category) {
                                    case 'Coding': return '/products/coding-labs';
                                    case 'Aptitude': return '/products/aptitude';
                                    case 'Communication': return '/products/communication';
                                    case 'Interviews': return '/products/interviews';
                                    default: return '/contact';
                                }
                            };

                            return (
                                <motion.div
                                    key={`${activeCategory}-${track.label}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link href={track.isCustom ? '/contact' : getPath(track.category)} className={`group p-6 bg-white dark:bg-slate-900/60 rounded-[2.5rem] border-2 ${track.isCustom
                                        ? "border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-900/10 shadow-xl shadow-indigo-600/5 ring-1 ring-indigo-500/10 h-full"
                                        : "border-slate-100 dark:border-slate-800/50 h-full"
                                        } hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden flex flex-col block`}>
                                        {/* Hover Gradient Background */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className={`w-14 h-14 ${track.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl relative z-10 font-bold text-white group-hover:scale-110 transition-transform duration-500 ease-out`}>
                                            <span className="material-icons-outlined text-3xl font-light">{track.icon}</span>
                                        </div>

                                        <div className="relative z-10 flex-grow">
                                            <div className="text-indigo-600 dark:text-indigo-400 font-black text-[10px]  tracking-[0.1em] mb-1.5 opacity-60">{track.category}</div>
                                            <h3 className="text-lg font-black mb-2 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors  leading-tight tracking-tight">
                                                {track.label}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2 font-medium">
                                                {track.desc}
                                            </p>
                                        </div>

                                        <div className="relative z-10 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold  ">
                                                <span className="material-icons-outlined text-sm">{track.isCustom ? 'tune' : 'groups'}</span>
                                                {track.stats}
                                            </div>
                                            <div className={`w-9 h-9 rounded-full ${track.isCustom ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'} flex items-center justify-center group-hover:bg-indigo-700 group-hover:text-white transition-all transform group-hover:rotate-[-45deg]`}>
                                                <span className="material-icons-outlined text-sm">{track.isCustom ? 'add' : 'arrow_forward'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>

            </div>
        </section>
    );
}
