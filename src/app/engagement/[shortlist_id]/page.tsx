"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { 
    Briefcase, 
    Building, 
    MapPin, 
    ChevronRight, 
    CheckCircle2, 
    DollarSign, 
    Clock, 
    FileText,
    ArrowLeft,
    Sparkles,
    UserCheck,
    Send
} from "lucide-react";

export default function CandidateEngagementPage() {
    const params = useParams();
    const router = useRouter();
    const shortlistId = params.shortlist_id as string;
    const { t } = useI18n();

    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<string | null>(null);
    const [shortlist, setShortlist] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        previous_company: "",
        current_salary: "",
        expected_salary: "",
        notice_period: "",
        total_experience: "",
        relevant_experience: "",
        work_preference: "Remote",
        top_skills: "",
        reason_for_change: "",
    });

    useEffect(() => {
        if (shortlistId) {
            fetchEngagementDetails();
        }
        // Capture source from URL
        const searchParams = new URLSearchParams(window.location.search);
        const urlSource = searchParams.get('source');
        if (urlSource) setSource(urlSource);
    }, [shortlistId]);

    const fetchEngagementDetails = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/enterprise/sourcing/chat/engagement/${shortlistId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.error) {
                    console.error(data.error);
                } else {
                    setShortlist(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch engagement details", e);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/enterprise/sourcing/chat/engagement/${shortlistId}/interest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitted(true);
                setStep(3); // Reveal JD
            }
        } catch (e) {
            console.error("Failed to submit interest", e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold text-sm">{t("candidate.preparingOpportunity")}</p>
                </div>
            </div>
        );
    }

    if (!shortlist || !shortlist.profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 mb-2">{t("candidate.linkExpiredTitle")}</h1>
                    <p className="text-slate-500 text-sm mb-8">{t("candidate.linkExpiredDesc")}</p>
                    <button onClick={() => router.push('/')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm">{t("candidate.goToHomepage")}</button>
                </div>
            </div>
        );
    }

    const { profile, job_title } = shortlist;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
                {/* Branding / Top Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="font-black text-xl tracking-tight text-slate-900">Croar <span className="text-indigo-600">Talent</span></span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("candidate.activeOpportunity")}</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-50/50"
                        >
                            <div className="mb-8">
                                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                                    {t("candidate.helloName", { name: profile.full_name })} <br/>
                                    {t("candidate.opportunityAwaits")}
                                </h1>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    {t("candidate.impressedIntro")}<strong className="text-indigo-600">{job_title}</strong>{t("candidate.impressedOutro")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{t("candidate.role")}</h4>
                                        <p className="text-xs font-bold text-slate-400">{job_title}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500">
                                        <UserCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{t("candidate.status")}</h4>
                                        <p className="text-xs font-bold text-slate-400">{t("candidate.directInvitation")}</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setStep(2)}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                            >
                                {t("candidate.getStarted")}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-50/50"
                        >
                            <div className="mb-10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-1">{t("candidate.basicInformation")}</h2>
                                    <p className="text-sm font-medium text-slate-400">{t("candidate.basicInfoDesc")}</p>
                                </div>
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                                    2/3
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="total_experience" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.totalExperience")}</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                id="total_experience"
                                                required
                                                type="number"
                                                name="total_experience"
                                                value={formData.total_experience}
                                                onChange={handleInputChange}
                                                placeholder={t("candidate.egEight")}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="relevant_experience" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.relevantExperience")}</label>
                                        <div className="relative">
                                            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                id="relevant_experience"
                                                required
                                                type="number"
                                                name="relevant_experience"
                                                value={formData.relevant_experience}
                                                onChange={handleInputChange}
                                                placeholder={t("candidate.egFive")}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="previous_company" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.previousCompany")}</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                id="previous_company"
                                                required
                                                name="previous_company"
                                                value={formData.previous_company}
                                                onChange={handleInputChange}
                                                placeholder={t("candidate.egCompany")}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="notice_period" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.noticePeriod")}</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <select
                                                id="notice_period"
                                                required
                                                name="notice_period"
                                                value={formData.notice_period}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none"
                                            >
                                                <option value="">{t("candidate.selectNoticePeriod")}</option>
                                                <option value="Immediate">{t("candidate.immediate")}</option>
                                                <option value="15 Days">{t("candidate.days15")}</option>
                                                <option value="30 Days">{t("candidate.days30")}</option>
                                                <option value="60 Days">{t("candidate.days60")}</option>
                                                <option value="90 Days">{t("candidate.days90")}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="work_preference" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.workPreference")}</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <select
                                                id="work_preference"
                                                required
                                                name="work_preference"
                                                value={formData.work_preference}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none"
                                            >
                                                <option value="Remote">{t("candidate.remote")}</option>
                                                <option value="Hybrid">{t("candidate.hybrid")}</option>
                                                <option value="On-site">{t("candidate.onsite")}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="top_skills" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.topSkills")}</label>
                                    <div className="relative">
                                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            id="top_skills"
                                            required
                                            name="top_skills"
                                            value={formData.top_skills}
                                            onChange={handleInputChange}
                                            placeholder={t("candidate.egSkills")}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="current_salary" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.currentSalary")}</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                id="current_salary"
                                                required
                                                name="current_salary"
                                                value={formData.current_salary}
                                                onChange={handleInputChange}
                                                placeholder={t("candidate.egCurrentSalary")}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="expected_salary" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.expectedSalary")}</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                id="expected_salary"
                                                required
                                                name="expected_salary"
                                                value={formData.expected_salary}
                                                onChange={handleInputChange}
                                                placeholder={t("candidate.egExpectedSalary")}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="reason_for_change" className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{t("candidate.reasonForChange")}</label>
                                    <textarea
                                        id="reason_for_change"
                                        name="reason_for_change"
                                        value={formData.reason_for_change}
                                        onChange={handleInputChange}
                                        placeholder={t("candidate.reasonPlaceholder")}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {submitting ? t("candidate.saving") : t("candidate.showJobDescription")}
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            {/* Success Alert */}
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-emerald-900 font-black text-sm">{t("candidate.interestRegistered")}</h4>
                                    <p className="text-emerald-700/70 text-xs font-bold">{t("candidate.interestRegisteredDesc")}</p>
                                </div>
                            </div>

                            {/* JD Content Reveal */}
                            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-50/50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-50">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full border border-indigo-100">{t("candidate.fullTime")}</span>
                                            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase rounded-full border border-slate-100">{t("candidate.engineering")}</span>
                                        </div>
                                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{job_title}</h1>
                                        <div className="flex items-center gap-4 text-sm font-bold text-slate-400 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <Building className="w-4 h-4" /> Croar Tech
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" /> {t("candidate.remoteGlobal")}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => router.push(`/jobs/${shortlist.job_id}?email=${profile.email}${source ? `&source=${source}` : ''}`)}
                                        className="py-5 px-10 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                                    >
                                        {t("candidate.finalApplication")}
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-xl font-black text-slate-900 mb-4">{t("candidate.aboutRole")}</h3>
                                    <p className="text-slate-600 leading-relaxed font-medium mb-6">
                                        {t("candidate.aboutRoleDesc", { jobTitle: job_title })}
                                    </p>

                                    <h3 className="text-xl font-black text-slate-900 mb-4">{t("candidate.coreResponsibilities")}</h3>
                                    <ul className="space-y-3 mb-8">
                                        {[
                                            t("candidate.resp1"),
                                            t("candidate.resp2"),
                                            t("candidate.resp3"),
                                            t("candidate.resp4")
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                        <h4 className="text-slate-900 font-black mb-2">{t("candidate.readyNextStep")}</h4>
                                        <p className="text-slate-500 text-sm font-bold mb-6">{t("candidate.readyNextStepDesc")}</p>
                                        <button 
                                            onClick={() => router.push(`/jobs/${shortlist.job_id}?email=${profile.email}${source ? `&source=${source}` : ''}`)}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                        >
                                            {t("candidate.continueToFinalApp")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Credits */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t("candidate.poweredBy")}</p>
                </div>
            </div>
        </div>
    );
}
