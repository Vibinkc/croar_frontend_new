"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function StudentRegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/student/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    password: password,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Registration failed");
            }

            router.push("/student/login?registered=true");
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950 ${plusJakartaSans.className}`}>
            <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
                <img
                    alt="Education"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-indigo-600/90 flex flex-col justify-center px-16">
                    <div className="max-w-md text-white">
                        <h2 className="text-4xl font-bold mb-6">Join Academik Student Portal</h2>
                        <ul className="space-y-4">
                            {[
                                "Access personalized learning paths",
                                "Track your progress in real-time",
                                "Prepare for corporate placements",
                                "AI-driven mock interviews"
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className="material-icons-outlined text-indigo-300">check_circle</span>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[50%] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="max-w-md w-full">
                    <div className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8">
                            <span className="material-icons-outlined text-sm">arrow_back</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
                        <p className="text-slate-500 dark:text-slate-400">Join the next generation of students.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                <input
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-600 outline-none transition-all"
                                    placeholder="Enter your full name"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                <input
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-600 outline-none transition-all"
                                    type="email"
                                    placeholder="your@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-600 outline-none transition-all"
                                        type="password"
                                        placeholder="Min. 8 chars"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-600 outline-none transition-all"
                                        type="password"
                                        placeholder="Repeat password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-lg flex items-center gap-2">
                                <span className="material-icons-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </button>

                        <div className="text-center pt-4">
                            <p className="text-sm text-slate-500">
                                Already have an account?{" "}
                                <Link href="/student/login" className="text-indigo-600 font-bold hover:underline">
                                    Login instead
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
