"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter } from "next/navigation"; // Added
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import SendEmailModal from "@/components/enterprise/SendEmailModal";
import SendAssessmentModal from "@/components/enterprise/SendAssessmentModal";
import SendOnboardingModal from "@/components/enterprise/SendOnboardingModal";
import { PageHelp } from "@/components/ds";

// --- Interfaces ---

interface Candidate {
    id: string;
    full_name: string;
    email: string;
    skills: string[];
    phone?: string;
    profile_image?: string;
    parsed_data?: Record<string, unknown>;
}

interface AIFeedback {
    fit_reason?: string;
    not_fit_reason?: string;
    highlights?: string[];
}

interface Application {
    id: string;
    candidate_id: string;
    current_stage: number;
    status_id?: number;
    ai_match_score?: number;
    assessment_score?: number;
    aptitude_score?: number;
    coding_score?: number;
    ai_interview_score?: number;
    ai_feedback?: AIFeedback;
    applied_at?: string;
    candidate: Candidate;
    job_requirement_id: string;
    onboarding_id?: string;
    source?: string;
}

interface Company {
    id: string;
    name: string;
}

interface Stage {
    id: number | string;
    name: string;
    color: string;
}

interface Job {
    id: string;
    title: string;
    company_id?: string;
    location?: string;
    description?: string;
    required_skills?: string[];
}

interface OnboardingTemplate {
    id: string;
    name: string;
}

// --- Helpers ---
// application_statuses (stable across ALL jobs). The per-job board groups by workflow
// `current_stage`; the cross-job "All Job Requirements" view groups by these instead, because a
// numeric stage index means different things in different jobs' pipelines.
const APPLICATION_STATUSES: Stage[] = [
    { id: 1, name: "Applied", color: "" },
    { id: 2, name: "Screening", color: "" },
    { id: 3, name: "Interviewing", color: "" },
    { id: 4, name: "Offered", color: "" },
    { id: 5, name: "Hired", color: "" },
    { id: 6, name: "Rejected", color: "" },
    { id: 7, name: "Withdrawn", color: "" },
];

// Display-only translations for known stage/status names. The raw English `name`
// is still the value used for drag-drop/API/grouping — we only translate at render.
const STAGE_NAME_KEYS: Record<string, string> = {
    "Applied": "pipeline.stageApplied",
    "Screening": "pipeline.stageScreening",
    "Interviewing": "pipeline.stageInterviewing",
    "Offered": "pipeline.stageOffered",
    "Hired": "pipeline.stageHired",
    "Rejected": "pipeline.stageRejected",
    "Withdrawn": "pipeline.stageWithdrawn",
    "Assessment": "pipeline.stageAssessment",
    "Interview": "pipeline.stageInterview",
    "Offer": "pipeline.stageOffer",
};

const STAGE_COLORS = [
    'border-[#1976D2]',
    'border-purple-500',
    'border-pink-500',
    'border-rose-500',
    'border-orange-500',
    'border-amber-500',
    'border-emerald-500',
    'border-teal-500',
    'border-cyan-500',
    'border-blue-500'
];

// Backend returns naive UTC timestamps (no 'Z' / offset). `new Date(str)` would
// parse these as LOCAL time, skewing relative "ago" times by the UTC offset.
// Normalize to a space->'T' separator and append 'Z' when no tz marker exists.
const parseUTC = (str: string): Date => {
    let s = str.trim().replace(" ", "T");
    if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
        s += "Z";
    }
    return new Date(s);
};

const getScoreStyles = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
};

// --- Modal Component ---

interface CandidateModalProps {
    application: Application;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate: (appId: string, statusId: number | string) => void;
    onRefresh: () => void;
    onboardingTemplates: OnboardingTemplate[];
    stages: Stage[];
    /** Whether stage moves are allowed here (false in the cross-job status view). */
    allowStageMove?: boolean;
}

