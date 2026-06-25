"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen transition-colors duration-300 bg-[#F4F5F7] text-[#15171C] ${hankenGrotesk.className}`}>
            <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
                <img
                    alt="Education"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-16" style={{ background: "linear-gradient(135deg,rgba(14,16,20,0.92),rgba(91,83,224,0.82))" }}>
                    <div className="max-w-md text-white">
                        <h2 className="text-[36px] font-extrabold tracking-[-0.8px] leading-[1.1] mb-6">Join Academik Student Portal</h2>
                        <ul className="space-y-3.5">
                            {[
                                "Access personalized learning paths",
                                "Track your progress in real-time",
                                "Prepare for corporate placements",
                                "AI-driven mock interviews"
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-[15px] text-white/85">
                                    <span className="material-icons-outlined text-[#A7A0EE]">check_circle</span>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[50%] flex flex-col items-center justify-center p-8 bg-[#F4F5F7]">
                <div className="max-w-md w-full bg-white border border-[#E8EAED] p-9 rounded-[14px] shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                    <div className="mb-7">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-[#8A929E] hover:text-[#5B53E0] transition-colors mb-7">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                            <span className="text-[12.5px] font-semibold">Back to Home</span>
                        </Link>
                        <h1 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#15171C] mb-1.5">Create account</h1>
                        <p className="text-[#8A929E] text-sm">Join the next generation of students.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Full name</label>
                                <input
                                    className="w-full h-11 px-3.5 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                    placeholder="Enter your full name"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Email address</label>
                                <input
                                    className="w-full h-11 px-3.5 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                    type="email"
                                    placeholder="your@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Password</label>
                                    <input
                                        className="w-full h-11 px-3.5 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                        type="password"
                                        placeholder="Min. 8 chars"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Confirm</label>
                                    <input
                                        className="w-full h-11 px-3.5 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
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
                            <div className="text-[#C0383C] text-[13px] font-medium bg-[#FDECEC] border border-[#EF4444]/20 p-3.5 rounded-[10px] flex items-center gap-2.5">
                                <span className="material-icons-outlined text-[#EF4444] text-[20px]">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "Creating account…" : "Create account"}
                        </button>

                        <div className="text-center pt-4">
                            <p className="text-sm text-[#8A929E]">
                                Already have an account?{" "}
                                <Link href="/student/login" className="text-[#5B53E0] font-semibold hover:underline">
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
