"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

interface ApplicationField {
    id: string;
    label: string;
    type: string;
    icon: string;
    is_required: boolean;
}

interface PublicJob {
    id: string;
    title: string;
    description: string;
    job_type?: string;
    work_mode?: string;
    location?: string;
    experience_min?: number;
    experience_max?: string | number;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_frequency?: string;
    required_skills?: string[];
    application_fields?: ApplicationField[];
}

interface Organization {
    name: string;
    logo_url?: string;
}

export default function PublicJobPage() {
    const { t } = useI18n();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id } = params;
    const prefilledEmail = searchParams.get('email');

    const [job, setJob] = useState<PublicJob | null>(null);
    const [orgName, setOrgName] = useState<string | Organization>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applied, setApplied] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    // Authoritative schema.org/JobPosting markup from the backend (correct country + remote
    // handling, consistent with the Indeed feed). Falls back to the locally-built object.
    const [jsonLdStr, setJsonLdStr] = useState<string | null>(null);

    // A field is a phone field if its type is 'phone' or its label/key references phone/mobile/tel.
    const isPhoneField = (field: ApplicationField, fieldKey: string) => {
        if (field.type === 'phone') return true;
        const hay = `${field.label} ${fieldKey}`.toLowerCase();
        return /phone|mobile|tel/.test(hay);
    };

    // Plausible phone: only digits, leading '+', spaces, dashes, parentheses; 7–15 digits total.
    const isValidPhone = (value: string) => {
        if (!/^[+\d\s\-()]+$/.test(value)) return false;
        const digits = value.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
    };

    useEffect(() => {
        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    // Pull the backend's canonical schema.org JobPosting markup (correct country handling).
    useEffect(() => {
        if (!id) return;
        const baseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
        fetch(`${baseUrl}/api/v1/jobs/${id}/jobposting.jsonld`)
            .then((r) => (r.ok ? r.text() : null))
            .then((txt) => txt && setJsonLdStr(txt))
            .catch(() => {});
    }, [id]);

    const fetchJobDetails = async () => {
        setIsLoading(true);
        try {
            // Ensure BACKEND_URL doesn't end with slash if path starts with it
            const baseUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
            const res = await fetch(`${baseUrl}/api/v1/enterprise/public/jobs/${id}`, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.ok) {
                const data = await res.json();
                setJob(data.job);
                setOrgName(data.organization);
                setIsOpen(data.is_open !== false);

                // Initialize boolean fields and pre-fill email
                const initialData: Record<string, string> = {};
                data.job.application_fields?.forEach((f: ApplicationField) => {
                    const key = f.label.toLowerCase().replace(/\s+/g, '_');
                    if (f.type === 'boolean') {
                        initialData[key] = "No";
                    }
                    if (prefilledEmail && (f.type === 'email' || key === 'email_address' || key === 'email')) {
                        initialData[key] = prefilledEmail;
                    }
                });

                // Fallback for default email field if not in application_fields
                if (prefilledEmail && !Object.values(initialData).includes(prefilledEmail)) {
                    initialData['email_address'] = prefilledEmail;
                }

                setFormData(initialData);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate phone fields before submitting.
        const phoneErrors: Record<string, string> = {};
        const fieldsToCheck = (job?.application_fields && job.application_fields.length > 0)
            ? job.application_fields
            : [];
        fieldsToCheck.forEach((field) => {
            const fieldKey = field.label.toLowerCase().replace(/\s+/g, '_');
            if (!isPhoneField(field, fieldKey)) return;
            const value = (formData[fieldKey] || "").trim();
            if (!value) {
                if (field.is_required) phoneErrors[fieldKey] = t("candidate.phoneRequired");
                return;
            }
            if (!isValidPhone(value)) {
                phoneErrors[fieldKey] = t("candidate.phoneInvalid");
            }
        });
        if (Object.keys(phoneErrors).length > 0) {
            setFieldErrors(phoneErrors);
            return;
        }
        setFieldErrors({});

        setIsSubmitting(true);
        try {
            const data = new FormData();

            // Add dynamic fields
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            if (resumeFile && job) {
                // Find if there is a file field in application_fields
                const fileField = job.application_fields?.find((f: ApplicationField) => f.type === 'file');
                const fieldName = fileField ? fileField.label.toLowerCase().replace(/\s+/g, '_') : 'resume';
                data.append(fieldName, resumeFile);
            }

            // Capture and add source tracking
            const urlSource = searchParams.get('source');
            if (urlSource) {
                data.append("source", urlSource);
            }

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/jobs/${id}/apply`, {
                method: "POST",
                body: data
            });
            if (res.ok) {
                setApplied(true);
            } else {
                let msg = t("candidate.failedToSubmit");
                try {
                    const errData = await res.json();
                    if (errData?.detail) msg = errData.detail;
                } catch { /* ignore */ }
                // Job was closed after the page loaded — reflect it in the UI.
                if (res.status === 409) setIsOpen(false);
                alert(msg);
            }
        } catch (error) {
            console.error("Error applying:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
                <div className="w-8 h-8 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-white border border-[#E0E0E0] rounded-[4px] flex items-center justify-center mb-6 text-[#BDBDBD]">
                    <i className="mdi mdi-magnify-close text-3xl" />
                </div>
                <h1 className="text-[24px] font-extrabold tracking-[-0.4px] text-[#212121] mb-2">{t("candidate.jobNotFound")}</h1>
                <p className="text-[#757575] max-w-sm mb-7">{t("candidate.jobNotFoundDesc")}</p>
                <button
                    onClick={() => router.push("/")}
                    className="bg-[#1976D2] hover:bg-[#1565C0] text-white px-6 h-[46px] rounded-[4px] font-semibold text-[14px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors"
                >
                    {t("candidate.backToHomepage")}
                </button>
            </div>
        );
    }

    const getIcon = (iconName: string) => {
        if (!iconName) return 'edit';
        const lower = iconName.toLowerCase();
        const map: Record<string, string> = {
            'user': 'person',
            'mail': 'mail',
            'alternate_email': 'alternate_email',
            'phone': 'call',
            'call': 'call',
            'filetext': 'description',
            'description': 'description',
            'link': 'link',
            'bolt': 'bolt',
            'check': 'check',
            'person': 'person',
            'u': 'person',
            'm': 'mail',
            'p': 'call'
        };
        return map[lower] || lower;
    };

    const jsonLd = job ? {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description,
        "identifier": {
            "@type": "PropertyValue",
            "name": typeof orgName === 'object' ? orgName.name : orgName,
            "value": job.id
        },
        "datePosted": new Date().toISOString(), // Fallback if no posted_at
        "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
        "employmentType": job.job_type === "Full Time" ? "FULL_TIME" : job.job_type === "Part Time" ? "PART_TIME" : "OTHER",
        "hiringOrganization": {
            "@type": "Organization",
            "name": typeof orgName === 'object' ? orgName.name : orgName,
            "logo": typeof orgName === 'object' ? orgName.logo_url : undefined
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location || "Remote",
                "addressRegion": "",
                "postalCode": "",
                "addressCountry": ""
            }
        },
        "baseSalary": job.salary_min ? {
            "@type": "MonetaryAmount",
            "currency": job.salary_currency || "INR",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": job.salary_min,
                "maxValue": job.salary_max || job.salary_min,
                // Map every pay period Google accepts. This was `Yearly ? "YEAR" : "MONTH"`, so a
                // Daily, Weekly or Hourly job was published to Google for Jobs as a MONTHLY salary.
                "unitText": ({ Yearly: "YEAR", Monthly: "MONTH", Weekly: "WEEK", Daily: "DAY", Hourly: "HOUR" } as Record<string, string>)[job.salary_frequency || "Yearly"] || "YEAR"
            }
        } : undefined
    } : null;

    return (
        <div className="min-h-screen bg-[#F5F6F8]">
            {/* Google Jobs Structured Data — prefer the backend's canonical markup. */}
            {(jsonLdStr || jsonLd) && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: jsonLdStr || JSON.stringify(jsonLd) }}
                />
            )}
            {/* Top Navigation / Brand */}
            <nav className="sticky top-0 left-0 right-0 bg-white/85 backdrop-blur-md border-b border-[#E0E0E0] z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[4px] bg-[#1976D2] flex items-center justify-center text-white font-semibold text-lg overflow-hidden shrink-0">
                            {(typeof orgName === 'object' && orgName.logo_url) ? (
                                <img src={orgName.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                ((typeof orgName === 'object' ? orgName.name?.[0] : orgName?.[0]) || 'A').toUpperCase()
                            )}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[14px] font-bold text-[#212121]">{t("candidate.careerPortal")}</span>
                            <span className="text-[11px] font-medium text-[#9E9E9E]">
                                {typeof orgName === 'object' ? orgName.name : orgName}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero band */}
            <header
                className="relative overflow-hidden text-white"
                style={{
                    background: "#1E2A38",
                    backgroundImage:
                        "radial-gradient(900px 420px at 88% -30%,rgba(25,118,210,0.5),transparent 60%),radial-gradient(700px 400px at 0% 130%,rgba(66,165,245,0.25),transparent 60%)",
                }}
            >
                <div className="pointer-events-none absolute -right-20 -top-24 w-80 h-80 rounded-full border border-[#42A5F5]/20" />
                <div className="pointer-events-none absolute -right-2 -top-10 w-48 h-48 rounded-full border border-[#42A5F5]/15" />
                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-20">
                    {(typeof orgName === 'object' && orgName.logo_url) && (
                        <img src={orgName.logo_url} className="h-8 object-contain mb-5 block" alt="Company Logo" />
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="inline-flex items-center px-2.5 py-1 bg-white/[0.1] border border-white/15 text-white text-[12px] font-semibold rounded-[4px]">
                            {job.job_type || t("candidate.fullTime")}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 bg-white/[0.1] border border-white/15 text-[#BDBDBD] text-[12px] font-semibold rounded-[4px]">
                            {job.work_mode || t("candidate.onSite")}
                        </span>
                        {isOpen ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#66BB6A]/15 border border-[#66BB6A]/30 text-[#66BB6A] text-[12px] font-semibold rounded-[4px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#66BB6A] animate-pulse"></span>
                                {t("candidate.currentlyHiring")}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.08] border border-white/15 text-[#BDBDBD] text-[12px] font-semibold rounded-[4px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#9E9E9E]"></span>
                                {t("candidate.applicationsClosed")}
                            </span>
                        )}
                    </div>

                    <h1 className="text-[34px] md:text-[42px] font-extrabold tracking-[-1px] leading-[1.05] mb-5 max-w-3xl">{job.title}</h1>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#9E9E9E] font-medium text-[14px]">
                        <div className="flex items-center gap-2">
                            <i className="mdi mdi-map-marker text-[#42A5F5] text-[20px]" />
                            {job.location || t("candidate.remote")}
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="mdi mdi-briefcase text-[#42A5F5] text-[20px]" />
                            {job.experience_min || 0}-{job.experience_max || '5+'} {t("candidate.yrsExp")}
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="mdi mdi-cash-multiple text-[#42A5F5] text-[20px]" />
                            {job.salary_min ? `${job.salary_currency || 'INR'} ${job.salary_min.toLocaleString()}` : t("candidate.competitive")}
                            {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : ''}
                            <span className="text-[12px] text-white/40">/ {job.salary_frequency || t("candidate.yr")}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 -mt-8 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                {/* Left Column: Job Details */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-7 md:p-9 space-y-8">
                            <div>
                                <h3 className="text-[11px] font-bold text-[#1976D2] uppercase tracking-[0.1em] mb-3">{t("candidate.aboutTheRole")}</h3>
                                <div className="text-[#424242] text-[14.5px] leading-[1.7] max-w-none">
                                    <style jsx global>{`
                                        .prose-custom ul {
                                            list-style-type: disc !important;
                                            padding-left: 1.5rem !important;
                                            margin-bottom: 1rem !important;
                                        }
                                        .prose-custom ol {
                                            list-style-type: decimal !important;
                                            padding-left: 1.5rem !important;
                                            margin-bottom: 1rem !important;
                                        }
                                        .prose-custom li {
                                            margin-bottom: 0.5rem !important;
                                            display: list-item !important;
                                        }
                                        .prose-custom p {
                                            margin-bottom: 1rem !important;
                                        }
                                    `}</style>
                                    {/<\/?[a-z][^>]*>/i.test(job.description || "") ? (
                                        // Description authored in the rich-text editor → already HTML.
                                        <div
                                            className="prose-custom"
                                            dangerouslySetInnerHTML={{ __html: job.description }}
                                        />
                                    ) : (
                                        // Plain / AI-generated description → render Markdown.
                                        <div className="prose-custom [&_h1]:text-[18px] [&_h1]:font-bold [&_h1]:text-[#212121] [&_h1]:mt-5 [&_h1]:mb-2 [&_h2]:text-[16px] [&_h2]:font-bold [&_h2]:text-[#212121] [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-[#212121] [&_h3]:mt-4 [&_h3]:mb-1.5 [&_strong]:font-semibold [&_strong]:text-[#212121] [&_a]:text-[#1976D2] [&_a]:underline [&_code]:bg-[#E3F2FD] [&_code]:text-[#1565C0] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px]">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.description}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {job.required_skills && job.required_skills.length > 0 && (
                                <div>
                                    <h3 className="text-[11px] font-bold text-[#1976D2] uppercase tracking-[0.1em] mb-3">{t("candidate.requiredCompetencies")}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1.5 bg-[#F5F6F8] text-[#424242] rounded-[4px] border border-[#E0E0E0] font-medium text-[12px]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>

                {/* Right Column: Application Form */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-7 sticky top-24 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                        {!isOpen ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-[#F5F6F8] text-[#757575] rounded-[4px] flex items-center justify-center mx-auto mb-5">
                                    <i className="mdi mdi-lock-clock text-[32px]" />
                                </div>
                                <h3 className="text-[20px] font-extrabold text-[#212121] tracking-[-0.3px] mb-2">{t("candidate.applicationsClosed")}</h3>
                                <p className="text-[#757575] text-[14px] leading-relaxed">
                                    {t("candidate.applicationsClosedDesc")}
                                </p>
                            </div>
                        ) : applied ? (
                            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                                <div className="w-16 h-16 bg-[#E8F5E9] text-[#2E7D32] rounded-[4px] flex items-center justify-center mx-auto mb-5">
                                    <i className="mdi mdi-check text-[34px]" />
                                </div>
                                <h3 className="text-[22px] font-extrabold text-[#212121] tracking-[-0.3px] mb-2">{t("candidate.applicationSent")}</h3>
                                <p className="text-[#757575] text-[14px] leading-relaxed">
                                    {t("candidate.applicationSentDesc", { org: typeof orgName === 'object' ? orgName.name : (orgName || t("candidate.ourTeam")) })}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-[22px] font-extrabold text-[#212121] tracking-[-0.3px]">{t("candidate.applyNowHeading")}</h2>
                                    <p className="text-[#757575] text-[13px] mt-1">{t("candidate.fastTrackApplication")}</p>
                                </div>

                                <form onSubmit={handleApply} className="space-y-4">
                                    {(job.application_fields && job.application_fields.length > 0 ? job.application_fields : [
                                        { id: '1', label: 'Full Name', type: 'text', icon: 'person', is_required: true },
                                        { id: '2', label: 'Email Address', type: 'email', icon: 'alternate_email', is_required: true },
                                        { id: '3', label: 'Key Skills', type: 'text', icon: 'bolt', is_required: false },
                                        { id: '4', label: 'Resume / CV', type: 'file', icon: 'description', is_required: true }
                                    ]).map((field) => {
                                        const fieldKey = field.label.toLowerCase().replace(/\s+/g, '_');

                                        if (field.type === 'file') {
                                            return (
                                                <div key={field.id}>
                                                    <label className="block text-[12px] font-semibold text-[#424242] mb-1.5">
                                                        {field.label} {field.is_required && <span className="text-[#E53935]">*</span>}
                                                    </label>
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) setResumeFile(file);
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                            required={field.is_required}
                                                        />
                                                        <div className={`w-full px-3.5 py-3 rounded-[4px] border-2 border-dashed transition-colors flex items-center gap-3 ${resumeFile
                                                            ? "bg-[#E3F2FD]/50 border-[#1976D2]/40"
                                                            : "bg-white border-[#E0E0E0] group-hover:border-[#1976D2]/40"
                                                            }`}>
                                                            <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center ${resumeFile ? "bg-[#1976D2] text-white" : "bg-[#F5F6F8] text-[#9E9E9E]"
                                                                }`}>
                                                                <Icon name={resumeFile ? "description" : "upload_file"} className="text-[18px]" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-[13px] font-medium truncate ${resumeFile ? "text-[#212121]" : "text-[#757575]"}`}>
                                                                    {resumeFile ? resumeFile.name : t("candidate.uploadField", { label: field.label })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (field.type === 'boolean') {
                                            const isChecked = formData[fieldKey] === "Yes";
                                            return (
                                                <div key={field.id} className="p-3.5 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[4px] flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 ${isChecked ? 'bg-[#2E7D32] text-white' : 'bg-[#F5F6F8] text-[#9E9E9E]'}`}>
                                                            <Icon name={getIcon(field.icon) || 'check_circle'} className="text-[18px]" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="text-[12.5px] font-semibold text-[#424242] truncate">
                                                                {field.label} {field.is_required && <span className="text-[#E53935]">*</span>}
                                                            </label>
                                                            <span className={`text-[11px] font-medium ${isChecked ? 'text-[#2E7D32]' : 'text-[#9E9E9E]'}`}>{isChecked ? t("candidate.yes") : t("candidate.no")}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, [fieldKey]: isChecked ? "No" : "Yes" })}
                                                        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${isChecked ? 'bg-[#2E7D32]' : 'bg-[#E0E0E0]'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            );
                                        }

                                        const phoneField = isPhoneField(field, fieldKey);
                                        const fieldError = fieldErrors[fieldKey];
                                        return (
                                            <div key={field.id}>
                                                <label className="block text-[12px] font-semibold text-[#424242] mb-1.5">
                                                    {field.label} {field.is_required && <span className="text-[#E53935]">*</span>}
                                                </label>
                                                <div className="relative">
                                                    <Icon name={getIcon(field.icon)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-[19px] pointer-events-none" />
                                                    <input
                                                        type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : phoneField ? 'tel' : 'text'}
                                                        step="any"
                                                        placeholder={t("candidate.enterField", { label: field.label.toLowerCase() })}
                                                        className={`w-full h-11 pl-10 pr-4 rounded-[4px] bg-white border ${fieldError ? "border-[#E53935] focus:border-[#E53935] focus:ring-[#E53935]/20" : "border-[#E0E0E0] focus:border-[#1976D2] focus:ring-[#1976D2]/20"} focus:ring-2 outline-none transition-all text-[#212121] font-medium text-[14px] placeholder:text-[#9E9E9E] read-only:bg-[#F5F6F8] read-only:text-[#757575] read-only:cursor-not-allowed`}
                                                        value={formData[fieldKey] || ""}
                                                        onChange={e => {
                                                            setFormData({ ...formData, [fieldKey]: e.target.value });
                                                            if (fieldErrors[fieldKey]) {
                                                                setFieldErrors(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[fieldKey];
                                                                    return next;
                                                                });
                                                            }
                                                        }}
                                                        required={field.is_required}
                                                        readOnly={(field.type === 'email' || fieldKey === 'email' || fieldKey === 'email_address') && !!prefilledEmail}
                                                    />
                                                </div>
                                                {fieldError && (
                                                    <p className="mt-1.5 text-[11px] font-medium text-[#E53935]">{fieldError}</p>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[14px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                    >
                                        {isSubmitting ? (
                                            <span className="animate-spin mdi mdi-sync text-[18px]" />
                                        ) : (
                                            <i className="mdi mdi-send text-[18px]" />
                                        )}
                                        {isSubmitting ? t("candidate.sending") : t("candidate.submitApplication")}
                                    </button>
                                </form>

                                <p className="text-[11px] text-[#9E9E9E] text-center mt-5 leading-relaxed">
                                    {t("candidate.consentText", { org: typeof orgName === 'object' ? orgName.name : (orgName || t("candidate.ourOrganizationLower")) })}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-[#E0E0E0] py-8 mt-4 bg-white">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[#9E9E9E] text-[12.5px] font-medium">
                        {t("candidate.poweredBy")} <span className="text-[#1976D2] font-semibold">Croar</span>
                    </p>
                    <div className="flex items-center gap-6 text-[#9E9E9E] text-[12.5px] font-medium">
                        <button type="button" className="hover:text-[#1976D2] transition-colors">{t("candidate.privacy")}</button>
                        <button type="button" className="hover:text-[#1976D2] transition-colors">{t("candidate.terms")}</button>
                        <button type="button" className="hover:text-[#1976D2] transition-colors">{t("candidate.contact")}</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
