"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Hanken_Grotesk } from "next/font/google";
import { BACKEND_URL, FRONTEND_DOMAIN } from "@/utils/api";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function SuperAdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
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
                throw new Error(errData.detail || "Invalid credentials");
            }

            const data = await res.json();

            if (data.role !== "SUPER_ADMIN") {
                throw new Error("Access Denied: Super Admin role required");
            }

            login(data.access_token, data.role);
            router.push("/super-admin");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen text-[#C7CCD4] ${hankenGrotesk.className}`} style={{ background: "#0E1014" }}>
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5B53E0]/15 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8B7DFF]/12 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-[#5B53E0]/10 blur-[80px] rounded-full"></div>
            </div>

            <div className="w-full flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-md w-full">
                    {/* Brand/Logo */}
                    <div className="text-center mb-10">
                        <div
                            className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] mb-6 shadow-[0_6px_18px_rgba(91,83,224,0.45)]"
                            style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <h1 className="text-[28px] font-extrabold tracking-[-0.6px] text-white mb-2">
                            {FRONTEND_DOMAIN.split('.').slice(0, 2).join('.')}.<span className="text-[#8B7DFF]">{FRONTEND_DOMAIN.split('.').slice(2).join('.')}</span>
                        </h1>
                        <p className="text-[#565E6B] text-[10px] font-bold uppercase tracking-[0.2em]">Institutional Platform Architecture</p>
                    </div>

                    {/* Login Card */}
                    <div className="border border-[#252A33] p-8 md:p-9 rounded-[14px] shadow-[0_14px_34px_rgba(0,0,0,0.4)]" style={{ background: "#1A1E25" }}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="super-admin-login-email" className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#565E6B] ml-0.5">Universal Identity</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-icons-outlined text-[18px] text-[#565E6B] group-focus-within:text-[#8B7DFF] transition-colors">alternate_email</span>
                                        </div>
                                        <input
                                            id="super-admin-login-email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-11 bg-[#0E1014] border border-[#252A33] pl-11 pr-4 rounded-[10px] text-sm text-white outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/30 transition-all placeholder:text-[#565E6B]"
                                            placeholder={`root@${FRONTEND_DOMAIN}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="super-admin-login-password" className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#565E6B] ml-0.5">Access Protocol</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-icons-outlined text-[18px] text-[#565E6B] group-focus-within:text-[#8B7DFF] transition-colors">lock</span>
                                        </div>
                                        <input
                                            id="super-admin-login-password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-11 bg-[#0E1014] border border-[#252A33] pl-11 pr-4 rounded-[10px] text-sm text-white outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/30 transition-all placeholder:text-[#565E6B]"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-[#EF4444]/10 border border-[#EF4444]/25 p-3.5 rounded-[10px] flex items-center gap-2.5 animate-shake">
                                    <span className="material-icons-outlined text-[#EF4444] text-[20px]">security_update_warning</span>
                                    <span className="text-[13px] font-semibold text-[#F08C8C]">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] disabled:opacity-50 text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {"Authenticating…"}
                                    </>
                                ) : (
                                    <>
                                        {"Establish Connection"}
                                        <span className="material-icons-outlined text-[18px]">vpn_key</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center">
                        <p className="text-[#565E6B] text-[10px] font-semibold uppercase tracking-[0.1em]">
                            Authorized Access Only. All operations are logged.
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
