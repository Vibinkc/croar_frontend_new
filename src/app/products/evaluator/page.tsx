"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EvaluatorProductPage() {
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
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-slate-600 bg-slate-800/50 px-3 py-1 rounded-full text-slate-300 text-xs font-bold   backdrop-blur-md"
                        >
                            <span className="material-symbols-rounded text-sm text-indigo-400">edit_note</span>
                            Automated Grading Assistant
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            Write Like <br /><span className=" text-indigo-400">You Mean It.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            Instant, objective feedback on your essays, reports, and creative writing. We analyze style, tone, and rhetorical strength against a database of excellence.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/evaluator")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-indigo-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:bg-indigo-500 flex gap-2">
                            <span className="material-symbols-rounded">edit</span> Open Editor
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-indigo-600 font-bold   text-sm">Beyond Spellcheck</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Rhetorical Intelligence</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">Standard tools catch typos. Evaluator catches weak arguments.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">tune</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Tone Calibration</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Shift your voice from "Casual" to "Academic" instantly. We flag colloquialisms that undermine your authority.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">gavel</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Argument Strength</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">We detect unsupported claims. If you say "Studies show...", our AI asks "Which studies?" and suggests citations.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">style</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Style Transfer</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Analyze the rhythm of your prose. Avoid repetitive sentence structures and passive voice.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section (Editor Visual) */}
            <section className="px-4 py-16 bg-white rounded-3xl mx-4 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full md:px-8">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">The Red Pen, Reimagined.</h2>
                        <p className="text-lg text-slate-600">We don't just highlight errors; we explain *why* it's an error. Learn to be a better writer with every edit.</p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-slate-50 p-6 border border-slate-200 text-center rounded-xl">
                                <div className="text-slate-400 font-bold text-xs  mb-2">Standard Tool</div>
                                <div className="text-red-500 font-bold text-4xl mb-1">12</div>
                                <div className="text-slate-500 text-sm">Corrections Found</div>
                            </div>
                            <div className="bg-indigo-900 text-white p-6 border border-indigo-900 text-center rounded-xl shadow-xl scale-105">
                                <div className="text-indigo-200 font-bold text-xs  mb-2">Talixo AI</div>
                                <div className="text-green-400 font-bold text-4xl mb-1">45</div>
                                <div className="text-slate-300 text-sm">Deep Insights</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Side: The Editor */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative min-h-[400px] bg-slate-50 p-8 shadow-inner rounded-xl border border-slate-200"
                    >
                        <div className="bg-white p-8 shadow-2xl border border-slate-100 relative rotate-1 max-w-sm mx-auto h-full min-h-[350px]">
                            <h3 className="font-bold text-xl mb-4 text-slate-900">The Future of AI</h3>
                            <p className="text-slate-700 leading-loose text-sm">
                                Artificial Intelligence is <span className="bg-red-100 border-b-2 border-red-400 px-1 cursor-help" title="Vague">basically getting better</span> at everything. However, the <span className="bg-yellow-100 border-b-2 border-yellow-400 px-1 cursor-help" title="Passive Voice">question is asked</span> by many experts: will it replace us?
                            </p>
                            <p className="text-slate-700 leading-loose text-sm mt-4">
                                <span className="bg-green-100 border-b-2 border-green-400 px-1">We must embrace change.</span>
                            </p>

                            {/* Floating Notes */}
                            <div className="absolute -right-4 top-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 shadow-lg transform rotate-3 rounded">Avoid "Basically"</div>
                            <div className="absolute -left-4 top-32 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 shadow-lg transform -rotate-3 rounded">Passive Voice</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Rubric Section */}
            <section className="px-4 py-16" id="rubric">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center text-slate-900">The Grading Rubric</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {[
                            { criteria: "Thesis Strength", score: "8/10", desc: "Is your main argument clear, debatable, and specific?" },
                            { criteria: "Evidence & Support", score: "6/10", desc: "Do you use data, quotes, or examples to back up your claims?" },
                            { criteria: "Flow & Transitions", score: "9/10", desc: "Does the reader move smoothly from one idea to the next?" },
                            { criteria: "Vocabulary", score: "7/10", desc: "Are you using precise, varied, and appropriate language?" }
                        ].map((row, i) => (
                            <div key={i} className="flex flex-col md:flex-row items-center gap-6 p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="w-full md:w-1/3 text-lg font-bold text-slate-900">{row.criteria}</div>
                                <div className="w-full md:w-2/3 flex items-center justify-between gap-4">
                                    <div className="text-slate-600 text-sm flex-1">{row.desc}</div>
                                    <div className="text-xl font-black text-indigo-200">{row.score}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Live Ticker (Dark Section) */}
            <section className="py-16 bg-slate-900 text-slate-400 font-mono text-xs overflow-hidden relative">
                <div className="flex gap-16 animate-[marquee_40s_linear_infinite] whitespace-nowrap">
                    {["User #882 improved Essay Grade from C+ to A-", "User #109 fixed 4 Passive Voice errors", "User #552 enhanced Vocabulary Score by 15%", "User #331 reached 98% Readability Score"].map((msg, i) => (
                        <span key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {msg}
                        </span>
                    ))}
                    {["User #882 improved Essay Grade from C+ to A-", "User #109 fixed 4 Passive Voice errors", "User #552 enhanced Vocabulary Score by 15%", "User #331 reached 98% Readability Score"].map((msg, i) => (
                        <span key={`d-${i}`} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {msg}
                        </span>
                    ))}
                </div>
            </section>

            {/* 8. New Section: Cognitive Load (Radial Progress Layout) */}
            <section className="py-24 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">Cognitive Load Analysis.</h2>
                        <p className="text-slate-600 mt-2">Is your writing easy to read, or is it a chore?</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 justify-items-center">
                        <div className="text-center">
                            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="440" strokeDashoffset="100" className="text-indigo-600" />
                                </svg>
                                <span className="absolute text-3xl font-black text-slate-900">77</span>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-slate-900">Flesch-Kincaid</h3>
                            <p className="text-sm text-slate-500 w-64 mx-auto">Grade Level: Standard. Equivalent to New York Times articles.</p>
                        </div>

                        <div className="text-center">
                            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="440" strokeDashoffset="300" className="text-pink-500" />
                                </svg>
                                <span className="absolute text-3xl font-black text-slate-900">30%</span>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-slate-900">Sentence Variety</h3>
                            <p className="text-sm text-slate-500 w-64 mx-auto">Low variance. Try mixing short, punchy sentences with longer complex ones.</p>
                        </div>

                        <div className="text-center">
                            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="440" strokeDashoffset="40" className="text-green-500" />
                                </svg>
                                <span className="absolute text-3xl font-black text-slate-900">92</span>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-slate-900">Vocabulary richness</h3>
                            <p className="text-sm text-slate-500 w-64 mx-auto">Excellent use of unique words without sounding pretentiously verbose.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. New Section: Subjective Grading (Grid of Cards) */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <h2 className="text-3xl font-black mb-12">Grading the "Un-gradable".</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Creativity", desc: "Originality of metaphor and thought.", grade: "A-", color: "text-purple-400" },
                            { title: "Persuasion", desc: "Strength of rhetorical devices used.", grade: "B+", color: "text-blue-400" },
                            { title: "Empathy", desc: "Emotional resonance with the reader.", grade: "A", color: "text-pink-400" },
                            { title: "Clarity", desc: "Minimization of ambiguity.", grade: "A+", color: "text-green-400" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className={`text-4xl font-black mb-4 ${item.color}`}>{item.grade}</div>
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">"The first draft of anything is s**t."</h2>
                    <p className="text-slate-500 text-lg mb-8 ">- Ernest Hemingway (and us)</p>
                    <button onClick={() => router.push("/practice/evaluator")} className="bg-indigo-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl">
                        Start Editing
                    </button>
                </div>
            </footer>
        </main>
    );
}
