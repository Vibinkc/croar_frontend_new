"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/api";
import {
    PageHeader, Card, CardHeader, Button, Input, Textarea, Field, Select, Badge,
    StatCard, StatGrid, EmptyState, jetbrainsMono,
} from "@/components/ds";

interface Template {
    id: string;
    name: string;
    type: "APTITUDE" | "CODING" | "BOTH";
    topic: string;
    question_count: number;
    test_duration: number;
    generated_questions: unknown[] | null;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    designation?: string;
}

interface Assignment {
    id: string;
    employee_id: string;
    employee_name: string;
    status: string;
    score: number | null;
}

interface ReviewItem {
    id: string;
    type: string;
    text: string;
    options?: string[] | null;
    correct_answer?: string | null;
    answer?: string | null;
    is_correct: boolean | null;
}

interface ReviewData {
    id: string;
    employee_name: string;
    template_name: string;
    status: string;
    score: number | null;
    review: ReviewItem[];
}

interface QEdit {
    id: string;
    type: "APTITUDE" | "CODING";
    question: string;
    options: string[];
    correct_answer: string;
}

const TYPE_TONE: Record<string, "indigo" | "teal" | "warning"> = {
    APTITUDE: "indigo", CODING: "teal", BOTH: "warning",
};

const isCodingQ = (t: string) => /COD/i.test(t);

const EMPTY_FORM = { name: "", type: "APTITUDE", topic: "", question_count: 10, test_duration: 30 };

