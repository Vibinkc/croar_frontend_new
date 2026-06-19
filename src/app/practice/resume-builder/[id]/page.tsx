"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";

interface Field {
    key: string;
    label: string;
    type: string;
    placeholder: string;
}

interface Section {
    title: string;
    label: string;
    type: 'list' | 'object';
    fields: Field[];
}

interface Template {
    id: string;
    name: string;
    extracted_fields: {
        sections: Section[];
    };
}

export default function ResumeBuilderForm() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const submissionId = searchParams.get("sub");

    const [template, setTemplate] = useState<Template | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({}); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Auto-fill states
    const [parsingSource, setParsingSource] = useState<"none" | "file" | "text">("none");
    const [pastedText, setPastedText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    useEffect(() => {
        if (id) fetchTemplate();
    }, [id]);

    useEffect(() => {
        if (submissionId) fetchSubmission();
    }, [submissionId]);

    const fetchTemplate = async () => {
        try {
            const res = await apiClient.get(`/api/v1/resume/builder/template/${id}`);
            if (res.ok) {
                const t = await res.json();
                setTemplate(t);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchSubmission = async () => {
        try {
            const res = await apiClient.get(`/api/v1/resume/builder/submission/${submissionId}`);
            if (res.ok) {
                const sub = await res.json();
                setFormData(sub.data);
            }
        } catch (e) { console.error(e); }
    };

    const handleAutoFill = async () => {
        if (parsingSource === "file" && !selectedFile) return alert("Please select a file.");
        if (parsingSource === "text" && !pastedText.trim()) return alert("Please paste some text.");

        setIsParsing(true);
        try {
            const fd = new FormData();
            fd.append("template_id", id as string);
            if (parsingSource === "file" && selectedFile) fd.append("file", selectedFile);
            if (parsingSource === "text") fd.append("text", pastedText);

            const res = await apiClient.post(`/api/v1/resume/builder/parse`, fd);
            if (res.ok) {
                const data = await res.json();
                setFormData(data);
                alert("Form auto-filled with AI! Please review the fields.");
                setParsingSource("none");
                setSelectedFile(null);
                setPastedText("");
            } else {
                const err = await res.json();
                alert(err.detail || "AI Parsing failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to parser.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleFieldChange = (sectionKey: string, fieldKey: string, value: string, index?: number) => {
        setFormData((prev) => {
            const newBigData = { ...prev };

            // Check if section is list or object from template
            const sectionDef = template?.extracted_fields.sections.find((s) => s.title === sectionKey);
            if (!sectionDef) return prev;

            if (!newBigData[sectionKey]) {
                if (sectionDef.type === 'list') newBigData[sectionKey] = [];
                else newBigData[sectionKey] = {};
            }

            if (sectionDef.type === 'list') {
                if (index !== undefined) {
                    // Ensure list item exists
                    if (!newBigData[sectionKey][index]) newBigData[sectionKey][index] = {};
                    newBigData[sectionKey][index][fieldKey] = value;
                }
            } else {
                newBigData[sectionKey][fieldKey] = value;
            }
            return newBigData;
        });
    };

    const addListItem = (sectionKey: string) => {
        setFormData((prev) => {
            const newList = [...(prev[sectionKey] || []), {}];
            return { ...prev, [sectionKey]: newList };
        });
    };

    const removeListItem = (sectionKey: string, index: number) => {
        setFormData((prev) => {
            const newList = [...(prev[sectionKey] || [])];
            newList.splice(index, 1);
            return { ...prev, [sectionKey]: newList };
        });
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            let res;
            const payload = {
                template_id: template?.id,
                data: formData
            };

            if (submissionId) {
                res = await apiClient.put(`/api/v1/resume/builder/submission/${submissionId}`, payload);
            } else {
                res = await apiClient.post(`/api/v1/resume/builder/submission`, payload);
            }

            if (res.ok) {
                alert(submissionId ? "Resume updated successfully!" : "Resume saved successfully!");
                router.push("/practice/resume-builder");
            } else {
                alert("Failed to save.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!template) return <div className="p-10 text-center">Template not found</div>;

    const sections = template.extracted_fields?.sections || [];

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <AIGenerationOverlay isOpen={saving} title="Architecting Career Narrative" />
            <header className="mb-8 border-b pb-4">
                <Link href="/practice/resume-builder" className="text-sm font-bold text-slate-400 hover:text-slate-600 mb-2 inline-block">← Back</Link>
                <h1 className="text-2xl font-black text-slate-900">{template.name}</h1>
                <p className="text-slate-500 text-sm">Fill in the details below to generate your resume.</p>
            </header>

            {/* Quick Start / AI Auto-Fill */}
            <div className="bg-orange-50 rounded-2xl border border-orange-200 p-8 mb-12 shadow-sm group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-100 rotate-3 group-hover:rotate-0 transition-transform">
                            <span className="material-icons-outlined text-3xl">auto_awesome</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Resume Auto-Fill</h2>
                            <p className="text-sm text-slate-500 font-bold  ">Save time, let AI fill the fields</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setParsingSource(parsingSource === "file" ? "none" : "file")}
                        className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${parsingSource === "file" ? "border-orange-600 bg-white shadow-lg" : "border-orange-100 bg-white/50 hover:bg-white hover:border-orange-300"}`}
                    >
                        <div className={`p-3 rounded-xl ${parsingSource === "file" ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-600"}`}>
                            <span className="material-icons-outlined">file_upload</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-black text-slate-900">Upload Doc</h3>
                            <p className="text-[10px] text-slate-400 font-black  ">PDF, Word or Text</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setParsingSource(parsingSource === "text" ? "none" : "text")}
                        className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${parsingSource === "text" ? "border-orange-600 bg-white shadow-lg" : "border-orange-100 bg-white/50 hover:bg-white hover:border-orange-300"}`}
                    >
                        <div className={`p-3 rounded-xl ${parsingSource === "text" ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-600"}`}>
                            <span className="material-icons-outlined">content_paste</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-base font-black text-slate-900">Paste Text</h3>
                            <p className="text-[10px] text-slate-400 font-black  ">Fastest processing</p>
                        </div>
                    </button>
                </div>

                {parsingSource === "file" && (
                    <div className="mt-8 p-6 bg-white rounded-2xl border-2 border-dashed border-orange-200 animate-in fade-in slide-in-from-top-4 duration-300">
                        <label htmlFor="resume-file-input" className="block text-sm font-black text-slate-900 mb-2">Select your resume (PDF, DOCX or TXT)</label>
                        <input
                            id="resume-file-input"
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-orange-600 file:text-white hover:file:bg-orange-700 cursor-pointer"
                        />
                    </div>
                )}

                {parsingSource === "text" && (
                    <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <label htmlFor="resume-paste-text" className="block text-sm font-black text-slate-900 mb-2">Paste resume text below</label>
                        <textarea
                            id="resume-paste-text"
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="e.g. John Doe, Senior Software Engineer..."
                            className="w-full text-sm p-5 rounded-2xl border-2 border-orange-200 focus:ring-8 focus:ring-orange-50 focus:border-orange-400 outline-none h-48 transition-all font-medium"
                        />
                    </div>
                )}

                {(parsingSource !== "none") && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-orange-100">
                        <p className="text-xs text-orange-600 font-bold ">AI will automatically identify and map your experience to the template fields.</p>
                        <button
                            disabled={isParsing}
                            onClick={handleAutoFill}
                            className={`w-full sm:w-auto px-10 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 ${isParsing ? "opacity-75 cursor-wait" : "hover:-translate-y-1 active:translate-y-0"}`}
                        >
                            {isParsing ? (
                                <>
                                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="  text-xs">Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-outlined">bolt</span>
                                    <span className="  text-xs">Start Auto-Fill</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {sections.map((section: Section) => (
                    <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h2 className="text-lg font-bold text-slate-800  tracking-tight">{section.label || section.title}</h2>
                            {section.type === 'list' && (
                                <button
                                    onClick={() => addListItem(section.title)}
                                    className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    + Add Item
                                </button>
                            )}
                        </div>

                        {section.type === 'list' ? (
                            <div className="space-y-6">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(formData[section.title] || []).map((item: Record<string, any>, idx: number) => (
                                    <div key={idx} className="relative bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <button
                                            onClick={() => removeListItem(section.title, idx)}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                                        >
                                            <span className="material-icons-outlined text-sm">close</span>
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {section.fields.map((field: Field) => (
                                                <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">{field.label}</label>
                                                    {field.type === 'textarea' ? (
                                                        <textarea
                                                            className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                                                            rows={3}
                                                            placeholder={field.placeholder}
                                                            value={item[field.key] || ""}
                                                            onChange={(e) => handleFieldChange(section.title, field.key, e.target.value, idx)}
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type || 'text'}
                                                            className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                                                            placeholder={field.placeholder}
                                                            value={item[field.key] || ""}
                                                            onChange={(e) => handleFieldChange(section.title, field.key, e.target.value, idx)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {(formData[section.title] || []).length === 0 && (
                                    <p className="text-center text-xs text-slate-400 py-4 ">No items added yet.</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {section.fields.map((field: Field) => (
                                    <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">{field.label}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                                                rows={4}
                                                placeholder={field.placeholder}
                                                value={formData[section.title]?.[field.key] || ""}
                                                onChange={(e) => handleFieldChange(section.title, field.key, e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                                                placeholder={field.placeholder}
                                                value={formData[section.title]?.[field.key] || ""}
                                                onChange={(e) => handleFieldChange(section.title, field.key, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    Save & Generate Resume
                </button>
            </div>
        </div>
    );
}
