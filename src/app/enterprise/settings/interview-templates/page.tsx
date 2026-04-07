"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import TemplateBuilder from "@/app/enterprise/automation/interview/TemplateBuilder";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface InterviewTemplate {
  id: string;
  title: string;
  topic: string;
  duration: number;
  difficulty: string;
  require_video: boolean;
  type: string;
  created_at: string;
  plan?: any;
}

export default function InterviewTemplatesPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/`, {
        headers: {
            ...authHeaders,
            "Authorization": `Bearer ${token}`
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
  }, [token, fetchTemplates]);

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/${templateToDelete.id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        },
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="bg-[#FDFDFF] min-h-screen p-4 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-black text-[#1E1B4B] tracking-tight truncate uppercase">INTERVIEW TEMPLATES</h1>
            <p className="text-slate-500 font-medium mt-0.5 uppercase tracking-widest text-[9px] font-bold">Manage reusable AI interview standards</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowBuilder(true);
            }}
            className="group bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#7C3AED]/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="material-symbols-rounded text-sm group-hover:rotate-90 transition-transform">add_circle</span>
            NEW TEMPLATE
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100 flex flex-col items-center shadow-sm">
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 border border-slate-100/50">
              <span className="material-symbols-rounded text-slate-200 text-5xl">psychology</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Templates Found</h3>
            <p className="text-slate-400 text-xs mt-3 max-w-xs mx-auto leading-relaxed font-medium uppercase tracking-widest text-center">
              Standardize your technical screening across all jobs by creating your first AI template.
            </p>
            <button 
               onClick={() => setShowBuilder(true)}
               className="mt-10 text-[#7C3AED] font-black text-[10px] uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all"
            >
               + Create Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-[#7C3AED]/5 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
                onClick={() => {
                  setEditingTemplate(template);
                  setShowBuilder(true);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <span className="material-symbols-rounded text-lg font-bold">psychology</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTemplateToDelete({ id: template.id, name: template.title });
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center translate-x-1 -translate-y-1"
                  >
                    <span className="material-symbols-rounded text-base">delete</span>
                  </button>
                </div>
                
                <div className="space-y-0.5">
                  <h3 className="font-black text-slate-900 text-xs truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{template.title}</h3>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50/50 px-1.5 py-0.5 rounded-md whitespace-nowrap">{template.topic}</span>
                    <span className="w-1 h-2 rounded-full bg-slate-100 shrink-0" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{template.difficulty}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2">
                   <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5 opacity-70 leading-none">Duration</p>
                      <p className="text-[9px] font-black text-slate-900 leading-none">{template.duration}M</p>
                   </div>
                   <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5 opacity-70 leading-none">Format</p>
                      <p className="text-[9px] font-black text-slate-900 leading-none uppercase">{template.require_video ? "VIDEO" : "AUDIO"}</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBuilder && (
          <TemplateBuilder
            token={token || ""}
            backendUrl={BACKEND_URL}
            initialData={editingTemplate}
            onClose={() => {
              setShowBuilder(false);
              setEditingTemplate(null);
            }}
            onSave={() => {
              fetchTemplates();
              setShowBuilder(false);
              setEditingTemplate(null);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Template?"
        message={`Are you sure you want to delete "${templateToDelete?.name}"? You cannot undo this action.`}
        confirmLabel="Yes, Delete"
        cancelLabel="No"
        isDestructive={true}
      />
    </div>
  );
}
