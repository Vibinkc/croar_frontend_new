"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Plus,
  Zap,
  Clock,
  ChevronRight,
  Search,
  Briefcase,
  ChevronDown,
  Trash2,
  Edit2,
  X,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
    const { t: tr } = useI18n();

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
  const [formError, setFormError] = useState<string | null>(null);

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
      } else {
        showToast(tr("automation.failedLoadAutomations"), "error");
      }
    } catch {
      showToast(tr("automation.failedLoadAutomations"), "error");
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
    setFormError(null);
    setForm({ ...EMPTY_FORM, job_requirement_id: selectedJobId });
    setShowModal(true);
  };

  // Stored send_at is naive UTC. Convert it to a LOCAL wall-clock string for the datetime-local input,
  // so editing shows the correct local time and re-saving (new Date(local).toISOString()) doesn't drift
  // the stored time by the user's UTC offset on every edit.
  const toLocalInput = (raw: string): string => {
    const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw.replace(" ", "T")}Z`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const openEdit = (a: Automation) => {
    setEditingId(a.id);
    setFormError(null);
    setForm({
      job_requirement_id: a.job_requirement_id,
      stage_index: a.stage_index,
      stage_name: a.stage_name ?? "",
      criteria: a.criteria,
      template_id: a.template_id,
      auto_move: a.auto_move,
      is_enabled: a.is_enabled,
      is_immediate: a.is_immediate,
      send_at: a.send_at ? toLocalInput(a.send_at) : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
    setForm(EMPTY_FORM);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const fail = (msg: string) => {
    setFormError(msg);
    showToast(msg, "error");
  };

  const handleSave = async () => {
    // No templates exist at all — they can't pick one, so guide them there.
    if (templates.length === 0) {
      fail(tr("automation.createEmailTemplateFirst"));
      return;
    }

    // Collect every missing required field so the message names exactly what's wrong.
    const missing: string[] = [];
    if (!form.job_requirement_id) missing.push(tr("automation.jobRequirement"));
    const roundMissing = jobRounds.length > 0 ? !form.stage_name : !String(form.stage_index).trim();
    if (roundMissing) missing.push(tr("automation.hiringRound"));
    if (!form.criteria.trim()) missing.push(tr("automation.triggerCriteria"));
    if (!form.template_id) missing.push(tr("automation.emailTemplate"));
    if (!form.is_immediate && !form.send_at) missing.push(tr("automation.scheduledDateTime"));

    if (missing.length > 0) {
      fail(
        missing.length === 1
          ? tr("automation.fillRequiredField", { field: missing[0] })
          : tr("automation.fillRequiredFieldsList", { fields: missing.join(", ") })
      );
      return;
    }

    if (!form.is_immediate && form.send_at) {
      const scheduledDate = new Date(form.send_at);
      if (scheduledDate < new Date()) {
        fail(tr("automation.scheduledPastFuture"));
        return;
      }
    }

    setFormError(null);
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
        showToast(editingId ? tr("automation.automationUpdated") : tr("automation.automationCreated"));
        closeModal();
        fetchAutomations(selectedJobId || undefined);
      } else {
        const err = await res.json().catch(() => ({}));
        const detail = err?.detail ?? err;
        const detailMsg = typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((e: string | { msg?: string }) => (typeof e === "string" ? e : (e.msg || ""))).filter(Boolean).join(", ")
            : "";
        setFormError(detailMsg || (editingId ? tr("automation.couldNotUpdateAutomation") : tr("automation.couldNotCreateAutomation")));
        showToast(err, "error");
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
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/automation/mail/${automationToDelete.id}`, {
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
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[300] flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold transition-all duration-300 ${
            toast.type === "success" ? "bg-[#1976D2] text-white" : "bg-rose-600 text-white"
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

      <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">
              {tr("automation.mailTitle")}
            </h1>
            <PageHelp title={tr("automation.mailTitle")}>
              <p>{tr("automation.mailHelp")}</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("automation.mailSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {canAccess("communications:moderate") && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              {tr("automation.newAutomation")}
            </button>
          )}
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: tr("automation.totalRules"), value: automations.length, Icon: Zap, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.3)" },
          { label: tr("automation.activeRules"), value: automations.filter(a => a.is_enabled).length, Icon: CheckCircle2, grad: "linear-gradient(135deg,#60A5FA,#1565C0)", glow: "rgba(21,101,192,0.3)" },
          { label: tr("automation.immediateTrigger"), value: automations.filter(a => a.is_immediate).length, Icon: Clock, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.3)" },
          { label: tr("automation.autoMoveRules"), value: automations.filter(a => a.auto_move).length, Icon: ChevronRight, grad: "linear-gradient(135deg,#42A5F5,#1E88E5)", glow: "rgba(124,58,237,0.3)" }
        ].map((stat, i) => (
          <div
            key={i}
            className="relative bg-white border border-[#E0E0E0] hover:border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden transition-all duration-300 hover:shadow-sm"
          >
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: stat.grad }} />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{stat.label}</span>
                <div className="text-[30px] font-semibold tracking-[-1px] text-[#212121] mt-2">{stat.value}</div>
              </div>
              <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: stat.grad, boxShadow: `0 6px 14px ${stat.glow}` }}>
                <stat.Icon className="w-[18px] h-[18px]" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interaction Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors" />
          <input
            type="text"
            placeholder={tr("automation.searchRulesJobsTemplates")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white border rounded-[4px] pl-11 pr-4 text-sm font-semibold text-[#263238] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm border-[#E0E0E0]"
          />
        </div>

        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E]">
            <Briefcase className="w-4 h-4" />
          </div>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-white border border-[#E0E0E0] rounded-[4px] h-11 pl-9 pr-9 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] hover:bg-[#FAFAFA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm min-w-[220px]"
          >
            <option value="">{tr("automation.allJobRequirements")}</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
        </div>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="p-8 space-y-4 bg-white rounded-[4px] border border-[#E0E0E0]">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[#FAFAFA] rounded-[4px] animate-pulse" />
          ))}
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[4px] border border-[#E0E0E0] text-center shadow-sm">
          <div className="relative mb-6">
            <div className="absolute -inset-3 rounded-full bg-[#1976D2]/12 blur-2xl" />
            <div className="relative w-16 h-16 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 12px 30px rgba(25,118,210,0.4)" }}>
              <Mail className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-[18px] font-bold text-[#212121] mb-1.5">{searchQuery ? tr("automation.noMatchingRules") : tr("automation.noAutomationsYet")}</h3>
          <p className="text-[#757575] text-[14px] max-w-sm mx-auto mb-6">
            {searchQuery ? tr("automation.noResultsFor", { query: searchQuery }) : tr("automation.createFirstMail")}
          </p>
          {!searchQuery && canAccess("communications:moderate") && (
            <button
              onClick={openCreate}
              className="px-6 h-11 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-all active:scale-95"
            >
              {tr("automation.createAutomation")}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.ruleConfiguration")}</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.targetJobTemplate")}</th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.triggerSchedule")}</th>
                  <th
                    className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em] cursor-help"
                    title={tr("automation.activeTooltip")}
                  >
                    {tr("automation.active")}
                  </th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {filteredAutomations.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFAFA]/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1976D2] text-[10px] font-bold border border-[#BBDEFB]/60 uppercase">
                            {tr("automation.round")} {a.stage_index}
                          </span>
                          {a.stage_name && (
                            <span className="text-[12px] font-semibold text-[#757575]">{a.stage_name}</span>
                          )}
                        </div>
                        <p className="text-[13.5px] font-semibold text-[#424242]">
                          <span className="text-[#757575] font-medium italic mr-1">{tr("automation.ifLabel")}</span>
                          {a.criteria}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#212121]">
                          <Briefcase className="w-4 h-4 text-[#757575]" />
                          {jobTitle(a.job_requirement_id)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#757575]">
                          <Mail className="w-3.5 h-3.5 text-[#BDBDBD]" />
                          {templateName(a.template_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#424242]">
                          <Clock className="w-4 h-4 text-[#757575]" />
                          {a.is_immediate ? tr("automation.immediate") : new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(a.send_at!) ? a.send_at! : `${a.send_at!.replace(" ", "T")}Z`).toLocaleString()}
                        </div>
                        {a.auto_move && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-[#2E7D32] uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#E8F5E9]/80 text-[#2E7D32] border border-[#C8E6C9]/60 uppercase tracking-wider shadow-sm">
                              {tr("automation.autoMove")}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={togglingId === a.id}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#1976D2]" : "bg-[#E0E0E0]"} ${togglingId === a.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canAccess("communications:moderate") && (
                          <button
                            onClick={() => openEdit(a)}
                            className="w-8 h-8 flex items-center justify-center rounded-[4px] border border-transparent hover:border-[#E0E0E0] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#1976D2] transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canAccess("communications:delete") && (
                          <button
                            onClick={() => {
                              setAutomationToDelete(a);
                              setIsDeleteModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-[4px] border border-transparent hover:border-[#E0E0E0] hover:bg-rose-50 text-[#757575] hover:text-rose-600 transition-colors"
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

      {/* Side Panel (Drawer) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-[#E0E0E0]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#E0E0E0] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] flex items-center justify-center border border-[#BBDEFB]/60 shadow-sm">
                    <Mail className="w-5 h-5 text-[#1976D2]" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-[#212121] leading-tight">
                      {editingId ? tr("automation.editAutomation") : tr("automation.newAutomation")}
                    </h2>
                    <p className="text-[12.5px] text-[#757575] font-medium mt-0.5">{tr("automation.mailConfiguration")}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-[#F5F6F8] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                {/* Job */}
                <div>
                  <label htmlFor="mail-job-requirement" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.jobRequirement")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="mail-job-requirement"
                      value={form.job_requirement_id}
                      onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 1, stage_name: "" }))}
                      className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                    >
                      <option value="">{tr("automation.selectJob")}</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                  </div>
                </div>

                {/* Round */}
                <div>
                  <label htmlFor="mail-hiring-round" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.hiringRound")} <span className="text-rose-500">*</span>
                  </label>
                  {jobRounds.length > 0 ? (
                    <div className="relative">
                      <select
                        id="mail-hiring-round"
                        onChange={handleRoundSelect}
                        value={form.stage_name ? `${form.stage_index}|${form.stage_name}` : ""}
                        className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                      >
                        <option value="">{tr("automation.pickRound")}</option>
                        {jobRounds.map((r, i) => (
                          <option key={i} value={`${i + 1}|${r.name}`}>
                            {tr("automation.round")} {i + 1}: {r.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-3">
                      <input
                        type="number"
                        min={1}
                        value={form.stage_index}
                        onChange={(e) => setForm((f) => ({ ...f, stage_index: e.target.value }))}
                        className="col-span-2 bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 text-[13.5px] font-semibold text-[#263238] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                        placeholder={tr("automation.noAbbrev")}
                      />
                      <input
                        type="text"
                        value={form.stage_name}
                        onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))}
                        className="col-span-3 bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 text-[13.5px] font-semibold text-[#263238] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                        placeholder={tr("automation.labelPlaceholder")}
                      />
                    </div>
                  )}
                  {jobRounds.length > 0 && (form.stage_name || Number(form.stage_index) > 1) && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-[#E3F2FD] rounded-lg border border-[#BBDEFB]/60">
                      <CheckCircle2 className="w-4 h-4 text-[#1976D2]" />
                      <p className="text-[11.5px] text-[#1976D2] font-semibold tracking-tight">
                        {tr("automation.selectedRound", { index: form.stage_index, name: form.stage_name })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Criteria */}
                <div>
                  <label htmlFor="mail-trigger-criteria" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.triggerCriteria")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="mail-trigger-criteria"
                    rows={4}
                    value={form.criteria}
                    onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))}
                    className="w-full bg-white border border-[#E0E0E0] rounded-[4px] p-4 text-[13.5px] font-semibold text-[#263238] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm resize-none"
                    placeholder={tr("automation.criteriaPlaceholderCondition")}
                  />
                  <p className="text-[11px] text-[#9E9E9E] mt-2 px-1">
                    {tr("automation.clearConditionsHelp")}
                  </p>
                </div>

                {/* Template */}
                <div>
                  <label htmlFor="mail-email-template" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.emailTemplate")} <span className="text-rose-500">*</span>
                  </label>
                  {templates.length === 0 ? (
                    <div className="bg-[#FAFAFA] rounded-lg p-4 border border-dashed border-[#E0E0E0]">
                      <p className="text-xs text-[#757575] text-center">
                        {tr("automation.noTemplatesFound")} <a href="/enterprise/templates/email-templates" className="text-[#1976D2] font-bold hover:underline" target="_blank" rel="noreferrer">{tr("automation.createOne")}</a> {tr("automation.firstWord")}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="mail-email-template"
                        value={form.template_id}
                        onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
                        className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                      >
                        <option value="">{tr("automation.selectTemplate")}</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Toggles Group */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px] transition-all hover:border-[#BBDEFB]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-[#E0E0E0]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#212121]">{tr("automation.enableAutomation")}</p>
                        <p className="text-[11px] text-[#9E9E9E] font-medium">{tr("automation.turnRulesOnOff")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_enabled ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px] transition-all hover:border-[#BBDEFB]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-[#E0E0E0]">
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#212121]">{tr("automation.sendImmediately")}</p>
                        <p className="text-[11px] text-[#9E9E9E] font-medium">{tr("automation.autoSendRoundChange")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setForm((f) => ({ ...f, is_immediate: !f.is_immediate }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_immediate ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_immediate ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {!form.is_immediate && (
                    <div className="animate-in slide-in-from-top-2 duration-200 px-1">
                      <label htmlFor="mail-scheduled-datetime" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                        {tr("automation.scheduledDateTime")} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="mail-scheduled-datetime"
                        type="datetime-local"
                        value={form.send_at}
                        onChange={(e) => setForm((f) => ({ ...f, send_at: e.target.value }))}
                        className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 text-[13.5px] font-semibold text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px] transition-all hover:border-[#BBDEFB]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-[#E0E0E0]">
                        <ChevronRight className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#212121]">{tr("automation.autoMove")}</p>
                        <p className="text-[11px] text-[#9E9E9E] font-medium">{tr("automation.advanceNextRound")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.auto_move ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA]/50 shrink-0 flex flex-col gap-3">
                {formError && (
                  <div className="flex items-start gap-2.5 rounded-[4px] border border-rose-200 bg-rose-50 px-3.5 py-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] font-semibold text-rose-700 leading-relaxed">{formError}</p>
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-[#1976D2] text-white rounded-[4px] text-[13.5px] font-semibold hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-all active:scale-95 disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4.5 h-4.5" />
                      {editingId ? tr("automation.saveChangesCaps") : tr("automation.createAutomationCaps")}
                    </>
                  )}
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
        title={tr("automation.deleteMailTitle")}
        message={tr("automation.deleteMailMsg", { job: automationToDelete ? jobTitle(automationToDelete.job_requirement_id) : tr("automation.thisJob") })}
        confirmLabel={tr("automation.yesDelete")}
        cancelLabel={tr("automation.no")}
        isDestructive={true}
      />
    </div>
  );
}
