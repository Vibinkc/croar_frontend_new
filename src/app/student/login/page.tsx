"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function StudentLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Placeholder for student login logic
            // In a real scenario, this would call a student-specific login endpoint
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${BACKEND_URL}/api/v1/student/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Invalid credentials");
            }

            const data = await res.json();
            // Assuming we use a similar token/role structure
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", "STUDENT");

            router.push("/student/dashboard");
        } catch (err: any) {
            setError(err.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950 ${plusJakartaSans.className}`}>
            <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
                <img
                    alt="Student education"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-indigo-600/90 flex flex-col justify-center px-20">
                    <div className="max-w-lg">
                        <div className="w-16 h-1 w-24 bg-white/30 mb-8 rounded-full"></div>
                        <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
                            Start your learning journey today.
                        </h2>
                        <p className="text-white/80 text-lg font-light tracking-wide italic">
                            Dedicated portal for students to excel and grow.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-white dark:bg-slate-950">
                <div className="max-w-md w-full">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-10">
                            <img src="/Academik_logo.png" alt="Academik.ai" className="h-10 object-contain" />
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black px-2 py-1 rounded-lg text-indigo-500 tracking-widest border border-indigo-100 dark:border-indigo-800">STUDENT</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Student Login</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Access your personalized student dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
                                    Student Email
                                </label>
                                <input
                                    className="block w-full px-4 py-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all outline-none"
                                    id="email"
                                    placeholder="Enter your email"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        className="block w-full px-4 py-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all outline-none"
                                        id="password"
                                        placeholder="Enter your password"
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <span className="material-icons-outlined text-xl">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600">
                                <span className="material-icons-outlined text-lg">error_outline</span>
                                <span className="text-xs font-bold">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Signing in..." : "Login to Dashboard"}
                            <span className="material-icons-outlined text-sm">login</span>
                        </button>

                        <div className="text-center pt-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Don't have a student account?{" "}
                                <Link href="/student/register" className="text-indigo-600 font-bold hover:underline">
                                    Register Now
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
