"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import JobEditor from "@/components/enterprise/JobEditor";
import {
    ArrowRight,
    CircleCheck,
    MapPin,
    Sparkles,
    RefreshCcw,
    CirclePlus,
    ClipboardList,
    X,
    LayoutDashboard,
    Eye,
    Calculator,
    ChevronUp,
    ChevronDown,
    ListPlus,
    Pin,
    FileText,
    AtSign,
    Users
} from "lucide-react";
import { jetbrainsMono, Button, Card, CardHeader, Field, Input, Select, PageHeader, cn } from "@/components/ds";

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

    const errorInputCls = "border-[#EF4444] bg-[#FDECEC] text-[#C0383C] focus:border-[#EF4444] focus:ring-[#EF4444]/20";

    // Hand the just-created job off to sourcing.
    //  - "ai":     Croar Pilot auto-starts sourcing from the job's title + JD.
    //  - "manual": AI Sourcing page, pre-filled with the job title to search.
    const startSourcing = (mode: "ai" | "manual") => {
        try {
            sessionStorage.setItem("croar_source_job", JSON.stringify({
                id: createdJobId,
                title: formData.title || "",
                description: formData.description || "",
                autostart: mode === "ai",
            }));
        } catch (e) {
            console.error("Could not hand off to sourcing:", e);
        }
        router.push(mode === "ai" ? "/enterprise/croar-pilot" : "/enterprise/sourcing/chat");
    };

    if (isEdit && isLoading) {
        return (
            <div className="min-h-[60vh] w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[13px] font-medium text-[#8A929E]">Loading details…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-6 max-w-[1400px] mx-auto w-full h-full flex flex-col gap-6 animate-in fade-in duration-500 relative">
            {/* Header */}
            <PageHeader
                help={<><p>Describe the role across the steps — title, requirements, pipeline.</p><p>Use <strong>Draft with AI</strong> for the description. Save, then publish or share the job to start receiving candidates.</p></>}
                title={isEdit ? "Edit Job" : "Create Job"}
                subtitle={`Step ${currentStep} of 3 — ${steps.find(s => s.id === currentStep)?.name || "Job Details"}`}
                onBack={() => router.back()}
                actions={
                    <>
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

                        <Button
                            disabled={!canGoNext()}
                            onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()}
                            className="group shrink-0"
                        >
                            {isSubmitting ? "Saving…" : currentStep === 3 ? (isEdit ? "Save changes" : "Create job") : "Next step"}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </>
                }
            />

            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden flex flex-col relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex-1 bg-[#F7F8FA] overflow-y-auto p-4 md:p-6 no-scrollbar relative">
                            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
                                {/* Left Form Column */}
                                <div className="lg:col-span-4 space-y-5 flex flex-col">
                                    {/* Core Details Card */}
                                    <Card padding="sm" className="space-y-4">
                                        <CardHeader
                                            className="border-b border-[#F0F0F1] pb-4 mb-0"
                                            title={
                                                <span className="flex items-center gap-3">
                                                    <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                                        <ClipboardList className="w-[18px] h-[18px]" />
                                                    </span>
                                                    Job Profile
                                                </span>
                                            }
                                            subtitle="Core listing details"
                                        />

                                        <div className="space-y-4 pt-1">
                                            <Field label="Job Title" htmlFor="job-title-input" required>
                                                <Input id="job-title-input" type="text" placeholder="e.g. Senior Frontend Engineer" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                            </Field>

                                            {companies.length > 0 && (
                                                <Field label="Company" htmlFor="company-select">
                                                    <Select id="company-select" className="cursor-pointer" value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })}>
                                                        {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                    </Select>
                                                </Field>
                                            )}
                                        </div>
                                    </Card>

                                    {/* Logistics Card */}
                                    <Card padding="sm" className="space-y-4">
                                        <CardHeader
                                            className="border-b border-[#F0F0F1] pb-4 mb-0"
                                            title={
                                                <span className="flex items-center gap-3">
                                                    <span className="w-9 h-9 rounded-[10px] bg-[#E3F4EF] text-[#0E8A6E] flex items-center justify-center shrink-0">
                                                        <MapPin className="w-[18px] h-[18px]" />
                                                    </span>
                                                    Work Arrangement
                                                </span>
                                            }
                                            subtitle="Work mode & location"
                                        />

                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Type" htmlFor="job-type-select">
                                                    <Select id="job-type-select" className="cursor-pointer" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                                        <option>Full Time</option><option>Part Time</option><option>Contract</option>
                                                    </Select>
                                                </Field>
                                                <Field label="Mode" htmlFor="work-mode-select">
                                                    <Select id="work-mode-select" className="cursor-pointer" value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                                        <option>On-Site</option><option>Remote</option><option>Hybrid</option>
                                                    </Select>
                                                </Field>
                                            </div>
                                            <Field label="Location" htmlFor="location-input">
                                                <Input id="location-input" type="text" placeholder="e.g. San Francisco, CA" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                            </Field>
                                        </div>
                                    </Card>

                                    {/* Requirements Card */}
                                    <Card padding="sm" className="space-y-4">
                                        <CardHeader
                                            className="border-b border-[#F0F0F1] pb-4 mb-0"
                                            title={
                                                <span className="flex items-center gap-3">
                                                    <span className="w-9 h-9 rounded-[10px] bg-[#FEF3E2] text-[#D97706] flex items-center justify-center shrink-0">
                                                        <Calculator className="w-[18px] h-[18px]" />
                                                    </span>
                                                    Requirements
                                                </span>
                                            }
                                            subtitle="Experience & compensation"
                                        />

                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Min Exp (Yrs)" htmlFor="experience-min-input" error={isExperienceInvalid ? "Max must be ≥ min" : undefined}>
                                                    <Input id="experience-min-input" type="number" min="0" className={cn(jetbrainsMono.className, isExperienceInvalid && errorInputCls)} value={formData.experience_min} onChange={e => setFormData({ ...formData, experience_min: e.target.value })} />
                                                </Field>
                                                <Field label="Max Exp (Yrs)" htmlFor="experience-max-input">
                                                    <Input id="experience-max-input" type="number" min="0" className={cn(jetbrainsMono.className, isExperienceInvalid && errorInputCls)} value={formData.experience_max} onChange={e => setFormData({ ...formData, experience_max: e.target.value })} />
                                                </Field>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Min Salary (LPA)" htmlFor="salary-min-input" error={isSalaryInvalid ? "Max must be ≥ min" : undefined}>
                                                    <Input id="salary-min-input" type="number" min="0" placeholder="5" className={cn(jetbrainsMono.className, isSalaryInvalid && errorInputCls)} value={formData.salary_min} onChange={e => setFormData({ ...formData, salary_min: e.target.value })} />
                                                </Field>
                                                <Field label="Max Salary (LPA)" htmlFor="salary-max-input">
                                                    <Input id="salary-max-input" type="number" min="0" placeholder="15" className={cn(jetbrainsMono.className, isSalaryInvalid && errorInputCls)} value={formData.salary_max} onChange={e => setFormData({ ...formData, salary_max: e.target.value })} />
                                                </Field>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Right Description Area */}
                                <Card padding="none" className="lg:col-span-8 flex flex-col min-h-[600px] overflow-hidden">
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
                                                <Select
                                                    value={formData.status_id}
                                                    onChange={(e) => setFormData({ ...formData, status_id: Number.parseInt(e.target.value) })}
                                                    className={`h-10 text-[12px] font-semibold cursor-pointer text-center ${formData.status_id === 2
                                                            ? "bg-[#E6F4EA] text-[#15803D] border-[#CDEAD7]"
                                                            : formData.status_id === 3
                                                                ? "bg-[#FDECEC] text-[#C0383C] border-[#F5C9C9]"
                                                                : "bg-[#F4F5F7] text-[#6B6F76] border-[#E8EAED]"
                                                        }`}
                                                >
                                                    <option value={1}>Draft</option>
                                                    <option value={2}>Active</option>
                                                    <option value={3}>Closed</option>
                                                </Select>
                                                <Button onClick={generateAIDescription} disabled={isGeneratingAI} className="h-10">
                                                    {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    {isGeneratingAI ? 'Generating…' : 'Auto Draft with AI'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button onClick={generateAIDescription} disabled={isGeneratingAI} className="h-10">
                                                {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {isGeneratingAI ? 'Generating…' : 'Auto Draft with AI'}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col border-b border-[#E8EAED] overflow-y-auto">
                                        <JobEditor content={formData.description} onChange={(content) => setFormData({ ...formData, description: content })} placeholder="Detail the role, responsibilities, and ideal candidate profile here..." />
                                    </div>

                                    <div className="p-5 bg-[#F7F8FA] shrink-0">
                                        <Field
                                            label={<>Required Tech Stack <span className="font-normal text-[#9AA3AF]">(Comma Separated)</span></>}
                                            htmlFor="required-skills-input"
                                        >
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] z-10 pointer-events-none">
                                                    <AtSign className="w-4 h-4" />
                                                </div>
                                                <Input id="required-skills-input" type="text" className="pl-10" placeholder="e.g. React, Node.js, Python, AWS" value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} />
                                            </div>
                                        </Field>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
                            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E8EAED] p-5 md:p-6 bg-[#F7F8FA] lg:overflow-y-auto no-scrollbar flex flex-col gap-5">
                                {/* Header */}
                                <div>
                                    <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C] leading-tight mb-1.5">Application Form</h1>
                                    <p className="text-[13px] text-[#8A929E] leading-relaxed">Design the form candidates will fill out when applying for this role.</p>
                                </div>

                                {/* Form Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Card padding="sm" className="text-center">
                                        <div className={`text-[26px] font-semibold text-[#5B53E0] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.application_fields.length}</div>
                                        <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">Total Fields</div>
                                    </Card>
                                    <Card padding="sm" className="text-center">
                                        <div className={`text-[26px] font-semibold text-[#15803D] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.application_fields.filter(f => f.is_required).length}</div>
                                        <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">Required</div>
                                    </Card>
                                </div>

                                {/* Field Types Guide */}
                                <Card padding="sm" className="space-y-3">
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
                                </Card>
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
                                                <button title={field.is_required ? "Required — click to make optional" : "Optional — click to make required"} onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, is_required: !f.is_required } : f) }))} className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold border transition-colors ${field.is_required ? 'bg-[#5B53E0] text-white border-[#5B53E0]' : 'bg-[#F4F5F7] text-[#374151] border-[#D4D7DC] hover:bg-[#ECEBFB] hover:text-[#5B53E0] hover:border-[#5B53E0]/40'}`}>{field.is_required ? 'Required' : 'Optional'}</button>
                                                <button title="Remove question" onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.filter(f => f.id !== field.id) }))} className="w-8 h-8 rounded-[9px] border border-[#E8EAED] bg-white text-[#8A929E] hover:bg-[#FDECEC] hover:text-[#EF4444] hover:border-[#F7D7D7] transition-colors flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
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
                            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E8EAED] p-5 md:p-6 bg-[#F7F8FA] lg:overflow-y-auto no-scrollbar flex flex-col gap-5">
                                {/* Header */}
                                <div>
                                    <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C] leading-tight mb-1.5">Hiring Process</h1>
                                    <p className="text-[13px] text-[#8A929E] leading-relaxed">Define the stages candidates go through from application to final selection.</p>
                                </div>

                                {/* Stage Stats */}
                                <Card padding="sm" className="text-center">
                                    <div className={`text-[26px] font-semibold text-[#5B53E0] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.workflow_stages.length}</div>
                                    <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">Total Stages</div>
                                </Card>

                                {/* Stage Types Guide */}
                                <Card padding="sm" className="space-y-3">
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
                                </Card>
                            </div>
                            <div className="lg:col-span-8 p-5 md:p-6 overflow-y-auto no-scrollbar flex flex-col items-center">
                                <div className="w-full max-w-lg space-y-2.5 pb-10 pl-8">
                                    {formData.workflow_stages.map((node, idx) => (
                                        <div key={node.id} className="group relative flex items-center gap-3.5 bg-white p-3.5 rounded-[12px] border border-[#E8EAED] border-l-[3px] border-l-[#5B53E0] hover:border-[#5B53E0]/40 transition-colors">
                                            <div className="flex flex-col gap-1 items-center absolute -left-8">
                                                <button title="Move up" disabled={idx === 0} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx - 1]] = [newStages[idx - 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-[8px] bg-white border border-[#E1E4E8] shadow-sm flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                                                <button title="Move down" disabled={idx === formData.workflow_stages.length - 1} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx + 1]] = [newStages[idx + 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-[8px] bg-white border border-[#E1E4E8] shadow-sm flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                                            </div>
                                            <div className={`w-9 h-9 rounded-[10px] bg-[#5B53E0] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 ${jetbrainsMono.className}`}>#0{idx + 1}</div>
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-[13.5px] font-semibold text-[#15171C] p-0 focus:text-[#5B53E0] transition-colors truncate" value={node.name} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, name: e.target.value } : s) }))} />
                                                <select className="bg-[#F4F5F7] border border-[#E8EAED] outline-none text-[11.5px] font-medium text-[#374151] px-2.5 h-8 rounded-[8px] cursor-pointer hover:bg-[#EEEFF1] transition-colors" value={node.type} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, type: e.target.value } : s) }))}>
                                                    {STAGE_TYPES.map(t => (<option key={t.name} value={t.name}>{t.name}</option>))}
                                                </select>
                                            </div>
                                            <button title="Remove stage" onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.filter(s => s.id !== node.id) }))} className="w-8 h-8 rounded-[9px] border border-[#E8EAED] bg-white text-[#8A929E] hover:bg-[#FDECEC] hover:text-[#EF4444] hover:border-[#F7D7D7] transition-colors flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
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
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[16px] p-6 text-center shadow-[0_14px_34px_rgba(15,23,42,0.16)] relative overflow-hidden border border-[#E8EAED]">
                            <div className="w-12 h-12 bg-[#E6F4EA] text-[#15803D] rounded-[14px] flex items-center justify-center mx-auto mb-3.5"><CircleCheck className="w-7 h-7" /></div>
                            <h2 className="text-[19px] font-extrabold text-[#15171C] tracking-[-0.4px] mb-1.5 leading-tight">{isEdit ? "Job updated" : "Job created"}</h2>
                            <p className="text-[12.5px] text-[#8A929E] leading-relaxed mb-5">{isEdit ? "The job details have been updated successfully." : (formData.status_id === 2 ? "The new job has been created and is now live." : "The new job has been created. Set its status to Active to start receiving applications.")}</p>

                            {!isEdit && (
                                <div className="mb-4 rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] p-3.5 text-left">
                                    <p className="text-[12.5px] font-bold text-[#15171C] mb-0.5">Start sourcing candidates</p>
                                    <p className="text-[11.5px] text-[#8A929E] leading-relaxed mb-3">Let Croar Pilot match candidates from the job description, or search yourself.</p>
                                    <div className="flex flex-col gap-2">
                                        <Button fullWidth onClick={() => startSourcing("ai")}>
                                            <Sparkles className="w-4 h-4" />
                                            Source with Croar Pilot
                                        </Button>
                                        <Button variant="secondary" fullWidth onClick={() => startSourcing("manual")}>
                                            <Users className="w-4 h-4" />
                                            Source manually
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button variant={isEdit ? "primary" : "secondary"} fullWidth onClick={() => router.push("/enterprise/jobs")}>
                                    <LayoutDashboard className="w-4 h-4" />
                                    View job board
                                </Button>
                                <Button variant="secondary" fullWidth onClick={() => window.open(`${window.location.origin}/jobs/${isEdit ? jobId : createdJobId}`, '_blank')}>
                                    <Eye className="w-4 h-4" />
                                    View job application
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
