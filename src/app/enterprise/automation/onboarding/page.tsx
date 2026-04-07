"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";

// --- Types ---

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

interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface OnboardingAutomation {
  id: string;
  job_requirement_id: string;
  stage_index: number;
  stage_name: string | null;
  template_id: string;
  email_template_id: string | null;
  is_enabled: boolean;
  auto_move: boolean;
  created_at: string;
  template?: OnboardingTemplate;
  email_template?: EmailTemplate;
}

interface FormState {
  job_requirement_id: string;
  stage_index: number | string;
  stage_name: string;
  template_id: string;
  email_template_id: string;
  is_enabled: boolean;
  auto_move: boolean;
}

const EMPTY_FORM: FormState = {
  job_requirement_id: "",
  stage_index: 0,
  stage_name: "",
  template_id: "",
  email_template_id: "",
  is_enabled: true,
  auto_move: false,
};

export default function OnboardingAutomationPage() {
  const { token } = useAuth();

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<OnboardingTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [automations, setAutomations] = useState<OnboardingAutomation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<OnboardingAutomation | null>(null);
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

  // Fetch metadata
  useEffect(() => {
    if (!token) return;
    const fetchMeta = async () => {
      try {
        const [jRes, tRes, eRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, { headers: authHeaders }),
          fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`, { headers: authHeaders }),
          fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, { headers: authHeaders }),
        ]);
        const jData = jRes.ok ? await jRes.json() : [];
        const tData = tRes.ok ? await tRes.json() : [];
        const eData = eRes.ok ? await eRes.json() : [];
        setJobs(Array.isArray(jData) ? jData : []);
        setOnboardingTemplates(Array.isArray(tData) ? tData : []);
        setEmailTemplates(Array.isArray(eData) ? eData : []);
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
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding-automation/${qs}`, {
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
    if (token) {
      fetchAutomations(selectedJobId || undefined);
    }
  }, [token, selectedJobId, fetchAutomations]);

  const selectedJob = jobs.find((j) => j.id === form.job_requirement_id);
  const jobRounds: WorkflowStage[] = selectedJob?.workflow_stages ?? [];

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, job_requirement_id: selectedJobId });
    setShowModal(true);
  };

  const openEdit = (a: OnboardingAutomation) => {
    setEditingId(a.id);
    setForm({
      job_requirement_id: a.job_requirement_id,
      stage_index: a.stage_index,
      stage_name: a.stage_name ?? "",
      template_id: a.template_id,
      email_template_id: a.email_template_id || "",
      is_enabled: a.is_enabled,
      auto_move: a.auto_move || false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.job_requirement_id || !form.template_id) {
      showToast("Please select a job and an onboarding template.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        stage_index: Number(form.stage_index),
        stage_name: form.stage_name?.trim() || null,
        template_id: form.template_id,
        email_template_id: form.email_template_id || null,
        is_enabled: form.is_enabled,
        auto_move: form.auto_move,
      };
      
      if (!editingId) {
        payload.job_requirement_id = form.job_requirement_id;
      }
      const url = editingId
        ? `${BACKEND_URL}/api/v1/enterprise/onboarding-automation/${editingId}`
        : `${BACKEND_URL}/api/v1/enterprise/onboarding-automation/`;
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

  const handleToggle = async (a: OnboardingAutomation) => {
    setTogglingId(a.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding-automation/${a.id}`, {
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

  const handleDelete = async () => {
    if (!automationToDelete) return;
    setDeletingId(automationToDelete.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding-automation/${automationToDelete.id}`, {
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

  const getJobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "—";
  const getTemplateName = (id: string) => onboardingTemplates.find((t) => t.id === id)?.name ?? "—";
  const getEmailTemplateName = (id: string | null) => id ? (emailTemplates.find((t) => t.id === id)?.name ?? "—") : "None";

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-4 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${
            toast.type === "success" ? "bg-[#4f46e5] text-white" : "bg-red-500 text-white"
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
          <div className="w-9 h-9 rounded-xl bg-[#4f46e5]/10 flex items-center justify-center">
            <span className="material-symbols-rounded text-[#4f46e5] text-xl">person_add</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Onboarding Automation</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">
          Automatically trigger onboarding processes when candidates reach specific hiring stages.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <span className="material-symbols-rounded text-slate-400 text-lg">work</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5]"
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-bold hover:bg-[#4338ca] transition-colors shadow-md shadow-[#4f46e5]/20"
        >
          <span className="material-symbols-rounded text-base">add</span>
          New Automation
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#4f46e5]/5 flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-[#4f46e5] text-4xl">person_add</span>
          </div>
          <p className="text-slate-700 font-bold text-lg">No onboarding automations</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            Set up an automation to auto-start onboarding when a candidate reaches a certain stage.
          </p>
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
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${a.is_enabled ? "bg-[#4f46e5]/10" : "bg-slate-100"}`}>
                  <span className={`material-symbols-rounded text-xl ${a.is_enabled ? "text-[#4f46e5]" : "text-slate-400"}`}>rocket_launch</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Stage {a.stage_index}{a.stage_name ? ` · ${a.stage_name}` : ""}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${a.is_enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.is_enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {a.is_enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 mb-1.5">
                    <p className="text-sm font-bold text-slate-800">
                      Onboarding: {getTemplateName(a.template_id)}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-rounded text-xs">mail</span>
                      Email: {getEmailTemplateName(a.email_template_id)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span className="material-symbols-rounded text-xs">work</span>
                      {getJobTitle(a.job_requirement_id)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(a)}
                  disabled={togglingId === a.id}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#4f46e5]" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#4f46e5] transition-colors" title="Edit">
                  <span className="material-symbols-rounded text-base">edit</span>
                </button>
                <button onClick={() => {
                   setAutomationToDelete(a);
                   setIsDeleteModalOpen(true);
                }} disabled={deletingId === a.id} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40" title="Delete">
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

      {/* Modal / Drawer */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              onClick={closeModal}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4f46e5]/10 flex items-center justify-center">
                    <span className="material-symbols-rounded text-[#4f46e5] text-xl">person_add</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 leading-tight">
                      {editingId ? "Edit Automation" : "New Automation"}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Onboarding Config</p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                  <span className="material-symbols-rounded text-xl">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Job */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Job Requirement <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.job_requirement_id}
                    onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 0, stage_name: "" }))}
                    disabled={!!editingId}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] disabled:bg-slate-50 disabled:text-slate-400 transition-all"
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
                    Trigger Stage <span className="text-red-400">*</span>
                  </label>
                  {jobRounds.length > 0 ? (
                    <select
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        if (idx === 0) {
                          setForm(f => ({ ...f, stage_index: 0, stage_name: "" }));
                          return;
                        }
                        const round = jobRounds[idx - 1];
                        setForm(f => ({ ...f, stage_index: idx, stage_name: round?.name || "" }));
                      }}
                      value={form.stage_index}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] transition-all"
                    >
                      <option value={0}>Pick stage…</option>
                      {jobRounds.map((r, i) => (
                        <option key={i} value={i + 1}>
                          Stage {i + 1}: {r.name}
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
                        className="col-span-2 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] transition-all"
                        placeholder="Idx"
                      />
                      <input
                        type="text"
                        value={form.stage_name}
                        onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))}
                        className="col-span-3 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] transition-all"
                        placeholder="Stage Name"
                      />
                    </div>
                  )}
                </div>

                {/* Onboarding Template */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Onboarding Template <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.template_id}
                    onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] transition-all"
                  >
                    <option value="">Select template…</option>
                    {onboardingTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Email Template */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Introduction Email Template
                  </label>
                  <select
                    value={form.email_template_id}
                    onChange={(e) => setForm((f) => ({ ...f, email_template_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] transition-all"
                  >
                    <option value="">No email (Manual send)</option>
                    {emailTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Enable Automation</p>
                    <p className="text-[10px] text-slate-400">Trigger onboarding when criteria is met</p>
                  </div>
                  <button
                    onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.is_enabled ? "bg-[#4f46e5]" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                
                {/* Auto-Move Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Auto-Move Candidate</p>
                    <p className="text-[10px] text-slate-400">Automatically advance candidate after trigger</p>
                  </div>
                  <button
                    onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.auto_move ? "bg-[#4f46e5]" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 mt-auto">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4f46e5]/20"
                >
                   {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingId ? "Update Automation" : "Create Automation"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAutomationToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Onboarding Automation?"
        message={`Are you sure you want to delete this onboarding automation for ${automationToDelete ? getJobTitle(automationToDelete.job_requirement_id) : 'this job'}? This action is irreversible.`}
        confirmLabel="Yes, Delete"
        cancelLabel="No"
        isDestructive={true}
      />
    </div>
  );
}
