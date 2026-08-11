"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Hanken_Grotesk } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

function LoginFallback() {
    const { t: tr } = useI18n();
    return <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center text-[#8A929E] font-semibold">{tr("auth.loading")}</div>;
}

export default function EnterpriseLoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <EnterpriseLoginContent />
        </Suspense>
    );
}

function EnterpriseLoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [signupEnabled, setSignupEnabled] = useState(true);
    const [googleSsoEnabled, setGoogleSsoEnabled] = useState(true);
    const [microsoftSsoEnabled, setMicrosoftSsoEnabled] = useState(true);
    const [msRedirecting, setMsRedirecting] = useState(false);

    useEffect(() => {
        // Force SSO buttons to be visible by default since we just configured them
        setGoogleSsoEnabled(true);
        setMicrosoftSsoEnabled(true);
        
        const checkStatus = async () => {
            try {
                const resSignup = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/signup_enabled`);
                if (resSignup.ok) {
                    const data = await resSignup.json();
                    setSignupEnabled(data.value !== false);
                }
                // Optional: We can still check, but we won't hide them if it fails
                const resGoogle = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/google_sso_enabled`);
                if (resGoogle.ok) {
                    const data = await resGoogle.json();
                    if (data.value === false) setGoogleSsoEnabled(false);
                }
                const resMs = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/microsoft_sso_enabled`);
                if (resMs.ok) {
                    const data = await resMs.json();
                    if (data.value === false) setMicrosoftSsoEnabled(false);
                }
            } catch (e) {
                console.error("Failed to check status", e);
            }
        };
        checkStatus();
    }, []);

    useEffect(() => {
        const authError = searchParams.get("error");
        if (authError === "unauthorized") {
            setError(tr("auth.accessDenied"));
        }
    }, [searchParams]);

    const handleGoogleCallback = async (response: any) => {
        setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/auth/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || tr("auth.googleLoginFailed"));
            }

            const data = await res.json();
            login(data.access_token, data.role);
            router.push(data.role === "EMPLOYEE" ? "/employee/dashboard" : "/enterprise/dashboard");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleMicrosoftLogin = async () => {
        setError("");
        try {
            const { loginWithMicrosoft } = await import("@/utils/microsoftAuth");
            await loginWithMicrosoft();
            // Window will redirect away from here
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        const checkMsRedirect = async () => {
            try {
                const { handleMicrosoftRedirect } = await import("@/utils/microsoftAuth");
                const token = await handleMicrosoftRedirect();
                if (token) {
                    setMsRedirecting(true);
                    const res = await fetch(`${BACKEND_URL}/api/v1/auth/microsoft-login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        login(data.access_token, data.role);
                        router.push(data.role === "EMPLOYEE" ? "/employee/dashboard" : "/enterprise/dashboard");
                    } else {
                        setMsRedirecting(false);
                    }
                }
            } catch (err) {
                console.error("MS Redirect Error:", err);
                setMsRedirecting(false);
            }
        };
        checkMsRedirect();
    }, []);

    useEffect(() => {
        // @ts-ignore
        if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            });
            
            const btnContainer = document.getElementById("google-login-button");
            if (btnContainer) {
                btnContainer.innerHTML = "";
                // @ts-ignore
                window.google.accounts.id.renderButton(
                    btnContainer,
                    { theme: "outline", size: "large", width: "350", shape: "rectangular" }
                );
            }
        }
    }, [signupEnabled]);

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
                throw new Error(errData.detail || tr("auth.invalidCredentials"));
            }

            const data = await res.json();
            login(data.access_token, data.role);

            // Redirect to enterprise dashboard
            router.push(data.role === "EMPLOYEE" ? "/employee/dashboard" : "/enterprise/dashboard");

        } catch (err) {
            const error = err as Error;
            setError(error.message || tr("auth.invalidCredentials"));
        }
    };

    return (
        <div className={`flex min-h-screen bg-[#F4F5F7] text-[#15171C] ${hankenGrotesk.className}`}>
            {/* Loading Overlay for Microsoft Redirect */}
            <AnimatePresence>
                {msRedirecting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F4F5F7]/95 backdrop-blur-xl"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full border-4 border-[#E8EAED] border-t-[#5B53E0]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-7 h-7" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1H11V11H1V1Z" fill="#F25022"/>
                                    <path d="M12 1H22V11H12V1Z" fill="#7FBA00"/>
                                    <path d="M1 12H11V22H1V12Z" fill="#00A4EF"/>
                                    <path d="M12 12H22V22H12V12Z" fill="#FFB900"/>
                                </svg>
                            </div>
                        </div>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-7 text-center"
                        >
                            <h3 className="text-lg font-extrabold text-[#15171C] tracking-[-0.3px]">{tr("auth.verifyingAccount")}</h3>
                            <p className="text-sm text-[#8A929E] mt-1">{tr("auth.connectingMicrosoft")}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center p-14"
                style={{
                    background: "#0E1014",
                    backgroundImage:
                        "radial-gradient(900px 420px at 88% -30%,rgba(91,83,224,0.5),transparent 60%),radial-gradient(700px 400px at 0% 120%,rgba(139,125,255,0.25),transparent 60%)",
                }}
            >
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-12">
                        <div
                            className="w-11 h-11 rounded-[12px] flex items-center justify-center shadow-[0_6px_18px_rgba(91,83,224,0.45)]"
                            style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[20px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                            <span className="text-[11px] text-[#8A929E] mt-0.5">{tr("auth.hrCloud")}</span>
                        </div>
                    </div>
                    <h1 className="text-[40px] font-extrabold tracking-[-1.2px] leading-[1.05] text-white mb-5">{tr("auth.hireSmarter")}</h1>
                    <p className="text-[15px] leading-[1.6] text-[#A8AEB8] max-w-[460px]">
                        {tr("auth.loginMarketing")}
                    </p>
                    <div className="flex gap-2.5 mt-8 flex-wrap">
                        {[tr("auth.tagAiSourcing"), tr("auth.tagAssessments"), tr("auth.tagAnalytics")].map((t) => (
                            <span key={t} className="text-[12px] font-semibold text-[#C7CCD4] bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-[20px]">{t}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
                <div className="max-w-md w-full bg-white p-9 rounded-[14px] border border-[#E8EAED] shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <span className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C]">Croar</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#15171C] mb-1.5">{tr("auth.welcomeBack")}</h2>
                        <p className="text-[#8A929E] text-sm">{tr("auth.signInSubtitle")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5" htmlFor="email">
                                {tr("auth.emailAddress")}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] material-icons-outlined text-[19px]">email</span>
                                <input
                                    className="w-full h-11 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] focus:outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                    id="email"
                                    type="email"
                                    placeholder={tr("auth.emailPlaceholder")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[12.5px] font-semibold text-[#374151]" htmlFor="password">
                                    {tr("auth.password")}
                                </label>
                                <Link
                                    href="/enterprise/forgot-password"
                                    className="text-[12.5px] font-semibold text-[#5B53E0] hover:text-[#4A43C9] transition-colors"
                                >
                                    {tr("auth.forgotPassword")}
                                </Link>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] material-icons-outlined text-[19px]">lock</span>
                                <input
                                    className="w-full h-11 pl-11 pr-11 bg-white border border-[#E1E4E8] rounded-[10px] text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] focus:outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
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
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] hover:text-[#374151] transition-colors"
                                >
                                    <span className="material-icons-outlined text-[19px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-[10px] bg-[#FDECEC] border border-[#EF4444]/20 flex items-center gap-2.5">
                                <span className="material-icons-outlined text-[#EF4444] text-[20px]">error</span>
                                <span className="text-[13px] font-medium text-[#C0383C]">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full h-[46px] bg-[#5B53E0] hover:bg-[#4A43C9] text-white font-bold text-[14.5px] rounded-[10px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2"
                        >
                            <span>{tr("auth.signInDashboard")}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </button>
                    </form>

                    {(googleSsoEnabled || microsoftSsoEnabled) && (
                        <div className="relative my-7">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#E8EAED]"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white px-4 text-[#9AA3AF] font-bold tracking-[0.1em]">{tr("auth.orContinueWith")}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 max-w-[350px] mx-auto">
                        {googleSsoEnabled && (
                            <>
                                <button
                                    onClick={() => {
                                        const hiddenBtn = document.querySelector('#google-hidden-btn [role="button"]') as HTMLElement;
                                        if (hiddenBtn) hiddenBtn.click();
                                    }}
                                    type="button"
                                    className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[10px] flex items-center justify-center gap-3 text-[#374151] font-semibold text-[14px] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    </svg>
                                    <span>{tr("auth.signInGoogle")}</span>
                                </button>
                                <div id="google-hidden-btn" className="hidden opacity-0 absolute pointer-events-none"></div>
                                <Script
                                    src="https://accounts.google.com/gsi/client"
                                    onLoad={() => {
                                        // @ts-ignore
                                        if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && googleSsoEnabled) {
                                            // @ts-ignore
                                            window.google.accounts.id.initialize({
                                                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                                                callback: handleGoogleCallback,
                                            });
                                            // @ts-ignore
                                            window.google.accounts.id.renderButton(
                                                document.getElementById("google-hidden-btn"),
                                                { theme: "outline", size: "large" }
                                            );
                                        }
                                    }}
                                />
                            </>
                        )}

                        {microsoftSsoEnabled && (
                            <button
                                onClick={handleMicrosoftLogin}
                                className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[10px] flex items-center justify-center gap-3 text-[#374151] font-semibold text-[14px] hover:bg-[#F4F5F7] transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1H11V11H1V1Z" fill="#F25022"/>
                                    <path d="M12 1H22V11H12V1Z" fill="#7FBA00"/>
                                    <path d="M1 12H11V22H1V12Z" fill="#00A4EF"/>
                                    <path d="M12 12H22V22H12V12Z" fill="#FFB900"/>
                                </svg>
                                <span>{tr("auth.signInOffice")}</span>
                            </button>
                        )}
                    </div>

                    {signupEnabled && (
                        <p className="text-center text-sm text-[#8A929E] mt-7">
                            {tr("auth.noAccount")}{" "}
                            <Link href="/enterprise/signup" className="text-[#5B53E0] font-semibold hover:underline">
                                {tr("auth.createOne")}
                            </Link>
                        </p>
                    )}


                </div>
            </div>
        </div>
    );
}
