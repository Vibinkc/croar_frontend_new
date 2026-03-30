"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

export default function CandidateOnboardingPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = params;

    const [onboarding, setOnboarding] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(0); // 0 = Verification, 1 = Welcome, 2+ = Dynamic
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState<any>({});
    const [formConfig, setFormConfig] = useState<any>({ sections: [] });
    
    // Verification State
    const [verificationEmail, setVerificationEmail] = useState("");
    const [verificationError, setVerificationError] = useState("");

    useEffect(() => {
        if (token) {
            fetchOnboardingDetails();
        }
    }, [token]);

    const fetchOnboardingDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/onboarding/${token}`);
            if (res.ok) {
                const data = await res.json();
                setOnboarding(data);
                setFormData(data.form_data || {});
                setFormConfig(data.template?.form_config || { sections: [] });
            }
        } catch (error) {
            console.error("Error fetching onboarding details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = () => {
        if (!onboarding) return;
        
        if (verificationEmail.toLowerCase().trim() === onboarding.candidate_email?.toLowerCase().trim()) {
            setStep(1);
            setVerificationError("");
        } else {
            setVerificationError("Email does not match our records. Please check and try again.");
        }
    };

    const handleUpdate = (sectionId: string, fieldName: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [fieldName]: value
            }
        }));
    };

    const handleFileUpload = async (sectionId: string, fieldName: string, file: File) => {
        setIsSubmitting(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/onboarding/${token}/upload-dynamic/${fieldName}`, {
                method: "POST",
                body: uploadFormData
            });

            if (res.ok) {
                const data = await res.json();
                handleUpdate(sectionId, fieldName, data.file_path);
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitSection = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/onboarding/${token}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ form_data: formData })
            });
            if (res.ok) {
                if (step < steps.length - 1) setStep(step + 1);
                else setSubmitted(true);
            }
        } catch (error) {
            console.error("Error submitting info:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin material-icons-outlined text-indigo-600 text-4xl">sync</div>
                    <span>Loading your profile...</span>
                </div>
            </div>
        );
    }

    if (!onboarding) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-black text-slate-900 mb-2">Process Not Found</h1>
                <p className="text-slate-500 max-w-sm mb-8">This link may have expired or is incorrect.</p>
            </div>
        );
    }

    const dynamicSections = formConfig.sections || [];
    const steps = [
        { id: "verify", name: "Verify", icon: "security" },
        { id: "welcome", name: "Welcome", icon: "wave" },
        ...dynamicSections.map((s: any) => ({
            id: s.id,
            name: s.title,
            icon: s.fields?.some((f: any) => f.type === "file") ? "description" : "article"
        }))
    ];

    const currentStep = steps[step];
    const currentSection = dynamicSections.find((s: any) => s.id === currentStep?.id);

    const renderDynamicSection = (section: any) => {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Section {step - 1} of {steps.length - 2}</span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {section.title}
                    </h3>
                    {onboarding.rejected_fields?.length > 0 && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-1 flex items-center gap-1">
                            <span className="material-icons-outlined text-xs">info</span>
                            Some fields in this section require correction.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {section.fields?.map((field: any) => (
                        <div key={field.name} className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                            </label>
                            
                            {(() => {
                                const isRejected = onboarding.rejected_fields?.includes(field.name);
                                const isCorrectionMode = onboarding.rejected_fields?.length > 0;
                                const isDisabled = isCorrectionMode && !isRejected;

                                if (field.type === "select") {
                                    return (
                                        <div className="relative">
                                            <select 
                                                className={`w-full bg-white border ${isRejected ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-700 font-bold text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400`}
                                                value={formData[section.id]?.[field.name] || ""}
                                                onChange={(e) => handleUpdate(section.id, field.name, e.target.value)}
                                                required={field.required}
                                                disabled={isDisabled}
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <span className="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                        </div>
                                    );
                                } else if (field.type === "file") {
                                    const fileUploaded = formData[section.id]?.[field.name];
                                    // Special case: if it's a file, we check the onboarding.documents for its status if applicable, 
                                    // but granular rejected_fields covers it too
                                    return (
                                        <div className="relative">
                                            {fileUploaded && !isRejected ? (
                                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between group transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                                                            <span className="material-icons-outlined text-sm">check</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-emerald-900 leading-none">File Uploaded</span>
                                                            <span className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">Verified</span>
                                                        </div>
                                                    </div>
                                                    {!isDisabled && (
                                                        <button 
                                                            onClick={() => handleUpdate(section.id, field.name, "")} 
                                                            className="w-7 h-7 rounded-lg bg-emerald-200/30 flex items-center justify-center text-emerald-700 hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            <span className="material-icons-outlined text-xs">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(section.id, field.name, e.target.files[0])}
                                                        disabled={isDisabled}
                                                    />
                                                    <div className={`w-full py-4 ${isRejected ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'} border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${!isDisabled && 'group-hover:bg-slate-100 group-hover:border-indigo-400 group-hover:ring-4 group-hover:ring-indigo-500/5'}`}>
                                                        <span className={`material-icons-outlined ${isRejected ? 'text-rose-500' : 'text-slate-400'} transition-colors text-lg`}>{isRejected ? 'error' : 'upload'}</span>
                                                        <p className={`text-[9px] font-black ${isRejected ? 'text-rose-600' : 'text-slate-500'} uppercase tracking-widest mt-1`}>
                                                            {isDisabled ? 'Field Locked' : isRejected ? 'Upload corrected file' : 'Click to upload file'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <input 
                                            type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} 
                                            className={`w-full bg-white border ${isRejected ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-700 font-bold text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400/70`}
                                            placeholder={`e.g. ${field.label}...`}
                                            value={formData[section.id]?.[field.name] || ""}
                                            onChange={(e) => handleUpdate(section.id, field.name, e.target.value)}
                                            required={field.required}
                                            disabled={isDisabled}
                                        />
                                    );
                                }
                            })()}
                        </div>
                    ))}
                </div>

                <div className="pt-8 flex gap-3 border-t border-slate-100">
                    <button 
                        onClick={() => setStep(step - 1)} 
                        className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Back
                    </button>
                    <button 
                        onClick={submitSection} 
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                    >
                        {isSubmitting ? "Processing..." : step === steps.length - 1 ? "Submit Profile" : "Save & Continue"}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
            {/* Header */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden">
                            {onboarding.company_logo ? (
                                <img src={onboarding.company_logo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                (onboarding.company_name?.[0] || "C").toUpperCase()
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {onboarding.company_name || "Our"} Onboarding Portal
                            </span>
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                {onboarding.company_name || "Our Company"} • Process: {onboarding.onboarding_code}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 pt-32 pb-20 relative">
                {/* Progress Indicators */}
                {!submitted && (
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4 relative">
                            {steps.map((s, idx) => (
                                <div key={s.id} className="flex flex-col items-center flex-1 z-10">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                                        step > idx ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : 
                                        step === idx ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10" : 
                                        "bg-white border border-slate-200 text-slate-400"
                                    }`}>
                                        <span className="material-icons-outlined text-base">
                                            {step > idx ? "check" : s.icon}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest mt-2 transition-colors duration-500 ${step === idx ? "text-indigo-600" : "text-slate-400"}`}>
                                        {s.name}
                                    </span>
                                </div>
                            ))}
                            {/* Connector Line Background */}
                            <div className="absolute top-4 left-0 right-0 h-[2px] bg-slate-200 -z-0"></div>
                            {/* Active Connector Line */}
                            <div 
                                className="absolute top-4 left-0 h-[2px] bg-indigo-500 transition-all duration-700 -z-0"
                                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-slate-200 rounded-[32px] p-12 text-center shadow-xl shadow-slate-200/40 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <span className="material-icons-outlined text-4xl font-bold">check_circle</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Onboarding Submitted</h2>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                                Thank you for completing your profile. Our recruitment and HR team will review your details and contact you via email for the next steps.
                            </p>
                            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Process Reference</span>
                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">{onboarding.onboarding_code}</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key={step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-xl shadow-slate-200/40 relative"
                        >
                            {currentStep?.id === "verify" && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <span className="material-icons-outlined text-4xl">fingerprint</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight uppercase">Identity Verification</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Secure Gateway Access</p>
                                    </div>
                                    
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Candidate Email Address</label>
                                            <input 
                                                type="email"
                                                className={`w-full bg-white border ${verificationError ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-700 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all`}
                                                placeholder="Enter your registered email..."
                                                value={verificationEmail}
                                                onChange={(e) => setVerificationEmail(e.target.value)}
                                            />
                                            {verificationError && (
                                                <p className="text-red-500 text-[10px] font-bold mt-1 px-1 flex items-center gap-1">
                                                    <span className="material-icons-outlined text-xs">error_outline</span>
                                                    {verificationError}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                            Please enter the email address used during your application to access the onboarding documents for <span className="text-indigo-600 font-bold">{onboarding.job_title}</span>.
                                        </p>
                                    </div>

                                    <button 
                                        onClick={handleVerify}
                                        className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
                                    >
                                        Verify & Enter Portal
                                    </button>
                                </div>
                            )}

                            {currentStep?.id === "welcome" && (
                                <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                                        <span className="material-icons-outlined text-4xl">waving_hand</span>
                                    </div>
                                    <div className="space-y-2 mb-10">
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Job Secured</h2>
                                        <div className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 italic">
                                            {onboarding.job_title}
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed text-sm">
                                        Congratulations on joining the team! We need a few more details to finalize your professional profile and digital workspace.
                                    </p>
                                    <button 
                                        onClick={() => setStep(step + 1)}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-200"
                                    >
                                        Initiate Onboarding
                                    </button>
                                </div>
                            )}

                            {currentSection && renderDynamicSection(currentSection)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
