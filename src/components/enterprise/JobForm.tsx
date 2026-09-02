"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import JobEditor from "@/components/enterprise/JobEditor";
import { JOB_TEMPLATES, JOB_TEMPLATE_CATEGORIES, findJobTemplate } from "@/components/enterprise/jobTemplates";
import {
    ArrowRight,
    CircleCheck,
    MapPin,
    Sparkles,
    RefreshCcw,
    ClipboardList,
    X,
    LayoutDashboard,
    Eye,
    Calculator,
    ChevronUp,
    CirclePlus,
    ChevronDown,
    ListPlus,
    FileText,
    AtSign,
    Users,
    Network
} from "lucide-react";
import { jetbrainsMono, Button, Card, CardHeader, Field, Input, Textarea, Select, PageHeader, cn } from "@/components/ds";

// Remove the temporary <mark> highlight tags the AI adds around newly-inserted JD text, keeping the
// inner text. Used before persisting a job and before re-sending the JD to the AI, so highlights are
// a display-only cue and never accumulate in the stored description.
const stripMarks = (html: string): string =>
    (html || "").replace(/<mark\b[^>]*>/gi, "").replace(/<\/mark>/gi, "");

interface ApplicationField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'file' | 'email';
    icon: string;
    is_required: boolean;
}

interface StageAssessment {
    type: "APTITUDE" | "CODING" | "BOTH" | "VIDEO";
    topic: string;
    criteria: string;
    question_count: number;
    test_duration: number;
}

interface WorkflowStage {
    id: string;
    name: string;
    type: string;
    icon: string;
    email_template_id?: string;
    /** Draft only. Stripped from the job payload and POSTed after creation, because every
     *  automation is keyed to a job_requirement_id that does not exist while the wizard is open. */
    assessment?: StageAssessment | null;
    interview?: StageInterview | null;
    email?: StageEmail | null;
}

const ASSESSMENT_TYPES: StageAssessment["type"][] = ["APTITUDE", "CODING", "BOTH", "VIDEO"];

interface StageInterview {
    /** String(50) on the model, defaulting to GMEET. AI runs Croar's own interviewer. */
    interview_type: "GMEET" | "TEAMS" | "AI";
    interviewer_email: string;
    daily_limit: number;
}

interface StageEmail {
    /** MailAutomationCreate requires a template; there is no "just send something" mode. */
    template_id: string;
}

const INTERVIEW_TYPES: StageInterview["interview_type"][] = ["GMEET", "TEAMS", "AI"];

/** Stage types that normally carry a test, used only to pre-pick a sensible assessment type. */
const ASSESSMENT_FOR_STAGE: Record<string, StageAssessment["type"]> = {
    Aptitude: "APTITUDE",
    Coding: "CODING",
};

const DEFAULT_APPLICATION_FIELDS: ApplicationField[] = [
    { id: '1', label: 'Full Name', type: 'text', icon: 'person', is_required: true },
    { id: '2', label: 'Email Address', type: 'email', icon: 'mail', is_required: true },
    { id: '3', label: 'Phone Number', type: 'text', icon: 'call', is_required: false },
    { id: '4', label: 'Resume / CV', type: 'file', icon: 'description', is_required: true },
    { id: '5', label: 'Portfolio URL', type: 'text', icon: 'link', is_required: false }
];

// Currencies a job can pay in. The job defaults to the hiring organisation's currency but can
// differ from it — an India-based company hiring one role in Kuala Lumpur pays that job in MYR.
const SALARY_CURRENCIES = ["INR", "MYR", "SGD", "USD", "EUR", "GBP", "AED", "AUD", "JPY", "KRW"];
// How the salary figure is expressed. Stored all along as salary_frequency but never shown,
// so every job silently claimed "Yearly" whatever the employer actually meant.
const SALARY_FREQUENCIES = ["Yearly", "Monthly", "Weekly", "Daily", "Hourly"];
// The salary inputs must say what the number MEANS. They were hardcoded to "per year", so
// choosing Daily still labelled the field "(INR per year)" — the wrong unit against the
// user's own selection.
const FREQUENCY_LABEL_KEY: Record<string, string> = {
    Yearly: "perYear", Monthly: "perMonth", Weekly: "perWeek", Daily: "perDay", Hourly: "perHour",
};

const DEFAULT_WORKFLOW_STAGES: WorkflowStage[] = [
    { id: '1', name: 'Initial Screening', type: 'Screening', icon: 'search' }
];

