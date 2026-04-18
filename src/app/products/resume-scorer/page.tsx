"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ResumeProductPage() {
    const router = useRouter();
    const [scanPosition, setScanPosition] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanPosition(prev => (prev >= 100 ? 0 : prev + 1));
        }, 30);
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
                    style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
                >
                    <div className="flex flex-col gap-4 max-w-3xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex mx-auto items-center gap-2 mb-2 border border-slate-600 bg-slate-800/50 px-3 py-1 rounded-full text-slate-300 text-xs font-bold   backdrop-blur-md"
                        >
                            <span className="material-symbols-rounded text-sm text-yellow-500">warning</span>
                            75% of Resumes are Rejected by Bots
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight"
                        >
                            BEAT THE <br /><span className="text-slate-500">ALGORITHM.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                        >
                            Don't let a machine decide your future. Our ATS Engine parses your resume exactly like a recruiter's software to find hidden red flags before they do.
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-4 relative z-10"
                    >
                        <button onClick={() => router.push("/practice/resume-scorer")} className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-slate-100 text-slate-900 text-lg font-bold hover:scale-105 transition-transform shadow-xl hover:bg-white flex gap-2">
                            <span className="material-symbols-rounded">upload_file</span> Upload Resume PDF
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Interactive Scanner Visual (Replacing simple grid for this one, or putting it below) */}
            {/* I'll put it in the "Deep Dive" slot actually, let's stick to template features first */}

            {/* 3. Features Mastery */}
            <section className="px-4 py-16" id="features">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-slate-500 font-bold   text-sm">ATS Optimization</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900">The Talent Scorecard</h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl">We grade your CV on 3 critical dimensions.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-4 bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-900 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 mb-2">
                                <span className="material-symbols-rounded text-4xl">score</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Quantitative Benchmarking</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">We compare your resume against 100,000+ successful applications. A score of 80+ puts you in the top 10%.</p>
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
                                <span className="material-symbols-rounded text-4xl">manage_search</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Keyword Gap Analysis</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Identify exactly which "Buzzwords" are missing from your profile compared to the Job Description.</p>
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
                                <span className="material-symbols-rounded text-4xl">design_services</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">Format Debugger</p>
                                <p className="text-slate-500 mt-2 leading-relaxed">Fix invisible layout issues, broken bullets, and unparsable fonts layouts.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Section (The Scanner Visual) */}
            <section className="px-4 py-16 bg-slate-900 rounded-3xl mx-4 text-white overflow-hidden relative">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full px-4 md:px-12">
                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white">The Black Hole.</h2>
                        <p className="text-lg text-slate-400">Applicant Tracking Systems (ATS) are ruthless. If your resume employs complex columns or graphics, it may be rendered unreadable.</p>
                        <div className="flex flex-col gap-4 mt-8">
                            <div className="text-xs font-bold text-slate-500  ">Compatible With</div>
                            <div className="flex flex-wrap gap-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                                <span className="font-black text-xl">WORKDAY</span>
                                <span className="font-black text-xl">TALEO</span>
                                <span className="font-black text-xl">GREENHOUSE</span>
                                <span className="font-black text-xl">LEVER</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Side: The Scanner */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[400px] flex items-center justify-center"
                    >
                        <div className="relative w-[300px] h-[400px] bg-white shadow-2xl transform rotate-2 text-slate-900 rounded-sm overflow-hidden border border-slate-300">
                            {/* Scanning Line */}
                            <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-20 shadow-[0_0_15px_rgba(59,130,246,0.8)]" style={{ top: `${scanPosition}%` }}></div>
                            <div className="absolute left-0 w-full bg-blue-500/10 z-10 transition-all duration-75" style={{ top: 0, height: `${scanPosition}%` }}></div>

                            <div className="p-6 space-y-4 opacity-80">
                                <div className="border-b-2 border-slate-800 pb-2 mb-4">
                                    <div className="h-4 w-3/4 bg-slate-800 mb-1"></div>
                                    <div className="h-2 w-1/2 bg-slate-400"></div>
                                </div>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-3 w-1/3 bg-slate-600 font-bold"></div>
                                        <div className="h-1.5 w-full bg-slate-200"></div>
                                        <div className="h-1.5 w-full bg-slate-200"></div>
                                    </div>
                                ))}
                                {scanPosition > 80 && (
                                    <div className="absolute bottom-10 inset-x-4 bg-red-600 text-white p-3 text-center font-bold text-xs shadow-xl animate-bounce rounded">
                                        ⚠ FORMATTING ERROR
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. Comparison (Match Rate) */}
            <section className="px-4 py-16" id="match-rate">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center text-slate-900">The "Match Rate" Algorithm</h2>
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative flex flex-col h-64">
                            <div className="text-xs font-bold text-slate-400   mb-4">Your Resume</div>
                            <div className="space-y-3 flex-1 opacity-50">
                                <div className="h-2 w-full bg-slate-200 rounded"></div>
                                <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                                <div className="mt-8 border-l-4 border-red-500 pl-4">
                                    <div className="text-xs font-bold text-red-500">MISSING KEYWORD</div>
                                    <div className="text-sm font-bold text-slate-900">"Leadership"</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 text-slate-300">
                            <span className="material-symbols-rounded text-4xl">compare_arrows</span>
                        </div>

                        <div className="w-full md:w-80 bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm relative flex flex-col h-64">
                            <div className="text-xs font-bold text-blue-400   mb-4">Job Description</div>
                            <div className="space-y-3 flex-1">
                                <div className="h-2 w-full bg-blue-100 rounded"></div>
                                <div className="mt-8 border-l-4 border-green-500 pl-4">
                                    <div className="text-xs font-bold text-green-600">REQUIRED SKILL</div>
                                    <div className="text-sm font-bold text-slate-900">"Leadership"</div>
                                    <div className="text-[10px] text-green-600 mt-1">High Priority</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Keyword Cloud (Dark Section) */}
            <section className="py-20 bg-slate-900 overflow-hidden text-center px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-white mb-8">Speak the Language</h2>
                    <p className="text-slate-400 mb-10 max-w-xl mx-auto">Recruiters use specific terminology. We help you speak it.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {["Python", "Project Management", "Stakeholder Management", "ROI Driven", "Cloud Computing", "Strategic Planning", "React", "Node.js", "Agile Methodology"].map((word, i) => (
                            <span key={i} className={`text-sm md:text-lg font-bold px-4 py-2 rounded-full border ${i % 2 === 0 ? 'border-slate-700 text-slate-500' : 'border-slate-600 text-slate-400'} hover:border-blue-500 hover:text-white hover:bg-blue-600 transition-all cursor-default`}>
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. New Section: Parsing Logic Deep Dive (Timeline/Process) */}
            <section className="py-24 bg-[#0B1120] text-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <h2 className="text-3xl font-black mb-6">How It Works.</h2>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                We reverse-engineered the most popular Applicant Tracking Systems (Workday, Taleo, Greenhouse). Our parser "reads" your resume exactly like a bot does.
                            </p>
                            <div className="space-y-8 relative">
                                <div className="absolute left-4 top-0 h-full w-px bg-slate-800"></div>
                                <div className="flex gap-6 relative">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold pb-0.5 shrink-0 z-10 border-4 border-[#0B1120]">1</div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">OCR & Text Extraction</h4>
                                        <p className="text-sm text-slate-500">Converts your PDF/Docx into raw text. Flags unreadable fonts or graphics.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 relative">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold pb-0.5 shrink-0 z-10 border-4 border-[#0B1120]">2</div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Entity Recognition</h4>
                                        <p className="text-sm text-slate-500">Identifies Names, Dates, Job Titles, and Skills using Named Entity Recognition (NER).</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 relative">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold pb-0.5 shrink-0 z-10 border-4 border-[#0B1120]">3</div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Semantic Matching</h4>
                                        <p className="text-sm text-slate-500">Compares extracted entities against the Job Description to calculate relevance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 font-mono text-xs text-green-400 overflow-hidden shadow-2xl">
                                <div className="opacity-50 mb-2"># PARSING LOG OUTPUT</div>
                                <div>{`{`}</div>
                                <div className="pl-4">"candidate_name": "Alex Johnson",</div>
                                <div className="pl-4">"education": [</div>
                                <div className="pl-8 text-white">{`{ "degree": "BS CS", "university": "MIT", "year": "2023" }`}</div>
                                <div className="pl-4">],</div>
                                <div className="pl-4">"skills_found": ["React", "Node.js", "AWS"],</div>
                                <div className="pl-4">"skills_missing": <span className="text-red-500">["Docker", "Kubernetes"]</span>,</div>
                                <div className="pl-4">"readability_score": 0.92</div>
                                <div>{`}`}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. New Section: Recruiter View (Split Contrast) */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">What You See vs. What They See</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-0 border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
                        <div className="bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200">
                            <div className="text-center font-bold text-slate-500 mb-6   text-xs">Your PDF View</div>
                            <div className="bg-white shadow-lg p-6 max-w-[300px] mx-auto min-h-[400px] text-[8px] text-slate-300 space-y-2">
                                <div className="w-full h-8 bg-slate-200"></div>
                                <div className="flex gap-2">
                                    <div className="w-1/3 h-32 bg-slate-100"></div>
                                    <div className="w-2/3 h-32 bg-slate-100"></div>
                                </div>
                                <div className="w-full h-24 bg-slate-100"></div>
                            </div>
                            <p className="text-center text-sm text-slate-500 mt-6 font-medium">"It looks so pretty!"</p>
                        </div>
                        <div className="bg-blue-50 p-8">
                            <div className="text-center font-bold text-blue-500 mb-6   text-xs">Recruiter's ATS View</div>
                            <div className="bg-white shadow-lg p-6 max-w-[300px] mx-auto min-h-[400px] text-xs font-mono">
                                <div className="border-b pb-2 mb-2 font-bold text-slate-900">Candidate ID: #9928</div>
                                <div className="space-y-1 text-slate-600">
                                    <div>Match: <span className="font-bold text-green-600">92%</span></div>
                                    <div>Exp: 4 Years</div>
                                    <div>Skill Match: 8/10</div>
                                </div>
                                <div className="mt-8 p-2 bg-red-50 text-red-600 border border-red-100 rounded text-[10px]">
                                    Unparsable Info: Sidebars dropped.
                                </div>
                            </div>
                            <p className="text-center text-sm text-blue-500 mt-6 font-medium">"Just the data, please."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="px-4 py-20 mt-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 mb-6">Don't Get Filtered Out.</h2>
                    <p className="text-slate-500 text-lg mb-8">Upload your resume now and get your match score in under 10 seconds.</p>
                    <button onClick={() => router.push("/practice/resume-scorer")} className="bg-slate-900 text-white font-bold py-5 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl">
                        Scan My Resume Free
                    </button>
                    <p className="mt-6 text-xs text-slate-400   font-bold">100% Secure • Private • No Sign-Up to Test</p>
                </div>
            </footer>
        </main>
    );
}
