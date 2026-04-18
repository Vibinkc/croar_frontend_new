"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JobSimProductPage() {
    const router = useRouter();

    return (
        <main className="font-sans text-slate-900 bg-[#f6f6f8] overflow-x-hidden">
            {/* 1. Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 space-y-8 text-center lg:text-left z-10"
                    >
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                            Master <span className="text-[#686bed]">Workplace</span> Realities
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            High-fidelity job simulations designed to identify top talent through immersive, real-world scenario testing.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => router.push("/practice/job-simulator")}
                                className="bg-[#686bed] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#686bed]/30 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
                            >
                                Launch Simulation
                            </button>
                            <button onClick={() => router.push("/contact")} className="bg-white border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors">
                                Watch Demo
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex-1 relative w-full"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-video">
                            {/* Dashboard UI Mockup */}
                            <div className="absolute inset-0 bg-slate-900 flex flex-col">
                                <div className="h-8 bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-700">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="flex-1 flex overflow-hidden">
                                    <div className="w-16 bg-slate-800 flex flex-col items-center py-4 gap-4 border-r border-slate-700">
                                        <div className="w-8 h-8 bg-[#686bed] rounded flex items-center justify-center text-white"><span className="material-symbols-rounded text-sm">mail</span></div>
                                        <div className="w-8 h-8 rounded text-slate-500 flex items-center justify-center hover:bg-slate-700"><span className="material-symbols-rounded text-sm">chat</span></div>
                                        <div className="w-8 h-8 rounded text-slate-500 flex items-center justify-center hover:bg-slate-700"><span className="material-symbols-rounded text-sm">folder</span></div>
                                    </div>
                                    <div className="flex-1 p-6 text-slate-300 font-mono text-xs">
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <div className="text-white text-lg font-bold mb-1">Incoming Ticket #4029</div>
                                                <div className="text-red-400">Priority: Critical // Server Outage</div>
                                            </div>
                                            <div className="bg-[#686bed]/20 text-[#686bed] px-3 py-1 rounded">Time Remaining: 04:21</div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="bg-slate-800 p-3 rounded border-l-2 border-red-500">
                                                <span className="text-red-400 font-bold">[ALERT]</span> Latency spike detected in US-East region.
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded">
                                                <span className="text-blue-400 font-bold">[SYS]</span> Rerouting traffic to backup nodes... <span className="text-green-400">SUCCESS</span>
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded border-l-2 border-[#686bed]">
                                                <span className="text-[#686bed] font-bold">[TASK]</span> Draft incident report for stakeholders.
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <button onClick={() => router.push("/contact")} className="bg-[#686bed] text-white px-4 py-2 rounded text-xs font-bold hover:bg-[#5b5ee1] w-full">OPEN EDITOR</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating Status Card */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 hidden md:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-full text-white">
                                    <span className="material-symbols-rounded text-sm">check</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold   text-slate-500">Live Status</p>
                                    <p className="text-sm font-bold text-slate-900">Assessment in Progress</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Job Simulator Intro */}
            <section className="py-24 bg-white" id="simulator">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-[#686bed] font-bold   text-sm">The Experience</span>
                            <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-6 text-slate-900">Experience Real Workplace Scenarios</h2>
                            <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                                Our Job Simulator doesn't just ask questions—it drops candidates into the heart of the action. From managing conflicting deadlines to resolving client crises, witness how they handle the pressure.
                            </p>
                            <ul className="space-y-4 text-slate-700">
                                {[
                                    "Dynamic environment that reacts to user input",
                                    "Time-boxed challenges to test prioritization",
                                    "Cross-functional communication simulations"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="material-symbols-rounded text-[#686bed]">done_all</span>
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="aspect-square bg-slate-50 rounded-2xl p-6 flex flex-col justify-end hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-rounded text-[#686bed] text-4xl mb-4">psychology</span>
                                <h4 className="font-bold text-slate-900">Cognitive Load</h4>
                            </div>
                            <div className="aspect-square bg-[#686bed] text-white rounded-2xl p-6 flex flex-col justify-end shadow-lg shadow-[#686bed]/20">
                                <span className="material-symbols-rounded text-4xl mb-4">bolt</span>
                                <h4 className="font-bold">Reaction Time</h4>
                            </div>
                            <div className="aspect-square bg-slate-50 rounded-2xl p-6 flex flex-col justify-end hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-rounded text-[#686bed] text-4xl mb-4">forum</span>
                                <h4 className="font-bold text-slate-900">Empathy Score</h4>
                            </div>
                            <div className="aspect-square bg-slate-50 rounded-2xl p-6 flex flex-col justify-end hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-rounded text-[#686bed] text-4xl mb-4">leaderboard</span>
                                <h4 className="font-bold text-slate-900">Outcome Quality</h4>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. Role-Based Modules */}
            <section className="py-24 bg-[#f6f6f8]">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Industry-Specific Modules</h2>
                        <p className="text-slate-600 mt-4 text-lg">Tailored simulations for diverse professional paths.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Sales & BD", icon: "payments", color: "blue", desc: "Simulate high-stakes negotiations, CRM pipeline management, and lead qualification scenarios." },
                            { title: "Software Engineering", icon: "code", color: "green", desc: "Integrated IDE simulations focusing on debugging, code review empathy, and system architecture." },
                            { title: "HR & People Ops", icon: "groups", color: "orange", desc: "Conflict resolution simulations, interviewing candidates, and culture-building decision trees." }
                        ].map((module, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-xl hover:border-[#686bed]/30 transition-all group"
                            >
                                <div className={`w-14 h-14 bg-${module.color}-100 text-${module.color}-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#686bed] group-hover:text-white transition-colors`}>
                                    <span className="material-symbols-rounded text-3xl">{module.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">{module.title}</h3>
                                <p className="text-slate-600 text-sm mb-6 leading-relaxed min-h-[60px]">{module.desc}</p>
                                <button onClick={() => router.push("/practice/job-simulator")} className="text-[#686bed] font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                                    Explore Sim <span className="material-symbols-rounded text-sm">arrow_forward</span>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Scenario Branching (from template) */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-6 text-slate-900">Scenario Branching Engine</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                                Every decision creates a new path. Our branching logic ensures no two simulations are identical, adapting the difficulty and scenario based on candidate performance.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-[#686bed]/20 bg-[#686bed]/5">
                                    <span className="material-symbols-rounded text-[#686bed] text-3xl">account_tree</span>
                                    <div>
                                        <h4 className="font-bold text-slate-900">200+ Branching Paths</h4>
                                        <p className="text-sm text-slate-500">Deep logical complexity for expert roles.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200">
                                    <span className="material-symbols-rounded text-slate-400 text-3xl">auto_fix_high</span>
                                    <div>
                                        <h4 className="font-bold text-slate-900">AI Dynamic Injection</h4>
                                        <p className="text-sm text-slate-500">New variables introduced mid-simulation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-12 bg-slate-50 rounded-3xl relative border border-slate-100">
                            {/* Visual Map Simulation */}
                            <div className="grid grid-cols-3 gap-8 relative z-10 scale-90 md:scale-100">
                                {/* Lines */}
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 -z-10"></div>

                                <div className="flex flex-col gap-12 items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="w-16 h-16 bg-[#686bed] rounded-xl shadow-lg shadow-[#686bed]/30 flex items-center justify-center relative z-10"
                                    >
                                        <span className="material-symbols-rounded text-white">play_arrow</span>
                                    </motion.div>
                                </div>
                                <div className="flex flex-col gap-8 justify-center">
                                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs ring-4 ring-white">A</div>
                                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs ring-4 ring-white">B</div>
                                </div>
                                <div className="flex flex-col gap-4 justify-center">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg ring-4 ring-white"></div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg ring-4 ring-white"></div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg ring-4 ring-white"></div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg ring-4 ring-white"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Virtual Work Tools (from template) */}
            <section className="py-24 bg-[#f6f6f8]">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-16 text-slate-900">Integrated Virtual Toolkit</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: "mail", color: "text-blue-500", title: "Email Sim", sub: "Manage inbox priority" },
                            { icon: "chat", color: "text-green-500", title: "Slack/Chat Sim", sub: "Team communication" },
                            { icon: "dashboard_customize", color: "text-purple-500", title: "Task Board", sub: "Agile workflow" },
                            { icon: "video_call", color: "text-orange-500", title: "Video Meeting", sub: "Presentation & presence" }
                        ].map((tool, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all"
                            >
                                <span className={`material-symbols-rounded text-5xl mb-6 ${tool.color}`}>{tool.icon}</span>
                                <h5 className="font-bold text-lg text-slate-900">{tool.title}</h5>
                                <p className="text-xs text-slate-500 mt-2 font-medium">{tool.sub}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. Candidate Immersion (from template) */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-bold mb-6">Total Immersion</h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8">
                            We've designed the environment to minimize the 'test-taking' feeling. From high-fidelity visuals to realistic ambient sounds, candidates feel like they're truly on the job.
                        </p>
                        <div className="flex gap-16">
                            <div>
                                <div className="text-4xl font-bold text-[#686bed] mb-1">0%</div>
                                <div className="text-xs   text-slate-500 font-bold">Latency</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-[#686bed] mb-1">4K</div>
                                <div className="text-xs   text-slate-500 font-bold">Visual Depth</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 14. CTA (from template) */}
            <section className="py-24 bg-[#686bed] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-8">Ready to prove your skills?</h2>
                    <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12">
                        Join 500+ global companies using SimuTalent to find their next high-performers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push("/practice/job-simulator")}
                            className="bg-[#FFD300] text-slate-900 px-10 py-5 rounded-xl font-black text-xl hover:scale-105 transition-transform shadow-2xl"
                        >
                            Start Simulation
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
