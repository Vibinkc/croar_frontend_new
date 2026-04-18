"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BACKEND_URL, FRONTEND_DOMAIN } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

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
        } catch (err: any) {
            setError(err.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen bg-[#020617] text-slate-200 ${plusJakartaSans.className}`}>
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-purple-900/10 blur-[80px] rounded-full"></div>
            </div>

            <div className="w-full flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-md w-full">
                    {/* Brand/Logo */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl mb-6 shadow-2xl shadow-blue-500/10">
                            <span className="material-icons-outlined text-4xl text-blue-500">terminal</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter  mb-2">
                            {FRONTEND_DOMAIN.split('.').slice(0, 2).join('.')}.<span className="text-blue-600">{FRONTEND_DOMAIN.split('.').slice(2).join('.')}</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-black  tracking-[0.3em]">Institutional Platform Architecture</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500   ml-1">Universal Identity</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-icons-outlined text-sm text-slate-500 group-focus-within:text-blue-500 transition-colors">alternate_email</span>
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 p-4 pl-11 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                                            placeholder={`root@${FRONTEND_DOMAIN}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500   ml-1">Access Protocol</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="material-icons-outlined text-sm text-slate-500 group-focus-within:text-blue-500 transition-colors">lock</span>
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 p-4 pl-11 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                                    <span className="material-icons-outlined text-rose-500 text-lg">security_update_warning</span>
                                    <span className="text-xs font-bold text-rose-500">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black  text-xs  rounded-3xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Establish Connection
                                        <span className="material-icons-outlined text-sm">vpn_key</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-600 text-[10px] font-bold  ">
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
