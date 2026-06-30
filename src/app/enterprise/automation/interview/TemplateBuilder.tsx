"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { 
  Brain, 
  Wand2, 
  Plus, 
  Trash2, 
  X, 
  Save, 
  MessageSquare,
  Video,
  PlusCircle,
  ChevronDown
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: string;
  expected_answer_points: string[];
  difficulty: string;
}

interface Template {
  id?: string;
  title: string;
  topic: string;
  duration: number;
  difficulty: string;
  require_video: boolean;
  plan: {
    questions: Question[];
  };
}

interface TemplateBuilderProps {
  onClose: () => void;
  onSave: (template: Template) => void;
  initialData?: Template | null;
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
      id: Math.random().toString(36).substring(2, 11),
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
        className="relative w-full max-w-4xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#E1E4E8]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-[#E1E4E8] p-6 overflow-y-auto shrink-0 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-[10px] bg-[#ECEBFB] flex items-center justify-center border border-[#DAD7F6]/60 shadow-sm">
              <Brain className="w-5 h-5 text-[#5B53E0]" />
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold text-slate-800 leading-tight">AI Builder</h2>
              <p className="text-[11.5px] font-bold text-[#8A929E] mt-0.5">Template Config</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="tb-template-title" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                Template Title
              </label>
              <input
                id="tb-template-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                placeholder="e.g. Senior Frontend Dev"
                readOnly={!canAccess("interviews:moderate")}
              />
            </div>

