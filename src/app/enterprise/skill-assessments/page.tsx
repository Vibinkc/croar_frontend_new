"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
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
    const { t: tr } = useI18n();
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
            else setError(tr("postOnboarding.errLoadAssessments"));
            if (eRes.ok) setEmployees(await eRes.json());
            if (aRes.ok) setAllAssignments(await aRes.json());
        } catch {
            setError(tr("postOnboarding.errLoadAssessmentsConn"));
        } finally {
            setLoading(false);
        }
    }, [tr]);

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
            alert(err?.detail || tr("postOnboarding.errCreateAssessment"));
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
            alert(tr("postOnboarding.errCreateGeneric"));
        } finally {
            setSaving(false);
        }
    };

    // Create the template, then open the manual question manager (no AI).
    const handleCreateManual = async () => {
        if (!form.name.trim() || !form.topic.trim()) { alert(tr("postOnboarding.errNameTopic")); return; }
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
                if (opts.length < 2) { alert(tr("postOnboarding.errNeedsOptions", { q: q.question.slice(0, 40) })); return; }
                if (!opts.includes(q.correct_answer)) { alert(tr("postOnboarding.errPickCorrect", { q: q.question.slice(0, 40) })); return; }
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
            else { const e = await res.json().catch(() => null); alert(e?.detail || tr("postOnboarding.errSaveQuestions")); }
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
        if (rows.length < 2) { alert(tr("postOnboarding.errCsvHeader")); return; }
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const col = (n: string) => header.indexOf(n);
        const typeI = col("type"), qI = col("question") >= 0 ? col("question") : col("question_text");
        const optIdxs = header.map((h, i) => (/^option/.test(h) ? i : -1)).filter((i) => i >= 0);
        const correctI = col("correct") >= 0 ? col("correct") : col("correct_answer");
        if (qI < 0) { alert(tr("postOnboarding.errCsvQuestionCol")); return; }
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
        if (!imported.length) { alert(tr("postOnboarding.errCsvNoRows")); return; }
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
                alert(`${tr("postOnboarding.assignedToN", { count: body?.assigned ?? 0 })}${body?.skipped ? ` ${tr("postOnboarding.skippedN", { count: body.skipped })}` : ""}`);
                setAssignFor(null);
            } else {
                alert(body?.detail || tr("postOnboarding.errAssign"));
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
            else alert(tr("postOnboarding.errLoadSubmission"));
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
                title={tr("nav.skillAssessments")}
                subtitle={tr("postOnboarding.skillAssessmentsSubtitle")}
                help={<><p>{tr("postOnboarding.skillHelp1")}</p><p>{tr("postOnboarding.skillHelp2")}</p></>}
                actions={<Button icon="add" onClick={() => { setForm(EMPTY_FORM); setCreating(true); }}>{tr("postOnboarding.newAssessment")}</Button>}
            />

            <StatGrid>
                <StatCard label={tr("postOnboarding.assessments")} value={templates.length} icon="quiz" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.25)" />
                <StatCard label={tr("postOnboarding.readyToAssign")} value={ready.length} icon="task_alt" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={tr("nav.employees")} value={employees.length} icon="badge" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
                <StatCard label={tr("postOnboarding.completed")} value={allAssignments.filter((a) => a.status === "COMPLETED").length} icon="grading" gradient="linear-gradient(135deg,#FFB300,#EF6C00)" glow="rgba(239,108,0,0.25)" />
            </StatGrid>

            {loading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-[4px] bg-[#F5F6F8] border border-[#E0E0E0] animate-pulse" />)}
                </div>
            ) : error ? (
                <Card padding="none"><EmptyState tone="muted" icon="error" title={tr("postOnboarding.couldntLoad")} description={error} action={<Button variant="secondary" onClick={load}>{tr("postOnboarding.retry")}</Button>} /></Card>
            ) : templates.length === 0 ? (
                <Card padding="none">
                    <EmptyState tone="brand" icon="quiz" title={tr("postOnboarding.noAssessmentsYet")}
                        description={tr("postOnboarding.noAssessmentsYetDesc")}
                        action={<Button icon="add" onClick={() => setCreating(true)}>{tr("postOnboarding.newAssessment")}</Button>} />
                </Card>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => {
                        const qn = t.generated_questions?.length ?? 0;
                        return (
                            <Card key={t.id} className="flex flex-col justify-between min-h-[190px]">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                            <i className="mdi mdi-help-box text-[22px]" />
                                        </span>
                                        <Badge tone={TYPE_TONE[t.type] || "neutral"}>{t.type}</Badge>
                                    </div>
                                    <h3 className="text-[14px] font-bold text-[#212121] truncate">{t.name}</h3>
                                    <p className="text-[12.5px] text-[#757575] line-clamp-1 mt-0.5">{t.topic}</p>
                                    <div className={`flex items-center gap-3 mt-3 text-[12px] text-[#616161] ${jetbrainsMono.className}`}>
                                        <span className="inline-flex items-center gap-1"><i className="mdi mdi-help-circle text-[15px]" />{qn} {tr("postOnboarding.qsUnit")}</span>
                                        <span className="inline-flex items-center gap-1"><i className="mdi mdi-clock-outline text-[15px]" />{t.test_duration}m</span>
                                    </div>
                                    {qn === 0 && <p className="mt-2 text-[11.5px] font-semibold text-[#EF6C00]">{tr("postOnboarding.questionsGenerating")}</p>}
                                </div>
                                <div className="pt-4 mt-3 border-t border-[#E0E0E0] space-y-2">
                                    <Button variant="secondary" size="sm" icon="edit_note" fullWidth onClick={() => openQMgr(t)}>{tr("postOnboarding.editQuestions")}</Button>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" icon="group_add" className="flex-1" disabled={qn === 0} onClick={() => openAssign(t)}>{tr("postOnboarding.assign")}</Button>
                                        <Button variant="secondary" size="sm" icon="leaderboard" className="flex-1" onClick={() => openResults(t)}>{tr("postOnboarding.results")}</Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create modal */}
            {creating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
                            <h2 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#212121]">{tr("postOnboarding.newSkillAssessment")}</h2>
                            <button onClick={() => setCreating(false)} aria-label={tr("common.close")} className="w-8 h-8 rounded-[4px] text-[#757575] hover:bg-[#EEEEEE] flex items-center justify-center">
                                <i className="mdi mdi-close text-[20px]" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="px-6 py-6 space-y-4">
                            <Field label={tr("postOnboarding.assessmentName")} htmlFor="sa-name" required>
                                <Input id="sa-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tr("postOnboarding.assessmentNamePlaceholder")} required />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label={tr("postOnboarding.type")} htmlFor="sa-type" required>
                                    <Select id="sa-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                        <option value="APTITUDE">{tr("postOnboarding.aptitude")}</option>
                                        <option value="CODING">{tr("postOnboarding.coding")}</option>
                                        <option value="BOTH">{tr("postOnboarding.aptitudeCoding")}</option>
                                    </Select>
                                </Field>
                                <Field label={tr("postOnboarding.topic")} htmlFor="sa-topic" required hint={tr("postOnboarding.anySubject")}>
                                    <Input id="sa-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={tr("postOnboarding.skillPlaceholder")} required />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label={tr("postOnboarding.questions")} htmlFor="sa-count" required>
                                    <Input id="sa-count" type="number" min={1} max={50} value={form.question_count} onChange={(e) => setForm({ ...form, question_count: Number(e.target.value) })} required />
                                </Field>
                                <Field label={tr("postOnboarding.durationMin")} htmlFor="sa-dur" required>
                                    <Input id="sa-dur" type="number" min={1} value={form.test_duration} onChange={(e) => setForm({ ...form, test_duration: Number(e.target.value) })} required />
                                </Field>
                            </div>
                            <p className="text-[12px] text-[#757575]">{tr("postOnboarding.generateHint")}</p>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2.5 pt-1">
                                <Button type="button" variant="secondary" icon="edit_note" disabled={saving} onClick={handleCreateManual}>{tr("postOnboarding.addManually")}</Button>
                                <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                                    <Button type="button" variant="ghost" onClick={() => setCreating(false)}>{tr("postOnboarding.cancel")}</Button>
                                    <Button type="submit" icon="auto_awesome" disabled={saving}>{saving ? tr("postOnboarding.generating") : tr("postOnboarding.createGenerate")}</Button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Assign modal */}
            {assignFor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-xl max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#212121] truncate">{tr("postOnboarding.assign")} · {assignFor.name}</h2>
                                <p className="text-[12px] text-[#757575] mt-0.5">{tr("postOnboarding.pickEmployees")}</p>
                            </div>
                            <Badge tone="indigo" className={jetbrainsMono.className}>{picked.length} {tr("postOnboarding.selected")}</Badge>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {employees.length === 0 && <p className="text-[13px] text-[#757575]">{tr("postOnboarding.noEmployeesToAssign")}</p>}
                            {employees.map((emp) => {
                                const sel = picked.includes(emp.id);
                                return (
                                    <button key={emp.id} type="button" onClick={() => togglePick(emp.id)}
                                        className={`flex items-center gap-3 p-3 rounded-[4px] border text-left transition-all ${sel ? "border-[#1976D2] bg-[#E3F2FD]/50" : "border-[#E0E0E0] bg-white hover:border-[#9E9E9E]"}`}>
                                        <span className={`w-8 h-8 rounded-[4px] flex items-center justify-center text-[12px] font-extrabold uppercase ${sel ? "bg-[#1976D2] text-white" : "bg-[#E3F2FD] text-[#1976D2]"}`}>
                                            {sel ? <i className="mdi mdi-check text-[17px]" /> : emp.first_name?.[0]}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-[#212121] truncate">{emp.first_name} {emp.last_name}</p>
                                            <p className="text-[11.5px] text-[#757575] truncate">{emp.designation || tr("postOnboarding.employeeSingular")}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#E0E0E0]">
                            <Button variant="secondary" onClick={() => setAssignFor(null)}>{tr("postOnboarding.cancel")}</Button>
                            <Button icon="send" disabled={assigning || picked.length === 0} onClick={handleAssign}>{assigning ? tr("postOnboarding.assigning") : tr("postOnboarding.assignToN", { count: picked.length })}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Results modal */}
            {resultsFor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-2xl max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#212121] truncate">{tr("postOnboarding.results")} · {resultsFor.name}</h2>
                                <p className="text-[12px] text-[#757575] mt-0.5">
                                    {completed(assignments).length}/{assignments.length} {tr("postOnboarding.completedLower")}
                                    {avgScore(assignments) != null ? ` · ${tr("postOnboarding.avg")} ${avgScore(assignments)}%` : ""}
                                </p>
                            </div>
                            <button onClick={() => setResultsFor(null)} aria-label={tr("common.close")} className="w-8 h-8 rounded-[4px] text-[#757575] hover:bg-[#EEEEEE] flex items-center justify-center">
                                <i className="mdi mdi-close text-[20px]" />
                            </button>
                        </div>
                        <div className="overflow-y-auto">
                            {resultsLoading ? (
                                <div className="p-6 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-[4px] bg-[#F5F6F8] animate-pulse" />)}</div>
                            ) : assignments.length === 0 ? (
                                <div className="py-16"><EmptyState tone="muted" icon="group_off" title={tr("postOnboarding.notAssignedYet")} description={tr("postOnboarding.notAssignedYetDesc")} /></div>
                            ) : (
                                <div className="divide-y divide-[#EEEEEE]">
                                    {assignments.map((a) => (
                                        <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                                            <span className="text-[13.5px] font-semibold text-[#212121] truncate">{a.employee_name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {a.status === "COMPLETED"
                                                    ? <span className={`text-[14px] font-extrabold ${jetbrainsMono.className} ${(a.score ?? 0) >= 60 ? "text-[#2E7D32]" : "text-[#EF6C00]"}`}>{a.score}%</span>
                                                    : <span className="text-[12px] text-[#757575]">—</span>}
                                                <Badge tone={a.status === "COMPLETED" ? "success" : "warning"} dot>{a.status === "COMPLETED" ? tr("postOnboarding.done") : tr("postOnboarding.pending")}</Badge>
                                                {a.status === "COMPLETED" && (
                                                    <Button size="sm" variant="secondary" icon="visibility" onClick={() => openReview(a)}>{tr("postOnboarding.view")}</Button>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#212121] truncate">{tr("postOnboarding.questions")} · {qMgrFor.name}</h2>
                                <p className="text-[12px] text-[#757575] mt-0.5">{tr("postOnboarding.questionCountHint", { count: qList.length })}</p>
                            </div>
                            <button onClick={() => setQMgrFor(null)} aria-label={tr("common.close")} className="w-8 h-8 rounded-[4px] text-[#757575] hover:bg-[#EEEEEE] flex items-center justify-center">
                                <i className="mdi mdi-close text-[20px]" />
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA]">
                            <Button size="sm" variant="secondary" icon="add" onClick={addMcq}>{tr("postOnboarding.addMcq")}</Button>
                            <Button size="sm" variant="secondary" icon="code" onClick={addCoding}>{tr("postOnboarding.addCoding")}</Button>
                            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] cursor-pointer">
                                <i className="mdi mdi-file-upload text-[17px]" /> {tr("postOnboarding.importCsv")}
                                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = ""; }} />
                            </label>
                            <button onClick={downloadCSVTemplate} className="text-[12px] font-semibold text-[#1976D2] hover:underline ml-auto">{tr("postOnboarding.downloadCsv")}</button>
                        </div>

                        <div className="overflow-y-auto px-6 py-5 space-y-4">
                            {qList.length === 0 ? (
                                <div className="py-10"><EmptyState tone="brand" icon="quiz" title={tr("postOnboarding.noQuestionsYet")} description={tr("postOnboarding.noQuestionsYetDesc")} action={<Button size="sm" icon="add" onClick={addMcq}>{tr("postOnboarding.addMcq")}</Button>} /></div>
                            ) : qList.map((q, idx) => (
                                <div key={q.id} className="rounded-[4px] border border-[#E0E0E0] overflow-hidden">
                                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-[#757575]">{idx + 1}.</span>
                                            <Badge tone={q.type === "CODING" ? "teal" : "indigo"}>{q.type === "CODING" ? tr("postOnboarding.coding") : tr("postOnboarding.mcq")}</Badge>
                                        </div>
                                        <button onClick={() => removeQ(q.id)} aria-label={tr("postOnboarding.remove")} className="w-7 h-7 rounded-[4px] text-[#757575] hover:bg-[#FFEBEE] hover:text-[#C62828] flex items-center justify-center">
                                            <i className="mdi mdi-delete text-[18px]" />
                                        </button>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <Textarea placeholder={q.type === "CODING" ? tr("postOnboarding.problemStatement") : tr("postOnboarding.questionText")} value={q.question} onChange={(e) => updateQ(q.id, { question: e.target.value })} className="min-h-[64px]" />
                                        {q.type === "APTITUDE" && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold text-[#757575]">{tr("postOnboarding.optionsSelectCorrect")}</p>
                                                {q.options.map((opt, oi) => (
                                                    <div key={oi} className="flex items-center gap-2.5">
                                                        <input type="radio" name={`correct-${q.id}`} checked={!!opt && q.correct_answer === opt} onChange={() => updateQ(q.id, { correct_answer: opt })} disabled={!opt.trim()} className="h-4 w-4 accent-[#1976D2] shrink-0" />
                                                        <Input value={opt} placeholder={tr("postOnboarding.optionN", { n: oi + 1 })} onChange={(e) => setOpt(q.id, oi, e.target.value)} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#E0E0E0]">
                            <Button variant="secondary" onClick={() => setQMgrFor(null)}>{tr("postOnboarding.cancel")}</Button>
                            <Button icon="save" disabled={qSaving} onClick={saveQuestions}>{qSaving ? tr("postOnboarding.saving") : tr("postOnboarding.saveQuestions")}</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Submission review — what the employee actually wrote */}
            {(reviewLoading || review) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#212121]/50 backdrop-blur-sm">
                    <Card padding="none" className="w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-extrabold text-[#212121] truncate">{tr("postOnboarding.submission")} · {review?.employee_name || "…"}</h2>
                                <p className="text-[12px] text-[#757575] mt-0.5">
                                    {review ? review.template_name : tr("common.loading")}
                                    {review?.score != null ? ` · ${tr("postOnboarding.scored")} ${review.score}%` : ""}
                                </p>
                            </div>
                            <button onClick={() => setReview(null)} aria-label={tr("common.close")} className="w-8 h-8 rounded-[4px] text-[#757575] hover:bg-[#EEEEEE] flex items-center justify-center">
                                <i className="mdi mdi-close text-[20px]" />
                            </button>
                        </div>
                        <div className="overflow-y-auto px-6 py-5 space-y-5">
                            {reviewLoading || !review ? (
                                [1, 2, 3].map((i) => <div key={i} className="h-24 rounded-[4px] bg-[#F5F6F8] animate-pulse" />)
                            ) : review.review.length === 0 ? (
                                <p className="text-[13px] text-[#757575] text-center py-8">{tr("postOnboarding.noQuestions")}</p>
                            ) : (
                                review.review.map((q, idx) => {
                                    const answered = q.answer != null && String(q.answer).trim() !== "";
                                    const coding = isCodingQ(q.type);
                                    return (
                                        <div key={q.id} className="rounded-[4px] border border-[#E0E0E0] overflow-hidden">
                                            <div className="flex items-start justify-between gap-3 px-4 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                                <p className="text-[13px] font-semibold text-[#212121]"><span className="text-[#757575]">{idx + 1}.</span> {q.text}</p>
                                                {q.is_correct === true && <Badge tone="success" dot>{tr("postOnboarding.correct")}</Badge>}
                                                {q.is_correct === false && <Badge tone="danger" dot>{tr("postOnboarding.wrong")}</Badge>}
                                                {q.is_correct === null && <Badge tone="neutral">{coding ? tr("postOnboarding.code") : tr("postOnboarding.text")}</Badge>}
                                            </div>
                                            <div className="p-4 space-y-2.5">
                                                <div>
                                                    <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#757575] mb-1">{tr("postOnboarding.theirAnswer")}</p>
                                                    {!answered ? (
                                                        <p className="text-[12.5px] italic text-[#C62828]">{tr("postOnboarding.noAnswerSubmitted")}</p>
                                                    ) : coding ? (
                                                        <pre className={`text-[12px] text-[#212121] bg-[#1E2A38] text-[#E6E8EC] rounded-[4px] p-3 overflow-x-auto whitespace-pre-wrap ${jetbrainsMono.className}`}>{String(q.answer)}</pre>
                                                    ) : (
                                                        <p className="text-[13px] text-[#212121]">{String(q.answer)}</p>
                                                    )}
                                                </div>
                                                {q.is_correct === false && q.correct_answer != null && (
                                                    <div>
                                                        <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#757575] mb-1">{tr("postOnboarding.correctAnswer")}</p>
                                                        <p className="text-[13px] font-semibold text-[#2E7D32]">{String(q.correct_answer)}</p>
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
