"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Input, Select, Field, Badge, CroarMark, cn } from "@/components/ds";
import { useI18n } from "@/context/I18nContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
}

interface OnboardingSection {
    id: string;
    title: string;
    fields: OnboardingField[];
}

interface OnboardingTemplate {
    form_config: {
        sections: OnboardingSection[];
    };
}

interface OnboardingData {
    candidate_email: string;
    company_name: string;
    company_logo?: string;
    onboarding_code: string;
    job_title: string;
    form_data?: Record<string, Record<string, unknown>>;
    template?: OnboardingTemplate;
    rejected_fields?: string[];
}

export default function CandidateOnboardingPage() {
    const { t } = useI18n();
    const params = useParams();
    const { token } = params;

    const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(0); // 0 = Verification, 1 = Welcome, 2+ = Dynamic
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState<Record<string, Record<string, unknown>>>({});
    const [formConfig, setFormConfig] = useState<{ sections: OnboardingSection[] }>({ sections: [] });

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
            setVerificationError(t("candidate.emailNoMatch"));
        }
    };

    const handleUpdate = (sectionId: string, fieldName: string, value: string | number | boolean) => {
        setFormData((prev: Record<string, Record<string, unknown>>) => ({
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
            <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-[#757575]">
                    <span className="animate-spin material-icons-outlined text-[#1976D2] text-4xl">progress_activity</span>
                    <span className="text-[13px] font-semibold">{t("candidate.loadingProfile")}</span>
                </div>
            </div>
        );
    }

    if (!onboarding) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-[4px] bg-[#FFEBEE] text-[#C62828] flex items-center justify-center mb-6">
                    <span className="material-icons-outlined text-3xl">link_off</span>
                </div>
                <h1 className="text-2xl font-extrabold text-[#212121] mb-2 tracking-[-0.3px]">{t("candidate.processNotFound")}</h1>
                <p className="text-[#757575] max-w-sm text-[14px]">{t("candidate.linkExpired")}</p>
            </div>
        );
    }

    const dynamicSections = formConfig.sections || [];
    const steps = [
        { id: "verify", name: t("candidate.verify"), icon: "verified_user" },
        { id: "welcome", name: t("candidate.welcome"), icon: "waving_hand" },
        ...dynamicSections.map((s: OnboardingSection) => ({
            id: s.id,
            name: s.title,
            icon: s.fields?.some((f: OnboardingField) => f.type === "file") ? "description" : "article"
        }))
    ];

    const currentStep = steps[step];
    const currentSection = dynamicSections.find((s: OnboardingSection) => s.id === currentStep?.id);

    const renderControl = (section: OnboardingSection, field: OnboardingField) => {
        const isRejected = onboarding.rejected_fields?.includes(field.name);
        const isCorrectionMode = (onboarding.rejected_fields?.length ?? 0) > 0;
        const isDisabled = isCorrectionMode && !isRejected;
        const rejectedRing = isRejected ? "border-[#E53935] focus:border-[#E53935] focus:ring-[#E53935]/15" : "";

        if (field.type === "select") {
            return (
                <div className="relative">
                    <Select
                        className={cn("pr-10 cursor-pointer", rejectedRing)}
                        value={(formData[section.id]?.[field.name] as string) || ""}
                        onChange={(e) => handleUpdate(section.id, field.name, e.target.value)}
                        required={field.required}
                        disabled={isDisabled}
                    >
                        <option value="">{t("candidate.selectField", { label: field.label })}</option>
                        {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </Select>
                    <span className="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] pointer-events-none text-[20px]">expand_more</span>
                </div>
            );
        }

        if (field.type === "file") {
            const fileUploaded = formData[section.id]?.[field.name];
            if (fileUploaded && !isRejected) {
                return (
                    <div className="flex items-center justify-between rounded-[4px] border border-[#CDEbe1] bg-[#E8F5E9] px-3.5 py-2.5">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-[4px] bg-[#2E7D32] text-white flex items-center justify-center">
                                <span className="material-icons-outlined text-[18px]">check</span>
                            </span>
                            <div className="flex flex-col leading-tight">
                                <span className="text-[13px] font-semibold text-[#0B6B56]">{t("candidate.fileUploaded")}</span>
                                <span className="text-[11px] text-[#2E7D32]">{t("candidate.readyForReview")}</span>
                            </div>
                        </div>
                        {!isDisabled && (
                            <button
                                onClick={() => handleUpdate(section.id, field.name, "")}
                                className="w-7 h-7 rounded-[4px] bg-white/60 text-[#2E7D32] flex items-center justify-center hover:bg-[#E53935] hover:text-white transition-colors"
                                aria-label={t("candidate.removeFile")}
                            >
                                <span className="material-icons-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>
                );
            }
            return (
                <div className="relative group">
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(section.id, field.name, e.target.files[0])}
                        disabled={isDisabled}
                    />
                    <div className={cn(
                        "w-full py-5 rounded-[4px] border border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
                        isRejected ? "bg-[#FFEBEE] border-[#EF9A9A]" : "bg-[#FAFAFA] border-[#D6DAE0]",
                        !isDisabled && "group-hover:border-[#1976D2] group-hover:bg-[#F3F2FD]"
                    )}>
                        <span className={cn("material-icons-outlined text-[22px]", isRejected ? "text-[#C62828]" : "text-[#9E9E9E]")}>
                            {isRejected ? "error" : "cloud_upload"}
                        </span>
                        <p className={cn("text-[12px] font-semibold", isRejected ? "text-[#C62828]" : "text-[#616161]")}>
                            {isDisabled ? t("candidate.fieldLocked") : isRejected ? t("candidate.uploadCorrectedFile") : t("candidate.clickToUpload")}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <Input
                type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                className={rejectedRing}
                placeholder={t("candidate.egField", { label: field.label })}
                value={(formData[section.id]?.[field.name] as string) || ""}
                onChange={(e) => handleUpdate(section.id, field.name, e.target.value)}
                required={field.required}
                disabled={isDisabled}
            />
        );
    };

    const renderDynamicSection = (section: OnboardingSection) => (
        <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-7"
        >
            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#1976D2] uppercase tracking-[0.14em]">
                    {t("candidate.sectionXofY", { current: step - 1, total: steps.length - 2 })}
                </span>
                <h3 className="text-[22px] font-extrabold text-[#212121] tracking-[-0.3px]">{section.title}</h3>
                {(onboarding.rejected_fields?.length ?? 0) > 0 && (
                    <Badge tone="warning" className="w-fit mt-1">
                        <span className="material-icons-outlined text-[14px]">info</span>
                        {t("candidate.someFieldsNeedCorrection")}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                {section.fields?.map((field: OnboardingField) => (
                    <Field key={field.name} label={field.label} required={field.required}>
                        {renderControl(section, field)}
                    </Field>
                ))}
            </div>

            <div className="pt-6 flex gap-3 border-t border-[#F5F6F8]">
                <Button variant="secondary" onClick={() => setStep(step - 1)} icon="arrow_back">
                    {t("candidate.back")}
                </Button>
                <Button
                    variant="primary"
                    className="flex-1"
                    onClick={submitSection}
                    disabled={isSubmitting}
                    trailingIcon={isSubmitting ? undefined : "arrow_forward"}
                >
                    {isSubmitting ? t("candidate.processing") : step === steps.length - 1 ? t("candidate.submitProfile") : t("candidate.saveAndContinue")}
                </Button>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-[#212121]">
            {/* Header */}
            <nav className="fixed top-0 left-0 right-0 bg-white/85 backdrop-blur-md border-b border-[#E0E0E0] z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {onboarding.company_logo ? (
                            <span className="w-9 h-9 rounded-[4px] overflow-hidden flex items-center justify-center bg-white border border-[#E0E0E0]">
                                <img src={onboarding.company_logo} alt={onboarding.company_name || "Company Logo"} className="w-full h-full object-contain" />
                            </span>
                        ) : (
                            <CroarMark size={36} />
                        )}
                        <div className="flex flex-col leading-tight">
                            <span className="text-[13px] font-extrabold text-[#212121] tracking-[-0.2px]">
                                {t("candidate.onboardingPortal", { company: onboarding.company_name || t("candidate.our") })}
                            </span>
                            <span className="text-[11px] font-semibold text-[#757575]">
                                {t("candidate.processLabel", { code: onboarding.onboarding_code })}
                            </span>
                        </div>
                    </div>
                    <Badge tone="indigo" dot className="hidden sm:inline-flex">{t("candidate.securePortal")}</Badge>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
                {/* Progress Indicators */}
                {!submitted && (
                    <div className="mb-10">
                        <div className="flex justify-between items-start relative">
                            {steps.map((s, idx) => {
                                const done = step > idx;
                                const active = step === idx;
                                return (
                                    <div key={s.id} className="flex flex-col items-center flex-1 z-10">
                                        <div className={cn(
                                            "w-9 h-9 rounded-[4px] flex items-center justify-center transition-all duration-500",
                                            done ? "bg-[#2E7D32] text-white shadow-[0_6px_16px_rgba(46,125,50,0.28)]" :
                                            active ? "bg-[#1976D2] text-white shadow-[0_6px_16px_rgba(25,118,210,0.28)] ring-4 ring-[#1976D2]/12" :
                                            "bg-white border border-[#E0E0E0] text-[#9E9E9E]"
                                        )}>
                                            <span className="material-icons-outlined text-[18px]">{done ? "check" : s.icon}</span>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold mt-2 text-center transition-colors duration-500",
                                            active ? "text-[#1976D2]" : done ? "text-[#2E7D32]" : "text-[#9E9E9E]"
                                        )}>
                                            {s.name}
                                        </span>
                                    </div>
                                );
                            })}
                            {/* Connector background */}
                            <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-[#E0E0E0] -z-0" />
                            {/* Active connector */}
                            <div
                                className="absolute top-[18px] left-0 h-[2px] bg-[#1976D2] transition-all duration-700 -z-0"
                                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                            <Card padding="lg" className="text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#2E7D32]" />
                                <div className="w-20 h-20 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto mb-7 mt-2">
                                    <span className="material-icons-outlined text-4xl">check_circle</span>
                                </div>
                                <h2 className="text-[26px] font-extrabold text-[#212121] mb-3 tracking-[-0.4px]">{t("candidate.onboardingSubmitted")}</h2>
                                <p className="text-[#616161] max-w-sm mx-auto leading-relaxed text-[14px]">
                                    {t("candidate.onboardingSubmittedDesc")}
                                </p>
                                <div className="mt-8 pt-6 border-t border-[#F5F6F8] flex flex-col items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-[0.12em]">{t("candidate.processReference")}</span>
                                    <Badge tone="indigo" className="text-[13px] px-3 py-1">{onboarding.onboarding_code}</Badge>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Card padding="lg" className="md:p-9">
                                {currentStep?.id === "verify" && (
                                    <div className="space-y-7">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center mx-auto mb-5">
                                                <span className="material-icons-outlined text-3xl">fingerprint</span>
                                            </div>
                                            <h2 className="text-[26px] font-extrabold text-[#212121] tracking-[-0.4px]">{t("candidate.identityVerification")}</h2>
                                            <p className="text-[#757575] text-[13px] font-semibold mt-1">{t("candidate.secureGatewayAccess")}</p>
                                        </div>

                                        <div className="rounded-[4px] bg-[#FAFAFA] border border-[#F5F6F8] p-5 space-y-3">
                                            <Field
                                                label={t("candidate.candidateEmailAddress")}
                                                htmlFor="candidate-verification-email"
                                                error={verificationError || undefined}
                                            >
                                                <Input
                                                    id="candidate-verification-email"
                                                    type="email"
                                                    icon="mail"
                                                    className={verificationError ? "border-[#E53935] focus:border-[#E53935] focus:ring-[#E53935]/15" : ""}
                                                    placeholder={t("candidate.enterRegisteredEmail")}
                                                    value={verificationEmail}
                                                    onChange={(e) => setVerificationEmail(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                                />
                                            </Field>
                                            <p className="text-[12px] text-[#757575] leading-relaxed">
                                                {t("candidate.verifyInstruction")}{" "}
                                                <span className="text-[#1976D2] font-semibold">{onboarding.job_title || t("candidate.yourRole")}</span>.
                                            </p>
                                        </div>

                                        <Button variant="dark" fullWidth size="lg" onClick={handleVerify} trailingIcon="arrow_forward"
                                            className="!bg-[#212121] hover:!bg-black !border-transparent">
                                            {t("candidate.verifyAndEnterPortal")}
                                        </Button>
                                    </div>
                                )}

                                {currentStep?.id === "welcome" && (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center mx-auto mb-6">
                                            <span className="material-icons-outlined text-3xl">celebration</span>
                                        </div>
                                        <h2 className="text-[30px] font-extrabold text-[#212121] tracking-[-0.6px] leading-none mb-3">{t("candidate.youreHired")}</h2>
                                        <Badge tone="indigo" className="text-[13px] px-3 py-1 mb-6">{onboarding.job_title || t("candidate.newRole")}</Badge>
                                        <p className="text-[#616161] mb-8 max-w-sm mx-auto leading-relaxed text-[14px]">
                                            {t("candidate.welcomeMessage")}
                                        </p>
                                        <Button variant="primary" fullWidth size="lg" onClick={() => setStep(step + 1)} trailingIcon="arrow_forward">
                                            {t("candidate.initiateOnboarding")}
                                        </Button>
                                    </div>
                                )}

                                {currentSection && renderDynamicSection(currentSection)}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-[11px] text-[#B4BAC2] mt-6 flex items-center justify-center gap-1.5">
                    <span className="material-icons-outlined text-[13px]">lock</span>
                    {t("candidate.securedBy")} Croar
                </p>
            </main>
        </div>
    );
}
