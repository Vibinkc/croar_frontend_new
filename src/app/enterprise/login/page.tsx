"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function EnterpriseLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold">Loading...</div>}>
            <EnterpriseLoginContent />
        </Suspense>
    );
}

function EnterpriseLoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const authError = searchParams.get("error");
        if (authError === "unauthorized") {
            setError("Access Denied: This portal is restricted to Enterprise Users only.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${BACKEND_URL}/api/v1/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Invalid credentials");
            }

            const data = await res.json();
            login(data.access_token, data.role);

            // Redirect to enterprise dashboard
            router.push("/enterprise/dashboard");

        } catch (err: any) {
            setError(err.message || "Invalid credentials");
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
                        <span className="material-icons-outlined text-4xl text-white">business_center</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-6">Enterprise Portal</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Manage your organization's talent pipeline, access advanced analytics, and streamine your recruitment process with our enterprise solutions.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your Recruiter account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500   mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 material-icons-outlined text-lg">email</span>
                                <input
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500   mb-2" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 material-icons-outlined text-lg">lock</span>
                                <input
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-icons-outlined text-lg">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-pulse">
                                <span className="material-icons-outlined text-red-500">error</span>
                                <span className="text-sm font-medium text-red-600">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>Sign In to Dashboard</span>
                            <span className="material-icons-outlined">arrow_forward</span>
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
}
