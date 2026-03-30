"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import TemplateBuilder from "@/app/enterprise/automation/interview/TemplateBuilder";

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/interview-templates/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        },
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-[#FDFDFF] min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight text-uppercase">INTERVIEW TEMPLATES</h1>
            <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px] font-bold">Manage reusable AI interview standards</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowBuilder(true);
            }}
            className="group bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#7C3AED]/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="material-symbols-rounded text-base group-hover:rotate-90 transition-transform">add_circle</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white p-8 rounded-[40px] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-[#7C3AED]/10 transition-all cursor-pointer flex flex-col h-full relative"
                onClick={() => {
                  setEditingTemplate(template);
                  setShowBuilder(true);
                }}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    <span className="material-symbols-rounded text-3xl font-bold">psychology</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id, template.title);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-rounded text-xl">delete</span>
                  </button>
                </div>
                
                <h3 className="font-black text-slate-800 text-lg mb-1 truncate uppercase tracking-tight group-hover:text-[#7C3AED] transition-colors">{template.title}</h3>
                <p className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-8 opacity-60">
                  {template.topic} • {template.difficulty}
                </p>

                <div className="mt-auto pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                   <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 opacity-70">Duration</p>
                      <p className="text-xs font-black text-slate-700">{template.duration} mins</p>
                   </div>
                   <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 opacity-70">Enforced</p>
                      <p className="text-xs font-black text-slate-700">{template.require_video ? "VIDEO" : "AUDIO"}</p>
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
    </div>
  );
}
