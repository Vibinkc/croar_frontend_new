"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PsychometricProductPage() {
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
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%), url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-purple-400/30 bg-purple-500/10 px-3 py-1 rounded-full text-purple-300 text-xs font-bold   backdrop-blur-md"
                        >
                            <span className="material-symbols-rounded text-sm text-purple-400">biotech</span>
                            {"Behavioral Science Lab"}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            Decode Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Personality DNA.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            Employers don&apos;t just hire skills; they hire people. Discover your &quot;Big 5&quot; traits, workplace archetype, and hidden leadership strengths using our clinically validated assessment.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/psychometric")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-purple-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-purple-500/25 flex gap-2">
                            <span className="material-symbols-rounded">fingerprint</span> Begin Analysis
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-purple-600 font-bold   text-sm">Industrial Psychology</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">The Big 5 Model</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">The most scientifically robust way to describe human personality differences.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-purple-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">psychology_alt</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Trait Profiling</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Where do you fall on the spectrum of Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism?</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-purple-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">work</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Workplace Archetypes</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Are you &quot;The Commander&quot;, &quot;The Mediator&quot;, or &quot;The Analyst&quot;? Understand your default mode of operation.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-purple-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">handshake</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Career Compatibility</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Match your innate personality traits with roles that will make you happiest and most productive.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section (DNA Visual) */}
            <section className="px-4 py-16 bg-purple-50/50 rounded-3xl mx-4 border border-purple-100/50 relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full md:px-8">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">Backed by Science.</h2>
                        <p className="text-lg text-slate-600">We don&apos;t do horoscopes. We measure core psychological constructs that predict workplace performance, team fit, and leadership potential.</p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {[
                                { code: "O", name: "Openness", desc: "Curiosity" },
                                { code: "C", name: "Conscientiousness", desc: "Discipline" },
                                { code: "E", name: "Extraversion", desc: "Energy" },
                                { code: "A", name: "Agreeableness", desc: "Harmony" },
                                { code: "N", name: "Neuroticism", desc: "Resilience" }
                            ].map((trait, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                    <span className="text-xl font-black text-purple-600">{trait.code}</span>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{trait.name}</div>
                                        <div className="text-[10px] text-slate-500">{trait.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Visual Side: DNA Animation */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[400px] flex items-center justify-center"
                    >
                        {/* Spinning Orbit */}
                        <div className="w-[350px] h-[350px] rounded-full border border-purple-200 relative flex items-center justify-center animate-[spin_60s_linear_infinite]">
                            <div className="absolute inset-0 border border-purple-100 rounded-full scale-75"></div>

                            {/* Central Identity */}
                            <div className="absolute w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center z-10 animate-pulse border-4 border-purple-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <span className="material-symbols-rounded text-5xl text-purple-500">fingerprint</span>
                            </div>
                        </div>

                        {/* Floating Nodes (Static positions for simplicity/robustness) */}
                        <div className="absolute top-10 left-10 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-lg text-center animate-bounce">
                            <div className="text-[10px] text-slate-400 font-bold">Openness</div>
                            <div className="font-black text-purple-600">High</div>
                        </div>
                        <div className="absolute bottom-20 right-10 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-lg text-center animate-pulse">
                            <div className="text-[10px] text-slate-400 font-bold">Neuroticism</div>
                            <div className="font-black text-blue-600">Low</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Archetypes Grid */}
            <section className="px-4 py-16" id="archetypes">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center text-slate-900">Workplace Archetypes</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { name: "The Analyst", icon: "analytics", desc: "Logical, data-driven, and systematic.", color: "blue" },
                            { name: "The Commander", icon: "military_tech", desc: "Bold, imaginative, and strong-willed.", color: "red" },
                            { name: "The Mediator", icon: "groups", desc: "Poetic, kind, and altruistic idealists.", color: "green" },
                            { name: "The Consul", icon: "handshake", desc: "Extraordinarily caring and social.", color: "purple" }
                        ].map((arch, i) => (
                            <motion.div whileHover={{ y: -5 }} key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center group cursor-pointer hover:shadow-lg transition-all">
                                <div className={`w-16 h-16 mx-auto bg-${arch.color}-50 rounded-full flex items-center justify-center mb-4 text-${arch.color}-600`}>
                                    <span className="material-symbols-rounded text-3xl">{arch.icon}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-slate-900">{arch.name}</h3>
                                <p className="text-sm text-slate-500">{arch.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. New Section: Scientific Approach (Infographic) */}
            <section className="py-24 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 mb-6">More Than Just a Horoscope.</h2>
                            <p className="text-slate-600 text-lg leading-relaxed mb-8">
                                We don&apos;t do &quot;Barnum statements&quot;. Our assessment is built on the robust Big 5 (OCEAN) model, calibrated against a normative database of 50,000+ successful professionals.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-purple-200">01</span>
                                    <div className="font-bold text-slate-800">Reliability Co-efficient: 0.89</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-purple-200">02</span>
                                    <div className="font-bold text-slate-800">Construct Validity: Verified</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-purple-200">03</span>
                                    <div className="font-bold text-slate-800">Test-Retest Stability: High</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="relative aspect-square max-w-sm mx-auto">
                                <div className="absolute inset-0 bg-purple-100 rounded-full opacity-50 blur-3xl"></div>
                                <div className="relative z-10 w-full h-full border-2 border-dashed border-purple-200 rounded-full flex items-center justify-center">
                                    <div className="w-2/3 h-2/3 border-2 border-dashed border-purple-300 rounded-full flex items-center justify-center">
                                        <div className="w-1/3 h-1/3 bg-purple-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                                            YOU
                                        </div>
                                    </div>
                                    <div className="absolute top-0 transform -translate-y-1/2 bg-white px-4 py-2 rounded-full shadow font-bold text-xs text-slate-600">Openness</div>
                                    <div className="absolute bottom-0 transform translate-y-1/2 bg-white px-4 py-2 rounded-full shadow font-bold text-xs text-slate-600">Conscientiousness</div>
                                    <div className="absolute left-0 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow font-bold text-xs text-slate-600">Extraversion</div>
                                    <div className="absolute right-0 transform translate-x-1/2 bg-white px-4 py-2 rounded-full shadow font-bold text-xs text-slate-600">Agreeableness</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. New Section: Career Mapping (Cards) */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black mb-6">Where Do You Belong?</h2>
                        <p className="text-slate-400">Match your personality DNA to your ideal career habitat.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-purple-500 transition-colors group">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold font-serif  text-purple-300">Startups</h3>
                                <span className="material-symbols-rounded text-slate-600 group-hover:text-purple-500 transition-colors">rocket_launch</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-6 min-h-[60px]">High Openness + Low Neuroticism. You thrive in chaos and uncertainty.</p>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-purple-500 w-[92%] h-full"></div>
                            </div>
                            <div className="text-right text-xs text-purple-400 mt-2 font-mono">92% Match</div>
                        </div>

                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors group">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold font-serif  text-blue-300">Corporate</h3>
                                <span className="material-symbols-rounded text-slate-600 group-hover:text-blue-500 transition-colors">apartment</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-6 min-h-[60px]">High Conscientiousness + High Agreeableness. You are a team player who executes.</p>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 w-[78%] h-full"></div>
                            </div>
                            <div className="text-right text-xs text-blue-400 mt-2 font-mono">78% Match</div>
                        </div>

                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-green-500 transition-colors group">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold font-serif  text-green-300">R&D</h3>
                                <span className="material-symbols-rounded text-slate-600 group-hover:text-green-500 transition-colors">biotech</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-6 min-h-[60px]">Very High Openness + Introversion. You prefer deep work and solving novel problems.</p>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 w-[85%] h-full"></div>
                            </div>
                            <div className="text-right text-xs text-green-400 mt-2 font-mono">85% Match</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">Know Thyself.</h2>
                    <p className="text-slate-500 text-lg mb-8">Understanding your personality is the first step to mastering your career.</p>
                    <button onClick={() => router.push("/practice/psychometric")} className="bg-purple-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl">
                        Start Personality Test
                    </button>
                    <p className="mt-6 text-xs text-purple-300 font-mono   font-bold">Takes approx. 12 minutes • Scientific Assessment</p>
                </div>
            </footer>
        </main>
    );
}
