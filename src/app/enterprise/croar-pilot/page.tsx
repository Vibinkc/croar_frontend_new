"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api-config";
import { PageHelp } from "@/components/ds";

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
            className={`px-3.5 py-2 rounded-[9px] text-[12.5px] font-semibold border transition-colors ${
                active
                    ? "bg-[#5B53E0] text-white border-[#5B53E0]"
                    : "bg-white text-[#374151] border-[#E1E4E8] hover:border-[#5B53E0]/50"
            }`}
        >
            {children}
        </button>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full bg-white border border-[#E1E4E8] rounded-[10px] px-3 h-10 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

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
    // Pre-fill from what the user already typed (extracted by the agent). Enum-valued
    // fields are validated against the allowed options, otherwise fall back to the default.
    const initSeniority = SENIORITY.some((s) => s.label === initial?.seniority) ? (initial!.seniority as string) : "Mid";
    const initAssessment = ["Coding", "Aptitude", "Both"].includes(initial?.assessment ?? "")
        ? (initial!.assessment as string)
        : "Both";
    const initMode: "AI" | "Human" = initial?.interviewMode === "Human" ? "Human" : "AI";

    const [role, setRole] = useState(initial?.role?.trim() ?? "");
    const [seniority, setSeniority] = useState(initSeniority);
    const [location, setLocation] = useState(initial?.location?.trim() || "Remote");
    const [openings, setOpenings] = useState(initial?.openings ? String(initial.openings) : "1");
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

    // Domain labels exclude '.', so the parts can't overlap -> linear matching (no backtracking).
    const emailValid = /^[^\s@]+@[^\s.@]+(?:\.[^\s.@]+)+$/.test(interviewerEmail);
    const datesValid = !!startDate && !!endDate && endDate >= startDate;
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
        <div className="mb-3 rounded-[14px] border border-[#E8EAED] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5B53E0]">Quick setup</p>
                {onClose && (
                    <button onClick={onClose} className="text-[#9AA3AF] hover:text-[#374151] transition-colors" title="Close">
                        <span className="material-symbols-rounded text-lg">close</span>
                    </button>
                )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <div
                            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                                i === step ? "text-[#5B53E0]" : i < step ? "text-[#15803D]" : "text-[#9AA3AF]"
                            }`}
                        >
                            <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    i === step
                                        ? "bg-[#5B53E0] text-white"
                                        : i < step
                                          ? "bg-[#15803D] text-white"
                                          : "bg-[#F1F2F5] text-[#8A929E]"
                                }`}
                            >
                                {i < step ? "✓" : i + 1}
                            </span>
                            {label}
                        </div>
                        {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[#E8EAED]" />}
                    </div>
                ))}
            </div>

            {/* Step 1 — Role */}
            {step === 0 && (
                <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Role title">
                            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Java Developer" className={inputCls} />
                        </Field>
                        <Field label="Location / mode">
                            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                    <Field label="Seniority">
                        <div className="flex flex-wrap gap-2">
                            {SENIORITY.map((s) => (
                                <Chip key={s.label} active={seniority === s.label} onClick={() => setSeniority(s.label)}>
                                    {s.label}
                                </Chip>
                            ))}
                        </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Openings">
                            <input type="number" min="1" value={openings} onChange={(e) => setOpenings(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Key skills (comma-sep)">
                            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Java, Spring, SQL" className={inputCls} />
                        </Field>
                    </div>
                </div>
            )}

            {/* Step 2 — Interview */}
            {step === 1 && (
                <div className="space-y-3.5">
                    <Field label="Interview mode">
                        <div className="flex gap-2">
                            <Chip active={interviewMode === "AI"} onClick={() => setInterviewMode("AI")}>AI-conducted</Chip>
                            <Chip active={interviewMode === "Human"} onClick={() => setInterviewMode("Human")}>Human interviewer</Chip>
                        </div>
                    </Field>
                    {interviewMode === "Human" && (
                        <Field label="Interviewer email">
                            <input
                                value={interviewerEmail}
                                onChange={(e) => setInterviewerEmail(e.target.value)}
                                placeholder="interviewer@company.com"
                                className={`${inputCls} ${interviewerEmail && !emailValid ? "!border-[#EF4444]" : ""}`}
                            />
                        </Field>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Slots / day">
                            <input type="number" min="1" value={slots} onChange={(e) => setSlots(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="From">
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="To">
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Interview dates — start">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="End">
                            <input
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`${inputCls} ${endDate && endDate < startDate ? "!border-[#EF4444]" : ""}`}
                            />
                        </Field>
                    </div>
                </div>
            )}

            {/* Step 3 — Assessment */}
            {step === 2 && (
                <div className="space-y-3.5">
                    <Field label="Assessment type">
                        <div className="flex gap-2">
                            {["Coding", "Aptitude", "Both"].map((a) => (
                                <Chip key={a} active={assessment === a} onClick={() => setAssessment(a)}>
                                    {a}
                                </Chip>
                            ))}
                        </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="# Questions">
                            <input type="number" min="1" value={questions} onChange={(e) => setQuestions(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Duration (min)">
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
                    className="px-4 h-10 rounded-[10px] text-[13px] font-semibold text-[#374151] border border-[#E1E4E8] hover:bg-[#F4F5F7] transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                    <span className="material-symbols-rounded text-lg">chevron_left</span>
                    {"Previous"}
                </button>
                {isLast ? (
                    <button
                        onClick={build}
                        disabled={!step0Valid || !step1Valid}
                        className="px-5 h-10 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">rocket_launch</span>
                        {"Build pipeline"}
                    </button>
                ) : (
                    <button
                        onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                        disabled={!stepValid}
                        className="px-5 h-10 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                        {"Next"}
                        <span className="material-symbols-rounded text-lg">chevron_right</span>
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
}

// Actionable result card shown after the agent builds a pipeline.
function PipelineBuiltCard({ action, onSource }: { action: PilotAction; onSource: () => void }) {
    return (
        <div className="rounded-[14px] border border-[#CDEAD7] bg-[#E6F4EA]/40 p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#15803D] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-[20px]">check_circle</span>
                </div>
                <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#15171C] truncate">
                        Pipeline ready{action.role ? ` · ${action.role}` : ""}
                    </p>
                    <p className="text-[12px] text-[#8A929E]">Live job created and the full pipeline armed.</p>
                </div>
            </div>

            {action.armed && action.armed.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                    {action.armed.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-[#374151]">
                            <span className="material-symbols-rounded text-[#15803D] text-base mt-0.5">check</span>
                            <span>{a}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-wrap gap-2">
                {action.job_id && (
                    <Link
                        href={`/enterprise/jobs/${action.job_id}`}
                        className="px-3.5 h-9 rounded-[9px] bg-[#5B53E0] text-white text-[12.5px] font-semibold hover:bg-[#4A43C9] transition-colors flex items-center gap-1.5"
                    >
                        <span className="material-symbols-rounded text-base">work</span> View job
                    </Link>
                )}
                <button
                    onClick={onSource}
                    className="px-3.5 h-9 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12.5px] font-semibold hover:bg-[#F4F5F7] transition-colors flex items-center gap-1.5"
                >
                    <span className="material-symbols-rounded text-base">person_search</span> Source candidates
                </button>
                <Link
                    href="/enterprise/candidates/kanban"
                    className="px-3.5 h-9 rounded-[9px] bg-white border border-[#E1E4E8] text-[#374151] text-[12.5px] font-semibold hover:bg-[#F4F5F7] transition-colors flex items-center gap-1.5"
                >
                    <span className="material-symbols-rounded text-base">view_kanban</span> View pipeline
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
}: {
    jobId?: string;
    candidates: SourcedCandidate[];
    token: string | null;
}) {
    const [selected, setSelected] = useState<Set<number>>(
        () => new Set(candidates.map((c, i) => (c.email ? i : -1)).filter((i) => i >= 0)),
    );
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<string | null>(null);
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
            }));
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/pilot/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ job_id: jobId, candidates: chosen }),
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok && d.status === "success") {
                setResult(
                    d.test_mode
                        ? `✓ Sent ${d.sent} test invite${d.sent === 1 ? "" : "s"} to ${d.test_email} (testing — real candidates were not emailed).`
                        : `✓ Sent ${d.sent} invite${d.sent === 1 ? "" : "s"}.${d.failed ? ` ${d.failed} failed.` : ""}`,
                );
            } else {
                setError(d.detail || "Failed to send invites.");
            }
        } catch {
            setError("Failed to send invites.");
        } finally {
            setSending(false);
        }
    };

    if (result) {
        return (
            <div className="rounded-[14px] border border-[#CDEAD7] bg-[#E6F4EA]/50 p-4 text-[13px] font-semibold text-[#15803D]">
                {result}
            </div>
        );
    }

    return (
        <div className="rounded-[14px] border border-[#E8EAED] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5B53E0]">Candidates</p>
                {candidates.length > 0 && (
                    <button onClick={toggleAll} className="text-[11px] font-semibold text-[#5B53E0] hover:underline">
                        {allSelected ? "Clear all" : "Select all"}
                    </button>
                )}
            </div>

            {candidates.length === 0 ? (
                <p className="text-[13px] text-[#8A929E] py-4 text-center">No candidates found for this role.</p>
            ) : (
                <>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {candidates.map((c, i) => (
                            <label
                                key={i}
                                className={`flex items-start gap-3 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
                                    selected.has(i) ? "border-[#5B53E0]/50 bg-[#ECEBFB]/40" : "border-[#E8EAED] bg-white hover:border-[#5B53E0]/30"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(i)}
                                    onChange={() => toggle(i)}
                                    className="mt-1 accent-[#5B53E0]"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#15171C] text-[13.5px] truncate">{c.full_name || "Unknown"}</span>
                                        {c.platform && (
                                            <span className="text-[9px] font-bold uppercase tracking-wide text-[#8A929E] bg-[#F1F2F5] px-1.5 py-0.5 rounded">
                                                {c.platform}
                                            </span>
                                        )}
                                    </div>
                                    {c.headline && <p className="text-[12px] text-[#8A929E] truncate">{c.headline}</p>}
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {c.email ? (
                                            <span className="text-[11px] text-[#15803D] font-semibold truncate">{c.email}</span>
                                        ) : (
                                            <span className="text-[11px] text-[#9AA3AF]">no email found</span>
                                        )}
                                        {c.profile_url && (
                                            <a
                                                href={c.profile_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[11px] text-[#5B53E0] hover:underline"
                                            >
                                                profile ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    {error && <p className="text-[12px] text-[#C0383C] mt-2">{error}</p>}

                    <button
                        onClick={send}
                        disabled={sending || selected.size === 0}
                        className="mt-4 w-full h-11 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">mark_email_read</span>
                        {sending ? "Sending…" : `Send invites to ${selected.size} selected`}
                    </button>
                    <p className="mt-2 text-[10px] text-center text-[#D97706] font-semibold">
                        🧪 Testing — invites are redirected to vibi@appxcess.com, not real candidates.
                    </p>
                </>
            )}
        </div>
    );
}

export default function CroarPilotPage() {
    const { token } = useAuth();
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

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/agents/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: text, thread_id: threadId, context: "pilot" }),
            });
            const d = await res.json().catch(() => ({}));
            const reply = res.ok
                ? d.response || "Done."
                : `Pilot error: ${d.detail || "could not reach the agent."}`;
            const action: PilotAction | undefined =
                res.ok && ["candidate_picker", "pipeline_built"].includes(d.pilot_action?.ui)
                    ? d.pilot_action
                    : undefined;
            const finalMsgs: Message[] = [...withUser, { role: "agent", content: reply, action }];
            setMessages(finalMsgs);
            saveSession(finalMsgs, titleRef.current || text.slice(0, 42));
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "agent", content: "I couldn't reach the Pilot service. Is the backend running?" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

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
        setThreadId(makeThreadId());
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
        <div className="relative flex flex-col h-[calc(100vh-2rem)] w-full bg-[#F4F5F7]">
            {/* Soft indigo glow behind the top of the page */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-72 z-0"
                style={{ background: "radial-gradient(680px 220px at 50% -45%, rgba(91,83,224,0.12), transparent 70%)" }}
            />

            {/* History backdrop */}
            {showHistory && (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Close history"
                    onClick={() => setShowHistory(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowHistory(false); }}
                    className="fixed inset-0 z-40 bg-[#0E1014]/40 backdrop-blur-sm"
                />
            )}

            {/* History drawer (slides in) */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E8EAED] flex flex-col transition-transform duration-300 ease-in-out ${
                    showHistory ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-[13px] font-bold text-[#15171C]">Conversations</span>
                    <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#9AA3AF] hover:bg-[#F4F5F7] transition-colors">
                        <span className="material-symbols-rounded text-[20px]">close</span>
                    </button>
                </div>
                <div className="px-3 pb-2">
                    <button
                        onClick={newChat}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors"
                    >
                        <span className="material-symbols-rounded text-[20px]">add</span>
                        {"New chat"}
                    </button>
                </div>
                <p className="px-5 pt-1 text-[10px] font-bold text-[#8A929E] uppercase tracking-[0.1em]">History</p>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
                    {sessions.length === 0 && (
                        <p className="text-[12px] text-[#9AA3AF] px-2 py-3">No conversations yet.</p>
                    )}
                    {sessions.map((s) => (
                        <button
                            key={s.session_id}
                            onClick={() => loadSession(s.session_id)}
                            className={`group w-full text-left px-3 py-2.5 rounded-[10px] text-[13px] flex items-center gap-2 transition-colors ${
                                s.session_id === currentSessionId
                                    ? "bg-[#ECEBFB] text-[#4A43C9] font-semibold"
                                    : "text-[#374151] hover:bg-[#F4F5F7]"
                            }`}
                        >
                            <span className="material-symbols-rounded text-base shrink-0 text-[#9AA3AF]">forum</span>
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
                                className="material-symbols-rounded text-base text-[#C7CCD4] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                            >
                                delete
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4 px-4 sm:px-5 md:px-7 shrink-0">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">
                            Croar Pilot
                        </h1>
                        <PageHelp title="Croar Pilot">
                            <p>Describe a role and let AI build the job, candidate pipeline and automations for you.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Autonomous AI recruiting companion for sourcing &amp; hiring</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm"
                    >
                        <span className="material-symbols-rounded text-[18px] text-[#6B6F76]">history</span>
                        History
                    </button>
                    <button
                        onClick={newChat}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                    >
                        <span className="material-symbols-rounded text-[18px]">edit_square</span>
                        New Chat
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-7">
                    {messages.length === 0 && (
                        <div className="max-w-2xl mx-auto text-center pt-8 md:pt-16">
                            <div className="relative inline-flex mb-7">
                                <div className="absolute -inset-4 rounded-full bg-[#5B53E0]/20 blur-2xl" />
                                <div
                                    className="relative w-[68px] h-[68px] rounded-[22px] flex items-center justify-center text-white shadow-[0_14px_34px_rgba(91,83,224,0.5)]"
                                    style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
                                >
                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" /></svg>
                                </div>
                            </div>
                            <h2 className="text-[28px] md:text-[34px] font-extrabold tracking-[-0.9px] text-[#15171C] leading-[1.1] mb-3">How can I help you hire?</h2>
                            <p className="text-[#6B6F76] text-[15px] leading-relaxed max-w-md mx-auto mb-7">
                                Describe the role — seniority, key skills, openings and location — and I&apos;ll create the live job and arm the full pipeline: assessment, interview and onboarding.
                            </p>

                            <div className="grid gap-2.5 max-w-xl mx-auto">
                                {EXAMPLES.map((ex) => (
                                    <button
                                        key={ex}
                                        onClick={() => send(ex)}
                                        className="text-left p-4 rounded-[14px] bg-white border border-[#E8EAED] hover:border-[#5B53E0]/50 hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all text-[14px] font-medium text-[#374151] flex items-center gap-3 group"
                                    >
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-[19px]">bolt</span>
                                        </span>
                                        <span className="flex-1">{ex}</span>
                                        <span className="material-symbols-rounded text-[#C7CCD4] group-hover:text-[#5B53E0] group-hover:translate-x-0.5 transition-all">arrow_forward</span>
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

                        return (
                            <div key={idx} className="space-y-3">
                                <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div
                                        className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${
                                            msg.role === "agent"
                                                ? "text-white"
                                                : "bg-[#F1F2F5] text-[#6B6F76]"
                                        }`}
                                        style={msg.role === "agent" ? { background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" } : undefined}
                                    >
                                        <span className="material-symbols-rounded text-[19px]">
                                            {msg.role === "agent" ? "smart_toy" : "person"}
                                        </span>
                                    </div>
                                    <div
                                        className={`max-w-[80%] p-4 text-[14px] leading-relaxed ${
                                            msg.role === "agent"
                                                ? "bg-white border border-[#E8EAED] text-[#374151] rounded-[14px] rounded-tl-[4px]"
                                                : "bg-[#5B53E0] text-white rounded-[14px] rounded-tr-[4px] whitespace-pre-wrap"
                                        }`}
                                    >
                                        {msg.role === "agent" ? (
                                            <div className="[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_strong]:font-bold [&_strong]:text-[#15171C] [&_a]:text-[#5B53E0] [&_a]:underline [&_code]:bg-[#ECEBFB] [&_code]:text-[#4A43C9] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_h1]:font-extrabold [&_h1]:text-base [&_h1]:mb-2 [&_h2]:font-extrabold [&_h2]:text-base [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mb-1">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            text
                                        )}
                                    </div>
                                </div>

                                {wantsForm && !setupDone.has(idx) && (
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
                                    <p className="pl-11 text-[12px] font-semibold text-[#15803D] flex items-center gap-1">
                                        <span className="material-symbols-rounded text-base">check_circle</span>
                                        {"Details submitted"}
                                    </p>
                                )}

                                {sourceAction && (
                                    <div className="pl-11 max-w-xl">
                                        <CandidatePicker
                                            jobId={sourceAction.job_id}
                                            candidates={sourceAction.profiles || []}
                                            token={token}
                                        />
                                    </div>
                                )}

                                {builtAction && (
                                    <div className="pl-11 max-w-xl">
                                        <PipelineBuiltCard
                                            action={builtAction}
                                            onSource={() =>
                                                send(`Source 10 candidates for this role (job ${builtAction.job_id}).`)
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div
                                className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white animate-pulse"
                                style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
                            >
                                <span className="material-symbols-rounded text-[19px]">bolt</span>
                            </div>
                            <div className="bg-white border border-[#E8EAED] p-4 rounded-[14px] rounded-tl-[4px]">
                                <p className="text-[12px] font-semibold text-[#8A929E]">Building your pipeline&hellip;</p>
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* Composer */}
                <div className="relative z-10 px-3 md:px-6 pb-5 pt-2 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-2 rounded-[16px] border border-[#E1E4E8] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.06)] px-2.5 py-2 transition-all focus-within:border-[#5B53E0] focus-within:ring-2 focus-within:ring-[#5B53E0]/15">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                placeholder="Describe the role you want to hire…"
                                disabled={isLoading}
                                className="flex-1 bg-transparent px-2 h-9 text-[14.5px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={() => send()}
                                disabled={isLoading || !input.trim()}
                                className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0 transition-all active:scale-95 disabled:opacity-40"
                                style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}
                            >
                                <span className="material-symbols-rounded text-[20px]">arrow_upward</span>
                            </button>
                        </div>
                        <p className="mt-2 text-[10px] text-center text-[#9AA3AF] font-medium">
                            Croar Pilot creates a live job and arms the full hiring pipeline.
                        </p>
                    </div>
                </div>
        </div>
    );
}