interface Company {
    id: string;
    name: string;
    currency?: string;
    country?: string;
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
    const { t: tr } = useI18n();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [additionalJD, setAdditionalJD] = useState("");
    const [isEnhancingJD, setIsEnhancingJD] = useState(false);
    const [highlightAdd, setHighlightAdd] = useState(false); // pulse the "Add more with AI" panel
    const [justAdded, setJustAdded] = useState(false); // brief success confirmation after an add
    const addPanelRef = useRef<HTMLDivElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showRoundsChoice, setShowRoundsChoice] = useState(false);
    // How a NEW job starts: from a blank form, or pre-filled from a starter template.
    // "choice" = the two-card picker, "template" = the template dropdown, null = the form itself.
    // Edit mode never asks — the job already has its content.
    const [startChoice, setStartChoice] = useState<"choice" | "template" | null>(isEdit ? null : "choice");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [isHandingOff, setIsHandingOff] = useState(false);
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
        headcount: "1",
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
                    // Money is shown and stored in the ORGANISATION's currency. This used to be
                    // left at the hardcoded "INR", so a Malaysia-based company's salary was
                    // labelled and published as rupees.
                    setFormData(prev => ({
                        ...prev,
                        company_id: data[0].id,
                        salary_currency: data[0].currency || prev.salary_currency,
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        }
    }, [token, isEdit]);

    const fetchJobDetails = useCallback(async () => {
        setIsLoading(true);
        setLoadError(false);
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
                    headcount: data.headcount?.toString() || "1",
                    description: data.description || "",
                    required_skills: data.required_skills?.join(", ") || "",
                    auto_fit_analysis: data.auto_fit_analysis || false,
                    status_id: data.status_id || 2,
                    company_id: data.company_id || "",
                    application_fields: (data.application_fields && data.application_fields.length > 0) ? data.application_fields : DEFAULT_APPLICATION_FIELDS,
                    workflow_stages: (data.workflow_stages && data.workflow_stages.length > 0) ? data.workflow_stages : DEFAULT_WORKFLOW_STAGES
                });
            } else {
                // Don't silently leave the form on its DEFAULT values — that would let the user
                // submit and overwrite the real job with defaults. Surface a not-found/error state.
                setLoadError(true);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
            setLoadError(true);
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


    // The application form is edited on the job itself (Application form tab), so the wizard no
    // longer asks for it up front — a job's questions can be shaped after it exists.
    const steps = [
        { id: 1, name: tr("jobForm.stepJobDetails"), icon: "ClipboardList" },
        { id: 2, name: tr("jobForm.stepWorkflow"), icon: "Network" }
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
                    salary_currency: formData.salary_currency, frequency: formData.salary_frequency,
                    salary_frequency: formData.salary_frequency,
                    salary_min: formData.salary_min ? Number.parseFloat(formData.salary_min) : null,
                    salary_max: formData.salary_max ? Number.parseFloat(formData.salary_max) : null,
                    experience_min: formData.experience_min ? Number.parseInt(formData.experience_min) : 0,
                    experience_max: formData.experience_max ? Number.parseInt(formData.experience_max) : 5,
                    headcount: formData.headcount ? Number.parseInt(formData.headcount) : 1,
                    description: stripMarks(formData.description),
                    required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(s => s),
                    auto_fit_analysis: formData.auto_fit_analysis,
                    status_id: formData.status_id,
                    company_id: formData.company_id,
                    application_fields: formData.application_fields,
                    // Send only the fields the job endpoint owns. `assessment` is wizard-only draft
                    // state — it becomes a real automation after the job exists, not part of the job.
                    workflow_stages: formData.workflow_stages.map(s => ({
                        id: s.id, name: s.name, type: s.type, icon: s.icon, email_template_id: s.email_template_id,
                    }))
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
                    alert(error.detail || tr("jobForm.failedUpdateJob"));
                }
            } catch (error) {
                alert(tr("jobForm.networkError"));
            } finally {
                setIsSubmitting(false);
            }
        } else {
            if (isExperienceInvalid || isSalaryInvalid) return;
            setIsSubmitting(true);
            try {
                const payload = {
                    ...formData,
                    description: stripMarks(formData.description),
                    salary_min: formData.salary_min ? Number.parseFloat(formData.salary_min) : null,
                    salary_max: formData.salary_max ? Number.parseFloat(formData.salary_max) : null,
                    experience_min: Number.parseInt(formData.experience_min),
                    experience_max: Number.parseInt(formData.experience_max),
                    headcount: Number.parseInt(formData.headcount) || 1,
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
                    await armStageAssessments(data.id);
                    // Land on the job itself rather than a success modal. The job page is where the
                    // next actions actually live — add a candidate, source, post to boards — so a
                    // modal offering a subset of them just adds a step between the recruiter and
                    // the work.
                    router.push(`/enterprise/jobs/${data.id}?tab=candidates`);
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
                alert(tr("jobForm.pleaseEnterTitle"));
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
                        existing_description: stripMarks(formData.description),
                        location: formData.location,
                        work_mode: formData.work_mode,
                        experience_min: formData.experience_min,
                        experience_max: formData.experience_max,
                        currency: formData.salary_currency, frequency: formData.salary_frequency
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
                    setHighlightAdd(true);
                } else {
                    // Surface the server's reason (e.g. AI credit exhausted) when it sends one.
                    const err = await res.json().catch(() => null);
                    alert(err?.detail || tr("jobForm.aiGenFailed"));
                }
            } catch (error) {
                console.error("Error generating JD:", error);
                alert(tr("jobForm.networkAiGen"));
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
                    body: JSON.stringify({ title: formData.title, existing_description: stripMarks(formData.description), location: formData.location, work_mode: formData.work_mode, experience_min: formData.experience_min, experience_max: formData.experience_max, currency: formData.salary_currency, frequency: formData.salary_frequency })
                });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({ ...formData, description: data.description, required_skills: data.skills?.join(", ") || formData.required_skills });
                    setHighlightAdd(true);
                } else {
                    // Say so. This branch used to swallow the failure silently, which is why a
                    // failed generation looked like "the AI just didn't do anything".
                    const err = await res.json().catch(() => null);
                    alert(err?.detail || tr("jobForm.aiGenFailed"));
                }
            } catch (error) {
                console.error("Failed to generate AI description:", error);
            } finally {
                setIsGeneratingAI(false);
            }
        }
    };

    // When the panel is highlighted (after a JD is generated / content added), bring it into view
    // and fade the highlight out so the user immediately notices it without scrolling to find it.
    useEffect(() => {
        if (!highlightAdd) return;
        const scrollTimer = setTimeout(() => {
            addPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
        const clearTimer = setTimeout(() => setHighlightAdd(false), 4000);
        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(clearTimer);
        };
    }, [highlightAdd]);

    // Does a real (non-empty) job description exist yet? Only then do we offer "Add more with AI".
    const hasJD = (formData.description || "").replace(/<[^>]*>/g, "").trim().length > 10;

    // Fold the user's extra points into the CURRENT description via AI, preserving what's there.
    const addToJDWithAI = async () => {
        const extra = additionalJD.trim();
        if (!extra) return;
        if (!formData.description || formData.description.replace(/<[^>]*>/g, "").trim().length < 10) {
            alert(tr("jobForm.writeJDFirst"));
            return;
        }
        setIsEnhancingJD(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/generate-jd`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    title: formData.title,
                    // Send a clean copy so prior highlights don't stack; only the new text gets marked.
                    existing_description: stripMarks(formData.description),
                    additional_instructions: extra,
                    location: formData.location,
                    work_mode: formData.work_mode,
                    experience_min: formData.experience_min,
                    experience_max: formData.experience_max,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setFormData((prev) => ({
                    ...prev,
                    description: data.description || prev.description,
                    required_skills: data.skills?.join(", ") || prev.required_skills,
                }));
                setAdditionalJD("");
                setJustAdded(true);
                setHighlightAdd(true);
                setTimeout(() => setJustAdded(false), 2500);
            } else {
                alert(tr("jobForm.aiAddFailed"));
            }
        } catch (error) {
            console.error("Error adding to JD:", error);
            alert(tr("jobForm.networkUpdateDesc"));
        } finally {
            setIsEnhancingJD(false);
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

    // Create the assessment automations the user configured on the Workflow step. Runs once the
    // job exists, since each automation is keyed to its job_requirement_id. Best-effort per
    // stage: one failure must not lose the job that was just created.
    const armStageAssessments = async (newJobId: string) => {
        // stage_index must be the stage's OWN id, not its position. The backend derives
        // JobStageResponse.id from the stored stage id, an application's current_stage holds that
        // same id, and trigger_automations matches on it. Deleting a middle stage leaves a gap
        // (ids 1,3 at positions 1,2), so using the position would arm the wrong round.
        const rounds = formData.workflow_stages
            .map(s => ({ stage: s, index: Number.parseInt(s.id, 10) }))
            .filter(x => Number.isFinite(x.index));

        const post = (path: string, body: Record<string, unknown>) =>
            fetch(`${BACKEND_URL}/api/v1/enterprise/${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body),
            }).catch(() => null);

        const calls: Promise<unknown>[] = [];
        for (const { stage, index } of rounds) {
            const base = { job_requirement_id: newJobId, stage_index: index, stage_name: stage.name };

            const a = stage.assessment;
            if (a?.topic?.trim()) {
                calls.push(post("assessment/", {
                    ...base,
                    type: a.type,
                    topic: a.topic.trim(),
                    criteria: a.criteria?.trim() || "60% to pass",
                    question_count: Number(a.question_count) || 10,
                    test_duration: Number(a.test_duration) || 30,
                    is_enabled: true,
                }));
            }

            const iv = stage.interview;
            if (iv) {
                calls.push(post("interview-automation/", {
                    ...base,
                    criteria: `Interview at ${stage.name}`,
                    interview_type: iv.interview_type,
                    interviewer_email: iv.interviewer_email?.trim() || null,
                    daily_limit: Number(iv.daily_limit) || 5,
                    is_enabled: true,
                }));
            }

            const em = stage.email;
            if (em?.template_id) {
                calls.push(post("automation/", {
                    ...base,
                    criteria: `Email at ${stage.name}`,
                    template_id: em.template_id,
                    is_enabled: true,
                    is_immediate: true,
                }));
            }
        }
        if (calls.length) await Promise.all(calls);
    };

    // Copy a starter template into the form and drop into step 1 to edit it.
    // Deliberately does NOT touch salary_currency or company_id — those come from the hiring
    // organisation, and a generic template must not overwrite an org's own currency.
    const applyTemplate = () => {
        const tpl = findJobTemplate(selectedTemplateId);
        if (!tpl) return;
        setFormData(prev => ({
            ...prev,
            title: tpl.title,
            department: tpl.department,
            job_type: tpl.job_type,
            work_mode: tpl.work_mode,
            experience_min: tpl.experience_min,
            experience_max: tpl.experience_max,
            required_skills: tpl.required_skills,
            description: tpl.description,
            workflow_stages: tpl.stages.map((s, i) => ({
                id: String(i + 1), name: s.name, type: s.type, icon: s.icon,
            })),
        }));
        setStartChoice(null);
    };

    // Rounds step: the user picks who builds the interview rounds.
    //  - "manual": carry on into step 3 and lay the stages out by hand (unchanged behaviour).
    //  - "pilot":  save what steps 1-2 produced as a DRAFT job right now, then hand that job to
    //              Croar Pilot so it can design the rounds and write them back with set_job_rounds.
    //              Saving first is what gives the agent a job_id to act on; Draft keeps the role
    //              off the public board until the rounds actually exist.
    const buildRoundsWithPilot = async () => {
        if (isExperienceInvalid || isSalaryInvalid) return;
        setIsHandingOff(true);
        try {
            const payload = {
                ...formData,
                status_id: 1, // Draft — the job goes live once its rounds are settled.
                description: stripMarks(formData.description),
                salary_min: formData.salary_min ? Number.parseFloat(formData.salary_min) : null,
                salary_max: formData.salary_max ? Number.parseFloat(formData.salary_max) : null,
                experience_min: Number.parseInt(formData.experience_min),
                experience_max: Number.parseInt(formData.experience_max),
                required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(s => s),
            };
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || tr("jobForm.roundsHandoffFailed"));
                return;
            }
            const data = await res.json();
            sessionStorage.setItem("croar_rounds_job", JSON.stringify({
                id: data.id,
                title: formData.title || "",
                skills: formData.required_skills || "",
                description: stripMarks(formData.description) || "",
                autostart: true,
            }));
            router.push("/enterprise/croar-pilot");
        } catch (e) {
            console.error("Could not hand the rounds off to Croar Pilot:", e);
            alert(tr("jobForm.roundsHandoffFailed"));
        } finally {
            setIsHandingOff(false);
        }
    };

    // Hand the just-created job off to sourcing. Both auto-start a JD-based search for THIS job
    // (same as the Pipeline's "Source candidates"):
    //  - "ai":     Croar Pilot auto-starts sourcing from the job's title + JD.
    //  - "manual": the Profile Sourcing page auto-searches from the JD, locked to this job.
    const startSourcing = (mode: "ai" | "manual") => {
        try {
            sessionStorage.setItem("croar_source_job", JSON.stringify({
                id: createdJobId,
                title: formData.title || "",
                skills: formData.required_skills || "",
                description: formData.description || "",
                autostart: true,
            }));
        } catch (e) {
            console.error("Could not hand off to sourcing:", e);
        }
        router.push(
            mode === "ai"
                ? "/enterprise/croar-pilot"
                : `/enterprise/sourcing/projects${createdJobId ? `?job_id=${createdJobId}` : ""}`,
        );
    };

    if (isEdit && isLoading) {
        return (
            <div className="min-h-[60vh] w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[13px] font-medium text-[#8A929E]">{tr("jobForm.loadingDetails")}</span>
                </div>
            </div>
        );
    }

    if (isEdit && loadError) {
        return (
            <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 rounded-[16px] bg-[#FDECEC] text-[#C0383C] flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-rounded text-3xl">error</span>
                    </div>
                    <h2 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-1.5">{tr("jobForm.couldntLoadJob")}</h2>
                    <p className="text-[13.5px] text-[#8A929E] leading-relaxed mb-5">{tr("jobForm.couldntLoadJobDesc")}</p>
                    <div className="flex items-center justify-center gap-2.5">
                        <Button variant="secondary" onClick={() => fetchJobDetails()}>{tr("common.retry")}</Button>
                        <Button onClick={() => router.push("/enterprise/jobs")}>{tr("jobForm.backToJobs")}</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-6 max-w-[1400px] mx-auto w-full h-full flex flex-col gap-6 animate-in fade-in duration-500 relative">
            {/* Header */}
            <PageHeader
                help={<><p>{tr("jobForm.outlineResp")}</p><p>{tr("jobForm.autoDraftAI")}</p></>}
                title={isEdit ? tr("jobForm.editJob") : tr("jobForm.createJob")}
                subtitle={tr("jobForm.stepSubtitle", { step: currentStep, total: steps.length, name: steps.find(s => s.id === currentStep)?.name || tr("jobForm.stepJobDetails") })}
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

                        {/* Once the JD exists the job is worth creating. The application form and
                            interview rounds are refinements, and both are reachable from the job
                            itself — so holding the requisition hostage to them only delays it. */}
                        {!isEdit && currentStep === 1 && (
                            <Button
                                variant="secondary"
                                disabled={!canGoNext() || !formData.description?.trim() || isSubmitting}
                                onClick={handleSubmit}
                                className="shrink-0"
                                title={tr("jobForm.createNowHint")}
                            >
                                {isSubmitting ? tr("jobForm.saving") : tr("jobForm.createNow")}
                            </Button>
                        )}

                        <Button
                            disabled={!canGoNext()}
                            onClick={() => {
                                // Leaving Job Details on a NEW job is where we ask who should
                                // build the interview rounds. Editing an existing job already has
                                // its rounds, so it goes straight through.
                                if (currentStep === 1 && !isEdit) { setShowRoundsChoice(true); return; }
                                if (currentStep < 2) { setCurrentStep(currentStep + 1); return; }
                                handleSubmit();
                            }}
                            className="group shrink-0"
                        >
                            {isSubmitting ? tr("jobForm.saving") : currentStep === 2 ? (isEdit ? tr("jobForm.saveChanges") : tr("jobForm.createJobBtn")) : tr("jobForm.nextStep")}
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
                                                    {tr("jobForm.jobProfile")}
                                                </span>
                                            }
                                            subtitle={tr("jobForm.coreListingDetails")}
                                        />

                                        <div className="space-y-4 pt-1">
                                            {/* 255 is the DB column limit; showing the count stops a long title
                                                being silently rejected as a 422 on save. */}
                                            <Field label={tr("jobForm.jobTitle")} htmlFor="job-title-input" required hint={`${formData.title.length} / 255`}>
                                                <Input id="job-title-input" type="text" maxLength={255} placeholder={tr("jobForm.jobTitlePlaceholder")} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                            </Field>

                                            {companies.length > 0 && (
                                                <Field label={tr("jobForm.company")} htmlFor="company-select">
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
                                                    {tr("jobForm.workArrangement")}
                                                </span>
                                            }
                                            subtitle={tr("jobForm.workModeLocation")}
                                        />

                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label={tr("jobForm.typeLabel")} htmlFor="job-type-select">
                                                    <Select id="job-type-select" className="cursor-pointer" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                                        <option>{tr("jobForm.fullTime")}</option><option>{tr("jobForm.partTime")}</option><option>{tr("jobForm.contract")}</option><option>{tr("jobForm.internship")}</option>
                                                    </Select>
                                                </Field>
                                                <Field label={tr("jobForm.modeLabel")} htmlFor="work-mode-select">
                                                    <Select id="work-mode-select" className="cursor-pointer" value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                                        <option>{tr("jobForm.onSite")}</option><option>{tr("jobForm.remote")}</option><option>{tr("jobForm.hybrid")}</option>
                                                    </Select>
                                                </Field>
                                            </div>
                                            <Field label={tr("jobForm.locationLabel")} htmlFor="location-input">
                                                <Input id="location-input" type="text" placeholder={tr("jobForm.locationPlaceholder")} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
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
                                                    {tr("jobForm.requirements")}
                                                </span>
                                            }
                                            subtitle={tr("jobForm.expComp")}
                                        />

                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label={tr("jobForm.minExpYears")} htmlFor="experience-min-input" error={isExperienceInvalid ? tr("jobForm.maxMustBeMin") : undefined}>
                                                    <Input id="experience-min-input" type="number" min="0" className={cn(jetbrainsMono.className, isExperienceInvalid && errorInputCls)} value={formData.experience_min} onChange={e => setFormData({ ...formData, experience_min: e.target.value })} />
                                                </Field>
                                                <Field label={tr("jobForm.maxExpYears")} htmlFor="experience-max-input">
                                                    <Input id="experience-max-input" type="number" min="0" className={cn(jetbrainsMono.className, isExperienceInvalid && errorInputCls)} value={formData.experience_max} onChange={e => setFormData({ ...formData, experience_max: e.target.value })} />
                                                </Field>
                                            </div>

                                            {/* How many people this requisition hires. Without it, a req for 5
                                                openings looks identical to one, and "positions filled" cannot
                                                be reported. */}
                                            <Field label={tr("jobForm.headcount")} htmlFor="headcount-input" hint={tr("jobForm.headcountHint")}>
                                                <Input id="headcount-input" type="number" min="1" step="1" className={jetbrainsMono.className} value={formData.headcount} onChange={e => setFormData({ ...formData, headcount: e.target.value })} />
                                            </Field>
                                            {/* Which money this job pays in. Defaults to the hiring organisation's
                                                currency, but a single role can differ (an INR company hiring in
                                                Kuala Lumpur pays that job in MYR). */}
                                            <Field label={tr("jobForm.salaryCurrency")} htmlFor="salary-currency-select">
                                                <Select
                                                    id="salary-currency-select"
                                                    value={formData.salary_currency}
                                                    onChange={e => setFormData({ ...formData, salary_currency: e.target.value })}
                                                >
                                                    {(SALARY_CURRENCIES.includes(formData.salary_currency)
                                                        ? SALARY_CURRENCIES
                                                        : [formData.salary_currency, ...SALARY_CURRENCIES]
                                                    ).map(c => (<option key={c} value={c}>{c}</option>))}
                                                </Select>
                                            </Field>
                                            {/* What the salary figure means. Stored since day one but never
                                                shown, so every job silently claimed "Yearly". */}
                                            <Field label={tr("jobForm.salaryFrequency")} htmlFor="salary-frequency-select">
                                                <Select
                                                    id="salary-frequency-select"
                                                    value={formData.salary_frequency}
                                                    onChange={e => setFormData({ ...formData, salary_frequency: e.target.value })}
                                                >
                                                    {(SALARY_FREQUENCIES.includes(formData.salary_frequency)
                                                        ? SALARY_FREQUENCIES
                                                        : [formData.salary_frequency, ...SALARY_FREQUENCIES]
                                                    ).map(f => (<option key={f} value={f}>{tr("jobForm.freq" + f) || f}</option>))}
                                                </Select>
                                            </Field>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* The unit is spelled out. These inputs used to be bare "Min/Max Salary"
                                                    with no currency and no period, so an AI-suggested "12" (lakhs) and a
                                                    hand-typed 1200000 landed in the same column indistinguishably — and the
                                                    public page then published "INR 12 / Yearly". */}
                                                <Field label={`${tr("jobForm.minSalary")} (${formData.salary_currency} ${tr("jobForm." + (FREQUENCY_LABEL_KEY[formData.salary_frequency] || "perYear"))})`} htmlFor="salary-min-input" error={isSalaryInvalid ? tr("jobForm.maxMustBeMin") : undefined}>
                                                    <Input id="salary-min-input" type="number" min="0" placeholder="600000" className={cn(jetbrainsMono.className, isSalaryInvalid && errorInputCls)} value={formData.salary_min} onChange={e => setFormData({ ...formData, salary_min: e.target.value })} />
                                                </Field>
                                                <Field label={`${tr("jobForm.maxSalary")} (${formData.salary_currency} ${tr("jobForm." + (FREQUENCY_LABEL_KEY[formData.salary_frequency] || "perYear"))})`} htmlFor="salary-max-input">
                                                    <Input id="salary-max-input" type="number" min="0" placeholder="1500000" className={cn(jetbrainsMono.className, isSalaryInvalid && errorInputCls)} value={formData.salary_max} onChange={e => setFormData({ ...formData, salary_max: e.target.value })} />
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
                                                <h3 className="text-[14px] font-bold text-[#15171C]">{tr("jobForm.jobDescSkills")}</h3>
                                                <p className="text-[11px] font-medium text-[#9AA3AF] mt-0.5">{tr("jobForm.outlineResp")}</p>
                                            </div>
                                        </div>
                                        {isEdit ? (
                                            <div className="flex items-center gap-2.5">
                                                {/* job_statuses: 1 Draft · 2 Active · 3 On Hold · 4 Closed.
                                                    Active → green, Closed → red, On Hold → amber, Draft → grey. */}
                                                <Select
                                                    value={formData.status_id}
                                                    onChange={(e) => setFormData({ ...formData, status_id: Number.parseInt(e.target.value) })}
                                                    className={`h-10 text-[12px] font-semibold cursor-pointer text-center ${formData.status_id === 2
                                                            ? "bg-[#E6F4EA] text-[#15803D] border-[#CDEAD7]"
                                                            : formData.status_id === 4
                                                                ? "bg-[#FDECEC] text-[#C0383C] border-[#F5C9C9]"
                                                                : formData.status_id === 3
                                                                    ? "bg-[#FEF3E2] text-[#B45309] border-[#F5D9A8]"
                                                                    : "bg-[#F4F5F7] text-[#6B6F76] border-[#E8EAED]"
                                                        }`}
                                                >
                                                    <option value={1}>{tr("jobForm.draftStatus")}</option>
                                                    <option value={2}>{tr("jobForm.activeStatus")}</option>
                                                    <option value={3}>{tr("jobForm.onHold")}</option>
                                                    <option value={4}>{tr("jobForm.closedStatus")}</option>
                                                </Select>
                                                <Button onClick={generateAIDescription} disabled={isGeneratingAI} className="h-10">
                                                    {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    {isGeneratingAI ? tr("jobForm.generating") : tr("jobForm.autoDraftAI")}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button onClick={generateAIDescription} disabled={isGeneratingAI} className="h-10">
                                                {isGeneratingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {isGeneratingAI ? tr("jobForm.generating") : tr("jobForm.autoDraftAI")}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col border-b border-[#E8EAED] overflow-y-auto">
                                        <JobEditor content={formData.description} onChange={(content) => setFormData({ ...formData, description: content })} placeholder={tr("jobForm.jdEditorPlaceholder")} />
                                    </div>

                                    {/* Add more to the AI-generated JD — only surfaced once a JD exists, and
                                        highlighted + scrolled into view after generation/add so it's easy to spot. */}
                                    {hasJD && (
                                        <div
                                            ref={addPanelRef}
                                            className={cn(
                                                "px-5 py-4 border-b shrink-0 transition-all duration-500",
                                                highlightAdd
                                                    ? "bg-[#EBE9FB] border-[#C9C4F5] ring-2 ring-[#5B53E0]/50 shadow-[0_0_0_4px_rgba(91,83,224,0.10)]"
                                                    : "bg-[#F3F2FD] border-[#E4E2FA]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className={cn("w-3.5 h-3.5 text-[#5B53E0]", highlightAdd && "animate-pulse")} />
                                                    <span className="text-[12px] font-bold text-[#5B53E0]">{tr("jobForm.addMoreAI")}</span>
                                                    {highlightAdd && !justAdded && (
                                                        <span className="text-[9px] font-black text-white bg-[#5B53E0] rounded-full px-2 py-[3px] tracking-wide">{tr("jobForm.newBadge")}</span>
                                                    )}
                                                </div>
                                                {justAdded && (
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#15803D]">
                                                        <CircleCheck className="w-3.5 h-3.5" /> {tr("jobForm.addedToDesc")}
                                                    </span>
                                                )}
                                            </div>
                                            <Textarea
                                                value={additionalJD}
                                                onChange={(e) => setAdditionalJD(e.target.value)}
                                                disabled={isEnhancingJD}
                                                placeholder={tr("jobForm.addMorePlaceholder")}
                                                className="min-h-[64px] bg-white"
                                                onKeyDown={(e) => {
                                                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                                        e.preventDefault();
                                                        addToJDWithAI();
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center justify-between gap-3 mt-2">
                                                <p className="text-[11px] text-[#8A929E]">{tr("jobForm.aiWeavesPoints")}</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={addToJDWithAI}
                                                    disabled={isEnhancingJD || !additionalJD.trim()}
                                                    className="shrink-0"
                                                >
                                                    {isEnhancingJD ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                    {isEnhancingJD ? tr("jobForm.adding") : tr("jobForm.addToJD")}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5 bg-[#F7F8FA] shrink-0">
                                        <Field
                                            label={<>{tr("jobForm.requiredTechStack")} <span className="font-normal text-[#9AA3AF]">{tr("jobForm.commaSeparated")}</span></>}
                                            htmlFor="required-skills-input"
                                        >
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] z-10 pointer-events-none">
                                                    <AtSign className="w-4 h-4" />
                                                </div>
                                                <Input id="required-skills-input" type="text" className="pl-10" placeholder={tr("jobForm.techStackPlaceholder")} value={formData.required_skills} onChange={e => setFormData({ ...formData, required_skills: e.target.value })} />
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
                                    <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#15171C] leading-tight mb-1.5">{tr("jobForm.hiringProcess")}</h1>
                                    <p className="text-[13px] text-[#8A929E] leading-relaxed">{tr("jobForm.defineStagesDesc")}</p>
                                </div>

                                {/* Stage Stats */}
                                <Card padding="sm" className="text-center">
                                    <div className={`text-[26px] font-semibold text-[#5B53E0] tracking-[-1px] ${jetbrainsMono.className}`}>{formData.workflow_stages.length}</div>
                                    <div className="text-[10px] font-semibold text-[#9AA3AF] mt-0.5 uppercase tracking-wide">{tr("jobForm.totalStages")}</div>
                                </Card>

                                {/* Stage Types Guide */}
                                <Card padding="sm" className="space-y-3">
                                    <p className="text-[11px] font-semibold text-[#6B6F76] uppercase tracking-wider">{tr("jobForm.stageTypes")}</p>
                                    {[
                                        { type: tr("jobForm.stageScreening"), color: 'bg-[#E7ECFB] text-[#3559C7]', desc: tr("jobForm.sgScreeningDesc") },
                                        { type: tr("jobForm.stageAptitude"), color: 'bg-[#ECEBFB] text-[#5B53E0]', desc: tr("jobForm.sgAptitudeDesc") },
                                        { type: tr("jobForm.stageCoding"), color: 'bg-[#FEF3E2] text-[#D97706]', desc: tr("jobForm.sgCodingDesc") },
                                        { type: tr("jobForm.sgTech"), color: 'bg-[#E3F4EF] text-[#0E8A6E]', desc: tr("jobForm.sgTechDesc") },
                                        { type: tr("jobForm.stageHRInterview"), color: 'bg-[#FDECEC] text-[#C0383C]', desc: tr("jobForm.sgHRDesc") },
                                        { type: tr("jobForm.stageFinalSelection"), color: 'bg-[#E6F4EA] text-[#15803D]', desc: tr("jobForm.sgFinalDesc") },
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
                                    <div key={node.id} className="relative">
                                        <div className="group relative flex items-center gap-3.5 bg-white p-3.5 rounded-[12px] border border-[#E8EAED] border-l-[3px] border-l-[#5B53E0] hover:border-[#5B53E0]/40 transition-colors">
                                            <div className="flex flex-col gap-1 items-center absolute -left-8">
                                                <button title={tr("jobForm.moveUp")} disabled={idx === 0} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx - 1]] = [newStages[idx - 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-[8px] bg-white border border-[#E1E4E8] shadow-sm flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                                                <button title={tr("jobForm.moveDown")} disabled={idx === formData.workflow_stages.length - 1} onClick={() => {
                                                    const newStages = [...formData.workflow_stages];
                                                    [newStages[idx], newStages[idx + 1]] = [newStages[idx + 1], newStages[idx]];
                                                    setFormData(prev => ({ ...prev, workflow_stages: newStages }));
                                                }} className="w-6 h-6 rounded-[8px] bg-white border border-[#E1E4E8] shadow-sm flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                                            </div>
                                            <div className={`w-9 h-9 rounded-[10px] bg-[#5B53E0] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 ${jetbrainsMono.className}`}>#0{idx + 1}</div>
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-[13.5px] font-semibold text-[#15171C] p-0 focus:text-[#5B53E0] transition-colors truncate" value={node.name} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, name: e.target.value } : s) }))} />
                                                <select className="bg-[#F4F5F7] border border-[#E8EAED] outline-none text-[11.5px] font-medium text-[#374151] px-2.5 h-8 rounded-[8px] cursor-pointer hover:bg-[#EEEFF1] transition-colors" value={node.type} onChange={(e) => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, type: e.target.value } : s) }))}>
                                                    {STAGE_TYPES.map(t => (<option key={t.name} value={t.name}>{tr("jobForm.stage" + t.name.replace(/\s+/g, ""))}</option>))}
                                                </select>
                                            </div>
                                            <button title={tr("jobForm.removeStage")} onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.filter(s => s.id !== node.id) }))} className="w-8 h-8 rounded-[9px] border border-[#E8EAED] bg-white text-[#8A929E] hover:bg-[#FDECEC] hover:text-[#EF4444] hover:border-[#F7D7D7] transition-colors flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
                                        </div>

                                        {/* What this round DOES. Held as draft state and armed as a real
                                            assessment automation the moment the job is created. */}
                                        {node.assessment ? (
                                            <div className="mt-1.5 ml-[52px] rounded-[11px] border border-[#E8EAED] bg-[#FBFBFC] p-3 space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#5B53E0]">
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        {tr("jobForm.assessmentOnRound")}
                                                    </span>
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, assessment: null } : s) }))}
                                                        className="text-[11.5px] font-semibold text-[#8A929E] hover:text-[#C0383C] transition-colors"
                                                    >
                                                        {tr("jobForm.assessmentRemove")}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    <Select
                                                        className="cursor-pointer h-9 text-[12px]"
                                                        value={node.assessment.type}
                                                        aria-label={tr("jobForm.assessmentType")}
                                                        onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.assessment ? { ...s, assessment: { ...s.assessment, type: e.target.value as StageAssessment["type"] } } : s) }))}
                                                    >
                                                        {ASSESSMENT_TYPES.map(t => (<option key={t} value={t}>{tr("jobRounds.type." + t)}</option>))}
                                                    </Select>
                                                    <Input
                                                        className="h-9 text-[12px]"
                                                        value={node.assessment.topic}
                                                        placeholder={tr("jobForm.assessmentTopic")}
                                                        aria-label={tr("jobForm.assessmentTopic")}
                                                        onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.assessment ? { ...s, assessment: { ...s.assessment, topic: e.target.value } } : s) }))}
                                                    />
                                                    <Input
                                                        className="h-9 text-[12px]"
                                                        type="number"
                                                        min={1}
                                                        max={50}
                                                        value={node.assessment.question_count}
                                                        aria-label={tr("jobForm.assessmentCount")}
                                                        onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.assessment ? { ...s, assessment: { ...s.assessment, question_count: Number(e.target.value) } } : s) }))}
                                                    />
                                                    <Input
                                                        className="h-9 text-[12px]"
                                                        type="number"
                                                        min={5}
                                                        max={240}
                                                        value={node.assessment.test_duration}
                                                        aria-label={tr("jobForm.assessmentDuration")}
                                                        onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.assessment ? { ...s, assessment: { ...s.assessment, test_duration: Number(e.target.value) } } : s) }))}
                                                    />
                                                </div>
                                                <p className="text-[10.5px] text-[#8A929E] leading-relaxed">{tr("jobForm.assessmentHint")}</p>
                                            </div>
                                        ) : null}

                                        {node.interview && (
                                            <div className="mt-1.5 ml-[52px] rounded-[11px] border border-[#E8EAED] bg-[#FBFBFC] p-3 space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#3559C7]">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {tr("jobForm.interviewOnRound")}
                                                    </span>
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, interview: null } : s) }))}
                                                        className="text-[11.5px] font-semibold text-[#8A929E] hover:text-[#C0383C] transition-colors"
                                                    >
                                                        {tr("jobForm.assessmentRemove")}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    <Select
                                                        className="cursor-pointer h-9 text-[12px]"
                                                        value={node.interview.interview_type}
                                                        aria-label={tr("jobForm.interviewType")}
                                                        onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.interview ? { ...s, interview: { ...s.interview, interview_type: e.target.value as StageInterview["interview_type"] } } : s) }))}
                                                    >
                                                        {INTERVIEW_TYPES.map(t => (<option key={t} value={t}>{tr("jobForm.interviewType" + t)}</option>))}
                                                    </Select>
                                                    <Input
                                                        className="h-9 text-[12px]"
                                                        type="email"
                                                        value={node.interview.interviewer_email}
                                                        placeholder={tr("jobForm.interviewerEmail")}
                                                        aria-label={tr("jobForm.interviewerEmail")}
                                                        onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.interview ? { ...s, interview: { ...s.interview, interviewer_email: e.target.value } } : s) }))}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {node.email && (
                                            <div className="mt-1.5 ml-[52px] rounded-[11px] border border-[#E8EAED] bg-[#FBFBFC] p-3 space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#0E8A6E]">
                                                        <AtSign className="w-3.5 h-3.5" />
                                                        {tr("jobForm.emailOnRound")}
                                                    </span>
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, email: null } : s) }))}
                                                        className="text-[11.5px] font-semibold text-[#8A929E] hover:text-[#C0383C] transition-colors"
                                                    >
                                                        {tr("jobForm.assessmentRemove")}
                                                    </button>
                                                </div>
                                                <Select
                                                    className="cursor-pointer h-9 text-[12px]"
                                                    value={node.email.template_id}
                                                    aria-label={tr("jobForm.emailTemplate")}
                                                    onChange={e => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id && s.email ? { ...s, email: { template_id: e.target.value } } : s) }))}
                                                >
                                                    <option value="">{tr("jobForm.emailTemplatePick")}</option>
                                                    {emailTemplates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                                </Select>
                                                {emailTemplates.length === 0 && (
                                                    <p className="text-[10.5px] text-[#B45309] leading-relaxed">{tr("jobForm.emailNoTemplates")}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Attach whatever this round should DO. Each becomes a real
                                            automation, keyed to this stage, once the job exists. */}
                                        <div className="mt-1.5 ml-[52px] flex flex-wrap items-center gap-3">
                                            {!node.assessment && (
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, assessment: { type: ASSESSMENT_FOR_STAGE[s.type] || "APTITUDE", topic: "", criteria: "60% to pass", question_count: 10, test_duration: 30 } } : s) }))}
                                                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8A929E] hover:text-[#5B53E0] transition-colors"
                                                >
                                                    <CirclePlus className="w-3.5 h-3.5" />
                                                    {tr("jobForm.assessmentAdd")}
                                                </button>
                                            )}
                                            {!node.interview && (
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, interview: { interview_type: "GMEET", interviewer_email: "", daily_limit: 5 } } : s) }))}
                                                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8A929E] hover:text-[#3559C7] transition-colors"
                                                >
                                                    <CirclePlus className="w-3.5 h-3.5" />
                                                    {tr("jobForm.interviewAdd")}
                                                </button>
                                            )}
                                            {!node.email && (
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, workflow_stages: prev.workflow_stages.map(s => s.id === node.id ? { ...s, email: { template_id: "" } } : s) }))}
                                                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8A929E] hover:text-[#0E8A6E] transition-colors"
                                                >
                                                    <CirclePlus className="w-3.5 h-3.5" />
                                                    {tr("jobForm.emailAdd")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    ))}

                                    <button onClick={() => {
                                        const maxId = Math.max(0, ...formData.workflow_stages.map(s => Number.parseInt(s.id) || 0));
                                        const newStage: WorkflowStage = { id: (maxId + 1).toString(), name: `Stage ${maxId + 1}`, type: 'Technical Interview', icon: 'Zap' };
                                        setFormData(prev => ({ ...prev, workflow_stages: [...prev.workflow_stages, newStage] }));
                                    }} className="w-full h-12 rounded-[12px] border-2 border-dashed border-[#D4D7DC] text-[#6B6F76] text-[14px] font-semibold hover:border-[#5B53E0] hover:text-[#5B53E0] hover:bg-[#ECEBFB]/40 transition-colors flex items-center justify-center gap-2">
                                        <ListPlus className="w-5 h-5" />
                                        {tr("jobForm.addStage")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Start-of-creation choice: blank form vs. starter template. */}
            <AnimatePresence>
                {startChoice && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E1014]/50 backdrop-blur-sm p-6">
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[16px] p-6 shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED]">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-[19px] font-extrabold text-[#15171C] tracking-[-0.4px] mb-1.5 leading-tight">{tr("jobForm.createJob")}</h2>
                                    <p className="text-[12.5px] text-[#8A929E] leading-relaxed">
                                        {startChoice === "choice" ? tr("jobForm.startChoiceDesc") : tr("jobForm.templatePickDesc")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push("/enterprise/jobs")}
                                    aria-label={tr("common.cancel")}
                                    className="w-8 h-8 shrink-0 rounded-[10px] text-[#8A929E] hover:text-[#15171C] hover:bg-[#F7F8FA] transition-colors flex items-center justify-center"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {startChoice === "choice" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setStartChoice(null)}
                                        className="text-left rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/50 hover:bg-[#F7F8FA] transition-colors p-4"
                                    >
                                        <span className="w-10 h-10 rounded-[12px] bg-[#E7ECFB] text-[#3559C7] flex items-center justify-center mb-3">
                                            <FileText className="w-5 h-5" />
                                        </span>
                                        <span className="block text-[13px] font-bold text-[#15171C] mb-1">{tr("jobForm.startBlank")}</span>
                                        <span className="block text-[11.5px] text-[#8A929E] leading-relaxed">{tr("jobForm.startBlankDesc")}</span>
                                    </button>

                                    <button
                                        onClick={() => setStartChoice("template")}
                                        className="text-left rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/50 hover:bg-[#F7F8FA] transition-colors p-4"
                                    >
                                        <span className="w-10 h-10 rounded-[12px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center mb-3">
                                            <ClipboardList className="w-5 h-5" />
                                        </span>
                                        <span className="block text-[13px] font-bold text-[#15171C] mb-1">{tr("jobForm.startTemplate")}</span>
                                        <span className="block text-[11.5px] text-[#8A929E] leading-relaxed">{tr("jobForm.startTemplateDesc")}</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Field label={tr("jobForm.selectTemplate")} htmlFor="job-template-select">
                                        <Select
                                            id="job-template-select"
                                            className="cursor-pointer"
                                            value={selectedTemplateId}
                                            onChange={e => setSelectedTemplateId(e.target.value)}
                                        >
                                            <option value="">{tr("jobForm.selectTemplatePlaceholder")}</option>
                                            {JOB_TEMPLATE_CATEGORIES.map(cat => (
                                                <optgroup key={cat} label={cat}>
                                                    {JOB_TEMPLATES.filter(tpl => tpl.category === cat).map(tpl => (
                                                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </Select>
                                    </Field>

                                    {(() => {
                                        const tpl = findJobTemplate(selectedTemplateId);
                                        if (!tpl) return null;
                                        return (
                                            <div className="mt-3 rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] p-3.5">
                                                <p className="text-[12px] text-[#4B5057] leading-relaxed mb-2.5">{tpl.summary}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="text-[10.5px] font-semibold px-2 py-1 rounded-[6px] bg-white border border-[#E8EAED] text-[#6B6F76]">{tpl.job_type}</span>
                                                    <span className="text-[10.5px] font-semibold px-2 py-1 rounded-[6px] bg-white border border-[#E8EAED] text-[#6B6F76]">{tpl.work_mode}</span>
                                                    <span className="text-[10.5px] font-semibold px-2 py-1 rounded-[6px] bg-white border border-[#E8EAED] text-[#6B6F76]">{tpl.experience_min}–{tpl.experience_max} {tr("jobForm.yearsShort")}</span>
                                                    <span className="text-[10.5px] font-semibold px-2 py-1 rounded-[6px] bg-white border border-[#E8EAED] text-[#6B6F76]">{tpl.stages.length} {tr("jobForm.roundsShort")}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex items-center justify-end gap-2 mt-5">
                                        <Button variant="secondary" onClick={() => { setSelectedTemplateId(""); setStartChoice("choice"); }}>
                                            {tr("common.back")}
                                        </Button>
                                        <Button onClick={applyTemplate} disabled={!selectedTemplateId}>
                                            {tr("jobForm.useTemplate")}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showRoundsChoice && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E1014]/50 backdrop-blur-sm p-6">
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[16px] p-6 shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED]">
                            <div className="text-center mb-5">
                                <div className="w-12 h-12 bg-[#ECEBFB] text-[#5B53E0] rounded-[14px] flex items-center justify-center mx-auto mb-3.5"><Network className="w-6 h-6" /></div>
                                <h2 className="text-[19px] font-extrabold text-[#15171C] tracking-[-0.4px] mb-1.5 leading-tight">{tr("jobForm.roundsChoiceTitle")}</h2>
                                <p className="text-[12.5px] text-[#8A929E] leading-relaxed">{tr("jobForm.roundsChoiceDesc")}</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    disabled={isHandingOff}
                                    onClick={buildRoundsWithPilot}
                                    className="text-left rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/50 hover:bg-[#F7F8FA] transition-colors p-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-[#5B53E0]" />
                                        <span className="text-[13px] font-bold text-[#15171C]">{tr("jobForm.roundsWithPilot")}</span>
                                    </div>
                                    <p className="text-[11.5px] text-[#8A929E] leading-relaxed">
                                        {isHandingOff ? tr("jobForm.roundsHandingOff") : tr("jobForm.roundsWithPilotDesc")}
                                    </p>
                                </button>

                                <button
                                    disabled={isHandingOff}
                                    onClick={() => { setShowRoundsChoice(false); setCurrentStep(2); }}
                                    className="text-left rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/50 hover:bg-[#F7F8FA] transition-colors p-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Network className="w-4 h-4 text-[#6B6F76]" />
                                        <span className="text-[13px] font-bold text-[#15171C]">{tr("jobForm.roundsManual")}</span>
                                    </div>
                                    <p className="text-[11.5px] text-[#8A929E] leading-relaxed">{tr("jobForm.roundsManualDesc")}</p>
                                </button>
                            </div>

                            <button
                                disabled={isHandingOff}
                                onClick={() => setShowRoundsChoice(false)}
                                className="mt-4 w-full text-[12px] font-semibold text-[#8A929E] hover:text-[#15171C] transition-colors disabled:opacity-60"
                            >
                                {tr("common.cancel")}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E1014]/50 backdrop-blur-sm p-6">
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[16px] p-6 text-center shadow-[0_14px_34px_rgba(15,23,42,0.16)] relative overflow-hidden border border-[#E8EAED]">
                            <div className="w-12 h-12 bg-[#E6F4EA] text-[#15803D] rounded-[14px] flex items-center justify-center mx-auto mb-3.5"><CircleCheck className="w-7 h-7" /></div>
                            <h2 className="text-[19px] font-extrabold text-[#15171C] tracking-[-0.4px] mb-1.5 leading-tight">{isEdit ? tr("jobForm.jobUpdated") : tr("jobForm.jobCreated")}</h2>
                            <p className="text-[12.5px] text-[#8A929E] leading-relaxed mb-5">{isEdit ? tr("jobForm.jobUpdatedDesc") : (formData.status_id === 2 ? tr("jobForm.jobCreatedLive") : tr("jobForm.jobCreatedSetActive"))}</p>

                            {!isEdit && (
                                <div className="mb-4 rounded-[12px] border border-[#E8EAED] bg-[#F7F8FA] p-3.5 text-left">
                                    <p className="text-[12.5px] font-bold text-[#15171C] mb-0.5">{tr("jobForm.startSourcing")}</p>
                                    <p className="text-[11.5px] text-[#8A929E] leading-relaxed mb-3">{tr("jobForm.pilotMatchDesc")}</p>
                                    <div className="flex flex-col gap-2">
                                        <Button fullWidth onClick={() => startSourcing("ai")}>
                                            <Sparkles className="w-4 h-4" />
                                            {tr("jobForm.sourceWithPilot")}
                                        </Button>
                                        <Button variant="secondary" fullWidth onClick={() => startSourcing("manual")}>
                                            <Users className="w-4 h-4" />
                                            {tr("jobForm.sourceManually")}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button variant={isEdit ? "primary" : "secondary"} fullWidth onClick={() => router.push("/enterprise/jobs")}>
                                    <LayoutDashboard className="w-4 h-4" />
                                    {tr("jobForm.viewJobBoard")}
                                </Button>
                                <Button variant="secondary" fullWidth onClick={() => window.open(`${window.location.origin}/jobs/${isEdit ? jobId : createdJobId}`, '_blank')}>
                                    <Eye className="w-4 h-4" />
                                    {tr("jobForm.viewJobApplication")}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
