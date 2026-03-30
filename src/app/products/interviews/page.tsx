"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function InterviewsProductPage() {
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
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md"
                        >
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            AI Powered Simulation
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            The Interviewer <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Who Never Sleeps.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            Practice with specific personas—from the "Friendly HR" to the "Ruthless Tech Lead". Get grilled on your actual resume projects, salary expectations, and behavioral questions.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/interviews")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-indigo-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-indigo-500/25">
                            Start Mock Interview
                        </button>
                        <button onClick={() => router.push("/contact")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white/10 text-white text-lg font-bold hover:bg-white/20 backdrop-blur-sm border border-white/20">
                            See Sample Q&A
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm">Contextual Intelligence</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Inside the AI Mind</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">Our AI doesn't just read from a list. It builds a mental model of your profile and adapts the difficulty.</p>
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
                                <span className="material-symbols-rounded text-4xl">description</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Reads Your Resume</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">The AI parses your PDF before the chat starts. It knows you claimed to be an "Expert in Python" and will ask specific questions to verify that claim.</p>
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
                                <span className="material-symbols-rounded text-4xl">psychology</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Remembers Context</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">If you mention a specific algorithm earlier in the chat, the AI might reference it 10 minutes later to check for consistency.</p>
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
                                <span className="material-symbols-rounded text-4xl">search_check</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Drills Down</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">It refuses to accept surface-level answers. If you are vague, it will follow up with "Can you give me a specific example?"</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section */}
            <section className="px-4 py-16 bg-indigo-50/50 rounded-3xl mx-4 border border-indigo-100/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Anatomy of a Session</h2>
                        <p className="text-lg text-slate-600">"Tell me about yourself." It sounds simple, but 80% of candidates fail here by rambling. Our structured 15-minute sessions sharpen your delivery.</p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <span className="material-symbols-rounded text-green-500 bg-green-50 p-2 rounded-full">check</span>
                                <span className="font-bold text-slate-700">Detailed Intro Pitch Analysis</span>
                            </li>
                            <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <span className="material-symbols-rounded text-green-500 bg-green-50 p-2 rounded-full">check</span>
                                <span className="font-bold text-slate-700">STAR Method Compliance Check</span>
                            </li>
                            <li className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <span className="material-symbols-rounded text-green-500 bg-green-50 p-2 rounded-full">check</span>
                                <span className="font-bold text-slate-700">"Do you have questions?" Strategy</span>
                            </li>
                        </ul>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-200 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <span className="material-symbols-rounded">smart_toy</span>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 block">Sarah (Tech Lead)</span>
                                    <span className="text-xs text-green-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</span>
                                </div>
                            </div>
                            <span className="text-slate-400 font-mono text-xs">04:20</span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex gap-3">
                                <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-700 max-w-[85%]">
                                    I see you used Redux in your E-commerce project. Can you explain why you chose that over Context API?
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <div className="bg-indigo-600 rounded-2xl rounded-tr-none p-4 text-sm text-white max-w-[85%] shadow-md">
                                    For a large app with frequent state updates, Redux offered better performance optimizations and dev tools...
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex gap-1 items-center bg-slate-50 px-3 py-2 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-lg text-sm text-indigo-800 border border-indigo-100 flex gap-3 items-start">
                            <span className="material-symbols-rounded text-indigo-600 text-lg mt-0.5">auto_awesome</span>
                            <span>"Great answer! You correctly identified the trade-offs. Now, how would you handle async actions?"</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Personas (Job Sim Style) */}
            <section className="px-4 py-16" id="personas">
                <h2 className="text-3xl font-black mb-12 px-4 border-l-4 border-indigo-600 text-slate-900">Select Your Challenger</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div whileHover={{ y: -5 }} className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                        <span className="material-symbols-rounded text-blue-600 text-5xl mb-6 bg-blue-50 p-3 rounded-xl">person_pin</span>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">The Recruiter</h3>
                        <p className="text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">HR Screening</p>
                        <p className="text-slate-600 text-sm leading-relaxed">Focuses on culture fit, salary expectations, and behavioral history.</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="p-8 bg-white rounded-xl border border-indigo-200 shadow-md hover:shadow-xl transition-all group ring-2 ring-indigo-50">
                        <span className="material-symbols-rounded text-indigo-600 text-5xl mb-6 bg-indigo-50 p-3 rounded-xl">code</span>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">The Tech Lead</h3>
                        <p className="text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4">Technical Deep Dive</p>
                        <p className="text-slate-600 text-sm leading-relaxed">Expects specific technical details, system design diagrams, and code snippets.</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                        <span className="material-symbols-rounded text-slate-600 text-5xl mb-6 bg-slate-100 p-3 rounded-xl">diamond</span>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">The Executive</h3>
                        <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-4">Bar Raiser</p>
                        <p className="text-slate-600 text-sm leading-relaxed">Asks high-level strategic questions. Cares about business impact and ROI.</p>
                    </motion.div>
                </div>
            </section>

            {/* 7. Dark Section (Feedback) */}
            <section className="px-4 py-20 bg-slate-900 text-white rounded-3xl mx-4 overflow-hidden relative">
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1 flex flex-col items-center justify-center gap-6 bg-white/5 p-8 rounded-2xl backdrop-blur-md border border-white/10"
                    >
                        <div className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-indigo-300">Answer Clarity</span>
                                <span className="text-white font-bold">8.5/10</span>
                            </div>
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[85%]"></div>
                            </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-yellow-500">Keyword Usage</span>
                                <span className="text-white font-bold">6.0/10</span>
                            </div>
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full w-[60%]"></div>
                            </div>
                        </div>
                        <p className="text-sm italic text-slate-400 text-center">"Your technical explanation was solid, but you missed an opportunity to highlight business impact."</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2"
                    >
                        <h2 className="text-3xl md:text-5xl font-black mb-6 text-white">Instant Post-Mortem.</h2>
                        <p className="text-lg text-white/70 mb-8 max-w-lg">Stop wondering "How did I do?". Get immediate, detailed feedback on your answer quality, relevance, and tone. We grade every single message.</p>
                        <button onClick={() => router.push("/practice/interviews")} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-indigo-600/50">
                            Start Feedback Loop
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* 9. Skill Badges */}
            <section className="px-4 py-16 bg-white mx-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-slate-900">Earn Mastery Badges</h2>
                    <p className="text-slate-500 mt-2">Unlock industry-recognized badges as you master new interview techniques.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
                    {[
                        { icon: "star", label: "STAR Method", color: "indigo" },
                        { icon: "psychology", label: "EQ Master", color: "purple" },
                        { icon: "campaign", label: "Persuader", color: "blue" },
                        { icon: "timer", label: "Concise", color: "green" },
                        { icon: "trending_up", label: "Strategist", color: "orange" }
                    ].map((badge, i) => (
                        <motion.div whileHover={{ scale: 1.1 }} key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className={`w-20 h-20 rounded-full bg-white border-2 border-${badge.color}-100 text-${badge.color}-600 flex items-center justify-center shadow-lg`}>
                                <span className="material-symbols-rounded text-4xl">{badge.icon}</span>
                            </div>
                            <span className="font-bold text-sm text-slate-700">{badge.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 10. Comparison Table */}
            <section className="px-4 py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12 text-slate-900">Why Mock Interviews Matter</h2>
                    <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 font-bold text-slate-700">
                                <tr>
                                    <th className="p-4 md:p-6">Feature</th>
                                    <th className="p-4 md:p-6 text-indigo-600">Talixo AI Coach</th>
                                    <th className="p-4 md:p-6 text-slate-500">Practicing with a Friend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Feedback</td>
                                    <td className="p-4 md:p-6 text-indigo-600 font-bold">Objective & Data-Driven</td>
                                    <td className="p-4 md:p-6">Subjective & Biased</td>
                                </tr>
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Difficulty</td>
                                    <td className="p-4 md:p-6 text-indigo-600 font-bold">Adaptive (Harder as you go)</td>
                                    <td className="p-4 md:p-6">Inconsistent</td>
                                </tr>
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Knowledge Base</td>
                                    <td className="p-4 md:p-6 text-indigo-600 font-bold">All Tech Stacks & Roles</td>
                                    <td className="p-4 md:p-6">Limited to their experience</td>
                                </tr>
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Availability</td>
                                    <td className="p-4 md:p-6 text-indigo-600 font-bold">24/7 On-Demand</td>
                                    <td className="p-4 md:p-6">Schedule Dependent</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto">
                    <div className="flex flex-col gap-4 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900">Ready to Ace It?</h2>
                        <p className="text-slate-500 text-lg">Join thousands of candidates securing their dream jobs.</p>
                    </div>
                    <button onClick={() => router.push("/practice/interviews")} className="bg-indigo-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl shadow-indigo-600/30">
                        Start Practicing Now
                    </button>
                </div>
            </footer>
        </main>
    );
}
