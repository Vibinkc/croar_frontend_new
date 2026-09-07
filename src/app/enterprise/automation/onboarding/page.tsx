"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { PageHelp } from "@/components/ds";
import {
  UserPlus,
  Plus,
  Layers,
  Activity,
  Sparkles,
  FileText,
  Search,
  Briefcase,
  ChevronDown,
  Mail,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle
} from "@/components/icons";

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
  stage_index: 1,
  stage_name: "",
  template_id: "",
  email_template_id: "",
  is_enabled: true,
  auto_move: false,
};

export default function OnboardingAutomationPage() {
  const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<OnboardingTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [automations, setAutomations] = useState<OnboardingAutomation[]>([]);
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
  const [automationToDelete, setAutomationToDelete] = useState<OnboardingAutomation | null>(null);
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
      } else {
        showToast(tr("automation.failedLoadAutomations"), "error");
      }
    } catch {
      showToast(tr("automation.failedLoadAutomations"), "error");
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
    setFormError(null);
    setForm({ ...EMPTY_FORM, job_requirement_id: selectedJobId });
    setShowModal(true);
  };

  const openEdit = (a: OnboardingAutomation) => {
    setEditingId(a.id);
    setFormError(null);
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
    setFormError(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    // Collect every missing required field — Trigger Stage was previously not
    // validated, so rules could be saved without picking a stage.
    const missing: string[] = [];
    if (!form.job_requirement_id) missing.push(tr("automation.jobRequirement"));
    // When the job has rounds, require an actual round pick (sets stage_name). Checking only
    // stage_index > 0 let the preselected default (1) pass with an empty stage_name.
    const stageMissing = jobRounds.length > 0 ? !form.stage_name : !String(form.stage_index).trim();
    if (stageMissing) missing.push(tr("automation.triggerStage"));
    if (!form.template_id) missing.push(tr("automation.onboardingTemplate"));

    if (missing.length > 0) {
      const msg = missing.length === 1
        ? tr("automation.fillRequiredField", { field: missing[0] })
        : tr("automation.fillRequiredFieldsList", { fields: missing.join(", ") });
      setFormError(msg);
      showToast(msg, "error");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        showToast(editingId ? tr("automation.automationUpdated") : tr("automation.automationCreated"));
        closeModal();
        fetchAutomations(selectedJobId || undefined);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = (typeof err?.detail === "string" && err.detail) || tr("automation.failedSaveOnboarding");
        setFormError(msg);
        showToast(msg, "error");
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
        showToast(tr("automation.failedUpdateStatus"), "error");
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

  const filteredAutomations = automations.filter(a => {
    const term = searchQuery.toLowerCase();
    return getTemplateName(a.template_id).toLowerCase().includes(term) ||
           getJobTitle(a.job_requirement_id).toLowerCase().includes(term) ||
           (a.stage_name && a.stage_name.toLowerCase().includes(term));
  });

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-[4px] shadow-lg text-[13.5px] font-semibold transition-all duration-300 ${
            toast.type === "success" ? "bg-[#1976D2] text-white" : "bg-rose-600 text-white"
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
      <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("automation.onboardingTitle")}</h1>
            <PageHelp title={tr("automation.onboardingTitle")}>
              <p>{tr("automation.onboardingSubtitle")}</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("automation.onboardingPageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {canAccess("onboarding:moderate") && (
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

      <div className="mb-10">

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: tr("automation.totalRules"), value: automations.length, Icon: Layers, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)" },
            { label: tr("automation.activeRules"), value: automations.filter(a => a.is_enabled).length, Icon: Activity, grad: "linear-gradient(135deg,#00C49F,#2E7D32)", glow: "rgba(46,125,50,0.25)" },
            { label: tr("automation.autoMoveRules"), value: automations.filter(a => a.auto_move).length, Icon: Sparkles, grad: "linear-gradient(135deg,#C084FC,#42A5F5)", glow: "rgba(66,165,245,0.25)" },
            { label: tr("automation.templatesUsed"), value: new Set(automations.map(a => a.template_id)).size, Icon: FileText, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)" }
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative bg-white border border-[#E0E0E0] hover:border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden transition-all duration-300 hover:shadow-sm"
            >
              <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{s.label}</span>
                  <div className="text-[30px] font-semibold tracking-[-1px] text-[#212121] mt-2">{s.value}</div>
                </div>
                <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
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
                placeholder={tr("automation.searchRulesJobsTemplates")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[13.5px] font-semibold text-slate-700 placeholder:text-slate-400 focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all outline-none shadow-sm"
              />
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              {(searchQuery || selectedJobId) && (
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedJobId(""); }}
                  className="text-[11px] font-extrabold text-[#1976D2] hover:underline px-2 tracking-wider cursor-pointer"
                >
                  {tr("automation.resetFilters")}
                </button>
              )}
              <div className="relative w-full md:w-64">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full h-11 border border-[#E0E0E0] rounded-[4px] pl-10 pr-10 text-[13px] font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] shadow-sm appearance-none cursor-pointer"
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
          <div className="w-8 h-8 border-[3px] border-[#1976D2] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-[4px] bg-[#F3F9FE] border border-[#EBE7FF] flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-[#42A5F5]" />
          </div>
          <p className="text-slate-800 font-bold text-[16px]">{searchQuery ? tr("automation.noMatchingRules") : tr("automation.noOnboardingAutomations")}</p>
          <p className="text-slate-400 text-[13px] mt-1 max-w-sm font-medium">
            {searchQuery ? tr("automation.noResultsFor", { query: searchQuery }) : tr("automation.createFirstOnboarding")}
          </p>
          {!searchQuery && canAccess("onboarding:moderate") && (
            <button
              onClick={openCreate}
              className="mt-5 px-5 h-11 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-bold shadow-[0_4px_12px_rgba(25,118,210,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              {tr("automation.createAutomation")}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.automationDetails")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.targetJob")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.onboardingTemplate")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("automation.status")}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em] text-right">{tr("automation.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {filteredAutomations.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFAFA]/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] bg-[#F3F9FE] text-[#42A5F5] text-[10px] font-bold border border-[#EBE7FF]/60 uppercase">
                            {tr("automation.stage")} {a.stage_index}
                          </span>
                          {a.stage_name && (
                            <span className="text-[12px] font-semibold text-[#757575]">{a.stage_name}</span>
                          )}
                        </div>
                        <p className="text-[13.5px] font-semibold text-[#424242] line-clamp-1">
                          <span className="text-[#757575] font-medium italic mr-1">{tr("automation.triggerLabel")}</span>
                          <span>{tr("automation.moveToStage")}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#424242]">
                        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{getJobTitle(a.job_requirement_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#424242]">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{getTemplateName(a.template_id)}</span>
                        </div>
                        {a.email_template_id && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1976D2] uppercase tracking-wider mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1976D2] text-[10px] font-bold border border-[#BBDEFB]/60 uppercase tracking-wider">
                              <Mail className="w-3 h-3 shrink-0 mr-0.5" />
                              {tr("automation.welcomeEmail")}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(a)}
                        disabled={togglingId === a.id || !canAccess("onboarding:moderate")}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${a.is_enabled ? "bg-[#42A5F5]" : "bg-[#E0E0E0]"} ${togglingId === a.id || !canAccess("onboarding:moderate") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${a.is_enabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canAccess("onboarding:moderate") && (
                          <button 
                            onClick={() => openEdit(a)} 
                            className="w-8 h-8 flex items-center justify-center rounded-[4px] border border-transparent hover:border-[#E0E0E0] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#1976D2] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canAccess("onboarding:moderate") && (
                          <button 
                            onClick={() => {
                              setAutomationToDelete(a);
                              setIsDeleteModalOpen(true);
                            }} 
                            disabled={deletingId === a.id} 
                            className="w-8 h-8 flex items-center justify-center rounded-[4px] border border-transparent hover:border-[#E0E0E0] hover:bg-rose-50 text-[#757575] hover:text-rose-600 transition-colors cursor-pointer"
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

      {/* Modal / Drawer */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex justify-end">
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
              className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col border-l border-[#E0E0E0]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[4px] bg-[#F3F9FE] flex items-center justify-center border border-[#EBE7FF] shadow-sm">
                    <UserPlus className="w-5 h-5 text-[#42A5F5]" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-[#212121] leading-tight">
                      {editingId ? tr("automation.editAutomation") : tr("automation.newAutomation")}
                    </h2>
                    <p className="text-[12.5px] text-[#757575] font-medium mt-0.5">{tr("automation.onboardingConfig")}</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-1.5 hover:bg-[#F5F6F8] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                {/* Job */}
                <div>
                  <label htmlFor="onboarding-job-requirement" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.jobRequirement")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="onboarding-job-requirement"
                      value={form.job_requirement_id}
                      onChange={(e) => setForm((f) => ({ ...f, job_requirement_id: e.target.value, stage_index: 0, stage_name: "" }))}
                      disabled={!!editingId}
                      className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm"
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
                  <label htmlFor="onboarding-trigger-stage" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.triggerStage")} <span className="text-rose-500">*</span>
                  </label>
                  {jobRounds.length > 0 ? (
                    <div className="relative">
                      <select
                        id="onboarding-trigger-stage"
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
                        className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                      >
                        <option value={0}>{tr("automation.pickStage")}</option>
                        {jobRounds.map((r, i) => (
                          <option key={i} value={i + 1}>
                            {tr("automation.stage")} {i + 1}: {r.name}
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
                        className="col-span-2 border border-[#E0E0E0] rounded-[4px] h-11 px-4 text-[13.5px] font-semibold text-[#424242] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all bg-white"
                        placeholder={tr("automation.idxPlaceholder")}
                      />
                      <input
                        type="text"
                        value={form.stage_name}
                        onChange={(e) => setForm((f) => ({ ...f, stage_name: e.target.value }))}
                        className="col-span-3 border border-[#E0E0E0] rounded-[4px] h-11 px-4 text-[13.5px] font-semibold text-[#424242] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all bg-white"
                        placeholder={tr("automation.stageNamePlaceholder")}
                      />
                    </div>
                  )}
                </div>

                {/* Onboarding Template */}
                <div>
                  <label htmlFor="onboarding-template" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.onboardingTemplate")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="onboarding-template"
                      value={form.template_id}
                      onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
                      className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                    >
                      <option value="">{tr("automation.selectTemplate")}</option>
                      {onboardingTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                  </div>
                </div>

                {/* Email Template */}
                <div>
                  <label htmlFor="onboarding-email-template" className="block text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-1">
                    {tr("automation.introEmailTemplate")}
                  </label>
                  <div className="relative">
                    <select
                      id="onboarding-email-template"
                      value={form.email_template_id}
                      onChange={(e) => setForm((f) => ({ ...f, email_template_id: e.target.value }))}
                      className="w-full bg-white border border-[#E0E0E0] rounded-[4px] h-11 px-4 pr-10 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
                    >
                      <option value="">{tr("automation.noEmailManual")}</option>
                      {emailTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                  </div>
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-[4px] border border-[#E0E0E0] transition-all hover:border-[#BBDEFB]">
                  <div>
                    <p className="text-[13.5px] font-bold text-[#212121]">{tr("automation.enableAutomation")}</p>
                    <p className="text-[11.5px] text-[#757575] font-semibold mt-0.5">{tr("automation.triggerOnboardingWhenMet")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_enabled: !f.is_enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.is_enabled ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                
                {/* Auto-Move Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-[4px] border border-[#E0E0E0] transition-all hover:border-[#BBDEFB]">
                  <div>
                    <p className="text-[13.5px] font-bold text-[#212121]">{tr("automation.autoMoveCandidate")}</p>
                    <p className="text-[11.5px] text-[#757575] font-semibold mt-0.5">{tr("automation.advanceCandidateAfter")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, auto_move: !f.auto_move }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${form.auto_move ? "bg-[#1976D2]" : "bg-[#E0E0E0]"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.auto_move ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA] shrink-0 space-y-3">
                {formError && (
                  <div className="flex items-start gap-2.5 rounded-[4px] border border-rose-200 bg-rose-50 px-3.5 py-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] font-semibold text-rose-700 leading-relaxed">{formError}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-[#1976D2] text-white rounded-[4px] text-[13.5px] font-bold hover:bg-[#1565C0] transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_12px_rgba(25,118,210,0.25)] cursor-pointer"
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
                  className="w-full mt-3 h-10 text-[12.5px] font-semibold text-[#757575] hover:text-[#4F4F4F] transition-colors cursor-pointer"
                >
                  {tr("common.cancel")}
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
        title={tr("automation.deleteOnboardingTitle")}
        message={tr("automation.deleteOnboardingMsg", { job: automationToDelete ? getJobTitle(automationToDelete.job_requirement_id) : tr("automation.thisJob") })}
        confirmLabel={tr("automation.yesDelete")}
        cancelLabel={tr("automation.no")}
        isDestructive={true}
      />
    </div>
  );
}
