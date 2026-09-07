"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { GenLanguage, localeToLanguageName } from "@/i18n/config";
import GenLanguageSelect from "@/components/ds/GenLanguageSelect";
import { BACKEND_URL } from "@/utils/api";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ds";

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

interface Question {
  id?: string;
  type?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  title?: string;
  problem_statement?: string;
  difficulty?: string;
}

interface FormState {
  job_requirement_id: string;
  stage_index: number;
  stage_name: string;
  is_enabled: boolean;
  auto_move: boolean;
  is_immediate: boolean;
  send_at: string;
  criteria: string;
  template_id: string;
  email_template_id: string;
  assessment_type: string;
  topic: string;
  question_count: number;
  test_duration: number;
  generated_questions: Question[] | null;
  // Optional: raw assessment kind from API payload (e.g. 'APTITUDE', 'CODING')
  type?: string;
  start_time: string;
  end_time: string;
  duration: string;
  daily_limit: number;
  interviewer_email: string;
  time_slots: string[];
  start_date: string;
  end_date: string;
  google_meet_link: string;
  interview_type: string;
  interview_template_id: string;
}

interface Template {
  id: string;
  // Interview templates expose `title`; other template types use `name`.
  name?: string;
  title?: string;
  // Assessment templates carry these extra fields.
  type?: string;
  topic?: string;
  question_count?: number;
  test_duration?: number;
}

interface AutomationNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  jobId: string;
  jobs: Job[];
  type: "mail" | "assessment" | "interview" | "onboarding";
  editingId?: string | null;
  initialData?: Partial<FormState> | null;
}

