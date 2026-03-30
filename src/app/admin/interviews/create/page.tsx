"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

interface Module {
    title: string;
    questions: string[];
}

export default function CreateInterviewPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get("department_id");
    const { selectedBatch } = useDivision();
    const [createdId, setCreatedId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        jobDescription: "",
        duration: 30,
        difficulty: "Medium",
        strictness: "Medium",
        avatar: " Dravid (Technical)",
        voice: "en-US-Standard-B"
    });

    const [interviewPlan, setInterviewPlan] = useState<{ modules: Module[] }>({
        modules: []
    });

    const [isGeneratingJD, setIsGeneratingJD] = useState(false);

    const handleGenerateJD = async () => {
        if (!formData.title) {
            alert("Please enter a Job Role first.");
            return;
        }
        setIsGeneratingJD(true);
        try {
            const response = await apiClient.post(`/api/v1/interviews/generate-jd`, {
                title: formData.title,
                difficulty: formData.difficulty || "Senior"
            });
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, jobDescription: data.job_description }));
            } else {
                alert("Failed to generate JD");
            }
        } catch (error) {
            console.error("Error generating JD:", error);
        } finally {
            setIsGeneratingJD(false);
        }
    };

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.post(`/api/v1/interviews/generate-plan`, {
                job_role: formData.title,
                job_description: formData.jobDescription
            });

            if (response.ok) {
                const data = await response.json();
                setInterviewPlan(data);
                setStep(2);
            } else {
                alert("Failed to generate plan. Please try again.");
            }
        } catch (error) {
            console.error("Error generating plan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInterview = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.post(`/api/v1/interviews`, {
                title: formData.title,
                job_description: formData.jobDescription,
                interview_plan: interviewPlan,
                avatar_config: {
                    avatar: formData.avatar,
                    voice: formData.voice
                },
                settings: {
                    duration: formData.duration,
                    difficulty: formData.difficulty,
                    strictness: formData.strictness
                },
                is_active: true,
                department_id: departmentId ? parseInt(departmentId) : null,
                batch: selectedBatch || null
            });

            if (response.ok) {
                const data = await response.json();
                setCreatedId(data.id);
                setStep(6);
            } else {
                alert("Failed to create interview.");
            }
        } catch (error) {
            console.error("Error creating interview:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Job Role</label>
                            <input
                                type="text"
                                className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-slate-500 focus:outline-none transition-all text-sm font-bold active:scale-[0.99]"
                                placeholder="e.g. Senior Frontend Engineer"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">Job Description (Optional)</label>
                                <button
                                    onClick={handleGenerateJD}
                                    disabled={!formData.title || isGeneratingJD}
                                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${!formData.title || isGeneratingJD ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-[var(--color-primary)] hover:bg-indigo-50'}`}
                                >
                                    {isGeneratingJD ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                                            <span>Generating...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">auto_awesome</span>
                                            Generate with AI
                                        </>
                                    )}
                                </button>
                            </div>
                            <textarea
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-slate-500 focus:outline-none transition-all min-h-[200px]"
                                placeholder="Paste the JD here for better question targeting..."
                                value={formData.jobDescription}
                                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={handleGeneratePlan}
                            disabled={!formData.title || isLoading}
                            className="w-full h-12 bg-[var(--color-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="material-icons text-xl">psychology</span>
                                    <span>Generate AI Interview Plan</span>
                                </>
                            )}
                        </button>
                    </div>
                );
            case 2:
                const handleQuestionChange = (moduleIndex: number, questionIndex: number, newVal: string) => {
                    const newModules = [...interviewPlan.modules];
                    newModules[moduleIndex].questions[questionIndex] = newVal;
                    setInterviewPlan({ modules: newModules });
                };

                const handleAddQuestion = (moduleIndex: number) => {
                    const newModules = [...interviewPlan.modules];
                    newModules[moduleIndex].questions.push("");
                    setInterviewPlan({ modules: newModules });
                };

                const handleDeleteQuestion = (moduleIndex: number, questionIndex: number) => {
                    const newModules = [...interviewPlan.modules];
                    newModules[moduleIndex].questions.splice(questionIndex, 1);
                    setInterviewPlan({ modules: newModules });
                };

                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 border-l-4 border-slate-500 pl-4">Review & Edit Interview Plan</h3>
                            <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-600 hover:text-slate-800 uppercase tracking-widest">Edit JD</button>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {interviewPlan.modules.map((m, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm">{idx + 1}</div>
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight">{m.title}</h4>
                                    </div>
                                    <ul className="space-y-3">
                                        {m.questions.map((q, qIdx) => (
                                            <li key={qIdx} className="flex gap-2 items-start">
                                                <div className="flex-1">
                                                    <textarea
                                                        value={q}
                                                        onChange={(e) => handleQuestionChange(idx, qIdx, e.target.value)}
                                                        className="w-full text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none resize-none"
                                                        rows={2}
                                                        placeholder="Enter question text..."
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteQuestion(idx, qIdx)}
                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="Delete Question"
                                                >
                                                    <span className="material-icons text-lg">delete</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => handleAddQuestion(idx)}
                                        className="mt-4 w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">add</span>
                                        Add Custom Question
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(3)}
                            className="w-full h-12 bg-[var(--color-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all active:scale-95"
                        >
                            Next: Configure Experience
                        </button>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 border-l-4 border-slate-500 pl-4">Interview Setup</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Duration (Min)</label>
                                <input
                                    type="number"
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-slate-500 focus:outline-none transition-all text-lg font-medium"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Difficulty</label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-slate-500 focus:outline-none transition-all font-bold uppercase text-sm"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                >
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Interviewer Strictness</label>
                            <div className="grid grid-cols-3 gap-4">
                                {['Chill', 'Medium', 'Robot'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setFormData({ ...formData, strictness: level })}
                                        className={`h-16 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] transition-all ${formData.strictness === level ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(2)} className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Back</button>
                            <button onClick={() => setStep(4)} className="flex-[2] h-12 bg-[var(--color-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all active:scale-95">Next: Select Avatar</button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 border-l-4 border-slate-500 pl-4">AI Interviewer Persona</h3>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { id: ' Dravid', type: 'Technical', img: '/avatars/dravid.png' },
                                { id: ' Sarah', type: 'Behavioral', img: '/avatars/sarah.png' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setFormData({ ...formData, avatar: `${p.id} (${p.type})` })}
                                    className={`relative p-4 rounded-2xl border-2 transition-all group ${formData.avatar.includes(p.id) ? 'border-[var(--color-primary)] bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="w-full aspect-square bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-100 flex items-center justify-center">
                                        <img
                                            src={p.img}
                                            alt={p.id}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <h5 className="font-black text-slate-800 uppercase tracking-tight">{p.id}</h5>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.type}</p>
                                    {formData.avatar.includes(p.id) && <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white"><span className="material-icons text-sm">check</span></div>}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(3)} className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Back</button>
                            <button onClick={() => setStep(5)} className="flex-[2] h-12 bg-[var(--color-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all active:scale-95">Review & Finalize</button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-8 animate-in fade-in zoom-in-95">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 text-slate-600 mb-4 animate-bounce">
                                <span className="material-icons text-4xl">verified</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Final Confirmation</h3>
                            <p className="text-slate-500 text-sm font-medium">Ready to deploy your AI interviewer?</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between border-b border-slate-200 pb-3">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Role</span>
                                <span className="text-sm font-black text-slate-800 uppercase">{formData.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-3">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Agent</span>
                                <span className="text-sm font-black text-slate-800 uppercase">{formData.avatar}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Technical Modules</span>
                                <span className="text-sm font-black text-slate-800">{interviewPlan.modules.length} Sessions</span>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(4)} className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Back</button>
                            <button
                                onClick={handleCreateInterview}
                                disabled={isLoading}
                                className="flex-[2] h-12 bg-[var(--color-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Deploy Interview"}
                            </button>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95">
                        <div className="w-24 h-24 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-100">
                            <span className="material-icons text-6xl">check_circle</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Deployment Successful!</h2>
                            <p className="text-slate-500 text-base font-medium">Your AI Technical Recruiter is live and ready to screen candidates.</p>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <button onClick={() => router.push('/admin/interviews')} className="w-full h-12 bg-[var(--color-primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-[var(--color-primary-dark)] transition-all active:scale-95">Go to Command Center</button>
                            <button onClick={() => router.push(`/admin/interviews/edit/${createdId}`)} className="w-full h-12 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Configure Interview</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-slate-100/50 border border-slate-100 overflow-hidden">
                <AIGenerationOverlay isOpen={isGeneratingJD} title="Analyzing Role Requirements" />
                <AIGenerationOverlay isOpen={isLoading && step === 1} title="Synthesizing Interview Protocol" />

                {/* Progress Bar */}
                {step < 6 && (
                    <div className="h-1.5 w-full bg-slate-50 flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 transition-all duration-500 ${s <= step ? 'bg-[var(--color-primary)]' : 'bg-transparent'}`}
                            />
                        ))}
                    </div>
                )}

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.push('/admin/interviews')}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="material-icons-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Protocol Architect v1.0</span>
                            </div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Init Interview</h1>
                        </div>
                    </div>
                    {renderStep()}
                </div>
            </div>
        </div>
    );
}
