"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";

export default function PublicJobPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [job, setJob] = useState<any>(null);
    const [orgName, setOrgName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applied, setApplied] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    const fetchJobDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/jobs/${id}`, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.ok) {
                const data = await res.json();
                setJob(data.job);
                setOrgName(data.organization);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();

            // Add dynamic fields
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            if (resumeFile) {
                // Find if there is a file field in application_fields
                const fileField = job.application_fields?.find((f: any) => f.type === 'file');
                const fieldName = fileField ? fileField.label.toLowerCase().replace(/\s+/g, '_') : 'resume';
                data.append(fieldName, resumeFile);
            }

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/public/jobs/${id}/apply`, {
                method: "POST",
                body: data
            });
            if (res.ok) {
                setApplied(true);
            } else {
                alert("Failed to submit application");
            }
        } catch (error) {
            console.error("Error applying:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="animate-spin material-icons-outlined text-indigo-600 text-4xl">sync</div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                    <span className="material-icons-outlined text-4xl">search_off</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Job Not Found</h1>
                <p className="text-slate-500 max-w-sm mb-8">The requisition you are looking for may have been closed or moved.</p>
                <button
                    onClick={() => router.push("/")}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100"
                >
                    Back to Homepage
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans">
            {/* Top Navigation / Brand */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-[95%] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl overflow-hidden">
                            {(typeof orgName === 'object' && (orgName as any).logo_url) ? (
                                <img src={(orgName as any).logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                (typeof orgName === 'object' ? (orgName as any).name?.[0] : (orgName?.[0] || 'A')).toUpperCase()
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 leading-tight">Career Portal</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {typeof orgName === 'object' ? (orgName as any).name : orgName} 
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[95%] mx-auto px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Job Details */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                        <div className="relative z-10 flex flex-wrap items-center gap-3 mb-6">
                            {(typeof orgName === 'object' && (orgName as any).logo_url) && (
                                <img src={(orgName as any).logo_url} className="h-8 object-contain mb-2 block" alt="Company Logo" />
                            )}
                            <div className="w-full"></div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {job.job_type || "Full Time"}
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {job.work_mode || "On-Site"}
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Currently Hiring
                            </span>
                        </div>

                        <h1 className="relative z-10 text-4xl font-black text-slate-900 tracking-tight mb-4 leading-[1.1]">{job.title}</h1>

                        <div className="relative z-10 flex flex-wrap items-center gap-6 text-slate-500 font-bold text-sm mb-10">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-300">location_on</span>
                                {job.location || "Remote"}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-300">work</span>
                                {job.experience_min || 0}-{job.experience_max || '5+'} Yrs Exp
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-300">payments</span>
                                {job.salary_min ? `${job.salary_currency || 'INR'} ${job.salary_min.toLocaleString()}` : 'Competitive'}
                                {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : ''}
                                <span className="text-[10px] text-slate-400">/ {job.salary_frequency || 'yr'}</span>
                            </div>
                        </div>

                        <div className="relative z-10 border-t border-slate-50 pt-10 space-y-10">
                            <div>
                                <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">About the Role</h3>
                                <div className="text-slate-600 font-medium leading-[1.7] max-w-none">
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
                                    <div
                                        className="prose-custom"
                                        dangerouslySetInnerHTML={{ __html: job.description }}
                                    />
                                </div>

                            </div>

                            {job.required_skills && job.required_skills.length > 0 && (
                                <div>
                                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Required Competencies</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 font-bold text-xs uppercase tracking-wider">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Application Form */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[40px] p-10 shadow-xl shadow-slate-200/50 sticky top-32 group overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                        {applied ? (
                            <div className="relative z-10 text-center py-10 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                    <span className="material-icons-outlined text-4xl">check</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3">Application Sent!</h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                    Thank you for your interest. The recruiting team at {typeof orgName === 'object' ? (orgName as any).name : (orgName || "our team")} has received your profile and will be in touch shortly.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="relative z-10 mb-8">
                                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Apply Now</h2>
                                    <p className="text-indigo-300 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                                        Fast-track your application today
                                    </p>
                                </div>

                                <form onSubmit={handleApply} className="relative z-10 space-y-4">
                                    {(job.application_fields && job.application_fields.length > 0 ? job.application_fields : [
                                        { id: '1', label: 'Full Name', type: 'text', icon: 'person', is_required: true },
                                        { id: '2', label: 'Email Address', type: 'email', icon: 'alternate_email', is_required: true },
                                        { id: '3', label: 'Key Skills', type: 'text', icon: 'bolt', is_required: false },
                                        { id: '4', label: 'Resume / CV', type: 'file', icon: 'description', is_required: true }
                                    ]).map((field: any) => {
                                        const fieldKey = field.label.toLowerCase().replace(/\s+/g, '_');

                                        if (field.type === 'file') {
                                            return (
                                                <div key={field.id} className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
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
                                                        <div className={`w-full px-4 py-3 rounded-xl border border-dashed transition-all flex items-center gap-3 ${resumeFile
                                                            ? "bg-indigo-500/20 border-indigo-500/50"
                                                            : "bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20"
                                                            }`}>
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${resumeFile ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"
                                                                }`}>
                                                                <span className="material-icons-outlined text-[18px]">
                                                                    {resumeFile ? "description" : "upload_file"}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-xs font-bold truncate ${resumeFile ? "text-white" : "text-slate-400"}`}>
                                                                    {resumeFile ? resumeFile.name : `Upload ${field.label}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={field.id} className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                                <div className="relative">
                                                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">{field.icon || 'edit'}</span>
                                                    <input
                                                        type={field.type === 'email' ? 'email' : 'text'}
                                                        placeholder={`Enter ${field.label}`}
                                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all text-white font-bold text-sm placeholder:text-slate-600"
                                                        value={formData[fieldKey] || ""}
                                                        onChange={e => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                                        required={field.is_required}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                                    >
                                        {isSubmitting ? (
                                            <span className="animate-spin material-icons-outlined text-[18px]">sync</span>
                                        ) : (
                                            <span className="material-icons-outlined text-[18px]">send</span>
                                        )}
                                        {isSubmitting ? "Sending..." : "Submit Application"}
                                    </button>
                                </form>

                                <p className="relative z-10 text-[10px] text-slate-500 text-center mt-8 font-medium">
                                    By submitting, you agree to share your profile details with {typeof orgName === 'object' ? (orgName as any).name : (orgName || "our organization")}.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-slate-100 py-12 mt-12 bg-white">
                <div className="max-w-[95%] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Powered by <span className="text-indigo-600">Academik.ai</span> Corporate Excellence
                    </p>
                    <div className="flex items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
