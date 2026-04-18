"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function VideoInterviewsProductPage() {
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
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%), url("https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-red-400/30 bg-red-500/10 px-3 py-1 rounded-full text-red-300 text-xs font-bold   backdrop-blur-md"
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Live Computer Vision
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            FRAME <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">YOURSELF.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            A dedicated studio to perfect your pitch. Our AI Director analyzes your micro-expressions, eye contact, and lighting to ensure you look as good as you sound.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/automated-video-interviews")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-red-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-red-500/25">
                            Start Take 1
                        </button>
                        <button onClick={() => router.push("/contact")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white/10 text-white text-lg font-bold hover:bg-white/20 backdrop-blur-sm border border-white/20">
                            See Demo Reel
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-red-500 font-bold   text-sm">Visual Intelligence</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Why Appearance Matters</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">Humans judge trustworthiness in milliseconds. We help you control the signals you're sending.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-red-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">face</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Eye Contact Tracking</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Are you looking at the lens or your screen? We map your gaze to ensure you're connecting with your audience.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-red-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">sentiment_satisfied</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Micro-Expressions</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">We detect fast flashes of doubt, fear, or annoyance that you might not even know you're showing.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-red-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">light_mode</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Setting Inspection</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Too dark? Backlit? Messy room? Our AI director flags environmental issues before you hit send.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section */}
            <section className="px-4 py-16 bg-white rounded-3xl mx-4 border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold   w-fit">
                            AI Director Mode
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Real-Time Guidance</h2>
                        <p className="text-lg text-slate-600">Prepare for the "Video On" moment. Our interface overlays helpful cues while you record, ensuring you stay centered, audible, and engaged.</p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="text-2xl font-black text-slate-900">40+</div>
                                <div className="text-xs text-slate-500  font-bold">Facial Landmarks</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="text-2xl font-black text-slate-900">99%</div>
                                <div className="text-xs text-slate-500  font-bold">Gaze Accuracy</div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-slate-900 aspect-video rounded-2xl shadow-2xl relative overflow-hidden border-8 border-slate-200 ring-1 ring-slate-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black z-0 flex items-center justify-center">
                            <span className="text-white/10 text-6xl font-black  transform -rotate-12">VIEWFINDER</span>
                        </div>
                        {/* Overlay Elements */}
                        <div className="absolute inset-4 z-10 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div> REC
                                </div>
                                <div className="text-green-400 font-mono text-xs">ISO: 400 • 1/60</div>
                            </div>
                            <div className="border border-white/20 rounded-lg absolute inset-8 pointer-events-none">
                                <div className="absolute top-1/3 w-full h-px bg-white/20"></div>
                                <div className="absolute top-2/3 w-full h-px bg-white/20"></div>
                                <div className="absolute left-1/3 h-full w-px bg-white/20"></div>
                                <div className="absolute left-2/3 h-full w-px bg-white/20"></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex gap-1 h-3 items-end">
                                    <div className="w-1 h-2 bg-green-500"></div>
                                    <div className="w-1 h-3 bg-green-500"></div>
                                    <div className="w-1 h-2 bg-green-500"></div>
                                    <div className="w-1 h-3 bg-green-500"></div>
                                </div>
                                <div className="text-white text-xl font-mono">00:04:12</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Film Strip (Interactive) */}
            <section className="px-4 py-16" id="practice">
                <h2 className="text-3xl font-black mb-12 px-4 border-l-4 border-red-500 text-slate-900">The Dailies (Review)</h2>
                <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar md:px-4">
                    {[
                        { time: "0:05", note: "Good Eye Contact", color: "green", icon: "visibility" },
                        { time: "0:12", note: "Nervous Smile", color: "yellow", icon: "sentiment_neutral" },
                        { time: "0:24", note: "Clear Articulation", color: "green", icon: "volume_up" },
                        { time: "0:38", note: "Low Lighting", color: "red", icon: "tungsten" },
                        { time: "0:45", note: "Slouched Posture", color: "red", icon: "accessibility_new" },
                        { time: "0:52", note: "Video Ends", color: "slate", icon: "stop" }
                    ].map((frame, i) => (
                        <motion.div whileHover={{ scale: 1.05 }} key={i} className="flex-shrink-0 w-64 bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer group">
                            <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                                <span className="material-symbols-rounded text-4xl text-slate-300 group-hover:text-red-500 transition-colors">play_circle</span>
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{frame.time}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-${frame.color}-100 flex items-center justify-center text-${frame.color}-600`}>
                                    <span className="material-symbols-rounded text-base">info</span>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{frame.note}</div>
                                    <div className="text-[10px] text-slate-400">Auto-Flag</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 7. Dark Section (Question Ticker) */}
            <section className="py-16 bg-slate-900 text-white overflow-hidden relative">
                <div className="text-center mb-8 relative z-10 px-4">
                    <h2 className="text-2xl font-bold text-white mb-2">Practice with Top 100 Questions</h2>
                    <p className="text-slate-400 text-sm">Prepare for every curveball.</p>
                </div>
                <div className="flex gap-4 animate-[marquee_40s_linear_infinite] whitespace-nowrap opacity-50 hover:opacity-100 transition-opacity">
                    {["Tell me about yourself.", "Why should we hire you?", "Describe a challenge you overcame.", "Where do you see yourself in 5 years?", "What is your greatest weakness?", "How do you handle conflict?", "Why do you want to work here?"].map((q, i) => (
                        <div key={i} className="px-6 py-3 bg-slate-800 rounded-full border border-slate-700 text-sm font-medium text-slate-300">
                            {q}
                        </div>
                    ))}
                    {["Tell me about yourself.", "Why should we hire you?", "Describe a challenge you overcame.", "Where do you see yourself in 5 years?", "What is your greatest weakness?", "How do you handle conflict?", "Why do you want to work here?"].map((q, i) => (
                        <div key={`d-${i}`} className="px-6 py-3 bg-slate-800 rounded-full border border-slate-700 text-sm font-medium text-slate-300">
                            {q}
                        </div>
                    ))}
                </div>
            </section>

            {/* 9. Skill Badges */}
            <section className="px-4 py-16 bg-red-50/50 mx-4 rounded-3xl mt-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-slate-900">Presentation Badges</h2>
                    <p className="text-slate-500 mt-2">Become a polished speaker.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
                    {[
                        { icon: "videocam", label: "Studio Ready", color: "red" },
                        { icon: "record_voice_over", label: "Clear Voice", color: "orange" },
                        { icon: "emoji_events", label: "Charismatic", color: "yellow" },
                        { icon: "timer", label: "Paced", color: "blue" },
                        { icon: "psychology", label: "Confident", color: "purple" }
                    ].map((badge, i) => (
                        <motion.div whileHover={{ scale: 1.1 }} key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                            <div className={`w-20 h-20 rounded-full bg-white border-2 border-${badge.color}-200 text-${badge.color}-500 flex items-center justify-center shadow-lg group-hover:shadow-xl`}>
                                <span className="material-symbols-rounded text-4xl">{badge.icon}</span>
                            </div>
                            <span className="font-bold text-sm text-slate-700">{badge.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 10. Comparison Table */}
            <section className="px-4 py-16 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12 text-slate-900">Why Record Yourself?</h2>
                    <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 font-bold text-slate-700">
                                <tr>
                                    <th className="p-4 md:p-6">Feature</th>
                                    <th className="p-4 md:p-6 text-red-600">Talixo Video Lab</th>
                                    <th className="p-4 md:p-6 text-slate-500">Practicing in Mirror</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Analysis</td>
                                    <td className="p-4 md:p-6 text-red-600 font-bold">Micro-Expression Tracking</td>
                                    <td className="p-4 md:p-6">None</td>
                                </tr>
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Record</td>
                                    <td className="p-4 md:p-6 text-red-600 font-bold">Unlimited Cloud Saves</td>
                                    <td className="p-4 md:p-6">Memory Dependant</td>
                                </tr>
                                <tr>
                                    <td className="p-4 md:p-6 font-medium text-slate-900">Structure</td>
                                    <td className="p-4 md:p-6 text-red-600 font-bold">Real Interview Questions</td>
                                    <td className="p-4 md:p-6">Talking to yourself</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 11. New Section: AI Director Features (Horizontal Scroll/Cards) */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="mb-12">
                        <h2 className="text-3xl font-black text-slate-900">Your Personal Director.</h2>
                        <p className="text-slate-600 mt-2">The AI monitors 50+ visual and auditory signals in real-time.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-rounded text-6xl text-red-500">light_mode</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">Lighting Optimization</h3>
                            <p className="text-sm text-slate-500">Detects backlighting, shadows, and overexposure. Suggests optimal positioning relative to light sources.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-rounded text-6xl text-red-500">blur_on</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">Background Blur</h3>
                            <p className="text-sm text-slate-500">Analyzes background clutter. Recommends decluttering or using professional virtual backgrounds.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-500 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-rounded text-6xl text-red-500">record_voice_over</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">Audio Clarity</h3>
                            <p className="text-sm text-slate-500">Flags echo, background noise, and low volume. Ensures your microphone is capturing studio-quality sound.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 12. New Section: Compliance & Privacy (Icon List) */}
            <section className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-12">Built for Privacy & Fairness</h2>
                    <div className="flex flex-wrap justify-center gap-12">
                        <div className="flex flex-col items-center gap-3 w-32">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <span className="material-symbols-rounded">lock</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800">GDPR Compliant</div>
                        </div>
                        <div className="flex flex-col items-center gap-3 w-32">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <span className="material-symbols-rounded">visibility_off</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800">No Human Review</div>
                        </div>
                        <div className="flex flex-col items-center gap-3 w-32">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <span className="material-symbols-rounded">balance</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800">Bias Mitigation</div>
                        </div>
                        <div className="flex flex-col items-center gap-3 w-32">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <span className="material-symbols-rounded">cloud_download</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800">Data Portability</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-slate-50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto">
                    <div className="flex flex-col gap-4 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900">Lights. Camera. Action.</h2>
                        <p className="text-slate-500 text-lg">Record unlimited takes. Erase your mistakes before the recruiter sees them.</p>
                    </div>
                    <button onClick={() => router.push("/practice/automated-video-interviews")} className="bg-red-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl shadow-red-600/30">
                        Start Recording
                    </button>
                </div>
            </footer>
        </main>
    );
}
