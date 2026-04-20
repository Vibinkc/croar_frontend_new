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

export default function CreateJobPage() {
    const { token } = useAuth();
    const router = useRouter();
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
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, company_id: data[0].id }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchCompanies();
            fetchEmailTemplates();
        }
    }, [token, fetchCompanies, fetchEmailTemplates]);


    const steps = [
        { id: 1, name: "Job Details", icon: "ClipboardList" },
        { id: 2, name: "Application", icon: "Settings" },
        { id: 3, name: "Workflow", icon: "Network" }
    ];

    const handleSubmit = async () => {
        if (isExperienceInvalid || isSalaryInvalid) return;
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
                experience_min: parseInt(formData.experience_min),
                experience_max: parseInt(formData.experience_max),
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
    };

    const generateAIDescription = async () => {
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
    };

    const isExperienceInvalid = parseInt(formData.experience_max) < parseInt(formData.experience_min);
    const isSalaryInvalid = formData.salary_min && formData.salary_max && parseFloat(formData.salary_max) < parseFloat(formData.salary_min);

    const STAGE_TYPES = [
        { name: 'Screening', icon: 'Search' },
        { name: 'Aptitude', icon: 'Brain' },
        { name: 'Coding', icon: 'Code' },
        { name: 'Technical Interview', icon: 'Zap' },
        { name: 'HR Interview', icon: 'Users' },
        { name: 'Final Selection', icon: 'ShieldCheck' }
    ];

    const canGoNext = () => currentStep === 1 ? (formData.title && !isExperienceInvalid && !isSalaryInvalid) : true;

    return (
        <div className="h-full min-h-screen bg-[#FDFDFF] flex flex-col p-4 animate-in fade-in duration-700 overflow-hidden relative">
            {/* Ultra-Compact Header */}
            <div className="flex items-center justify-between mb-6 px-1 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none  ">Create Job</h1>
                        <p className="text-[9px] text-slate-400 font-bold  tracking-[0.2em] mt-1.5 opacity-60">Job Details</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center bg-slate-100/40 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm">
                    {steps.map((step) => (
                        <button
                            key={step.id}
                            disabled={step.id > currentStep && !canGoNext()}
                            onClick={() => canGoNext() && setCurrentStep(step.id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all ${currentStep === step.id ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-600 hover:text-slate-800"}`}
                        >
                            <span className={`text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-xl border ${currentStep === step.id ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-slate-300 bg-slate-200 text-slate-600"}`}>{step.id}</span>
                            <span className="text-[9px] font-black  ">{step.name}</span>
                        </button>
                    ))}
                </div>

                <button
                    disabled={!canGoNext()}
                    className="h-11 px-6 rounded-xl bg-indigo-600 text-white text-[10px] font-black   shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 group disabled:opacity-40"
                    onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()}
                >
                    {isSubmitting ? "Saving..." : currentStep === 3 ? "Create Job" : "Next Step"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 bg-slate-50/50 overflow-y-auto p-4 md:p-8 no-scrollbar relative">
                            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                                {/* Left Form Column */}
                                <div className="lg:col-span-4 space-y-6 flex flex-col">
                                    {/* Core Details Card */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Job Profile</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Core listing details</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 pt-1">
                                            <div className="space-y-1.5 relative">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1">Job Title <span className="text-rose-500">*</span></label>
                                                <input type="text" placeholder="e.g. Senior Frontend Engineer" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white font-semibold text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-300" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                            </div>

                                            {companies.length > 0 && (
                                                <div className="space-y-1.5 relative">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Company</label>
                                                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none cursor-pointer" value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })}>
                                                        {companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Logistics Card */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 relative overflow-hidden group">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Work Arrangement</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Work mode & location</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Type</label>
                                                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none cursor-pointer" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                                        <option>Full Time</option><option>Part Time</option><option>Contract</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Mode</label>
                                                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none cursor-pointer" value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                                        <option>On-Site</option><option>Remote</option><option>Hybrid</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 relative">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1">Location</label>
                                                <input type="text" placeholder="e.g. San Francisco, CA" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white font-semibold text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-300" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements Card */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 relative overflow-hidden group">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <Calculator className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Requirements</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Experience & compensation</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Min Exp (Yrs)</label>
                                                    <input type="number" min="0" className={`w-full px-4 py-3 rounded-xl border ${isExperienceInvalid ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white'} font-semibold text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none`} value={formData.experience_min} onChange={e => setFormData({ ...formData, experience_min: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Max Exp (Yrs)</label>
                                                    <input type="number" min="0" className={`w-full px-4 py-3 rounded-xl border ${isExperienceInvalid ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white'} font-semibold text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none`} value={formData.experience_max} onChange={e => setFormData({ ...formData, experience_max: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Min Salary (LPA)</label>
                                                    <input type="number" min="0" placeholder="5" className={`w-full px-4 py-3 rounded-xl border ${isSalaryInvalid ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white'} font-semibold text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-300`} value={formData.salary_min} onChange={e => setFormData({ ...formData, salary_min: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Max Salary (LPA)</label>
                                                    <input type="number" min="0" placeholder="15" className={`w-full px-4 py-3 rounded-xl border ${isSalaryInvalid ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white'} font-semibold text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-300`} value={formData.salary_max} onChange={e => setFormData({ ...formData, salary_max: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Description Area */}
                                <div className="lg:col-span-8 flex flex-col min-h-[600px] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">Job Description & Skills</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Outline the responsibilities and tech stack</p>
                                            </div>
                                        </div>
                                        <button onClick={generateAIDescription} disabled={isGeneratingAI} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none">
                                            {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {isGeneratingAI ? 'Generating...' : 'Auto Draft with AI'}
                                        </button>
                                    </div>

                                    <div className="flex-1 flex flex-col border-b border-slate-200 overflow-y-auto">
                                        <JobEditor content={formData.description} onChange={(content) => setFormData({ ...formData, description: content })} placeholder="Detail the role, responsibilities, and ideal candidate profile here..." />
                                    </div>

                                    <div className="p-6 bg-slate-50 shrink-0">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 ml-1">Required Tech Stack <span className="font-medium opacity-60">(Comma Separated)</span></label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <AtSign className="w-4 h-4" />
                                                </div>
                                                <input type="text" className="w-full pl-11 pr-5 py-3 rounded-xl border border-slate-200/80 outline-none font-semibold text-slate-800 text-sm bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm placeholder:text-slate-300" placeholder="e.g. React, Node.js, Python, AWS" value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 grid grid-cols-12 overflow-hidden h-full">
                            <div className="col-span-4 border-r border-slate-100 p-8 bg-slate-50/30 overflow-y-auto no-scrollbar flex flex-col gap-6">
                                {/* Header */}
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Application Form</h1>
                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Design the form candidates will fill out when applying for this role.</p>
                                </div>

                                {/* Add Question Button */}
                                <button onClick={() => {
                                    const newField: ApplicationField = { id: Date.now().toString(), label: 'New Question', type: 'text', icon: 'Type', is_required: false };
                                    setFormData(prev => ({ ...prev, application_fields: [...prev.application_fields, newField] }));
                                }} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                                    <CirclePlus className="w-4 h-4" />
                                    Add Question
                                </button>

                                {/* Form Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
                                        <div className="text-2xl font-black text-indigo-600">{formData.application_fields.length}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Total Fields</div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
                                        <div className="text-2xl font-black text-emerald-600">{formData.application_fields.filter(f => f.is_required).length}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Required</div>
                                    </div>
                                </div>

                                {/* Field Types Guide */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Field Types</p>
                                    {[
                                        { type: 'Text', color: 'bg-blue-50 text-blue-600', desc: 'Short or long text answers' },
                                        { type: 'Email', color: 'bg-purple-50 text-purple-600', desc: 'Validated email address' },
                                        { type: 'Number', color: 'bg-orange-50 text-orange-600', desc: 'Numeric value input' },
                                        { type: 'File', color: 'bg-teal-50 text-teal-600', desc: 'Document or resume upload' },
                                        { type: 'Boolean', color: 'bg-rose-50 text-rose-600', desc: 'Yes / No toggle' },
                                    ].map(item => (
                                        <div key={item.type} className="flex items-center gap-3">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${item.color} shrink-0 w-14 text-center`}>{item.type}</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                                        </div>
                                    ))}
                                </div>


                            </div>
                            <div className="col-span-8 p-8 overflow-y-auto no-scrollbar">
                                <div className="flex flex-col gap-3 max-w-3xl mx-auto pb-10">
                                    {formData.application_fields.map((field) => (
                                        <div key={field.id} className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shadow-inner"><Pin className="w-4 h-4" /></div>
                                                <div className="flex-1 grid grid-cols-2 gap-4 items-center">
                                                    <input type="text" className="bg-transparent border-none outline-none text-[13px] font-black text-slate-800 p-0 focus:text-indigo-600 transition-colors  " value={field.label} onChange={(e) => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f) }))} />
                                                    <select className="bg-slate-50 border-none outline-none text-[9px] font-black text-slate-400  px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-all w-32" value={field.type} onChange={(e) => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, type: e.target.value as ApplicationField['type'] } : f) }))}>
                                                        <option value="text">Text</option><option value="email">Email</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="file">File</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 ml-6">
                                                <button onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.map(f => f.id === field.id ? { ...f, is_required: !f.is_required } : f) }))} className={`px-2.5 py-1 rounded-xl text-[8px] font-black   border transition-all ${field.is_required ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>{field.is_required ? 'Required' : 'Optional'}</button>
                                                <button onClick={() => setFormData(prev => ({ ...prev, application_fields: prev.application_fields.filter(f => f.id !== field.id) }))} className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 grid grid-cols-12 overflow-hidden h-full">
                            <div className="col-span-4 border-r border-slate-100 p-8 bg-slate-50/30 overflow-y-auto no-scrollbar flex flex-col gap-6">
                                {/* Header */}
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Hiring Process</h1>
                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Define the stages candidates go through from application to final selection.</p>
                                </div>

                                {/* Add Stage Button */}
                                <button onClick={() => {
                                    const maxId = Math.max(0, ...formData.workflow_stages.map(s => parseInt(s.id) || 0));
                                    const newStage: WorkflowStage = { id: (maxId + 1).toString(), name: `Stage ${maxId + 1}`, type: 'Technical Interview', icon: 'Zap' };
                                    setFormData(prev => ({ ...prev, workflow_stages: [...prev.workflow_stages, newStage] }));
                                }} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                                    <ListPlus className="w-4 h-4" />
                                    Add Stage
                                </button>

                                {/* Stage Stats */}
                                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
                                    <div className="text-2xl font-black text-indigo-600">{formData.workflow_stages.length}</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Total Stages</div>
                                </div>

                                {/* Stage Types Guide */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Stage Types</p>
                                    {[
                                        { type: 'Screening', color: 'bg-blue-50 text-blue-600', desc: 'Initial candidate filtering' },
                                        { type: 'Aptitude', color: 'bg-purple-50 text-purple-600', desc: 'Cognitive & reasoning tests' },
                                        { type: 'Coding', color: 'bg-orange-50 text-orange-600', desc: 'Technical coding assessment' },
                                        { type: 'Tech Interview', color: 'bg-teal-50 text-teal-600', desc: 'Deep technical evaluation' },
                                        { type: 'HR Interview', color: 'bg-rose-50 text-rose-600', desc: 'Culture & fit discussion' },
                                        { type: 'Final Selection', color: 'bg-emerald-50 text-emerald-600', desc: 'Final hiring decision' },
                                    ].map(item => (
                                        <div key={item.type} className="flex items-center gap-3">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${item.color} shrink-0 w-20 text-center`}>{item.type}</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                                        </div>
                                    ))}
                                </div>


                            </div>
                            <div className="col-span-8 p-8 overflow-y-auto no-scrollbar flex flex-col items-center">
                                <div className="w-full max-w-lg space-y-3 pb-10">
                                    {formData.workflow_stages.map((node, idx) => (
                                        <div key={node.id} className="group relative flex items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-indigo-600 hover:shadow-lg transition-all">
                                            <div className="flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity absolute -left-8">
                                                <button disabled={idx === 0} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx - 1]] = [newStages[idx - 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-600 disabled:opacity-10 transition-all"><ChevronUp className="w-4 h-4" /></button>
                                                <button disabled={idx === formData.workflow_stages.length - 1} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx + 1]] = [newStages[idx + 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-600 disabled:opacity-10 transition-all"><ChevronDown className="w-4 h-4" /></button>
                                            </div>
                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black  shrink-0 shadow-lg">#0{idx + 1}</div>
                                            <div className="flex-1 space-y-2">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-[13px] font-black text-slate-800 p-0 focus:text-indigo-600 transition-colors  " value={node.name} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, name: e.target.value } : s) }))} />
                                                <div className="flex items-center gap-4">
                                                    <select className="bg-slate-50 border-none outline-none text-[9px] font-black text-slate-400  px-2.5 py-1 rounded-xl cursor-pointer hover:bg-slate-100 transition-all font-mono" value={node.type} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, type: e.target.value } : s) }))}>
                                                        {STAGE_TYPES.map(t => (<option key={t.name} value={t.name}>{t.name}</option>))}
                                                    </select>
                                                </div>
                                            </div>
                                            <button onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.filter(s => s.id !== node.id) }))} className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center active:scale-95"><X className="w-4 h-4" /></button>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden border border-slate-100">
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20"><CircleCheck className="w-10 h-10" /></div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2   leading-none">Job Created</h2>
                            <p className="text-[10px] text-slate-400 font-bold   leading-relaxed mb-8 opacity-60">The new job has been created and is now live.</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => router.push("/enterprise/jobs")} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px]   hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    View Job Board
                                </button>
                                <button onClick={() => window.open(`${window.location.origin}/jobs/${createdJobId}`, '_blank')} className="w-full py-4 border border-slate-100 rounded-xl text-slate-400 font-black text-[10px]   hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    View Job Application
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
