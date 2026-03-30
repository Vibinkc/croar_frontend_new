"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import TemplateBuilder from "./TemplateBuilder";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

interface Template {
  id: string;
  name: string;
  subject: string;
}

interface Automation {
  id: string;
  job_requirement_id: string;
  stage_index: number;
  stage_name: string | null;
  criteria: string;
  email_template_id: string | null;
  auto_move: boolean;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
  duration: number;
  daily_limit: number;
  interviewer_email: string | null;
  time_slots: string[] | null;
  start_date: string | null;
  end_date: string | null;
  google_meet_link: string | null;
  created_at: string;
}

interface FormState {
  job_requirement_id: string;
  stage_index: number | string;
  stage_name: string;
  criteria: string;
  email_template_id: string;
  auto_move: boolean;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
  duration: number | string;
  daily_limit: number | string;
  interviewer_email: string;
  time_slots: string[];
  start_date: string | null;
  end_date: string | null;
  google_meet_link: string;
  interview_type: "GMEET" | "AI";
  interview_template_id: string | null;
}

const EMPTY_FORM: FormState = {
  job_requirement_id: "",
  stage_index: 0,
  stage_name: "",
  criteria: "",
  email_template_id: "",
  auto_move: false,
  is_enabled: true,
  start_time: "09:00",
  end_time: "17:00",
  duration: 30,
  daily_limit: 5,
  interviewer_email: "",
  time_slots: [] as string[],
  start_date: "",
  end_date: "",
  google_meet_link: "",
  interview_type: "GMEET" as "GMEET" | "AI",
  interview_template_id: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewAutomationPage() {
  const { token } = useAuth();

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [interviewTemplates, setInterviewTemplates] = useState<any[]>([]);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  const [activeTab, setActiveTab] = useState<"config" | "times">("config");

  const showToast = (msg: any, type: "success" | "error" = "success") => {
    let finalMsg = "";
    if (typeof msg === "string") {
      finalMsg = msg;
    } else if (Array.isArray(msg)) {
      finalMsg = msg.map((e: any) => e.msg || (typeof e === 'string' ? e : JSON.stringify(e))).join(", ");
    } else if (msg && typeof msg === "object") {
      finalMsg = msg.msg || msg.detail || JSON.stringify(msg);
    } else {
      finalMsg = String(msg || "An error occurred");
    }
    setToast({ msg: finalMsg, type });
    setTimeout(() => setToast(null), 5000); // Increased duration for complex errors
  };

  // Fetch jobs & templates on mount (wait for token)
  useEffect(() => {
    if (!token) return;
    const fetchMeta = async () => {
      try {
        const [jRes, tRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, { headers: authHeaders }),
          fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, { headers: authHeaders }),
        ]);
        const jData = jRes.ok ? await jRes.json() : [];
        const tData = tRes.ok ? await tRes.json() : [];
        setJobs(Array.isArray(jData) ? jData : []);
        setTemplates(Array.isArray(tData) ? tData : []);
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    };
    fetchMeta();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Fetch automations when job selection changes
  const fetchAutomations = useCallback(async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = jobId ? `?job_id=${jobId}` : "";
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-automation${qs}`, {
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

  const fetchInterviewTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching interview templates:", error);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  useEffect(() => {
    if (token) {
      fetchInterviewTemplates();
    }
  }, [token, fetchInterviewTemplates]);

  useEffect(() => {
    if (token) {
      fetchAutomations(selectedJobId || undefined);
    }
  }, [token, selectedJobId, fetchAutomations]);

  // Rounds extracted from the selected job's workflow_stages
  const selectedJob = jobs.find((j) => j.id === form.job_requirement_id);
  const jobRounds: WorkflowStage[] = selectedJob?.workflow_stages ?? [];

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, job_requirement_id: selectedJobId });
    setActiveTab("config");
    setShowModal(true);
  };

  const openEdit = (a: Automation) => {
    setEditingId(a.id);
    setForm({
      job_requirement_id: a.job_requirement_id,
      stage_index: a.stage_index,
      stage_name: a.stage_name ?? "",
      criteria: a.criteria,
      email_template_id: a.email_template_id ?? "",
      auto_move: a.auto_move,
      is_enabled: a.is_enabled,
      start_time: a.start_time,
      end_time: a.end_time,
      duration: a.duration ?? 30,
      daily_limit: a.daily_limit,
      interviewer_email: a.interviewer_email ?? "",
      time_slots: a.time_slots ?? [],
      start_date: a.start_date ?? "",
      end_date: a.end_date ?? "",
      google_meet_link: a.google_meet_link ?? "",
      interview_type: (a as any).interview_type || "GMEET",
      interview_template_id: (a as any).interview_template_id || "",
    });
    setActiveTab("config");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setActiveTab("config");
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.job_requirement_id || !form.criteria.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      let finalTimeSlots = form.time_slots;
      
      // Auto-generate slots if empty before saving
      if (finalTimeSlots.length === 0) {
        const limit = Number(form.daily_limit);
        if (limit > 0) {
          const [sh, sm] = form.start_time.split(":").map(Number);
          const [eh, em] = form.end_time.split(":").map(Number);
          const startMins = sh * 60 + sm;
          const endMins = eh * 60 + em;
          const interval = Number(form.duration) || 30;
          
          if (startMins < endMins) {
            let generated: string[] = [];
            for (let i = 0; i < limit; i++) {
                const slotMins = startMins + i * interval;
                if (slotMins + interval > endMins) break;
                const h = Math.floor(slotMins / 60).toString().padStart(2, "0");
                const m = (slotMins % 60).toString().padStart(2, "0");
                generated.push(`${h}:${m}`);
            }
            finalTimeSlots = generated;
          }
        }
      }

      const payload = {
        ...form,
        stage_index: Number(form.stage_index),
        stage_name: form.stage_name.trim() || null,
        email_template_id: form.email_template_id || null,
        duration: Number(form.duration) || 30,
        daily_limit: Number(form.daily_limit),
        interviewer_email: form.interviewer_email?.trim() || null,
        google_meet_link: form.google_meet_link?.trim() || null,
        time_slots: finalTimeSlots.length > 0 ? finalTimeSlots : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        interview_type: form.interview_type,
        interview_template_id: form.interview_type === "AI" ? form.interview_template_id : null,
      };
      const url = editingId
        ? `${BACKEND_URL}/api/v1/enterprise/interview-automation/${editingId}`
        : `${BACKEND_URL}/api/v1/enterprise/interview-automation/`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingId ? "Automation updated!" : "Automation created!");
        closeModal();
        fetchAutomations(selectedJobId || undefined);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast((err as any)?.detail || "Failed to save automation.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle ───────────────────────────────────────────────────────────────────

  const handleToggle = async (a: Automation) => {
    setTogglingId(a.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-automation/${a.id}`, {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-automation/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        showToast("Automation deleted.");
        setAutomations((prev) => prev.filter((a) => a.id !== id));
      } else {
        showToast("Failed to delete.", "error");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "—";
  const templateName = (id: string) => templates.find((t) => t.id === id)?.name ?? "—";

  // ── When user picks a round from dropdown, auto-fill stage_index + stage_name
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

  const handleGenerateTimeSlots = () => {
    const limit = Number(form.daily_limit);
    if (!limit || limit <= 0) return;
    
    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    
    if (startMins >= endMins) {
      showToast("End time must be after start time", "error");
      return;
    }
    
    const interval = Number(form.duration) || 30;
    
    let slots: string[] = [];
    for (let i = 0; i < limit; i++) {
        const slotMins = startMins + i * interval;
        if (slotMins + interval > endMins) break;
        const h = Math.floor(slotMins / 60).toString().padStart(2, "0");
        const m = (slotMins % 60).toString().padStart(2, "0");
        slots.push(`${h}:${m}`);
    }
    
    setForm(f => ({ ...f, time_slots: slots }));
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
            <span className="material-symbols-rounded text-[#7C3AED] text-xl">event_available</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Interview Automation</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">
          Automatically schedule AI or human technical interviews based on your hiring criteria.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <span className="material-symbols-rounded text-slate-400 text-lg">work</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-bold hover:bg-[#6d28d9] transition-colors shadow-md shadow-[#7C3AED]/20"
        >
          <span className="material-symbols-rounded text-base">add</span>
          New Automation
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/5 flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-[#7C3AED] text-4xl">event_available</span>
          </div>
          <p className="text-slate-700 font-bold text-lg">No automations yet</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            Create your first interview automation to auto-schedule interviews.
          </p>
          <button
            onClick={openCreate}
            className="mt-5 flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-bold hover:bg-[#6d28d9] transition-colors"
          >
            <span className="material-symbols-rounded text-base">add</span>
            Create Automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 ${
                a.is_enabled ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${a.is_enabled ? "bg-[#7C3AED]/10" : "bg-slate-100"}`}>
                  <span className={`material-symbols-rounded text-xl ${a.is_enabled ? "text-[#7C3AED]" : "text-slate-400"}`}>event_upcoming</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Round {a.stage_index}{a.stage_name ? ` · ${a.stage_name}` : ""}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${a.is_enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.is_enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {a.is_enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    <span className="text-slate-400 font-medium">If: </span>{a.criteria}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span className="material-symbols-rounded text-xs">work</span>
                      {jobTitle(a.job_requirement_id)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span className="material-symbols-rounded text-xs">schedule</span>
                      {a.start_date && a.end_date 
                        ? `${a.start_date} to ${a.end_date}`
                        : a.start_date ? `From ${a.start_date}`
                        : a.end_date ? `Until ${a.end_date}`
                        : "Any date"} 
                      {" | "}{a.start_time} - {a.end_time} ({a.duration}m | {a.daily_limit} caps)
                    </span>
                    {a.auto_move && (
                      <span className="flex items-center gap-1 text-[11px] text-[#7C3AED] font-bold bg-[#7C3AED]/5 px-2 py-0.5 rounded-lg border border-[#7C3AED]/10">
                        <span className="material-symbols-rounded text-xs">keyboard_double_arrow_right</span>
                        Auto-Move
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(a)}
                  disabled={togglingId === a.id}
                  title={a.is_enabled ? "Disable" : "Enable"}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#7C3AED]" : "bg-slate-200"} ${togglingId === a.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                {/* Edit */}
                <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#7C3AED] transition-colors" title="Edit">
                  <span className="material-symbols-rounded text-base">edit</span>
                </button>
                {/* Delete */}
                <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40" title="Delete">
                  {deletingId === a.id ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-rounded text-base">delete</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Side Panel (Drawer) ───────────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={closeModal} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showModal ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
                <span className="material-symbols-rounded text-[#7C3AED] text-xl">event_available</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 leading-tight">
                  {editingId ? "Edit Automation" : "New Automation"}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Interview Configuration</p>
              </div>
            </div>
            <button onClick={closeModal} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <span className="material-symbols-rounded text-xl">close</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100 shrink-0">
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors ${
                activeTab === "config" ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Config
              {activeTab === "config" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#7C3AED]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("times")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors ${
                activeTab === "times" ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Time Slots
              {activeTab === "times" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#7C3AED]" />
              )}
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
            {activeTab === "config" ? (
             <div className="space-y-6">
            {/* Job */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Job Requirement <span className="text-red-400">*</span>
              </label>
              <select
                value={form.job_requirement_id}
                onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 1, stage_name: "" }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
              >
                <option value="">Select job…</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            {/* Round */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Hiring Round <span className="text-red-400">*</span>
              </label>
              {jobRounds.length > 0 ? (
                <select
                  onChange={handleRoundSelect}
                  defaultValue=""
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                >
                  <option value="">Pick round…</option>
                  {jobRounds.map((r, i) => (
                    <option key={i} value={`${i + 1}|${r.name}`}>
                      Round {i + 1}: {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  <input
                    type="number"
                    min={1}
                    value={form.stage_index}
                    onChange={(e) => setForm((f) => ({ ...f, stage_index: e.target.value }))}
                    className="col-span-2 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    placeholder="No."
                  />
                  <input
                    type="text"
                    value={form.stage_name}
                    onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))}
                    className="col-span-3 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    placeholder="Label"
                  />
                </div>
              )}
              {jobRounds.length > 0 && (form.stage_name || Number(form.stage_index) > 1) && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/5 rounded-lg border border-[#7C3AED]/10">
                  <span className="material-symbols-rounded text-xs text-[#7C3AED]">check_circle</span>
                  <p className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-tight">
                    Selected: Round {form.stage_index} — {form.stage_name}
                  </p>
                </div>
              )}
            </div>

            {/* Criteria */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Trigger Criteria <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={form.criteria}
                onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all resize-none"
                placeholder="Describe the condition, e.g. 'AI score > 80' or 'Interview cleared'…"
              />
              <p className="text-[10px] text-slate-400 mt-2 px-1">
                Set conditions for when this interview should be scheduled.
              </p>
            </div>

            {/* Dates (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.start_date || ""}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.end_date || ""}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            {/* Timings and Caps */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  End Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Duration <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                  <option value="90">90 mins</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Daily Limit (Max Interviews/Day) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.daily_limit}
                onChange={(e) => setForm((f) => ({ ...f, daily_limit: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
              />
            </div>

            {/* Template (Optional) */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Email Template (Optional)
              </label>
              {templates.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 text-center">
                    No templates found. <a href="/enterprise/settings/templates" className="text-[#7C3AED] font-bold hover:underline" target="_blank">Create one</a> first.
                  </p>
                </div>
              ) : (
                <select
                  value={form.email_template_id}
                  onChange={(e) => setForm((f) => ({ ...f, email_template_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                >
                  <option value="">No template (use default invite)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Interview Type Selection */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
                Interview Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, interview_type: "GMEET" }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    form.interview_type === "GMEET" 
                      ? "border-[#7C3AED] bg-[#7C3AED]/5" 
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <span className={`material-symbols-rounded ${form.interview_type === "GMEET" ? "text-[#7C3AED]" : "text-slate-400"}`}>videocam</span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${form.interview_type === "GMEET" ? "text-[#7C3AED]" : "text-slate-500"}`}>Google Meet</span>
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, interview_type: "AI" }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    form.interview_type === "AI" 
                      ? "border-[#7C3AED] bg-[#7C3AED]/5" 
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <span className={`material-symbols-rounded ${form.interview_type === "AI" ? "text-[#7C3AED]" : "text-slate-400"}`}>psychology</span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${form.interview_type === "AI" ? "text-[#7C3AED]" : "text-slate-500"}`}>AI Interview</span>
                </button>
              </div>
            </div>

            {form.interview_type === "AI" ? (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      AI Interview Template <span className="text-red-400">*</span>
                    </label>
                    <button 
                      onClick={() => {
                        setSelectedTemplateForEdit(null);
                        setShowTemplateBuilder(true);
                      }}
                      className="text-[10px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-rounded text-xs">add_circle</span>
                      Create New
                    </button>
                  </div>
                  {interviewTemplates.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 text-center">
                        No AI templates found. 
                      </p>
                    </div>
                  ) : (
                    <select
                      value={form.interview_template_id || ""}
                      onChange={(e) => setForm(f => ({ ...f, interview_template_id: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    >
                      <option value="">Select template…</option>
                      {interviewTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Interviewer Email */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Interviewer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.interviewer_email}
                    onChange={(e) => setForm((f) => ({ ...f, interviewer_email: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    placeholder="e.g. recruiter@company.com"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 px-1">
                    If blank, system sends to your account email.
                  </p>
                </div>

                {/* Google Meet Link */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Personal Google Meet Link (Real Room)
                  </label>
                  <input
                    type="url"
                    value={form.google_meet_link}
                    onChange={(e) => setForm((f) => ({ ...f, google_meet_link: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 px-1">
                    Paste your own real link here to skip automated generation.
                  </p>
                </div>
              </div>
            )}

            {/* Toggles Group */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <span className="material-symbols-rounded text-emerald-500 text-lg">check_circle</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Enable Automation</p>
                    <p className="text-[10px] text-slate-400 font-medium">Turn rules on/off</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_enabled ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <span className="material-symbols-rounded text-slate-600 text-lg">double_arrow</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Auto-Move</p>
                    <p className="text-[10px] text-slate-400 font-medium">Advance to next round</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.auto_move ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>
          ) : (
            // TIME SLOTS TAB
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-800 mb-1">Pre-Generated Time Slots</p>
                <p className="text-xs text-slate-500 mb-4">
                  Instead of automatic scheduling, explicitly define exactly which {form.daily_limit} times per day the scheduler should use.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateTimeSlots}
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white border border-[#7C3AED] text-[#7C3AED] rounded-xl text-sm font-bold hover:bg-[#7C3AED]/5 transition-colors"
                  >
                    <span className="material-symbols-rounded text-base">magic_button</span>
                    Auto-Generate ({form.daily_limit} slots)
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, time_slots: [...f.time_slots, "12:00"] }))}
                    className="w-10 h-10 flex border border-slate-200 items-center justify-center rounded-xl hover:bg-slate-200 text-slate-400 transition-colors"
                    title="Add Slot manually"
                  >
                    <span className="material-symbols-rounded text-lg text-slate-600">add</span>
                  </button>
                </div>
              </div>

              {form.time_slots.length > 0 && (
                <div className="space-y-2">
                  {form.time_slots.map((ts, idx) => (
                    <div key={idx} className="flex flex-col mb-4">
                      <div className="flex items-center gap-2 relative">
                        <span className="absolute left-3 text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none pt-0.5 pointer-events-none">
                          Slot {idx + 1}
                        </span>
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 focus-within:ring-2 focus-within:ring-[#7C3AED]/50 transition-all">
                          <input
                            type="time"
                            value={ts}
                            onChange={(e) => {
                              const newSlots = [...form.time_slots];
                              newSlots[idx] = e.target.value;
                              setForm((f) => ({ ...f, time_slots: newSlots }));
                            }}
                            className="w-full bg-transparent pl-12 pr-2 py-3 text-sm font-bold text-slate-700 focus:outline-none font-mono"
                          />
                          <span className="text-xs text-slate-400 font-medium px-2 shrink-0 border-l border-slate-200 flex items-center h-8">
                            End: {(() => {
                               const [h, m] = ts.split(':').map(Number);
                               if (isNaN(h)) return "--:--";
                               const total = h * 60 + m + (Number(form.duration) || 30);
                               const eh = Math.floor(total / 60).toString().padStart(2, '0');
                               const em = (total % 60).toString().padStart(2, '0');
                               return `${eh}:${em}`;
                            })()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const newSlots = form.time_slots.filter((_, i) => i !== idx);
                            setForm((f) => ({ ...f, time_slots: newSlots }));
                          }}
                          className="w-11 h-11 shrink-0 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border border-red-100"
                        >
                          <span className="material-symbols-rounded text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 h-12 bg-[#7C3AED] text-white rounded-xl text-sm font-black hover:bg-[#6d28d9] transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-[#7C3AED]/20"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-rounded text-lg">save</span>
                  {editingId ? "SAVE CHANGES" : "CREATE AUTOMATION"}
                </>
              )}
            </button>
            <button 
              onClick={closeModal}
              className="w-full mt-3 h-10 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Template Builder Modal */}
      <AnimatePresence>
        {showTemplateBuilder && (
          <TemplateBuilder
            backendUrl={BACKEND_URL}
            token={token || ""}
            initialData={selectedTemplateForEdit}
            onClose={() => {
              setShowTemplateBuilder(false);
              setSelectedTemplateForEdit(null);
            }}
            onSave={(newTemplate) => {
              fetchInterviewTemplates();
              setShowTemplateBuilder(false);
              setSelectedTemplateForEdit(null);
              setForm(f => ({ ...f, interview_template_id: newTemplate.id }));
              showToast("Interview template saved!");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
