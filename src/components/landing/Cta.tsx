"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Cta() {
    return (
        <section className="py-24 relative overflow-hidden bg-slate-950">
            {/* Cosmic Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-black  tracking-[0.2em]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Limited Seats for Spring 2026
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                        Ready to Build the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">Future of You?</span>
                    </h2>

                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Join 10M+ students mastering coding, speech, and aptitude with Academik’s agentic AI mentor. Your dream career starts with a single click.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Link href="/contact" className="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-lg font-black   hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all w-full sm:w-auto text-center">
                            Contact Us
                        </Link>
                        <Link href="/about" className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl text-lg font-black   hover:bg-white/10 transition-all w-full sm:w-auto text-center">
                            Meet the Team
                        </Link>
                    </div>

                </motion.div>
            </div>
        </section>
    );
}
