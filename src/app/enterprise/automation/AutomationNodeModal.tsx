"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { AnimatePresence, motion } from "framer-motion";

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

interface AutomationNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  jobId: string;
  jobs: Job[];
  type: "mail" | "assessment" | "interview" | "onboarding";
  editingId?: string | null;
  initialData?: any | null;
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
  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const EMPTY_FORM = {
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
    generated_questions: null as any[] | null,
    start_time: "09:00",
    end_time: "17:00",
    duration: "30",
    daily_limit: 5,
    interviewer_email: "",
    time_slots: [] as string[],
    start_date: "",
    end_date: "",
    google_meet_link: "",
    interview_type: "GMEET",
    interview_template_id: "",
  };

  // Unified Form State
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<"config" | "sub">("config");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Template States
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<any[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<any[]>([]);
  const [interviewTemplates, setInterviewTemplates] = useState<any[]>([]);

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
          job_requirement_id: initialData.job_requirement_id,
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
      showToast("Please enter a topic for the assessment.", "error");
      return;
    }

    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast("Scheduled time cannot be in the past.", "error");
        return;
      }
    }
    setLoading(true);
    try {
      const qs = `type=${form.assessment_type}&topic=${encodeURIComponent(form.topic)}&count=${form.question_count}`;
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment/generate-preview?${qs}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        const questions = await res.json();
        setForm((f: any) => ({ ...f, generated_questions: questions }));
        setActiveTab("sub"); // Switch to questions tab
        showToast("Questions generated! Please review questions.");
      } else {
        showToast("Failed to generate questions.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Interview Slot Generation
  const handleGenerateTimeSlots = () => {
    const limit = Number(form.daily_limit);
    if (!limit || limit <= 0) {
      showToast("Please set a daily limit > 0", "error");
      return;
    }
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
    setForm((f: any) => ({ ...f, time_slots: slots }));
    setActiveTab("sub"); // Switch to slots tab
    showToast("Time slots generated!");
  };

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
      setForm((f: any) => ({ ...f, stage_index: 0, stage_name: "" }));
      return;
    };
    const [idxStr, ...nameParts] = val.split("|");
    setForm((f: any) => ({ ...f, stage_index: Number(idxStr), stage_name: nameParts.join("|") }));
  };

  const handleSave = async () => {
    if (!form.job_requirement_id || form.job_requirement_id === "undefined") {
      showToast("Please select a target job.", "error");
      return;
    }

    if (type !== 'onboarding' && (!form.criteria || !form.criteria.trim())) {
      showToast("Please fill in trigger condition.", "error");
      return;
    }
    if (type === "interview") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (new Date(form.start_date) < now) {
        showToast("Start date cannot be in the past.", "error");
        return;
      }
      if (new Date(form.start_date) > new Date(form.end_date)) {
        showToast("Available To date must be equal or after Available From date.", "error");
        return;
      }
      if (form.interview_type === "AI" && !form.interview_template_id) {
        showToast("Please select an AI template.", "error");
        return;
      }
      if (form.interview_type === "GMEET" && !form.interviewer_email?.trim()) {
        showToast("Please provide interviewer email for Google Meet.", "error");
        return;
      }
    }

    if (!form.is_immediate && form.send_at) {
      if (new Date(form.send_at) < new Date()) {
        showToast("Scheduled time cannot be in the past.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      let endpoint = "";
      let payload: any = {
        job_requirement_id: form.job_requirement_id,
        stage_index: Number(form.stage_index),
        stage_name: form.stage_name.trim() || null,
        is_enabled: form.is_enabled,
      };

      if (type === "mail") {
        if (!form.template_id) throw new Error("Template is required.");
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
        if (!form.topic.trim()) throw new Error("Topic is required.");
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
        if (!form.template_id) throw new Error("Onboarding Template is required.");
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
        showToast(editingId ? "Automation Updated!" : "Automation Created!");
        setTimeout(() => {
          onSave();
          onClose();
        }, 800);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create automation.");
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  const headerMeta = useMemo(() => {
    switch (type) {
      case "mail": return { title: "Mail Action", icon: "mark_email_unread", color: "#6366f1", bg: "#eef2ff" };
      case "assessment": return { title: "Assessment Action", icon: "psychology", color: "#f59e0b", bg: "#fffbeb" };
      case "interview": return { title: "Interview Action", icon: "event_available", color: "#10b981", bg: "#ecfdf5" };
      case "onboarding": return { title: "Onboarding Action", icon: "person_add", color: "#a855f7", bg: "#faf5ff" };
    }
  }, [type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {toast && (
            <div className={`fixed top-5 right-5 z-[500] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
              <span className="material-symbols-rounded text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
              {String(toast.msg)}
            </div>
          )}
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col pointer-events-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: headerMeta.bg, color: headerMeta.color }}>
                  <span className="material-symbols-rounded text-xl">{headerMeta.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 leading-tight">{editingId ? "Edit Node" : "Create Node"}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: headerMeta.color }}>{headerMeta.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="w-9 h-9 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                  <span className="material-symbols-rounded text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Tabs (Only for Assessment/Interview) */}
            {(type === "assessment" || type === "interview") && (
              <div className="flex border-b border-slate-100 shrink-0 bg-white px-6">
                <button
                  onClick={() => setActiveTab("config")}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "config" ? "border-[#7C3AED] text-[#7C3AED]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  1. Configuration
                </button>
                <button
                  onClick={() => setActiveTab("sub")}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "sub" ? "border-[#7C3AED] text-[#7C3AED]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  2. {type === "assessment" ? `Questions (${form.generated_questions?.length || 0})` : `Time Slots (${form.time_slots?.length || 0})`}
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
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#7C3AED] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading data...</p>
                      </div>
                    </div>
                  )}
                  {/* Job Info */}
                  <div className="opacity-70">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Job</label>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600">
                      {selectedJob?.title || "No Job Selected"}
                    </div>
                  </div>

                  {/* Round Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Connect to Round <span className="text-red-400">*</span></label>
                    {jobRounds.length > 0 ? (
                      <select 
                        value={roundValue} 
                        onChange={handleRoundSelect} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all shadow-sm"
                      >
                        <option value="" className="text-slate-900 bg-white">Select a stage...</option>
                        {jobRounds.map((r, i) => <option key={i} value={`${i + 1}|${r.name}`} className="text-slate-900 bg-white">Stage {i + 1}: {r.name}</option>)}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" min={1} value={form.stage_index || ""} onChange={(e) => setForm((f: any) => ({ ...f, stage_index: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Idx" />
                        <input type="text" value={form.stage_name || ""} onChange={(e) => setForm((f: any) => ({ ...f, stage_name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Stage Name" />
                      </div>
                    )}
                  </div>

                  {/* Trigger Criteria */}
                  {type !== "onboarding" && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Trigger Condition {type === "mail" && <span className="text-red-400">*</span>}</label>
                      <textarea 
                        value={form.criteria || ""} 
                        onChange={(e) => setForm((f: any) => ({ ...f, criteria: e.target.value }))} 
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 transition-all resize-none" 
                        rows={3}
                        placeholder="e.g. 'Score > 80' or 'Shortlisted'" 
                      />
                      <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Clear conditions help trigger the automation correctly.</p>
                    </div>
                  )}

                  {/* ACTION SPECIFIC FIELDS */}
                  <div className="space-y-6 pt-2">
                    
                    {/* MAIL Action */}
                    {type === "mail" && (
                      <div>
                        <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 ml-1">Email Template <span className="text-red-400">*</span></label>
                        <select value={form.template_id || ""} onChange={(e) => setForm((f: any) => ({ ...f, template_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white shadow-sm">
                          <option value="" className="text-slate-900 bg-white">Select template…</option>
                          {emailTemplates.map((t: any) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                        </select>
                      </div>
                    )}

                    {/* ASSESSMENT Action */}
                    {type === "assessment" && (
                      <>
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 shadow-sm">
                          <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 ml-1">Use Template (Optional)</label>
                          <select 
                            value={form.template_id || ""}
                            onChange={(e) => {
                              const templateId = e.target.value;
                              if (templateId) {
                                const templ = assessmentTemplates.find(t => t.id === templateId);
                                if (templ) {
                                  setForm((f:any) => ({ ...f, template_id: templateId, assessment_type: templ.type, topic: templ.topic, question_count: templ.question_count, test_duration: templ.test_duration }));
                                } else {
                                  setForm((f: any) => ({ ...f, template_id: "" }));
                                }
                              } else {
                                setForm((f: any) => ({ ...f, template_id: "" }));
                              }
                            }}
                            className="w-full border border-amber-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 bg-white"
                          >
                            <option value="" className="text-slate-900 bg-white">-- Custom Config --</option>
                            {assessmentTemplates.map((t) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                            <select value={form.assessment_type || ""} onChange={(e) => setForm((f: any) => ({ ...f, assessment_type: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 bg-white">
                              <option value="APTITUDE" className="text-slate-900 bg-white">Aptitude</option>
                              <option value="CODING" className="text-slate-900 bg-white">Coding</option>
                              <option value="BOTH" className="text-slate-900 bg-white">Both</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Topic <span className="text-red-400">*</span></label>
                            <input type="text" value={form.topic || ""} onChange={(e) => setForm((f: any) => ({ ...f, topic: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700" placeholder="e.g. Python, SQL" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Questions</label>
                            <input type="number" value={form.question_count || ""} onChange={(e) => setForm((f: any) => ({ ...f, question_count: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Duration (Min)</label>
                            <input type="number" value={form.test_duration || ""} onChange={(e) => setForm((f: any) => ({ ...f, test_duration: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Invite Email Template</label>
                          <select value={form.email_template_id || ""} onChange={(e) => setForm((f: any) => ({ ...f, email_template_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white">
                            <option value="" className="text-slate-900 bg-white">Default Invite Email</option>
                            {emailTemplates.map((t: any) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleGeneratePreview}
                            disabled={loading}
                            className="w-full py-3 bg-[#7C3AED] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6d28d9] shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#7C3AED]/20 disabled:opacity-50"
                          >
                             {loading ? (
                               <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             ) : (
                               <span className="material-symbols-rounded text-lg">auto_awesome</span>
                             )}
                             {form.generated_questions?.length ? "Regenerate Draft with AI" : "Draft Questions with AI"}
                          </button>
                        </div>
                      </>
                    )}

                    {/* INTERVIEW Action */}
                    {type === "interview" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Interview Type</label>
                            <select value={form.interview_type || ""} onChange={(e) => setForm((f: any) => ({ ...f, interview_type: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white">
                              <option value="GMEET" className="text-slate-900 bg-white">Google Meet</option>
                              <option value="AI" className="text-slate-900 bg-white">AI Interview</option>
                            </select>
                          </div>
                          {form.interview_type === "AI" && (
                            <div>
                               <div className="flex items-center justify-between mb-1.5 ml-1">
                                 <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Template</label>
                                 <button 
                                   onClick={() => window.open('/enterprise/settings/interview-templates', '_blank')}
                                   className="text-[10px] font-bold text-[#7C3AED] hover:underline uppercase"
                                 >
                                   + Create New
                                 </button>
                               </div>
                              <select value={form.interview_template_id || ""} onChange={(e) => setForm((f: any) => ({ ...f, interview_template_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white">
                                <option value="" className="text-slate-900 bg-white">Select AI Template</option>
                                {interviewTemplates.map((t: any) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Available From <span className="text-red-400">*</span></label>
                            <input type="date" value={form.start_date || ""} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm((f: any) => ({ ...f, start_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Available To <span className="text-red-400">*</span></label>
                            <input type="date" value={form.end_date || ""} min={form.start_date || new Date().toISOString().split('T')[0]} onChange={(e) => setForm((f: any) => ({ ...f, end_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Start Time <span className="text-red-400">*</span></label>
                            <input type="time" value={form.start_time || ""} onChange={(e) => setForm((f: any) => ({ ...f, start_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">End Time <span className="text-red-400">*</span></label>
                            <input type="time" value={form.end_time || ""} onChange={(e) => setForm((f: any) => ({ ...f, end_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Duration <span className="text-red-400">*</span></label>
                            <select value={form.duration || ""} onChange={(e) => setForm((f: any) => ({ ...f, duration: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold text-slate-900 bg-white focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]">
                              <option value="15" className="text-slate-900 bg-white">15m</option>
                              <option value="30" className="text-slate-900 bg-white">30m</option>
                              <option value="45" className="text-slate-900 bg-white">45m</option>
                              <option value="60" className="text-slate-900 bg-white">60m</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Daily Limit <span className="text-red-400">*</span></label>
                            <input type="number" min={1} value={form.daily_limit || ""} onChange={(e) => setForm((f: any) => ({ ...f, daily_limit: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Interviewer Email</label>
                            <input 
                              type="email" 
                              value={form.interviewer_email || ""} 
                              onChange={(e) => setForm((f: any) => ({ ...f, interviewer_email: e.target.value }))} 
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                              placeholder="johndoe@email.com" 
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Invite Template</label>
                            <select value={form.email_template_id || ""} onChange={(e) => setForm((f: any) => ({ ...f, email_template_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white">
                              <option value="" className="text-slate-900 bg-white">Default Invite</option>
                              {emailTemplates.map((t: any) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="pt-2">
                           <button
                             onClick={handleGenerateTimeSlots}
                             className="w-full py-3 bg-[#7C3AED] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6d28d9] shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#7C3AED]/20"
                           >
                              <span className="material-symbols-rounded text-lg">schedule</span>
                              Next: Configure Time Slots
                           </button>
                        </div>
                      </>
                    )}

                    {/* ONBOARDING Action */}
                    {type === "onboarding" && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">Onboarding Template <span className="text-red-400">*</span></label>
                          <select value={form.template_id || ""} onChange={(e) => setForm((f: any) => ({ ...f, template_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white">
                            <option value="" className="text-slate-900 bg-white">Select template…</option>
                            {onboardingTemplates.map((t: any) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">Intro Email Template</label>
                          <select value={form.email_template_id || ""} onChange={(e) => setForm((f: any) => ({ ...f, email_template_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-white">
                            <option value="" className="text-slate-900 bg-white">No Intro Email</option>
                            {emailTemplates.map((t: any) => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* AUTOMATION SETTINGS (Common) */}
                  <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Automation Logic</span>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Enabled Status</p>
                          <p className="text-[10px] text-slate-400">Node will actively trigger automations</p>
                        </div>
                        <button onClick={() => setForm((f: any) => ({ ...f, is_enabled: !f.is_enabled }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_enabled ? "bg-[#7C3AED]" : "bg-slate-200"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_enabled ? "translate-x-5" : ""}`} />
                        </button>
                    </div>

                    {(type === "mail" || type === "assessment" || type === "interview" || type === "onboarding") && (
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div>
                            <p className="text-sm font-bold text-slate-800">Auto-Move Candidate</p>
                            <p className="text-[10px] text-slate-400">Automatically advance candidate after trigger</p>
                          </div>
                          <button onClick={() => setForm((f: any) => ({ ...f, auto_move: !f.auto_move }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.auto_move ? "bg-[#7C3AED]" : "bg-slate-200"}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.auto_move ? "translate-x-5" : ""}`} />
                          </button>
                      </div>
                    )}

                    {(type === "mail" || type === "assessment") && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div>
                              <p className="text-sm font-bold text-slate-800">Schedule Mode</p>
                              <p className="text-[10px] text-slate-400">{form.is_immediate ? "Immediate execution" : "Scheduled execution"}</p>
                            </div>
                            <button onClick={() => setForm((f: any) => ({ ...f, is_immediate: !f.is_immediate }))} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_immediate ? "bg-[#7C3AED]" : "bg-slate-200"}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_immediate ? "translate-x-5" : ""}`} />
                            </button>
                        </div>

                        {!form.is_immediate && (
                          <div className="px-1 animate-in slide-in-from-top-2 duration-300">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Send Date & Time</label>
                              <input type="datetime-local" value={form.send_at || ""} onChange={(e) => setForm((f: any) => ({ ...f, send_at: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium" />
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
                           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Question Bank</h3>
                           <button 
                              onClick={() => {
                                const newQ = form.assessment_type === 'CODING' ? {
                                  id: crypto.randomUUID(),
                                  type: 'CODING',
                                  title: 'New Coding Task',
                                  problem_statement: '',
                                  difficulty: 'Medium'
                                } : {
                                  id: crypto.randomUUID(),
                                  type: 'APTITUDE',
                                  question: 'New Question',
                                  options: ['', '', '', ''],
                                  correct_answer: '',
                                  explanation: ''
                                };
                                setForm((f: any) => ({ ...f, generated_questions: [...(f.generated_questions || []), newQ] }));
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
                            >
                              <span className="material-symbols-rounded text-sm">add</span>
                              Add Question
                            </button>
                        </div>
                        {(!form.generated_questions || form.generated_questions.length === 0) ? (
                          <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                             <span className="material-symbols-rounded text-slate-300 text-4xl mb-2">auto_awesome</span>
                             <p className="text-xs font-bold text-slate-400">No questions generated yet.</p>
                             <button onClick={() => setActiveTab("config")} className="mt-2 text-[10px] text-[#7C3AED] font-black uppercase hover:underline">Go to Config to Generate</button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                             {form.generated_questions.map((q: any, i: number) => (
                               <div key={q.id || i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                                  <div className="absolute -top-2 -left-2 w-7 h-7 bg-[#7C3AED] text-white rounded-lg flex items-center justify-center font-black italic shadow-md text-xs">#{i + 1}</div>
                                  
                                  <div className="flex justify-between gap-2 mb-4">
                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-6">
                                       {q.type || form.assessment_type} Task
                                     </span>
                                     <button 
                                       onClick={() => {
                                         setForm((f: any) => ({ ...f, generated_questions: f.generated_questions.filter((_: any, idx: number) => idx !== i) }));
                                       }}
                                       className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                     >
                                        <span className="material-symbols-rounded text-base">delete</span>
                                     </button>
                                  </div>

                                  <div className="space-y-4">
                                    {(q.type === 'APTITUDE' || (!q.type && form.assessment_type === 'APTITUDE')) ? (
                                      <>
                                        <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Question Text</label>
                                          <textarea 
                                            value={q.question} 
                                            onChange={(e) => {
                                              const newQs = [...form.generated_questions];
                                              newQs[i].question = e.target.value;
                                              setForm((f: any) => ({ ...f, generated_questions: newQs }));
                                            }}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all h-20 resize-none font-medium text-slate-700"
                                            placeholder="Enter question text..."
                                          />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {(q.options || []).map((opt: string, optIdx: number) => (
                                            <div key={optIdx} className="relative">
                                              <input 
                                                value={opt} 
                                                onChange={(e) => {
                                                  const newQs = [...form.generated_questions];
                                                  newQs[i].options[optIdx] = e.target.value;
                                                  setForm((f: any) => ({ ...f, generated_questions: newQs }));
                                                }}
                                                className={`w-full bg-slate-50 border-2 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold transition-all ${q.correct_answer === opt ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]" : "border-transparent text-slate-600"}`}
                                                placeholder={`Option ${optIdx + 1}`}
                                              />
                                              <button 
                                                onClick={() => {
                                                  const newQs = [...form.generated_questions];
                                                  newQs[i].correct_answer = opt;
                                                  setForm((f: any) => ({ ...f, generated_questions: newQs }));
                                                }}
                                                className={`absolute left-2.5 top-2.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${q.correct_answer === opt ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-400 hover:bg-slate-300"}`}
                                              >
                                                <span className="material-symbols-rounded text-xs">{q.correct_answer === opt ? "check" : "circle"}</span>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Problem Title</label>
                                          <input 
                                            type="text"
                                            value={q.title || ''} 
                                            onChange={(e) => {
                                              const newQs = [...form.generated_questions];
                                              newQs[i].title = e.target.value;
                                              setForm((f: any) => ({ ...f, generated_questions: newQs }));
                                            }}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                                            placeholder="e.g. Implement a Binary Search"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Problem Statement</label>
                                          <textarea 
                                            value={q.problem_statement || ''} 
                                            onChange={(e) => {
                                              const newQs = [...form.generated_questions];
                                              newQs[i].problem_statement = e.target.value;
                                              setForm((f: any) => ({ ...f, generated_questions: newQs }));
                                            }}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all h-32 resize-none font-medium"
                                            placeholder="Enter the problem details..."
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
                           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Time Slots</h3>
                           <button 
                             onClick={() => {
                               const limit = Number(form.daily_limit) || 0;
                               if (limit > 0 && form.time_slots?.length >= limit) {
                                  showToast(`Daily limit of ${limit} slots reached.`, "error");
                                  return;
                               }
                               setForm((f: any) => ({ ...f, time_slots: [...(f.time_slots || []), "09:00"] }));
                             }}
                             disabled={Number(form.daily_limit) > 0 && form.time_slots?.length >= Number(form.daily_limit)}
                             className="text-[10px] font-bold text-[#7C3AED] hover:underline uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:no-underline"
                           >
                             + Add Slot
                           </button>
                        </div>
                        {(!form.time_slots || form.time_slots.length === 0) ? (
                          <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                             <span className="material-symbols-rounded text-slate-300 text-4xl mb-2">schedule</span>
                             <p className="text-xs font-bold text-slate-400">No time slots generated.</p>
                             <button onClick={handleGenerateTimeSlots} className="mt-2 text-[10px] text-[#7C3AED] font-black uppercase hover:underline">Auto-Generate Slots</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                             {form.time_slots.map((slot: string, i: number) => (
                               <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 group">
                                  <input 
                                    type="time" 
                                    value={slot} 
                                    onChange={(e) => {
                                      const newSlots = [...form.time_slots];
                                      newSlots[i] = e.target.value;
                                      setForm((f: any) => ({ ...f, time_slots: newSlots }));
                                    }}
                                    className="bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 flex-1"
                                  />
                                  <button 
                                    onClick={() => {
                                      setForm((f: any) => ({ ...f, time_slots: f.time_slots.filter((_: any, idx: number) => idx !== i) }));
                                    }}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                     <span className="material-symbols-rounded text-sm">close</span>
                                  </button>
                               </div>
                             ))}
                          </div>
                        )}
                        <div className="pt-4 mt-4 border-t border-slate-100">
                           <button 
                             onClick={handleGenerateTimeSlots}
                             className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
                           >
                              Refresh / Regenerate Slots
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
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 flex items-center justify-center gap-2 text-white rounded-xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
                style={{ backgroundColor: headerMeta.color, boxShadow: `0 8px 16px -4px ${headerMeta.color}60` }}
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-rounded text-lg">{editingId ? "save" : "add_circle"}</span>
                    {editingId ? "UPDATE" : "ADD"} {type.toUpperCase()} NODE
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
