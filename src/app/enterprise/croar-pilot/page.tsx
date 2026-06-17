"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api-config";

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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"
            }`}
        >
            {children}
        </button>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors";

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

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interviewerEmail);
    const datesValid = !!startDate && !!endDate && endDate >= startDate;
    const step0Valid = role.trim().length > 1;
    const step1Valid = (interviewMode === "AI" || emailValid) && datesValid;
    const stepValid = [step0Valid, step1Valid, true][step];
    const isLast = step === STEPS.length - 1;

    const build = () => {
        if (!step0Valid || !step1Valid) return; // guard against programmatic/invalid submits
        // Coerce numeric fields to sane values so the composed message is always clean.
        const num = (v: string, def: number, lo: number, hi: number) => {
            const n = parseInt(v, 10);
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
        <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Quick setup</p>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Close">
                        <span className="material-symbols-rounded text-lg">close</span>
                    </button>
                )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <div
                            className={`flex items-center gap-1.5 text-[11px] font-bold ${
                                i === step ? "text-indigo-600" : i < step ? "text-emerald-600" : "text-slate-400"
                            }`}
                        >
                            <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                    i === step
                                        ? "bg-indigo-600 text-white"
                                        : i < step
                                          ? "bg-emerald-500 text-white"
                                          : "bg-slate-200 text-slate-500"
                                }`}
                            >
                                {i < step ? "✓" : i + 1}
                            </span>
                            {label}
                        </div>
                        {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
                    </div>
                ))}
            </div>

            {/* Step 1 — Role */}
            {step === 0 && (
                <div className="space-y-3">
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
                <div className="space-y-3">
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
                                className={`${inputCls} ${interviewerEmail && !emailValid ? "!border-rose-300" : ""}`}
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
                                className={`${inputCls} ${endDate && endDate < startDate ? "!border-rose-300" : ""}`}
                            />
                        </Field>
                    </div>
                </div>
            )}

            {/* Step 3 — Assessment */}
            {step === 2 && (
                <div className="space-y-3">
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
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-white transition-all disabled:opacity-40 flex items-center gap-1"
                >
                    <span className="material-symbols-rounded text-lg">chevron_left</span>
                    Previous
                </button>
                {isLast ? (
                    <button
                        onClick={build}
                        disabled={!step0Valid || !step1Valid}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">rocket_launch</span>
                        Build pipeline
                    </button>
                ) : (
                    <button
                        onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                        disabled={!stepValid}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                        Next
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
    profiles?: SourcedCandidate[];
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm font-bold text-emerald-700">
                {result}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Candidates</p>
                {candidates.length > 0 && (
                    <button onClick={toggleAll} className="text-[11px] font-bold text-indigo-600 hover:underline">
                        {allSelected ? "Clear all" : "Select all"}
                    </button>
                )}
            </div>

            {candidates.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No candidates found for this role.</p>
            ) : (
                <>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {candidates.map((c, i) => (
                            <label
                                key={i}
                                className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    selected.has(i) ? "border-indigo-400 bg-white" : "border-slate-200 bg-white/60 hover:border-indigo-200"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(i)}
                                    onChange={() => toggle(i)}
                                    className="mt-1 accent-indigo-600"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm truncate">{c.full_name || "Unknown"}</span>
                                        {c.platform && (
                                            <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {c.platform}
                                            </span>
                                        )}
                                    </div>
                                    {c.headline && <p className="text-xs text-slate-500 truncate">{c.headline}</p>}
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {c.email ? (
                                            <span className="text-[11px] text-emerald-600 font-semibold truncate">{c.email}</span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">no email found</span>
                                        )}
                                        {c.profile_url && (
                                            <a
                                                href={c.profile_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[11px] text-indigo-600 hover:underline"
                                            >
                                                profile ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}

                    <button
                        onClick={send}
                        disabled={sending || selected.size === 0}
                        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-rounded text-lg">mark_email_read</span>
                        {sending ? "Sending…" : `Send invites to ${selected.size} selected`}
                    </button>
                    <p className="mt-2 text-[10px] text-center text-amber-600 font-semibold">
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
                res.ok && d.pilot_action?.ui === "candidate_picker" ? d.pilot_action : undefined;
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

    const deleteSession = async (e: React.MouseEvent, id: string) => {
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
        <div className="flex h-[calc(100vh-2rem)] w-full">
            {/* History sidebar (toggled) */}
            {showHistory && (
            <aside className="w-64 shrink-0 border-r border-slate-100 flex flex-col">
                <div className="p-4">
                    <button
                        onClick={newChat}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all"
                    >
                        <span className="material-symbols-rounded text-xl">add</span>
                        New Chat
                    </button>
                </div>
                <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">History</p>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {sessions.length === 0 && (
                        <p className="text-xs text-slate-400 px-2 py-3">No conversations yet.</p>
                    )}
                    {sessions.map((s) => (
                        <button
                            key={s.session_id}
                            onClick={() => loadSession(s.session_id)}
                            className={`group w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${
                                s.session_id === currentSessionId
                                    ? "bg-indigo-50 text-indigo-700 font-bold"
                                    : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <span className="material-symbols-rounded text-base shrink-0 text-slate-400">forum</span>
                            <span className="truncate flex-1">{s.title || "Untitled"}</span>
                            <span
                                onClick={(e) => deleteSession(e, s.session_id)}
                                className="material-symbols-rounded text-base text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                            >
                                delete
                            </span>
                        </button>
                    ))}
                </div>
            </aside>
            )}

            {/* Chat */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                    <button
                        onClick={() => setShowHistory((v) => !v)}
                        title={showHistory ? "Hide history" : "Show history"}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all shrink-0"
                    >
                        <span className="material-symbols-rounded">{showHistory ? "menu_open" : "history"}</span>
                    </button>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <span className="material-symbols-rounded">smart_toy</span>
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-900">Croar Pilot</h1>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                            Autonomous hiring orchestrator
                        </p>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="max-w-2xl mx-auto text-center mt-8">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5">
                                <span className="material-symbols-rounded text-3xl">auto_awesome</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-2">Describe the role you want to hire</h2>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                                Tell me the role, seniority, key skills and location. I&apos;ll create the live job and
                                arm the full pipeline &mdash; assessment, interview and onboarding.
                            </p>
                            <div className="grid gap-2 max-w-lg mx-auto">
                                {EXAMPLES.map((ex) => (
                                    <button
                                        key={ex}
                                        onClick={() => send(ex)}
                                        className="text-left p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-sm font-semibold text-slate-700 flex items-center gap-3 group"
                                    >
                                        <span className="material-symbols-rounded text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            bolt
                                        </span>
                                        {ex}
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

                        // The agent's source_candidates tool result arrives on msg.action → picker.
                        const sourceAction = msg.action?.ui === "candidate_picker" ? msg.action : undefined;

                        return (
                            <div key={idx} className="space-y-3">
                                <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            msg.role === "agent"
                                                ? "bg-indigo-100 text-indigo-600"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        <span className="material-symbols-rounded text-xl">
                                            {msg.role === "agent" ? "smart_toy" : "person"}
                                        </span>
                                    </div>
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                                            msg.role === "agent"
                                                ? "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
                                                : "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100 whitespace-pre-wrap"
                                        }`}
                                    >
                                        {msg.role === "agent" ? (
                                            <div className="[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_strong]:font-bold [&_strong]:text-slate-900 [&_a]:text-indigo-600 [&_a]:underline [&_code]:bg-slate-100 [&_code]:text-indigo-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_h1]:font-black [&_h1]:text-base [&_h1]:mb-2 [&_h2]:font-black [&_h2]:text-base [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mb-1">
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
                                    <p className="pl-11 text-xs font-bold text-emerald-600 flex items-center gap-1">
                                        <span className="material-symbols-rounded text-base">check_circle</span>
                                        Details submitted
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
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                                <span className="material-symbols-rounded text-xl">bolt</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none">
                                <p className="text-xs font-bold text-slate-400">Building your pipeline&hellip;</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && send()}
                            placeholder="e.g. I need a senior backend engineer, Go, remote, 1 opening"
                            disabled={isLoading}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-14 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={() => send()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <span className="material-symbols-rounded">send</span>
                        </button>
                    </div>
                    <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
                        Croar Pilot creates a live job and arms the full hiring pipeline.
                    </p>
                </div>
            </div>
        </div>
    );
}
