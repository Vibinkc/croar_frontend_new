"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import {
    Sparkles, Mail, Reply, Clock, Plus, Trash2, GripVertical, Loader2, X, ArrowLeft, Users,
    Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered, Link2, Image as ImageIcon,
} from "lucide-react";

interface Step { type: string; subject?: string; body: string; delay_days: number; cc?: string; bcc?: string; }
interface Seq { sequence_id: string; name: string; owner?: string; privacy?: string; steps: Step[]; created_at?: string; }

const SNIPPETS = ["Spintax Greeting", "First Name", "Current Company", "Job Title", "Education", "Sender First Name", "Current Location", "Current Role"];
// Plain text → HTML (newlines to <br>) unless it already contains markup.
const toHtml = (s: string) => (s && /<[a-z][\s\S]*>/i.test(s) ? s : (s || "").replace(/\n/g, "<br>"));
const fmtDate = (iso?: string) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };
// Sample values used to render a live preview of merge fields.
const PREVIEW_SAMPLE: Record<string, string> = { "First Name": "Alex", "Current Company": "Acme Corp", "Job Title": "Senior Engineer", "Current Role": "Senior Engineer", "Education": "Stanford University", "Sender First Name": "Vibin", "Current Location": "San Francisco, CA" };
const fillPreview = (s: string) => {
    let out = s || "";
    for (const [k, v] of Object.entries(PREVIEW_SAMPLE)) out = out.split(`{{${k}}}`).join(v);
    out = out.replace(/\{([^{}|]+(?:\|[^{}]+)+)\}/g, (_m, g) => String(g).split("|")[0]);
    out = out.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, "$1");
    return out;
};

