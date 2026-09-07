"use client";

import { useState } from "react";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Roboto } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const hankenGrotesk = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });

export default function ForgotPasswordPage() {
    const { t: tr } = useI18n();
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
        <div className={`flex min-h-screen bg-[#F5F6F8] text-[#212121] ${hankenGrotesk.className}`}>
            {/* Left Side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center p-14"
                style={{
                    background: "#1E2A38",
                    backgroundImage:
                        "radial-gradient(900px 420px at 88% -30%,rgba(25,118,210,0.5),transparent 60%),radial-gradient(700px 400px at 0% 120%,rgba(66,165,245,0.25),transparent 60%)",
                }}
            >
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-12">
                        <div
                            className="w-11 h-11 rounded-[4px] flex items-center justify-center shadow-[0_6px_18px_rgba(25,118,210,0.45)]"
                            style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[20px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                            <span className="text-[11px] text-[#757575] mt-0.5">{tr("auth.hrCloud")}</span>
                        </div>
                    </div>
                    <h1 className="text-[40px] font-extrabold tracking-[-1.2px] leading-[1.05] text-white mb-5">{tr("auth.passwordRecovery")}</h1>
                    <p className="text-[15px] leading-[1.6] text-[#9E9E9E] max-w-[460px]">
                        Don&apos;t worry, it happens to the best of us. Enter your email address and we&apos;ll help you get back into your account in no time.
                    </p>
                </div>
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
                <div className="max-w-md w-full bg-white p-9 rounded-[4px] border border-[#E0E0E0] shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-[4px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <span className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121]">Croar</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#212121] mb-1.5">{tr("auth.forgotPassword")}</h2>
                        <p className="text-[#757575] text-sm">{tr("auth.enterEmailReset")}</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {message ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-3.5 rounded-[4px] mb-6 text-[13px] font-medium border ${
                                    message.type === "success"
                                    ? "bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20"
                                    : "bg-[#FFEBEE] text-[#C62828] border-[#E53935]/20"
                                }`}
                            >
                                {message.text}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[12.5px] font-semibold text-[#424242] mb-1.5" htmlFor="email">
                                {tr("general.emailAddress")}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] material-icons-outlined text-[19px]">email</span>
                                <input
                                    className="w-full h-11 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
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
                            className="w-full h-[46px] bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-[14.5px] rounded-[4px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{tr("auth.sendResetLink")}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-7 pt-7 border-t border-[#E0E0E0] text-center">
                        <Link
                            href="/enterprise/login"
                            className="text-[13px] font-semibold text-[#757575] hover:text-[#212121] transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                            <span>{tr("auth.backToLogin")}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
