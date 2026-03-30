"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CommunicationProductPage() {
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
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1590602847861-f357a9332bbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-pink-400/30 bg-pink-500/10 px-3 py-1 rounded-full text-pink-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md"
                        >
                            <span className="material-symbols-rounded text-sm text-pink-400">mic</span>
                            AI Audio Analysis
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            Speak with <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Absolute Clarity.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            The world's most advanced AI Speech Coach. We analyze your tone, pacing, filler words, and confidence in real-time to turn you into a master communicator.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/communication")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-pink-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-pink-500/25 flex gap-2">
                            <span className="material-symbols-rounded">graphic_eq</span> Start Recording
                        </button>
                        <button onClick={() => router.push("/contact")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white/10 text-white text-lg font-bold hover:bg-white/20 backdrop-blur-sm border border-white/20">
                            Listen Samples
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-pink-600 font-bold uppercase tracking-widest text-sm">Signal Processing</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Visualize Your Voice</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">We analyze *how* you say it, not just *what* you say.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-pink-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">timeline</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Fluency Timeline</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">See typical pauses, hesitations, and "umms" mapped on a timeline. Identify your stumbling blocks.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-pink-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">hearing</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Instant Neural Playback</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Listen to your recording immediately. We overlay AI commentary directly on the audio track.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-pink-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">speed</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Pace Alert</p>
                                <p className="text-slate-500 mt-2 leading-relaxed"> speaking too fast undermines authority. We track your Words Per Minute (WPM) to keep you in the "Goldilocks Zone".</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section (Before & After) */}
            <section className="px-4 py-16 bg-slate-900 rounded-3xl mx-4 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full md:px-8">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white">The Transformation.</h2>
                        <p className="text-lg text-slate-400">Most candidates lose the job in the first 60 seconds because of weak delivery. We fix that.</p>

                        <div className="flex gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-3xl font-black text-pink-500">92%</div>
                                <div className="text-xs text-slate-500 uppercase">Clarity Boost</div>
                            </div>
                            <div className="w-px bg-slate-700 h-12"></div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-blue-500">3x</div>
                                <div className="text-xs text-slate-500 uppercase">Confidence</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Side: Before/After */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-4"
                    >
                        <div className="bg-red-900/40 border border-red-500/30 p-6 rounded-xl relative overflow-hidden backdrop-blur-sm">
                            <div className="inline-block px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold rounded mb-2 border border-red-500/30">BEFORE</div>
                            <p className="font-mono text-slate-300 text-sm leading-relaxed">
                                "So, <span className="bg-red-500/30 px-1 text-white">um</span>, I think I'm <span className="bg-red-500/30 px-1 text-white">like</span> good at coding? I guess I can learn fast."
                            </p>
                        </div>
                        <div className="bg-green-900/40 border border-green-500/30 p-6 rounded-xl relative overflow-hidden backdrop-blur-sm">
                            <div className="inline-block px-2 py-0.5 bg-green-500/20 text-green-500 text-[10px] font-bold rounded mb-2 border border-green-500/30">AFTER TALIXO</div>
                            <p className="font-mono text-white text-sm leading-relaxed">
                                "I am a proficient developer <strong className="bg-green-500/30 px-1">specializing in React</strong>. I have a proven track record of rapid learning."
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Scenarios */}
            <section className="px-4 py-16 bg-white" id="scenarios">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center text-slate-900">Practice Scenarios</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { title: "The Elevator Pitch", duration: "60s Max", difficulty: "Beginner", desc: "Introduce yourself and your vision in under a minute." },
                            { title: "Salary Negotiation", duration: "5 mins", difficulty: "Advanced", desc: "Argue for a 20% raise using data and persuasion." },
                            { title: "Conflict Resolution", duration: "3 mins", difficulty: "Intermediate", desc: "De-escalate an angry client on a call." },
                            { title: "Public Speaking", duration: "10 mins", difficulty: "Expert", desc: "Deliver a keynote speech with proper pauses." }
                        ].map((track, i) => (
                            <motion.div whileHover={{ scale: 1.02 }} key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-pink-500 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${i % 2 === 0 ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <span className="material-symbols-rounded">{i % 2 === 0 ? 'mic' : 'campaign'}</span>
                                    </div>
                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">{track.difficulty}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-pink-600 transition-colors">{track.title}</h3>
                                <p className="text-slate-500 text-sm mb-4">{track.desc}</p>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <span className="material-symbols-rounded text-sm">schedule</span> {track.duration}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. New Section: Speech Analysis Engine (Split Feature Highlights) */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col gap-24">
                        {/* Feature 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1">
                                <div className="inline-block p-3 bg-pink-100 rounded-2xl mb-6 text-pink-600">
                                    <span className="material-symbols-rounded text-3xl">graphic_eq</span>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 mb-4">Pitch & Tonal Variety</h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                    Monotone voices put interviewers to sleep. Our engine visualizes your pitch variance, encouraging you to add dynamic range to emphasize key points in your story.
                                </p>
                                <div className="h-16 w-full flex items-end gap-1 bg-slate-50 rounded-xl overflow-hidden p-4 border border-slate-100">
                                    {[20, 45, 30, 60, 75, 50, 40, 65, 80, 55, 35, 70, 45, 60, 30].map((h, i) => (
                                        <div key={i} className="flex-1 bg-pink-400 rounded-t" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative">
                                    <div className="absolute top-4 right-4 text-xs font-bold bg-pink-500 px-2 py-1 rounded">LIVE</div>
                                    <div className="text-sm text-slate-400 font-mono mb-2">Speech Analysis Log</div>
                                    <div className="space-y-4 font-mono text-sm">
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">00:04</span>
                                            <span>Good modulation on "Project Lead".</span>
                                        </div>
                                        <div className="flex gap-4 text-yellow-400">
                                            <span className="text-slate-500">00:12</span>
                                            <span>Detected flatness. Try adding energy.</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <span className="text-slate-500">00:23</span>
                                            <span>Variance recovered. Excellent volume.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                            <div className="flex-1">
                                <div className="inline-block p-3 bg-purple-100 rounded-2xl mb-6 text-purple-600">
                                    <span className="material-symbols-rounded text-3xl">speed</span>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 mb-4">The Filler Word Trap</h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                    "Um", "Like", "You know". We catch them all. Our semantic filter highlights these confidence-killers in your transcript so you can surgically remove them from your vocabulary.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {['Basically', 'Actually', 'Literally', 'Like'].map((word) => (
                                        <span key={word} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100 line-through decoration-2 decoration-red-400 opacity-70">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                <div className="text-6xl font-black text-slate-200 mb-4">0%</div>
                                <h4 className="text-xl font-bold text-slate-900">Target Filler Rate</h4>
                                <p className="text-slate-500 mt-2 max-w-xs">Elite communicators use less than 2 filler words per minute. Can you beat the benchmark?</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. New Section: Real-Time Feedback Loop (Process Diagram) */}
            <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 text-center">
                    <h2 className="text-3xl lg:text-5xl font-black mb-16">The Feedback Loop.</h2>

                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 hidden md:block"></div>

                        <div className="grid md:grid-cols-4 gap-8 relative z-10">
                            {[
                                { title: "Capture", icon: "mic", desc: "High-sample rate audio recording via browser." },
                                { title: "Transcribe", icon: "description", desc: "Speech-to-Text conversion with 99% accuracy." },
                                { title: "Analyze", icon: "psychology", desc: "NLP engine scores sentiment & structure." },
                                { title: "Improve", icon: "trending_up", desc: "Actionable tips delivered instantly." }
                            ].map((step, i) => (
                                <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl hover:border-pink-500 transition-colors group">
                                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-800 shadow group-hover:bg-pink-600 group-hover:border-pink-500 transition-colors">
                                        <span className="material-symbols-rounded text-2xl group-hover:text-white text-slate-400">{step.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                    <p className="text-slate-400 text-sm">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">Find Your Voice.</h2>
                    <p className="text-slate-500 text-lg mb-8">Don't let poor communication hold back your brilliant ideas.</p>
                    <button onClick={() => router.push("/practice/communication")} className="bg-pink-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl">
                        Open Voice Lab
                    </button>
                    <p className="mt-6 text-xs text-pink-300 font-mono uppercase tracking-widest font-bold">Requires Microphone Access • Privacy Protected</p>
                </div>
            </footer>
        </main>
    );
}
