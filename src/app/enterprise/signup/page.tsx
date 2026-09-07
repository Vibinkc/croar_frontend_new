"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Roboto } from "next/font/google";
import { BACKEND_URL } from "@/utils/api";
import Link from "next/link";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { motion, AnimatePresence } from "framer-motion";

const hankenGrotesk = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });

export default function EnterpriseSignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [companyName, setCompanyName] = useState("");
    
    const router = useRouter();
    const { login } = useAuth();
    const { t: tr } = useI18n();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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
                throw new Error(errData.detail || tr("auth.googleSignupFailed"));
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
        } catch (err: any) {
            setError(err.message);
        }
    };

    const [signupEnabled, setSignupEnabled] = useState<boolean | null>(null);
    const [googleSsoEnabled, setGoogleSsoEnabled] = useState(true);
    const [microsoftSsoEnabled, setMicrosoftSsoEnabled] = useState(true);
    const [msRedirecting, setMsRedirecting] = useState(false);

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
        const checkStatus = async () => {
            try {
                // Check Signup
                const resSignup = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/signup_enabled`);
                if (resSignup.ok) {
                    const data = await resSignup.json();
                    setSignupEnabled(data.value !== false);
                } else {
                    setSignupEnabled(true);
                }

                // Check Google SSO
                const resGoogle = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/google_sso_enabled`);
                if (resGoogle.ok) {
                    const data = await resGoogle.json();
                    setGoogleSsoEnabled(data.value !== false);
                }

                // Check Microsoft SSO
                const resMs = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/microsoft_sso_enabled`);
                if (resMs.ok) {
                    const data = await resMs.json();
                    setMicrosoftSsoEnabled(data.value !== false);
                }
            } catch (e) {
                setSignupEnabled(true);
            }
        };
        checkStatus();
    }, []);

    useEffect(() => {
        // @ts-ignore
        if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && signupEnabled && googleSsoEnabled) {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            });
            // @ts-ignore
            window.google.accounts.id.renderButton(
                document.getElementById("google-signup-button"),
                { theme: "outline", size: "large", width: "100%", text: "signup_with", shape: "pill" }
            );
        }
    }, [signupEnabled, googleSsoEnabled]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    company_name: companyName
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || tr("auth.signupFailed"));
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/enterprise/login");
            }, 2000);

        } catch (err) {
            const error = err as Error;
            setError(error.message || tr("auth.somethingWrong"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex min-h-screen bg-[#F5F6F8] text-[#212121] ${hankenGrotesk.className}`}>
            {/* Loading Overlay for Microsoft Redirect */}
            <AnimatePresence>
                {msRedirecting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F5F6F8]/95 backdrop-blur-xl"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full border-4 border-[#E0E0E0] border-t-[#1976D2]"
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
                            <h3 className="text-lg font-extrabold text-[#212121] tracking-[-0.3px]">{tr("auth.verifyingAccount")}</h3>
                            <p className="text-sm text-[#757575] mt-1">{tr("auth.connectingMicrosoft")}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center p-14"
                style={{
                    background: "#1E2A38",
                    backgroundImage:
                        "radial-gradient(900px 420px at 88% -30%,rgba(25,118,210,0.5),transparent 60%),radial-gradient(700px 400px at 0% 120%,rgba(66,165,245,0.25),transparent 60%)",
                }}
            >
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-12">
                        <div
                            className="w-11 h-11 rounded-[4px] flex items-center justify-center shadow-[0_6px_18px_rgba(25,118,210,0.45)]"
                            style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[20px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                            <span className="text-[11px] text-[#757575] mt-0.5">{tr("auth.hrCloud")}</span>
                        </div>
                    </div>
                    <h1 className="text-[40px] font-extrabold tracking-[-1.2px] leading-[1.05] text-white mb-5">{tr("auth.joinEnterprise")}</h1>
                    <p className="text-[15px] leading-[1.6] text-[#9E9E9E] max-w-[460px]">
                        {tr("auth.signupMarketing")}
                    </p>
                    <div className="flex gap-2.5 mt-8 flex-wrap">
                        {[tr("auth.tagTeams"), tr("auth.tagAssessments"), tr("auth.tagWorkflows")].map((t) => (
                            <span key={t} className="text-[12px] font-semibold text-[#BDBDBD] bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-[4px]">{t}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
                <div className="max-w-md w-full bg-white p-9 rounded-[4px] border border-[#E0E0E0] shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-[4px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z"/></svg>
                        </div>
                        <span className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121]">Croar</span>
                    </div>

                    {signupEnabled === null ? (
                        <div className="text-center py-20">
                            <div className="w-10 h-10 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-[#757575] font-semibold">{tr("auth.verifyingSystem")}</p>
                        </div>
                    ) : signupEnabled === false ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-[#FFEBEE] text-[#E53935] rounded-[4px] flex items-center justify-center mx-auto mb-6">
                                <span className="material-icons-outlined text-3xl">block</span>
                            </div>
                            <h3 className="text-[24px] font-extrabold text-[#212121] mb-3 tracking-[-0.4px]">{tr("auth.registrationClosed")}</h3>
                            <p className="text-[#757575] text-sm leading-relaxed mb-8">
                                {tr("auth.registrationClosedDesc")}
                            </p>
                            <Link
                                href="/enterprise/login"
                                className="inline-flex items-center justify-center h-[46px] px-7 bg-[#1976D2] text-white font-bold text-[14.5px] rounded-[4px] hover:bg-[#1565C0] transition-colors shadow-[0_6px_16px_rgba(25,118,210,0.28)]"
                            >
                                {tr("auth.backToLogin")}
                            </Link>
                        </div>
                    ) : success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-outlined text-3xl">check_circle</span>
                            </div>
                            <h3 className="text-[20px] font-extrabold text-[#212121] tracking-[-0.3px] mb-2">{tr("auth.accountCreated")}</h3>
                            <p className="text-[#757575]">{tr("auth.redirectingLogin")}</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-7">
                                <h2 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#212121] mb-1.5">{tr("auth.createAccount")}</h2>
                                <p className="text-[#757575] text-sm">{tr("auth.setupOrg")}</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="first-name" className="block text-[12.5px] font-semibold text-[#424242] mb-1.5">{tr("auth.firstName")}</label>
                                    <input
                                        id="first-name"
                                        className="w-full h-11 px-3.5 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                        type="text"
                                        placeholder={tr("auth.firstNamePlaceholder")}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="last-name" className="block text-[12.5px] font-semibold text-[#424242] mb-1.5">{tr("auth.lastName")}</label>
                                    <input
                                        id="last-name"
                                        className="w-full h-11 px-3.5 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                        type="text"
                                        placeholder={tr("auth.lastNamePlaceholder")}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="company-name" className="block text-[12.5px] font-semibold text-[#424242] mb-1.5">{tr("auth.companyName")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] material-icons-outlined text-[19px]">corporate_fare</span>
                                    <input
                                        id="company-name"
                                        className="w-full h-11 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                        type="text"
                                        placeholder={tr("auth.companyNamePlaceholder")}
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="work-email" className="block text-[12.5px] font-semibold text-[#424242] mb-1.5">{tr("auth.workEmail")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] material-icons-outlined text-[19px]">email</span>
                                    <input
                                        id="work-email"
                                        className="w-full h-11 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                        type="email"
                                        placeholder={tr("auth.workEmailPlaceholder")}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-[12.5px] font-semibold text-[#424242] mb-1.5">{tr("auth.password")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] material-icons-outlined text-[19px]">lock</span>
                                    <input
                                        id="password"
                                        className="w-full h-11 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3.5 rounded-[4px] bg-[#FFEBEE] border border-[#E53935]/20 flex items-center gap-2.5">
                                    <span className="material-icons-outlined text-[#E53935] text-[20px]">error</span>
                                    <span className="text-[13px] font-medium text-[#C62828]">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-[46px] bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-50 text-white font-bold text-[14.5px] rounded-[4px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors flex items-center justify-center gap-2 mt-1"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>{tr("auth.createOrgAccount")}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-sm text-[#757575] mt-5">
                                {tr("auth.haveAccount")}{" "}
                                <Link href="/enterprise/login" className="text-[#1976D2] font-semibold hover:underline">
                                    {tr("auth.signIn")}
                                </Link>
                            </p>
                        </form>

                        {(googleSsoEnabled || microsoftSsoEnabled) && (
                            <div className="relative my-7">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#E0E0E0]"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-white px-4 text-[#9E9E9E] font-bold tracking-[0.1em]">{tr("auth.orContinueWith")}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 max-w-[350px] mx-auto">
                            {googleSsoEnabled && (
                                <>
                                    <button
                                        onClick={() => {
                                            const hiddenBtn = document.querySelector('#google-hidden-signup-btn [role="button"]') as HTMLElement;
                                            if (hiddenBtn) hiddenBtn.click();
                                        }}
                                        type="button"
                                        className="w-full h-11 bg-white border border-[#E0E0E0] rounded-[4px] flex items-center justify-center gap-3 text-[#424242] font-semibold text-[14px] hover:bg-[#F5F6F8] transition-colors"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                        </svg>
                                        <span>{tr("auth.signUpGoogle")}</span>
                                    </button>
                                    <div id="google-hidden-signup-btn" className="hidden opacity-0 absolute pointer-events-none"></div>
                                    <Script 
                                        src="https://accounts.google.com/gsi/client" 
                                        onLoad={() => {
                                            // @ts-ignore
                                            if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && signupEnabled && googleSsoEnabled) {
                                                // @ts-ignore
                                                window.google.accounts.id.initialize({
                                                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                                                    callback: handleGoogleCallback,
                                                });
                                                // @ts-ignore
                                                window.google.accounts.id.renderButton(
                                                    document.getElementById("google-hidden-signup-btn"),
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
                                    type="button"
                                    className="w-full h-11 bg-white border border-[#E0E0E0] rounded-[4px] flex items-center justify-center gap-3 text-[#424242] font-semibold text-[14px] hover:bg-[#F5F6F8] transition-colors"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1H11V11H1V1Z" fill="#F25022"/>
                                        <path d="M12 1H22V11H12V1Z" fill="#7FBA00"/>
                                        <path d="M1 12H11V22H1V12Z" fill="#00A4EF"/>
                                        <path d="M12 12H22V22H12V12Z" fill="#FFB900"/>
                                    </svg>
                                    <span>{tr("auth.signUpOffice")}</span>
                                </button>
                            )}
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