function CandidateModal({ application, isOpen, onClose, onStatusUpdate, onRefresh, onboardingTemplates, stages, allowStageMove }: CandidateModalProps) {
    const { token, canAccess } = useAuth();
    const { t } = useI18n();
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    if (!isOpen || !application) return null;

    const { candidate, ai_match_score, ai_feedback } = application;
    const details = candidate.parsed_data || {};
    const feedback = ai_feedback || {};

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={t("pipeline.closePanel")}
            className="fixed inset-0 z-50 flex items-center justify-end bg-[#1E2A38]/40 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { onClose(); } }}
        >
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 border-b border-[#E0E0E0] px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[4px] bg-[#1976D2] text-white flex items-center justify-center font-semibold text-[15px] shrink-0">
                            {(candidate.full_name || "?").split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#212121] truncate">{candidate.full_name}</h2>
                            {candidate.email && <p className="text-[12.5px] text-[#757575] truncate">{candidate.email}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Touch/keyboard-accessible way to move a candidate between stages (drag is
                            mouse-only). Shown only for a specific job's board. */}
                        {allowStageMove && canAccess("candidates:update") && stages.length > 0 && (
                            <select
                                value={String(application.current_stage)}
                                onChange={(e) => onStatusUpdate(application.id, Number(e.target.value))}
                                title={t("pipeline.moveToStage")}
                                aria-label={t("pipeline.moveToStage")}
                                className="h-9 bg-white border border-[#E0E0E0] rounded-[4px] px-2.5 text-[12px] font-medium text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all max-w-[160px] cursor-pointer"
                            >
                                {stages.map(s => (
                                    <option key={s.id} value={String(s.id)}>{t("pipeline.moveToPrefix")} {STAGE_NAME_KEYS[s.name] ? t(STAGE_NAME_KEYS[s.name]) : s.name}</option>
                                ))}
                            </select>
                        )}
                        {application.onboarding_id ? (
                            canAccess("onboarding:read") && (
                                <button
                                    onClick={() => {
                                        window.location.href = `/enterprise/onboarding/${application.onboarding_id}`;
                                    }}
                                    className="h-9 px-3 bg-[#2E7D32] hover:bg-[#136a33] text-white rounded-[4px] text-[12px] font-semibold transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-icons-outlined text-[16px]">visibility</span>
                                    {t("pipeline.viewOnboarding")}
                                </button>
                            )
                        ) : (
                            canAccess("onboarding:moderate") && (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="h-9 bg-white border border-[#E0E0E0] rounded-[4px] px-2.5 text-[12px] font-medium text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all max-w-[150px]"
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                    >
                                        <option value="">{t("pipeline.selectTemplate")}</option>
                                        {onboardingTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={async () => {
                                            if (!selectedTemplate) {
                                                alert(t("pipeline.selectTemplateFirst"));
                                                return;
                                            }
                                            if (!token) {
                                                alert(t("pipeline.sessionExpired"));
                                                return;
                                            }
                                            try {
                                                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/initiate`, {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "Authorization": `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        application_id: application.id,
                                                        template_id: selectedTemplate
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert(t("pipeline.onboardingInitiated"));
                                                    onRefresh();
                                                    onClose();
                                                } else {
                                                    const err = await res.json();
                                                    alert(err.detail || t("pipeline.onboardingInitiateFailed"));
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert(t("pipeline.onboardingInitiateError"));
                                            }
                                        }}
                                        className="h-9 px-3 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[12px] font-semibold transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-icons-outlined text-[16px]">person_add</span>
                                        {t("pipeline.initiate")}
                                    </button>
                                </div>
                            )
                        )}
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F6F8] rounded-[4px] text-[#9E9E9E] hover:text-[#4F4F4F] transition-colors shrink-0">
                            <span className="material-icons-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Score Section */}
                    {ai_match_score !== undefined && (
                        <div className="bg-white rounded-[4px] p-5 border border-[#E0E0E0]">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="text-[14px] font-bold text-[#212121] flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center"><span className="material-icons-outlined text-[18px]">psychology</span></span>
                                    {t("pipeline.aiFitAnalysis")}
                                </h3>
                                <div className={`px-2.5 py-1 rounded-[4px] text-[12px] font-semibold border ${getScoreStyles(ai_match_score)}`}>
                                    {t("pipeline.scoreOutOf", { score: ai_match_score })}
                                </div>
                            </div>

                            {( (application.aptitude_score != null && application.aptitude_score > 0) || (application.coding_score != null && application.coding_score > 0) || (application.ai_interview_score != null && application.ai_interview_score > 0) ) && (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                    {application.aptitude_score != null && application.aptitude_score > 0 && (
                                        <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-3 rounded-[4px]">
                                            <h4 className="text-[10px] font-semibold text-[#9E9E9E] uppercase tracking-wide mb-1">{t("pipeline.aptitude")}</h4>
                                            <div className="text-[16px] font-semibold text-[#212121]">{application.aptitude_score}%</div>
                                        </div>
                                    )}
                                    {application.coding_score != null && application.coding_score > 0 && (
                                        <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-3 rounded-[4px]">
                                            <h4 className="text-[10px] font-semibold text-[#9E9E9E] uppercase tracking-wide mb-1">{t("pipeline.coding")}</h4>
                                            <div className="text-[16px] font-semibold text-[#212121]">{application.coding_score}%</div>
                                        </div>
                                    )}
                                    {application.ai_interview_score != null && application.ai_interview_score > 0 && (
                                        <div className="bg-[#FAFAFA] border border-[#E0E0E0] p-3 rounded-[4px]">
                                            <h4 className="text-[10px] font-semibold text-[#9E9E9E] uppercase tracking-wide mb-1">{t("pipeline.aiInterview")}</h4>
                                            <div className="text-[16px] font-semibold text-[#212121]">{Math.round(application.ai_interview_score)}%</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2.5">
                                {feedback.fit_reason && (
                                    <div className="bg-[#E8F5E9]/50 border border-[#C8E6C9] p-3.5 rounded-[4px]">
                                        <h4 className="text-[11px] font-bold text-[#2E7D32] uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><span className="material-icons-outlined text-[15px]">check_circle</span>{t("pipeline.whyFit")}</h4>
                                        <p className="text-[13px] text-[#4F4F4F] leading-relaxed">{feedback.fit_reason}</p>
                                    </div>
                                )}
                                {feedback.not_fit_reason && (
                                    <div className="bg-[#FFEBEE]/50 border border-[#F5C9C9] p-3.5 rounded-[4px]">
                                        <h4 className="text-[11px] font-bold text-[#C62828] uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><span className="material-icons-outlined text-[15px]">error</span>{t("pipeline.gapAnalysis")}</h4>
                                        <p className="text-[13px] text-[#4F4F4F] leading-relaxed">{feedback.not_fit_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Highlights */}
                    {feedback.highlights && feedback.highlights.length > 0 && (
                        <div>
                            <h3 className="text-[14px] font-bold text-[#212121] mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-[4px] bg-[#FFF3E0] text-[#EF6C00] flex items-center justify-center"><span className="material-icons-outlined text-[18px]">star</span></span>
                                {t("pipeline.keyHighlights")}
                            </h3>
                            <ul className="space-y-2.5">
                                {feedback.highlights.map((h: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#4F4F4F] leading-relaxed">
                                        <span className="material-icons-outlined text-[#2E7D32] text-[18px] mt-0.5 shrink-0">check_circle</span>
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <h3 className="text-[14px] font-bold text-[#212121] mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-[4px] bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center"><span className="material-icons-outlined text-[18px]">code</span></span>
                                {t("pipeline.skills")}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-[#F5F6F8] border border-[#E0E0E0] rounded-[4px] text-[12px] text-[#424242] font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function KanbanBoardPage() {
    const { token, canAccess } = useAuth();
    const { t } = useI18n();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [viewApplication, setViewApplication] = useState<Application | null>(null);
    const [onboardingTemplates, setOnboardingTemplates] = useState<OnboardingTemplate[]>([]);

    // Drag and Drop State
    const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
    const [dragOverStageId, setDragOverStageId] = useState<number | string | null>(null);

    // Job Fetching & Filtering
    const [jobs, setJobs] = useState<Job[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    // Becomes true once the jobs list has loaded and the default (most recent) job is auto-selected.
    // We hold the board until then so it doesn't flash the "All jobs" view before the recent job.
    const [jobsResolved, setJobsResolved] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [minMatchScore, setMinMatchScore] = useState<number>(0);
    const [appliedPeriod, setAppliedPeriod] = useState<string>("ALL");
    const [selectedSource, setSelectedSource] = useState<string>("ALL");
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Email Modal
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

    // Horizontal carousel for the pipeline columns (shows 4, arrows slide to the rest).
    const boardRef = useRef<HTMLDivElement>(null);
    const scrollBoard = (dir: number) => {
        const el = boardRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * (el.clientWidth / 2), behavior: "smooth" });
    };

    // --- Fetch Data ---
    useEffect(() => {
        const loadInitialData = async () => {
            if (token) {
                await fetchCompanies();
                await fetchJobs();
            }
        };
        loadInitialData();
    }, [token]);

    useEffect(() => {
        // Wait for the default job to be resolved before loading the board, so we fetch/render for
        // the recent job straight away instead of flashing the "All jobs" view first.
        if (token && jobsResolved) {
            // Clear any selection when the job filter changes — otherwise the bulk-action bar keeps
            // counting apps that are no longer on screen (and acts on a stale, invisible set).
            setSelectedApps(new Set());
            fetchStages();
            fetchApplications();
            fetchTemplates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedJobId, jobsResolved]);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOnboardingTemplates(data);
            }
        } catch (e) {
            console.error("Error fetching templates:", e);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (e) {
            console.error("Error fetching companies:", e);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
                // Auto-select latest job if none active
                if (data.length > 0 && (!selectedJobId || selectedJobId === "")) {
                    setSelectedJobId(data[0].id);
                }
            }
        } catch (e) {
            console.error("Error fetching jobs:", e);
        } finally {
            // Unblock the board even if the fetch failed (falls back to the All-jobs view).
            setJobsResolved(true);
        }
    };

    const fetchStages = async () => {
        try {
            const url = new URL(`${BACKEND_URL}/api/v1/enterprise/applications/stages`);
            if (selectedJobId) {
                url.searchParams.append("job_id", selectedJobId);
            }
            const res = await fetch(url.toString(), {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStages(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const url = new URL(`${BACKEND_URL}/api/v1/enterprise/applications/`);
            if (selectedJobId) {
                url.searchParams.append("job_id", selectedJobId);
            }
            const res = await fetch(url.toString(), {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                const list: Application[] = Array.isArray(data) ? data : [];
                setApplications(list);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Actions ---

    const handleStageChange = async (appId: string, newStage: number | string) => {
        const originalApps = [...applications];
        const stagePayload = Number.parseInt(String(newStage));

        setApplications(prev => prev.map(app =>
            app.id === appId ? { ...app, current_stage: stagePayload } : app
        ));

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/applications/${appId}/stage`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ new_stage: stagePayload })
            });

            if (!res.ok) throw new Error("Failed to update");
            // Moving a stage can trigger automations server-side (auto-send assessment, auto-start
            // onboarding, etc.). Refetch so derived data (scores, onboarding_id) reflects them.
            await fetchApplications();
        } catch (error) {
            setApplications(originalApps);
            alert(t("pipeline.failedMoveCandidate"));
        }
    };

    const handleSelection = (appId: string) => {
        const newSelected = new Set(selectedApps);
        if (newSelected.has(appId)) {
            newSelected.delete(appId);
        } else {
            newSelected.add(appId);
        }
        setSelectedApps(newSelected);
    };

    const handleSelectAllInStage = (stageId: number | string, isSelected: boolean) => {
        const stageApps = getStageApps(stageId);
        const newSelected = new Set(selectedApps);
        stageApps.forEach(app => {
            if (isSelected) newSelected.add(app.id);
            else newSelected.delete(app.id);
        });
        setSelectedApps(newSelected);
    };

    const handleDragStart = (e: React.DragEvent, appId: string) => {
        setDraggedAppId(appId);
        e.dataTransfer.effectAllowed = "move";
        const el = e.target as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.target as HTMLElement;
        el.style.opacity = '1';
        setDraggedAppId(null);
    };

    const handleDragOver = (e: React.DragEvent, stageId: number | string) => {
        e.preventDefault();
        if (dragOverStageId !== stageId) {
            setDragOverStageId(stageId);
        }
    };

    const handleDrop = (e: React.DragEvent, stageId: number | string) => {
        e.preventDefault();
        setDragOverStageId(null);

        // Dragging changes `current_stage` (a per-job workflow index). In the cross-job status view
        // that would be meaningless, so stage moves are disabled there (use a specific job to move).
        if (isAllJobs) return;

        if (!canAccess("candidates:update")) {
            console.warn("Permission denied: cannot move candidate.");
            return;
        }

        // Only move if the card is actually changing columns. The old `draggedAppId !== stageId`
        // check compared an application id to a stage id (never equal), so dropping a card back
        // into its own column still fired a stage change → re-triggering that stage's automations
        // (duplicate emails/assessments). Compare the app's current stage to the target instead.
        if (draggedAppId) {
            const dragged = applications.find(a => a.id === draggedAppId);
            if (dragged && String(dragged.current_stage) !== String(stageId)) {
                handleStageChange(draggedAppId, stageId);
            }
        }
        setDraggedAppId(null);
    };

    const handleBulkMove = async () => {
        if (selectedApps.size === 0) return;

        const updates: { appId: string; newStage: number }[] = [];

        selectedApps.forEach(appId => {
            const app = applications.find(a => a.id === appId);
            if (!app) return;

            const currentIndex = boardStages.findIndex(s => String(s.id) === String(app.current_stage));
            if (currentIndex !== -1 && currentIndex < boardStages.length - 1) {
                const nextStage = boardStages[currentIndex + 1];
                updates.push({ appId: appId, newStage: Number(nextStage.id) });
            }
        });

        if (updates.length > 0) {
            // Optimistic update
            setApplications(prev => prev.map(app => {
                const update = updates.find(u => u.appId === app.id);
                return update ? { ...app, current_stage: update.newStage } : app;
            }));

            setSelectedApps(new Set()); // Clear selection

            // API calls
            await Promise.all(updates.map(u =>
                fetch(`${BACKEND_URL}/api/v1/enterprise/applications/${u.appId}/stage`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ new_stage: u.newStage })
                }).catch(err => console.error("Failed to move app", u.appId, err))
            ));
            // Reflect any automations triggered by the stage advance.
            await fetchApplications();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedApps.size === 0) return;
        if (!confirm(t("pipeline.confirmDeleteApps", { count: selectedApps.size }))) return;

        const idsToDelete = Array.from(selectedApps);

        // Optimistic update
        setApplications(prev => prev.filter(app => !selectedApps.has(app.id)));
        setSelectedApps(new Set());

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/applications/bulk`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(idsToDelete)
            });

            if (!res.ok) throw new Error("Delete failed");
        } catch (error) {
            console.error("Bulk delete error:", error);
            alert(t("pipeline.failedDeleteApps"));
            fetchApplications(); // Refresh to get actual state
        }
    };


    // --- Computed ---
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (app.candidate?.full_name || "").toLowerCase().includes(q) ||
                (app.candidate?.email || "").toLowerCase().includes(q) ||
                (app.candidate?.skills || []).some(s => (s || "").toLowerCase().includes(q));

            const job = jobs.find(j => j.id === app.job_requirement_id);

            const matchesJob = !selectedJobId || app.job_requirement_id === selectedJobId;
            const matchesCompany = !selectedCompanyId || (job && job.company_id === selectedCompanyId);
            const matchesLocation = selectedLocation === "ALL" || (job && job.location === selectedLocation);
            const matchesScore = (app.ai_match_score || 0) >= minMatchScore;

            let matchesPeriod = true;
            if (appliedPeriod !== "ALL" && app.applied_at) {
                const appliedDate = parseUTC(app.applied_at);
                const now = new Date();
                const diffDays = (now.getTime() - appliedDate.getTime()) / (1000 * 3600 * 24);
                if (appliedPeriod === "TODAY") matchesPeriod = diffDays <= 1;
                else if (appliedPeriod === "7D") matchesPeriod = diffDays <= 7;
                else if (appliedPeriod === "30D") matchesPeriod = diffDays <= 30;
            }

            const matchesSource = selectedSource === "ALL" || app.source === selectedSource;

            return matchesSearch && matchesJob && matchesCompany && matchesLocation && matchesScore && matchesPeriod && matchesSource;
        });
    }, [applications, searchQuery, selectedJobId, selectedCompanyId, selectedLocation, minMatchScore, appliedPeriod, selectedSource, jobs]);

    // Real, distinct sources present in the data — so the filter offers exactly
    // what exists and always matches what's stored (no hardcoded mismatch).
    const sourceOptions = useMemo(
        () => Array.from(new Set(applications.map(a => a.source).filter(Boolean))).sort() as string[],
        [applications]
    );

    // "All Job Requirements" is a cross-job view (no shared workflow), so it groups by application
    // STATUS; a specific job groups by its workflow `current_stage`.
    const isAllJobs = !selectedJobId || selectedJobId === "ALL";

    const getStageApps = (stageId: number | string) =>
        filteredApplications.filter(app =>
            String(isAllJobs ? (app.status_id ?? 1) : app.current_stage) === String(stageId),
        );

    const boardStages = useMemo<Stage[]>(() => {
        // Cross-job overview → stable status columns (Applied … Withdrawn).
        if (isAllJobs) return APPLICATION_STATUSES;
        // A specific job → its real workflow stages.
        if (stages.length > 0) return stages;
        // Specific job with no configured workflow → derive columns from the candidates' stages.
        const fallbackNames = ["Applied", "Screening", "Assessment", "Interview", "Offer", "Hired"];
        const maxStage = applications.reduce((m, a) => Math.max(m, Number(a.current_stage) || 1), 1);
        return Array.from({ length: maxStage }, (_, i) => ({
            id: i + 1,
            name: fallbackNames[i] || t("pipeline.stageN", { n: i + 1 }),
            color: STAGE_COLORS[i % STAGE_COLORS.length],
        }));
    }, [isAllJobs, stages, applications]);

    const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));

    const selectedJobTitle = jobs.find(j => j.id === selectedJobId)?.title || t("pipeline.selectAJob");

    // Hand the selected job (title + skills + JD) off to sourcing, tied to THIS job. Both the
    // Profile Sourcing page and Croar Pilot read `croar_source_job` on load and auto-source for it.
    //  - "chat":  Profile Sourcing auto-searches by title + skills.
    //  - "pilot": Croar Pilot sources for this existing job (asks how many, then sources).
    const goSourceForJob = (dest: "chat" | "pilot" = "chat") => {
        const job = jobs.find(j => j.id === selectedJobId);
        if (selectedJobId && selectedJobId !== "ALL" && job) {
            try {
                sessionStorage.setItem(
                    "croar_source_job",
                    JSON.stringify({ id: job.id, title: job.title, skills: (job.required_skills || []).join(", "), description: job.description || "", autostart: true }),
                );
            } catch { /* ignore */ }
        }
        router.push(dest === "pilot" ? "/enterprise/croar-pilot" : "/enterprise/sourcing/chat");
    };

    if (!jobsResolved || (isLoading && stages.length === 0)) {
        // Skeleton that MIRRORS the real layout (white command bar + gray board with columns), so
        // when the data lands the page doesn't jump/flash — it just fills in. Held until the recent
        // job is selected so we never flash the "All jobs" view first.
        return (
            <div className="h-screen flex flex-col bg-white">
                <div className="px-6 py-4 border-b border-[#E0E0E0] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <div className="h-6 w-40 rounded-md bg-[#F5F6F8] animate-pulse" />
                        <div className="h-3.5 w-56 rounded bg-[#EEEEEE] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-11 w-64 rounded-[4px] bg-[#EEEEEE] animate-pulse" />
                        <div className="h-11 w-24 rounded-[4px] bg-[#EEEEEE] animate-pulse" />
                    </div>
                </div>
                <div className="flex-1 bg-[#FAFAFA] p-6 min-h-0">
                    <div className="h-full flex gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex-1 min-w-0 rounded-[4px] border border-[#E0E0E0] bg-white p-3 flex flex-col gap-3">
                                <div className="h-4 w-24 rounded bg-[#F5F6F8] animate-pulse" />
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="h-16 rounded-[4px] bg-[#F5F6F8] animate-pulse" />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const activeFiltersCount = [
        selectedJobId && selectedJobId !== "ALL" && selectedJobId !== "",
        selectedCompanyId && selectedCompanyId !== "ALL" && selectedCompanyId !== "",
        selectedLocation !== "ALL" && selectedLocation !== "",
        minMatchScore > 0,
        appliedPeriod !== "ALL" && appliedPeriod !== "",
        selectedSource !== "ALL" && selectedSource !== ""
    ].filter(Boolean).length;

    return (
        <div className="relative h-screen flex flex-col bg-white font-sans text-[#263238]">
            {/* NEW: Dual-Line Command Center */}
            <div className="flex flex-col bg-white border-b border-[#E0E0E0] z-30 transition-all duration-300">

                {/* Header row: title + controls */}
                <div className="px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#EEEEEE]">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{t("pipeline.title")}</h1>
                            <PageHelp title={t("pipeline.title")}>
                                <p>{t("pipeline.helpPipeline")}</p>
                            </PageHelp>
                        </div>
                        <p className="text-[14px] text-[#757575] mt-1 truncate">
                            {selectedJobId && selectedJobId !== "ALL" ? selectedJobTitle : t("pipeline.trackEveryStage")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* Quick job (pipeline) filter — kept next to the heading so you can switch which
                            job's pipeline you're viewing without opening the Filters panel. Shares
                            selectedJobId with the Filters panel, so the two stay in sync. */}
                        <div className="relative flex-1 lg:flex-none lg:w-64">
                            <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-lg pointer-events-none">work_outline</span>
                            <select
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                title={t("pipeline.filterByJob")}
                                className="w-full h-11 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[4px] pl-11 pr-9 text-[13px] font-semibold text-[#212121] focus:bg-white focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all outline-none appearance-none cursor-pointer truncate"
                            >
                                <option value="">{t("pipeline.allJobs")}</option>
                                {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                            </select>
                            <span className="material-icons-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-lg pointer-events-none">expand_more</span>
                        </div>
                        <div className="relative group flex-1 lg:flex-none lg:w-80">
                            <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-lg group-focus-within:text-[#1976D2] transition-colors">search</span>
                            <input
                                type="text"
                                placeholder={t("pipeline.searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-[#FAFAFA] border border-[#E0E0E0] rounded-[4px] pl-11 pr-4 text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] focus:bg-white focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            title={t("pipeline.toggleFilters")}
                            className={`flex items-center gap-2 px-4 h-11 rounded-[4px] transition-colors shrink-0 ${isFilterExpanded ? 'bg-[#1976D2] text-white' : 'bg-[#FAFAFA] border border-[#E0E0E0] text-[#616161] hover:bg-[#E0E0E0]'}`}
                        >
                            <span className="material-icons-outlined text-xl">{isFilterExpanded ? 'filter_list_off' : 'filter_list'}</span>
                            <span className="text-[12px] font-semibold tracking-tight">{t("pipeline.filters")}</span>
                        </button>
                        {!isAllJobs && (
                            <button
                                onClick={() => goSourceForJob("chat")}
                                title={t("pipeline.sourceForJobAI")}
                                className="flex items-center gap-2 px-4 h-11 rounded-[4px] bg-[#1976D2] text-white hover:bg-[#1565C0] transition-colors shrink-0"
                            >
                                <span className="material-icons-outlined text-xl">person_search</span>
                                <span className="text-[12px] font-semibold tracking-tight">{t("pipeline.source")}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Line 2: Advanced Filters (Expandable) */}
                <AnimatePresence>
                    {isFilterExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-[#FAFAFA]/50"
                        >
                            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">

                                {/* Company Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-company" className="text-[9px] font-bold text-[#9E9E9E]   ml-1">{t("pipeline.enterpriseClient")}</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#BBDEFB] transition-all">
                                        <span className="material-icons-outlined text-[#9E9E9E] text-lg">corporate_fare</span>
                                        <select
                                            id="filter-company"
                                            value={selectedCompanyId}
                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#424242] outline-none w-full cursor-pointer"
                                        >
                                            <option value="">{t("pipeline.allClients")}</option>
                                            {companies.length === 0 ? (
                                                <option disabled>{t("pipeline.noClients")}</option>
                                            ) : (
                                                companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Role Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-job" className="text-[9px] font-bold text-[#9E9E9E]   ml-1">{t("pipeline.targetRequisition")}</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#BBDEFB] transition-all">
                                        <span className="material-icons-outlined text-[#9E9E9E] text-lg">work</span>
                                        <select
                                            id="filter-job"
                                            value={selectedJobId}
                                            onChange={(e) => setSelectedJobId(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#424242] outline-none w-full cursor-pointer truncate"
                                        >
                                            <option value="">{t("pipeline.allJobRequirements")}</option>
                                            {jobs.length === 0 ? (
                                                <option disabled>{t("pipeline.noJobsAvailable")}</option>
                                            ) : (
                                                jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Location Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-location" className="text-[9px] font-bold text-[#9E9E9E]   ml-1">{t("pipeline.geographicFocus")}</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#BBDEFB] transition-all">
                                        <span className="material-icons-outlined text-[#9E9E9E] text-lg">location_on</span>
                                        <select
                                            id="filter-location"
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#424242] outline-none w-full cursor-pointer"
                                        >
                                            <option value="ALL">{t("pipeline.globalWorkforce")}</option>
                                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Match Score Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-score" className="text-[9px] font-bold text-[#9E9E9E]   ml-1">{t("pipeline.aiMatchAccuracy")}</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#BBDEFB] transition-all">
                                        <span className="material-icons text-[#1976D2] text-lg">bolt</span>
                                        <select
                                            id="filter-score"
                                            value={minMatchScore}
                                            onChange={(e) => setMinMatchScore(Number(e.target.value))}
                                            className="bg-transparent text-[11px] font-bold text-[#424242] outline-none w-full cursor-pointer font-sans"
                                        >
                                            <option value={0}>{t("pipeline.anyScore")}</option>
                                            <option value={60}>{t("pipeline.highMatch")}</option>
                                            <option value={80}>{t("pipeline.eliteMatch")}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Application Period */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-period" className="text-[9px] font-bold text-[#9E9E9E]   ml-1">{t("pipeline.applicationRecency")}</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#BBDEFB] transition-all">
                                        <span className="material-icons-outlined text-[#9E9E9E] text-lg">calendar_today</span>
                                        <select
                                            id="filter-period"
                                            value={appliedPeriod}
                                            onChange={(e) => setAppliedPeriod(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#424242] outline-none w-full cursor-pointer"
                                        >
                                            <option value="ALL">{t("pipeline.lifetimeActivity")}</option>
                                            <option value="TODAY">{t("pipeline.joinedToday")}</option>
                                            <option value="7D">{t("pipeline.last7Days")}</option>
                                            <option value="30D">{t("pipeline.last30Days")}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Source Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-source" className="text-[9px] font-bold text-[#9E9E9E]   ml-1">{t("pipeline.originSource")}</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#BBDEFB] transition-all">
                                        <span className="material-icons-outlined text-[#9E9E9E] text-lg">share</span>
                                        <select
                                            id="filter-source"
                                            value={selectedSource}
                                            onChange={(e) => setSelectedSource(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#424242] outline-none w-full cursor-pointer"
                                        >
                                            <option value="ALL">{t("pipeline.allSources")}</option>
                                            {sourceOptions.map(src => (
                                                <option key={src} value={src}>{src}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-hidden bg-[#FAFAFA] p-6 flex flex-col">
                {!isLoading && applications.length === 0 && boardStages.length > 0 && (
                    <div className="mb-4 rounded-[4px] border border-[#BBDEFB] bg-[#E3F2FD]/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#212121]">{t("pipeline.noCandidatesPipeline")}</p>
                            <p className="text-xs text-[#616161] font-semibold mt-0.5">{t("pipeline.sourceOrShare")}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <button onClick={() => goSourceForJob("chat")} className="px-4 py-2.5 rounded-[4px] bg-[#1976D2] text-white text-xs font-bold hover:bg-[#1565C0] transition-all flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-base">person_search</span>
                                {t("pipeline.sourceCandidates")}
                            </button>
                            <button onClick={() => goSourceForJob("pilot")} className="px-4 py-2.5 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-xs font-bold hover:border-[#1976D2]/40 transition-all flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-base">smart_toy</span>
                                {t("pipeline.askCroarPilot")}
                            </button>
                        </div>
                    </div>
                )}
                <div className="relative flex-1 min-h-0">
                    {boardStages.length > 4 && (
                        <>
                            <button
                                onClick={() => scrollBoard(-1)}
                                title={t("pipeline.previousRounds")}
                                className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#E0E0E0] shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#4F4F4F] hover:text-[#1976D2] hover:border-[#1976D2]/40 transition-colors"
                            >
                                <span className="material-symbols-rounded text-[20px]">chevron_left</span>
                            </button>
                            <button
                                onClick={() => scrollBoard(1)}
                                title={t("pipeline.moreRounds")}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#E0E0E0] shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#4F4F4F] hover:text-[#1976D2] hover:border-[#1976D2]/40 transition-colors"
                            >
                                <span className="material-symbols-rounded text-[20px]">chevron_right</span>
                            </button>
                        </>
                    )}
                    <div
                        ref={boardRef}
                        className="h-full flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x [&::-webkit-scrollbar]:hidden"
                    >
                    {boardStages.map((stage, index) => {
                        const stageApps = getStageApps(stage.id);
                        const isAllSelected = stageApps.length > 0 && stageApps.every(app => selectedApps.has(app.id));
                        const borderColor = STAGE_COLORS[index % STAGE_COLORS.length];
                        const headerColor = borderColor.replace('border-', 'text-');
                        const accentBar = borderColor.replace('border-', 'bg-');

                        return (
                            <div
                                key={stage.id}
                                role="group"
                                style={boardStages.length > 4 ? { width: "calc((100% - 3rem) / 4)" } : undefined}
                                className={`relative flex flex-col h-full rounded-[4px] border bg-white overflow-hidden transition-colors snap-start ${boardStages.length > 4 ? "shrink-0" : "flex-1 min-w-0"} ${dragOverStageId === stage.id ? 'border-[#1976D2] ring-2 ring-[#1976D2]/15' : 'border-[#E0E0E0]'}`}
                                onDragOver={(e) => handleDragOver(e, stage.id)}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                {/* Colored stage accent */}
                                <div className={`h-1 w-full shrink-0 ${accentBar}`} />

                                {/* Column Header */}
                                <div className="px-4 pt-4 pb-3 flex flex-col gap-2 border-b border-[#EEEEEE]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${accentBar}`} />
                                            <h3 className="text-[13.5px] font-bold text-[#212121] truncate">
                                                {STAGE_NAME_KEYS[stage.name] ? t(STAGE_NAME_KEYS[stage.name]) : stage.name}
                                            </h3>
                                        </div>
                                        <span className="bg-[#F5F6F8] text-[#4F4F4F] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 min-w-[24px] text-center">
                                            {stageApps.length}
                                        </span>
                                    </div>

                                    {/* Selection Tool */}
                                    {stageApps.length > 0 && (
                                        <div className="flex items-center gap-2 px-1">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={(e) => handleSelectAllInStage(stage.id, e.target.checked)}
                                                className={`w-3.5 h-3.5 rounded border-[#E0E0E0] focus:ring-0 cursor-pointer ${headerColor}`}
                                            />
                                            <span className="text-xs font-bold text-[#616161]">
                                                {t("pipeline.selectAll")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Cards Container */}
                                <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4 space-y-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <AnimatePresence>
                                        {stageApps.map((app) => (
                                            <motion.div
                                                key={app.id}
                                                layout
                                                draggable={!isAllJobs}
                                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, app.id)}
                                                onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setViewApplication(app)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setViewApplication(app); } }}
                                                whileHover={{ y: -2 }}
                                                className={`
                                                    group relative bg-white border rounded-[4px] p-3.5 ${isAllJobs ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} transition-all shadow-sm
                                                    ${selectedApps.has(app.id) ? `border-[#1976D2] shadow-sm ring-1 ring-[#1976D2]` : `border-[#E0E0E0]/60 hover:border-[#1976D2]/40 hover:shadow-md`}
                                                    ${draggedAppId === app.id ? 'opacity-40 grayscale border-dashed border-[#9E9E9E]' : ''}
                                                `}
                                            >

                                                <div className="flex items-start gap-3 pointer-events-none">
                                                    <div className="pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedApps.has(app.id)}
                                                            onChange={() => {
                                                                handleSelection(app.id);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 rounded border-[#E0E0E0] text-[#1976D2] focus:ring-0 cursor-pointer pointer-events-auto transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <h4 className="text-[13px] font-bold text-[#263238] leading-snug truncate pr-2 group-hover:text-[#1565C0] transition-colors">
                                                                {app.candidate.full_name}
                                                            </h4>
                                                            <div className="flex flex-col gap-1 items-end shrink-0">
                                                                {app.ai_interview_score != null && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm transition-all animate-in fade-in zoom-in duration-300">
                                                                        <span className="material-icons text-[10px]">psychology</span>
                                                                        {t("pipeline.intShort")} {Math.round(app.ai_interview_score)}%
                                                                    </div>
                                                                )}
                                                                {app.ai_match_score !== undefined && (
                                                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${getScoreStyles(app.ai_match_score)}`}>
                                                                        <span className="material-icons text-[10px]">bolt</span>
                                                                        {t("pipeline.aiShort")} {Math.round(app.ai_match_score)}%
                                                                    </div>
                                                                )}
                                                                {app.aptitude_score != null && app.aptitude_score > 0 && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                                                                        <span className="material-icons text-[10px]">psychology</span>
                                                                        {t("pipeline.aptShort")} {app.aptitude_score}%
                                                                    </div>
                                                                )}
                                                                {app.coding_score != null && app.coding_score > 0 && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                                                        <span className="material-icons text-[10px]">code</span>
                                                                        {t("pipeline.codShort")} {app.coding_score}%
                                                                    </div>
                                                                )}
                                                                {app.assessment_score != null && app.aptitude_score == null && app.coding_score == null && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB] shadow-sm">
                                                                        <span className="material-icons text-[10px]">quiz</span>
                                                                        {t("pipeline.testShort")} {app.assessment_score}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Candidate Details Snippet */}
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-[11px] text-[#616161]">

                                                                {app.applied_at ? formatDistanceToNow(parseUTC(app.applied_at), { addSuffix: true })
                                                                    .replace("about ", "") : t("pipeline.recently")}
                                                            </div>


                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {stageApps.length === 0 && (
                                        <div className="mt-1 rounded-[4px] border border-dashed border-[#E0E0E0] py-10 flex flex-col gap-2 items-center justify-center text-[#9E9E9E]">
                                            <span className="material-icons-outlined text-[26px] text-[#BDBDBD]">inbox</span>
                                            <span className="text-[12px] font-medium">{t("pipeline.noCandidatesYet")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {viewApplication && (
                    <CandidateModal 
                        application={viewApplication} 
                        isOpen={!!viewApplication}
                        onClose={() => setViewApplication(null)} 
                        onStatusUpdate={handleStageChange}
                        onRefresh={fetchApplications}
                        onboardingTemplates={onboardingTemplates}
                        stages={boardStages}
                        allowStageMove={!isAllJobs}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedApps.size > 0 && (
                    <div className="absolute bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            className="pointer-events-auto bg-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] rounded-[4px] p-1.5 flex items-center gap-1.5 border border-[#E0E0E0] max-w-[calc(100vw-2rem)] overflow-x-auto [&::-webkit-scrollbar]:hidden"
                        >
                            <span className="px-3 text-[12.5px] text-[#616161] shrink-0 whitespace-nowrap">
                                <span className="font-bold text-[#212121]">{selectedApps.size}</span> {t("pipeline.selectedLabel")}
                            </span>
                            <div className="w-px h-6 bg-[#E0E0E0] shrink-0" />

                            {canAccess("candidates:update") && !isAllJobs && (
                                <button onClick={handleBulkMove} className="flex items-center gap-1.5 h-10 px-3.5 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons text-[18px]">arrow_forward</span>
                                    {t("pipeline.moveToNextRound")}
                                </button>
                            )}

                            {canAccess("communications:create") && (
                                <button onClick={() => setIsEmailModalOpen(true)} className="flex items-center gap-1.5 h-10 px-3.5 bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8] rounded-[4px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons text-[18px]">email</span>
                                    {t("pipeline.sendEmail")}
                                </button>
                            )}

                            {canAccess("assessments:moderate") && (
                                <button onClick={() => setIsAssessmentModalOpen(true)} className="flex items-center gap-1.5 h-10 px-3.5 bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8] rounded-[4px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons text-[18px]">psychology</span>
                                    {t("pipeline.sendAssessment")}
                                </button>
                            )}

                            {canAccess("onboarding:moderate") && (
                                <button onClick={() => setIsOnboardingModalOpen(true)} className="flex items-center gap-1.5 h-10 px-3.5 bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8] rounded-[4px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons-outlined text-[18px]">person_add</span>
                                    {t("pipeline.initiateOnboarding")}
                                </button>
                            )}

                            {canAccess("candidates:delete") && (
                                <>
                                    <div className="w-px h-6 bg-[#E0E0E0] shrink-0" />
                                    <button onClick={handleBulkDelete} className="flex items-center gap-1.5 h-10 px-3 text-[#C62828] hover:bg-[#FFEBEE] rounded-[4px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                        <span className="material-icons text-[18px]">delete</span>
                                        {t("common.delete")}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SendEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                candidateIds={Array.from(selectedApps).map(id => applications.find(a => a.id === id)?.candidate.id || "").filter(Boolean)}
                candidateEmails={Array.from(selectedApps).map(id => applications.find(a => a.id === id)?.candidate.email || "").filter(Boolean)}
                jobId={selectedJobId === "ALL" ? null : selectedJobId}
                token={token || ""}
            />

            <SendAssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => setIsAssessmentModalOpen(false)}
                applicationIds={Array.from(selectedApps)}
                token={token || ""}
            />

            <SendOnboardingModal
                isOpen={isOnboardingModalOpen}
                onClose={() => setIsOnboardingModalOpen(false)}
                applicationIds={Array.from(selectedApps)}
                token={token || ""}
            />
        </div>
    );
}
