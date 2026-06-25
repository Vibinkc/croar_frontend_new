"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Hanken_Grotesk } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

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
        <div className={`flex min-h-screen transition-colors duration-300 bg-[#F4F5F7] text-[#15171C] ${hankenGrotesk.className}`}>
            <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
                <img
                    alt="Modern workspace"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-20" style={{ background: "linear-gradient(135deg,rgba(14,16,20,0.92),rgba(91,83,224,0.82))" }}>
                    <div className="max-w-lg">
                        <div className="w-24 h-1 bg-white/30 mb-8 rounded-full"></div>
                        <h2 className="text-[44px] font-extrabold tracking-[-1px] text-white leading-[1.08] mb-5">
                            Unlock your potential, one skill at a time.
                        </h2>
                        <p className="text-white/75 text-[15px] leading-[1.6]">
                            Join the community of learners and professionals.
                        </p>
                    </div>
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            </div>

            <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-[#F4F5F7]">
                <div className="max-w-md w-full">
                    {(!currentSlug || currentSlug === 'default') ? (
                        <div className="bg-white border border-[#E8EAED] p-8 rounded-[14px] text-center shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                            <div className="w-16 h-16 bg-[#F4F5F7] border border-[#E8EAED] rounded-[14px] flex items-center justify-center mx-auto mb-6">
                                <span className="material-icons-outlined text-3xl text-[#8A929E]">domain_disabled</span>
                            </div>
                            <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-3">No College Selected</h2>
                            <p className="text-[#8A929E] text-sm mb-7 leading-relaxed">
                                You must first connect to your college ecosystem from our home page to gain access to your specialized portal.
                            </p>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                                {"Selection Portal"}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E8EAED] p-9 rounded-[14px] shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <img src="/Academik_logo.png" alt="Academik.ai" className="h-9 object-contain" />
                                    <span className="bg-[#F4F5F7] text-[10px] font-bold px-2 py-1 rounded-md text-[#8A929E] border border-[#E8EAED]">BETA</span>
                                </div>
                                <h1 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#15171C] mb-1.5">Welcome back</h1>
                                <p className="text-[#8A929E] text-sm">
                                    Secure access to {currentSlug ? <span className="text-[#15171C] font-bold">{currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1)}</span> : 'your'} portal
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5" htmlFor="email">Email address</label>
                                        <input
                                            className="block w-full h-11 px-3.5 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                            id="email"
                                            name="email"
                                            placeholder="name@college.edu"
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5" htmlFor="password">Password</label>
                                        <div className="relative">
                                            <input
                                                className="block w-full h-11 pl-3.5 pr-11 text-[14px] text-[#15171C] bg-white border border-[#E1E4E8] rounded-[10px] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                                id="password"
                                                name="password"
                                                placeholder="••••••••"
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
                                    <div className="p-3.5 rounded-[10px] bg-[#FDECEC] border border-[#EF4444]/20 flex items-center gap-2.5">
                                        <span className="material-icons-outlined text-[#EF4444] text-[20px]">error_outline</span>
                                        <span className="text-[13px] font-medium text-[#C0383C]">{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2"
                                >
                                    {"Login portal"}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                                </button>

                                <div className="text-center pt-6 border-t border-[#E8EAED]">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/")}
                                        className="text-[12.5px] font-semibold text-[#8A929E] hover:text-[#374151] transition-colors inline-flex items-center justify-center gap-1.5 mx-auto"
                                    >
                                        <span className="material-icons-outlined text-[15px]">sync_alt</span>
                                        {"Switch College Context"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
