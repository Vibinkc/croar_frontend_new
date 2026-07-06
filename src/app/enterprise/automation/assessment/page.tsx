"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Briefcase,
  ChevronDown,
  Trash2,
  Edit2,
  X,
  Save,
  EyeOff,
  Sparkles,
  AlertCircle,
  Check,
  Circle
} from "lucide-react";


import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { PageHelp } from "@/components/ds";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStage {
  name: string;
  stage?: number;
  order?: number;
}

interface Job {
  id: string;
  title: string;
  workflow_stages?: WorkflowStage[] | null;
}

enum AssessmentType {
  APTITUDE = "APTITUDE",
  CODING = "CODING",
  BOTH = "BOTH",
}

interface Automation {
  id: string;
  job_requirement_id: string;
  stage_index: number;
  stage_name: string | null;
  criteria: string;
  type: AssessmentType;
  topic: string;
  question_count: number;
  generated_questions: Question[] | null;
  test_duration: number;
  email_template_id: string | null;
  template_id: string | null;
  email_template?: {
    id: string;
    name: string;
  } | null;
  is_enabled: boolean;
  is_immediate: boolean;
  auto_move: boolean;
  send_at: string | null;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface Question {
  id: string;
  type: AssessmentType;
  title?: string;
  description?: string;
  problem_statement?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

interface AssessmentTemplate {
  id: string;
  name: string;
  type?: AssessmentType;
  topic?: string;
  question_count?: number;
  test_duration?: number;
  email_template_id?: string | null;
  generated_questions?: Question[] | null;
}

interface FormState {
  job_requirement_id: string;
  stage_index: number | string;
  stage_name: string;
  criteria: string;
  type: AssessmentType;
  topic: string;
  question_count: number | string;
  test_duration: number | string;
  email_template_id: string;
  template_id: string;
  is_enabled: boolean;
  is_immediate: boolean;
  auto_move: boolean;
  send_at: string;
  generated_questions: Question[] | null;
}

const EMPTY_FORM: FormState = {
  job_requirement_id: "",
  stage_index: 1,
  stage_name: "",
  criteria: "",
  type: AssessmentType.APTITUDE,
  topic: "",
  question_count: 10,
  test_duration: 30,
  email_template_id: "",
  template_id: "",
  is_enabled: true,
  is_immediate: true,
  auto_move: false,
  send_at: "",
  generated_questions: null,
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentAutomationPage() {
  const { token, canAccess } = useAuth();

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const [jobs, setJobs] = useState<Job[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);
  const [originalForm, setOriginalForm] = useState<FormState | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'questions'>('config');
  const [isDetachConfirmOpen, setIsDetachConfirmOpen] = useState(false);
  // Row-level "Generate AI questions" now asks before replacing.
  const [regenerateTarget, setRegenerateTarget] = useState<Automation | null>(null);

  const showToast = (msg: string | { msg?: string, detail?: string } | Array<{ msg?: string } | string>, type: "success" | "error" = "success") => {
    let finalMsg = "";
    if (typeof msg === "string") {
      finalMsg = msg;
    } else if (Array.isArray(msg)) {
      finalMsg = msg.map((e: { msg?: string } | string) => (typeof e === 'string' ? e : (e.msg || JSON.stringify(e)))).join(", ");
    } else if (msg && typeof msg === "object") {
      const obj = msg as { msg?: string, detail?: string };
      finalMsg = obj.msg || obj.detail || JSON.stringify(msg);
    } else {
      finalMsg = String(msg || "An error occurred");
    }
    setToast({ msg: finalMsg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch jobs on mount
  useEffect(() => {
    if (!token) return;
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, { headers: authHeaders });
        const data = res.ok ? await res.json() : [];
        setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load jobs:", e);
      }
    };
    fetchJobs();

    const fetchEmailTemplates = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setEmailTemplates(data);
        }
      } catch (e) {
        console.error("Failed to load email templates:", e);
      }
    };
    fetchEmailTemplates();

    const fetchAssessmentTemplates = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setAssessmentTemplates(data);
        }
      } catch (e) {
        console.error("Failed to load assessment templates:", e);
      }
    };
    fetchAssessmentTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Fetch automations
  const fetchAutomations = useCallback(async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = jobId ? `?job_id=${jobId}` : "";
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${qs}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setAutomations(Array.isArray(data) ? data : []);
      } else {
        showToast("Failed to load automations.", "error");
      }
    } catch {
      showToast("Failed to load automations.", "error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchAutomations(selectedJobId || undefined);
  }, [selectedJobId, fetchAutomations]);

  // Rounds extracted from the selected job's workflow_stages
  const selectedJob = jobs.find((j) => j.id === form.job_requirement_id);
  const jobRounds: WorkflowStage[] = selectedJob?.workflow_stages ?? [];

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, job_requirement_id: selectedJobId });
    setShowModal(true);
  };

  const openEdit = (a: Automation) => {
    setEditingId(a.id);
    const newForm = {
      job_requirement_id: a.job_requirement_id,
      stage_index: a.stage_index,
      stage_name: a.stage_name ?? "",
      criteria: a.criteria,
      type: a.type,
      topic: a.topic,
      question_count: a.question_count || 10,
      test_duration: a.test_duration,
      email_template_id: a.email_template_id || "",
      template_id: a.template_id || "",
      is_enabled: a.is_enabled,
      is_immediate: a.is_immediate,
      auto_move: a.auto_move || false,
      send_at: a.send_at ? toLocalISO(a.send_at) : "",
      generated_questions: (a.generated_questions || []).map((q: Question) => ({
        ...q,
        id: q.id || crypto.randomUUID(),
      })) || null,
    };
    setForm(newForm);
    setOriginalForm(newForm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOriginalForm(null);
    setActiveTab('config');
  };

  // ── Save/Generate Preview ──────────────────────────────────────────────────

  const handleGeneratePreview = async () => {
    if (!form.job_requirement_id) {
      showToast("Please select a target job first.", "error");
      return;
    }
    if (!form.topic.trim()) {
      showToast("Please enter a topic for the assessment.", "error");
      return;
    }
    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast("Scheduled time cannot be in the past.", "error");
        return;
      }
    }
    setSaving(true);
    try {
      const qs = `type=${form.type}&topic=${encodeURIComponent(form.topic)}&count=${form.question_count}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/generate-preview?${qs}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        const questions = await res.json();
        // Handle both raw array and { questions: [...] } format
        const qArray = Array.isArray(questions) ? questions : (questions.questions || []);
        
        // Ensure each question has an ID for proper React rendering
        const finalQuestions = qArray.map((q: Question) => ({
          ...q,
          id: q.id || crypto.randomUUID()
        }));

        // AI-generated questions are not the template's set — detach from the
        // template so we never persist a template_id alongside foreign questions.
        setForm(f => ({ ...f, generated_questions: finalQuestions, template_id: "" }));
        setActiveTab('questions');
        showToast("Questions generated! Please review questions.");
      } else {
        showToast("Failed to generate questions.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Entry point for the "Draft / Regenerate with AI" buttons. If a template is
  // currently attached, confirm first — generating will replace its questions and
  // switch the automation to a custom (template-less) configuration.
  const requestGeneratePreview = () => {
    if (!form.job_requirement_id) {
      showToast("Please select a target job first.", "error");
      return;
    }
    if (!form.topic.trim()) {
      showToast("Please enter a topic for the assessment.", "error");
      return;
    }
    if (form.template_id) {
      setIsDetachConfirmOpen(true);
      return;
    }
    handleGeneratePreview();
  };

  const selectedTemplateName = assessmentTemplates.find(t => t.id === form.template_id)?.name || "selected";

  // Blocks saving incomplete/empty questions. Returns the first problem (with the
  // question number) or null when every question is complete.
  const validateQuestionContent = (questions: Question[] | null): string | null => {
    for (let i = 0; i < (questions || []).length; i++) {
      const q = (questions as Question[])[i];
      const n = i + 1;
      if (q.type === 'CODING') {
        if (!(q.title || "").trim()) return `Question ${n}: add a problem title.`;
        if (!((q.description || q.problem_statement || "") as string).trim())
          return `Question ${n}: add a problem description or statement.`;
      } else {
        if (!(q.question || "").trim()) return `Question ${n}: add the question text.`;
        const opts = (q.options || []).map(o => (o || "").trim());
        if (opts.length < 2 || opts.some(o => !o)) return `Question ${n}: fill in every answer option.`;
        if (!(q.correct_answer || "").trim() || !opts.includes((q.correct_answer || "").trim()))
          return `Question ${n}: mark which option is the correct answer.`;
      }
    }
    return null;
  };

  const handleFinalCreate = async () => {
    if (!form.job_requirement_id) {
      showToast("Job selection is required.", "error");
      return;
    }
    // Require a real hiring round (marked required). Without this the default stage_index (1) or a
    // cleared value (→ 0) was saved silently, so the assessment fired at the wrong round or never.
    const stageMissing = jobRounds.length > 0 ? !form.stage_name : !(Number(form.stage_index) > 0);
    if (stageMissing) {
      showToast("Select the hiring round this assessment triggers on.", "error");
      return;
    }
    if (!form.generated_questions || form.generated_questions.length === 0) {
      showToast("Add at least one question — draft with AI or add manually — before creating.", "error");
      setActiveTab('questions');
      return;
    }
    const qErr = validateQuestionContent(form.generated_questions);
    if (qErr) {
      showToast(qErr, "error");
      setActiveTab('questions');
      return;
    }
    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast("Scheduled time cannot be in the past.", "error");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        job_requirement_id: form.job_requirement_id,
        stage_index: Number(form.stage_index) || 0,
        stage_name: form.stage_name.trim() || null,
        criteria: form.criteria || "Assessment Trigger",
        type: form.type,
        topic: form.topic,
        question_count: Number(form.question_count),
        test_duration: Number(form.test_duration),
        email_template_id: form.email_template_id || null,
        template_id: form.template_id || null,
        is_enabled: form.is_enabled,
        is_immediate: form.is_immediate,
        auto_move: form.auto_move,
        send_at: form.is_immediate || !form.send_at ? null : new Date(form.send_at).toISOString(),
        generated_questions: form.generated_questions,
      };
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("Assessment Automation created successfully!");
        setForm(EMPTY_FORM);
        fetchAutomations(selectedJobId || undefined);
        closeModal();
      } else {
        showToast("Failed to create automation.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const qErr = validateQuestionContent(form.generated_questions);
    if (qErr) {
      showToast(qErr, "error");
      setActiveTab('questions');
      return;
    }
    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast("Scheduled time cannot be in the past.", "error");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        job_requirement_id: form.job_requirement_id,
        stage_index: Number(form.stage_index),
        stage_name: form.stage_name.trim() || null,
        criteria: form.criteria,
        type: form.type,
        topic: form.topic,
        question_count: Number(form.question_count),
        test_duration: Number(form.test_duration),
        email_template_id: form.email_template_id || null,
        template_id: form.template_id || null,
        is_enabled: form.is_enabled,
        is_immediate: form.is_immediate,
        auto_move: form.auto_move,
        send_at: form.is_immediate || !form.send_at ? null : new Date(form.send_at).toISOString(),
        generated_questions: form.generated_questions,
      };
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${editingId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("Automation updated!");
        closeModal();
        fetchAutomations(selectedJobId || undefined);
      } else {
        showToast("Failed to update.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Automation) => {
    setTogglingId(a.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${a.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ is_enabled: !a.is_enabled }),
      });
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((item) => (item.id === a.id ? { ...item, is_enabled: !a.is_enabled } : item))
        );
      } else {
        showToast("Failed to update status.", "error");
      }
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!automationToDelete) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${automationToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        showToast("Automation deleted.");
        setAutomations((prev) => prev.filter((item) => item.id !== automationToDelete.id));
      } else {
        showToast("Failed to delete.", "error");
      }
    } finally {
      setIsDeleteModalOpen(false);
      setAutomationToDelete(null);
    }
  };

  const handleUpdateQuestion = (id: string, field: string, value: string | string[]) => {
    setForm(f => ({
      ...f,
      generated_questions: (f.generated_questions || []).map((q: Question) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleDeleteQuestion = (id: string) => {
    setForm(f => ({
      ...f,
      generated_questions: (f.generated_questions || []).filter((q: Question) => q.id !== id)
    }));
    showToast("Question removed.");
  };

  const handleAddQuestion = () => {
    const currentType = form.type === "CODING" ? "CODING" : "APTITUDE";

    // Start blank so the new question must be filled in — validation blocks empty ones.
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: currentType as AssessmentType,
    };

    if (currentType === "CODING") {
      newQ.title = "";
      newQ.description = "";
      newQ.problem_statement = "";
    } else {
      newQ.question = "";
      newQ.options = ["", "", "", ""];
      newQ.correct_answer = "";
      newQ.explanation = "";
    }

    const detaching = !!form.template_id;
    setForm(f => ({
      ...f,
      generated_questions: [...(f.generated_questions || []), newQ],
      template_id: "",
    }));
    showToast(detaching
      ? "Switched to a custom question set — no longer linked to the template."
      : "Blank question added — fill it in before saving.");
  };

  const handleGenerateQuestions = async (a: Automation) => {
    setGeneratingId(a.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${a.id}/generate`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        // AI questions are not the template's set — detach so we never keep a stale
        // template link alongside regenerated questions.
        if (a.template_id) {
          await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${a.id}`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ template_id: null }),
          }).catch(() => {});
        }
        showToast("AI questions generated successfully!");
        fetchAutomations(selectedJobId || undefined);
      } else {
        showToast("AI Generation failed.", "error");
      }
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "—";

  const toLocalISO = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleRoundSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") return;
    const [idxStr, ...nameParts] = val.split("|");
    setForm((f) => ({
      ...f,
      stage_index: Number(idxStr),
      stage_name: nameParts.join("|"),
    }));
  };
  
  const filteredAutomations = automations.filter((a) => {
    const matchesJob = !selectedJobId || a.job_requirement_id === selectedJobId;
    const s = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      a.topic?.toLowerCase().includes(s) || 
      a.criteria?.toLowerCase().includes(s) ||
      jobTitle(a.job_requirement_id).toLowerCase().includes(s) ||
      a.stage_name?.toLowerCase().includes(s);
    return matchesJob && matchesSearch;
  });

  const hasFormChanged = originalForm ? JSON.stringify(form) !== JSON.stringify(originalForm) : true;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold transition-all duration-300 ${
            toast.type === "success" ? "bg-[#5B53E0] text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white" />
          )}
          {String(toast.msg)}
        </div>
      )}

      {/* Header (sticky) */}
      <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">
              Assessment Automation
            </h1>
            <PageHelp title="Assessment Automation">
              <p>Automatically send assessments to candidates at the right stage.</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#8A929E] mt-0.5">Generate AI-powered assessments for candidates reaching specific hiring rounds.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {canAccess("assessments:moderate") && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              New Automation
            </button>
          )}
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Rules", value: automations.length, Icon: Briefcase, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
          { label: "Active Rules", value: automations.filter(a => a.is_enabled).length, Icon: Zap, grad: "linear-gradient(135deg,#34D399,#059669)", glow: "rgba(5,150,105,0.25)" },
          { label: "Ready Assessments", value: automations.filter(a => a.generated_questions?.length).length, Icon: CheckCircle2, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" },
          { label: "Auto-Move Rules", value: automations.filter(a => a.auto_move).length, Icon: Brain, grad: "linear-gradient(135deg,#C084FC,#8B5CF6)", glow: "rgba(139,92,246,0.25)" }
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative bg-white border border-[#E8EAED] hover:border-[#D4D7DC] rounded-[14px] p-5 overflow-hidden transition-all duration-300 hover:shadow-sm"
          >
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                <div className="text-[30px] font-semibold tracking-[-1px] text-[#15171C] mt-2">{s.value}</div>
              </div>
              <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                <s.Icon className="w-[18px] h-[18px]" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, round name, or criteria..."
            className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] pl-11 pr-4 text-sm font-semibold text-[#1F2127] placeholder:text-[#9AA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {(searchQuery || selectedJobId) && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedJobId(""); }}
              className="text-[12.5px] font-bold text-[#5B53E0] hover:underline px-2 tracking-tight"
            >
              Reset Filters
            </button>
          )}
          <div className="relative w-full md:w-64">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]">
              <Briefcase className="w-4 h-4" />
            </div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 pl-9 pr-9 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] hover:bg-[#F7F8FA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
            >
              <option value="">All Job Requirements</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white border border-[#E8EAED] rounded-[14px] min-h-[300px] items-center">
          <div className="w-8 h-8 border-4 border-[#5B53E0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-[#E8EAED] rounded-[14px] min-h-[300px]">
          <div className="relative mb-6">
            <div className="absolute -inset-3 rounded-full bg-[#FEF3E2] blur-2xl" />
            <div className="relative w-16 h-16 rounded-[18px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#FBBF24,#D97706)", boxShadow: "0 12px 30px rgba(217,119,6,0.3)" }}>
              <Brain className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-[18px] font-bold text-[#15171C] mb-1.5">
            {searchQuery ? 'No matching assessments' : 'No assessment automations yet'}
          </h3>
          <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-6">
            {searchQuery ? `We couldn't find any results for "${searchQuery}"` : 'Generate your first assessment automation using the "New Automation" button.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedJobId(""); }}
              className="px-6 h-11 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-all"
            >
              Clear Search Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em]">Rule Configuration</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em]">Job & Assessment Topic</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em]">Readiness</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em]">Trigger/Schedule</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em]">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EAED]">
                {filteredAutomations.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F7F8FA]/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#ECEBFB] text-[#5B53E0] rounded-[6px] text-[10px] font-bold uppercase tracking-wide">
                            Round {a.stage_index}
                          </span>
                          {a.stage_name && (
                            <span className="text-[12px] font-semibold text-[#8A929E] tracking-tight">{a.stage_name}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#374151] line-clamp-1">
                          <span className="text-[#8A929E] font-normal italic mr-1">If:</span>
                          {a.criteria}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                          <Briefcase className="w-3.5 h-3.5 text-[#8A929E]" />
                          {jobTitle(a.job_requirement_id)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#D97706] uppercase">
                          <Brain className="w-3.5 h-3.5 text-[#D97706]" />
                          {a.type}: {a.topic}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a.generated_questions && a.generated_questions.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0E8A6E]">
                          <CheckCircle2 className="w-4 h-4 text-[#0E8A6E]" />
                          <span>{a.generated_questions.length} Questions Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#D97706]">
                          <AlertCircle className="w-4 h-4 text-[#D97706]" />
                          <span>No questions yet</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                          {a.is_immediate ? <Zap className="w-3.5 h-3.5 text-[#D97706]" /> : <Clock className="w-3.5 h-3.5 text-[#8A929E]" />}
                          <span>
                            {a.is_immediate 
                              ? "Immediate" 
                              : new Date(a.send_at!.endsWith('Z') ? a.send_at! : a.send_at! + 'Z').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        {a.auto_move && (
                          <div className="text-[10px] font-bold text-[#5B53E0] uppercase tracking-wide">
                            Auto-Move Active
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={togglingId === a.id || !canAccess("assessments:moderate")}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"} ${togglingId === a.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canAccess("assessments:moderate") && (
                          <button
                            onClick={() => setRegenerateTarget(a)}
                            disabled={generatingId === a.id}
                            className={`w-8 h-8 flex items-center justify-center rounded-[8px] transition-all ${
                              a.generated_questions
                                ? "bg-[#F4F5F7] text-[#8A929E] hover:bg-[#ECEBFB] hover:text-[#5B53E0]"
                                : "bg-[#FEF3E2] text-[#D97706] hover:bg-[#D97706] hover:text-white"
                            }`}
                            title={a.generated_questions ? "Regenerate AI Questions" : "Generate AI Questions"}
                          >
                            {generatingId === a.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(a)}
                          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#1F2127] transition-all"
                          title={a.generated_questions ? "View / edit questions & rule" : "Edit rule"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAutomationToDelete(a); setIsDeleteModalOpen(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-rose-50 text-[#8A929E] hover:text-rose-600 transition-all"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Side Panel Drawer ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div
            role="button"
            tabIndex={0}
            aria-label="Close panel"
            className="absolute inset-0 bg-[#15171C]/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeModal}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { closeModal(); } }}
          />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED] bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#FEF3E2] flex items-center justify-center border border-[#FCE1BF]/80 shadow-sm">
                  <Brain className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#15171C]">
                    {editingId ? "Edit Automation" : "Create Automation"}
                  </h2>
                  <p className="text-[12px] text-[#8A929E] font-medium">Configure AI Assessment</p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="w-8 h-8 rounded-[8px] hover:bg-[#F4F5F7] flex items-center justify-center text-[#8A929E] hover:text-[#1F2127] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-[#E8EAED] bg-white px-6">
              <button 
                onClick={() => setActiveTab('config')} 
                className={`px-5 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-px ${activeTab === 'config' ? 'border-[#5B53E0] text-[#5B53E0]' : 'border-transparent text-[#8A929E] hover:text-[#4B5563]'}`}
              >
                1. Configuration
              </button>
              <button 
                onClick={() => setActiveTab('questions')} 
                className={`px-5 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-px ${activeTab === 'questions' ? 'border-[#5B53E0] text-[#5B53E0]' : 'border-transparent text-[#8A929E] hover:text-[#4B5563]'}`}
              >
                2. Questions {form.generated_questions?.length ? `(${form.generated_questions.length})` : ''}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
              {activeTab === 'config' ? (
                <div className="p-6 space-y-5 max-w-xl mx-auto">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="assessment-target-job" className="block text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 ml-1">Target Job <span className="text-red-400">*</span></label>
                        <select
                          id="assessment-target-job"
                          value={form.job_requirement_id}
                          onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value }))}
                          disabled={!!editingId}
                          title={editingId ? "The job can't be changed after creation" : undefined}
                          className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all cursor-pointer disabled:bg-[#F4F5F7] disabled:cursor-not-allowed"
                        >
                          <option value="">Select a job...</option>
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="assessment-hiring-round" className="block text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 ml-1">Hiring Round <span className="text-red-400">*</span></label>
                        {jobRounds.length > 0 ? (
                          <select
                            id="assessment-hiring-round"
                            onChange={handleRoundSelect}
                            defaultValue={editingId ? `${form.stage_index}|${form.stage_name || ''}` : ""}
                            className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all cursor-pointer"
                          >
                            <option value="">Pick a round...</option>
                            {jobRounds.map((r, i) => (
                              <option key={i} value={`${i + 1}|${r.name}`}>Round {i + 1} — {r.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <input id="assessment-hiring-round" type="number" min={1} value={form.stage_index} onChange={(e) => setForm((f) => ({ ...f, stage_index: Number(e.target.value) }))} placeholder="Index" className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all" />
                            <input type="text" value={form.stage_name} onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))} placeholder="Name" className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#FEF3E2]/40 rounded-[12px] p-5 space-y-4 border border-[#FCE1BF] mb-4">
                      <div>
                        <label htmlFor="assessment-template-select" className="block text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-1.5 ml-1">Use Assessment Template (Optional)</label>
                        <select
                          id="assessment-template-select"
                          value={form.template_id || ""}
                          onChange={(e) => {
                            const templateId = e.target.value;
                            if (templateId) {
                               const templ = assessmentTemplates.find(t => t.id === templateId);
                               if (templ) {
                                  setForm(f => ({
                                      ...f,
                                      template_id: templateId,
                                      type: templ.type ?? f.type,
                                      topic: templ.topic ?? f.topic,
                                      question_count: templ.question_count ?? f.question_count,
                                      test_duration: templ.test_duration ?? f.test_duration,
                                      email_template_id: templ.email_template_id || f.email_template_id,
                                      generated_questions: templ.generated_questions || null
                                  }));
                               }
                            } else {
                               setForm(f => ({
                                  ...f,
                                  template_id: "",
                               }));
                            }
                          }}
                          className="w-full h-11 bg-white border border-[#FCE1BF] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] transition-all cursor-pointer"
                        >
                          <option value="">-- Custom Assessment Configuration --</option>
                          {assessmentTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.type} - {t.topic})</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-[#8A929E] mt-1.5 ml-1 leading-relaxed">Selecting a template will auto-fill the assessment configuration and questions.</p>
                      </div>
                    </div>

                    <div className="bg-[#FEF3E2]/20 rounded-[12px] p-5 space-y-4 border border-[#FCE1BF]/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="assessment-type" className="block text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-1.5 ml-1">Type <span className="text-red-400">*</span></label>
                          <select
                            id="assessment-type"
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AssessmentType }))}
                            className="w-full h-11 bg-white border border-[#FCE1BF] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] transition-all cursor-pointer"
                          >
                            {Object.values(AssessmentType).map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="assessment-topic" className="block text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-1.5 ml-1">Topic <span className="text-red-400">*</span></label>
                          <input
                            id="assessment-topic"
                            type="text"
                            value={form.topic}
                            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                            className="w-full h-11 bg-white border border-[#FCE1BF] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] transition-all"
                            placeholder="e.g. SQL, Python..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="assessment-question-count" className="block text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-1.5 ml-1">Questions <span className="text-red-400">*</span></label>
                          <input
                            id="assessment-question-count"
                            type="number"
                            min={1}
                            max={50}
                            value={form.question_count}
                            onChange={(e) => setForm((f) => ({ ...f, question_count: Number(e.target.value) }))}
                            className="w-full h-11 bg-white border border-[#FCE1BF] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="assessment-test-duration" className="block text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-1.5 ml-1">Time (min) <span className="text-red-400">*</span></label>
                          <input
                            id="assessment-test-duration"
                            type="number"
                            min={5}
                            value={form.test_duration}
                            onChange={(e) => setForm((f) => ({ ...f, test_duration: Number(e.target.value) }))}
                            className="w-full h-11 bg-white border border-[#FCE1BF] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="assessment-criteria" className="block text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 ml-1">Trigger Criteria <span className="text-red-400">*</span></label>
                        <textarea
                          id="assessment-criteria"
                          rows={2}
                          value={form.criteria} 
                          onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))} 
                          className="w-full bg-white border border-[#E1E4E8] rounded-[12px] px-4 py-3 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all resize-none h-20" 
                          placeholder="e.g. 'Match score > 80' or 'Background includes React'..." 
                        />
                      </div>

                      <div>
                        <label htmlFor="assessment-email-template" className="block text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 ml-1">Email Template <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <select
                            id="assessment-email-template"
                            value={form.email_template_id || ""}
                            onChange={(e) => setForm((f) => ({ ...f, email_template_id: e.target.value }))}
                            className={`w-full bg-white border rounded-[12px] h-11 pl-4 pr-9 text-[13.5px] font-semibold text-[#374151] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all ${!form.email_template_id ? 'border-amber-300' : 'border-[#E1E4E8]'}`}
                          >
                            <option value="">Select Email Template...</option>
                            {emailTemplates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E8EAED]">
                      <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] border border-[#E8EAED] rounded-[12px] transition-all hover:border-[#DAD7F6]/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E8EAED] flex items-center justify-center shadow-sm">
                            <CheckCircle2 className={`w-4 h-4 ${form.is_enabled ? "text-[#5B53E0]" : "text-[#8A929E]"}`} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-[#1F2127]">Active</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_enabled ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] border border-[#E8EAED] rounded-[12px] transition-all hover:border-[#DAD7F6]/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E8EAED] flex items-center justify-center shadow-sm">
                            <ChevronRight className={`w-4 h-4 ${form.auto_move ? "text-[#5B53E0]" : "text-[#8A929E]"}`} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-[#1F2127]">Auto-Move</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.auto_move ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8EAED]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="text-[#8A929E] w-4 h-4" />
                          <span className="text-[12px] font-bold text-[#374151]">Scheduling</span>
                        </div>
                        <div className="flex bg-[#F4F5F7] p-1 rounded-[10px]">
                          <button
                            onClick={() => setForm(f => ({ ...f, is_immediate: true }))}
                            className={`px-3.5 py-1.5 rounded-[8px] text-[12px] font-bold transition-all ${
                              form.is_immediate ? "bg-white text-[#5B53E0] shadow-sm" : "text-[#8A929E] hover:text-[#4B5563]"
                            }`}
                          >
                            Immediate
                          </button>
                          <button
                            onClick={() => setForm(f => ({ ...f, is_immediate: false }))}
                            className={`px-3.5 py-1.5 rounded-[8px] text-[12px] font-bold transition-all ${
                              !form.is_immediate ? "bg-white text-[#5B53E0] shadow-sm" : "text-[#8A929E] hover:text-[#4B5563]"
                            }`}
                          >
                            Scheduled
                          </button>
                        </div>
                      </div>

                      {!form.is_immediate && (
                        <div className="bg-[#FEF3E2]/50 rounded-[12px] p-4 border border-[#FCE1BF] animate-in fade-in slide-in-from-top-2 duration-300">
                          <label htmlFor="assessment-send-at" className="block text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-1.5 ml-1">Send At (Date & Time)</label>
                          <input
                            id="assessment-send-at"
                            type="datetime-local"
                            value={form.send_at}
                            onChange={(e) => setForm(f => ({ ...f, send_at: e.target.value }))}
                            className="w-full h-11 bg-white border border-[#FCE1BF] rounded-[12px] px-4 text-[13.5px] font-semibold text-[#374151] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] shadow-sm"
                          />
                          <p className="mt-2 text-[11.5px] text-[#D97706] font-medium leading-relaxed">
                            The assessment invitation will be queued and sent at the specified time if the criteria are met.
                          </p>
                        </div>
                      )}

                      <div className="pt-4 mt-6 border-t border-[#E8EAED]">
                        {form.template_id && (
                          <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-[#FCE1BF] bg-[#FEF3E2]/60 px-3.5 py-2.5">
                            <AlertCircle className="w-4 h-4 text-[#D97706] mt-0.5 shrink-0" />
                            <p className="text-[11.5px] font-semibold text-[#92590C] leading-relaxed">
                              Questions come from the &quot;{selectedTemplateName}&quot; template. Drafting with AI or adding a question will switch this automation to a custom set and unlink the template.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={requestGeneratePreview}
                          disabled={saving || !form.job_requirement_id || !form.topic}
                          className="w-full h-12 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[12px] text-[13.5px] font-bold shadow-[0_6px_16px_rgba(91,83,224,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {form.generated_questions?.length ? "Regenerate Draft with AI" : "Draft Questions with AI"}
                        </button>
                        <p className="text-[11px] text-[#8A929E] mt-3 text-center font-semibold opacity-60">Step 1: Configure & Draft</p>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="p-6 space-y-6 max-w-3xl mx-auto">
                   <div className="flex items-center justify-between mb-2">
                       <div>
                         <h3 className="text-[14px] font-bold text-[#15171C]">Assessment Preview</h3>
                         <p className="text-[12px] text-[#8A929E] font-medium">Review and edit the AI-generated questions</p>
                       </div>
                       <button 
                         onClick={handleAddQuestion}
                         className="flex items-center gap-2 h-9 px-3 bg-white border border-[#E1E4E8] rounded-[10px] text-[12px] font-semibold text-[#5B53E0] hover:bg-[#F4F5F7] hover:border-[#DAD7F6] transition-all shadow-sm"
                       >
                         <Plus className="w-4 h-4" />
                         <span>Add Question</span>
                       </button>
                    </div>

                    {form.generated_questions && form.generated_questions.length > 0 ? (
                       <div className="space-y-6">
                         {form.generated_questions.map((q: Question, idx: number) => (
                           <div key={q.id} className="bg-white border border-[#E8EAED] hover:border-[#D4D7DC] rounded-[12px] p-6 shadow-sm hover:shadow-md transition-all relative group">
                             <div className="absolute -top-3 -left-3 w-7 h-7 bg-[#5B53E0] text-white rounded-[8px] flex items-center justify-center text-[12px] font-bold shadow-sm">#{idx + 1}</div>
                             
                             <button 
                               onClick={() => handleDeleteQuestion(q.id)}
                               className="absolute top-4 right-4 w-8 h-8 rounded-[8px] bg-rose-50 text-rose-600 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-600 hover:text-white"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>

                             <div className="space-y-4">
                               {q.type === 'APTITUDE' ? (
                                 <>
                                   <div>
                                     <label htmlFor={`cfg-q-question-${q.id}`} className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 block ml-1">Question Text (Aptitude)</label>
                                     <textarea
                                       id={`cfg-q-question-${q.id}`}
                                       value={q.question || ""}
                                       onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                                       placeholder="Type the question…"
                                       className="w-full bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] px-4 py-2.5 text-sm font-semibold text-[#374151] placeholder:text-[#9AA3AF] placeholder:font-normal focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all h-20 resize-none"
                                     />
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {(q.options || []).map((opt: string, oi: number) => (
                                       <div key={oi} className="relative">
                                         <input
                                           value={opt}
                                           onChange={(e) => {
                                             const newOpts = [...(q.options ?? [])];
                                             newOpts[oi] = e.target.value;
                                             handleUpdateQuestion(q.id, "options", newOpts);
                                           }}
                                           placeholder={`Option ${oi + 1}`}
                                           className={`w-full bg-[#F7F8FA] border-2 rounded-[10px] pl-12 pr-4 py-2.5 text-xs font-semibold transition-all placeholder:text-[#9AA3AF] placeholder:font-normal ${q.correct_answer === opt ? "border-[#5B53E0] bg-[#ECEBFB] text-[#5B53E0]" : "border-transparent text-[#4B5563]"}`}
                                         />
                                         <button 
                                           onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                           className={`absolute left-3 top-2.5 w-6 h-6 rounded-[6px] flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#5B53E0] text-white" : "bg-[#E1E4E8] text-[#8A929E] hover:bg-[#D4D7DC]"}`}
                                         >
                                           {q.correct_answer === opt ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                         </button>
                                       </div>
                                     ))}
                                   </div>
                                 </>
                               ) : (
                                 <>
                                   <div>
                                     <label htmlFor={`cfg-q-title-${q.id}`} className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 block ml-1">Problem Title</label>
                                     <input
                                       id={`cfg-q-title-${q.id}`}
                                       type="text"
                                       value={q.title || ""}
                                       onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                                       placeholder="e.g. Two Sum"
                                       className="w-full bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] px-4 py-2 text-sm font-semibold text-[#374151] placeholder:text-[#9AA3AF] placeholder:font-normal focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all"
                                     />
                                   </div>
                                   <div>
                                     <label htmlFor={`cfg-q-description-${q.id}`} className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 block ml-1">Problem Description</label>
                                     <textarea
                                       id={`cfg-q-description-${q.id}`}
                                       value={q.description || ""}
                                       onChange={(e) => handleUpdateQuestion(q.id, "description", e.target.value)}
                                       placeholder="Describe the problem the candidate must solve…"
                                       className="w-full bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] px-4 py-2 text-sm font-semibold text-[#374151] placeholder:text-[#9AA3AF] placeholder:font-normal focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all h-32 resize-none"
                                     />
                                   </div>
                                   <div>
                                     <label htmlFor={`cfg-q-statement-${q.id}`} className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5 block ml-1">Problem Statement</label>
                                     <textarea
                                       id={`cfg-q-statement-${q.id}`}
                                       value={q.problem_statement || ""}
                                       onChange={(e) => handleUpdateQuestion(q.id, "problem_statement", e.target.value)}
                                       placeholder="// Constraints, examples, or starter code…"
                                       className="w-full bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] px-4 py-2 text-xs font-mono text-[#374151] placeholder:text-[#9AA3AF] focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all h-32 resize-none"
                                     />
                                   </div>
                                 </>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                        <div className="w-16 h-16 rounded-[14px] bg-white border border-[#E8EAED] flex items-center justify-center mb-4 shadow-sm">
                          <EyeOff className="text-[#8A929E] w-6 h-6" />
                        </div>
                        <h3 className="text-[14px] font-bold text-[#15171C]">No Preview Yet</h3>
                        <p className="max-w-[240px] text-[12px] text-[#8A929E] font-medium leading-relaxed mt-1.5">
                          Click &quot;Generate AI Questions&quot; in the configuration tab to see AI-generated questions here.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E8EAED] bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={closeModal} 
                  className="flex-1 h-11 bg-white border border-[#E1E4E8] rounded-[10px] text-[13.5px] font-semibold text-[#4B5563] hover:bg-[#F4F5F7] transition-all"
                >
                  Cancel
                </button>
                {editingId ? (
                  <button
                    onClick={handleUpdate}
                    disabled={saving || !hasFormChanged}
                    className="flex-[2] h-11 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[13.5px] font-semibold transition-all shadow-[0_6px_16px_rgba(91,83,224,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFinalCreate}
                    disabled={saving || !form.generated_questions?.length}
                    title={!form.generated_questions?.length ? "Draft questions with AI (or add one) first" : undefined}
                    className="flex-[2] h-11 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[13.5px] font-semibold transition-all shadow-[0_6px_16px_rgba(91,83,224,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>Confirm & Create</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAutomationToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Assessment Automation?"
        message={`Are you sure you want to delete this assessment automation for ${automationToDelete ? jobTitle(automationToDelete.job_requirement_id) : 'this job'}? This action is irreversible.`}
        confirmLabel="Yes, Delete"
        cancelLabel="No"
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={isDetachConfirmOpen}
        onClose={() => setIsDetachConfirmOpen(false)}
        onConfirm={() => { setIsDetachConfirmOpen(false); handleGeneratePreview(); }}
        title="Replace template questions?"
        message={`This automation is using the "${selectedTemplateName}" template. Drafting with AI will replace its questions and switch the automation to a custom configuration (it will no longer be linked to the template). Continue?`}
        confirmLabel="Replace & Use AI"
        cancelLabel="Keep Template"
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={!!regenerateTarget}
        onClose={() => setRegenerateTarget(null)}
        onConfirm={() => { const t = regenerateTarget; setRegenerateTarget(null); if (t) handleGenerateQuestions(t); }}
        title={regenerateTarget?.generated_questions?.length ? "Regenerate AI questions?" : "Generate AI questions?"}
        message={
          regenerateTarget?.generated_questions?.length
            ? `This will generate a fresh AI question set for "${regenerateTarget?.topic}" and replace the current ${regenerateTarget?.generated_questions?.length} question${regenerateTarget?.generated_questions?.length === 1 ? "" : "s"}${regenerateTarget?.template_id ? ", and unlink the attached template" : ""}. This cannot be undone.`
            : `AI will draft questions for "${regenerateTarget?.topic}" based on this rule's type and topic. You can review and edit them afterwards.`
        }
        confirmLabel={regenerateTarget?.generated_questions?.length ? "Regenerate" : "Generate"}
        cancelLabel="Cancel"
        isDestructive={!!regenerateTarget?.generated_questions?.length}
      />
    </div>
  );
}
