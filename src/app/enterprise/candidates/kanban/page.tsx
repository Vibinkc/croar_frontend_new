"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; // Added
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import SendEmailModal from "@/components/enterprise/SendEmailModal";
import SendAssessmentModal from "@/components/enterprise/SendAssessmentModal";
import SendOnboardingModal from "@/components/enterprise/SendOnboardingModal";

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
}

interface OnboardingTemplate {
    id: string;
    name: string;
}

// --- Helpers ---
const STAGE_COLORS = [
    'border-[#5B53E0]',
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
}

function CandidateModal({ application, isOpen, onClose, onStatusUpdate, onRefresh, onboardingTemplates, stages }: CandidateModalProps) {
    const { token, canAccess } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    if (!isOpen || !application) return null;

    const { candidate, ai_match_score, ai_feedback } = application;
    const details = candidate.parsed_data || {};
    const feedback = ai_feedback || {};

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="Close panel"
            className="fixed inset-0 z-50 flex items-center justify-end bg-[#0E1014]/40 backdrop-blur-sm"
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
                <div className="sticky top-0 bg-white z-10 border-b border-[#E8EAED] px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[12px] bg-[#5B53E0] text-white flex items-center justify-center font-semibold text-[15px] shrink-0">
                            {(candidate.full_name || "?").split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#15171C] truncate">{candidate.full_name}</h2>
                            {candidate.email && <p className="text-[12.5px] text-[#8A929E] truncate">{candidate.email}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {application.onboarding_id ? (
                            canAccess("onboarding:read") && (
                                <button
                                    onClick={() => {
                                        window.location.href = `/enterprise/onboarding/${application.onboarding_id}`;
                                    }}
                                    className="h-9 px-3 bg-[#15803D] hover:bg-[#136a33] text-white rounded-[9px] text-[12px] font-semibold transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-icons-outlined text-[16px]">visibility</span>
                                    {"View onboarding"}
                                </button>
                            )
                        ) : (
                            canAccess("onboarding:moderate") && (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="h-9 bg-white border border-[#E1E4E8] rounded-[9px] px-2.5 text-[12px] font-medium text-[#374151] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all max-w-[150px]"
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                    >
                                        <option value="">Select template</option>
                                        {onboardingTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={async () => {
                                            if (!selectedTemplate) {
                                                alert("Please select an onboarding template first.");
                                                return;
                                            }
                                            if (!token) {
                                                alert("Your session has expired. Please log in again.");
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
                                                    alert("Onboarding initiated successfully!");
                                                    onRefresh();
                                                    onClose();
                                                } else {
                                                    const err = await res.json();
                                                    alert(err.detail || "Failed to initiate onboarding");
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert("Error initiating onboarding");
                                            }
                                        }}
                                        className="h-9 px-3 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[9px] text-[12px] font-semibold transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-icons-outlined text-[16px]">person_add</span>
                                        {"Initiate"}
                                    </button>
                                </div>
                            )
                        )}
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-[#F4F5F7] rounded-[9px] text-[#9AA3AF] hover:text-[#4B5563] transition-colors shrink-0">
                            <span className="material-icons-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Score Section */}
                    {ai_match_score !== undefined && (
                        <div className="bg-white rounded-[14px] p-5 border border-[#E8EAED]">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="text-[14px] font-bold text-[#15171C] flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-[8px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center"><span className="material-icons-outlined text-[18px]">psychology</span></span>
                                    {"AI Fit Analysis"}
                                </h3>
                                <div className={`px-2.5 py-1 rounded-[8px] text-[12px] font-semibold border ${getScoreStyles(ai_match_score)}`}>
                                    Score {ai_match_score}/100
                                </div>
                            </div>

                            {( (application.aptitude_score != null && application.aptitude_score > 0) || (application.coding_score != null && application.coding_score > 0) || (application.ai_interview_score != null && application.ai_interview_score > 0) ) && (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                    {application.aptitude_score != null && application.aptitude_score > 0 && (
                                        <div className="bg-[#F7F8FA] border border-[#E8EAED] p-3 rounded-[10px]">
                                            <h4 className="text-[10px] font-semibold text-[#9AA3AF] uppercase tracking-wide mb-1">Aptitude</h4>
                                            <div className="text-[16px] font-semibold text-[#15171C]">{application.aptitude_score}%</div>
                                        </div>
                                    )}
                                    {application.coding_score != null && application.coding_score > 0 && (
                                        <div className="bg-[#F7F8FA] border border-[#E8EAED] p-3 rounded-[10px]">
                                            <h4 className="text-[10px] font-semibold text-[#9AA3AF] uppercase tracking-wide mb-1">Coding</h4>
                                            <div className="text-[16px] font-semibold text-[#15171C]">{application.coding_score}%</div>
                                        </div>
                                    )}
                                    {application.ai_interview_score != null && application.ai_interview_score > 0 && (
                                        <div className="bg-[#F7F8FA] border border-[#E8EAED] p-3 rounded-[10px]">
                                            <h4 className="text-[10px] font-semibold text-[#9AA3AF] uppercase tracking-wide mb-1">AI Interview</h4>
                                            <div className="text-[16px] font-semibold text-[#15171C]">{Math.round(application.ai_interview_score)}%</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2.5">
                                {feedback.fit_reason && (
                                    <div className="bg-[#E6F4EA]/50 border border-[#CDEAD7] p-3.5 rounded-[10px]">
                                        <h4 className="text-[11px] font-bold text-[#15803D] uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><span className="material-icons-outlined text-[15px]">check_circle</span>Why fit</h4>
                                        <p className="text-[13px] text-[#4B5563] leading-relaxed">{feedback.fit_reason}</p>
                                    </div>
                                )}
                                {feedback.not_fit_reason && (
                                    <div className="bg-[#FDECEC]/50 border border-[#F5C9C9] p-3.5 rounded-[10px]">
                                        <h4 className="text-[11px] font-bold text-[#C0383C] uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><span className="material-icons-outlined text-[15px]">error</span>Gap analysis</h4>
                                        <p className="text-[13px] text-[#4B5563] leading-relaxed">{feedback.not_fit_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Highlights */}
                    {feedback.highlights && feedback.highlights.length > 0 && (
                        <div>
                            <h3 className="text-[14px] font-bold text-[#15171C] mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-[8px] bg-[#FEF3E2] text-[#D97706] flex items-center justify-center"><span className="material-icons-outlined text-[18px]">star</span></span>
                                {"Key Highlights"}
                            </h3>
                            <ul className="space-y-2.5">
                                {feedback.highlights.map((h: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#4B5563] leading-relaxed">
                                        <span className="material-icons-outlined text-[#15803D] text-[18px] mt-0.5 shrink-0">check_circle</span>
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <h3 className="text-[14px] font-bold text-[#15171C] mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-[8px] bg-[#E7ECFB] text-[#3559C7] flex items-center justify-center"><span className="material-icons-outlined text-[18px]">code</span></span>
                                {"Skills"}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-[#F4F5F7] border border-[#E8EAED] rounded-[8px] text-[12px] text-[#374151] font-medium">
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
        if (token) {
            fetchStages();
            fetchApplications();
            fetchTemplates();
        }
    }, [token, selectedJobId]);

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
                console.log("Fetched applications with scores:", list.map((a: Application) => ({ name: a.candidate?.full_name, ai: a.ai_match_score, inter: a.ai_interview_score })));
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
        } catch (error) {
            setApplications(originalApps);
            alert("Failed to move candidate.");
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

        if (!canAccess("candidates:update")) {
            console.warn("Permission denied: cannot move candidate.");
            return;
        }

        if (draggedAppId && draggedAppId !== stageId) {
            handleStageChange(draggedAppId, stageId);
        }
        setDraggedAppId(null);
    };

    const handleBulkMove = async () => {
        if (selectedApps.size === 0) return;

        const updates: { appId: string; newStage: number }[] = [];

        selectedApps.forEach(appId => {
            const app = applications.find(a => a.id === appId);
            if (!app) return;

            const currentIndex = stages.findIndex(s => String(s.id) === String(app.current_stage));
            if (currentIndex !== -1 && currentIndex < stages.length - 1) {
                const nextStage = stages[currentIndex + 1];
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
        }
    };

    const handleBulkDelete = async () => {
        if (selectedApps.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedApps.size} applications? This action cannot be undone.`)) return;

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
            alert("Failed to delete some applications. Please refresh.");
            fetchApplications(); // Refresh to get actual state
        }
    };


    // --- Computed ---
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = (app.candidate?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (app.candidate?.email || "").toLowerCase().includes(searchQuery.toLowerCase());

            const job = jobs.find(j => j.id === app.job_requirement_id);

            const matchesJob = !selectedJobId || app.job_requirement_id === selectedJobId;
            const matchesCompany = !selectedCompanyId || (job && job.company_id === selectedCompanyId);
            const matchesLocation = selectedLocation === "ALL" || (job && job.location === selectedLocation);
            const matchesScore = (app.ai_match_score || 0) >= minMatchScore;

            let matchesPeriod = true;
            if (appliedPeriod !== "ALL" && app.applied_at) {
                const appliedDate = new Date(app.applied_at);
                const now = new Date();
                const diffDays = (now.getTime() - appliedDate.getTime()) / (1000 * 3600 * 24);
                if (appliedPeriod === "TODAY") matchesPeriod = diffDays <= 1;
                else if (appliedPeriod === "7D") matchesPeriod = diffDays <= 7;
                else if (appliedPeriod === "30D") matchesPeriod = diffDays <= 30;
            }

            const matchesSource = selectedSource === "ALL" || (app.source || "AI Sourcing") === selectedSource;

            return matchesSearch && matchesJob && matchesCompany && matchesLocation && matchesScore && matchesPeriod && matchesSource;
        });
    }, [applications, searchQuery, selectedJobId, selectedCompanyId, selectedLocation, minMatchScore, appliedPeriod, selectedSource, jobs]);

    const getStageApps = (stageId: number | string) => filteredApplications.filter(app => String(app.current_stage) === String(stageId));

    const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));

    const selectedJobTitle = jobs.find(j => j.id === selectedJobId)?.title || "SELECT A JOB";

    if (isLoading && stages.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="w-8 h-8 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
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
        <div className="relative h-screen flex flex-col bg-white font-sans text-[#1F2127]">
            {/* NEW: Dual-Line Command Center */}
            <div className="flex flex-col bg-white border-b border-[#E8EAED] z-30 transition-all duration-300">

                {/* Header row: title + controls */}
                <div className="px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#F0F0F1]">
                    <div className="min-w-0">
                        <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Pipeline</h1>
                        <p className="text-[14px] text-[#8A929E] mt-1 truncate">
                            {selectedJobId && selectedJobId !== "ALL" ? selectedJobTitle : "Track candidates through every stage"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="relative group flex-1 lg:flex-none lg:w-80">
                            <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-lg group-focus-within:text-[#5B53E0] transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search candidates, emails, skills…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-[#F7F8FA] border border-[#E1E4E8] rounded-[10px] pl-11 pr-4 text-[14px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] focus:bg-white focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            title="Toggle Filters"
                            className={`flex items-center gap-2 px-4 h-11 rounded-[10px] transition-colors shrink-0 ${isFilterExpanded ? 'bg-[#5B53E0] text-white' : 'bg-[#F7F8FA] border border-[#E1E4E8] text-[#6B6F76] hover:bg-[#E8EAED]'}`}
                        >
                            <span className="material-icons-outlined text-xl">{isFilterExpanded ? 'filter_list_off' : 'filter_list'}</span>
                            <span className="text-[12px] font-semibold tracking-tight">Filters</span>
                        </button>
                    </div>
                </div>

                {/* Line 2: Advanced Filters (Expandable) */}
                <AnimatePresence>
                    {isFilterExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-[#F7F8FA]/50"
                        >
                            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">

                                {/* Company Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-company" className="text-[9px] font-bold text-[#9AA3AF]   ml-1">Enterprise Client</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-[10px] hover:border-[#DAD7F6] transition-all">
                                        <span className="material-icons-outlined text-[#9AA3AF] text-lg">corporate_fare</span>
                                        <select
                                            id="filter-company"
                                            value={selectedCompanyId}
                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#374151] outline-none w-full cursor-pointer"
                                        >
                                            <option value="">All Clients</option>
                                            {companies.length === 0 ? (
                                                <option disabled>No clients available</option>
                                            ) : (
                                                companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Role Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-job" className="text-[9px] font-bold text-[#9AA3AF]   ml-1">Target Requisition</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-[10px] hover:border-[#DAD7F6] transition-all">
                                        <span className="material-icons-outlined text-[#9AA3AF] text-lg">work</span>
                                        <select
                                            id="filter-job"
                                            value={selectedJobId}
                                            onChange={(e) => setSelectedJobId(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#374151] outline-none w-full cursor-pointer truncate"
                                        >
                                            <option value="">All Job Requirements</option>
                                            {jobs.length === 0 ? (
                                                <option disabled>No jobs available</option>
                                            ) : (
                                                jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Location Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-location" className="text-[9px] font-bold text-[#9AA3AF]   ml-1">Geographic Focus</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-[10px] hover:border-[#DAD7F6] transition-all">
                                        <span className="material-icons-outlined text-[#9AA3AF] text-lg">location_on</span>
                                        <select
                                            id="filter-location"
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#374151] outline-none w-full cursor-pointer"
                                        >
                                            <option value="ALL">Global Workforce</option>
                                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Match Score Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-score" className="text-[9px] font-bold text-[#9AA3AF]   ml-1">AI Match Accuracy</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-[10px] hover:border-[#DAD7F6] transition-all">
                                        <span className="material-icons text-[#5B53E0] text-lg">bolt</span>
                                        <select
                                            id="filter-score"
                                            value={minMatchScore}
                                            onChange={(e) => setMinMatchScore(Number(e.target.value))}
                                            className="bg-transparent text-[11px] font-bold text-[#374151] outline-none w-full cursor-pointer font-sans"
                                        >
                                            <option value={0}>Any Score</option>
                                            <option value={60}>High Match (60%+)</option>
                                            <option value={80}>Elite Match (80%+)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Application Period */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-period" className="text-[9px] font-bold text-[#9AA3AF]   ml-1">Application Recency</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-[10px] hover:border-[#DAD7F6] transition-all">
                                        <span className="material-icons-outlined text-[#9AA3AF] text-lg">calendar_today</span>
                                        <select
                                            id="filter-period"
                                            value={appliedPeriod}
                                            onChange={(e) => setAppliedPeriod(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#374151] outline-none w-full cursor-pointer"
                                        >
                                            <option value="ALL">Lifetime Activity</option>
                                            <option value="TODAY">Joined Today</option>
                                            <option value="7D">Last 7 Days</option>
                                            <option value="30D">Last 30 Days</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Source Filter */}
                                <div className="space-y-1.5">
                                    <label htmlFor="filter-source" className="text-[9px] font-bold text-[#9AA3AF]   ml-1">Origin Source</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-[10px] hover:border-[#DAD7F6] transition-all">
                                        <span className="material-icons-outlined text-[#9AA3AF] text-lg">share</span>
                                        <select
                                            id="filter-source"
                                            value={selectedSource}
                                            onChange={(e) => setSelectedSource(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-[#374151] outline-none w-full cursor-pointer"
                                        >
                                            <option value="ALL">All Sources</option>
                                            <option value="AI Sourcing">AI Sourcing</option>
                                            <option value="Job Portal">Job Portal</option>
                                            <option value="Direct Link">Direct Link</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-hidden bg-[#F7F8FA] p-6 flex flex-col">
                {!isLoading && applications.length === 0 && stages.length > 0 && (
                    <div className="mb-4 rounded-[14px] border border-[#DAD7F6] bg-[#ECEBFB]/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#15171C]">No candidates in this pipeline yet</p>
                            <p className="text-xs text-[#6B6F76] font-semibold mt-0.5">Source candidates with AI, or share the job&apos;s apply link so people can apply.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <Link href="/enterprise/sourcing/chat" className="px-4 py-2.5 rounded-[10px] bg-[#5B53E0] text-white text-xs font-bold hover:bg-[#4A43C9] transition-all flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-base">person_search</span>
                                {"Source candidates"}
                            </Link>
                            <Link href="/enterprise/croar-pilot" className="px-4 py-2.5 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-xs font-bold hover:border-[#5B53E0]/40 transition-all flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-base">smart_toy</span>
                                {"Ask Croar Pilot"}
                            </Link>
                        </div>
                    </div>
                )}
                <div className="relative flex-1 min-h-0">
                    {stages.length > 4 && (
                        <>
                            <button
                                onClick={() => scrollBoard(-1)}
                                title="Previous rounds"
                                className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#E8EAED] shadow-[0_4px_14px_rgba(15,23,42,0.12)] flex items-center justify-center text-[#4B5563] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 transition-colors"
                            >
                                <span className="material-symbols-rounded text-[20px]">chevron_left</span>
                            </button>
                            <button
                                onClick={() => scrollBoard(1)}
                                title="More rounds"
                                className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#E8EAED] shadow-[0_4px_14px_rgba(15,23,42,0.12)] flex items-center justify-center text-[#4B5563] hover:text-[#5B53E0] hover:border-[#5B53E0]/40 transition-colors"
                            >
                                <span className="material-symbols-rounded text-[20px]">chevron_right</span>
                            </button>
                        </>
                    )}
                    <div
                        ref={boardRef}
                        className="h-full flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x [&::-webkit-scrollbar]:hidden"
                    >
                    {stages.map((stage, index) => {
                        const stageApps = getStageApps(stage.id);
                        const isAllSelected = stageApps.length > 0 && stageApps.every(app => selectedApps.has(app.id));
                        const borderColor = STAGE_COLORS[index % STAGE_COLORS.length];
                        const headerColor = borderColor.replace('border-', 'text-');
                        const accentBar = borderColor.replace('border-', 'bg-');

                        return (
                            <div
                                key={stage.id}
                                role="group"
                                style={stages.length > 4 ? { width: "calc((100% - 3rem) / 4)" } : undefined}
                                className={`relative flex flex-col h-full rounded-[14px] border bg-white overflow-hidden transition-colors snap-start ${stages.length > 4 ? "shrink-0" : "flex-1 min-w-0"} ${dragOverStageId === stage.id ? 'border-[#5B53E0] ring-2 ring-[#5B53E0]/15' : 'border-[#E8EAED]'}`}
                                onDragOver={(e) => handleDragOver(e, stage.id)}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                {/* Colored stage accent */}
                                <div className={`h-1 w-full shrink-0 ${accentBar}`} />

                                {/* Column Header */}
                                <div className="px-4 pt-4 pb-3 flex flex-col gap-2 border-b border-[#F0F0F1]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${accentBar}`} />
                                            <h3 className="text-[13.5px] font-bold text-[#15171C] truncate">
                                                {stage.name}
                                            </h3>
                                        </div>
                                        <span className="bg-[#F4F5F7] text-[#4B5563] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 min-w-[24px] text-center">
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
                                                className={`w-3.5 h-3.5 rounded border-[#D4D7DC] focus:ring-0 cursor-pointer ${headerColor}`}
                                            />
                                            <span className="text-xs font-bold text-[#6B6F76]">
                                                SELECT ALL
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
                                                draggable
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
                                                    group relative bg-white border rounded-[12px] p-3.5 cursor-grab active:cursor-grabbing transition-all shadow-sm
                                                    ${selectedApps.has(app.id) ? `border-[#5B53E0] shadow-sm ring-1 ring-[#5B53E0]` : `border-[#E1E4E8]/60 hover:border-[#5B53E0]/40 hover:shadow-md`}
                                                    ${draggedAppId === app.id ? 'opacity-40 grayscale border-dashed border-[#9AA3AF]' : ''}
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
                                                            className="w-4 h-4 rounded border-[#D4D7DC] text-[#5B53E0] focus:ring-0 cursor-pointer pointer-events-auto transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <h4 className="text-[13px] font-bold text-[#1F2127] leading-snug truncate pr-2 group-hover:text-[#4A43C9] transition-colors">
                                                                {app.candidate.full_name}
                                                            </h4>
                                                            <div className="flex flex-col gap-1 items-end shrink-0">
                                                                {app.ai_interview_score != null && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm transition-all animate-in fade-in zoom-in duration-300">
                                                                        <span className="material-icons text-[10px]">psychology</span>
                                                                        Int: {Math.round(app.ai_interview_score)}%
                                                                    </div>
                                                                )}
                                                                {app.ai_match_score !== undefined && (
                                                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${getScoreStyles(app.ai_match_score)}`}>
                                                                        <span className="material-icons text-[10px]">bolt</span>
                                                                        AI: {Math.round(app.ai_match_score)}%
                                                                    </div>
                                                                )}
                                                                {app.aptitude_score != null && app.aptitude_score > 0 && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                                                                        <span className="material-icons text-[10px]">psychology</span>
                                                                        Apt: {app.aptitude_score}%
                                                                    </div>
                                                                )}
                                                                {app.coding_score != null && app.coding_score > 0 && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                                                        <span className="material-icons text-[10px]">code</span>
                                                                        Cod: {app.coding_score}%
                                                                    </div>
                                                                )}
                                                                {app.assessment_score != null && app.aptitude_score == null && app.coding_score == null && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-[#ECEBFB] text-[#4A43C9] border border-[#DAD7F6] shadow-sm">
                                                                        <span className="material-icons text-[10px]">quiz</span>
                                                                        Test: {app.assessment_score}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Candidate Details Snippet */}
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-[11px] text-[#6B6F76]">

                                                                {app.applied_at ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })
                                                                    .replace("about ", "") : "Recently"}
                                                            </div>


                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {stageApps.length === 0 && (
                                        <div className="mt-1 rounded-[12px] border border-dashed border-[#E1E4E8] py-10 flex flex-col gap-2 items-center justify-center text-[#9AA3AF]">
                                            <span className="material-icons-outlined text-[26px] text-[#C7CCD4]">inbox</span>
                                            <span className="text-[12px] font-medium">No candidates yet</span>
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
                        stages={stages}
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
                            className="pointer-events-auto bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] rounded-[14px] p-1.5 flex items-center gap-1.5 border border-[#E8EAED] max-w-[calc(100vw-2rem)] overflow-x-auto [&::-webkit-scrollbar]:hidden"
                        >
                            <span className="px-3 text-[12.5px] text-[#6B6F76] shrink-0 whitespace-nowrap">
                                <span className="font-bold text-[#15171C]">{selectedApps.size}</span> selected
                            </span>
                            <div className="w-px h-6 bg-[#E8EAED] shrink-0" />

                            {canAccess("candidates:update") && (
                                <button onClick={handleBulkMove} className="flex items-center gap-1.5 h-10 px-3.5 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[9px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons text-[18px]">arrow_forward</span>
                                    Move to next round
                                </button>
                            )}

                            {canAccess("communications:read") && (
                                <button onClick={() => setIsEmailModalOpen(true)} className="flex items-center gap-1.5 h-10 px-3.5 bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] rounded-[9px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons text-[18px]">email</span>
                                    Send email
                                </button>
                            )}

                            {canAccess("assessments:moderate") && (
                                <button onClick={() => setIsAssessmentModalOpen(true)} className="flex items-center gap-1.5 h-10 px-3.5 bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] rounded-[9px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons text-[18px]">psychology</span>
                                    Send assessment
                                </button>
                            )}

                            {canAccess("onboarding:moderate") && (
                                <button onClick={() => setIsOnboardingModalOpen(true)} className="flex items-center gap-1.5 h-10 px-3.5 bg-white border border-[#E1E4E8] text-[#374151] hover:bg-[#F4F5F7] rounded-[9px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                    <span className="material-icons-outlined text-[18px]">person_add</span>
                                    Initiate onboarding
                                </button>
                            )}

                            {canAccess("candidates:delete") && (
                                <>
                                    <div className="w-px h-6 bg-[#E8EAED] shrink-0" />
                                    <button onClick={handleBulkDelete} className="flex items-center gap-1.5 h-10 px-3 text-[#C0383C] hover:bg-[#FDECEC] rounded-[9px] text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors">
                                        <span className="material-icons text-[18px]">delete</span>
                                        Delete
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
