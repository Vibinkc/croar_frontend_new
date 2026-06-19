"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AptitudeProductPage() {
    const router = useRouter();

    return (
        <main className="max-w-[1200px] mx-auto overflow-x-hidden font-sans text-slate-900 bg-slate-50/50">
            {/* 2. Hero Section */}
            <section className="px-4 py-10 md:py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative flex min-h-[500px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-2xl items-center justify-center p-8 text-center overflow-hidden"
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-blue-400/30 bg-blue-500/10 px-3 py-1 rounded-full text-blue-300 text-xs font-bold   backdrop-blur-md"
                        >
                            <span className="material-symbols-rounded text-sm text-blue-400">calculate</span>
                            {"Cognitive Engine v2.0"}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            Master the <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Logic of Success.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            Aptitude isn&apos;t just about math; it&apos;s about decision-making speed. Our adaptive platform trains your brain to recognize patterns, calculate probabilities, and solve complex problems under intense time pressure.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/aptitude")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-blue-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-blue-500/25 flex gap-2">
                            <span className="material-symbols-rounded">play_arrow</span> Start Practice Session
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-blue-600 font-bold   text-sm">Precision Engineering</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Deconstruct Your Performance</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">We analyze your problem-solving down to the millisecond.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">speed</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Speed Telemetry</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">We measure Time Per Question (TPQ) against the global average. Accuracy without speed is failure in competitive exams.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">psychology</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Adaptive Difficulty</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">If you ace Level 1, we skip Level 2. Our algorithm keeps you in the &quot;Flow State&quot; by constantly adjusting the challenge.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">analytics</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Granular Analytics</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Know exactly that you are weak in &quot;Compound Interest&quot; but strong in &quot;Simple Interest&quot; with micro-topic tagging.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section (Algebra Visual) */}
            <section className="px-4 py-16 bg-white rounded-3xl mx-4 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full md:px-8">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <div className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold   w-fit">
                            The Traditional Flaw
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Static textbooks cannot adapt.</h2>
                        <p className="text-lg text-slate-600">Most students waste hundreds of hours practicing questions they already know how to solve. Textbooks treat everyone the same.</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <span className="material-symbols-rounded">done_all</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Our Method</h4>
                                    <p className="text-xs text-slate-500">Focuses 80% effort on your 20% weaknesses.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Side: The Problem Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative flex justify-center py-8"
                    >
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl max-w-sm w-full relative">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 ">Current Session</div>
                                    <div className="text-xl font-black text-slate-900">Quantitative Analysis</div>
                                </div>
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                                    <span className="material-symbols-rounded">timer</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-6 text-center mb-6 border border-slate-100">
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">ALGEBRA</span>
                                <p className="text-slate-800 font-bold text-lg">If x + 1/x = 5, find the value of x³ + 1/x³.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-600 text-center">110</div>
                                <div className="p-3 border border-indigo-500 bg-indigo-50 rounded cursor-pointer text-sm font-bold text-indigo-700 text-center shadow-md">125</div>
                                <div className="p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-600 text-center">140</div>
                                <div className="p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-600 text-center">115</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Curriculum / Syllabus */}
            <section className="px-4 py-16 bg-slate-50" id="syllabus">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center text-slate-900">Comprehensive Coverage</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">01</div>
                            <h3 className="font-bold text-lg text-slate-900 mb-4">Quantitative</h3>
                            <ul className="space-y-2">
                                {["Number Systems", "Percentages", "Profit & Loss", "Time & Work", "Algebra", "Geometry"].map(t => (
                                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">02</div>
                            <h3 className="font-bold text-lg text-slate-900 mb-4">Logical Reasoning</h3>
                            <ul className="space-y-2">
                                {["Blood Relations", "Coding-Decoding", "Seating Arrangements", "Puzzles", "Syllogisms", "Data Sufficiency"].map(t => (
                                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">03</div>
                            <h3 className="font-bold text-lg text-slate-900 mb-4">Verbal Ability</h3>
                            <ul className="space-y-2">
                                {["Reading Comprehension", "Vocabulary", "Grammar", "Para Jumbles", "Critical Reasoning"].map(t => (
                                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">Ready to Test Your Limits?</h2>
                    <p className="text-slate-500 text-lg mb-8">Take a free diagnostic test today. We&apos;ll identify your strengths and weaknesses in under 15 minutes.</p>
                    <button onClick={() => router.push("/practice/aptitude")} className="bg-blue-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl">
                        Start Diagnostic Test
                    </button>
                    <p className="mt-6 text-xs text-blue-300 font-mono   font-bold">No Credit Card Required • Instant Results</p>
                </div>
            </footer>
        </main>
    );
}
