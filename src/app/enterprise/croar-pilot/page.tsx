"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import { PageHelp, Icon } from "@/components/ds";

interface Message {
    role: "user" | "agent";
    content: string;
    action?: PilotAction;
}

interface SessionMeta {
    session_id: string;
    title: string;
    updated_at?: string;
}

// Fields the agent pre-extracts from the user's hiring request to seed the setup form.
interface PilotPrefill {
    role?: string;
    seniority?: string;
    location?: string;
    openings?: string | number;
    skills?: string;
    employmentType?: string;
    interviewMode?: "AI" | "Human";
    interviewerEmail?: string;
    assessment?: string;
}

// crypto.randomUUID is unavailable on non-secure (HTTP) origins / older browsers.
const makeThreadId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `pilot-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const EXAMPLES = [
    "I need a senior React frontend developer in Bangalore, 2 openings",
    "Hire a backend Python engineer (3-6 yrs), remote",
    "Set up hiring for a junior UI/UX designer in Mumbai",
];

const SENIORITY = [
    { label: "Junior", exp: "0-2 years" },
    { label: "Mid", exp: "2-5 years" },
    { label: "Senior", exp: "5-8 years" },
    { label: "Lead", exp: "8+ years" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3.5 py-2 rounded-[4px] text-[12.5px] font-semibold border transition-colors ${
                active
                    ? "bg-[#1976D2] text-white border-[#1976D2]"
                    : "bg-white text-[#424242] border-[#E0E0E0] hover:border-[#1976D2]/50"
            }`}
        >
            {children}
        </button>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full bg-white border border-[#E0E0E0] rounded-[4px] px-3 h-10 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

const toISO = (d: Date) => d.toISOString().slice(0, 10);

function PilotSetupForm({
    onSubmit,
    onClose,
    initial,
}: {
    onSubmit: (msg: string) => void;
    onClose?: () => void;
    initial?: PilotPrefill;
}) {
    const { t } = useI18n();
    // Pre-fill from what the user already typed (extracted by the agent). Enum-valued
    // fields are validated against the allowed options, otherwise fall back to the default.
    const initSeniority = SENIORITY.some((s) => s.label === initial?.seniority) ? (initial!.seniority as string) : "Mid";
    const initAssessment = ["Coding", "Aptitude", "Both"].includes(initial?.assessment ?? "")
        ? (initial!.assessment as string)
        : "Both";
    const initMode: "AI" | "Human" = initial?.interviewMode === "Human" ? "Human" : "AI";
    const initEmployment = initial?.employmentType?.trim() || "Full Time";

    const [role, setRole] = useState(initial?.role?.trim() ?? "");
    const [seniority, setSeniority] = useState(initSeniority);
    const [location, setLocation] = useState(initial?.location?.trim() || "Remote");
    const [openings, setOpenings] = useState(initial?.openings ? String(initial.openings) : "1");
    const [employmentType, setEmploymentType] = useState(initEmployment);
    const [skills, setSkills] = useState(initial?.skills?.trim() ?? "");
    const [interviewMode, setInterviewMode] = useState<"AI" | "Human">(initMode);
    const [interviewerEmail, setInterviewerEmail] = useState(initial?.interviewerEmail ?? "");
    const [slots, setSlots] = useState("5");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [startDate, setStartDate] = useState(() => toISO(new Date()));
    const [endDate, setEndDate] = useState(() => toISO(new Date(Date.now() + 14 * 86400000)));
    const [assessment, setAssessment] = useState(initAssessment);
    const [questions, setQuestions] = useState("10");
    const [duration, setDuration] = useState("30");

    const [step, setStep] = useState(0);
    const STEPS = ["Role", "Interview", "Assessment"];

    const today = toISO(new Date());
    // Domain labels exclude '.', so the parts can't overlap -> linear matching (no backtracking).
    const emailValid = /^[^\s@]+@[^\s.@]+(?:\.[^\s.@]+)+$/.test(interviewerEmail);
    // Interview dates can't be in the past — you can't schedule interviews on a day that's gone.
    const startInPast = !!startDate && startDate < today;
    const datesValid = !!startDate && !!endDate && !startInPast && endDate >= startDate;
    const step0Valid = role.trim().length > 1;
    const step1Valid = (interviewMode === "AI" || emailValid) && datesValid;
    const stepValid = [step0Valid, step1Valid, true][step];
    const isLast = step === STEPS.length - 1;

    const build = () => {
        if (!step0Valid || !step1Valid) return; // guard against programmatic/invalid submits
        // Coerce numeric fields to sane values so the composed message is always clean.
        const num = (v: string, def: number, lo: number, hi: number) => {
            const n = Number.parseInt(v, 10);
            return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : def));
        };
        const exp = SENIORITY.find((s) => s.label === seniority)?.exp || "";
        const interview =
            interviewMode === "AI"
                ? "an AI-conducted interview"
                : `a human interview (interviewer email: ${interviewerEmail.trim()})`;
        const msg =
            `Hire a ${role.trim()}. Seniority: ${seniority} (${exp}). ` +
            `Employment type: ${employmentType}. ` +
            `Location/mode: ${location.trim() || "Remote"}. Openings: ${num(openings, 1, 1, 999)}. ` +
            (skills.trim() ? `Key skills: ${skills.trim()}. ` : "") +
            `Interview: ${interview}, ${num(slots, 5, 1, 50)} slots/day, window ${startTime}-${endTime}, ` +
            `dates ${startDate} to ${endDate}. ` +
            `Assessment: ${assessment}, ${num(questions, 10, 1, 50)} questions, ${num(duration, 30, 5, 240)} minutes. ` +
            `Set up the COMPLETE automated pipeline now, generate the role-specific assessment & ` +
            `interview questions and templates, and make it fully hands-off.`;
        onSubmit(msg);
    };

    return (
        <div className="mb-3 rounded-[4px] border border-[#E0E0E0] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1976D2]">{t("croarPilot.quickSetup")}</p>
                {onClose && (
                    <button onClick={onClose} className="text-[#9E9E9E] hover:text-[#424242] transition-colors" title={t("croarPilot.close")}>
                        <i className="mdi mdi-close text-lg" />
                    </button>
                )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <div
                            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                                i === step ? "text-[#1976D2]" : i < step ? "text-[#2E7D32]" : "text-[#9E9E9E]"
                            }`}
                        >
                            <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    i === step
                                        ? "bg-[#1976D2] text-white"
                                        : i < step
                                          ? "bg-[#2E7D32] text-white"
                                          : "bg-[#EEEEEE] text-[#757575]"
                                }`}
                            >
                                {i < step ? "✓" : i + 1}
                            </span>
                            {t("croarPilot.step" + label)}
                        </div>
                        {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[#E0E0E0]" />}
                    </div>
                ))}
            </div>

            {/* Step 1 — Role */}
            {step === 0 && (
                <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label={t("croarPilot.roleTitle")}>
                            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("croarPilot.rolePlaceholder")} className={inputCls} />
                        </Field>
                        <Field label={t("croarPilot.locationMode")}>
                            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                    <Field label={t("croarPilot.seniorityLabel")}>
                        <div className="flex flex-wrap gap-2">
                            {SENIORITY.map((s) => (
                                <Chip key={s.label} active={seniority === s.label} onClick={() => setSeniority(s.label)}>
                                    {t("croarPilot.sen" + s.label)}
                                </Chip>
                            ))}
                        </div>
                    </Field>
                    <Field label={t("croarPilot.employmentType")}>
                        <input
                            value={employmentType}
                            onChange={(e) => setEmploymentType(e.target.value)}
                            placeholder={t("croarPilot.jobTypePlaceholder")}
                            className={inputCls}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t("croarPilot.openings")}>
                            <input type="number" min="1" value={openings} onChange={(e) => setOpenings(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label={t("croarPilot.keySkills")}>
                            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t("croarPilot.skillsPlaceholder")} className={inputCls} />
                        </Field>
                    </div>
                </div>
            )}

            {/* Step 2 — Interview */}
            {step === 1 && (
                <div className="space-y-3.5">
                    <Field label={t("croarPilot.interviewModeLabel")}>
                        <div className="flex gap-2">
                            <Chip active={interviewMode === "AI"} onClick={() => setInterviewMode("AI")}>{t("croarPilot.aiConducted")}</Chip>
                            <Chip active={interviewMode === "Human"} onClick={() => setInterviewMode("Human")}>{t("croarPilot.humanInterviewer")}</Chip>
                        </div>
                    </Field>
                    {interviewMode === "Human" && (
                        <Field label={t("croarPilot.interviewerEmailLabel")}>
                            <input
                                value={interviewerEmail}
                                onChange={(e) => setInterviewerEmail(e.target.value)}
                                placeholder={t("croarPilot.interviewerPlaceholder")}
                                className={`${inputCls} ${interviewerEmail && !emailValid ? "!border-[#E53935]" : ""}`}
                            />
                        </Field>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                        <Field label={t("croarPilot.slotsPerDay")}>
                            <input type="number" min="1" value={slots} onChange={(e) => setSlots(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label={t("croarPilot.fromLabel")}>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label={t("croarPilot.toLabel")}>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t("croarPilot.interviewDatesStart")}>
                            <input
                                type="date"
                                value={startDate}
                                min={today}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`${inputCls} ${startInPast ? "!border-[#E53935]" : ""}`}
                            />
                        </Field>
                        <Field label={t("croarPilot.endLabel")}>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`${inputCls} ${endDate && endDate < startDate ? "!border-[#E53935]" : ""}`}
                            />
                        </Field>
                    </div>
                </div>
            )}

            {/* Step 3 — Assessment */}
            {step === 2 && (
                <div className="space-y-3.5">
                    <Field label={t("croarPilot.assessmentType")}>
                        <div className="flex gap-2">
                            {["Coding", "Aptitude", "Both"].map((a) => (
                                <Chip key={a} active={assessment === a} onClick={() => setAssessment(a)}>
                                    {t(a === "Aptitude" ? "croarPilot.aptitudeSkills" : "croarPilot.assess" + a)}
                                </Chip>
                            ))}
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#757575]">
                            {t("croarPilot.codingForProgramming")} <span className="font-semibold">{t("croarPilot.aptitudeSkills")}</span> for
                            design, marketing, sales & other non-technical roles — the questions are generated specifically
                            for that role.
                        </p>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="# Questions">
                            <input type="number" min="1" value={questions} onChange={(e) => setQuestions(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label={t("croarPilot.durationMinLabel")}>
                            <input type="number" min="5" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 mt-5">
                <button
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="px-4 h-10 rounded-[4px] text-[13px] font-semibold text-[#424242] border border-[#E0E0E0] hover:bg-[#F5F6F8] transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                    <i className="mdi mdi-chevron-left text-lg" />
                    {"Previous"}
                </button>
                {isLast ? (
                    <button
                        onClick={build}
                        disabled={!step0Valid || !step1Valid}
                        className="px-5 h-10 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <i className="mdi mdi-rocket-launch text-lg" />
                        {"Build pipeline"}
                    </button>
                ) : (
                    <button
                        onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                        disabled={!stepValid}
                        className="px-5 h-10 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                        {"Next"}
                        <i className="mdi mdi-chevron-right text-lg" />
                    </button>
                )}
            </div>
        </div>
    );
}

interface SourcedCandidate {
    full_name?: string;
    headline?: string;
    platform?: string;
    location?: string;
    profile_url?: string;
    email?: string | null;
}

interface PilotAction {
    ui?: string;
    job_id?: string;
    role?: string;
    armed?: string[];
    profiles?: SourcedCandidate[];
    // Set once invites are sent from a candidate picker, so the "invites sent" confirmation +
    // next-step guidance survives a reload / navigating away and back (it's not local-only state).
    invitedResult?: string;
}

// Actionable result card shown after the agent builds a pipeline.
function PipelineBuiltCard({ action, onSource }: { action: PilotAction; onSource: () => void }) {
    const { t } = useI18n();
    return (
        <div className="rounded-[4px] border border-[#C8E6C9] bg-[#E8F5E9]/40 p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-[4px] bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
                    <i className="mdi mdi-check-circle text-[20px]" />
                </div>
                <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#212121] truncate">
                        Pipeline ready{action.role ? ` · ${action.role}` : ""}
                    </p>
                    <p className="text-[12px] text-[#757575]">{t("croarPilot.liveJobCreated")}</p>
                </div>
            </div>

            {action.armed && action.armed.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                    {action.armed.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-[#424242]">
                            <i className="mdi mdi-check text-[#2E7D32] text-base mt-0.5" />
                            <span>{a}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-wrap gap-1.5">
                {action.job_id && (
                    <Link
                        href={`/enterprise/jobs/${action.job_id}`}
                        className="px-2.5 h-8 rounded-[4px] bg-[#1976D2] text-white text-[11.5px] font-semibold hover:bg-[#1565C0] transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                        <i className="mdi mdi-briefcase text-[15px]" /> {t("croarPilot.viewJob")}
                    </Link>
                )}
                <button
                    onClick={onSource}
                    className="px-2.5 h-8 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[11.5px] font-semibold hover:bg-[#F5F6F8] transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                    <i className="mdi mdi-account-search text-[15px]" /> {t("croarPilot.sourceCandidates")}
                </button>
                <Link
                    href={action.job_id ? `/enterprise/sourcing/projects?job_id=${action.job_id}` : "/enterprise/sourcing/projects"}
                    className="px-2.5 h-8 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[11.5px] font-semibold hover:bg-[#F5F6F8] transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                    <i className="mdi mdi-robot text-[15px]" /> {t("croarPilot.sourceViaAgent")}
                </Link>
                <Link
                    href="/enterprise/candidates/kanban"
                    className="px-2.5 h-8 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[11.5px] font-semibold hover:bg-[#F5F6F8] transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                    <i className="mdi mdi-view-column text-[15px]" /> {t("croarPilot.viewPipeline")}
                </Link>
            </div>
        </div>
    );
}

// The candidates are already searched server-side (by the source_candidates tool) and arrive on
// the chat response — this just renders them as a selectable list and sends invites.
function CandidatePicker({
    jobId,
    candidates,
    token,
    initialResult,
    onInvited,
}: {
    jobId?: string;
    candidates: SourcedCandidate[];
    token: string | null;
    initialResult?: string;
    onInvited?: (result: string) => void;
}) {
    const { t } = useI18n();
    const [selected, setSelected] = useState<Set<number>>(
        () => new Set(candidates.map((c, i) => (c.email ? i : -1)).filter((i) => i >= 0)),
    );
    const [sending, setSending] = useState(false);
    // Seed from a previously-persisted result so the "invites sent" confirmation reappears on reload.
    const [result, setResult] = useState<string | null>(initialResult ?? null);
    const [error, setError] = useState<string | null>(null);

    const toggle = (i: number) =>
        setSelected((s) => {
            const n = new Set(s);
            if (n.has(i)) n.delete(i);
            else n.add(i);
            return n;
        });
    const allSelected = candidates.length > 0 && selected.size === candidates.length;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(candidates.map((_, i) => i)));

    const send = async () => {
        if (!token || selected.size === 0 || !jobId) return;
        setSending(true);
        setError(null);
        try {
            const chosen = [...selected].map((i) => ({
                name: candidates[i].full_name,
                email: candidates[i].email,
                platform: candidates[i].platform,
                profile_url: candidates[i].profile_url,
                headline: candidates[i].headline,
                location: candidates[i].location,
            }));
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/pilot/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ job_id: jobId, candidates: chosen }),
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok && d.status === "success") {
                const msg = d.test_mode
                    ? `✓ Sent ${d.sent} test invite${d.sent === 1 ? "" : "s"} to ${d.test_email} (testing — real candidates were not emailed).`
                    : `✓ Sent ${d.sent} invite${d.sent === 1 ? "" : "s"}.${d.failed ? ` ${d.failed} failed.` : ""}`;
                setResult(msg);
                onInvited?.(msg); // persist into the chat so it survives navigation / reload
            } else {
                setError(d.detail || t("croarPilot.failedSendInvites"));
            }
        } catch {
            setError(t("croarPilot.failedSendInvites"));
        } finally {
            setSending(false);
        }
    };

    if (result) {
        return (
            <div className="rounded-[4px] border border-[#C8E6C9] bg-[#E8F5E9]/50 p-4">
                <p className="text-[13px] font-semibold text-[#2E7D32]">{result}</p>
                {/* Guide a first-time user on the next step so they're not left wondering "now what?". */}
                <p className="mt-2 text-[12px] leading-relaxed text-[#3F6B4F]">
                    {t("croarPilot.sourcedCandidatesLive")} <strong>{t("croarPilot.jobPageWord")}</strong>. {t("croarPilot.eachInvitedCandidate")}{" "}
                    <strong>{t("croarPilot.pipeline")}</strong> {t("croarPilot.screeningFlow")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {jobId && (
                        <Link
                            href={`/enterprise/jobs/${jobId}?tab=sourcing`}
                            className="px-3.5 h-9 rounded-[4px] bg-[#1976D2] text-white text-[12.5px] font-semibold hover:bg-[#1565C0] transition-colors flex items-center gap-1.5"
                        >
                            <i className="mdi mdi-account-search text-base" /> {t("croarPilot.viewSourcedCandidates")}
                        </Link>
                    )}
                    <Link
                        href="/enterprise/candidates/kanban"
                        className="px-3.5 h-9 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[12.5px] font-semibold hover:bg-[#F5F6F8] transition-colors flex items-center gap-1.5"
                    >
                        <i className="mdi mdi-view-column text-base" /> {t("croarPilot.viewPipeline")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[4px] border border-[#E0E0E0] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1976D2]">{t("croarPilot.candidates")}</p>
                {candidates.length > 0 && (
                    <button onClick={toggleAll} className="text-[11px] font-semibold text-[#1976D2] hover:underline">
                        {allSelected ? "Clear all" : "Select all"}
                    </button>
                )}
            </div>

            {candidates.length === 0 ? (
                <p className="text-[13px] text-[#757575] py-4 text-center">{t("croarPilot.noCandidatesRole")}</p>
            ) : (
                <>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {candidates.map((c, i) => (
                            <label
                                key={i}
                                className={`flex items-start gap-3 p-2.5 rounded-[4px] border cursor-pointer transition-colors ${
                                    selected.has(i) ? "border-[#1976D2]/50 bg-[#E3F2FD]/40" : "border-[#E0E0E0] bg-white hover:border-[#1976D2]/30"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(i)}
                                    onChange={() => toggle(i)}
                                    className="mt-1 accent-[#1976D2]"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#212121] text-[13.5px] truncate">{c.full_name || "Unknown"}</span>
                                        {c.platform && (
                                            <span className="text-[9px] font-bold uppercase tracking-wide text-[#757575] bg-[#EEEEEE] px-1.5 py-0.5 rounded">
                                                {c.platform}
                                            </span>
                                        )}
                                    </div>
                                    {c.headline && <p className="text-[12px] text-[#757575] truncate">{c.headline}</p>}
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {c.email ? (
                                            <span className="text-[11px] text-[#2E7D32] font-semibold truncate">{c.email}</span>
                                        ) : (
                                            <span className="text-[11px] text-[#9E9E9E]">no email found</span>
                                        )}
                                        {c.profile_url && (
                                            <a
                                                href={c.profile_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[11px] text-[#1976D2] hover:underline"
                                            >
                                                profile ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    {error && <p className="text-[12px] text-[#C62828] mt-2">{error}</p>}

                    <button
                        onClick={send}
                        disabled={sending || selected.size === 0}
                        className="mt-4 w-full h-11 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <i className="mdi mdi-email-check text-lg" />
                        {sending ? "Sending…" : `Send invites to ${selected.size} selected`}
                    </button>
                    <p className="mt-2 text-[10px] text-center text-[#EF6C00] font-semibold">
                        🧪 Testing — invites are redirected to vibi@appxcess.com, not real candidates.
                    </p>
                </>
            )}
        </div>
    );
}

// localStorage key for the in-progress Pilot chat (so it survives navigating away and back).
const PILOT_CHAT_KEY = "croar.pilot.currentChat";

// sessionStorage keys another module writes before sending the user here with a request.
const HANDOFF_KEYS = { rounds: "croar_rounds_job", source: "croar_source_job" } as const;
type HandoffKind = keyof typeof HANDOFF_KEYS;
type Handoff = { kind: HandoffKind; ctx: Record<string, unknown> };

/** Read a pending hand-off WITHOUT consuming it.
 *
 * Deliberately non-destructive and safe to call more than once: it is used as a useState
 * initializer, which React invokes twice under StrictMode. Consuming the key here would make the
 * second call return null and the arriving request would land in whatever chat was already open. */
function readPilotHandoff(): Handoff | null {
    if (typeof window === "undefined") return null;
    for (const kind of Object.keys(HANDOFF_KEYS) as HandoffKind[]) {
        try {
            const raw = sessionStorage.getItem(HANDOFF_KEYS[kind]);
            if (!raw) continue;
            const ctx = JSON.parse(raw);
            if (ctx?.autostart) return { kind, ctx };
        } catch {
            /* malformed or storage blocked — treat as "no hand-off" */
        }
    }
    return null;
}

const cleanText = (s: unknown) =>
    String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&lt;|&gt;/g, " ").replace(/\s+/g, " ").trim();

// While the Pilot works, poll the backend for the REAL step it's on right now (e.g. "Generating the
// questions…") and show exactly that — no guessing. Falls back to a single "Working on it…" line
// during the brief window before the first step is reported (or for plain chat with no tool step).
function PilotThinking({ threadId, token }: { threadId: string; token: string | null }) {
    const [step, setStep] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        let alive = true;
        const poll = async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/api/v1/agents/pilot/progress?thread_id=${encodeURIComponent(threadId)}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (res.ok) {
                    const d = await res.json();
                    if (alive) setStep(d.step || null);
                }
            } catch {
                /* ignore */
            }
        };
        poll();
        const id = setInterval(poll, 1200);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, [threadId, token]);

    const label = step || "Working on it…";
    return (
        <div className="flex gap-3">
            <div
                className="w-8 h-8 rounded-[4px] flex items-center justify-center text-white shrink-0 animate-pulse"
                style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
            >
                <i className="mdi mdi-lightning-bolt text-[19px]" />
            </div>
            <div className="bg-white border border-[#E0E0E0] px-4 py-3 rounded-[4px] rounded-tl-[4px] flex items-center gap-3 min-w-[250px]">
                {/* key={label} re-triggers the fade each time the real step changes */}
                <span
                    key={label}
                    className="text-[12.5px] font-semibold text-[#1976D2] animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                    {label}
                </span>
                <span className="flex gap-1 ml-auto shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42A5F5] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42A5F5] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#42A5F5] animate-bounce" />
                </span>
            </div>
        </div>
    );
}

export default function CroarPilotPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const [threadId, setThreadId] = useState(makeThreadId());
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<SessionMeta[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [setupDone, setSetupDone] = useState<Set<number>>(new Set());
    const titleRef = useRef<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const persistReady = useRef(false); // guards the persist effect until after initial hydration
    // Whether we arrived carrying a request from another module, decided ONCE at first render.
    // Everything below keys off this value rather than re-reading sessionStorage, so restoring the
    // previous chat and consuming the hand-off can no longer race each other.
    const [handoff] = useState(readPilotHandoff);
    const handoffSent = useRef(false); // a hand-off request is sent exactly once per visit
    // Job handed off from "Source with Croar Pilot": carried as request metadata on every turn of
    // this sourcing conversation so the agent sources for THIS exact job (no re-asking which one).
    const sourceJobRef = useRef<{ id?: string; title?: string; intent?: "rounds" | "sourcing" } | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/pilot/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setSessions(Array.isArray(d) ? d : []);
            }
        } catch {
            /* ignore */
        }
    }, [token]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    // Restore the in-progress chat when returning to the page, so the conversation (pipeline card,
    // sourced candidates, "invites sent" guidance) doesn't vanish on navigation. Client-only.
    useEffect(() => {
        // A request handed over from another module always opens a FRESH chat. Restoring the
        // previous one here would drop that request into the middle of an unrelated conversation
        // and swap in its threadId, so the agent would answer with the old chat's context.
        if (handoff) return;
        try {
            const raw = localStorage.getItem(PILOT_CHAT_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                if (Array.isArray(saved?.messages) && saved.messages.length) {
                    setMessages(saved.messages);
                    if (saved.threadId) setThreadId(saved.threadId);
                    if (saved.currentSessionId) setCurrentSessionId(saved.currentSessionId);
                    titleRef.current = saved.title || "";
                    // Restore WHICH job this chat is about. Without this a page reload dropped the
                    // job context, so the next turn made the agent ask "which job?" mid-conversation.
                    if (saved.sourceJob?.id) sourceJobRef.current = saved.sourceJob;
                }
            }
        } catch {
            /* ignore */
        }
    // Mount-only on purpose: this hydrates the chat once. `handoff` is set by a useState with no
    // setter, so it is fixed for the life of the page and cannot go stale here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist the chat on every change (skip the first run so we don't clobber storage before the
    // hydration above has committed its restored messages).
    useEffect(() => {
        if (!persistReady.current) {
            persistReady.current = true;
            return;
        }
        try {
            if (messages.length) {
                localStorage.setItem(
                    PILOT_CHAT_KEY,
                    JSON.stringify({ messages, threadId, currentSessionId, title: titleRef.current, sourceJob: sourceJobRef.current }),
                );
            } else {
                localStorage.removeItem(PILOT_CHAT_KEY);
            }
        } catch {
            /* ignore */
        }
    }, [messages, threadId, currentSessionId]);

    const saveSession = async (msgs: Message[], title: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/pilot/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    title,
                    messages: msgs,
                    thread_id: threadId,
                }),
            });
            if (res.ok) {
                const d = await res.json();
                if (!currentSessionId && d.session_id) setCurrentSessionId(d.session_id);
                fetchSessions();
            }
        } catch {
            /* ignore */
        }
    };

    const send = async (text: string = input) => {
        if (!text.trim() || isLoading || !token) return;

        const isFirst = messages.length === 0;
        if (isFirst) titleRef.current = text.length > 42 ? `${text.slice(0, 42)}…` : text;

        const withUser: Message[] = [...messages, { role: "user", content: text }];
        setMessages(withUser);
        setInput("");
        setIsLoading(true);

        // Pilot tasks (sourcing, pipeline building) can legitimately run for a few
        // minutes. Give the request a generous client timeout so the browser doesn't
        // abort it early — and, when it does time out, say so instead of falsely
        // claiming the backend is down.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 240000); // 4 minutes

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    message: text,
                    thread_id: threadId,
                    context: "pilot",
                    metadata: sourceJobRef.current?.id
                        ? {
                              source_job_id: sourceJobRef.current.id,
                              source_job_title: sourceJobRef.current.title || "",
                              // Tells the server which task this chat is for, so it doesn't inject
                              // "the user is sourcing candidates" into a rounds conversation.
                              intent: sourceJobRef.current.intent || "general",
                          }
                        : {},
                }),
                signal: controller.signal,
            });
            const d = await res.json().catch(() => ({}));
            const reply = res.ok
                ? d.response || "Done."
                : `Pilot error: ${d.detail || "the request couldn't be completed. Please try again."}`;
            const action: PilotAction | undefined =
                res.ok && ["candidate_picker", "pipeline_built"].includes(d.pilot_action?.ui)
                    ? d.pilot_action
                    : undefined;
            const finalMsgs: Message[] = [...withUser, { role: "agent", content: reply, action }];
            setMessages(finalMsgs);
            saveSession(finalMsgs, titleRef.current || text.slice(0, 42));
        } catch (err) {
            const timedOut = err instanceof DOMException && err.name === "AbortError";
            const content = timedOut
                ? "That request is taking longer than usual — the Pilot may still be working on it in the background (sourcing and pipeline tasks can take a few minutes). Give it a moment, then try again or narrow the request."
                : "I couldn't reach the Pilot service just now. Please check your connection and try again in a moment.";
            setMessages((prev) => [...prev, { role: "agent", content }]);
        } finally {
            clearTimeout(timeout);
            setIsLoading(false);
        }
    };

    // A request handed over from another module (job form -> "build the rounds with Croar Pilot",
    // or "Source with Croar Pilot") is sent as the FIRST message of a brand-new chat. `handoff` was
    // captured at first render, so this no longer depends on the sessionStorage key still being
    // there by the time the effect runs.
    useEffect(() => {
        if (!token || !handoff || handoffSent.current) return;
        handoffSent.current = true;

        // Consume the key now that we have definitely acted on it, and drop the stored chat so a
        // later mount cannot restore the previous conversation on top of this one.
        try {
            sessionStorage.removeItem(HANDOFF_KEYS[handoff.kind]);
            localStorage.removeItem(PILOT_CHAT_KEY);
        } catch {
            /* ignore */
        }

        const ctx = handoff.ctx;
        const jobId = ctx?.id ? String(ctx.id) : "";
        const title = cleanText(ctx?.title);
        const skills = cleanText(ctx?.skills);

        let prompt = "";
        if (handoff.kind === "rounds") {
            if (!jobId) return;
            const jd = cleanText(ctx?.description).slice(0, 2000);
            prompt =
                `I've just created the "${title || "this"}" job in Croar (job_id: ${jobId}) and saved it as a Draft.` +
                (skills ? ` Key skills: ${skills}.` : "") +
                (jd ? ` Job description: ${jd}` : "") +
                ` Please design the interview rounds for this role — propose a sensible set of stages` +
                ` for its seniority and skills, then save them onto this job with set_job_rounds.` +
                ` Tell me what you picked and why, and let me know I can ask you to adjust them.`;
        } else {
            if (!title && !skills) return;
            // The job ALREADY exists (just created via the job form) — tell the Pilot so it sources
            // for the existing job instead of building a new pipeline. No count is given, so it will
            // ask "How many candidates should I source?" before it starts sourcing.
            prompt =
                `I've already created the "${title || "this"}" job in Croar${skills ? ` (key skills: ${skills})` : ""}.` +
                ` Please source candidates for this existing job — you don't need to create a new pipeline.`;
        }

        // Carry the job on every turn so the agent never has to ask which one it is.
        if (jobId || title) sourceJobRef.current = { id: jobId || undefined, title, intent: handoff.kind === "rounds" ? "rounds" : "sourcing" };
        send(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, handoff]);

    const loadSession = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/pilot/sessions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setMessages(Array.isArray(d.messages) ? d.messages : []);
                setCurrentSessionId(id);
                titleRef.current = d.title || "";
                if (d.thread_id) setThreadId(d.thread_id);
                setShowHistory(false);
            }
        } catch {
            /* ignore */
        }
    };

    const newChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        titleRef.current = "";
        sourceJobRef.current = null; // drop any handed-off job so it doesn't leak into a new chat
        setThreadId(makeThreadId());
        try {
            localStorage.removeItem(PILOT_CHAT_KEY);
        } catch {
            /* ignore */
        }
    };

    const deleteSession = async (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
        e.stopPropagation();
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/v1/agents/pilot/sessions/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSessions();
            if (id === currentSessionId) newChat();
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="relative flex flex-col h-[calc(100vh-2rem)] w-full bg-[#F5F6F8]">
            {/* Soft indigo glow behind the top of the page */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-72 z-0"
                style={{ background: "radial-gradient(680px 220px at 50% -45%, rgba(25,118,210,0.12), transparent 70%)" }}
            />

            {/* History backdrop */}
            {showHistory && (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={t("croarPilot.closeHistory")}
                    onClick={() => setShowHistory(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowHistory(false); }}
                    className="fixed inset-0 z-40 bg-[#1E2A38]/40 backdrop-blur-sm"
                />
            )}

            {/* History drawer (slides in) */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E0E0E0] flex flex-col transition-transform duration-300 ease-in-out ${
                    showHistory ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-[13px] font-bold text-[#212121]">{t("croarPilot.conversations")}</span>
                    <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:bg-[#F5F6F8] transition-colors">
                        <i className="mdi mdi-close text-[20px]" />
                    </button>
                </div>
                <div className="px-3 pb-2">
                    <button
                        onClick={newChat}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-[4px] bg-[#1976D2] text-white text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors"
                    >
                        <i className="mdi mdi-plus text-[20px]" />
                        {"New chat"}
                    </button>
                </div>
                <p className="px-5 pt-1 text-[10px] font-bold text-[#757575] uppercase tracking-[0.1em]">{t("croarPilot.history")}</p>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
                    {sessions.length === 0 && (
                        <p className="text-[12px] text-[#9E9E9E] px-2 py-3">{t("croarPilot.noConversations")}</p>
                    )}
                    {sessions.map((s) => (
                        <button
                            key={s.session_id}
                            onClick={() => loadSession(s.session_id)}
                            className={`group w-full text-left px-3 py-2.5 rounded-[4px] text-[13px] flex items-center gap-2 transition-colors ${
                                s.session_id === currentSessionId
                                    ? "bg-[#E3F2FD] text-[#1565C0] font-semibold"
                                    : "text-[#424242] hover:bg-[#F5F6F8]"
                            }`}
                        >
                            <i className="mdi mdi-forum text-base shrink-0 text-[#9E9E9E]" />
                            <span className="truncate flex-1">{s.title || "Untitled"}</span>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => deleteSession(e, s.session_id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        deleteSession(e, s.session_id);
                                    }
                                }}
                                className="mdi mdi-delete text-base text-[#BDBDBD] hover:text-[#E53935] opacity-0 group-hover:opacity-100 transition-all"
                                title={t("croarPilot.deleteLabel")}
                            />
                        </button>
                    ))}
                </div>
            </aside>

            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4 px-4 sm:px-5 md:px-7 shrink-0">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">
                            Croar Pilot
                        </h1>
                        <PageHelp title="Croar Pilot">
                            <p>Describe a role and let AI build the job, candidate pipeline and automations for you.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">Autonomous AI recruiting companion for sourcing &amp; hiring</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shadow-sm"
                    >
                        <i className="mdi mdi-history text-[18px] text-[#616161]" />
                        {t("croarPilot.history")}
                    </button>
                    <button
                        onClick={newChat}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-colors"
                    >
                        <i className="mdi mdi-square-edit-outline text-[18px]" />
                        {t("croarPilot.newChat")}
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-7">
                    {messages.length === 0 && (
                        <div className="max-w-2xl mx-auto text-center pt-8 md:pt-16">
                            <div className="relative inline-flex mb-7">
                                <div className="absolute -inset-4 rounded-full bg-[#1976D2]/20 blur-2xl" />
                                <div
                                    className="relative w-[68px] h-[68px] rounded-[22px] flex items-center justify-center text-white shadow-[0_14px_34px_rgba(25,118,210,0.5)]"
                                    style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
                                >
                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" /></svg>
                                </div>
                            </div>
                            <h2 className="text-[28px] md:text-[34px] font-extrabold tracking-[-0.9px] text-[#212121] leading-[1.1] mb-3">{t("croarPilot.howCanIHelp")}</h2>
                            <p className="text-[#616161] text-[15px] leading-relaxed max-w-md mx-auto mb-7">
                                Describe the role — seniority, key skills, openings and location — and I&apos;ll create the live job and arm the full pipeline: assessment, interview and onboarding.
                            </p>

                            <div className="grid gap-2.5 max-w-xl mx-auto">
                                {EXAMPLES.map((_ex, exi) => (
                                    <button
                                        key={exi}
                                        onClick={() => send(t("croarPilot.example" + (exi + 1)))}
                                        className="text-left p-4 rounded-[4px] bg-white border border-[#E0E0E0] hover:border-[#1976D2]/50 hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)] transition-all text-[14px] font-medium text-[#424242] flex items-center gap-3 group"
                                    >
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                            <i className="mdi mdi-lightning-bolt text-[19px]" />
                                        </span>
                                        <span className="flex-1">{t("croarPilot.example" + (exi + 1))}</span>
                                        <i className="mdi mdi-arrow-right text-[#BDBDBD] group-hover:text-[#1976D2] group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => {
                        const markerIdx = msg.role === "agent" ? msg.content.indexOf("[[SETUP_FORM]]") : -1;
                        const wantsForm = markerIdx !== -1;
                        // Everything before the marker is the friendly sentence shown to the user.
                        let text = wantsForm ? msg.content.slice(0, markerIdx).trim() : msg.content;
                        // The marker may be followed by a JSON object of fields the agent extracted
                        // from the user's request — parse it to pre-fill the form.
                        let prefill: PilotPrefill | undefined;
                        if (wantsForm) {
                            const after = msg.content.slice(markerIdx + "[[SETUP_FORM]]".length);
                            const open = after.indexOf("{");
                            const close = after.lastIndexOf("}");
                            if (open !== -1 && close > open) {
                                try {
                                    const parsed = JSON.parse(after.slice(open, close + 1));
                                    // Only accept a plain object (ignore arrays/null/primitives).
                                    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                                        prefill = parsed as PilotPrefill;
                                    }
                                } catch {
                                    /* malformed JSON — fall back to blank form */
                                }
                            }
                            if (!text) text = "Great — fill in the quick setup form below and I'll build the whole pipeline.";
                        }

                        // The agent's tool result arrives on msg.action → picker or built-pipeline card.
                        const sourceAction = msg.action?.ui === "candidate_picker" ? msg.action : undefined;
                        const builtAction = msg.action?.ui === "pipeline_built" ? msg.action : undefined;
                        // Only the LATEST message may show an interactive setup form. Otherwise a
                        // reloaded conversation (setupDone state is lost on load) would re-open a
                        // submittable form for an old turn — letting the user build a duplicate pipeline.
                        const isLastMessage = idx === messages.length - 1;

                        return (
                            <div key={idx} className="space-y-3">
                                <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div
                                        className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 ${
                                            msg.role === "agent"
                                                ? "text-white"
                                                : "bg-[#EEEEEE] text-[#616161]"
                                        }`}
                                        style={msg.role === "agent" ? { background: "linear-gradient(135deg,#42A5F5,#1976D2)" } : undefined}
                                    >
                                        <Icon name={msg.role === "agent" ? "smart_toy" : "person"} className="text-[19px]" />
                                    </div>
                                    <div
                                        className={`max-w-[80%] p-4 text-[14px] leading-relaxed ${
                                            msg.role === "agent"
                                                ? "bg-white border border-[#E0E0E0] text-[#424242] rounded-[4px] rounded-tl-[4px]"
                                                : "bg-[#1976D2] text-white rounded-[4px] rounded-tr-[4px] whitespace-pre-wrap"
                                        }`}
                                    >
                                        {msg.role === "agent" ? (
                                            <div className="[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_strong]:font-bold [&_strong]:text-[#212121] [&_a]:text-[#1976D2] [&_a]:underline [&_code]:bg-[#E3F2FD] [&_code]:text-[#1565C0] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_h1]:font-extrabold [&_h1]:text-base [&_h1]:mb-2 [&_h2]:font-extrabold [&_h2]:text-base [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mb-1">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            text
                                        )}
                                    </div>
                                </div>

                                {wantsForm && isLastMessage && !setupDone.has(idx) && (
                                    <div className="pl-11 max-w-xl">
                                        <PilotSetupForm
                                            initial={prefill}
                                            onSubmit={(m) => {
                                                setSetupDone((s) => new Set(s).add(idx));
                                                send(m);
                                            }}
                                        />
                                    </div>
                                )}
                                {wantsForm && setupDone.has(idx) && (
                                    <p className="pl-11 text-[12px] font-semibold text-[#2E7D32] flex items-center gap-1">
                                        <i className="mdi mdi-check-circle text-base" />
                                        {"Details submitted"}
                                    </p>
                                )}

                                {sourceAction && (
                                    <div className="pl-11 max-w-xl">
                                        <CandidatePicker
                                            jobId={sourceAction.job_id}
                                            candidates={sourceAction.profiles || []}
                                            token={token}
                                            initialResult={sourceAction.invitedResult}
                                            onInvited={(r) => {
                                                // Store the "invites sent" result on this message and re-save the
                                                // session so it persists across navigation / reload.
                                                const next = messages.map((m, i) =>
                                                    i === idx ? { ...m, action: { ...(m.action || {}), invitedResult: r } } : m,
                                                );
                                                setMessages(next);
                                                saveSession(next, titleRef.current || "Sourcing candidates");
                                            }}
                                        />
                                    </div>
                                )}

                                {builtAction && (
                                    <div className="pl-11 max-w-xl">
                                        <PipelineBuiltCard
                                            action={builtAction}
                                            onSource={() =>
                                                // Show the job TITLE, not the raw id. The Pilot still knows the
                                                // job_id from the pipeline it just built in this thread, so sourcing
                                                // targets the right job. No count here — let it ask "how many?".
                                                send(
                                                    builtAction.role
                                                        ? `Source candidates for the ${builtAction.role} role.`
                                                        : "Source candidates for this role.",
                                                )
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {isLoading && <PilotThinking threadId={threadId} token={token} />}
                    </div>
                </div>

                {/* Composer */}
                <div className="relative z-10 px-3 md:px-6 pb-5 pt-2 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-2 rounded-[4px] border border-[#E0E0E0] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.06)] px-2.5 py-2 transition-all focus-within:border-[#1976D2] focus-within:ring-2 focus-within:ring-[#1976D2]/15">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                placeholder={t("croarPilot.describePlaceholder")}
                                disabled={isLoading}
                                className="flex-1 bg-transparent px-2 h-9 text-[14.5px] text-[#212121] placeholder:text-[#9E9E9E] outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={() => send()}
                                disabled={isLoading || !input.trim()}
                                className="w-9 h-9 rounded-[4px] flex items-center justify-center text-white shrink-0 transition-all active:scale-95 disabled:opacity-40"
                                style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}
                            >
                                <i className="mdi mdi-arrow-up text-[20px]" />
                            </button>
                        </div>
                        <p className="mt-2 text-[10px] text-center text-[#9E9E9E] font-medium">
                            {t("croarPilot.createsLiveJob")}
                        </p>
                    </div>
                </div>
        </div>
    );
}
