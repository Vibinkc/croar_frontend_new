"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DiscussionProductPage() {
    const router = useRouter();

    return (
        <main className="font-sans text-slate-900 bg-[#f6f6f8] overflow-x-hidden">
            {/* Hero Section (Adapted from Section 4 AI Group Discussion theme) */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#686bed]/5 to-transparent z-0"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-1.5 border border-indigo-200 mb-6 shadow-sm">
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#686bed] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#686bed]"></span>
                            </span>
                            <span className="text-[10px] font-bold   text-[#686bed]">AI Moderator Active</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] text-slate-900 tracking-tight">
                            Collaborative <br /> <span className="text-[#686bed]">Intelligence.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                            AI-led collaborative discussions designed to identify leadership, empathy, and clarity in real-time group scenarios.
                        </p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => router.push("/practice/discussion")}
                                className="bg-[#686bed] text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-[#686bed]/20 hover:-translate-y-1"
                            >
                                Join AI Discussion
                            </button>
                            <button onClick={() => router.push("/contact")} className="px-10 py-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                                View Leaderboard
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 4. AI Group Discussion (Deep Dive Mockup) */}
            <section className="py-24 bg-[#f6f6f8] overflow-hidden" id="ai-discussion">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        {/* Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1 w-full"
                        >
                            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/40">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="bg-slate-100 px-4 py-1 rounded-full text-xs font-mono font-bold text-slate-500">AI_MODERATOR: ONLINE</div>
                                </div>
                                <div className="space-y-6">
                                    {/* User 1 */}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
                                        <div className="bg-[#686bed]/10 p-4 rounded-xl rounded-tl-none">
                                            <p className="text-sm text-slate-700">I suggest we pivot to the subscription model for Q4 to stabilize revenue.</p>
                                        </div>
                                    </div>
                                    {/* AI Agent */}
                                    <div className="flex gap-4 flex-row-reverse">
                                        <div className="w-10 h-10 rounded-full bg-[#686bed] flex-shrink-0 flex items-center justify-center text-white shadow-lg">
                                            <span className="material-symbols-rounded text-sm">smart_toy</span>
                                        </div>
                                        <div className="bg-[#686bed] text-white p-4 rounded-xl rounded-tr-none shadow-md">
                                            <p className="text-sm ">Interesting point. How would that affect our churn rate in European markets?</p>
                                        </div>
                                    </div>
                                    {/* User 2 */}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-300 flex-shrink-0"></div>
                                        <div className="bg-white p-4 rounded-xl rounded-tl-none border border-slate-100 shadow-sm">
                                            <p className="text-sm text-slate-700">We could mitigate that with a localized pricing strategy.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1 space-y-6"
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">AI-Led Collaborative Discussions</h2>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                Our proprietary AI acts as a moderator, participant, and observer in multi-user environments. It probes deeper into candidate statements to uncover true expertise and behavioral traits.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <h4 className="font-bold text-[#686bed] mb-1">Sentiment Analysis</h4>
                                    <p className="text-xs text-slate-500">Detecting tone, cooperation, and conflict.</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <h4 className="font-bold text-[#686bed] mb-1">Impact Tracking</h4>
                                    <p className="text-xs text-slate-500">Measuring individual influence on group decisions.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. Collaborative Metrics (Tracking Teamwork) */}
            <section className="py-24 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Tracking Teamwork</h2>
                        <p className="text-slate-600 mt-2 text-lg">Data-driven insights into soft-skill dynamics.</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-12">
                        {[
                            { label: "Clarity", val: 94 },
                            { label: "Active Listening", val: 82 },
                            { label: "Negotiation", val: 76 },
                            { label: "Conflict Res.", val: 89 }
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-4xl font-bold text-[#686bed] mb-2">{stat.val}%</div>
                                <div className="text-sm font-bold   text-slate-400">{stat.label}</div>
                                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${stat.val}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-[#686bed]"
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Real-Time Feedback */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#686bed]/5 -skew-y-3 transform origin-top-left -z-10"></div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="order-2 lg:order-1"
                        >
                            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-lg text-slate-900">AI Coaching Note</h4>
                                    <span className="bg-[#686bed]/10 text-[#686bed] text-xs font-bold px-2 py-1 rounded">Live Analysis</span>
                                </div>
                                <p className="text-sm  text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 leading-relaxed">
                                    "The candidate successfully de-escalated the client concern but missed an opportunity to upsell. Recommended focus: Commercial Awareness."
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="text-xs font-bold text-slate-700">Emotional IQ: High</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-4/5 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 lg:order-2"
                        >
                            <h2 className="text-3xl font-bold mb-6 text-slate-900">Real-Time AI Feedback</h2>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                Candidates receive immediate micro-coaching while recruiters get a deep-dive analysis of decision patterns, tone, and logical flow as it happens.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 11. Multi-player Mode */}
            <section className="py-24 bg-[#686bed] text-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-6">Multi-player Challenges</h2>
                        <p className="opacity-90 text-lg mb-8 leading-relaxed">
                            Test how candidates work in a live team. Assign roles, set common goals, and watch how they collaborate, delegate, and resolve team friction in real-time.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold border border-white/10">Shared Whiteboard</span>
                            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold border border-white/10">Role Delegation</span>
                            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold border border-white/10">Team Quests</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
                        <div className="rounded-2xl overflow-hidden shadow-2xl h-64 bg-slate-800 relative group">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-rounded text-6xl text-white/50 group-hover:text-white transition-colors">groups_3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 13. Global Leaderboard */}
            <section className="py-24 bg-white" id="leaderboard">
                <div className="max-w-4xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Global Simulation Rankings</h2>
                        <p className="text-slate-500 mt-2">The top 0.1% of global simulation performers.</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold   text-slate-500">Rank</th>
                                    <th className="px-6 py-4 text-xs font-bold   text-slate-500">Candidate</th>
                                    <th className="px-6 py-4 text-xs font-bold   text-slate-500">Module</th>
                                    <th className="px-6 py-4 text-xs font-bold   text-slate-500">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {[
                                    { rank: "#1", name: "Sarah Jenkins", role: "Growth Lead", score: 998 },
                                    { rank: "#2", name: "Marc Durand", role: "Senior Dev", score: 992 },
                                    { rank: "#3", name: "Akihiro Sato", role: "Product Design", score: 985 },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-bold text-[#686bed]">{row.rank}</td>
                                        <td className="px-6 py-4 flex items-center gap-3 font-medium text-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                            {row.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{row.role}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{row.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 14. CTA */}
            <section className="py-24 bg-[#111121] relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#686bed]/20 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl lg:text-5xl font-extrabold mb-8">Ready to step up?</h2>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
                        Demonstrate your soft skills in a way that resumes can't capture.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push("/practice/discussion")}
                            className="bg-[#686bed] text-white px-10 py-5 rounded-xl font-black text-xl hover:scale-105 transition-transform shadow-2xl"
                        >
                            Enter Discussion
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
