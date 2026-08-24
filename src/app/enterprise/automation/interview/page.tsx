"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { BACKEND_URL } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import TemplateBuilder from "./TemplateBuilder";
import { PageHelp } from "@/components/ds";
import {
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  Briefcase, 
  ChevronDown, 
  X, 
  Search, 
  Video, 
  Brain, 
  PlusCircle, 
  Check, 
  Wand2, 
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";

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

interface TemplateQuestion {
  id: string;
  question: string;
  type: string;
  expected_answer_points: string[];
  difficulty: string;
}

interface InterviewTemplate {
  id?: string;
  title: string;
  topic: string;
  duration: number;
  difficulty: string;
  require_video: boolean;
  plan: {
    questions: TemplateQuestion[];
  };
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
  interview_type: "GMEET" | "AI" | "TEAMS";
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
  interview_type: "GMEET" as "GMEET" | "AI" | "TEAMS",
  interview_template_id: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewAutomationPage() {
  const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);
  const [interviewTemplates, setInterviewTemplates] = useState<InterviewTemplate[]>([]);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<InterviewTemplate | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  const [activeTab, setActiveTab] = useState<"config" | "times">("config");

  const showToast = (msg: string | string[] | { msg?: string; detail?: string } | null, type: "success" | "error" = "success") => {
    let finalMsg = "";
    if (typeof msg === "string") {
      finalMsg = msg;
    } else if (Array.isArray(msg)) {
      finalMsg = msg.map((e: string | { msg?: string }) => (typeof e === 'string' ? e : (e.msg || JSON.stringify(e)))).join(", ");
    } else if (msg && typeof msg === "object") {
      const obj = msg as { msg?: string; detail?: string };
      finalMsg = obj.msg || obj.detail || JSON.stringify(msg);
    } else {
      finalMsg = String(msg || tr("automation.errorOccurred"));
    }
    setToast({ msg: finalMsg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch jobs & templates on mount
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
  }, [token, authHeaders]);

  // Fetch automations when job selection changes
  const fetchAutomations = useCallback(async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = jobId ? `?job_id=${jobId}` : "";
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-automation/${qs}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setAutomations(Array.isArray(data) ? data : []);
      } else {
        showToast(tr("automation.failedLoadAutomations"), "error");
      }
    } catch {
      showToast(tr("automation.failedLoadAutomations"), "error");
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

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
      interview_type: ((a as Automation & { interview_type?: string }).interview_type || "GMEET") as "GMEET" | "AI" | "TEAMS",
      interview_template_id: (a as Automation & { interview_template_id?: string }).interview_template_id || "",
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
      showToast(tr("automation.fillRequiredFields"), "error");
      return;
    }
    // Compare ISO date strings in LOCAL time. `new Date("YYYY-MM-DD")` parses as UTC midnight, which
    // in negative-offset zones is "yesterday" locally — so a valid "today" start date was wrongly
    // rejected. `toLocaleDateString("en-CA")` yields local YYYY-MM-DD; ISO strings compare chronologically.
    if (form.start_date && form.start_date < new Date().toLocaleDateString("en-CA")) {
      showToast(tr("automation.startDatePast"), "error");
      return;
    }
    // AI interviews need a template (marked required, but was only enforced by the backend).
    // (GMEET interviewer email is intentionally optional — it falls back to the account email.)
    if (form.interview_type === "AI" && !form.interview_template_id) {
      showToast(tr("automation.selectInterviewTemplate"), "error");
      return;
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      showToast(tr("automation.endBeforeStart"), "error");
      return;
    }
    // Authoritative slot-limit gate: slots can drift over the limit (e.g. the daily
    // limit was lowered after generating, or an older rule had more slots), so block
    // the save rather than persisting more slots than the limit allows.
    const dailyLimit = Number(form.daily_limit);
    if (dailyLimit > 0 && form.time_slots.length > dailyLimit) {
      const over = form.time_slots.length - dailyLimit;
      showToast(tr("automation.timeSlotsExceed", { count: form.time_slots.length, limit: dailyLimit, over }), "error");
      setActiveTab("times");
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
            const generated: string[] = [];
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
        job_requirement_id: form.job_requirement_id || null,
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
        interview_template_id: form.interview_type === "AI" ? (form.interview_template_id || null) : null,
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
        showToast(editingId ? tr("automation.automationUpdated") : tr("automation.automationCreated"));
        closeModal();
        fetchAutomations(selectedJobId || undefined);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast((err as { detail?: string })?.detail || tr("automation.failedSaveAutomation"), "error");
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
        showToast(tr("automation.failedUpdateStatus"), "error");
      }
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!automationToDelete) return;
    setDeletingId(automationToDelete.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-automation/${automationToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        showToast(tr("automation.automationDeleted"));
        setAutomations((prev) => prev.filter((a) => a.id !== automationToDelete.id));
      } else {
        showToast(tr("automation.failedDelete"), "error");
      }
    } finally {
      setDeletingId(null);
      setIsDeleteModalOpen(false);
      setAutomationToDelete(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "—";
  const templateName = (id: string) => templates.find((t) => t.id === id)?.name ?? "—";

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
    
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    
    if (startMins >= endMins) {
      showToast(tr("automation.endTimeAfterStart"), "error");
      return;
    }
    
    const interval = Number(form.duration) || 30;
    
    const slots: string[] = [];
    for (let i = 0; i < limit; i++) {
        const slotMins = startMins + i * interval;
        if (slotMins + interval > endMins) break;
        const h = Math.floor(slotMins / 60).toString().padStart(2, "0");
        const m = (slotMins % 60).toString().padStart(2, "0");
        slots.push(`${h}:${m}`);
    }
    
    setForm(f => ({ ...f, time_slots: slots }));
  };

  const filteredAutomations = automations.filter(a => {
    const term = searchQuery.toLowerCase();
    return a.criteria.toLowerCase().includes(term) ||
           jobTitle(a.job_requirement_id).toLowerCase().includes(term) ||
           (a.stage_name && a.stage_name.toLowerCase().includes(term)) ||
           (a.interviewer_email && a.interviewer_email.toLowerCase().includes(term));
  });

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-semibold transition-all duration-300 ${
            toast.type === "success" ? "bg-[#5B53E0] text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{String(toast.msg)}</span>
        </div>
      )}

      {/* Header (sticky) */}
      <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("automation.interviewTitle")}</h1>
            <PageHelp title={tr("automation.interviewTitle")}>
              <p>{tr("automation.interviewHelp")}</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("automation.interviewSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {canAccess("interviews:moderate") && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              {tr("automation.newAutomation")}
            </button>
          )}
        </div>
      </header>

      <div className="mb-10">

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: tr("automation.totalRules"), value: automations.length, Icon: Layers, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
            { label: tr("automation.activeRules"), value: automations.filter(a => a.is_enabled).length, Icon: Activity, grad: "linear-gradient(135deg,#00C49F,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
            { label: tr("automation.autoMoveRules"), value: automations.filter(a => a.auto_move).length, Icon: Sparkles, grad: "linear-gradient(135deg,#C084FC,#8B5CF6)", glow: "rgba(139,92,246,0.25)" },
            { label: tr("automation.configuredSlots"), value: automations.reduce((acc, a) => acc + (a.time_slots?.length || 0), 0), Icon: Clock, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" }
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

        {/* Interaction Bar */}
        <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
           <div className="flex-1 relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder={tr("automation.searchRulesJobsInterviewers")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] pl-10 pr-4 text-[13.5px] font-semibold text-slate-700 placeholder:text-slate-400 focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all outline-none shadow-sm"
              />
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              {(searchQuery || selectedJobId) && (
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedJobId(""); }}
                  className="text-[11px] font-extrabold text-[#5B53E0] hover:underline px-2 tracking-wider cursor-pointer"
                >
                  {tr("automation.resetFilters")}
                </button>
              )}
              <div className="relative w-full md:w-64">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full h-11 border border-[#E1E4E8] rounded-[12px] pl-10 pr-10 text-[13px] font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">{tr("automation.allJobRequirements")}</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
           </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#5B53E0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-[#E1E4E8] p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-[12px] bg-[#E3F4EF] flex items-center justify-center mb-4 border border-[#BFF0E2]">
            <Calendar className="w-8 h-8 text-[#0E8A6E]" />
          </div>
          <p className="text-slate-800 font-bold text-[16px]">{searchQuery ? tr("automation.noMatchingRules") : tr("automation.noAutomationsYet")}</p>
          <p className="text-slate-400 text-[13px] mt-1 max-w-sm font-medium">
            {searchQuery ? tr("automation.noResultsFor", { query: searchQuery }) : tr("automation.createFirstInterview")}
          </p>
          {!searchQuery && canAccess("interviews:moderate") && (
            <button
              onClick={openCreate}
              className="mt-5 px-5 h-11 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[13px] font-bold shadow-[0_4px_12px_rgba(91,83,224,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              {tr("automation.createAutomation")}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-[#E1E4E8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E1E4E8]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("automation.ruleConfiguration")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("automation.targetJob")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("automation.scheduleLogic")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{tr("automation.status")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] text-right">{tr("automation.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F1]">
                {filteredAutomations.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F7F8FA]/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#E3F4EF] text-[#0E8A6E] text-[10px] font-bold border border-[#BFF0E2]/60 uppercase">
                            {tr("automation.round")} {a.stage_index}
                          </span>
                          {a.stage_name && (
                            <span className="text-[12px] font-semibold text-[#8A929E]">{a.stage_name}</span>
                          )}
                        </div>
                        <p className="text-[13.5px] font-semibold text-[#374151] line-clamp-1">
                          <span className="text-[#8A929E] font-medium italic mr-1">{tr("automation.ifLabel")}</span>
                          {a.criteria}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#374151]">
                        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{jobTitle(a.job_requirement_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{a.start_time} - {a.end_time} ({a.duration}m)</span>
                        </div>
                        {a.auto_move && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-[#5B53E0] uppercase tracking-wider mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#ECEBFB] text-[#5B53E0] text-[10px] font-bold border border-[#DAD7F6]/60 uppercase tracking-wider">
                              {tr("automation.autoMove")}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={togglingId === a.id || !canAccess("interviews:moderate")}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#0E8A6E]" : "bg-[#E1E4E8]"} ${togglingId === a.id || !canAccess("interviews:moderate") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canAccess("interviews:moderate") && (
                          <button 
                            onClick={() => openEdit(a)} 
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-transparent hover:border-[#E1E4E8] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#5B53E0] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canAccess("interviews:moderate") && (
                          <button 
                            onClick={() => {
                              setAutomationToDelete(a);
                              setIsDeleteModalOpen(true);
                            }} 
                            disabled={deletingId === a.id} 
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-transparent hover:border-[#E1E4E8] hover:bg-rose-50 text-[#8A929E] hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Side Panel (Drawer) ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#15171C]/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-[#E1E4E8]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EAED] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#E3F4EF] flex items-center justify-center border border-[#BFF0E2] shadow-sm">
                    <Video className="w-5 h-5 text-[#0E8A6E]" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-[#15171C] leading-tight">
                      {editingId ? tr("automation.editAutomation") : tr("automation.newAutomation")}
                    </h2>
                    <p className="text-[12.5px] text-[#8A929E] font-medium mt-0.5">{tr("automation.interviewConfiguration")}</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-1.5 hover:bg-[#F4F5F7] text-[#9AA3AF] hover:text-[#4B5563] rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-[#E8EAED] shrink-0">
                <button
                  onClick={() => setActiveTab("config")}
                  className={`flex-1 py-3 text-[13px] font-bold relative transition-colors cursor-pointer ${
                    activeTab === "config" ? "text-[#5B53E0]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>{tr("automation.config")}</span>
                  {activeTab === "config" && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5B53E0]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("times")}
                  className={`flex-1 py-3 text-[13px] font-bold relative transition-colors cursor-pointer ${
                    activeTab === "times" ? "text-[#5B53E0]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>{tr("automation.timeSlots")}</span>
                  {activeTab === "times" && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5B53E0]" />
                  )}
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                {activeTab === "config" ? (
                  <div className="space-y-6">
                    {/* Job */}
                    <div>
                      <label htmlFor="automation-job-requirement" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                        {tr("automation.jobRequirement")} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="automation-job-requirement"
                          value={form.job_requirement_id}
                          onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 1, stage_name: "" }))}
                          className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                        >
                          <option value="">{tr("automation.selectJob")}</option>
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                      </div>
                    </div>

                    {/* Round */}
                    <div>
                      <label htmlFor="automation-hiring-round" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                        {tr("automation.hiringRound")} <span className="text-rose-500">*</span>
                      </label>
                      {jobRounds.length > 0 ? (
                        <div className="relative">
                          <select
                            id="automation-hiring-round"
                            onChange={handleRoundSelect}
                            value={form.stage_name ? `${form.stage_index}|${form.stage_name}` : ""}
                            className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                          >
                            <option value="">{tr("automation.pickRound")}</option>
                            {jobRounds.map((r, i) => (
                              <option key={i} value={`${i + 1}|${r.name}`}>
                                {tr("automation.round")} {i + 1}: {r.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-3">
                          <input
                            type="number"
                            min={1}
                            value={form.stage_index}
                            onChange={(e) => setForm((f) => ({ ...f, stage_index: e.target.value }))}
                            className="col-span-2 border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                            placeholder={tr("automation.noAbbrev")}
                          />
                          <input
                            type="text"
                            value={form.stage_name}
                            onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))}
                            className="col-span-3 border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                            placeholder={tr("automation.labelPlaceholder")}
                          />
                        </div>
                      )}
                      {jobRounds.length > 0 && (form.stage_name || Number(form.stage_index) > 1) && (
                        <div className="mt-2.5 flex items-center gap-2 px-3 py-2 bg-[#E3F4EF]/50 rounded-[8px] border border-[#BFF0E2]/60">
                          <Check className="w-3.5 h-3.5 text-[#0E8A6E]" />
                          <p className="text-[12px] text-[#0E8A6E] font-bold tracking-tight">
                            {tr("automation.selectedRound", { index: form.stage_index, name: form.stage_name })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Criteria */}
                    <div>
                      <label htmlFor="automation-criteria" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                        {tr("automation.triggerCriteria")} <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="automation-criteria"
                        rows={3}
                        value={form.criteria}
                        onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
                        className="w-full border border-[#E1E4E8] rounded-[12px] px-4 py-3 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all resize-none"
                        placeholder={tr("automation.criteriaPlaceholderCondition")}
                      />
                      <p className="text-[11.5px] text-[#8A929E] mt-1.5 px-1 font-medium">
                        {tr("automation.setConditionsInterview")}
                      </p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="automation-start-date" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                          {tr("automation.startDateOptional")}
                        </label>
                        <input
                          id="automation-start-date"
                          type="date"
                          value={form.start_date || ""}
                          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                          className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="automation-end-date" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                          {tr("automation.endDateOptional")}
                        </label>
                        <input
                          id="automation-end-date"
                          type="date"
                          value={form.end_date || ""}
                          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                          className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                        />
                      </div>
                    </div>

                    {/* Timings and Caps */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="automation-start-time" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                          {tr("automation.startTime")} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="automation-start-time"
                          type="time"
                          value={form.start_time}
                          onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                          className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-3 text-[13px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="automation-end-time" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                          {tr("automation.endTime")} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="automation-end-time"
                          type="time"
                          value={form.end_time}
                          onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                          className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-3 text-[13px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="automation-duration" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                          {tr("automation.duration")} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="automation-duration"
                            value={form.duration}
                            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                            className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 pl-3 pr-8 text-[13px] font-semibold text-[#374151] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                          >
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                            <option value="60">60m</option>
                            <option value="90">90m</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="automation-daily-limit" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                        {tr("automation.dailyLimit")} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="automation-daily-limit"
                        type="number"
                        min={1}
                        value={form.daily_limit}
                        onChange={(e) => setForm((f) => ({ ...f, daily_limit: e.target.value }))}
                        className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                      />
                    </div>

                    {/* Email Template */}
                    <div>
                      <label htmlFor="automation-email-template" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                        {tr("automation.emailTemplateOptional")}
                      </label>
                      {templates.length === 0 ? (
                        <div className="bg-[#F7F8FA] rounded-[12px] p-4 border border-dashed border-[#E1E4E8] text-center">
                          <p className="text-[12.5px] text-[#8A929E] font-medium">
                            {tr("automation.noTemplatesFound")} <a href="/enterprise/templates/email-templates" className="text-[#5B53E0] font-bold hover:underline" target="_blank">{tr("automation.createOne")}</a> {tr("automation.firstWord")}
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            id="automation-email-template"
                            value={form.email_template_id}
                            onChange={(e) => setForm((f) => ({ ...f, email_template_id: e.target.value }))}
                            className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                          >
                            <option value="">{tr("automation.noTemplateDefault")}</option>
                            {templates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* Interview Type Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-3 ml-1">
                        {tr("automation.interviewType")} <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, interview_type: "GMEET" }))}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-[12px] border-2 transition-all cursor-pointer ${
                            form.interview_type === "GMEET"
                              ? "border-[#5B53E0] bg-[#ECEBFB] text-[#5B53E0]"
                              : "border-[#E1E4E8] bg-white hover:border-[#DAD7F6] text-[#4B5563]"
                          }`}
                        >
                          <Video className="w-5 h-5 shrink-0" />
                          <span className="text-[12.5px] font-bold">Google Meet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, interview_type: "TEAMS" }))}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-[12px] border-2 transition-all cursor-pointer ${
                            form.interview_type === "TEAMS"
                              ? "border-[#5B53E0] bg-[#ECEBFB] text-[#5B53E0]"
                              : "border-[#E1E4E8] bg-white hover:border-[#DAD7F6] text-[#4B5563]"
                          }`}
                        >
                          <Video className="w-5 h-5 shrink-0" />
                          <span className="text-[12.5px] font-bold">Microsoft Teams</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, interview_type: "AI" }))}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-[12px] border-2 transition-all cursor-pointer ${
                            form.interview_type === "AI"
                              ? "border-[#5B53E0] bg-[#ECEBFB] text-[#5B53E0]"
                              : "border-[#E1E4E8] bg-white hover:border-[#DAD7F6] text-[#4B5563]"
                          }`}
                        >
                          <Brain className="w-5 h-5 shrink-0" />
                          <span className="text-[12.5px] font-bold">{tr("automation.aiInterview")}</span>
                        </button>
                      </div>
                    </div>

                    {form.interview_type === "AI" ? (
                      <div className="space-y-4 pt-2">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label htmlFor="automation-ai-template" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wider ml-1">
                              {tr("automation.aiInterviewTemplate")} <span className="text-rose-500">*</span>
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                setSelectedTemplateForEdit(null);
                                setShowTemplateBuilder(true);
                              }}
                              className="text-[11px] font-bold text-[#5B53E0] hover:text-[#4A43C9] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{tr("automation.createNew")}</span>
                            </button>
                          </div>
                          {interviewTemplates.length === 0 ? (
                            <div className="bg-[#F7F8FA] rounded-[12px] p-4 border border-dashed border-[#E1E4E8] text-center">
                              <p className="text-[12.5px] text-[#8A929E] font-medium">
                                {tr("automation.noAiTemplates")}
                              </p>
                            </div>
                          ) : (
                            <div className="relative">
                              <select
                                id="automation-ai-template"
                                value={form.interview_template_id || ""}
                                onChange={(e) => setForm(f => ({ ...f, interview_template_id: e.target.value }))}
                                className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                              >
                                <option value="">{tr("automation.selectTemplate")}</option>
                                {interviewTemplates.map((t) => (
                                  <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        {/* Interviewer Email */}
                        <div>
                          <label htmlFor="automation-interviewer-email" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                            {tr("automation.interviewerEmailOptional")}
                          </label>
                          <input
                            id="automation-interviewer-email"
                            type="email"
                            value={form.interviewer_email}
                            onChange={(e) => setForm((f) => ({ ...f, interviewer_email: e.target.value }))}
                            className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                            placeholder={tr("automation.recruiterEmailPlaceholder")}
                          />
                          <p className="text-[11.5px] text-[#8A929E] mt-1.5 px-1 font-medium">
                            {tr("automation.ifBlankAccountEmail")}
                          </p>
                        </div>

                        {/* Google Meet Link */}
                        <div>
                          <label htmlFor="automation-google-meet-link" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                            {tr("automation.personalMeetLink")}
                          </label>
                          <input
                            id="automation-google-meet-link"
                            type="url"
                            value={form.google_meet_link}
                            onChange={(e) => setForm((f) => ({ ...f, google_meet_link: e.target.value }))}
                            className="w-full border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all bg-white"
                            placeholder="e.g. https://meet.google.com/abc-defg-hij"
                          />
                          <p className="text-[11.5px] text-[#8A929E] mt-1.5 px-1 font-medium">
                            {tr("automation.pasteRealLink")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Toggles Group */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-4 bg-[#F7F8FA] border border-[#E1E4E8] rounded-[12px] transition-all hover:border-[#DAD7F6]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[8px] bg-white border border-[#E1E4E8] flex items-center justify-center shadow-sm">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#15171C]">{tr("automation.enableAutomation")}</p>
                            <p className="text-[11.5px] text-[#8A929E] font-semibold">{tr("automation.turnRulesOnOff")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_enabled ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#F7F8FA] border border-[#E1E4E8] rounded-[12px] transition-all hover:border-[#DAD7F6]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[8px] bg-white border border-[#E1E4E8] flex items-center justify-center shadow-sm">
                            <Sparkles className="w-4 h-4 text-[#5B53E0]" />
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#15171C]">{tr("automation.autoMove")}</p>
                            <p className="text-[11.5px] text-[#8A929E] font-semibold">{tr("automation.advanceNextRound")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.auto_move ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // TIME SLOTS TAB
                  <div className="space-y-6">
                    {(() => {
                      const slotLimit = Number(form.daily_limit) || 0;
                      const atLimit = slotLimit > 0 && form.time_slots.length >= slotLimit;
                      const overLimit = slotLimit > 0 && form.time_slots.length > slotLimit;
                      return (
                    <div className="bg-[#F7F8FA] border border-[#E1E4E8] rounded-[12px] p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13.5px] font-bold text-[#15171C]">{tr("automation.preGeneratedSlots")}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] border ${atLimit ? "bg-[#FEF3E2] text-[#D97706] border-[#FCE1BF]" : "bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]/60"}`}>
                          {tr("automation.slotsCount", { count: form.time_slots.length, limit: slotLimit })}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#8A929E] font-semibold mb-4 leading-relaxed">
                        {tr("automation.defineSlotsHelp", { limit: form.daily_limit })}
                      </p>
                      {overLimit && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-3">
                          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <p className="text-[12px] font-semibold text-rose-700 leading-relaxed">
                            {tr("automation.slotsOverLimit", { count: form.time_slots.length, limit: slotLimit, over: form.time_slots.length - slotLimit })}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateTimeSlots}
                          className="flex-1 flex justify-center items-center gap-2 h-11 bg-white border border-[#5B53E0] text-[#5B53E0] hover:bg-[#ECEBFB] rounded-[12px] text-[13px] font-bold transition-all cursor-pointer"
                        >
                          <Wand2 className="w-4 h-4" />
                          <span>{tr("automation.autoGenerateSlots", { limit: form.daily_limit })}</span>
                        </button>
                        <button
                          type="button"
                          disabled={atLimit}
                          onClick={() => {
                            if (slotLimit <= 0) {
                              showToast(tr("automation.setDailyLimitFirst"), "error");
                              return;
                            }
                            if (atLimit) {
                              showToast(tr("automation.reachedDailyLimit", { limit: slotLimit }), "error");
                              return;
                            }
                            setForm(f => ({ ...f, time_slots: [...f.time_slots, "12:00"] }));
                          }}
                          className="w-11 h-11 flex border border-[#E1E4E8] hover:border-[#DAD7F6] items-center justify-center rounded-[12px] hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#E1E4E8]"
                          title={atLimit ? tr("automation.slotLimitReachedTitle") : tr("automation.addSlotManually")}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                      );
                    })()}

                    {form.time_slots.length > 0 && (
                      <div className="space-y-3">
                        {form.time_slots.map((ts, idx) => (
                          <div key={idx} className="flex items-center gap-2 relative">
                            <span className="absolute left-4 text-[10px] font-bold text-[#8A929E] tracking-wider uppercase leading-none pointer-events-none">
                              {tr("automation.slotN", { n: idx + 1 })}
                            </span>
                            <div className="flex-1 flex items-center bg-[#F7F8FA] border border-[#E1E4E8] rounded-[12px] px-2 focus-within:ring-2 focus-within:ring-[#5B53E0]/20 focus-within:border-[#5B53E0] transition-all">
                              <input
                                type="time"
                                value={ts}
                                onChange={(e) => {
                                  const newSlots = [...form.time_slots];
                                  newSlots[idx] = e.target.value;
                                  setForm((f) => ({ ...f, time_slots: newSlots }));
                                }}
                                className="w-full bg-transparent pl-14 pr-2 h-11 text-[13.5px] font-bold text-[#374151] focus:outline-none font-mono"
                              />
                              <span className="text-[11.5px] text-[#8A929E] font-bold px-3 border-l border-[#E1E4E8] flex items-center h-7 shrink-0">
                                {tr("automation.endPrefix")} {(() => {
                                   const [h, m] = ts.split(':').map(Number);
                                   if (Number.isNaN(h)) return "--:--";
                                   const total = h * 60 + m + (Number(form.duration) || 30);
                                   const eh = Math.floor(total / 60).toString().padStart(2, '0');
                                   const em = (total % 60).toString().padStart(2, '0');
                                   return `${eh}:${em}`;
                                })()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newSlots = form.time_slots.filter((_, i) => i !== idx);
                                  setForm((f) => ({ ...f, time_slots: newSlots }));
                              }}
                              className="w-11 h-11 shrink-0 bg-rose-50 text-rose-600 rounded-[12px] flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors border border-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#E8EAED] bg-[#F7F8FA] shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-[#5B53E0] text-white rounded-[12px] text-[13.5px] font-bold hover:bg-[#4A43C9] transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_12px_rgba(91,83,224,0.25)] cursor-pointer"
                >
                  {saving ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingId ? tr("automation.saveChangesCaps") : tr("automation.createAutomationCaps")}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="w-full mt-3 h-10 text-[12.5px] font-semibold text-[#8A929E] hover:text-[#4B5563] transition-colors cursor-pointer"
                >
                  {tr("common.cancel")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              setForm(f => ({ ...f, interview_template_id: newTemplate.id ?? null }));
              showToast(tr("automation.interviewTemplateSaved"));
            }}
          />
        )}
      </AnimatePresence>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAutomationToDelete(null);
        }}
        onConfirm={handleDelete}
        title={tr("automation.deleteInterviewTitle")}
        message={tr("automation.deleteInterviewMsg", { job: automationToDelete ? jobTitle(automationToDelete.job_requirement_id) : tr("automation.thisJob") })}
        confirmLabel={tr("automation.yesDelete")}
        cancelLabel={tr("automation.no")}
        isDestructive={true}
      />
    </div>
  );
}
