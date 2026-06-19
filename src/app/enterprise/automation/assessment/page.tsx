"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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
  const [previewingAutomation, setPreviewingAutomation] = useState<Automation | null>(null);
  const [originalForm, setOriginalForm] = useState<FormState | null>(null);
  const [originalQuestions, setOriginalQuestions] = useState<Question[] | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'questions'>('config');

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
      }
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
    setOriginalQuestions(null);
    setActiveTab('config');
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const [isPreviewingNew, setIsPreviewingNew] = useState(false);

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

        setForm(f => ({ ...f, generated_questions: finalQuestions }));
        setActiveTab('questions');
        showToast("Questions generated! Please review questions.");
      } else {
        showToast("Failed to generate questions.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFinalCreate = async () => {
    if (!form.job_requirement_id) {
      showToast("Job selection is required.", "error");
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
        setPreviewingAutomation(null);
        setIsPreviewingNew(false);
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

  const handleSaveQuestions = async () => {
    if (!previewingAutomation) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${previewingAutomation.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ generated_questions: previewingAutomation.generated_questions }),
      });
      if (res.ok) {
        showToast("Questions saved successfully!");
        setPreviewingAutomation(null);
        fetchAutomations(selectedJobId || undefined);
      } else {
        showToast("Failed to save questions.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
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
    if (previewingAutomation) {
      setPreviewingAutomation(prev => ({
        ...prev!,
        generated_questions: (prev!.generated_questions || []).map((q: Question) =>
          q.id === id ? { ...q, [field]: value } : q
        )
      }));
    } else {
      setForm(f => ({
        ...f,
        generated_questions: (f.generated_questions || []).map((q: Question) =>
          q.id === id ? { ...q, [field]: value } : q
        )
      }));
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (previewingAutomation) {
      setPreviewingAutomation(prev => ({
        ...prev!,
        generated_questions: (prev!.generated_questions || []).filter((q: Question) => q.id !== id)
      }));
    } else {
      setForm(f => ({
        ...f,
        generated_questions: (f.generated_questions || []).filter((q: Question) => q.id !== id)
      }));
    }
    showToast("Question removed.");
  };

  const handleAddQuestion = () => {
    const currentType = (previewingAutomation?.type || form.type) === "CODING" ? "CODING" : "APTITUDE";
    
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: currentType as AssessmentType,
    };

    if (currentType === "CODING") {
      newQ.title = "New Coding Problem";
      newQ.description = "Enter problem description...";
      newQ.problem_statement = "// Write your problem statement or starter code here...";
    } else {
      newQ.question = "New Aptitude Question";
      newQ.options = ["Option 1", "Option 2", "Option 3", "Option 4"];
      newQ.correct_answer = "Option 1";
      newQ.explanation = "";
    }

    if (previewingAutomation) {
      setPreviewingAutomation(prev => ({
        ...prev!,
        generated_questions: [...(prev!.generated_questions || []), newQ]
      }));
    } else {
      setForm(f => ({
        ...f,
        generated_questions: [...(f.generated_questions || []), newQ]
      }));
    }
    showToast("Manual question added!");
  };

  const handleGenerateQuestions = async (id: string) => {
    setGeneratingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/${id}/generate`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        showToast("AI Questions generated successfully!");
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
  const hasQuestionsChanged = (previewingAutomation && originalQuestions) 
    ? JSON.stringify(previewingAutomation.generated_questions) !== JSON.stringify(originalQuestions)
    : true;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold transition-all duration-300 ${
            toast.type === "success" ? "bg-[#7C3AED] text-white" : "bg-red-500 text-white"
          }`}
        >
          <span className="material-symbols-rounded text-base">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {String(toast.msg)}
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0 shadow-sm shadow-[#7C3AED]/5">
              <span className="material-symbols-rounded text-[#7C3AED] text-2xl">psychology</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Assessment Automation</h1>
              <p className="text-slate-500 text-[13px] font-medium mt-1">
                Generate AI-powered assessments for candidates reaching specific hiring rounds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {canAccess("automation:moderate") && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-5 h-11 bg-[#7C3AED] text-white rounded-lg text-xs font-black hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7C3AED]/20 active:scale-95"
                >
                  <span className="material-symbols-rounded text-lg">add</span>
                  {"NEW AUTOMATION"}
                </button>
              )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Rules", value: automations.length, icon: "rule", color: "indigo" },
            { label: "Active Rules", value: automations.filter(a => a.is_enabled).length, icon: "bolt", color: "emerald" },
            { label: "Ready Assessments", value: automations.filter(a => a.generated_questions?.length).length, icon: "task_alt", color: "amber" },
            { label: "Auto-Move Rules", value: automations.filter(a => a.auto_move).length, icon: "double_arrow", color: "purple" }
          ].map((stat, i) => (
            <div key={i} className="group bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#7C3AED]/20 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                  stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  <span className="material-symbols-rounded text-xl">{stat.icon}</span>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
              </div>
              <p className="text-2xl font-black text-slate-900 mb-0.5 tracking-tight">{stat.value}</p>
              <p className="text-[11px] font-bold text-slate-400 capitalize">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Interaction Bar */}
        <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
           <div className="flex-1 relative w-full">
              <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text"
                placeholder="Search by topic, round name, or criteria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-lg pl-11 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
              />
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              {(searchQuery || selectedJobId) && (
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedJobId(""); }}
                  className="text-[11px] font-black text-[#7C3AED] hover:underline px-2 tracking-tight"
                >
                  RESET FILTERS
                </button>
              )}
              <div className="relative w-full md:w-64">
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">work</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-lg pl-10 pr-10 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">All Job Requirements</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
                <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
              </div>
           </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-lg bg-[#7C3AED]/5 flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-[#7C3AED] text-4xl">psychology</span>
          </div>
          <p className="text-slate-700 font-bold text-lg">{searchQuery ? 'No matching assessments' : 'No assessment automations yet'}</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            {searchQuery ? `We couldn't find any results for "${searchQuery}"` : 'Generate your first assessment automation using the "NEW AUTOMATION" button.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Configuration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job & Assessment Topic</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Readiness</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger/Schedule</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAutomations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-tight">
                            Round {a.stage_index}
                          </span>
                          {a.stage_name && (
                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">{a.stage_name}</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">
                          <span className="text-slate-400 font-medium italic mr-1">If:</span>
                          {a.criteria}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <span className="material-symbols-rounded text-sm text-slate-400">work</span>
                          {jobTitle(a.job_requirement_id)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#7C3AED] uppercase">
                          <span className="material-symbols-rounded text-sm">psychology</span>
                          {a.type}: {a.topic}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${a.generated_questions ? "text-emerald-500" : "text-amber-500"}`}>
                        <span className="material-symbols-rounded text-sm">{a.generated_questions ? "check_circle" : "warning"}</span>
                        {a.generated_questions ? `${a.generated_questions.length} QUESTIONS READY` : "NO QUESTIONS YET"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <span className="material-symbols-rounded text-sm text-slate-400">{a.is_immediate ? "flash_on" : "schedule"}</span>
                          {a.is_immediate ? "Immediate" : new Date(a.send_at!.endsWith('Z') ? a.send_at! : a.send_at! + 'Z').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        {a.auto_move && (
                          <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase">
                            <span className="material-symbols-rounded text-xs">double_arrow</span>
                            {"Auto-Move Active"}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={togglingId === a.id || !canAccess("automation:moderate")}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#7C3AED]" : "bg-slate-200"} ${togglingId === a.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canAccess("automation:moderate") && (
                          <button
                            onClick={() => handleGenerateQuestions(a.id)}
                            disabled={generatingId === a.id}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${a.generated_questions ? "bg-slate-50 text-slate-400 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]" : "bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white shadow-lg shadow-indigo-100"}`}
                            title={a.generated_questions ? "Regenerate AI Questions" : "Generate AI Questions"}
                          >
                            {generatingId === a.id ? (
                              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-rounded text-lg">auto_awesome</span>
                            )}
                          </button>
                        )}
                        {a.generated_questions && (
                          <button
                            onClick={() => {
                              setPreviewingAutomation(a);
                              setOriginalQuestions(a.generated_questions);
                            }}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm shadow-emerald-100"
                            title="Preview Questions"
                          >
                            <span className="material-symbols-rounded text-lg">visibility</span>
                          </button>
                        )}
                        <button onClick={() => openEdit(a)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                          <span className="material-symbols-rounded text-lg">edit</span>
                        </button>
                        <button onClick={() => { setAutomationToDelete(a); setIsDeleteModalOpen(true); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all">
                          <span className="material-symbols-rounded text-lg">delete</span>
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeModal}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { closeModal(); } }}
          />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                  <span className="material-symbols-rounded text-[#7C3AED] text-2xl">psychology</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingId ? "Edit Automation" : "Create Automation"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400  ">Configure AI Assessment</p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>

            <div className="flex border-b border-slate-100 bg-white px-6">
              <button 
                onClick={() => setActiveTab('config')} 
                className={`px-6 py-3 text-[10px] font-black   transition-all border-b-2 ${activeTab === 'config' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                1. Configuration
              </button>
              <button 
                onClick={() => setActiveTab('questions')} 
                className={`px-6 py-3 text-[10px] font-black   transition-all border-b-2 ${activeTab === 'questions' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                2. Questions {form.generated_questions?.length ? `(${form.generated_questions.length})` : ''}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
              {activeTab === 'config' ? (
                <div className="p-8 space-y-6 max-w-xl mx-auto">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="assessment-target-job" className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Target Job <span className="text-red-400">*</span></label>
                        <select
                          id="assessment-target-job"
                          value={form.job_requirement_id}
                          onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value }))}
                          className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all cursor-pointer"
                        >
                          <option value="">Select a job...</option>
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="assessment-hiring-round" className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Hiring Round <span className="text-red-400">*</span></label>
                        {jobRounds.length > 0 ? (
                          <select
                            id="assessment-hiring-round"
                            onChange={handleRoundSelect}
                            defaultValue={editingId ? `${form.stage_index}|${form.stage_name || ''}` : ""}
                            className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all cursor-pointer"
                          >
                            <option value="">Pick a round...</option>
                            {jobRounds.map((r, i) => (
                              <option key={i} value={`${i + 1}|${r.name}`}>Round {i + 1} — {r.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <input id="assessment-hiring-round" type="number" min={1} value={form.stage_index} onChange={(e) => setForm((f) => ({ ...f, stage_index: Number(e.target.value) }))} placeholder="Index" className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm font-bold" />
                            <input type="text" value={form.stage_name} onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))} placeholder="Name" className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm font-bold" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#7C3AED]/5 rounded-lg p-5 space-y-4 border border-[#7C3AED]/10 mb-4">
                      <div>
                        <label htmlFor="assessment-template-select" className="block text-[10px] font-black text-[#7C3AED]   mb-1.5 ml-1">Use Assessment Template (Optional)</label>
                        <select
                          id="assessment-template-select"
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
                            }
                          }}
                          className="w-full bg-white border-none rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm transition-all cursor-pointer"
                        >
                          <option value="">-- Custom Assessment Configuration --</option>
                          {assessmentTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.type} - {t.topic})</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1 ">Selecting a template will auto-fill the assessment configuration and questions.</p>
                      </div>
                    </div>

                    <div className="bg-[#7C3AED]/5 rounded-lg p-5 space-y-4 border border-[#7C3AED]/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="assessment-type" className="block text-[10px] font-black text-[#7C3AED]   mb-1.5 ml-1">Type <span className="text-red-400">*</span></label>
                          <select
                            id="assessment-type"
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AssessmentType }))}
                            className="w-full bg-white border-none rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                          >
                            {Object.values(AssessmentType).map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="assessment-topic" className="block text-[10px] font-black text-[#7C3AED]   mb-1.5 ml-1">Topic <span className="text-red-400">*</span></label>
                          <input
                            id="assessment-topic"
                            type="text"
                            value={form.topic}
                            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                            className="w-full bg-white border-none rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                            placeholder="e.g. SQL, Python..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="assessment-question-count" className="block text-[10px] font-black text-[#7C3AED]   mb-1.5 ml-1">Questions <span className="text-red-400">*</span></label>
                          <input
                            id="assessment-question-count"
                            type="number"
                            min={1}
                            max={50}
                            value={form.question_count}
                            onChange={(e) => setForm((f) => ({ ...f, question_count: Number(e.target.value) }))}
                            className="w-full bg-white border-none rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="assessment-test-duration" className="block text-[10px] font-black text-[#7C3AED]   mb-1.5 ml-1">Time (min) <span className="text-red-400">*</span></label>
                          <input
                            id="assessment-test-duration"
                            type="number"
                            min={5}
                            value={form.test_duration}
                            onChange={(e) => setForm((f) => ({ ...f, test_duration: Number(e.target.value) }))}
                            className="w-full bg-white border-none rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="assessment-criteria" className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Trigger Criteria <span className="text-red-400">*</span></label>
                        <textarea
                          id="assessment-criteria"
                          rows={2}
                          value={form.criteria} 
                          onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))} 
                          className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C3AED]/20 resize-none h-20" 
                          placeholder="e.g. 'Match score > 80' or 'Background includes React'..." 
                        />
                      </div>

                      <div>
                        <label htmlFor="assessment-email-template" className="block text-[10px] font-black text-slate-400   mb-1.5 ml-1">Email Template <span className="text-red-400">*</span></label>
                        <select
                          id="assessment-email-template"
                          value={form.email_template_id}
                          onChange={(e) => setForm((f) => ({ ...f, email_template_id: e.target.value }))}
                          className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 appearance-none cursor-pointer ${!form.email_template_id ? 'border-amber-200' : 'border-none'}`}
                        >
                          <option value="">Select Email Template...</option>
                          {emailTemplates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                            <span className={`material-symbols-rounded text-lg ${form.is_enabled ? "text-[#7C3AED]" : "text-slate-400"}`}>
                              {form.is_enabled ? "check_circle" : "pause_circle"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800  ">Active</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_enabled ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                            <span className={`material-symbols-rounded text-lg ${form.auto_move ? "text-[#7C3AED]" : "text-slate-400"}`}>
                              double_arrow
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800  ">Auto-Move</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.auto_move ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-rounded text-slate-400 text-lg">schedule</span>
                          <span className="text-sm font-black text-slate-700   text-[10px]">Scheduling</span>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button
                            onClick={() => setForm(f => ({ ...f, is_immediate: true }))}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black   transition-all ${
                              form.is_immediate ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            Immediate
                          </button>
                          <button
                            onClick={() => setForm(f => ({ ...f, is_immediate: false }))}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black   transition-all ${
                              !form.is_immediate ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            Scheduled
                          </button>
                        </div>
                      </div>

                      {!form.is_immediate && (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label htmlFor="assessment-send-at" className="block text-[10px] font-black text-amber-600   mb-1.5 ml-1">Send At (Date & Time)</label>
                          <input
                            id="assessment-send-at"
                            type="datetime-local"
                            value={form.send_at}
                            onChange={(e) => setForm(f => ({ ...f, send_at: e.target.value }))}
                            className="w-full bg-white border-none rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-200 shadow-sm"
                          />
                          <p className="mt-2 text-[10px] text-amber-500 font-medium leading-relaxed">
                            The assessment invitation will be queued and sent at the specified time if the criteria are met.
                          </p>
                        </div>
                      )}

                      <div className="pt-4 mt-6 border-t border-slate-100">
                        <button
                          onClick={handleGeneratePreview}
                          disabled={saving || !form.job_requirement_id || !form.topic}
                          className="w-full py-4 bg-[#7C3AED] text-white rounded-lg text-[10px] font-black   hover:bg-[#6d28d9] shadow-xl shadow-[#7C3AED]/20 active:scale-95 transition-all flex items-center justify-center gap-3 border border-[#7C3AED]/20 disabled:opacity-50"
                        >
                          {saving ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-rounded text-xl">auto_awesome</span>
                          )}
                          {form.generated_questions?.length ? "Regenerate Draft with AI" : "Draft Questions with AI"}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-3 text-center font-bold   opacity-60">Step 1: Configure & Draft</p>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="p-8 space-y-8 max-w-3xl mx-auto">
                   <div className="flex items-center justify-between mb-2">
                       <div>
                         <h3 className="text-sm font-black text-slate-900  ">Assessment Preview</h3>
                         <p className="text-[10px] font-bold text-slate-400  ">Review and edit the AI-generated questions</p>
                       </div>
                       <button 
                         onClick={handleAddQuestion}
                         className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black   text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
                       >
                         <span className="material-symbols-rounded text-sm">add</span>
                         {"Add Question"}
                       </button>
                    </div>

                    {form.generated_questions && form.generated_questions.length > 0 ? (
                      <div className="space-y-6">
                        {form.generated_questions.map((q: Question, idx: number) => (
                          <div key={q.id} className="bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#7C3AED] text-white rounded-lg flex items-center justify-center font-black  shadow-lg">#{idx + 1}</div>
                            
                            <button 
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white"
                            >
                              <span className="material-symbols-rounded text-base">delete</span>
                            </button>

                            <div className="space-y-4">
                              {q.type === 'APTITUDE' ? (
                                <>
                                  <div>
                                    <label htmlFor={`cfg-q-question-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block ml-1">Question Text (Aptitude)</label>
                                    <textarea
                                      id={`cfg-q-question-${q.id}`}
                                      value={q.question}
                                      onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-20 resize-none"
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
                                          className={`w-full bg-slate-50 border-2 rounded-lg pl-12 pr-4 py-3 text-xs font-bold transition-all ${q.correct_answer === opt ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]" : "border-transparent text-slate-600"}`}
                                        />
                                        <button 
                                          onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                          className={`absolute left-3 top-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300"}`}
                                        >
                                          <span className="material-symbols-rounded text-sm">{q.correct_answer === opt ? "check" : "circle"}</span>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <label htmlFor={`cfg-q-title-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block ml-1">Problem Title</label>
                                    <input
                                      id={`cfg-q-title-${q.id}`}
                                      type="text"
                                      value={q.title}
                                      onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-sm font-black text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`cfg-q-description-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block ml-1">Problem Description</label>
                                    <textarea
                                      id={`cfg-q-description-${q.id}`}
                                      value={q.description}
                                      onChange={(e) => handleUpdateQuestion(q.id, "description", e.target.value)}
                                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-32 resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`cfg-q-statement-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block ml-1">Problem Statement</label>
                                    <textarea
                                      id={`cfg-q-statement-${q.id}`}
                                      value={q.problem_statement}
                                      onChange={(e) => handleUpdateQuestion(q.id, "problem_statement", e.target.value)}
                                      className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-xs font-mono text-slate-700 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-32 resize-none"
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
                        <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center mb-6 shadow-sm">
                          <span className="material-symbols-rounded text-slate-300 text-4xl">visibility_off</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-400  ">No Preview Yet</h3>
                        <p className="max-w-[240px] text-[10px] font-bold text-slate-300   leading-relaxed mt-2">
                          Click &quot;Generate AI Questions&quot; in the configuration tab to see AI-generated questions here.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="px-6 py-6 border-t border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={closeModal} 
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-black   text-slate-400 hover:bg-slate-50 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                {editingId ? (
                  <button
                    onClick={handleUpdate}
                    disabled={saving || !hasFormChanged}
                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] text-white rounded-lg text-sm font-black   hover:bg-[#6d28d9] shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-rounded text-base">save</span>}
                    Save Changes
                  </button>
                ) : form.generated_questions ? (
                  <button
                    onClick={handleFinalCreate}
                    disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] text-white rounded-lg text-sm font-black   hover:bg-[#6d28d9] shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-rounded text-base">rocket_launch</span>}
                    Confirm & Create
                  </button>
                ) : (
                  <button
                    onClick={handleGeneratePreview}
                    disabled={saving || !form.job_requirement_id || !form.topic || !form.email_template_id}
                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] text-white rounded-lg text-sm font-black   hover:bg-[#6d28d9] shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-rounded text-base">auto_awesome</span>}
                    Generate Draft with AI
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Question Editor Modal ────────────────────────────────────────── */}
      {previewingAutomation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Close preview"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setPreviewingAutomation(null)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setPreviewingAutomation(null); } }}
          />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                  <span className="material-symbols-rounded text-[#7C3AED] text-2xl">visibility</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Preview & Edit Questions</h2>
                  <p className="text-[10px] font-bold text-slate-400  ">{previewingAutomation.topic} • {previewingAutomation.type}</p>
                </div>
              </div>
              <button onClick={() => { setPreviewingAutomation(null); setOriginalQuestions(null); }} className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto pr-4 custom-scrollbar flex-1 bg-slate-50/30">
              {(previewingAutomation.generated_questions || []).map((q: Question, idx: number) => (
                <div key={q.id} className="bg-white border border-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-all relative group">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#7C3AED] text-white rounded-lg flex items-center justify-center font-black  shadow-lg">#{idx + 1}</div>
                  
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                    <span className="material-symbols-rounded text-base">delete</span>
                  </button>

                  <div className="space-y-4">
                    {q.type === 'APTITUDE' ? (
                      <>
                        <div>
                          <label htmlFor={`prev-q-question-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block">Question Text (Aptitude)</label>
                          <textarea
                            id={`prev-q-question-${q.id}`}
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-20 resize-none"
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
                                className={`w-full bg-slate-50 border-2 rounded-lg pl-12 pr-4 py-3 text-xs font-bold transition-all ${q.correct_answer === opt ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]" : "border-transparent text-slate-600"}`}
                              />
                              <button 
                                onClick={() => handleUpdateQuestion(q.id, "correct_answer", opt)}
                                className={`absolute left-3 top-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300"}`}
                              >
                                <span className="material-symbols-rounded text-sm">{q.correct_answer === opt ? "check" : "circle"}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label htmlFor={`prev-q-title-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block">Problem Title</label>
                          <input
                            id={`prev-q-title-${q.id}`}
                            type="text"
                            value={q.title}
                            onChange={(e) => handleUpdateQuestion(q.id, "title", e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-sm font-black text-slate-800 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor={`prev-q-statement-${q.id}`} className="text-[10px] font-black text-slate-400   mb-1.5 block">Problem Statement</label>
                          <textarea
                            id={`prev-q-statement-${q.id}`}
                            value={q.problem_statement}
                            onChange={(e) => handleUpdateQuestion(q.id, "problem_statement", e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-lg px-5 py-3 text-xs font-mono text-slate-700 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all h-40 resize-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <button 
                onClick={handleAddQuestion}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 font-bold hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-rounded">add_circle</span>
                {"Add Manual Question"}
              </button>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <p className="text-[10px] font-black text-slate-400  ">
                {(previewingAutomation.generated_questions || []).length} Total Questions
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setPreviewingAutomation(null);
                    setIsPreviewingNew(false);
                    setOriginalQuestions(null);
                  }} 
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Discard
                </button>
                <button 
                   onClick={isPreviewingNew ? handleFinalCreate : handleSaveQuestions}
                   disabled={saving || (!isPreviewingNew && !hasQuestionsChanged)}
                   className="px-8 py-2.5 bg-[#7C3AED] text-white rounded-lg text-sm font-black   hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7C3AED]/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-rounded text-base">{isPreviewingNew ? "rocket_launch" : "cloud_done"}</span>}
                  {isPreviewingNew ? "Confirm & Create Automation" : "Save Question Set"}
                </button>
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
    </div>
  );
}