export default function SequenceEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const { t } = useI18n();
    const seqId = String(params?.id || "");

    const [seq, setSeq] = useState<Seq | null>(null);
    const [name, setName] = useState("");
    const [steps, setSteps] = useState<Step[]>([]);
    const [sel, setSel] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showGen, setShowGen] = useState(false);
    const [genInstruction, setGenInstruction] = useState("");
    const [generating, setGenerating] = useState(false);
    const [snippetTab, setSnippetTab] = useState<"ai" | "snippets">("snippets");
    const [showPreview, setShowPreview] = useState(false);
    const [testEmail, setTestEmail] = useState("vibi@appxcess.com");
    const [sendingTest, setSendingTest] = useState(false);
    const [testSent, setTestSent] = useState(false);
    const [testErr, setTestErr] = useState("");
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const lastSel = useRef<number>(-1);

    useEffect(() => {
        if (!token || !seqId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/${seqId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) { const s: Seq = await res.json(); setSeq(s); setName(s.name); setSteps(s.steps?.length ? s.steps : [{ type: "email", subject: "", body: "Hi {{First Name}},\n\n", delay_days: 0 }]); }
            } catch { /* ignore */ } finally { setLoading(false); }
        })();
    }, [token, seqId]);

    const cur = steps[sel];
    const updateCur = (patch: Partial<Step>) => setSteps((s) => s.map((st, i) => (i === sel ? { ...st, ...patch } : st)));

    // Load the selected step's body into the rich-text editor when the selection changes.
    useEffect(() => {
        if (editorRef.current && lastSel.current !== sel) {
            editorRef.current.innerHTML = toHtml(steps[sel]?.body || "");
            lastSel.current = sel;
            setShowCc(!!steps[sel]?.cc);
            setShowBcc(!!steps[sel]?.bcc);
        }
    }, [sel, steps]);

    const syncBody = () => { if (editorRef.current) updateCur({ body: editorRef.current.innerHTML }); };
    const exec = (cmd: string, val?: string) => { editorRef.current?.focus(); try { document.execCommand(cmd, false, val); } catch { /* ignore */ } syncBody(); };
    const insertSnippet = (field: string) => {
        const tag = field === "Spintax Greeting" ? "{Hi|Hello|Hey}" : `{{${field}}}`;
        editorRef.current?.focus();
        try { document.execCommand("insertText", false, tag); } catch { /* ignore */ }
        syncBody();
    };

    const addStep = () => { setSteps((s) => [...s, { type: "reply", subject: "", body: "Hi {{First Name}},\n\n", delay_days: 3 }]); setSel(steps.length); };
    const removeStep = (i: number) => { const next = steps.filter((_, j) => j !== i); setSteps(next.length ? next : [{ type: "email", subject: "", body: "", delay_days: 0 }]); setSel(Math.max(0, Math.min(sel, next.length - 1))); };

    const generateStep = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/generate-step`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ current_steps: steps, instruction: genInstruction }),
            });
            if (res.ok) { const d = await res.json(); const st = d.step || {}; setSteps((s) => [...s, { type: st.type || "reply", subject: st.subject || "", body: st.body || "", delay_days: st.delay_days ?? 3 }]); setSel(steps.length); }
        } catch { /* ignore */ } finally { setGenerating(false); setShowGen(false); setGenInstruction(""); }
    };

    const save = async () => {
        setSaving(true);
        try {
            await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/${seqId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, steps }),
            });
        } catch { /* ignore */ } finally { setSaving(false); }
    };

    const sendTest = async () => {
        if (!cur) return;
        setSendingTest(true); setTestSent(false); setTestErr("");
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/test`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to_email: testEmail, subject: cur.subject || "", body: cur.body || "", sequence_id: seqId }),
            });
            if (res.ok) { setTestSent(true); return; }
            const d = await res.json().catch(() => ({}));
            const detail = typeof d?.detail === "string" ? d.detail : "";
            setTestErr(detail === "no_mailbox"
                ? t("sequenceEditor.noMailbox")
                : detail || t("sequenceEditor.sendFailed", { status: res.status }));
        } catch { setTestErr(t("sequenceEditor.networkError")); } finally { setSendingTest(false); }
    };

    const timing = (d: number) => (d === 0 ? t("sequenceEditor.sendImmediately") : t("sequenceEditor.afterPrevious", { days: d }));

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#5B53E0] animate-spin" /></div>;
    if (!seq) return <div className="p-10 text-center text-[#8A929E]">{t("sequenceEditor.notFound")}</div>;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-3.5 border-b border-[#E8EAED] bg-white">
                <button onClick={() => router.push("/enterprise/sourcing/sequences")} className="text-[#6B6F76] hover:text-[#5B53E0] shrink-0"><ArrowLeft className="w-5 h-5" /></button>
                <div className="flex-1 min-w-0">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("sequenceEditor.untitledPlaceholder")} className="block w-full max-w-[560px] text-[17px] font-bold text-[#15171C] bg-transparent outline-none border-b border-transparent focus:border-[#5B53E0] truncate" />
                    <p className="text-[12px] text-[#8A929E] mt-0.5 truncate">{t("sequenceEditor.createdBy", { owner: seq.owner || t("sequenceEditor.unknownOwner") })} · {fmtDate(seq.created_at)}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-[#E1E4E8] text-[12.5px] font-semibold text-[#374151]"><Users className="w-3.5 h-3.5" /> {seq.privacy || t("sequenceEditor.shared")}</span>
                    <button onClick={() => router.push("/enterprise/sourcing/sequences")} className="h-9 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("sequenceEditor.cancel")}</button>
                    <button onClick={save} disabled={saving} className="h-9 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] disabled:opacity-60 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} {t("common.save")}</button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] min-h-0">
                {/* Steps sidebar */}
                <div className="border-r border-[#E8EAED] bg-[#FAFBFC] overflow-y-auto no-scrollbar p-3 flex flex-col">
                    <div className="space-y-2 flex-1">
                        {steps.map((st, i) => (
                            <button key={i} onClick={() => setSel(i)} className={`w-full text-left rounded-[12px] border p-3 transition-colors ${sel === i ? "border-[#5B53E0] bg-white shadow-sm" : "border-[#E8EAED] bg-white hover:border-[#DAD7F6]"}`}>
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-3.5 h-3.5 text-[#C4C9D0]" />
                                    <span className="text-[12px] font-bold text-[#15171C]">{t("sequenceEditor.step", { n: i + 1 })}: {st.type === "email" ? t("sequenceEditor.email") : t("sequenceEditor.reply")}</span>
                                </div>
                                <p className="text-[11.5px] text-[#6B6F76] mt-1.5 flex items-center gap-1.5">{st.type === "email" ? <Mail className="w-3.5 h-3.5" /> : <Reply className="w-3.5 h-3.5" />}{st.subject ? st.subject.slice(0, 28) : t("sequenceEditor.noSubject")}</p>
                                <p className="text-[11px] text-[#9AA3AF] mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {timing(st.delay_days)}</p>
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-3">
                        <button onClick={addStep} className="flex-1 h-9 rounded-[10px] border border-[#E1E4E8] bg-white text-[12.5px] font-semibold text-[#374151] hover:bg-[#F7F8FA] flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> {t("sequenceEditor.addStep")}</button>
                        <button onClick={() => setShowGen(true)} className="flex-1 h-9 rounded-[10px] border border-[#E4E1F7] bg-[#F4F3FD] text-[12.5px] font-bold text-[#5B53E0] hover:bg-[#E4E1F7] flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4" /> {t("sequenceEditor.generateStep")}</button>
                    </div>
                </div>

                {/* Step editor */}
                <div className="overflow-y-auto no-scrollbar p-6 bg-[#F7F8FA]">
                    {cur && (
                        <div className="max-w-3xl mx-auto bg-white border border-[#E8EAED] rounded-[16px] shadow-[0_1px_3px_rgba(15,23,42,0.05)] overflow-hidden">
                            {/* Card header */}
                            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#EEF0F2] bg-[#FCFCFD]">
                                <div className="flex items-center gap-3">
                                    <span className="px-2.5 py-1 rounded-[8px] bg-[#F4F3FD] text-[#5B53E0] text-[12.5px] font-bold">{t("sequenceEditor.step", { n: sel + 1 })}</span>
                                    <select value={cur.type} onChange={(e) => updateCur({ type: e.target.value })} className="h-9 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] font-semibold text-[#374151] bg-white outline-none">
                                        <option value="email">{t("sequenceEditor.email")}</option><option value="reply">{t("sequenceEditor.reply")}</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center gap-1.5 h-9 pl-2.5 pr-1 rounded-[10px] border border-[#E1E4E8] bg-white">
                                        <Clock className="w-3.5 h-3.5 text-[#9AA3AF]" />
                                        <select value={cur.delay_days} onChange={(e) => updateCur({ delay_days: Number(e.target.value) })} className="h-full pr-1 text-[12.5px] font-semibold text-[#374151] bg-transparent outline-none cursor-pointer">
                                            {[0, 1, 2, 3, 4, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d === 0 ? t("sequenceEditor.sendImmediately") : t("sequenceEditor.afterPrevious", { days: d })}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => setShowPreview(true)} className="h-9 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("sequenceEditor.previewTest")}</button>

                                    <button onClick={() => removeStep(sel)} className="p-2 rounded-lg text-[#9AA3AF] hover:text-[#C0383C] hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Card body */}
                            <div className="p-5 space-y-5">
                                {/* Subject + Cc/Bcc */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wide text-[#8A929E]">{t("sequenceEditor.subject")}</label>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setShowCc((v) => !v)} className={`text-[12.5px] font-semibold ${showCc ? "text-[#5B53E0]" : "text-[#8A929E] hover:text-[#5B53E0]"}`}>{t("sequenceEditor.cc")}</button>
                                            <button onClick={() => setShowBcc((v) => !v)} className={`text-[12.5px] font-semibold ${showBcc ? "text-[#5B53E0]" : "text-[#8A929E] hover:text-[#5B53E0]"}`}>{t("sequenceEditor.bcc")}</button>
                                        </div>
                                    </div>
                                    <input value={cur.subject || ""} onChange={(e) => updateCur({ subject: e.target.value })} placeholder={`{{First Name}} — ${t("sequenceEditor.quickNote")}`} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                                    {showCc && <input value={cur.cc || ""} onChange={(e) => updateCur({ cc: e.target.value })} placeholder={t("sequenceEditor.ccPlaceholder")} className="w-full h-9 px-3 mt-2 rounded-[10px] border border-[#E1E4E8] text-[12.5px] outline-none focus:border-[#5B53E0]" />}
                                    {showBcc && <input value={cur.bcc || ""} onChange={(e) => updateCur({ bcc: e.target.value })} placeholder={t("sequenceEditor.bccPlaceholder")} className="w-full h-9 px-3 mt-2 rounded-[10px] border border-[#E1E4E8] text-[12.5px] outline-none focus:border-[#5B53E0]" />}
                                </div>

                                {/* Message */}
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wide text-[#8A929E]">{t("sequenceEditor.message")}</label>
                                        <div className="flex items-center gap-1.5 bg-[#F1F2F5] rounded-full p-0.5">
                                            <button onClick={() => setSnippetTab("ai")} className={`px-3 py-1 rounded-full text-[12px] font-bold transition-colors ${snippetTab === "ai" ? "bg-white text-[#5B53E0] shadow-sm" : "text-[#6B6F76] hover:text-[#374151]"}`}>{t("sequenceEditor.aiCommand")}</button>
                                            <button onClick={() => setSnippetTab("snippets")} className={`px-3 py-1 rounded-full text-[12px] font-bold transition-colors ${snippetTab === "snippets" ? "bg-white text-[#15171C] shadow-sm" : "text-[#6B6F76] hover:text-[#374151]"}`}>{t("sequenceEditor.snippets")}</button>
                                        </div>
                                    </div>

                                    {snippetTab === "snippets" ? (
                                        <div className="flex flex-wrap gap-2 mb-2.5">
                                            {SNIPPETS.map((f) => (
                                                <button key={f} onClick={() => insertSnippet(f)} className="px-3 py-1.5 rounded-full bg-[#F1F2F5] text-[#374151] text-[12.5px] font-semibold hover:bg-[#E8EAED]">{f}</button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <input placeholder={t("sequenceEditor.aiWritePlaceholder")} className="flex-1 h-9 px-3 rounded-[10px] border border-[#E1E4E8] text-[12.5px] outline-none focus:border-[#5B53E0]"
                                                onKeyDown={(e) => { if (e.key === "Enter") { setShowGen(true); setSnippetTab("snippets"); } }} />
                                            <button onClick={() => setShowGen(true)} className="h-9 px-3.5 rounded-[10px] bg-[#5B53E0] text-white text-[12.5px] font-bold hover:bg-[#4A43C9] flex items-center gap-1.5 shrink-0"><Sparkles className="w-3.5 h-3.5" /> {t("sequenceEditor.generate")}</button>
                                        </div>
                                    )}

                                    {/* Rich-text editor */}
                                    <div className="rounded-[12px] border border-[#E1E4E8] overflow-hidden focus-within:border-[#5B53E0] focus-within:ring-2 focus-within:ring-[#5B53E0]/12">
                                        <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 border-b border-[#E8EAED] bg-[#FAFBFC]">
                                            <ToolBtn title={t("sequenceEditor.undo")} onClick={() => exec("undo")}><Undo2 className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.redo")} onClick={() => exec("redo")}><Redo2 className="w-4 h-4" /></ToolBtn>
                                            <Divider />
                                            <ToolBtn title={t("sequenceEditor.bold")} onClick={() => exec("bold")}><Bold className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.italic")} onClick={() => exec("italic")}><Italic className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.underline")} onClick={() => exec("underline")}><Underline className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.bulletedList")} onClick={() => exec("insertUnorderedList")}><List className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.numberedList")} onClick={() => exec("insertOrderedList")}><ListOrdered className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.link")} onClick={() => { const u = window.prompt(t("sequenceEditor.linkUrl")); if (u) exec("createLink", u); }}><Link2 className="w-4 h-4" /></ToolBtn>
                                            <ToolBtn title={t("sequenceEditor.image")} onClick={() => { const u = window.prompt(t("sequenceEditor.imageUrl")); if (u) exec("insertImage", u); }}><ImageIcon className="w-4 h-4" /></ToolBtn>
                                            <Divider />
                                            <select onChange={(e) => exec("fontName", e.target.value)} defaultValue="Arial" className="h-8 px-2 rounded-[6px] border border-[#E1E4E8] text-[12px] bg-white outline-none">
                                                {["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana"].map((f) => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                            <select onChange={(e) => exec("fontSize", e.target.value)} defaultValue="3" className="h-8 px-2 rounded-[6px] border border-[#E1E4E8] text-[12px] bg-white outline-none">
                                                {[["10px", "1"], ["13px", "2"], ["14px", "3"], ["16px", "4"], ["18px", "5"], ["24px", "6"]].map(([lbl, v]) => <option key={v} value={v}>{lbl}</option>)}
                                            </select>
                                            <label title={t("sequenceEditor.textColor")} className="w-8 h-8 rounded-[6px] border border-[#E1E4E8] bg-white flex items-center justify-center cursor-pointer text-[13px] font-bold text-[#374151] relative overflow-hidden">A<input type="color" onChange={(e) => exec("foreColor", e.target.value)} className="w-0 h-0 opacity-0 absolute" /></label>
                                            <label title={t("sequenceEditor.highlight")} className="w-8 h-8 rounded-[6px] border border-[#E1E4E8] bg-white flex items-center justify-center cursor-pointer relative overflow-hidden"><span className="w-4 h-2 rounded-sm bg-[#FDE047]" /><input type="color" onChange={(e) => exec("hiliteColor", e.target.value)} className="w-0 h-0 opacity-0 absolute" /></label>
                                        </div>
                                        <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncBody} className="min-h-[260px] max-h-[44vh] overflow-y-auto no-scrollbar px-4 py-3 text-[14px] text-[#1F2127] leading-relaxed outline-none [&_a]:text-[#5B53E0] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" data-placeholder={t("sequenceEditor.writePlaceholder")} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview and test modal */}
            {showPreview && cur && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => { setShowPreview(false); setTestSent(false); }}>
                    <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-2xl w-full max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-[#E8EAED] flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-[#15171C]">{t("sequenceEditor.previewSendTest")} · {t("sequenceEditor.step", { n: sel + 1 })}</h3>
                            <button onClick={() => { setShowPreview(false); setTestSent(false); }} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 overflow-y-auto no-scrollbar space-y-4">
                            <p className="text-[11.5px] text-[#8A929E]">{t("sequenceEditor.mergeFieldsNote")}</p>
                            <div className="rounded-[12px] border border-[#E8EAED] overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#E8EAED] bg-[#FAFBFC]">
                                    <p className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wide">{t("sequenceEditor.subject")}</p>
                                    <p className="text-[14px] font-semibold text-[#15171C] mt-0.5">{fillPreview(cur.subject || "") || <span className="text-[#9AA3AF] font-normal">{t("sequenceEditor.noSubjectParen")}</span>}</p>
                                </div>
                                <div className="px-4 py-4 text-[14px] text-[#1F2127] leading-relaxed [&_a]:text-[#5B53E0] [&_a]:underline" dangerouslySetInnerHTML={{ __html: fillPreview(toHtml(cur.body || "")) || `<span style='color:#9AA3AF'>${t("sequenceEditor.empty")}</span>` }} />
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#E8EAED]">
                            <div className="flex items-center gap-2.5">
                                <input value={testEmail} onChange={(e) => { setTestEmail(e.target.value); setTestSent(false); setTestErr(""); }} placeholder={t("sequenceEditor.testRecipientPlaceholder")} className="flex-1 h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                                {testSent && <span className="text-[12.5px] font-semibold text-[#16A34A] shrink-0">{t("sequenceEditor.sentCheck")}</span>}
                                <button onClick={sendTest} disabled={sendingTest || !testEmail.trim()} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] disabled:opacity-60 flex items-center gap-2 shrink-0">{sendingTest && <Loader2 className="w-4 h-4 animate-spin" />} {t("sequenceEditor.sendTest")}</button>
                            </div>
                            {testErr && <p className="text-[12.5px] text-[#C0383C] bg-rose-50 border border-rose-100 rounded-[10px] px-3 py-2 mt-2.5">{testErr}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Generate step modal */}
            {showGen && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowGen(false)}>
                    <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-[#E8EAED] flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-[#15171C] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#5B53E0]" /> {t("sequenceEditor.generateStepAI")}</h3>
                            <button onClick={() => setShowGen(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto no-scrollbar">
                            <div>
                                <p className="text-[12px] font-bold text-[#8A929E] mb-2">{t("sequenceEditor.currentSteps")}</p>
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                                    {steps.map((st, i) => (
                                        <div key={i} className="rounded-[10px] border border-[#E8EAED] bg-[#FAFBFC] p-3">
                                            <p className="text-[12.5px] font-bold text-[#15171C]">{t("sequenceEditor.step", { n: i + 1 })} · {st.type === "email" ? t("sequenceEditor.email") : t("sequenceEditor.reply")}</p>
                                            <p className="text-[12px] text-[#6B6F76] mt-1 line-clamp-3 whitespace-pre-wrap">{st.body}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-[#15171C] mb-2">{t("sequenceEditor.nextStepPrompt")} <span className="text-[#EF4444]">*</span></p>
                                <textarea value={genInstruction} onChange={(e) => setGenInstruction(e.target.value)} rows={12} placeholder={t("sequenceEditor.instructionPlaceholder")} className="w-full resize-none px-3 py-2.5 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#E8EAED] flex items-center justify-end gap-2.5">
                            <button onClick={() => setShowGen(false)} className="h-10 px-4 rounded-[10px] border border-[#E1E4E8] text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("sequenceEditor.cancel")}</button>
                            <button onClick={generateStep} disabled={generating} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] disabled:opacity-60 flex items-center gap-2">{generating && <Loader2 className="w-4 h-4 animate-spin" />} {t("sequenceEditor.createStep")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ToolBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#4B5563] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors">
            {children}
        </button>
    );
}

function Divider() {
    return <span className="w-px h-5 bg-[#E1E4E8] mx-0.5" />;
}
