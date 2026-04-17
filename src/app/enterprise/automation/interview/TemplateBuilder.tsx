"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Question {
  id: string;
  question: string;
  type: string;
  expected_answer_points: string[];
  difficulty: string;
}

interface TemplateBuilderProps {
  onClose: () => void;
  onSave: (template: any) => void;
  initialData?: any;
  token: string;
  backendUrl: string;
}

export default function TemplateBuilder({
  onClose,
  onSave,
  initialData,
  token,
  backendUrl,
}: TemplateBuilderProps) {
  const { canAccess } = useAuth();
  const [title, setTitle] = useState(initialData?.title || "");
  const [topic, setTopic] = useState(initialData?.topic || "");
  const [duration, setDuration] = useState(initialData?.duration || 30);
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || "Intermediate");
  const [requireVideo, setRequireVideo] = useState(initialData?.require_video ?? true);
  const [questions, setQuestions] = useState<Question[]>(initialData?.plan?.questions || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const res = await fetch(
        `${backendUrl}/api/v1/enterprise/interview-templates/generate-questions?topic=${encodeURIComponent(
          topic
        )}&duration=${duration}&difficulty=${difficulty}`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (res.ok) {
        const data = await res.json();
        setQuestions([...questions, ...(data.questions || [])]);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title || !topic) return;
    
    // Validate that all questions have non-empty text
    const hasEmptyQuestions = questions.some(q => !q.question || q.question.trim() === "");
    if (hasEmptyQuestions) {
      alert("Please ensure all questions have content before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title,
        description: `AI Interview for ${topic}`,
        topic,
        duration: Number(duration),
        difficulty,
        require_video: requireVideo,
        type: "VIDEO",
        plan: { questions },
      };

      const url = initialData?.id
        ? `${backendUrl}/api/v1/enterprise/interview-templates/${initialData.id}`
        : `${backendUrl}/api/v1/enterprise/interview-templates/`;
      
      const method = initialData?.id ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedTemplate = await res.json();
        onSave(savedTemplate);
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question: "",
      type: "TECHNICAL",
      expected_answer_points: [],
      difficulty: difficulty,
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto shrink-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
              <span className="material-symbols-rounded text-white">psychology</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">AI Builder</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Template Config</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Template Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                placeholder="e.g. Senior Frontend Dev"
                readOnly={!canAccess("interviews:moderate")}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Interview Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                placeholder="e.g. React & TypeScript"
                readOnly={!canAccess("interviews:moderate")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Duration (m)
                </label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all"
                  disabled={!canAccess("interviews:moderate")}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div>
                <p className="text-xs font-bold text-slate-700">Require Video</p>
                <p className="text-[10px] text-slate-400 font-medium">Enforce camera</p>
              </div>
              <button
                onClick={() => setRequireVideo(!requireVideo)}
                disabled={!canAccess("interviews:moderate")}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${requireVideo ? "bg-[#7C3AED]" : "bg-slate-200"} ${!canAccess("interviews:moderate") ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${requireVideo ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic || !canAccess("interviews:moderate")}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                {isGenerating ? (
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-rounded text-base">magic_button</span>
                )}
                Generate with AI
              </button>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Interview Questions</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Review and customize the generated questions</p>
            </div>
            {canAccess("interviews:moderate") && (
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <span className="material-symbols-rounded text-sm">add</span>
                Add Question
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {questions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                  <span className="material-symbols-rounded text-slate-300 text-3xl">chat_bubble</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No questions yet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Enter a topic on the left and click "Generate with AI" or add questions manually.
                  </p>
                </div>
              </div>
            ) : (
              questions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white border border-slate-100 rounded-3xl p-6 transition-all hover:border-[#7C3AED]/20 hover:shadow-xl hover:shadow-[#7C3AED]/5 relative"
                >
                  {canAccess("interviews:moderate") && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => removeQuestion(q.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-rounded text-base">delete</span>
                      </button>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-4">
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                        rows={2}
                        className="w-full text-sm font-bold text-slate-800 placeholder-slate-300 border-none focus:ring-0 resize-none p-0 bg-transparent"
                        placeholder="Type question here..."
                        readOnly={!canAccess("interviews:moderate")}
                      />
                      
                      <div className="flex flex-wrap items-center gap-4">
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type:</span>
                           <select
                             value={q.type}
                             onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                             className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/5 border-none focus:ring-0 rounded-lg px-2 py-1"
                             disabled={!canAccess("interviews:moderate")}
                           >
                             <option value="TECHNICAL">TECHNICAL</option>
                             <option value="BEHAVIORAL">BEHAVIORAL</option>
                             <option value="SITUATIONAL">SITUATIONAL</option>
                           </select>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Difficulty:</span>
                           <select
                             value={q.difficulty}
                             onChange={(e) => updateQuestion(q.id, { difficulty: e.target.value })}
                             className="text-[10px] font-bold text-slate-600 bg-slate-50 border-none focus:ring-0 rounded-lg px-2 py-1"
                             disabled={!canAccess("interviews:moderate")}
                           >
                             <option value="Beginner">Beginner</option>
                             <option value="Intermediate">Intermediate</option>
                             <option value="Advanced">Advanced</option>
                             <option value="Expert">Expert</option>
                           </select>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Key Evaluation Points</label>
                        <div className="flex flex-wrap gap-2">
                          {q.expected_answer_points.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group/point">
                              <input
                                value={point}
                                onChange={(e) => {
                                  const newPoints = [...q.expected_answer_points];
                                  newPoints[pIdx] = e.target.value;
                                  updateQuestion(q.id, { expected_answer_points: newPoints });
                                }}
                                className="text-[10px] font-bold text-slate-600 bg-transparent border-none focus:ring-0 p-0 w-32"
                                readOnly={!canAccess("interviews:moderate")}
                              />
                                {canAccess("interviews:moderate") && (
                                  <button 
                                    onClick={() => {
                                      const newPoints = q.expected_answer_points.filter((_, i) => i !== pIdx);
                                      updateQuestion(q.id, { expected_answer_points: newPoints });
                                    }}
                                    className="text-slate-300 hover:text-red-400 transition-colors"
                                  >
                                    <span className="material-symbols-rounded text-xs">close</span>
                                  </button>
                                )}
                            </div>
                          ))}
                          {canAccess("interviews:moderate") && (
                            <button 
                              onClick={() => {
                                 updateQuestion(q.id, { expected_answer_points: [...q.expected_answer_points, "New point..."] });
                              }}
                              className="px-3 py-1.5 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all"
                            >
                              + Add Point
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-end shrink-0">
            {canAccess("interviews:moderate") && (
              <button
                onClick={handleSave}
                disabled={isSaving || !title || !topic || questions.length === 0 || questions.some(q => !q.question || q.question.trim() === "")}
                className="flex items-center gap-2 px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-200 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-[#7C3AED]/20"
              >
                {isSaving ? (
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-rounded text-base">save</span>
                )}
                {initialData ? "Update Template" : "Save Template"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
