"use client";

import { useState } from "react";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

interface DifficultyDistribution {
    EASY: number;
    MEDIUM: number;
    HARD: number;
}

interface SectionRequirement {
    title: string;
    type?: string;
    difficulty_distribution: DifficultyDistribution;
    time_limit: number;
}

interface AiGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: { topic: string; requirements: SectionRequirement[] }) => Promise<void>;
}

export default function AiGenerationModal({ isOpen, onClose, onGenerate }: AiGenerationModalProps) {
    const [topic, setTopic] = useState("");
    const [sections, setSections] = useState<SectionRequirement[]>([
        {
            title: "",
            type: "APTITUDE",
            difficulty_distribution: { EASY: 5, MEDIUM: 3, HARD: 2 },
            time_limit: 15
        }
    ]);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleAddSection = () => {
        setSections([...sections, {
            title: "",
            type: "APTITUDE",
            difficulty_distribution: { EASY: 5, MEDIUM: 3, HARD: 2 },
            time_limit: 15
        }]);
    };

    const handleRemoveSection = (index: number) => {
        if (sections.length > 1) {
            setSections(sections.filter((_, i) => i !== index));
        }
    };

    const updateSection = (index: number, field: string, value: any) => {
        const newSections = [...sections];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            // @ts-ignore
            newSections[index][parent] = { ...newSections[index][parent], [child]: value };
        } else {
            // @ts-ignore
            newSections[index][field] = value;
        }
        setSections(newSections);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) return;

        // Validation: Check if section titles are filled
        if (sections.some(s => !s.title)) {
            alert("Please fill in all section titles.");
            return;
        }

        setIsGenerating(true);
        try {
            await onGenerate({ topic, requirements: sections });
            // Close modal handled by parent on success? 
            // Usually parent closes. I'll wait.
        } catch (error) {
            console.error(error);
            alert("Failed to generate assessment. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            {isGenerating && <AIGenerationOverlay isOpen={isGenerating} title="Generating Assessment Structure..." />}

            <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <span className="material-icons-outlined text-white text-xl">auto_awesome</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Generate with AI</h2>
                            <p className="text-xs text-gray-500 font-medium">Define your requirements and let AI build the assessment</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-900 shadow-sm transition-colors"
                    >
                        <span className="material-icons-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Main Topic */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                            Assessment Topic / Role
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Python Developer, React Frontend, Data Structures"
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Sections Configuration */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                Sections & Structure
                            </label>
                            <button
                                type="button"
                                onClick={handleAddSection}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                <span className="material-icons-outlined text-sm">add</span>
                                Add Section
                            </button>
                        </div>

                        {sections.map((section, index) => (
                            <div key={index} className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 relative group hover:border-indigo-200 transition-colors">
                                {sections.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveSection(index)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove Section"
                                    >
                                        <span className="material-icons-outlined text-sm">delete</span>
                                    </button>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Section Title */}
                                    <div className="md:col-span-8">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Section Title</label>
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => updateSection(index, 'title', e.target.value)}
                                            placeholder={`Section ${index + 1} Topic (e.g. Core Concepts)`}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="md:col-span-4">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Type</label>
                                        <div className="relative">
                                            <select
                                                value={section.type || "APTITUDE"}
                                                onChange={(e) => updateSection(index, 'type', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:border-indigo-500 outline-none appearance-none"
                                            >
                                                <option value="APTITUDE">Aptitude (MCQ)</option>
                                                <option value="CODING">Coding</option>
                                                <option value="COMMUNICATION">Communication</option>
                                                <option value="SUBJECTIVE">Subjective</option>
                                                <option value="PERSONALITY">Personality</option>
                                                <option value="BEHAVIORAL">Behavioral</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-sm pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    {/* Difficulty Distribution */}
                                    <div className="md:col-span-8 grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-emerald-500 uppercase mb-1">Easy</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={section.difficulty_distribution.EASY}
                                                onChange={(e) => updateSection(index, 'difficulty_distribution.EASY', parseInt(e.target.value) || 0)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-500 outline-none text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-amber-500 uppercase mb-1">Medium</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={section.difficulty_distribution.MEDIUM}
                                                onChange={(e) => updateSection(index, 'difficulty_distribution.MEDIUM', parseInt(e.target.value) || 0)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs font-semibold text-gray-900 focus:border-amber-500 outline-none text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-red-500 uppercase mb-1">Hard</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={section.difficulty_distribution.HARD}
                                                onChange={(e) => updateSection(index, 'difficulty_distribution.HARD', parseInt(e.target.value) || 0)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs font-semibold text-gray-900 focus:border-red-500 outline-none text-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Time Limit */}
                                    <div className="md:col-span-4">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Time (Mins)</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-sm">schedule</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={section.time_limit}
                                                onChange={(e) => updateSection(index, 'time_limit', parseInt(e.target.value) || 0)}
                                                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-2 py-2 text-xs font-semibold text-gray-900 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isGenerating || !topic}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-indigo-200 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-outlined text-sm">auto_awesome</span>
                                Generate Assessment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
