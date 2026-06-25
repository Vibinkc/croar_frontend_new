"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import JobEditor from "@/components/enterprise/JobEditor";
import {
    ArrowLeft,
    ArrowRight,
    CircleCheck,
    Building2,
    MapPin,
    Rocket,
    Sparkles,
    RefreshCcw,
    CirclePlus,
    Network,
    ClipboardList,
    Settings,
    X,
    LayoutDashboard,
    Eye,
    Users,
    Brain,
    Calculator,
    ShieldCheck,
    ChevronUp,
    ChevronDown,
    ListPlus,
    Pin,
    FileText,
    AtSign,
    ToggleRight,
    Type,
    Link as LinkIcon,
    Mail
} from "lucide-react";
import { jetbrainsMono } from "@/components/ds";

interface ApplicationField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'file' | 'email';
    icon: string;
    is_required: boolean;
}

interface WorkflowStage {
    id: string;
    name: string;
    type: string;
    icon: string;
    email_template_id?: string;
}

const DEFAULT_APPLICATION_FIELDS: ApplicationField[] = [
    { id: '1', label: 'Full Name', type: 'text', icon: 'person', is_required: true },
    { id: '2', label: 'Email Address', type: 'email', icon: 'mail', is_required: true },
    { id: '3', label: 'Phone Number', type: 'text', icon: 'call', is_required: false },
    { id: '4', label: 'Resume / CV', type: 'file', icon: 'description', is_required: true },
    { id: '5', label: 'Portfolio URL', type: 'text', icon: 'link', is_required: false }
];

const DEFAULT_WORKFLOW_STAGES: WorkflowStage[] = [
    { id: '1', name: 'Initial Screening', type: 'Screening', icon: 'search' }
];

interface Company {
    id: string;
    name: string;
}

interface EmailTemplate {
    id: string;
    name: string;
}

interface JobFormProps {
    mode: "create" | "edit";
    jobId?: string;
}