export default function AutomationNodeModal({
  isOpen,
  onClose,
  onSave,
  jobId,
  jobs,
  type,
  editingId = null,
  initialData = null,
}: AutomationNodeModalProps) {
  const { token } = useAuth();
  const { t: tr, locale } = useI18n();
  const [genLang, setGenLang] = useState<GenLanguage>(localeToLanguageName(locale));
  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const EMPTY_FORM: FormState = {
    job_requirement_id: jobId,
    stage_index: 0,
    stage_name: "",
    is_enabled: true,
    auto_move: false,
    is_immediate: true,
    send_at: "",
    criteria: "",
    template_id: "",
    email_template_id: "",
    assessment_type: "APTITUDE",
    topic: "",
    question_count: 10,
    test_duration: 30,
    generated_questions: null,
    start_time: "09:00",
    end_time: "17:00",
    duration: "30",
    daily_limit: 5,
    interviewer_email: "",
    time_slots: [],
    start_date: "",
    end_date: "",
    google_meet_link: "",
    interview_type: "GMEET",
    interview_template_id: "",
  };

  // Unified Form State
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<"config" | "sub">("config");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Template States
  const [emailTemplates, setEmailTemplates] = useState<Template[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<Template[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<Template[]>([]);
  const [interviewTemplates, setInterviewTemplates] = useState<Template[]>([]);

  const fetchMeta = useCallback(async () => {
    if (!token) return;
    try {
      const eRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates/`, { headers: authHeaders });
      if (eRes.ok) setEmailTemplates(await eRes.json());

      if (type === "onboarding") {
        const oRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`, { headers: authHeaders });
        if (oRes.ok) setOnboardingTemplates(await oRes.json());
      }
      if (type === "assessment") {
        const aRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/`, { headers: authHeaders });
        if (aRes.ok) setAssessmentTemplates(await aRes.json());
      }
      if (type === "interview") {
        const iRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/`, { headers: authHeaders });
        if (iRes.ok) setInterviewTemplates(await iRes.json());
      }
    } catch (err) {
      console.error("Meta fetch error:", err);
    }
  }, [token, authHeaders, type]);

  useEffect(() => {
    if (isOpen) {
      if (editingId && initialData) {
        setForm({
          ...EMPTY_FORM,
          ...initialData,
          job_requirement_id: initialData.job_requirement_id ?? "",
          // If it's an assessment, 'type' contains 'APTITUDE', 'CODING', etc.
          assessment_type: initialData.type || "APTITUDE",
          send_at: initialData.send_at ? new Date(initialData.send_at).toISOString().slice(0, 16) : "",
          template_id: initialData.template_id || "",
          email_template_id: initialData.email_template_id || "",
          criteria: initialData.criteria || "",
          generated_questions: initialData.generated_questions || null,
          time_slots: initialData.time_slots || [],
        });
      } else {
        setForm({ ...EMPTY_FORM, job_requirement_id: jobId });
      }
      setActiveTab("config");
      fetchMeta();
    }
  }, [isOpen, editingId, initialData, jobId, fetchMeta]);

  // Assessment Question Generation
  const handleGeneratePreview = async () => {
    if (!form.topic?.trim()) {
      showToast(tr("automation.enterTopicAssessment"), "error");
      return;
    }

    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast(tr("automation.scheduledTimePast"), "error");
        return;
      }
    }
    setLoading(true);
    try {
      const qs = `type=${form.assessment_type}&topic=${encodeURIComponent(form.topic)}&count=${form.question_count}&language=${encodeURIComponent(genLang)}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/generate-preview?${qs}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        const questions = await res.json();
        setForm((f: FormState) => ({ ...f, generated_questions: questions }));
        setActiveTab("sub"); // Switch to questions tab
        showToast(tr("automation.questionsGenerated"));
      } else {
        showToast(tr("automation.failedGenerateQuestions"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Interview Slot Generation
  const handleGenerateTimeSlots = () => {
    const limit = Number(form.daily_limit);
    if (!limit || limit <= 0) {
      showToast(tr("automation.setDailyLimitPositive"), "error");
      return;
    }
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
    setForm((f: FormState) => ({ ...f, time_slots: slots }));
    setActiveTab("sub"); // Switch to slots tab
    showToast(tr("automation.timeSlotsGenerated"));
  };

  const showToast = (msg: string | { msg?: string; detail?: string } | Array<{ msg?: string } | string>, type: "success" | "error" = "success") => {
    let finalMsg = "";
    if (typeof msg === "string") {
      finalMsg = msg;
    } else if (Array.isArray(msg)) {
      finalMsg = msg.map((e: { msg?: string } | string) => (typeof e === 'object' ? e.msg : e) || JSON.stringify(e)).join(", ");
    } else if (msg && typeof msg === "object") {
      finalMsg = msg.msg || msg.detail || JSON.stringify(msg);
    } else {
      finalMsg = String(msg || tr("automation.errorOccurred"));
    }
    setToast({ msg: finalMsg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const selectedJob = jobs.find((j) => j.id === form.job_requirement_id);
  const jobRounds: WorkflowStage[] = selectedJob?.workflow_stages ?? [];

  const roundValue = useMemo(() => {
    if (!form.stage_index) return "";
    const currentName = form.stage_name || "";
    const match = jobRounds.find((r, i) => (i + 1) === Number(form.stage_index) && r.name === currentName);
    if (match) return `${form.stage_index}|${currentName}`;
    const indexMatch = jobRounds.find((r, i) => (i + 1) === Number(form.stage_index));
    if (indexMatch) return `${form.stage_index}|${indexMatch.name}`;
    return "";
  }, [form.stage_index, form.stage_name, jobRounds]);

  const handleRoundSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setForm((f: FormState) => ({ ...f, stage_index: 0, stage_name: "" }));
      return;
    };
    const [idxStr, ...nameParts] = val.split("|");
    setForm((f: FormState) => ({ ...f, stage_index: Number(idxStr), stage_name: nameParts.join("|") }));
  };

  const handleSave = async () => {
    if (!form.job_requirement_id || form.job_requirement_id === "undefined") {
      showToast(tr("automation.selectTargetJob"), "error");
      return;
    }

    if (type !== 'onboarding' && (!form.criteria || !form.criteria.trim())) {
      showToast(tr("automation.fillTriggerCondition"), "error");
      return;
    }
    // A round must be connected — stage_index defaults to 0, which matches no round, so an
    // unconnected automation would save orphaned (silently vanishes on refetch).
    if (Number(form.stage_index) < 1) {
      showToast(tr("automation.connectToRound"), "error");
      return;
    }
    if (type === "interview") {
      // Dates are required, but `new Date("")` is Invalid Date and every comparison against it is
      // false, so blank dates previously slipped through. Compare ISO strings in local time (the
      // old Date()-vs-local-midnight compare also mis-rejected "today" in negative-offset zones).
      if (!form.start_date || !form.end_date) {
        showToast(tr("automation.setInterviewDates"), "error");
        return;
      }
      if (form.start_date < new Date().toLocaleDateString("en-CA")) {
        showToast(tr("automation.startDatePast"), "error");
        return;
      }
      if (form.end_date < form.start_date) {
        showToast(tr("automation.availableToAfterFrom"), "error");
        return;
      }
      if (form.interview_type === "AI" && !form.interview_template_id) {
        showToast(tr("automation.selectAiTemplateMsg"), "error");
        return;
      }
      if (form.interview_type === "GMEET" && !form.interviewer_email?.trim()) {
        showToast(tr("automation.provideInterviewerEmail"), "error");
        return;
      }
    }

    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast(tr("automation.scheduledTimePast"), "error");
        return;
      }
    }

    setSaving(true);
    try {
      let endpoint = "";
      let payload: Record<string, unknown> = {
        job_requirement_id: form.job_requirement_id,
        stage_index: Number(form.stage_index),
        stage_name: form.stage_name.trim() || null,
        is_enabled: form.is_enabled,
      };

      if (type === "mail") {
        if (!form.template_id) throw new Error(tr("automation.templateRequired"));
        endpoint = editingId ? `/api/v1/enterprise/automation/mail/${editingId}` : "/api/v1/enterprise/automation/mail/";
        payload = { 
          ...payload, 
          criteria: form.criteria, 
          template_id: form.template_id, 
          auto_move: form.auto_move, 
          is_immediate: form.is_immediate, 
          send_at: form.is_immediate || !form.send_at ? null : new Date(form.send_at).toISOString() 
        };
      } 
      else if (type === "assessment") {
        if (!form.topic.trim()) throw new Error(tr("automation.topicRequired"));
        endpoint = editingId ? `/api/v1/enterprise/assessment/${editingId}` : "/api/v1/enterprise/assessment/";
        payload = { 
          ...payload, 
          criteria: form.criteria || "Assessment Trigger", 
          type: form.assessment_type, 
          topic: form.topic, 
          question_count: Number(form.question_count), 
          test_duration: Number(form.test_duration), 
          email_template_id: form.email_template_id || null, 
          is_immediate: form.is_immediate, 
          auto_move: form.auto_move, 
          send_at: form.is_immediate || !form.send_at ? null : new Date(form.send_at).toISOString(),
          template_id: form.template_id || null,
          generated_questions: form.generated_questions || null 
        };
      } 
      else if (type === "interview") {
        let finalTimeSlots = form.time_slots || [];
        if (finalTimeSlots.length === 0) {
          const limit = Number(form.daily_limit);
          if (limit > 0 && form.start_time && form.end_time) {
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

        endpoint = editingId ? `/api/v1/enterprise/interview-automation/${editingId}` : "/api/v1/enterprise/interview-automation/";
        payload = { 
          ...payload, 
          criteria: form.criteria || "Interview Trigger", 
          email_template_id: form.email_template_id || null, 
          auto_move: form.auto_move, 
          duration: Number(form.duration) || 30, 
          daily_limit: Number(form.daily_limit), 
          interviewer_email: form.interviewer_email?.trim() || null, 
          google_meet_link: form.google_meet_link?.trim() || null, 
          start_date: form.start_date || null, 
          end_date: form.end_date || null, 
          start_time: form.start_time,
          end_time: form.end_time,
          time_slots: finalTimeSlots.length > 0 ? finalTimeSlots : null,
          interview_type: form.interview_type, 
          interview_template_id: form.interview_type === "AI" ? form.interview_template_id : null 
        };
      } 
      else if (type === "onboarding") {
        if (!form.template_id) throw new Error(tr("automation.onboardingTemplateRequired"));
        endpoint = editingId ? `/api/v1/enterprise/onboarding-automation/${editingId}` : "/api/v1/enterprise/onboarding-automation/";
        payload = { 
          ...payload, 
          template_id: form.template_id, 
          email_template_id: form.email_template_id || null,
          auto_move: form.auto_move
        };
      }

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: editingId ? "PATCH" : "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingId ? tr("automation.automationUpdated") : tr("automation.automationCreated"));
        setTimeout(() => {
          onSave();
          onClose();
        }, 800);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || tr("automation.failedCreateAutomation"));
      }
    } catch (err) {
      const error = err as Error;
      showToast(error.message || tr("automation.errorOccurred"), "error");
    } finally {
      setSaving(false);
    }
  };

  const headerMeta = useMemo(() => {
    switch (type) {
      case "mail": return { title: tr("automation.mailAction"), icon: "mark_email_unread", color: "#1976D2", bg: "#eef2ff" };
      case "assessment": return { title: tr("automation.assessmentAction"), icon: "psychology", color: "#FB8C00", bg: "#fffbeb" };
      case "interview": return { title: tr("automation.interviewAction"), icon: "event_available", color: "#43A047", bg: "#ecfdf5" };
      case "onboarding": return { title: tr("automation.onboardingAction"), icon: "person_add", color: "#a855f7", bg: "#faf5ff" };
    }
  }, [type, tr]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {toast && (
            <div className={`fixed top-5 right-5 z-[500] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
              <Icon name={toast.type === "success" ? "check_circle" : "error"} className="text-base" />
              {String(toast.msg)}
            </div>
          )}
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col pointer-events-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] flex items-center justify-center border border-current shadow-sm" style={{ backgroundColor: headerMeta.bg, color: headerMeta.color }}>
                  <Icon name={headerMeta.icon} className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold text-[#212121] leading-tight">{editingId ? tr("automation.editAction") : tr("automation.createAction")}</h2>
                  <p className="text-[11.5px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: headerMeta.color }}>{headerMeta.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="w-9 h-9 rounded-[4px] hover:bg-[#F5F6F8] flex items-center justify-center text-[#757575] transition-colors border border-[#E0E0E0]">
                  <i className="mdi mdi-close text-lg" />
                </button>
              </div>
            </div>

            {/* Tabs (Only for Assessment/Interview) */}
            {(type === "assessment" || type === "interview") && (
              <div className="flex border-b border-[#E0E0E0] shrink-0 bg-white px-6">
                <button
                  onClick={() => setActiveTab("config")}
                  className={`px-6 py-3 text-[12px] font-bold transition-all border-b-2 ${activeTab === "config" ? "border-[#1976D2] text-[#1976D2]" : "border-transparent text-[#757575] hover:text-[#212121]"}`}
                >
                  {tr("automation.configurationStep")}
                </button>
                <button
                  onClick={() => setActiveTab("sub")}
                  className={`px-6 py-3 text-[12px] font-bold transition-all border-b-2 ${activeTab === "sub" ? "border-[#1976D2] text-[#1976D2]" : "border-transparent text-[#757575] hover:text-[#212121]"}`}
                >
                  {type === "assessment" ? tr("automation.questionsTab", { count: form.generated_questions?.length || 0 }) : tr("automation.timeSlotsTab", { count: form.time_slots?.length || 0 })}
                </button>
              </div>
            )}

            <div className="relative flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
              {activeTab === "config" ? (
                <>
                  {loading && (
                    <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1976D2] rounded-full animate-spin" />
                        <p className="text-[11.5px] font-bold text-[#757575] tracking-wider uppercase">{tr("automation.loadingData")}</p>
                      </div>
                    </div>
                  )}
                  {/* Job Info */}
                  <div className="opacity-70">
                    <label htmlFor="automation-target-job" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.targetJob")}</label>
                    <div id="automation-target-job" className="w-full h-11 flex items-center bg-[#F5F6F8]/80 border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] font-semibold text-[#757575]">
                      {selectedJob?.title || tr("automation.noJobSelected")}
                    </div>
                  </div>

                  {/* Round Selection */}
                  <div>
                    <label htmlFor="automation-round-select" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.connectToRoundLabel")} <span className="text-red-400">*</span></label>
                    {jobRounds.length > 0 ? (
                      <select
                        id="automation-round-select"
                        value={roundValue}
                        onChange={handleRoundSelect}
                        className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer"
                      >
                        <option value="" className="text-slate-900 bg-white">{tr("automation.selectStage")}</option>
                        {jobRounds.map((r, i) => <option key={i} value={`${i + 1}|${r.name}`} className="text-slate-900 bg-white">{tr("automation.stageColon", { index: i + 1, name: r.name })}</option>)}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" min={1} value={form.stage_index || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, stage_index: Number(e.target.value) }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" placeholder={tr("automation.idxPlaceholder")} />
                        <input type="text" value={form.stage_name || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, stage_name: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" placeholder={tr("automation.stageNamePlaceholder")} />
                      </div>
                    )}
                  </div>

                  {/* Trigger Criteria */}
                  {type !== "onboarding" && (
                    <div>
                      <label htmlFor="automation-trigger-criteria" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.triggerConditionLabel")} {type === "mail" && <span className="text-red-400">*</span>}</label>
                      <textarea
                        id="automation-trigger-criteria"
                        value={form.criteria || ""}
                        onChange={(e) => setForm((f: FormState) => ({ ...f, criteria: e.target.value }))} 
                        className="w-full px-3.5 py-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all resize-none" 
                        rows={3}
                        placeholder={tr("automation.criteriaPlaceholderScore")}
                      />
                      <p className="text-[11px] text-[#757575] mt-1.5 ml-0.5">{tr("automation.clearConditionsHelp")}</p>
                    </div>
                  )}

                  {/* ACTION SPECIFIC FIELDS */}
                  <div className="space-y-6 pt-2">
                    
                    {/* MAIL Action */}
                    {type === "mail" && (
                      <div>
                        <label htmlFor="automation-email-template" className="block text-[11.5px] font-bold text-[#1976D2] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.emailTemplate")} <span className="text-red-400">*</span></label>
                        <select id="automation-email-template" value={form.template_id || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, template_id: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                          <option value="" className="text-slate-900 bg-white">{tr("automation.selectTemplateEllipsis")}</option>
                          {emailTemplates.map((t: Template) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                        </select>
                      </div>
                    )}

                    {/* ASSESSMENT Action */}
                    {type === "assessment" && (
                      <>
                        <div className="bg-[#FFF3E0]/50 p-4 rounded-[4px] border border-[#FFE0B2] shadow-sm">
                          <label htmlFor="automation-assessment-template" className="block text-[11.5px] font-bold text-[#EF6C00] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.useTemplateOptional")}</label>
                          <select
                            id="automation-assessment-template"
                            value={form.template_id || ""}
                            onChange={(e) => {
                              const templateId = e.target.value;
                              if (templateId) {
                                const templ = assessmentTemplates.find(t => t.id === templateId);
                                if (templ) {
                                  setForm((f: FormState) => ({ ...f, template_id: templateId, assessment_type: templ.type as string, topic: templ.topic as string, question_count: templ.question_count as number, test_duration: templ.test_duration as number }));
                                } else {
                                  setForm((f: FormState) => ({ ...f, template_id: "" }));
                                }
                              } else {
                                setForm((f: FormState) => ({ ...f, template_id: "" }));
                              }
                            }}
                            className="w-full h-10 px-3 rounded-[4px] border border-[#FFE0B2] bg-white text-[13.5px] font-medium text-[#424242] outline-none focus:border-[#EF6C00] focus:ring-2 focus:ring-[#EF6C00]/20 transition-all cursor-pointer"
                          >
                            <option value="" className="text-slate-900 bg-white">{tr("automation.customConfig")}</option>
                            {assessmentTemplates.map((t) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="automation-assessment-type" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.typeLabel")}</label>
                            <select id="automation-assessment-type" value={form.assessment_type || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, assessment_type: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                              <option value="APTITUDE" className="text-slate-900 bg-white">{tr("automation.aptitude")}</option>
                              <option value="CODING" className="text-slate-900 bg-white">{tr("automation.coding")}</option>
                              <option value="BOTH" className="text-slate-900 bg-white">{tr("automation.both")}</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="automation-topic" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.topicLabel")} <span className="text-red-400">*</span></label>
                            <input id="automation-topic" type="text" value={form.topic || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, topic: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" placeholder={tr("automation.topicPlaceholder")} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="automation-question-count" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.questionsLabel")}</label>
                            <input id="automation-question-count" type="number" value={form.question_count || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, question_count: Number(e.target.value) }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                          <div>
                            <label htmlFor="automation-test-duration" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.durationMin")}</label>
                            <input id="automation-test-duration" type="number" value={form.test_duration || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, test_duration: Number(e.target.value) }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="automation-assessment-email-template" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.inviteEmailTemplate")}</label>
                          <select id="automation-assessment-email-template" value={form.email_template_id || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, email_template_id: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                            <option value="" className="text-slate-900 bg-white">{tr("automation.defaultInviteEmail")}</option>
                            {emailTemplates.map((t: Template) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>

                        <div className="pt-2 flex items-center justify-end mb-2">
                          <GenLanguageSelect value={genLang} onChange={setGenLang} />
                        </div>
                        <div>
                          <button
                            onClick={handleGeneratePreview}
                            disabled={loading}
                            className="w-full h-11 bg-[#1976D2] text-white rounded-[4px] text-[13px] font-semibold hover:bg-[#1565C0] shadow-md shadow-[#1976D2]/15 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#1976D2]/20 disabled:opacity-50"
                          >
                             {loading ? (
                               <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             ) : (
                               <i className="mdi mdi-auto-fix text-lg" />
                             )}
                             {form.generated_questions?.length ? tr("automation.regenerateDraftAI") : tr("automation.draftQuestionsAI")}
                          </button>
                        </div>
                      </>
                    )}

                    {/* INTERVIEW Action */}
                    {type === "interview" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="automation-interview-type" className="block text-[11.5px] font-bold text-[#2E7D32] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.interviewType")}</label>
                            <select id="automation-interview-type" value={form.interview_type || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, interview_type: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                              <option value="GMEET" className="text-slate-900 bg-white">Google Meet</option>
                              <option value="AI" className="text-slate-900 bg-white">{tr("automation.aiInterview")}</option>
                            </select>
                          </div>
                          {form.interview_type === "AI" && (
                            <div>
                               <div className="flex items-center justify-between mb-2 ml-0.5">
                                 <label htmlFor="automation-interview-template" className="block text-[11.5px] font-bold text-[#2E7D32] uppercase tracking-wider">{tr("automation.aiTemplate")}</label>
                                 <button
                                   onClick={() => window.open('/enterprise/templates/interview-templates', '_blank')}
                                   className="text-[11px] font-semibold text-[#1976D2] hover:underline"
                                 >
                                   + {tr("automation.createNew")}
                                 </button>
                               </div>
                              <select id="automation-interview-template" value={form.interview_template_id || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, interview_template_id: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                                <option value="" className="text-slate-900 bg-white">{tr("automation.selectAiTemplateOption")}</option>
                                {interviewTemplates.map((t: Template) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.title || t.name || tr("automation.untitledTemplate")}</option>)}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="automation-start-date" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.availableFrom")} <span className="text-red-400">*</span></label>
                            <input id="automation-start-date" type="date" value={form.start_date || ""} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm((f: FormState) => ({ ...f, start_date: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                          <div>
                            <label htmlFor="automation-end-date" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.availableTo")} <span className="text-red-400">*</span></label>
                            <input id="automation-end-date" type="date" value={form.end_date || ""} min={form.start_date || new Date().toISOString().split('T')[0]} onChange={(e) => setForm((f: FormState) => ({ ...f, end_date: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label htmlFor="automation-start-time" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.startShort")} <span className="text-red-400">*</span></label>
                            <input id="automation-start-time" type="time" value={form.start_time || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, start_time: e.target.value }))} className="w-full h-11 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[13.5px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                          <div>
                            <label htmlFor="automation-end-time" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.endShort")} <span className="text-red-400">*</span></label>
                            <input id="automation-end-time" type="time" value={form.end_time || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, end_time: e.target.value }))} className="w-full h-11 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[13.5px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                          <div>
                            <label htmlFor="automation-interview-duration" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.duration")} <span className="text-red-400">*</span></label>
                            <select id="automation-interview-duration" value={form.duration || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, duration: e.target.value }))} className="w-full h-11 px-2 rounded-[4px] border border-[#E0E0E0] bg-white text-[13.5px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                              <option value="15" className="text-slate-900 bg-white">15m</option>
                              <option value="30" className="text-slate-900 bg-white">30m</option>
                              <option value="45" className="text-slate-900 bg-white">45m</option>
                              <option value="60" className="text-slate-900 bg-white">60m</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="automation-daily-limit" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.limitShort")} <span className="text-red-400">*</span></label>
                            <input id="automation-daily-limit" type="number" min={1} value={form.daily_limit || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, daily_limit: Number(e.target.value) }))} className="w-full h-11 px-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[13.5px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="automation-interviewer-email" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.interviewerEmail")}</label>
                            <input
                              id="automation-interviewer-email"
                              type="email"
                              value={form.interviewer_email || ""} 
                              onChange={(e) => setForm((f: FormState) => ({ ...f, interviewer_email: e.target.value }))} 
                              className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" 
                              placeholder="johndoe@email.com"
                            />
                          </div>
                          <div>
                            <label htmlFor="automation-interview-email-template" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.inviteTemplate")}</label>
                            <select id="automation-interview-email-template" value={form.email_template_id || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, email_template_id: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                              <option value="" className="text-slate-900 bg-white">{tr("automation.defaultInvite")}</option>
                              {emailTemplates.map((t: Template) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="pt-2">
                           <button
                             onClick={handleGenerateTimeSlots}
                             className="w-full h-11 bg-[#1976D2] text-white rounded-[4px] text-[13px] font-semibold hover:bg-[#1565C0] shadow-md shadow-[#1976D2]/15 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#1976D2]/20"
                           >
                              <i className="mdi mdi-clock-outline text-lg" />
                              {tr("automation.nextConfigureTimeSlots")}
                           </button>
                        </div>
                      </>
                    )}

                    {/* ONBOARDING Action */}
                    {type === "onboarding" && (
                      <>
                        <div>
                          <label htmlFor="automation-onboarding-template" className="block text-[11.5px] font-bold text-[#42A5F5] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.onboardingTemplate")} <span className="text-red-400">*</span></label>
                          <select id="automation-onboarding-template" value={form.template_id || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, template_id: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                            <option value="" className="text-slate-900 bg-white">{tr("automation.selectTemplateEllipsis")}</option>
                            {onboardingTemplates.map((t: Template) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="automation-onboarding-email-template" className="block text-[11.5px] font-bold text-[#42A5F5] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.introEmailTemplate")}</label>
                          <select id="automation-onboarding-email-template" value={form.email_template_id || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, email_template_id: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer">
                            <option value="" className="text-slate-900 bg-white">{tr("automation.noIntroEmail")}</option>
                            {emailTemplates.map((t: Template) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* AUTOMATION SETTINGS (Common) */}
                  <div className="pt-6 border-t border-[#E0E0E0] flex flex-col gap-4">
                    <span className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-1 ml-0.5">{tr("automation.automationLogic")}</span>
                    
                    <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px]">
                        <div>
                          <p className="text-[14px] font-bold text-[#212121]">{tr("automation.enabledStatus")}</p>
                          <p className="text-[11px] text-[#757575] mt-0.5">{tr("automation.triggerAutomationsDesc")}</p>
                        </div>
                        <button onClick={() => setForm((f: FormState) => ({ ...f, is_enabled: !f.is_enabled }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_enabled ? "bg-[#1976D2]" : "bg-slate-200"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_enabled ? "translate-x-5" : ""}`} />
                        </button>
                    </div>

                    {(type === "mail" || type === "assessment" || type === "interview" || type === "onboarding") && (
                      <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px]">
                          <div>
                            <p className="text-[14px] font-bold text-[#212121]">{tr("automation.autoMoveCandidate")}</p>
                            <p className="text-[11px] text-[#757575] mt-0.5">{tr("automation.advanceAfterTrigger")}</p>
                          </div>
                          <button onClick={() => setForm((f: FormState) => ({ ...f, auto_move: !f.auto_move }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.auto_move ? "bg-[#1976D2]" : "bg-slate-200"}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.auto_move ? "translate-x-5" : ""}`} />
                          </button>
                      </div>
                    )}

                    {(type === "mail" || type === "assessment") && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px]">
                            <div>
                              <p className="text-[14px] font-bold text-[#212121]">{tr("automation.scheduleMode")}</p>
                              <p className="text-[11px] text-[#757575] mt-0.5">{form.is_immediate ? tr("automation.immediateExecution") : tr("automation.scheduledExecution")}</p>
                            </div>
                            <button onClick={() => setForm((f: FormState) => ({ ...f, is_immediate: !f.is_immediate }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_immediate ? "bg-[#1976D2]" : "bg-slate-200"}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_immediate ? "translate-x-5" : ""}`} />
                            </button>
                        </div>

                        {!form.is_immediate && (
                          <div className="px-1 animate-in slide-in-from-top-2 duration-300">
                              <label htmlFor="automation-send-at" className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.sendDateTime")}</label>
                              <input id="automation-send-at" type="datetime-local" value={form.send_at || ""} onChange={(e) => setForm((f: FormState) => ({ ...f, send_at: e.target.value }))} className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                   {type === "assessment" && (
                     <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                           <h3 className="text-[13px] font-bold text-[#212121]">{tr("automation.questionBank")}</h3>
                           <button 
                               onClick={() => {
                                 const newQ = form.assessment_type === 'CODING' ? {
                                   id: crypto.randomUUID(),
                                   type: 'CODING',
                                   title: tr("automation.newCodingTask"),
                                   problem_statement: '',
                                   difficulty: 'Medium'
                                 } : {
                                   id: crypto.randomUUID(),
                                   type: 'APTITUDE',
                                   question: tr("automation.newQuestion"),
                                   options: ['', '', '', ''],
                                   correct_answer: '',
                                   explanation: ''
                                 };
                                 setForm((f: FormState) => ({ ...f, generated_questions: [...(f.generated_questions || []), newQ] }));
                               }}
                               className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-[4px] text-[12px] font-semibold text-[#1976D2] hover:bg-[#1976D2] hover:text-white transition-all shadow-sm"
                             >
                               <i className="mdi mdi-plus text-sm" />
                               {tr("automation.addQuestion")}
                             </button>
                        </div>
                        {(!form.generated_questions || form.generated_questions.length === 0) ? (
                          <div className="py-12 flex flex-col items-center justify-center bg-[#FAFAFA]/50 rounded-[4px] border-2 border-dashed border-[#E0E0E0]">
                             <i className="mdi mdi-auto-fix text-[#9E9E9E] text-3xl mb-2" />
                             <p className="text-[13px] font-semibold text-[#757575]">{tr("automation.noQuestionsYet")}</p>
                             <button onClick={() => setActiveTab("config")} className="mt-2 text-[12px] text-[#1976D2] font-bold hover:underline">{tr("automation.goToConfigGenerate")}</button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                             {form.generated_questions.map((q: Question, i: number) => (
                               <div key={q.id || i} className="bg-white border border-[#E0E0E0] rounded-[4px] p-6 shadow-sm hover:shadow-md transition-all relative group">
                                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-[#1976D2] text-white rounded-[4px] flex items-center justify-center font-bold shadow-md text-xs">#{i + 1}</div>
                                  
                                  <div className="flex justify-between gap-2 mb-4">
                                     <span className="text-[11px] font-bold text-[#757575] uppercase tracking-wider ml-6">
                                       {tr("automation.taskLabel", { type: q.type || form.assessment_type })}
                                     </span>
                                     <button 
                                       onClick={() => {
                                         setForm((f: FormState) => ({ ...f, generated_questions: (f.generated_questions || []).filter((_: Question, idx: number) => idx !== i) }));
                                       }}
                                       className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#E53935] hover:bg-[#FFEBEE] transition-all opacity-0 group-hover:opacity-100"
                                     >
                                         <i className="mdi mdi-delete text-base" />
                                     </button>
                                  </div>

                                  <div className="space-y-4">
                                    {(q.type === 'APTITUDE' || (!q.type && form.assessment_type === 'APTITUDE')) ? (
                                      <>
                                        <div>
                                          <label htmlFor={`automation-question-text-${i}`} className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.questionText")}</label>
                                          <textarea
                                            id={`automation-question-text-${i}`}
                                            value={q.question}
                                            onChange={(e) => {
                                              const newQs = [...(form.generated_questions ?? [])];
                                              newQs[i].question = e.target.value;
                                              setForm((f: FormState) => ({ ...f, generated_questions: newQs }));
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all h-20 resize-none font-medium"
                                            placeholder={tr("automation.enterQuestionText")}
                                          />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {(q.options || []).map((opt: string, optIdx: number) => (
                                            <div key={optIdx} className="relative">
                                              <input 
                                                value={opt} 
                                                onChange={(e) => {
                                                  const newQs = [...(form.generated_questions ?? [])];
                                                  newQs[i]!.options![optIdx] = e.target.value;
                                                  setForm((f: FormState) => ({ ...f, generated_questions: newQs }));
                                                }}
                                                className={`w-full h-11 pl-11 pr-4 rounded-[4px] border-2 text-[13.5px] font-semibold transition-all ${q.correct_answer === opt ? "border-[#1976D2] bg-[#E3F2FD]/50 text-[#1976D2]" : "border-[#E0E0E0] bg-white text-[#424242] focus:border-[#1976D2]"}`}
                                                placeholder={tr("automation.optionN", { n: optIdx + 1 })}
                                              />
                                              <button 
                                                onClick={() => {
                                                  const newQs = [...(form.generated_questions ?? [])];
                                                  newQs[i].correct_answer = opt;
                                                  setForm((f: FormState) => ({ ...f, generated_questions: newQs }));
                                                }}
                                                className={`absolute left-3 top-3 w-5 h-5 rounded-[3px] flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#1976D2] text-white" : "bg-slate-100 text-[#757575] hover:bg-slate-200"}`}
                                              >
                                                <Icon name={q.correct_answer === opt ? "check" : "circle"} className="text-xs" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div>
                                          <label htmlFor={`automation-problem-title-${i}`} className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.problemTitle")}</label>
                                          <input
                                            id={`automation-problem-title-${i}`}
                                            type="text"
                                            value={q.title || ''}
                                            onChange={(e) => {
                                              const newQs = [...(form.generated_questions ?? [])];
                                              newQs[i].title = e.target.value;
                                              setForm((f: FormState) => ({ ...f, generated_questions: newQs }));
                                            }}
                                            className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all font-medium"
                                            placeholder={tr("automation.problemTitlePlaceholder")}
                                          />
                                        </div>
                                        <div>
                                          <label htmlFor={`automation-problem-statement-${i}`} className="block text-[11.5px] font-bold text-[#757575] uppercase tracking-wider mb-2 ml-0.5">{tr("automation.problemStatement")}</label>
                                          <textarea
                                            id={`automation-problem-statement-${i}`}
                                            value={q.problem_statement || ''}
                                            onChange={(e) => {
                                              const newQs = [...(form.generated_questions ?? [])];
                                              newQs[i].problem_statement = e.target.value;
                                              setForm((f: FormState) => ({ ...f, generated_questions: newQs }));
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-[4px] border border-[#E0E0E0] bg-white text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all h-32 resize-none font-medium"
                                            placeholder={tr("automation.enterProblemDetails")}
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                             ))}
                          </div>
                        )}
                     </div>
                   )}

                   {type === "interview" && (
                     <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                           <h3 className="text-[13px] font-bold text-[#212121]">{tr("automation.timeSlots")}</h3>
                           <button 
                             onClick={() => {
                               const limit = Number(form.daily_limit) || 0;
                               if (limit > 0 && form.time_slots?.length >= limit) {
                                  showToast(tr("automation.dailyLimitReached", { limit }), "error");
                                  return;
                               }
                               setForm((f: FormState) => ({ ...f, time_slots: [...(f.time_slots || []), "09:00"] }));
                             }}
                             disabled={Number(form.daily_limit) > 0 && form.time_slots?.length >= Number(form.daily_limit)}
                             className="text-[12px] font-bold text-[#1976D2] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline"
                           >
                             {tr("automation.addSlotPlus")}
                           </button>
                        </div>
                        {(!form.time_slots || form.time_slots.length === 0) ? (
                          <div className="py-12 flex flex-col items-center justify-center bg-[#FAFAFA]/50 rounded-[4px] border-2 border-dashed border-[#E0E0E0]">
                             <i className="mdi mdi-clock-outline text-[#9E9E9E] text-3xl mb-2" />
                             <p className="text-[13px] font-semibold text-[#757575]">{tr("automation.noTimeSlotsGenerated")}</p>
                             <button onClick={handleGenerateTimeSlots} className="mt-2 text-[12px] text-[#1976D2] font-bold hover:underline">{tr("automation.autoGenerateSlotsPlain")}</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                             {form.time_slots.map((slot: string, i: number) => (
                               <div key={i} className="flex items-center gap-2 bg-[#FAFAFA]/50 border border-[#E0E0E0] rounded-[4px] p-2 group hover:border-[#1976D2]/50 transition-all">
                                  <input 
                                    type="time" 
                                    value={slot} 
                                    onChange={(e) => {
                                      const newSlots = [...form.time_slots];
                                      newSlots[i] = e.target.value;
                                      setForm((f: FormState) => ({ ...f, time_slots: newSlots }));
                                    }}
                                    className="bg-transparent border-none p-0 text-[13px] font-semibold text-[#212121] focus:ring-0 flex-1 outline-none cursor-pointer"
                                  />
                                  <button 
                                    onClick={() => {
                                      setForm((f: FormState) => ({ ...f, time_slots: (f.time_slots || []).filter((_: string, idx: number) => idx !== i) }));
                                    }}
                                    className="text-[#9E9E9E] hover:text-[#E53935] transition-colors"
                                  >
                                     <i className="mdi mdi-close text-[16px]" />
                                  </button>
                                </div>
                             ))} 
                          </div>
                        )} 
                        <div className="pt-4 mt-4 border-t border-[#E0E0E0]">
                           <button 
                             onClick={handleGenerateTimeSlots}
                             className="w-full h-11 bg-[#212121] hover:bg-[#263238] text-white rounded-[4px] text-[13px] font-semibold transition-all shadow-sm"
                           >
                              {tr("automation.refreshRegenerateSlots")}
                           </button>
                        </div>
                     </div>
                    )}
                  </div>
                )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA]/50 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-11 flex items-center justify-center gap-2 text-white rounded-[4px] text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 shadow-md"
                style={{ backgroundColor: headerMeta.color, boxShadow: `0 4px 12px -2px ${headerMeta.color}30` }}
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name={editingId ? "save" : "add_circle"} className="text-lg" />
                    {editingId ? tr("automation.updateNode", { type: type.toUpperCase() }) : tr("automation.addNode", { type: type.toUpperCase() })}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
