"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setMessage({ 
                    type: "success", 
                    text: "If an account exists with this email, you will receive a password reset link shortly." 
                });
            } else {
                const data = await res.json();
                throw new Error(data.detail || "Something went wrong. Please try again.");
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 ${plusJakartaSans.className}`}>
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-50"></div>
                </div>

                <div className="relative z-10 max-w-lg text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <span className="material-icons-outlined text-4xl text-white">lock_reset</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-6">Password Recovery</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Don't worry, it happens to the best of us. Enter your email address and we'll help you get back into your account in no time.
                    </p>
                </div>
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your email to receive a reset link</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {message ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl mb-6 text-sm font-medium ${
                                    message.type === "success" 
                                    ? "bg-green-50 text-green-700 border border-green-100" 
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}
                            >
                                {message.text}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 material-icons-outlined text-lg">email</span>
                                <input
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Send Reset Link</span>
                                    <span className="material-icons-outlined text-lg">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link 
                            href="/enterprise/login" 
                            className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-icons-outlined text-lg">arrow_back</span>
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