export default function JobForm({ mode, jobId }: JobFormProps) {
    const isEdit = mode === "edit";
    const { token } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdJobId, setCreatedJobId] = useState("");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        job_type: "Full Time",
        work_mode: "On-Site",
        location: "",
        department: "Human Resources",
        salary_currency: "INR",
        salary_frequency: "Yearly",
        salary_min: "",
        salary_max: "",
        experience_min: "0",
        experience_max: "5",
        description: "",
        required_skills: "",
        auto_fit_analysis: false,
        status_id: 2,
        company_id: "",
        application_fields: DEFAULT_APPLICATION_FIELDS,
        workflow_stages: DEFAULT_WORKFLOW_STAGES
    });

    const fetchEmailTemplates = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmailTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch email templates:", error);
        }
    }, [token]);

    const fetchCompanies = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
                if (!isEdit && data.length > 0) {
                    setFormData(prev => ({ ...prev, company_id: data[0].id }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        }
    }, [token, isEdit]);

    const fetchJobDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title || "",
                    job_type: data.job_type || "Full Time",
                    work_mode: data.work_mode || "On-Site",
                    location: data.location || "",
                    department: data.department || "Human Resources",
                    salary_currency: data.salary_currency || "INR",
                    salary_frequency: data.salary_frequency || "Yearly",
                    salary_min: data.salary_min?.toString() || "",
                    salary_max: data.salary_max?.toString() || "",
                    experience_min: data.experience_min?.toString() || "0",
                    experience_max: data.experience_max?.toString() || "5",
                    description: data.description || "",
                    required_skills: data.required_skills?.join(", ") || "",
                    auto_fit_analysis: data.auto_fit_analysis || false,
                    status_id: data.status_id || 2,
                    company_id: data.company_id || "",
                    application_fields: (data.application_fields && data.application_fields.length > 0) ? data.application_fields : DEFAULT_APPLICATION_FIELDS,
                    workflow_stages: (data.workflow_stages && data.workflow_stages.length > 0) ? data.workflow_stages : DEFAULT_WORKFLOW_STAGES
                });
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, jobId]);

    useEffect(() => {
        if (isEdit) {
            if (token && jobId) {
                fetchJobDetails();
                fetchCompanies();
                fetchEmailTemplates();
            }
        } else {
            if (token) {
                fetchCompanies();
                fetchEmailTemplates();
            }
        }
    }, [token, jobId, isEdit, fetchJobDetails, fetchCompanies, fetchEmailTemplates]);


    const steps = [
        { id: 1, name: "Job Details", icon: "ClipboardList" },
        { id: 2, name: "Application", icon: "Settings" },
        { id: 3, name: "Workflow", icon: "Network" }
    ];

    const handleSubmit = async () => {
        if (isEdit) {
            setIsSubmitting(true);
            try {
                const payload = {
                    title: formData.title,
                    job_type: formData.job_type,
                    work_mode: formData.work_mode,
                    location: formData.location,
                    department: formData.department,
                    salary_currency: formData.salary_currency,
                    salary_frequency: formData.salary_frequency,
                    salary_min: formData.salary_min ? Number.parseFloat(formData.salary_min) : null,
                    salary_max: formData.salary_max ? Number.parseFloat(formData.salary_max) : null,
                    experience_min: formData.experience_min ? Number.parseInt(formData.experience_min) : 0,
                    experience_max: formData.experience_max ? Number.parseInt(formData.experience_max) : 5,
                    description: formData.description,
                    required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(s => s),
                    auto_fit_analysis: formData.auto_fit_analysis,
                    status_id: formData.status_id,
                    company_id: formData.company_id,
                    application_fields: formData.application_fields,
                    workflow_stages: formData.workflow_stages
                };

                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    setShowSuccessModal(true);
                } else {
                    const error = await res.json();
                    alert(error.detail || "Failed to update job");
                }
            } catch (error) {
                alert("Network error. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            if (isExperienceInvalid || isSalaryInvalid) return;
            setIsSubmitting(true);
            try {
                const payload = {
                    ...formData,
                    salary_min: formData.salary_min ? Number.parseFloat(formData.salary_min) : null,
                    salary_max: formData.salary_max ? Number.parseFloat(formData.salary_max) : null,
                    experience_min: Number.parseInt(formData.experience_min),
                    experience_max: Number.parseInt(formData.experience_max),
                    required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(s => s)
                };
                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    setCreatedJobId(data.id);
                    setShowSuccessModal(true);
                }
            } catch (error) {
                console.error("Failed to submit job:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const generateAIDescription = async () => {
        if (isEdit) {
            if (!formData.title) {
                alert("Please enter a job title first");
                return;
            }

            setIsGeneratingAI(true);
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/generate-jd`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        existing_description: formData.description,
                        location: formData.location,
                        experience_min: formData.experience_min,
                        experience_max: formData.experience_max
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        ...formData,
                        description: data.description,
                        salary_min: data.salary_min?.toString() || formData.salary_min,
                        salary_max: data.salary_max?.toString() || formData.salary_max,
                        required_skills: data.skills?.join(", ") || formData.required_skills
                    });
                } else {
                    alert("AI generation failed. Please try again.");
                }
            } catch (error) {
                console.error("Error generating JD:", error);
                alert("Network error during AI generation.");
            } finally {
                setIsGeneratingAI(false);
            }
        } else {
            if (!formData.title) return;
            setIsGeneratingAI(true);
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/generate-jd`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ title: formData.title, existing_description: formData.description, location: formData.location, experience_min: formData.experience_min, experience_max: formData.experience_max })
                });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({ ...formData, description: data.description, required_skills: data.skills?.join(", ") || formData.required_skills });
                }
            } catch (error) {
                console.error("Failed to generate AI description:", error);
            } finally {
                setIsGeneratingAI(false);
            }
        }
    };

    const isExperienceInvalid = Number.parseInt(formData.experience_max) < Number.parseInt(formData.experience_min);
    const isSalaryInvalid = formData.salary_min && formData.salary_max && Number.parseFloat(formData.salary_max) < Number.parseFloat(formData.salary_min);

    const STAGE_TYPES = [
        { name: 'Screening', icon: 'Search' },
        { name: 'Aptitude', icon: 'Brain' },
        { name: 'Coding', icon: 'Code' },
        { name: 'Technical Interview', icon: 'Zap' },
        { name: 'HR Interview', icon: 'Users' },
        { name: 'Final Selection', icon: 'ShieldCheck' }
    ];

    const canGoNext = () => currentStep === 1 ? (formData.title && !isExperienceInvalid && !isSalaryInvalid) : true;

    const labelCls = "block text-[12px] font-semibold text-[#374151] mb-1.5";
    const inputCls = "w-full h-11 px-3.5 rounded-[10px] border border-[#E1E4E8] bg-white text-[14px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";
    const inputErrCls = "w-full h-11 px-3.5 rounded-[10px] border border-[#EF4444] bg-[#FDECEC] text-[14px] font-medium text-[#C0383C] outline-none focus:ring-2 focus:ring-[#EF4444]/20 transition-all";
    const selectCls = inputCls + " appearance-none cursor-pointer";

    if (isEdit && isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F4F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-[#8A929E]">Loading details…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-screen bg-[#F4F5F7] flex flex-col p-4 md:p-5 animate-in fade-in duration-500 overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5 px-1 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-[10px] bg-white border border-[#E8EAED] flex items-center justify-center text-[#6B6F76] hover:text-[#15171C] hover:bg-[#F4F5F7] transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C] leading-none truncate">{isEdit ? "Edit Job" : "Create Job"}</h1>
                        <p className="text-[11px] text-[#9AA3AF] font-semibold uppercase tracking-[0.08em] mt-1.5">{steps.find(s => s.id === currentStep)?.name || "Job Details"}</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center bg-white p-1 rounded-[12px] border border-[#E8EAED]">
                    {steps.map((step) => (
                        <button
                            key={step.id}
                            disabled={step.id > currentStep && !canGoNext()}
                            onClick={() => canGoNext() && setCurrentStep(step.id)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[9px] transition-colors ${currentStep === step.id ? "bg-[#ECEBFB] text-[#5B53E0]" : "text-[#6B6F76] hover:text-[#15171C]"}`}
                        >
                            <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${currentStep === step.id ? "bg-[#5B53E0] text-white" : "bg-[#F1F2F5] text-[#8A929E]"}`}>{step.id}</span>
                            <span className="text-[12px] font-semibold">{step.name}</span>
                        </button>
                    ))}
                </div>

                <button
                    disabled={!canGoNext()}
                    className="h-11 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] transition-colors flex items-center gap-2 group disabled:opacity-40 shrink-0"
                    onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()}
                >
                    {isSubmitting ? "Saving…" : currentStep === 3 ? (isEdit ? "Save changes" : "Create job") : "Next step"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="flex-1 bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden flex flex-col relative">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex-1 bg-[#F7F8FA] overflow-y-auto p-4 md:p-6 no-scrollbar relative">
                            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
                                {/* Left Form Column */}
                                <div className="lg:col-span-4 space-y-5 flex flex-col">
                                    {/* Core Details Card */}
                                    <div className="bg-white rounded-[12px] border border-[#E8EAED] p-5 space-y-4">
                                        <div className="flex items-center gap-3 border-b border-[#F0F0F1] pb-4">
                                            <div className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-[#15171C]">Job Profile</h3>
                                                <p className="text-[11px] font-medium text-[#9AA3AF] mt-0.5">Core listing details</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-1">
                                            <div>
                                                <label htmlFor="job-title-input" className={labelCls}>Job Title <span className="text-[#EF4444]">*</span></label>
                                                <input id="job-title-input" type="text" placeholder="e.g. Senior Frontend Engineer" className={inputCls} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                            </div>

                                            {companies.length > 0 && (
                                                <div>
                                                    <label htmlFor="company-select" className={labelCls}>Company</label>
                                                    <select id="company-select" className={selectCls} value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })}>
                                                        {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Logistics Card */}
                                    <div className="bg-white rounded-[12px] border border-[#E8EAED] p-5 space-y-4">
                                        <div className="flex items-center gap-3 border-b border-[#F0F0F1] pb-4">
                                            <div className="w-10 h-10 rounded-[11px] bg-[#E3F4EF] text-[#0E8A6E] flex items-center justify-center shrink-0">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-[#15171C]">Work Arrangement</h3>
                                                <p className="text-[11px] font-medium text-[#9AA3AF] mt-0.5">Work mode &amp; location</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="job-type-select" className={labelCls}>Type</label>
                                                    <select id="job-type-select" className={selectCls} value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                                        <option>Full Time</option><option>Part Time</option><option>Contract</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor="work-mode-select" className={labelCls}>Mode</label>
                                                    <select id="work-mode-select" className={selectCls} value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                                        <option>On-Site</option><option>Remote</option><option>Hybrid</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="location-input" className={labelCls}>Location</label>
                                                <input id="location-input" type="text" placeholder="e.g. San Francisco, CA" className={inputCls} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements Card */}
                                    <div className="bg-white rounded-[12px] border border-[#E8EAED] p-5 space-y-4">
                                        <div className="flex items-center gap-3 border-b border-[#F0F0F1] pb-4">
                                            <div className="w-10 h-10 rounded-[11px] bg-[#FEF3E2] text-[#D97706] flex items-center justify-center shrink-0">
                                                <Calculator className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-[#15171C]">Requirements</h3>
                                                <p className="text-[11px] font-medium text-[#9AA3AF] mt-0.5">Experience &amp; compensation</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="experience-min-input" className={labelCls}>Min Exp (Yrs)</label>
                                                    <input id="experience-min-input" type="number" min="0" className={isExperienceInvalid ? inputErrCls : inputCls} value={formData.experience_min} onChange={e => setFormData({ ...formData, experience_min: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label htmlFor="experience-max-input" className={labelCls}>Max Exp (Yrs)</label>
                                                    <input id="experience-max-input" type="number" min="0" className={isExperienceInvalid ? inputErrCls : inputCls} value={formData.experience_max} onChange={e => setFormData({ ...formData, experience_max: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="salary-min-input" className={labelCls}>Min Salary (LPA)</label>
                                                    <input id="salary-min-input" type="number" min="0" placeholder="5" className={isSalaryInvalid ? inputErrCls : inputCls} value={formData.salary_min} onChange={e => setFormData({ ...formData, salary_min: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label htmlFor="salary-max-input" className={labelCls}>Max Salary (LPA)</label>
                                                    <input id="salary-max-input" type="number" min="0" placeholder="15" className={isSalaryInvalid ? inputErrCls : inputCls} value={formData.salary_max} onChange={e => setFormData({ ...formData, salary_max: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Description Area */}
                                <div className="lg:col-span-8 flex flex-col min-h-[600px] bg-white rounded-[12px] border border-[#E8EAED] overflow-hidden">
                                    <div className="px-5 py-4 border-b border-[#F0F0F1] flex flex-wrap gap-3 justify-between items-center bg-white z-10 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-[#15171C]">Job Description &amp; Skills</h3>
                                                <p className="text-[11px] font-medium text-[#9AA3AF] mt-0.5">Outline the responsibilities and tech stack</p>
                                            </div>
                                        </div>
                                        {isEdit ? (
                                            <div className="flex items-center gap-2.5">
                                                <select
                                                    value={formData.status_id}
                                                    onChange={(e) => setFormData({ ...formData, status_id: Number.parseInt(e.target.value) })}
                                                    className={`h-10 px-3 rounded-[10px] border text-[12px] font-semibold outline-none cursor-pointer transition-colors appearance-none text-center ${formData.status_id === 2
                                                            ? "bg-[#E6F4EA] text-[#15803D] border-[#CDEAD7]"
                                                            : formData.status_id === 3
                                                                ? "bg-[#FDECEC] text-[#C0383C] border-[#F5C9C9]"
                                                                : "bg-[#F4F5F7] text-[#6B6F76] border-[#E8EAED]"
                                                        }`}
                                                >
                                                    <option value={1}>Draft</option>
                                                    <option value={2}>Active</option>
                                                    <option value={3}>Closed</option>
                                                </select>
                                                <button onClick={generateAIDescription} disabled={isGeneratingAI} className="h-10 px-3.5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] transition-colors flex items-center gap-2 disabled:opacity-60">
                                                    {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    {isGeneratingAI ? 'Generating…' : 'Auto Draft with AI'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={generateAIDescription} disabled={isGeneratingAI} className="h-10 px-3.5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] transition-colors flex items-center gap-2 disabled:opacity-60">
                                                {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {isGeneratingAI ? 'Generating…' : 'Auto Draft with AI'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col border-b border-[#E8EAED] overflow-y-auto">
                                        <JobEditor content={formData.description} onChange={(content) => setFormData({ ...formData, description: content })} placeholder="Detail the role, responsibilities, and ideal candidate profile here..." />
                                    </div>

                                    <div className="p-5 bg-[#F7F8FA] shrink-0">
                                        <label htmlFor="required-skills-input" className={labelCls}>Required Tech Stack <span className="font-normal text-[#9AA3AF]">(Comma Separated)</span></label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]">
                                                <AtSign className="w-4 h-4" />
                                            </div>
                                            <input id="required-skills-input" type="text" className="w-full h-11 pl-10 pr-4 rounded-[10px] border border-[#E1E4E8] outline-none font-medium text-[#15171C] text-[14px] bg-white placeholder:text-[#9AA3AF] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all" placeholder="e.g. React, Node.js, Python, AWS" value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
                            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E8EAED] p-5 md:p-6 bg-[#F7F8FA] overflow-y-auto no-scrollbar flex flex-col gap-5">
                                {/* Header */}
                                <div>
                                    <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C] leading-tight mb-1.5">Application Form</h1>
                                    <p className="text-[13px] text-[#8A929E] leading-relaxed">Design the form candidates will fill out when applying for this role.</p>
                                </div>

                                {/* Form Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-[12px] border border-[#E8EAED] p-4 text-center">
                                        <div className={`text-[26px] font-semibold text-[#5B53E0] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.application_fields.length}</div>
                                        <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">Total Fields</div>
                                    </div>
                                    <div className="bg-white rounded-[12px] border border-[#E8EAED] p-4 text-center">
                                        <div className={`text-[26px] font-semibold text-[#15803D] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.application_fields.filter(f => f.is_required).length}</div>
                                        <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">Required</div>
                                    </div>
                                </div>

                                {/* Field Types Guide */}
                                <div className="bg-white rounded-[12px] border border-[#E8EAED] p-4 space-y-3">
                                    <p className="text-[11px] font-semibold text-[#6B6F76] uppercase tracking-wider">Field Types</p>
                                    {[
                                        { type: 'Text', color: 'bg-[#E7ECFB] text-[#3559C7]', desc: 'Short or long text answers' },
                                        { type: 'Email', color: 'bg-[#ECEBFB] text-[#5B53E0]', desc: 'Validated email address' },
                                        { type: 'Number', color: 'bg-[#FEF3E2] text-[#D97706]', desc: 'Numeric value input' },
                                        { type: 'File', color: 'bg-[#E3F4EF] text-[#0E8A6E]', desc: 'Document or resume upload' },
                                        { type: 'Boolean', color: 'bg-[#FDECEC] text-[#C0383C]', desc: 'Yes / No toggle' },
                                    ].map(item => (
                                        <div key={item.type} className="flex items-center gap-3">
                                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-[7px] ${item.color} shrink-0 w-14 text-center`}>{item.type}</span>
                                            <span className="text-[12px] text-[#8A929E] font-medium">{item.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-8 p-5 md:p-6 overflow-y-auto no-scrollbar">
                                <div className="flex flex-col gap-2.5 max-w-3xl mx-auto pb-10">
                                    {formData.application_fields.map((field) => (
                                        <div key={field.id} className="p-3.5 bg-white rounded-[12px] border border-[#E8EAED] flex items-center justify-between group hover:border-[#5B53E0]/40 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 rounded-[10px] bg-[#F4F5F7] flex items-center justify-center text-[#9AA3AF] group-hover:text-[#5B53E0] group-hover:bg-[#ECEBFB] transition-colors shrink-0"><Pin className="w-4 h-4" /></div>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center min-w-0">
                                                    <input type="text" className="bg-transparent border-none outline-none text-[13.5px] font-semibold text-[#15171C] p-0 focus:text-[#5B53E0] transition-colors truncate" value={field.label} onChange={(e) => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f) }))} />
                                                    <select className="bg-[#F4F5F7] border border-[#E8EAED] outline-none text-[12px] font-medium text-[#374151] px-3 h-9 rounded-[9px] cursor-pointer hover:bg-[#EEEFF1] transition-colors w-full sm:w-36" value={field.type} onChange={(e) => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, type: e.target.value as ApplicationField['type'] } : f) }))}>
                                                        <option value="text">Text</option><option value="email">Email</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="file">File</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                                <button onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, is_required: !f.is_required } : f) }))} className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold border transition-colors ${field.is_required ? 'bg-[#5B53E0] text-white border-[#5B53E0]' : 'bg-white text-[#9AA3AF] border-[#E8EAED]'}`}>{field.is_required ? 'Required' : 'Optional'}</button>
                                                <button onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.filter(f => f.id !== field.id) }))} className="w-8 h-8 rounded-[9px] hover:bg-[#FDECEC] text-[#C7CCD4] hover:text-[#EF4444] transition-colors flex items-center justify-center"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}

                                    <button onClick={() => {
                                        const newField: ApplicationField = { id: Date.now().toString(), label: 'New Question', type: 'text', icon: 'Type', is_required: false };
                                        setFormData(prev => ({ ...prev, application_fields: [...prev.application_fields, newField] }));
                                    }} className="w-full h-12 rounded-[12px] border-2 border-dashed border-[#D4D7DC] text-[#6B6F76] text-[14px] font-semibold hover:border-[#5B53E0] hover:text-[#5B53E0] hover:bg-[#ECEBFB]/40 transition-colors flex items-center justify-center gap-2">
                                        <CirclePlus className="w-5 h-5" />
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
                            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E8EAED] p-5 md:p-6 bg-[#F7F8FA] overflow-y-auto no-scrollbar flex flex-col gap-5">
                                {/* Header */}
                                <div>
                                    <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C] leading-tight mb-1.5">Hiring Process</h1>
                                    <p className="text-[13px] text-[#8A929E] leading-relaxed">Define the stages candidates go through from application to final selection.</p>
                                </div>

                                {/* Stage Stats */}
                                <div className="bg-white rounded-[12px] border border-[#E8EAED] p-4 text-center">
                                    <div className={`text-[26px] font-semibold text-[#5B53E0] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.workflow_stages.length}</div>
                                    <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">Total Stages</div>
                                </div>

                                {/* Stage Types Guide */}
                                <div className="bg-white rounded-[12px] border border-[#E8EAED] p-4 space-y-3">
                                    <p className="text-[11px] font-semibold text-[#6B6F76] uppercase tracking-wider">Stage Types</p>
                                    {[
                                        { type: 'Screening', color: 'bg-[#E7ECFB] text-[#3559C7]', desc: 'Initial candidate filtering' },
                                        { type: 'Aptitude', color: 'bg-[#ECEBFB] text-[#5B53E0]', desc: 'Cognitive & reasoning tests' },
                                        { type: 'Coding', color: 'bg-[#FEF3E2] text-[#D97706]', desc: 'Technical coding assessment' },
                                        { type: 'Tech Interview', color: 'bg-[#E3F4EF] text-[#0E8A6E]', desc: 'Deep technical evaluation' },
                                        { type: 'HR Interview', color: 'bg-[#FDECEC] text-[#C0383C]', desc: 'Culture & fit discussion' },
                                        { type: 'Final Selection', color: 'bg-[#E6F4EA] text-[#15803D]', desc: 'Final hiring decision' },
                                    ].map(item => (
                                        <div key={item.type} className="flex items-center gap-3">
                                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-[7px] ${item.color} shrink-0 w-20 text-center`}>{item.type}</span>
                                            <span className="text-[12px] text-[#8A929E] font-medium">{item.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-8 p-5 md:p-6 overflow-y-auto no-scrollbar flex flex-col items-center">
                                <div className="w-full max-w-lg space-y-2.5 pb-10 pl-8">
                                    {formData.workflow_stages.map((node, idx) => (
                                        <div key={node.id} className="group relative flex items-center gap-3.5 bg-white p-3.5 rounded-[12px] border border-[#E8EAED] border-l-[3px] border-l-[#5B53E0] hover:border-[#5B53E0]/40 transition-colors">
                                            <div className="flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity absolute -left-8">
                                                <button disabled={idx === 0} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx - 1]] = [newStages[idx - 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-[8px] bg-white border border-[#E8EAED] flex items-center justify-center text-[#C7CCD4] hover:text-[#5B53E0] disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                                                <button disabled={idx === formData.workflow_stages.length - 1} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx + 1]] = [newStages[idx + 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-[8px] bg-white border border-[#E8EAED] flex items-center justify-center text-[#C7CCD4] hover:text-[#5B53E0] disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                                            </div>
                                            <div className={`w-9 h-9 rounded-[10px] bg-[#5B53E0] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 ${jetbrainsMono.className}`}>#0{idx + 1}</div>
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-[13.5px] font-semibold text-[#15171C] p-0 focus:text-[#5B53E0] transition-colors truncate" value={node.name} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, name: e.target.value } : s) }))} />
                                                <select className="bg-[#F4F5F7] border border-[#E8EAED] outline-none text-[11.5px] font-medium text-[#374151] px-2.5 h-8 rounded-[8px] cursor-pointer hover:bg-[#EEEFF1] transition-colors" value={node.type} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, type: e.target.value } : s) }))}>
                                                    {STAGE_TYPES.map(t => (<option key={t.name} value={t.name}>{t.name}</option>))}
                                                </select>
                                            </div>
                                            <button onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.filter(s => s.id !== node.id) }))} className="w-8 h-8 rounded-[9px] hover:bg-[#FDECEC] text-[#C7CCD4] hover:text-[#EF4444] transition-colors flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}

                                    <button onClick={() => {
                                        const maxId = Math.max(0, ...formData.workflow_stages.map(s => Number.parseInt(s.id) || 0));
                                        const newStage: WorkflowStage = { id: (maxId + 1).toString(), name: `Stage ${maxId + 1}`, type: 'Technical Interview', icon: 'Zap' };
                                        setFormData(prev => ({ ...prev, workflow_stages: [...prev.workflow_stages, newStage] }));
                                    }} className="w-full h-12 rounded-[12px] border-2 border-dashed border-[#D4D7DC] text-[#6B6F76] text-[14px] font-semibold hover:border-[#5B53E0] hover:text-[#5B53E0] hover:bg-[#ECEBFB]/40 transition-colors flex items-center justify-center gap-2">
                                        <ListPlus className="w-5 h-5" />
                                        Add Stage
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E1014]/50 backdrop-blur-sm p-6">
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[16px] p-8 text-center shadow-[0_14px_34px_rgba(15,23,42,0.16)] relative overflow-hidden border border-[#E8EAED]">
                            <div className="w-16 h-16 bg-[#E6F4EA] text-[#15803D] rounded-[16px] flex items-center justify-center mx-auto mb-5"><CircleCheck className="w-9 h-9" /></div>
                            <h2 className="text-[24px] font-extrabold text-[#15171C] tracking-[-0.4px] mb-2 leading-tight">{isEdit ? "Job updated" : "Job created"}</h2>
                            <p className="text-[14px] text-[#8A929E] leading-relaxed mb-7">{isEdit ? "The job details have been updated successfully." : "The new job has been created and is now live."}</p>
                            <div className="flex flex-col gap-2.5">
                                <button onClick={() => router.push("/enterprise/jobs")} className="w-full h-[46px] bg-[#5B53E0] text-white rounded-[10px] font-semibold text-[14px] hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors flex items-center justify-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    View job board
                                </button>
                                <button onClick={() => window.open(`${window.location.origin}/jobs/${isEdit ? jobId : createdJobId}`, '_blank')} className="w-full h-[46px] border border-[#E1E4E8] rounded-[10px] text-[#374151] font-semibold text-[14px] hover:bg-[#F4F5F7] transition-colors flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    View job application
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
