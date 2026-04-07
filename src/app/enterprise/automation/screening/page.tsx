"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { AnimatePresence, motion } from "framer-motion";
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
  template_id: string;
  auto_move: boolean;
  is_enabled: boolean;
  is_immediate: boolean;
  send_at: string | null;
  created_at: string;
}

interface FormState {
  job_requirement_id: string;
  stage_index: number | string;
  stage_name: string;
  criteria: string;
  template_id: string;
  auto_move: boolean;
  is_enabled: boolean;
  is_immediate: boolean;
  send_at: string;
}

const EMPTY_FORM: FormState = {
  job_requirement_id: "",
  stage_index: 1,
  stage_name: "",
  criteria: "",
  template_id: "",
  auto_move: false,
  is_enabled: true,
  is_immediate: true,
  send_at: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScreeningAutomationPage() {
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
  
  // Consistency State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch jobs & templates
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

  // Fetch automations
  const fetchAutomations = useCallback(async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = jobId ? `?job_id=${jobId}` : "";
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/automation/mail${qs}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setAutomations(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    fetchAutomations(selectedJobId || undefined);
  }, [selectedJobId, fetchAutomations]);

  const selectedJob = jobs.find((j) => j.id === form.job_requirement_id);
  const jobRounds: WorkflowStage[] = selectedJob?.workflow_stages ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, job_requirement_id: selectedJobId });
    setShowModal(true);
  };

  const openEdit = (a: Automation) => {
    setEditingId(a.id);
    setForm({
      job_requirement_id: a.job_requirement_id,
      stage_index: a.stage_index,
      stage_name: a.stage_name ?? "",
      criteria: a.criteria,
      template_id: a.template_id,
      auto_move: a.auto_move,
      is_enabled: a.is_enabled,
      is_immediate: a.is_immediate,
      send_at: a.send_at ? a.send_at.replace(' ', 'T').split('.')[0].slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.job_requirement_id || !form.criteria.trim() || !form.template_id) {
      showToast("Please fill in all required fields.", "error");
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
        ...form,
        stage_index: Number(form.stage_index),
        stage_name: form.stage_name.trim() || null,
        send_at: form.is_immediate ? null : (form.send_at ? new Date(form.send_at).toISOString() : null),
      };
      const url = editingId
        ? `${BACKEND_URL}/api/v1/enterprise/automation/mail/${editingId}`
        : `${BACKEND_URL}/api/v1/enterprise/automation/mail`;
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

  const handleToggle = async (a: Automation) => {
    setTogglingId(a.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/automation/mail/${a.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ is_enabled: !a.is_enabled }),
      });
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((item) => (item.id === a.id ? { ...item, is_enabled: !a.is_enabled } : item))
        );
        showToast(a.is_enabled ? "Disabled" : "Enabled");
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!automationToDelete) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/automation/mail/${automationToDelete}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        showToast("Automation deleted.");
        setAutomations((prev) => prev.filter((a) => a.id !== automationToDelete));
      }
    } finally {
      setIsDeleteModalOpen(false);
      setAutomationToDelete(null);
    }
  };

  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "—";
  const templateName = (id: string) => templates.find((t) => t.id === id)?.name ?? "—";

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-4 md:p-6 lg:p-8 pt-4 animate-in fade-in duration-500">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-5 right-5 z-[500] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
            <span className="material-symbols-rounded text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
            <span className="material-symbols-rounded text-indigo-600 text-xl">fact_check</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Screening Automation</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Rules-Based Candidate Filtering</p>
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-3 shadow-xl shadow-slate-200/40 mb-8 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 flex-1 w-full sm:w-auto transition-all focus-within:bg-white focus-within:border-indigo-100 focus-within:ring-4 focus-within:ring-indigo-500/5 group">
          <span className="material-symbols-rounded text-slate-400 group-focus-within:text-indigo-500 transition-colors">work</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-black text-slate-700 w-full cursor-pointer"
          >
            <option value="">All Job Requirements</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <span className="material-symbols-rounded text-lg">add_circle</span>
          Add Rule
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Rules...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-rounded text-4xl text-slate-200">fact_check</span>
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Screening Rules</h3>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">Deploy your first automated screening rule to streamline your recruitment pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {automations.map((a) => (
            <motion.div
              layout
              key={a.id}
              className={`group bg-white rounded-[2rem] border p-1.5 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 ${
                a.is_enabled ? "border-slate-100" : "border-slate-100 opacity-60 grayscale-[0.5]"
              }`}
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${a.is_enabled ? "bg-indigo-50 text-indigo-600 shadow-sm" : "bg-slate-50 text-slate-400"}`}>
                    <span className="material-symbols-rounded text-xl">rule</span>
                  </div>
                  <button onClick={() => handleToggle(a)} disabled={togglingId === a.id} className={`relative w-10 h-5 rounded-full transition-all duration-300 ${a.is_enabled ? "bg-indigo-500 shadow-lg shadow-indigo-100" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${a.is_enabled ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Round {a.stage_index}</span>
                    <span className="w-1 h-3 rounded-full bg-slate-100" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest truncate max-w-[120px]">{a.stage_name || "SCREENING"}</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 tracking-tight line-clamp-2 md:h-10 leading-tight">
                    <span className="text-slate-400 font-medium">IF: </span>{a.criteria}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-rounded text-slate-300 text-sm">work</span>
                    <span className="text-[11px] font-bold text-slate-500 truncate">{jobTitle(a.job_requirement_id)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-rounded text-slate-300 text-sm">mail</span>
                    <span className="text-[11px] font-bold text-slate-500 truncate">{templateName(a.template_id)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[1.5rem] p-2 flex items-center justify-between gap-2 overflow-hidden border border-slate-50">
                <div className="flex gap-2 pl-2">
                  {a.auto_move && (
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[8px] font-black text-indigo-500 uppercase tracking-tight shadow-sm">Auto-Move</span>
                  )}
                  <span className={`px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[8px] font-black uppercase tracking-tight shadow-sm ${a.is_immediate ? "text-emerald-500" : "text-slate-500"}`}>
                    {a.is_immediate ? "Immediate" : "Scheduled"}
                  </span>
                </div>
                <div className="flex gap-1.5 pr-1 translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
                  <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center group/btn shadow-sm">
                    <span className="material-symbols-rounded text-base">edit</span>
                  </button>
                  <button onClick={() => { setAutomationToDelete(a.id); setIsDeleteModalOpen(true); }} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm">
                    <span className="material-symbols-rounded text-base">delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Side Drawer */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={closeModal} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col pointer-events-auto">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-rounded text-indigo-600 text-2xl">settings_input_component</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 leading-tight italic uppercase tracking-tight">{editingId ? "Edit Rule" : "Configure Rule"}</h2>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Tactical Automation Node</p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-10 h-10 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                  <span className="material-symbols-rounded text-xl">close</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Job Requirement*</label>
                    <select
                      value={form.job_requirement_id}
                      onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 1, stage_name: "" }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select requirement...</option>
                      {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Connect to Hiring Round</label>
                    <div className="grid grid-cols-5 gap-3">
                      <input type="number" min={1} value={form.stage_index} onChange={(e) => setForm((f) => ({ ...f, stage_index: e.target.value }))} className="col-span-1 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3.5 text-sm font-bold text-center outline-none focus:border-indigo-500 focus:bg-white" placeholder="Idx" />
                      <input type="text" value={form.stage_name} onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))} className="col-span-4 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" placeholder="Round Name (e.g. Technical Interview)" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trigger Condition*</label>
                    <textarea rows={4} value={form.criteria} onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none" placeholder="IF candidate meets this criteria (e.g. 'Shortlisted' or 'Score > 80')..." />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight italic uppercase">Active Status</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule is currently operational</p>
                      </div>
                      <button onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_enabled ? "bg-indigo-500" : "bg-slate-200"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${form.is_enabled ? "translate-x-5" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight italic uppercase">Auto-Move Candidate</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advance workflow on trigger</p>
                      </div>
                      <button onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.auto_move ? "bg-indigo-500" : "bg-slate-200"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${form.auto_move ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-[#0F172A] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
                >
                  {saving ? "SYNCHRONIZING..." : editingId ? "UPDATE RULE" : "DEPLOY RULE"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Destroy Automation Node?"
        message="Are you sure you want to delete this screening rule? This action will immediately halt all automated processing for this specific criteria."
        confirmLabel="Yes, Destroy"
        cancelLabel="No"
        isDestructive={true}
      />
    </div>
  );
}