export default function SkillAssessmentsPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Assign
    const [assignFor, setAssignFor] = useState<Template | null>(null);
    const [picked, setPicked] = useState<string[]>([]);
    const [assigning, setAssigning] = useState(false);

    // Results
    const [resultsFor, setResultsFor] = useState<Template | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [resultsLoading, setResultsLoading] = useState(false);

    // Submission review (what the employee actually wrote)
    const [review, setReview] = useState<ReviewData | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Manual question manager
    const [qMgrFor, setQMgrFor] = useState<Template | null>(null);
    const [qList, setQList] = useState<QEdit[]>([]);
    const [qSaving, setQSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [tRes, eRes, aRes] = await Promise.all([
                apiClient.get("/api/v1/enterprise/assessment-templates/"),
                apiClient.get("/api/v1/enterprise/employees/"),
                apiClient.get("/api/v1/enterprise/skill-assessments/assignments"),
            ]);
            if (tRes.ok) setTemplates(await tRes.json());
            else setError("Couldn't load assessments.");
            if (eRes.ok) setEmployees(await eRes.json());
            if (aRes.ok) setAllAssignments(await aRes.json());
        } catch {
            setError("Couldn't load assessments. Check your connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Create the template row (no questions yet). Returns the created template or null.
    const createTemplate = async (): Promise<Template | null> => {
        const res = await apiClient.post("/api/v1/enterprise/assessment-templates/", {
            name: form.name,
            type: form.type,
            topic: form.topic,
            question_count: Number(form.question_count) || 10,
            test_duration: Number(form.test_duration) || 30,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            alert(err?.detail || "Failed to create assessment.");
            return null;
        }
        return (await res.json()) as Template;
    };

    // Create + AI-generate questions.
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const tpl = await createTemplate();
            if (!tpl) return;
            await apiClient.post(
                `/api/v1/enterprise/assessment-templates/${tpl.id}/generate?count=${Number(form.question_count) || 10}`,
                {}
            );
            setCreating(false);
            setForm(EMPTY_FORM);
            await load();
        } catch {
            alert("Something went wrong creating the assessment.");
        } finally {
            setSaving(false);
        }
    };

    // Create the template, then open the manual question manager (no AI).
    const handleCreateManual = async () => {
        if (!form.name.trim() || !form.topic.trim()) { alert("Enter a name and topic first."); return; }
        setSaving(true);
        try {
            const tpl = await createTemplate();
            if (!tpl) return;
            setCreating(false);
            setForm(EMPTY_FORM);
            await load();
            openQMgr(tpl);
        } finally {
            setSaving(false);
        }
    };

    // ── Manual question manager ──────────────────────────────────────────────
    const rawToEdit = (q: Record<string, unknown>): QEdit => ({
        id: String(q.id || (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))),
        type: /COD/i.test(String(q.type)) ? "CODING" : "APTITUDE",
        question: String(q.question || q.problem_statement || q.question_text || ""),
        options: Array.isArray(q.options) ? (q.options as string[]) : ["", "", "", ""],
        correct_answer: String(q.correct_answer || ""),
    });

    const openQMgr = (t: Template) => {
        setQMgrFor(t);
        setQList(((t.generated_questions as Record<string, unknown>[]) || []).map(rawToEdit));
    };

    const newId = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const addMcq = () => setQList((p) => [...p, { id: newId(), type: "APTITUDE", question: "", options: ["", "", "", ""], correct_answer: "" }]);
    const addCoding = () => setQList((p) => [...p, { id: newId(), type: "CODING", question: "", options: [], correct_answer: "" }]);
    const updateQ = (id: string, patch: Partial<QEdit>) => setQList((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    const setOpt = (id: string, i: number, v: string) => setQList((p) => p.map((q) => {
        if (q.id !== id) return q;
        const options = q.options.map((o, oi) => (oi === i ? v : o));
        // Keep the "correct" pointer in sync if the selected option's text was edited.
        const correct_answer = q.correct_answer === q.options[i] ? v : q.correct_answer;
        return { ...q, options, correct_answer };
    }));
    const removeQ = (id: string) => setQList((p) => p.filter((q) => q.id !== id));

    const saveQuestions = async () => {
        if (!qMgrFor) return;
        // Validate: MCQ needs text + ≥2 options + a correct answer that's one of the options.
        const clean = qList.filter((q) => q.question.trim());
        for (const q of clean) {
            if (q.type === "APTITUDE") {
                const opts = q.options.filter((o) => o.trim());
                if (opts.length < 2) { alert(`"${q.question.slice(0, 40)}…" needs at least 2 options.`); return; }
                if (!opts.includes(q.correct_answer)) { alert(`Pick the correct option for "${q.question.slice(0, 40)}…".`); return; }
            }
        }
        const payload = clean.map((q) => q.type === "CODING"
            ? { id: q.id, type: "CODING", problem_statement: q.question, question: q.question }
            : { id: q.id, type: "APTITUDE", question: q.question, options: q.options.filter((o) => o.trim()), correct_answer: q.correct_answer });
        setQSaving(true);
        try {
            const res = await apiClient.request(`/api/v1/enterprise/assessment-templates/${qMgrFor.id}`, {
                method: "PATCH",
                body: JSON.stringify({ generated_questions: payload, question_count: payload.length }),
            });
            if (res.ok) { setQMgrFor(null); await load(); }
            else { const e = await res.json().catch(() => null); alert(e?.detail || "Failed to save questions."); }
        } finally {
            setQSaving(false);
        }
    };

    // CSV import: header row `type,question,option1,option2,option3,option4,correct`.
    const parseCSV = (text: string): string[][] => {
        const rows: string[][] = [];
        let row: string[] = [], field = "", inQ = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQ) {
                if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
                else field += c;
            } else if (c === '"') inQ = true;
            else if (c === ",") { row.push(field); field = ""; }
            else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
            else field += c;
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows.filter((r) => r.some((x) => x.trim()));
    };

    const importCSV = async (file: File) => {
        const rows = parseCSV(await file.text());
        if (rows.length < 2) { alert("The CSV needs a header row and at least one question."); return; }
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const col = (n: string) => header.indexOf(n);
        const typeI = col("type"), qI = col("question") >= 0 ? col("question") : col("question_text");
        const optIdxs = header.map((h, i) => (/^option/.test(h) ? i : -1)).filter((i) => i >= 0);
        const correctI = col("correct") >= 0 ? col("correct") : col("correct_answer");
        if (qI < 0) { alert("CSV must have a 'question' column."); return; }
        const imported: QEdit[] = [];
        for (const r of rows.slice(1)) {
            const type: "APTITUDE" | "CODING" = /cod/i.test((typeI >= 0 ? r[typeI] : "") || "") ? "CODING" : "APTITUDE";
            const question = (r[qI] || "").trim();
            if (!question) continue;
            const options = optIdxs.map((i) => (r[i] || "").trim()).filter(Boolean);
            let correct = correctI >= 0 ? (r[correctI] || "").trim() : "";
            if (correct && !options.includes(correct)) {
                const L = correct.toUpperCase();
                if (/^[A-Z]$/.test(L)) correct = options[L.charCodeAt(0) - 65] || correct;
                else if (/^\d+$/.test(correct)) correct = options[Number(correct) - 1] || correct;
            }
            imported.push({ id: newId(), type, question, options: type === "CODING" ? [] : (options.length ? options : ["", "", "", ""]), correct_answer: type === "CODING" ? "" : correct });
        }
        if (!imported.length) { alert("No valid rows found in the CSV."); return; }
        setQList((p) => [...p, ...imported]);
    };

    const downloadCSVTemplate = () => {
        const csv = "type,question,option1,option2,option3,option4,correct\nAPTITUDE,\"What is 2 + 2?\",1,2,3,4,4\nCODING,\"Reverse a string\",,,,,\n";
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a"); a.href = url; a.download = "skill-questions-template.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    const openAssign = (t: Template) => { setAssignFor(t); setPicked([]); };
    const togglePick = (id: string) =>
        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const handleAssign = async () => {
        if (!assignFor || picked.length === 0) return;
        setAssigning(true);
        try {
            const res = await apiClient.post("/api/v1/enterprise/skill-assessments/assign", {
                template_id: assignFor.id,
                employee_ids: picked,
            });
            const body = await res.json().catch(() => null);
            if (res.ok) {
                alert(`Assigned to ${body?.assigned ?? 0} employee(s).${body?.skipped ? ` ${body.skipped} skipped (already assigned).` : ""}`);
                setAssignFor(null);
            } else {
                alert(body?.detail || "Failed to assign.");
            }
        } finally {
            setAssigning(false);
        }
    };

    const openResults = async (t: Template) => {
        setResultsFor(t);
        setResultsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/enterprise/skill-assessments/assignments?template_id=${t.id}`);
            setAssignments(res.ok ? await res.json() : []);
        } finally {
            setResultsLoading(false);
        }
    };

    const openReview = async (a: Assignment) => {
        setReview(null);
        setReviewLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/enterprise/skill-assessments/assignments/${a.id}/review`);
            if (res.ok) setReview(await res.json());
            else alert("Couldn't load this submission.");
        } finally {
            setReviewLoading(false);
        }
    };

    const completed = (a: Assignment[]) => a.filter((x) => x.status === "COMPLETED");
    const avgScore = (a: Assignment[]) => {
        const done = completed(a).filter((x) => x.score != null);
        return done.length ? Math.round(done.reduce((s, x) => s + (x.score || 0), 0) / done.length) : null;
    };

    const ready = templates.filter((t) => (t.generated_questions?.length ?? 0) > 0);

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Skill Assessments"
                subtitle="Create timed aptitude & coding tests and assign them to employees"
                help={<><p>Build a test on any topic (aptitude, coding, verbal, domain-specific), auto-generate its questions, then assign it to employees.</p><p>Employees take it from their workspace; scores land under Results.</p></>}
                actions={<Button icon="add" onClick={() => { setForm(EMPTY_FORM); setCreating(true); }}>New Assessment</Button>}
            />

            <StatGrid>
                <StatCard label="Assessments" value={templates.length} icon="quiz" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.25)" />
                <StatCard label="Ready to assign" value={ready.length} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Employees" value={employees.length} icon="badge" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label="Completed" value={allAssignments.filter((a) => a.status === "COMPLETED").length} icon="grading" gradient="linear-gradient(135deg,#FBBF24,#D97706)" glow="rgba(217,119,6,0.25)" />
            </StatGrid>

            {loading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-[14px] bg-[#F4F5F7] border border-[#E8EAED] animate-pulse" />)}
                </div>
            ) : error ? (
                <Card padding="none"><EmptyState tone="muted" icon="error" title="Couldn't load" description={error} action={<Button variant="secondary" onClick={load}>Retry</Button>} /></Card>
            ) : templates.length === 0 ? (
                <Card padding="none">
                    <EmptyState tone="brand" icon="quiz" title="No assessments yet"
                        description="Create your first skill assessment — pick a type and topic, and we'll generate the questions."
                        action={<Button icon="add" onClick={() => setCreating(true)}>New Assessment</Button>} />
                </Card>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => {
                        const qn = t.generated_questions?.length ?? 0;
                        return (
                            <Card key={t.id} className="flex flex-col justify-between min-h-[190px]">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-[22px]">quiz</span>
                                        </span>
                                        <Badge tone={TYPE_TONE[t.type] || "neutral"}>{t.type}</Badge>
                                    </div>
                                    <h3 className="text-[14px] font-bold text-[#15171C] truncate">{t.name}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] line-clamp-1 mt-0.5">{t.topic}</p>
                                    <div className={`flex items-center gap-3 mt-3 text-[12px] text-[#6B7280] ${jetbrainsMono.className}`}>
                                        <span className="inline-flex items-center gap-1"><span className="material-symbols-rounded text-[15px]">help</span>{qn} Qs</span>
                                        <span className="inline-flex items-center gap-1"><span className="material-symbols-rounded text-[15px]">schedule</span>{t.test_duration}m</span>
                                    </div>
                                    {qn === 0 && <p className="mt-2 text-[11.5px] font-semibold text-[#D97706]">Questions still generating…</p>}
                                </div>
                                <div className="pt-4 mt-3 border-t border-[#E8EAED] space-y-2">
                                    <Button variant="secondary" size="sm" icon="edit_note" fullWidth onClick={() => openQMgr(t)}>Edit questions</Button>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" icon="group_add" className="flex-1" disabled={qn === 0} onClick={() => openAssign(t)}>Assign</Button>
                                        <Button variant="secondary" size="sm" icon="leaderboard" className="flex-1" onClick={() => openResults(t)}>Results</Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create modal */}
            {creating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED]">
                            <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#15171C]">New Skill Assessment</h2>
                            <button onClick={() => setCreating(false)} aria-label="Close" className="w-8 h-8 rounded-[9px] text-[#8A929E] hover:bg-[#F1F2F5] flex items-center justify-center">
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="px-6 py-6 space-y-4">
                            <Field label="Assessment name" htmlFor="sa-name" required>
                                <Input id="sa-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Frontend Engineer Skills" required />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Type" htmlFor="sa-type" required>
                                    <Select id="sa-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                        <option value="APTITUDE">Aptitude</option>
                                        <option value="CODING">Coding</option>
                                        <option value="BOTH">Aptitude + Coding</option>
                                    </Select>
                                </Field>
                                <Field label="Topic" htmlFor="sa-topic" required hint="Any subject">
                                    <Input id="sa-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. React, SQL, Verbal" required />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Questions" htmlFor="sa-count" required>
                                    <Input id="sa-count" type="number" min={1} max={50} value={form.question_count} onChange={(e) => setForm({ ...form, question_count: Number(e.target.value) })} required />
                                </Field>
                                <Field label="Duration (min)" htmlFor="sa-dur" required>
                                    <Input id="sa-dur" type="number" min={1} value={form.test_duration} onChange={(e) => setForm({ ...form, test_duration: Number(e.target.value) })} required />
                                </Field>
                            </div>
                            <p className="text-[12px] text-[#8A929E]">Generate questions with AI from the type & topic, or create the assessment and add questions manually / from a CSV.</p>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2.5 pt-1">
                                <Button type="button" variant="secondary" icon="edit_note" disabled={saving} onClick={handleCreateManual}>Add manually</Button>
                                <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                                    <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                                    <Button type="submit" icon="auto_awesome" disabled={saving}>{saving ? "Generating…" : "Create & Generate"}</Button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Assign modal */}
            {assignFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-xl max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#15171C] truncate">Assign · {assignFor.name}</h2>
                                <p className="text-[12px] text-[#8A929E] mt-0.5">Pick employees to take this assessment</p>
                            </div>
                            <Badge tone="indigo" className={jetbrainsMono.className}>{picked.length} selected</Badge>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {employees.length === 0 && <p className="text-[13px] text-[#8A929E]">No employees to assign.</p>}
                            {employees.map((emp) => {
                                const sel = picked.includes(emp.id);
                                return (
                                    <button key={emp.id} type="button" onClick={() => togglePick(emp.id)}
                                        className={`flex items-center gap-3 p-3 rounded-[10px] border text-left transition-all ${sel ? "border-[#5B53E0] bg-[#ECEBFB]/50" : "border-[#E1E4E8] bg-white hover:border-[#9AA3AF]"}`}>
                                        <span className={`w-8 h-8 rounded-[9px] flex items-center justify-center text-[12px] font-extrabold uppercase ${sel ? "bg-[#5B53E0] text-white" : "bg-[#ECEBFB] text-[#5B53E0]"}`}>
                                            {sel ? <span className="material-symbols-rounded text-[17px]">check</span> : emp.first_name?.[0]}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-[#15171C] truncate">{emp.first_name} {emp.last_name}</p>
                                            <p className="text-[11.5px] text-[#8A929E] truncate">{emp.designation || "Employee"}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#E8EAED]">
                            <Button variant="secondary" onClick={() => setAssignFor(null)}>Cancel</Button>
                            <Button icon="send" disabled={assigning || picked.length === 0} onClick={handleAssign}>{assigning ? "Assigning…" : `Assign to ${picked.length}`}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Results modal */}
            {resultsFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-2xl max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#15171C] truncate">Results · {resultsFor.name}</h2>
                                <p className="text-[12px] text-[#8A929E] mt-0.5">
                                    {completed(assignments).length}/{assignments.length} completed
                                    {avgScore(assignments) != null ? ` · avg ${avgScore(assignments)}%` : ""}
                                </p>
                            </div>
                            <button onClick={() => setResultsFor(null)} aria-label="Close" className="w-8 h-8 rounded-[9px] text-[#8A929E] hover:bg-[#F1F2F5] flex items-center justify-center">
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto">
                            {resultsLoading ? (
                                <div className="p-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-[10px] bg-[#F4F5F7] animate-pulse" />)}</div>
                            ) : assignments.length === 0 ? (
                                <div className="py-16"><EmptyState tone="muted" icon="group_off" title="Not assigned yet" description="Assign this assessment to employees to see their results here." /></div>
                            ) : (
                                <div className="divide-y divide-[#F0F0F1]">
                                    {assignments.map((a) => (
                                        <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                                            <span className="text-[13.5px] font-semibold text-[#15171C] truncate">{a.employee_name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {a.status === "COMPLETED"
                                                    ? <span className={`text-[14px] font-extrabold ${jetbrainsMono.className} ${(a.score ?? 0) >= 60 ? "text-[#0E8A6E]" : "text-[#D97706]"}`}>{a.score}%</span>
                                                    : <span className="text-[12px] text-[#8A929E]">—</span>}
                                                <Badge tone={a.status === "COMPLETED" ? "success" : "warning"} dot>{a.status === "COMPLETED" ? "Done" : "Pending"}</Badge>
                                                {a.status === "COMPLETED" && (
                                                    <Button size="sm" variant="secondary" icon="visibility" onClick={() => openReview(a)}>View</Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Question manager — add manually or import CSV */}
            {qMgrFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#15171C] truncate">Questions · {qMgrFor.name}</h2>
                                <p className="text-[12px] text-[#8A929E] mt-0.5">{qList.length} question(s) · add manually or import a CSV</p>
                            </div>
                            <button onClick={() => setQMgrFor(null)} aria-label="Close" className="w-8 h-8 rounded-[9px] text-[#8A929E] hover:bg-[#F1F2F5] flex items-center justify-center">
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[#E8EAED] bg-[#F8FAFC]">
                            <Button size="sm" variant="secondary" icon="add" onClick={addMcq}>Add MCQ</Button>
                            <Button size="sm" variant="secondary" icon="code" onClick={addCoding}>Add Coding</Button>
                            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] cursor-pointer">
                                <span className="material-symbols-rounded text-[17px]">upload_file</span> Import CSV
                                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = ""; }} />
                            </label>
                            <button onClick={downloadCSVTemplate} className="text-[12px] font-semibold text-[#5B53E0] hover:underline ml-auto">Download CSV template</button>
                        </div>

                        <div className="overflow-y-auto px-6 py-5 space-y-4">
                            {qList.length === 0 ? (
                                <div className="py-10"><EmptyState tone="brand" icon="quiz" title="No questions yet" description="Add multiple-choice or coding questions, or import them from a CSV." action={<Button size="sm" icon="add" onClick={addMcq}>Add MCQ</Button>} /></div>
                            ) : qList.map((q, idx) => (
                                <div key={q.id} className="rounded-[12px] border border-[#E8EAED] overflow-hidden">
                                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E8EAED]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-[#8A929E]">{idx + 1}.</span>
                                            <Badge tone={q.type === "CODING" ? "teal" : "indigo"}>{q.type === "CODING" ? "Coding" : "MCQ"}</Badge>
                                        </div>
                                        <button onClick={() => removeQ(q.id)} aria-label="Remove" className="w-7 h-7 rounded-[8px] text-[#8A929E] hover:bg-[#FDECEC] hover:text-[#C0383C] flex items-center justify-center">
                                            <span className="material-symbols-rounded text-[18px]">delete</span>
                                        </button>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <Textarea placeholder={q.type === "CODING" ? "Problem statement…" : "Question text…"} value={q.question} onChange={(e) => updateQ(q.id, { question: e.target.value })} className="min-h-[64px]" />
                                        {q.type === "APTITUDE" && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold text-[#8A929E]">Options — select the correct one</p>
                                                {q.options.map((opt, oi) => (
                                                    <div key={oi} className="flex items-center gap-2.5">
                                                        <input type="radio" name={`correct-${q.id}`} checked={!!opt && q.correct_answer === opt} onChange={() => updateQ(q.id, { correct_answer: opt })} disabled={!opt.trim()} className="h-4 w-4 accent-[#5B53E0] shrink-0" />
                                                        <Input value={opt} placeholder={`Option ${oi + 1}`} onChange={(e) => setOpt(q.id, oi, e.target.value)} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#E8EAED]">
                            <Button variant="secondary" onClick={() => setQMgrFor(null)}>Cancel</Button>
                            <Button icon="save" disabled={qSaving} onClick={saveQuestions}>{qSaving ? "Saving…" : "Save questions"}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Submission review — what the employee actually wrote */}
            {(reviewLoading || review) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#15171C]/50 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#15171C] truncate">Submission · {review?.employee_name || "…"}</h2>
                                <p className="text-[12px] text-[#8A929E] mt-0.5">
                                    {review ? review.template_name : "Loading…"}
                                    {review?.score != null ? ` · scored ${review.score}%` : ""}
                                </p>
                            </div>
                            <button onClick={() => setReview(null)} aria-label="Close" className="w-8 h-8 rounded-[9px] text-[#8A929E] hover:bg-[#F1F2F5] flex items-center justify-center">
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto px-6 py-5 space-y-5">
                            {reviewLoading || !review ? (
                                [1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[12px] bg-[#F4F5F7] animate-pulse" />)
                            ) : review.review.length === 0 ? (
                                <p className="text-[13px] text-[#8A929E] text-center py-8">This assessment has no questions.</p>
                            ) : (
                                review.review.map((q, idx) => {
                                    const answered = q.answer != null && String(q.answer).trim() !== "";
                                    const coding = isCodingQ(q.type);
                                    return (
                                        <div key={q.id} className="rounded-[12px] border border-[#E8EAED] overflow-hidden">
                                            <div className="flex items-start justify-between gap-3 px-4 py-3 bg-[#F8FAFC] border-b border-[#E8EAED]">
                                                <p className="text-[13px] font-semibold text-[#15171C]"><span className="text-[#8A929E]">{idx + 1}.</span> {q.text}</p>
                                                {q.is_correct === true && <Badge tone="success" dot>Correct</Badge>}
                                                {q.is_correct === false && <Badge tone="danger" dot>Wrong</Badge>}
                                                {q.is_correct === null && <Badge tone="neutral">{coding ? "Code" : "Text"}</Badge>}
                                            </div>
                                            <div className="p-4 space-y-2.5">
                                                <div>
                                                    <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8A929E] mb-1">Their answer</p>
                                                    {!answered ? (
                                                        <p className="text-[12.5px] italic text-[#C0383C]">No answer submitted</p>
                                                    ) : coding ? (
                                                        <pre className={`text-[12px] text-[#15171C] bg-[#0E1014] text-[#E6E8EC] rounded-[8px] p-3 overflow-x-auto whitespace-pre-wrap ${jetbrainsMono.className}`}>{String(q.answer)}</pre>
                                                    ) : (
                                                        <p className="text-[13px] text-[#15171C]">{String(q.answer)}</p>
                                                    )}
                                                </div>
                                                {q.is_correct === false && q.correct_answer != null && (
                                                    <div>
                                                        <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8A929E] mb-1">Correct answer</p>
                                                        <p className="text-[13px] font-semibold text-[#0E8A6E]">{String(q.correct_answer)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
