"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

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
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen transition-colors duration-300 bg-[#F4F5F7] text-[#15171C] ${hankenGrotesk.className}`}>
            <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
                <img
                    alt="Student education"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-20" style={{ background: "linear-gradient(135deg,rgba(14,16,20,0.92),rgba(91,83,224,0.82))" }}>
                    <div className="max-w-lg">
                        <div className="w-24 h-1 bg-white/30 mb-8 rounded-full"></div>
                        <h2 className="text-[44px] font-extrabold tracking-[-1px] text-white leading-[1.08] mb-5">
                            Start your learning journey today.
                        </h2>
                        <p className="text-white/75 text-[15px] leading-[1.6]">
                            Dedicated portal for students to excel and grow.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-[#F4F5F7]">
                <div className="max-w-md w-full bg-white border border-[#E8EAED] p-9 rounded-[14px] shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/Academik_logo.png" alt="Academik.ai" className="h-9 object-contain" />
                            <span className="bg-[#ECEBFB] text-[10px] font-bold px-2 py-1 rounded-md text-[#5B53E0] border border-[#DAD7F6]">STUDENT</span>
                        </div>
                        <h1 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#15171C] mb-1.5">Student login</h1>
                        <p className="text-[#8A929E] text-sm">
                            Access your personalized student dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5" htmlFor="email">
                                    Student email
                                </label>
                                <input
                                    className="block w-full h-11 px-3.5 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                    id="email"
                                    placeholder="Enter your email"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        className="block w-full h-11 pl-3.5 pr-11 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
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
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] hover:text-[#374151] transition-colors"
                                    >
                                        <span className="material-icons-outlined text-[19px]">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-[10px] bg-[#FDECEC] border border-[#EF4444]/20 flex items-center gap-2.5 text-[#C0383C]">
                                <span className="material-icons-outlined text-[#EF4444] text-[20px]">error_outline</span>
                                <span className="text-[13px] font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] disabled:opacity-50 text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Signing in…" : "Login to dashboard"}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </button>

                        <div className="text-center pt-5">
                            <p className="text-sm text-[#8A929E]">
                                Don&apos;t have a student account?{" "}
                                <Link href="/student/register" className="text-[#5B53E0] font-semibold hover:underline">
                                    Register now
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
