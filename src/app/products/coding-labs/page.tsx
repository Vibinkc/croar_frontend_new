"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function CodingProductPage() {
    const router = useRouter();
    const [typedText, setTypedText] = useState("");
    const fullText = "console.log('Hello, World!');";

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTypedText(fullText.slice(0, i + 1));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="max-w-[1200px] mx-auto overflow-x-hidden font-sans text-slate-900 bg-slate-50/50">
            {/* 2. Hero Section */}
            <section className="px-4 py-10 md:py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative flex min-h-[500px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-2xl items-center justify-center p-8 text-center overflow-hidden"
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-green-400/30 bg-green-500/10 px-3 py-1 rounded-full text-green-300 text-xs font-bold   backdrop-blur-md"
                        >
                            <span className="material-symbols-rounded text-sm text-green-400">code</span>
                            {"Cloud IDE v3.0"}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            Real-World <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Programming.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            Write code that compiles career. A browser-based Integrated Development Environment (IDE) with support for 50+ languages, built for competitive programming.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/coding")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-green-600 text-white text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-green-500/25 flex gap-2">
                            <span className="material-symbols-rounded">terminal</span> Open Editor
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-green-600 font-bold   text-sm">Dev Ecosystem</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">More Than Text</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">We give you a fully virtualized environment, not just a text box.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-green-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">folder_zip</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Project Structure</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Navigate through multiple files. Separate your logic into classes and modules just like in a real production codebase.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-green-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">bug_report</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Intelligent Debugger</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Set breakpoints, inspect variables, and step through your code. Our AI suggests fixes for common runtime errors.</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-green-500 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-2">
                                <span className="material-symbols-rounded text-4xl">memory</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Performance Metrics</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Detailed analysis of time complexity (Big O) and space complexity. See how your solution stacks up.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section (Typing Animation) */}
            <section className="px-4 py-16 bg-slate-900 rounded-3xl mx-4 text-white relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full md:px-8">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white">Code at the Speed of Thought.</h2>
                        <p className="text-lg text-slate-400">Our editor is powered by Monaco (the same tech behind VS Code). It feels instantly familiar, fast, and powerful.</p>
                        <div className="flex gap-4 mb-4">
                            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                                <div className="text-2xl font-black text-green-400">50+</div>
                                <div className="text-xs text-slate-400 font-bold ">Languages</div>
                            </div>
                            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                                <div className="text-2xl font-black text-blue-400">0.4s</div>
                                <div className="text-xs text-slate-400 font-bold ">Compile Time</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Side: The Editor */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl"
                    >
                        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 border-b border-slate-700">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="ml-4 text-xs font-mono text-slate-400">solution.js</div>
                        </div>
                        <div className="p-6 font-mono text-sm leading-8 min-h-[300px] text-slate-300">
                            <div className="flex">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">1</span>
                                <span><span className="text-purple-400">function</span> <span className="text-blue-400">solve</span>(input) &#123;</span>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">2</span>
                                <span className="pl-4"><span className="text-slate-500">{`// Parse the input integer`}</span></span>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">3</span>
                                <span className="pl-4"><span className="text-purple-400">let</span> n = <span className="text-orange-400">parseInt</span>(input);</span>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">4</span>
                                <span className="pl-4"><span className="text-purple-400">if</span> (n % <span className="text-red-400">2</span> === <span className="text-red-400">0</span>) &#123;</span>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">5</span>
                                <span className="pl-8"><span className="text-purple-400">return</span> <span className="text-green-400">&quot;Even&quot;</span>;</span>
                            </div>
                            <div className="flex">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">6</span>
                                <span className="pl-4">&#125;</span>
                            </div>
                            <div className="flex bg-slate-800/50 border-l-2 border-green-500 w-full">
                                <span className="w-8 text-slate-600 select-none text-right mr-4">7</span>
                                <span className="pl-4 text-white">{typedText}<span className="animate-pulse w-2 h-4 bg-green-500 inline-block align-middle ml-1"></span></span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Pipeline */}
            <section className="px-4 py-16 bg-white" id="pipeline">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center text-slate-900">The Compilation Pipeline</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-slate-100 -z-10"></div>
                        {[
                            { step: "01", title: "Write", desc: "Monaco Editor with IntelliSense" },
                            { step: "02", title: "Compile", desc: "Cloud-based GCC/Javac" },
                            { step: "03", title: "Test", desc: "20+ Hidden Test Cases" },
                            { step: "04", title: "Optimize", desc: "Refactor for Efficiency" }
                        ].map((s, i) => (
                            <motion.div whileHover={{ y: -5 }} key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                    {s.step}
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                                <p className="text-xs text-slate-500">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. New Section: Supported Tech Stack (Grid Layout) */}
            <section className="py-24 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">Speak Any Language.</h2>
                        <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
                            Whether you&apos;re a Python script-kiddie or a C++ systems architect, our environment adapts to your toolchain.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'Swift', 'Kotlin', 'PHP', 'SQL'].map((lang) => (
                            <div key={lang} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 hover:border-green-500 hover:shadow-md transition-all cursor-default">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-bold text-slate-700">{lang}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-slate-400 text-sm mt-8">
                        + 40 more languages and frameworks supported via containerized runners.
                    </p>
                </div>
            </section>

            {/* 8. New Section: System Design (Visual Interactive Look) */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold   mb-6">
                                New Feature
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-6">System Design Whiteboard.</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                Coding is only half the battle. Leading tech companies demand architectural prowess. Drag, drop, and design scalable systems in our integrated collaborative whiteboard.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { title: "Standard Component Library", desc: "Load balancers, Databases, Caches, Queues." },
                                    { title: "Traffic Simulation", desc: "Visualize data flow and identify bottlenecks." },
                                    { title: "Export to Code", desc: "Generate Terraform or CloudFormation scaffolding." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <span className="material-symbols-rounded text-sm">check</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                                            <p className="text-sm text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-300 rounded-2xl transform rotate-3 scale-105 opacity-20 blur-xl"></div>
                            <div className="bg-slate-900 rounded-xl p-2 shadow-2xl relative border border-slate-700">
                                <div className="bg-[#1e1e1e] rounded-lg p-6 aspect-[4/3] relative overflow-hidden grid grid-cols-6 grid-rows-6 gap-4">
                                    {/* Mock Diagram */}
                                    <div className="col-span-2 row-start-2 bg-slate-700 rounded border border-slate-500 p-2 text-center flex flex-col items-center justify-center">
                                        <span className="material-symbols-rounded text-white mb-1">dns</span>
                                        <span className="text-[8px] text-white">Load Balancer</span>
                                    </div>
                                    <div className="col-start-4 row-start-1 bg-slate-700 rounded border border-slate-500 p-2 text-center flex flex-col items-center justify-center">
                                        <span className="material-symbols-rounded text-white mb-1">developer_board</span>
                                        <span className="text-[8px] text-white">App Server 1</span>
                                    </div>
                                    <div className="col-start-4 row-start-3 bg-slate-700 rounded border border-slate-500 p-2 text-center flex flex-col items-center justify-center">
                                        <span className="material-symbols-rounded text-white mb-1">developer_board</span>
                                        <span className="text-[8px] text-white">App Server 2</span>
                                    </div>
                                    <div className="col-start-6 row-start-2 bg-slate-700 rounded border border-slate-500 p-2 text-center flex flex-col items-center justify-center">
                                        <span className="material-symbols-rounded text-white mb-1">storage</span>
                                        <span className="text-[8px] text-white">Main DB</span>
                                    </div>

                                    {/* Connector Lines (CSS drawn) */}
                                    <div className="absolute top-[35%] left-[33%] w-[16%] h-[2px] bg-white opacity-30 origin-left -rotate-[25deg]"></div>
                                    <div className="absolute top-[45%] left-[33%] w-[16%] h-[2px] bg-white opacity-30 origin-left rotate-[25deg]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">Deploy Your Potential.</h2>
                    <p className="text-slate-500 text-lg mb-8">Join thousands of developers leveling up their Data Structures and Algorithms skills.</p>
                    <button onClick={() => router.push("/practice/coding")} className="bg-green-600 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl shadow-green-600/30">
                        Start Coding Challenge
                    </button>
                    <p className="mt-6 text-xs text-green-300 font-mono   font-bold">No Local Setup Required • Browser Based</p>
                </div>
            </footer>
        </main>
    );
}
