"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

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
            setError("Access Denied: This portal is restricted to Enterprise Users only.");
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
                throw new Error(errData.detail || "Google Login failed");
            }

            const data = await res.json();
            login(data.access_token, data.role);
            router.push("/enterprise/dashboard");
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
                        router.push("/enterprise/dashboard");
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
                throw new Error(errData.detail || "Invalid credentials");
            }

            const data = await res.json();
            login(data.access_token, data.role);

            // Redirect to enterprise dashboard
            router.push("/enterprise/dashboard");

        } catch (err) {
            const error = err as Error;
            setError(error.message || "Invalid credentials");
        }
    };

    return (
        <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 ${plusJakartaSans.className}`}>
            {/* Loading Overlay for Microsoft Redirect */}
            <AnimatePresence>
                {msRedirecting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-indigo-600 shadow-xl"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                            className="mt-8 text-center"
                        >
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Verifying Account</h3>
                            <p className="text-sm text-slate-500 font-medium">Please wait while we connect to Microsoft Office 365...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
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
                        Manage your organization&apos;s talent pipeline, access advanced analytics, and streamline your recruitment process with our enterprise solutions.
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
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-slate-500" htmlFor="password">
                                    Password
                                </label>
                                <Link 
                                    href="/enterprise/forgot-password" 
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
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
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>Sign In to Dashboard</span>
                            <span className="material-icons-outlined">arrow_forward</span>
                        </button>
                    </form>

                    {(googleSsoEnabled || microsoftSsoEnabled) && (
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 max-w-[350px] mx-auto">
                        {googleSsoEnabled && (
                            <>
                                <button
                                    onClick={() => {
                                        const hiddenBtn = document.querySelector('#google-hidden-btn [role="button"]') as HTMLElement;
                                        if (hiddenBtn) hiddenBtn.click();
                                    }}
                                    type="button"
                                    className="w-full py-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-3 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    </svg>
                                    <span>Sign in with Google</span>
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
                                className="w-full py-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-3 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1H11V11H1V1Z" fill="#F25022"/>
                                    <path d="M12 1H22V11H12V1Z" fill="#7FBA00"/>
                                    <path d="M1 12H11V22H1V12Z" fill="#00A4EF"/>
                                    <path d="M12 12H22V22H12V12Z" fill="#FFB900"/>
                                </svg>
                                <span>Sign In with Office 365</span>
                            </button>
                        )}
                    </div>

                    {signupEnabled && (
                        <p className="text-center text-sm text-slate-500 mt-8">
                            Don't have an account?{" "}
                            <Link href="/enterprise/signup" className="text-indigo-600 font-bold hover:underline">
                                Create one now
                            </Link>
                        </p>
                    )}


                </div>
            </div>
        </div>
    );
}
