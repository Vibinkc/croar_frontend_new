"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus({ type: "error", text: "Invalid or missing reset token. Please request a new one." });
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus({ type: "error", text: "Passwords do not match." });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: password }),
            });

            if (res.ok) {
                setStatus({ type: "success", text: "Password reset successful! Redirecting to login..." });
                setTimeout(() => router.push("/enterprise/login"), 2500);
            } else {
                const data = await res.json();
                throw new Error(data.detail || "Failed to reset password.");
            }
        } catch (err: any) {
            setStatus({ type: "error", text: err.message });
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
                        <span className="material-icons-outlined text-4xl text-white">security</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-6">Secure Reset</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Setting a strong password is the first step in keeping your enterprise data secure. Use a mix of letters, numbers, and symbols.
                    </p>
                </div>
            </div>

            {/* Right Side - Reset Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Set New Password</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Please choose a strong password for your account</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {status ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl mb-6 text-sm font-medium ${
                                    status.type === "success" 
                                    ? "bg-green-50 text-green-700 border border-green-100" 
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}
                            >
                                {status.text}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="new-password" className="block text-xs font-bold text-slate-500 mb-2">New Password</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 material-icons-outlined text-lg">lock</span>
                                <input
                                    id="new-password"
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600"
                                >
                                    <span className="material-icons-outlined text-lg">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-500 mb-2">Confirm Password</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 material-icons-outlined text-lg">lock</span>
                                <input
                                    id="confirm-password"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !token}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Update Password</span>
                                    <span className="material-icons-outlined text-lg">check_circle</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