            <div>
              <label htmlFor="tb-interview-topic" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                Interview Topic
              </label>
              <input
                id="tb-interview-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                placeholder="e.g. React & TypeScript"
                readOnly={!canAccess("interviews:moderate")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tb-duration" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                  Duration (m)
                </label>
                <input
                  id="tb-duration"
                  type="number"
                  min={5}
                  max={90}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="tb-difficulty" className="block text-[11px] font-bold text-[#8A929E] uppercase tracking-wider mb-2 ml-1">
                  Difficulty
                </label>
                <select
                  id="tb-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-[#E1E4E8] rounded-[12px] h-11 px-4 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm cursor-pointer"
                  disabled={!canAccess("interviews:moderate")}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-[#E1E4E8] rounded-[12px] shadow-sm">
              <div>
                <p className="text-[13px] font-bold text-slate-700">Require Video</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Enforce camera</p>
              </div>
              <button
                type="button"
                onClick={() => setRequireVideo(!requireVideo)}
                disabled={!canAccess("interviews:moderate")}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${requireVideo ? "bg-[#5B53E0]" : "bg-[#E1E4E8]"} ${!canAccess("interviews:moderate") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${requireVideo ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !topic || !canAccess("interviews:moderate")}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-[12px] font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isGenerating ? (
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>Generate with AI</span>
              </button>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-[#8A929E] hover:text-[#4B5563] font-bold text-[12px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E1E4E8] flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-800">Interview Questions</h3>
              <p className="text-[12px] text-[#8A929E] font-semibold mt-0.5">Review and customize the generated questions</p>
            </div>
            {canAccess("interviews:moderate") && (
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 h-9 px-3.5 bg-[#ECEBFB] text-[#5B53E0] hover:bg-[#5B53E0] hover:text-white rounded-[10px] text-[12px] font-bold transition-all border border-[#DAD7F6]/60 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5 max-w-sm mx-auto">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-[18px] bg-[#5B53E0]/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-[16px] bg-[#5B53E0] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(91,83,224,0.35)]">
                    <Wand2 className="w-7 h-7 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 border-[2.5px] border-[#5B53E0]/25 border-t-[#5B53E0] rounded-full animate-spin" />
                  <h4 className="text-[15px] font-extrabold text-[#15171C]">Generating interview questions…</h4>
                </div>
                <p className="text-[12.5px] text-[#8A929E] font-medium leading-relaxed">
                  Our AI is drafting tailored questions{topic ? <> for &quot;<span className="font-bold text-[#5B53E0]">{topic}</span>&quot;</> : ""}. This usually takes a few seconds.
                </p>
              </div>
            ) : questions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-[12px] bg-slate-50 border border-[#E1E4E8] flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-[#8A929E]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-extrabold text-slate-500">No questions yet</h4>
                  <p className="text-[12.5px] text-slate-400 font-medium leading-relaxed mt-1">
                    Enter a topic on the left and click &quot;Generate with AI&quot; or add questions manually.
                  </p>
                </div>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="group bg-white border border-[#E1E4E8] hover:border-[#DAD7F6] rounded-[12px] p-6 shadow-sm hover:shadow-md transition-all relative"
                >
                  {canAccess("interviews:moderate") && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="w-8 h-8 rounded-[8px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="w-8 h-8 shrink-0 rounded-[8px] bg-slate-50 flex items-center justify-center text-[12px] font-bold text-slate-500 border border-[#E1E4E8]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-4">
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                        rows={2}
                        className="w-full text-[13.5px] font-bold text-slate-800 placeholder-slate-300 border-none focus:ring-0 resize-none p-0 bg-transparent"
                        placeholder="Type question here..."
                        readOnly={!canAccess("interviews:moderate")}
                      />
                      
                      <div className="flex flex-wrap items-center gap-4">
                         <div className="flex items-center gap-2">
                           <span className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">Type:</span>
                           <div className="relative">
                             <select
                               value={q.type}
                               onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                               className="text-[11.5px] font-bold text-[#5B53E0] bg-[#ECEBFB] border border-[#DAD7F6]/60 rounded-[8px] pl-2.5 pr-7 py-1 outline-none appearance-none cursor-pointer"
                               disabled={!canAccess("interviews:moderate")}
                             >
                               <option value="TECHNICAL">TECHNICAL</option>
                               <option value="BEHAVIORAL">BEHAVIORAL</option>
                               <option value="SITUATIONAL">SITUATIONAL</option>
                             </select>
                             <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5B53E0] pointer-events-none" />
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">Difficulty:</span>
                           <div className="relative">
                             <select
                               value={q.difficulty}
                               onChange={(e) => updateQuestion(q.id, { difficulty: e.target.value })}
                               className="text-[11.5px] font-bold text-slate-600 bg-slate-50 border border-[#E1E4E8] rounded-[8px] pl-2.5 pr-7 py-1 outline-none appearance-none cursor-pointer"
                               disabled={!canAccess("interviews:moderate")}
                             >
                               <option value="Beginner">Beginner</option>
                               <option value="Intermediate">Intermediate</option>
                               <option value="Advanced">Advanced</option>
                               <option value="Expert">Expert</option>
                             </select>
                             <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                           </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor={`tb-eval-points-${q.id}`} className="text-[11px] font-bold text-[#8A929E] uppercase tracking-wider ml-1">Key Evaluation Points</label>
                        <div className="flex flex-wrap gap-2">
                          {q.expected_answer_points.map((point, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F8FA] rounded-[8px] border border-[#E1E4E8] group/point">
                              <input
                                value={point}
                                placeholder="New point"
                                onChange={(e) => {
                                  const newPoints = [...q.expected_answer_points];
                                  newPoints[pIdx] = e.target.value;
                                  updateQuestion(q.id, { expected_answer_points: newPoints });
                                }}
                                className="text-[11.5px] font-bold text-slate-600 bg-transparent border-none focus:ring-0 p-0 w-32 focus:outline-none placeholder:text-[#9AA3AF] placeholder:font-semibold"
                                readOnly={!canAccess("interviews:moderate")}
                              />
                              {canAccess("interviews:moderate") && (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newPoints = q.expected_answer_points.filter((_, i) => i !== pIdx);
                                    updateQuestion(q.id, { expected_answer_points: newPoints });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {canAccess("interviews:moderate") && (
                            <button
                              id={`tb-eval-points-${q.id}`}
                              type="button"
                              onClick={() => {
                                 updateQuestion(q.id, { expected_answer_points: [...q.expected_answer_points, ""] });
                              }}
                              className="px-3 py-1.5 border border-dashed border-[#E1E4E8] rounded-[8px] text-[11.5px] font-bold text-[#8A929E] hover:border-[#5B53E0] hover:text-[#5B53E0] transition-all cursor-pointer"
                            >
                              + Add Point
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-8 py-5 border-t border-[#E1E4E8] bg-[#F7F8FA]/60 flex justify-end shrink-0">
            {canAccess("interviews:moderate") && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !title || !topic || questions.length === 0 || questions.some(q => !q.question || q.question.trim() === "")}
                className="flex items-center gap-2 px-6 h-12 bg-[#5B53E0] hover:bg-[#4A43C9] disabled:bg-slate-200 text-white rounded-[12px] text-[13px] font-bold transition-all shadow-[0_4px_12px_rgba(91,83,224,0.25)] cursor-pointer"
              >
                {isSaving ? (
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{initialData ? "Update Template" : "Save Template"}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
