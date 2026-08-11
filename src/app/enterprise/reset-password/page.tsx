"use client";

import { useState, useEffect, Suspense } from "react";
import { useI18n } from "@/context/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Hanken_Grotesk } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function ResetPasswordPage() {
    const { t: tr } = useI18n();
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center text-[#8A929E] font-semibold">{tr("auth.loading")}</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const { t: tr } = useI18n();
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
            setStatus({ type: "error", text: tr("auth.invalidResetToken") });
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus({ type: "error", text: tr("auth.passwordsDoNotMatch") });
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
                setStatus({ type: "success", text: tr("auth.resetSuccessful") });
                setTimeout(() => router.push("/enterprise/login"), 2500);
            } else {
                const data = await res.json();
                throw new Error(data.detail || tr("auth.failedResetPassword"));
            }
        } catch (err: any) {
            setStatus({ type: "error", text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen bg-[#F4F5F7] text-[#15171C] ${hankenGrotesk.className}`}>
            {/* Left Side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center p-14"
                style={{
                    background: "#0E1014",
                    backgroundImage:
                        "radial-gradient(900px 420px at 88% -30%,rgba(91,83,224,0.5),transparent 60%),radial-gradient(700px 400px at 0% 120%,rgba(139,125,255,0.25),transparent 60%)",
                }}
            >
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-12">
                        <div
                            className="w-11 h-11 rounded-[12px] flex items-center justify-center shadow-[0_6px_18px_rgba(91,83,224,0.45)]"
                            style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[20px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                            <span className="text-[11px] text-[#8A929E] mt-0.5">{tr("auth.hrCloud")}</span>
                        </div>
                    </div>
                    <h1 className="text-[40px] font-extrabold tracking-[-1.2px] leading-[1.05] text-white mb-5">{tr("auth.secureReset")}</h1>
                    <p className="text-[15px] leading-[1.6] text-[#A8AEB8] max-w-[460px]">
                        {tr("auth.strongPasswordFirstStep")}
                    </p>
                </div>
            </div>

            {/* Right Side - Reset Password Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
                <div className="max-w-md w-full bg-white p-9 rounded-[14px] border border-[#E8EAED] shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <span className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C]">Croar</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#15171C] mb-1.5">{tr("auth.setNewPassword")}</h2>
                        <p className="text-[#8A929E] text-sm">{tr("auth.chooseStrongPassword")}</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {status ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-3.5 rounded-[10px] mb-6 text-[13px] font-medium border ${
                                    status.type === "success"
                                    ? "bg-[#E6F4EA] text-[#15803D] border-[#15803D]/20"
                                    : "bg-[#FDECEC] text-[#C0383C] border-[#EF4444]/20"
                                }`}
                            >
                                {status.text}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="new-password" className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">{tr("auth.newPassword")}</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] material-icons-outlined text-[19px]">lock</span>
                                <input
                                    id="new-password"
                                    className="w-full h-11 pl-11 pr-11 bg-white border border-[#E1E4E8] rounded-[10px] text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] focus:outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] hover:text-[#5B53E0] transition-colors"
                                >
                                    <span className="material-icons-outlined text-[19px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">{tr("auth.confirmPassword")}</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] material-icons-outlined text-[19px]">lock</span>
                                <input
                                    id="confirm-password"
                                    className="w-full h-11 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] focus:outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
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
                            className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{tr("auth.updatePassword")}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
