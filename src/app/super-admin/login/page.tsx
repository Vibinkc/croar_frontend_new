"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter } from "next/navigation";
import { Roboto } from "next/font/google";
import { BACKEND_URL, FRONTEND_DOMAIN } from "@/utils/api";

const hankenGrotesk = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });

export default function SuperAdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useI18n();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${BACKEND_URL}/api/v1/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || t("superAdmin.invalidCredentials"));
            }

            const data = await res.json();

            if (data.role !== "SUPER_ADMIN") {
                throw new Error(t("superAdmin.accessDeniedSuperAdmin"));
            }

            login(data.access_token, data.role);
            router.push("/super-admin");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || t("superAdmin.invalidEmailOrPassword"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen text-[#BDBDBD] ${hankenGrotesk.className}`} style={{ background: "#1E2A38" }}>
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1976D2]/15 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#42A5F5]/12 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-[#1976D2]/10 blur-[80px] rounded-full"></div>
            </div>

            <div className="w-full flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-md w-full">
                    {/* Brand/Logo */}
                    <div className="text-center mb-10">
                        <div
                            className="inline-flex items-center justify-center w-14 h-14 rounded-[4px] mb-6 shadow-[0_6px_18px_rgba(25,118,210,0.45)]"
                            style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <h1 className="text-[28px] font-extrabold tracking-[-0.6px] text-white mb-2">
                            {FRONTEND_DOMAIN.split('.').slice(0, 2).join('.')}.<span className="text-[#42A5F5]">{FRONTEND_DOMAIN.split('.').slice(2).join('.')}</span>
                        </h1>
                        <p className="text-[#757575] text-[10px] font-bold uppercase tracking-[0.2em]">{t("superAdmin.institutionalPlatformArchitecture")}</p>
                    </div>

                    {/* Login Card */}
                    <div className="border border-[#252A33] p-8 md:p-9 rounded-[4px] shadow-[0_14px_34px_rgba(0,0,0,0.4)]" style={{ background: "#263A4B" }}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="super-admin-login-email" className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#757575] ml-0.5">{t("superAdmin.universalIdentity")}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <i className="mdi mdi-at text-[18px] text-[#757575] group-focus-within:text-[#42A5F5] transition-colors" />
                                        </div>
                                        <input
                                            id="super-admin-login-email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-11 bg-[#1E2A38] border border-[#252A33] pl-11 pr-4 rounded-[4px] text-sm text-white outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/30 transition-all placeholder:text-[#757575]"
                                            placeholder={`root@${FRONTEND_DOMAIN}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="super-admin-login-password" className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#757575] ml-0.5">{t("superAdmin.accessProtocol")}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <i className="mdi mdi-lock text-[18px] text-[#757575] group-focus-within:text-[#42A5F5] transition-colors" />
                                        </div>
                                        <input
                                            id="super-admin-login-password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-11 bg-[#1E2A38] border border-[#252A33] pl-11 pr-4 rounded-[4px] text-sm text-white outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/30 transition-all placeholder:text-[#757575]"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-[#E53935]/10 border border-[#E53935]/25 p-3.5 rounded-[4px] flex items-center gap-2.5 animate-shake">
                                    <i className="mdi mdi-shield-alert text-[#E53935] text-[20px]" />
                                    <span className="text-[13px] font-semibold text-[#F08C8C]">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[46px] bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-50 text-white font-bold text-[14.5px] rounded-[4px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {t("superAdmin.authenticating")}
                                    </>
                                ) : (
                                    <>
                                        {t("superAdmin.establishConnection")}
                                        <i className="mdi mdi-key text-[18px]" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center">
                        <p className="text-[#757575] text-[10px] font-semibold uppercase tracking-[0.1em]">
                            {t("superAdmin.authorizedAccessOnly")}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
