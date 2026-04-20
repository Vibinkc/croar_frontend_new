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

export default function MailAutomationPage() {
  const { token, canAccess } = useAuth();

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    setTimeout(() => setToast(null), 5000);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    setForm({
      job_requirement_id: a.job_requirement_id,
      stage_index: a.stage_index,
      stage_name: a.stage_name ?? "",
      criteria: a.criteria,
      template_id: a.template_id,
      auto_move: a.auto_move,
      is_enabled: a.is_enabled,
      is_immediate: a.is_immediate,
      send_at: a.send_at ? a.send_at.replace(' ', 'T').split('.')[0].slice(0, 16) : "", // Format for datetime-local input
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.job_requirement_id || !form.criteria.trim() || !form.template_id) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (!form.is_immediate && form.send_at) {
      const scheduledDate = new Date(form.send_at);
      if (scheduledDate < new Date()) {
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

  // ── Toggle ───────────────────────────────────────────────────────────────────

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
    setDeletingId(automationToDelete.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/automation/mail/${automationToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        showToast("Automation deleted.");
        setAutomations((prev) => prev.filter((a) => a.id !== automationToDelete.id));
      } else {
        showToast("Failed to delete.", "error");
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

  // ─── Computed ───────────────────────────────────────────────────────────────
  const filteredAutomations = automations.filter(a => {
    const term = searchQuery.toLowerCase();
    return a.criteria.toLowerCase().includes(term) ||
           jobTitle(a.job_requirement_id).toLowerCase().includes(term) ||
           templateName(a.template_id).toLowerCase().includes(term) ||
           (a.stage_name && a.stage_name.toLowerCase().includes(term));
  });

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
              <span className="material-symbols-rounded text-[#7C3AED] text-2xl">mark_email_unread</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Mail Automation</h1>
              <p className="text-slate-500 text-[13px] font-medium mt-1">
                Configure automated emails for specific jobs and hiring rounds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
              {canAccess("communications:moderate") && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-5 h-11 bg-[#7C3AED] text-white rounded-lg text-xs font-black hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7C3AED]/20 active:scale-95"
                >
                  <span className="material-symbols-rounded text-lg">add</span>
                  NEW AUTOMATION
                </button>
              )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Rules", value: automations.length, icon: "rule", color: "indigo" },
            { label: "Active Rules", value: automations.filter(a => a.is_enabled).length, icon: "bolt", color: "emerald" },
            { label: "Immediate Trigger", value: automations.filter(a => a.is_immediate).length, icon: "flash_on", color: "amber" },
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
                placeholder="Search by rules, jobs, or templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-lg pl-11 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
              />
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
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
            <span className="material-symbols-rounded text-[#7C3AED] text-4xl">mark_email_unread</span>
          </div>
          <p className="text-slate-700 font-bold text-lg">{searchQuery ? 'No matching rules' : 'No automations yet'}</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            {searchQuery ? `We couldn't find any results for "${searchQuery}"` : 'Create your first mail automation to automatically trigger emails when your criteria are met.'}
          </p>
          {!searchQuery && canAccess("communications:moderate") && (
            <button
              onClick={openCreate}
              className="mt-5 flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-bold hover:bg-[#6d28d9] transition-colors"
            >
              <span className="material-symbols-rounded text-base">add</span>
              Create Automation
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Configuration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Job & Template</th>
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
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">
                            Round {a.stage_index}
                          </span>
                          {a.stage_name && (
                            <span className="text-[10px] font-bold text-slate-400">{a.stage_name}</span>
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
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                          <span className="material-symbols-rounded text-sm text-slate-300">description</span>
                          {templateName(a.template_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <span className="material-symbols-rounded text-sm text-slate-400">schedule</span>
                          {a.is_immediate ? "Immediate" : new Date(a.send_at!).toLocaleString()}
                        </div>
                        {a.auto_move && (
                          <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                            <span className="material-symbols-rounded text-xs">keyboard_double_arrow_right</span>
                            Auto-Move Active
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={togglingId === a.id}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#7C3AED]" : "bg-slate-200"} ${togglingId === a.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canAccess("communications:moderate") && (
                          <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#7C3AED] transition-colors">
                            <span className="material-symbols-rounded text-base">edit</span>
                          </button>
                        )}
                        {canAccess("communications:delete") && (
                          <button onClick={() => {
                            setAutomationToDelete(a);
                            setIsDeleteModalOpen(true);
                          }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-rounded text-base">delete</span>
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
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={closeModal} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showModal ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                <span className="material-symbols-rounded text-[#7C3AED] text-xl">mark_email_unread</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 leading-tight">
                  {editingId ? "Edit Automation" : "New Automation"}
                </h2>
                <p className="text-[10px] font-bold text-slate-400   mt-0.5">Mail Configuration</p>
              </div>
            </div>
            <button onClick={closeModal} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <span className="material-symbols-rounded text-xl">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
            {/* Job */}
            <div>
              <label className="block text-[10px] font-black text-slate-500   mb-2 ml-1">
                Job Requirement <span className="text-red-400">*</span>
              </label>
              <select
                value={form.job_requirement_id}
                onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 1, stage_name: "" }))}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
              >
                <option value="">Select job…</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            {/* Round */}
            <div>
              <label className="block text-[10px] font-black text-slate-500   mb-2 ml-1">
                Hiring Round <span className="text-red-400">*</span>
              </label>
              {jobRounds.length > 0 ? (
                <select
                  onChange={handleRoundSelect}
                  defaultValue=""
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
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
                    className="col-span-2 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    placeholder="No."
                  />
                  <input
                    type="text"
                    value={form.stage_name}
                    onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))}
                    className="col-span-3 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                    placeholder="Label"
                  />
                </div>
              )}
              {jobRounds.length > 0 && (form.stage_name || Number(form.stage_index) > 1) && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/5 rounded-lg border border-[#7C3AED]/10">
                  <span className="material-symbols-rounded text-xs text-[#7C3AED]">check_circle</span>
                  <p className="text-[10px] text-[#7C3AED] font-bold  tracking-tight">
                    Selected: Round {form.stage_index} — {form.stage_name}
                  </p>
                </div>
              )}
            </div>

            {/* Criteria */}
            <div>
              <label className="block text-[10px] font-black text-slate-500   mb-2 ml-1">
                Trigger Criteria <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={form.criteria}
                onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all resize-none"
                placeholder="Describe the condition, e.g. 'AI score > 80' or 'Interview cleared'…"
              />
              <p className="text-[10px] text-slate-400 mt-2 px-1">
                Clear plain-language conditions help your team know when to send.
              </p>
            </div>

            {/* Template */}
            <div>
              <label className="block text-[10px] font-black text-slate-500   mb-2 ml-1">
                Email Template <span className="text-red-400">*</span>
              </label>
              {templates.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 text-center">
                    No templates found. <a href="/enterprise/settings/templates" className="text-[#7C3AED] font-bold hover:underline" target="_blank">Create one</a> first.
                  </p>
                </div>
              ) : (
                <select
                  value={form.template_id}
                  onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                >
                  <option value="">Select template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Toggles Group */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
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

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <span className="material-symbols-rounded text-slate-600 text-lg">bolt</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Send Immediately</p>
                    <p className="text-[10px] text-slate-400 font-medium">Auto-send on round change</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, is_immediate: !f.is_immediate }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_immediate ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_immediate ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {!form.is_immediate && (
                <div className="animate-in slide-in-from-top-2 duration-200 px-1">
                  <label className="block text-[10px] font-black text-slate-500   mb-2 ml-1">
                    Scheduled Date & Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.send_at}
                    onChange={(e) => setForm((f) => ({ ...f, send_at: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
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

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 h-12 bg-[#7C3AED] text-white rounded-lg text-sm font-black hover:bg-[#6d28d9] transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-[#7C3AED]/20"
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
              className="w-full mt-3 h-10 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors  "
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAutomationToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Mail Automation?"
        message={`Are you sure you want to delete this mail automation for ${automationToDelete ? jobTitle(automationToDelete.job_requirement_id) : 'this job'}? This action is irreversible.`}
        confirmLabel="Yes, Delete"
        cancelLabel="No"
        isDestructive={true}
      />
    </div>
  );
}
