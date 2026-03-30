"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const [currentSlug, setCurrentSlug] = useState("");

    useEffect(() => {
        const rawSlug = localStorage.getItem('college_slug');
        if (rawSlug === 'nexus') {
            localStorage.setItem('college_slug', 'default');
            setCurrentSlug('default');
        } else {
            setCurrentSlug(rawSlug || 'default');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const slug = currentSlug;

            const res = await fetch(`${BACKEND_URL}/api/v1/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-College-Slug": slug
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await res.json();
            login(data.access_token, data.role);

            if (["ADMIN", "SUB_ADMIN", "STAFF"].includes(data.role)) {
                router.push("/admin/dashboard");
            } else {
                router.push("/practice");
            }
        } catch (err) {
            setError("Invalid email or password");
        }
    };



    return (
        <div className={`flex min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950 ${plusJakartaSans.className}`}>
            <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
                <img
                    alt="Modern workspace"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-[var(--color-primary)]/90 flex flex-col justify-center px-20">
                    <div className="max-w-lg">
                        <div className="w-16 h-1 w-24 bg-white/30 mb-8 rounded-full"></div>
                        <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
                            Unlock your potential, one skill at a time.
                        </h2>
                        <p className="text-white/80 text-lg font-light tracking-wide italic">
                            Join the community of learners and professionals.
                        </p>
                    </div>
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            </div>

            <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-white dark:bg-slate-950">
                <div className="max-w-md w-full">
                    {(!currentSlug || currentSlug === 'default') ? (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] text-center shadow-xl">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="material-icons-outlined text-3xl text-slate-600 dark:text-slate-400">domain_disabled</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">No College Selected</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                                You must first connect to your college ecosystem from our home page to gain access to your specialized portal.
                            </p>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-outlined text-sm">arrow_back</span>
                                Selection Portal
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10 text-center lg:text-left">
                                <div className="flex items-center justify-center lg:justify-start gap-3 mb-10">
                                    <div className="flex items-center gap-3">
                                        <img src="/Academik_logo.png" alt="Academik.ai" className="h-10 object-contain" />
                                        <span className="bg-slate-100 dark:bg-slate-900 text-[10px] font-black px-2 py-1 rounded-lg text-slate-500 tracking-widest border border-slate-200 dark:border-slate-800">BETA</span>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Secure access to {currentSlug ? <span className="text-slate-900 font-extrabold uppercase">{currentSlug}</span> : 'your'} portal
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="relative floating-label-input group">
                                        <input
                                            className="block w-full px-4 pt-6 pb-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-0 border-b-2 border-slate-200 dark:border-slate-800 focus:border-[var(--color-primary)] focus:ring-0 transition-all peer placeholder-transparent focus:placeholder-transparent"
                                            id="email"
                                            name="email"
                                            placeholder="Email Address"
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <label
                                            className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 duration-200 origin-[0]"
                                            htmlFor="email"
                                        >
                                            Email Address
                                        </label>
                                    </div>
                                    <div className="relative floating-label-input group">
                                        <input
                                            className="block w-full px-4 pt-6 pb-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-0 border-b-2 border-slate-200 dark:border-slate-800 focus:border-[var(--color-primary)] focus:ring-0 transition-all peer placeholder-transparent focus:placeholder-transparent"
                                            id="password"
                                            name="password"
                                            placeholder="Password"
                                            required
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <label
                                            className="absolute left-4 top-4 text-slate-500 dark:text-slate-400 duration-200 origin-[0]"
                                            htmlFor="password"
                                        >
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-xl">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-2">
                                        <span className="material-icons-outlined text-slate-500 text-lg">error_outline</span>
                                        <span className="text-xs font-bold text-slate-600">{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-extrabold uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Login Portal
                                    <span className="material-icons-outlined text-sm">login</span>
                                </button>

                                <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-900">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/")}
                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <span className="material-icons-outlined text-xs">sync_alt</span>
                                        Switch College Context
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
