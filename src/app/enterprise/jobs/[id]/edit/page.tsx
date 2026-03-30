"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import JobEditor from "@/components/enterprise/JobEditor";

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
}

const DEFAULT_APPLICATION_FIELDS: ApplicationField[] = [
    { id: '1', label: 'Full Name', type: 'text', icon: 'person', is_required: true },
    { id: '2', label: 'Email Address', type: 'email', icon: 'alternate_email', is_required: true },
    { id: '3', label: 'Phone Number', type: 'text', icon: 'call', is_required: false },
    { id: '4', label: 'Resume / CV', type: 'file', icon: 'description', is_required: true },
    { id: '5', label: 'Portfolio URL', type: 'text', icon: 'link', is_required: false }
];

const DEFAULT_WORKFLOW_STAGES: WorkflowStage[] = [
    { id: '1', name: 'AI Screening', type: 'Assessment', icon: 'psychology' },
    { id: '2', name: 'Initial Interview', type: 'Interview', icon: 'groups' },
    { id: '3', name: 'Technical Test', type: 'Assignment', icon: 'code_blocks' },
    { id: '4', name: 'Final Interview', type: 'Interview', icon: 'verified' }
];

export default function EditJobPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

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
        application_fields: DEFAULT_APPLICATION_FIELDS,
        workflow_stages: DEFAULT_WORKFLOW_STAGES,
    });

    const steps = [
        { id: 1, name: "Job Details", icon: "assignment" },
        { id: 2, name: "Application Form", icon: "settings_outline" },
        { id: 3, name: "Hiring Process", icon: "account_tree" }
    ];

    useEffect(() => {
        if (token && jobId) {
            fetchJobDetails();
        }
    }, [token, jobId]);

    const fetchJobDetails = async () => {
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
                    application_fields: (data.application_fields && data.application_fields.length > 0) ? data.application_fields : DEFAULT_APPLICATION_FIELDS,
                    workflow_stages: (data.workflow_stages && data.workflow_stages.length > 0) ? data.workflow_stages : DEFAULT_WORKFLOW_STAGES
                });
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
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
                salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
                experience_min: formData.experience_min ? parseInt(formData.experience_min) : 0,
                experience_max: formData.experience_max ? parseInt(formData.experience_max) : 5,
                description: formData.description,
                required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(s => s),
                auto_fit_analysis: formData.auto_fit_analysis,
                status_id: formData.status_id,
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
    };
    const generateAIDescription = async () => {
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
    };




    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#FDFDFF]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Fetching Mission Data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-screen bg-[#FDFDFF] flex flex-col p-6 animate-in fade-in duration-700 overflow-hidden">
            {/* Header Control Bar */}
            <div className="flex items-center justify-between mb-8 px-2 shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all shadow-sm">
                        <span className="material-symbols-rounded text-2xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Job Requisition</h1>
                        <p className="text-sm text-slate-400 font-medium mt-1">Refine your mission parameters and requirements</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center bg-slate-100/40 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
                    {steps.map((step) => (
                        <button
                            key={step.id}
                            onClick={() => setCurrentStep(step.id)}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all ${currentStep === step.id ? "bg-white text-[#7C3AED] shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-lg border ${currentStep === step.id ? "border-[#7C3AED]/20 bg-[#7C3AED]/5" : "border-slate-200 bg-white"}`}>{step.id}</span>
                            <span className="text-xs font-bold uppercase tracking-wider">{step.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="px-8 py-3.5 rounded-2xl bg-[#7C3AED] text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-[#6D28D9] transition-all active:scale-95 flex items-center gap-2 group"
                        onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()}
                    >
                        {isSubmitting ? "Syncing..." : currentStep === 3 ? "Save Changes" : "Next Step"}
                        <span className="material-symbols-rounded text-xl group-hover:translate-x-1 transition-transform">
                            {currentStep === 3 ? 'save' : 'arrow_forward'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 grid grid-cols-12 overflow-hidden h-full"
                        >
                            {/* Left Sidebar: Settings */}
                            <div className="col-span-4 border-r border-slate-50 p-10 bg-slate-50/20 overflow-y-auto no-scrollbar">
                                <div className="space-y-8">
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 px-1">Job Title *</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-slate-800 text-sm focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/5 outline-none transition-all"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 px-1">Type</label>
                                                <select className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none cursor-pointer" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                                    <option>Full Time</option><option>Part Time</option><option>Contract</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 px-1">Work Mode</label>
                                                <select className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none cursor-pointer" value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                                    <option>On-Site</option><option>Remote</option><option>Hybrid</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 px-1">Location</label>
                                            <div className="relative">
                                                <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">location_on</span>
                                                <input type="text" className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 px-1">Experience (Min)</label>
                                                <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none focus:border-[#7C3AED] transition-all" value={formData.experience_min} onChange={e => setFormData({ ...formData, experience_min: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 px-1">Experience (Max)</label>
                                                <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none focus:border-[#7C3AED] transition-all" value={formData.experience_max} onChange={e => setFormData({ ...formData, experience_max: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 px-1">Min Salary (LPA)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">₹</span>
                                                    <input type="number" placeholder="e.g. 5" className="w-full pl-8 pr-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none focus:border-[#7C3AED] transition-all" value={formData.salary_min} onChange={e => setFormData({ ...formData, salary_min: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 px-1">Max Salary (LPA)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">₹</span>
                                                    <input type="number" placeholder="e.g. 15" className="w-full pl-8 pr-5 py-4 rounded-2xl border border-slate-100 bg-white font-semibold text-sm outline-none focus:border-[#7C3AED] transition-all" value={formData.salary_max} onChange={e => setFormData({ ...formData, salary_max: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Markdown Content */}
                            <div className="col-span-8 p-12 flex flex-col gap-6 h-full overflow-hidden">
                                <div className="flex justify-between items-center shrink-0 px-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Job Description</h3>
                                        <p className="text-sm text-slate-400 font-medium">Define mission roles and core requirements</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={formData.status_id}
                                            onChange={(e) => setFormData({ ...formData, status_id: parseInt(e.target.value) })}
                                            className={`px-4 py-3 rounded-2xl border text-xs font-bold outline-none cursor-pointer transition-all appearance-none text-center shadow-sm hover:shadow-md ${formData.status_id === 2
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : formData.status_id === 3
                                                        ? "bg-rose-50 text-rose-500 border-rose-100"
                                                        : "bg-slate-50 text-slate-500 border-slate-100"
                                                }`}
                                        >
                                            <option value={1}>DRAFT</option>
                                            <option value={2}>ACTIVE</option>
                                            <option value={3}>CLOSED</option>
                                        </select>
                                        <button
                                            onClick={generateAIDescription}
                                            disabled={isGeneratingAI}
                                            className="px-6 py-3 rounded-2xl bg-indigo-50 text-[#7C3AED] text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100 shadow-sm disabled:opacity-50"
                                        >
                                            <span className={`material-symbols-rounded text-lg ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                                {isGeneratingAI ? 'sync' : 'auto_awesome'}
                                            </span>
                                            {isGeneratingAI ? 'Drafting...' : 'AI Smart Draft'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col border border-slate-100 rounded-[2.5rem] bg-white shadow-sm overflow-hidden transition-all">
                                    <JobEditor
                                        content={formData.description}
                                        onChange={(content) => setFormData({ ...formData, description: content })}
                                        placeholder="Edit your job description..."
                                    />
                                </div>

                                <div className="space-y-3 px-2 shrink-0">
                                    <label className="text-xs font-bold text-slate-500">Required Skills</label>
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">rocket_launch</span>
                                        <input type="text" className="w-full pl-14 pr-6 py-4.5 rounded-2xl border border-slate-100 outline-none font-semibold text-sm bg-slate-50/30 focus:bg-white transition-all" value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 grid grid-cols-12 overflow-hidden h-full"
                        >
                            <div className="col-span-4 border-r border-slate-50 p-12 bg-slate-50/20">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Application Form</h1>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10">Customize the information you need from candidates. Choose field types and set requirements.</p>
                                <button onClick={() => {
                                    const newField: ApplicationField = {
                                        id: Date.now().toString(),
                                        label: 'New Question',
                                        type: 'text',
                                        icon: 'help_outline',
                                        is_required: false
                                    };
                                    setFormData(prev => ({ ...prev, application_fields: [...prev.application_fields, newField] }));
                                }} className="w-full py-4.5 rounded-2xl bg-[#7C3AED] text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-[#6D28D9] transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-rounded text-xl">add_circle</span>
                                    Add New Question
                                </button>
                            </div>
                            <div className="col-span-8 p-12 overflow-y-auto no-scrollbar">
                                <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                                    {formData.application_fields.map((field) => (
                                        <div key={field.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#7C3AED]/30 transition-all">
                                            <div className="flex items-center gap-5 flex-1">
                                                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#7C3AED] group-hover:bg-indigo-50/50 transition-all"><span className="material-symbols-rounded text-xl">{field.icon}</span></div>
                                                <div className="flex-1 grid grid-cols-2 gap-6 items-center">
                                                    <input
                                                        type="text"
                                                        className="bg-transparent border-none outline-none text-[15px] font-bold text-slate-800 p-0 focus:text-[#7C3AED] transition-colors"
                                                        value={field.label}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f) }))}
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest shrink-0">Type</span>
                                                        <select
                                                            className="bg-slate-50 border-none outline-none text-[11px] font-bold text-slate-500 uppercase px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
                                                            value={field.type}
                                                            onChange={(e) => {
                                                                const type = e.target.value as any;
                                                                const icons: Record<string, string> = { text: 'text_fields', number: 'pin', boolean: 'toggle_on', file: 'description', email: 'alternate_email' };
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, type, icon: icons[type] || 'help_outline' } : f)
                                                                }))
                                                            }}
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="email">Email</option>
                                                            <option value="number">Number</option>
                                                            <option value="boolean">Yes/No</option>
                                                            <option value="file">File</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 ml-10">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${field.is_required ? 'text-emerald-500' : 'text-slate-300'}`}>{field.is_required ? 'Required' : 'Optional'}</span>
                                                    <button onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, is_required: !f.is_required } : f) }))} className={`w-11 h-6 rounded-full flex items-center px-1 transition-all ${field.is_required ? 'bg-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full transition-all ${field.is_required ? 'translate-x-5' : 'translate-x-0'}`}></div></button>
                                                </div>
                                                <button onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.filter(f => f.id !== field.id) }))} className="w-9 h-9 rounded-lg hover:bg-rose-50 text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center"><span className="material-symbols-rounded text-xl">close</span></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 grid grid-cols-12 overflow-hidden h-full"
                        >
                            <div className="col-span-4 border-r border-slate-50 p-12 bg-slate-50/20">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Hiring Process</h1>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10">Define the stages of your evaluation lifecycle. Sequence rounds for an optimal applicant journey.</p>
                                <button onClick={() => {
                                    const newStage: WorkflowStage = {
                                        id: Date.now().toString(),
                                        name: 'New Interview Node',
                                        type: 'Interview',
                                        icon: 'groups'
                                    };
                                    setFormData(prev => ({ ...prev, workflow_stages: [...prev.workflow_stages, newStage] }));
                                }} className="w-full py-4.5 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-rounded text-xl">add_task</span>
                                    Add Hiring Round
                                </button>
                            </div>
                            <div className="col-span-8 p-12 overflow-y-auto no-scrollbar flex flex-col items-center">
                                <div className="w-full max-w-2xl space-y-4">
                                    {formData.workflow_stages.map((node, idx) => (
                                        <div key={node.id} className="group relative flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-[#7C3AED] hover:shadow-lg transition-all">
                                            <div className="flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity absolute -left-10">
                                                <button disabled={idx === 0} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx - 1]] = [newStages[idx - 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-[#7C3AED] disabled:opacity-20 shadow-sm"><span className="material-symbols-rounded text-base">expand_less</span></button>
                                                <button disabled={idx === formData.workflow_stages.length - 1} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx + 1]] = [newStages[idx + 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-[#7C3AED] disabled:opacity-20 shadow-sm"><span className="material-symbols-rounded text-base">expand_more</span></button>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">0{idx + 1}</div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 p-0 focus:text-[#7C3AED] transition-colors"
                                                    value={node.name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, name: e.target.value } : s) }))}
                                                />
                                                <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">{node.type}</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-200"></span>
                                                    <span className="material-symbols-rounded text-sm">{node.icon}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.filter(s => s.id !== node.id) }))} className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center"><span className="material-symbols-rounded text-lg">close</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-3xl p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] p-16 text-center shadow-2xl relative overflow-hidden"
                        >
                            <div className="relative z-10 w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20"><span className="material-symbols-rounded text-5xl">check_circle</span></div>
                            <h2 className="relative z-10 text-4xl font-bold text-slate-900 tracking-tight mb-4">Job Updated!</h2>
                            <p className="relative z-10 text-sm text-slate-400 font-medium leading-relaxed mb-12">Synchronization successful. Your mission parameters are active.</p>
                            <div className="relative z-10 flex flex-col gap-3">
                                <button onClick={() => router.push("/enterprise/jobs")} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl">Back to Inventory</button>
                                <button onClick={() => setShowSuccessModal(false)} className="w-full py-5 border-2 border-slate-50 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">Continue Editing</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
