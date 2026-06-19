"use client";

import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface OnboardingField {
    name: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "email" | "phone" | "file";
    required: boolean;
    options?: string[];
}

interface Section {
    id: string;
    title: string;
    fields: OnboardingField[];
}

interface OnboardingTemplate {
    id: string;
    name: string;
    description?: string;
    sections: string[];
    form_config: { sections: Section[] };
}

interface OnboardingTemplateFormProps {
    template?: OnboardingTemplate | null;
}

export default function OnboardingTemplateForm({ template }: OnboardingTemplateFormProps) {
    const router = useRouter();
    const { token, canAccess } = useAuth();

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sections, setSections] = useState<Section[]>([]);
    const [newSectionTitle, setNewSectionTitle] = useState("");

    // Field Builder State
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldType, setNewFieldType] = useState<OnboardingField["type"]>("text");
    const [newFieldRequired, setNewFieldRequired] = useState(false);
    const [newFieldOptions, setNewFieldOptions] = useState("");

    useEffect(() => {
        if (template) {
            setTimeout(() => {
                setName(template.name);
                setDescription(template.description || "");
                setSections(template.form_config?.sections || []);
                if (template.form_config?.sections?.length > 0) {
                    setActiveSectionId(template.form_config.sections[0].id);
                }
            }, 0);
        }
    }, [template]);

    const handleSave = async () => {
        if (!name) return alert("Template name is required");
        if (sections.length === 0) return alert("At least one section is required");

        const payload = {
            name,
            description,
            sections: sections.map(s => s.id),
            form_config: { sections }
        };

        const url = template 
            ? `${BACKEND_URL}/api/v1/enterprise/onboarding/templates/${template.id}`
            : `${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`;
        
        try {
            const res = await fetch(url, {
                method: template ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push("/enterprise/settings/onboarding-templates");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to save template");
            }
        } catch (error) {
            console.error("Error saving template:", error);
        }
    };

    const addSection = () => {
        if (!newSectionTitle.trim()) {
            alert("Please enter a section title first.");
            return;
        }
        const newSec: Section = {
            id: `sec_${Date.now()}`,
            title: newSectionTitle.trim(),
            fields: []
        };
        setSections([...sections, newSec]);
        setNewSectionTitle("");
        setActiveSectionId(newSec.id);
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
        if (activeSectionId === id) setActiveSectionId(null);
    };

    const addField = () => {
        if (!activeSectionId) {
            alert("Please select or create a section first.");
            return;
        }
        if (!newFieldLabel.trim()) {
            alert("Field label is required.");
            return;
        }

        const fieldIdentifier = newFieldName.trim() || newFieldLabel.trim().toLowerCase().replace(/\s+/g, "_");
        
        const newField: OnboardingField = {
            name: fieldIdentifier,
            label: newFieldLabel.trim(),
            type: newFieldType,
            required: newFieldRequired,
            options: newFieldType === "select" ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined
        };

        setSections(sections.map(s => s.id === activeSectionId ? { ...s, fields: [...s.fields, newField] } : s));

        setNewFieldName("");
        setNewFieldLabel("");
        setNewFieldType("text");
        setNewFieldRequired(false);
        setNewFieldOptions("");
    };

    const removeField = (sectionId: string, index: number) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, fields: s.fields.filter((_, i) => i !== index) } : s));
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-10">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="otf-template-name" className="text-[10px] font-black text-slate-400   ml-1">Template Name</label>
                            <input
                                id="otf-template-name"
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                placeholder="e.g. Executive Onboarding"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                readOnly={!canAccess("onboarding:moderate")}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="otf-template-description" className="text-[10px] font-black text-slate-400   ml-1">Overall Description</label>
                            <textarea
                                id="otf-template-description"
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm min-h-[120px]"
                                placeholder="Purpose of this flow..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                readOnly={!canAccess("onboarding:moderate")}
                            />
                        </div>
                    </div>

                    {/* Section Management */}
                    <div className="space-y-6">
                        <label htmlFor="otf-new-section-title" className="text-[10px] font-black text-slate-400   ml-1 block">Define Sections</label>
                        <div className="space-y-3">
                            {sections.map((s, idx) => (
                                <div
                                    key={s.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveSectionId(s.id)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setActiveSectionId(s.id); } }}
                                    className={`group flex items-center justify-between p-5 rounded-[24px] border transition-all cursor-pointer ${activeSectionId === s.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black opacity-40">{idx + 1}</span>
                                        <span className="text-sm font-black">{s.title}</span>
                                    </div>
                                     {canAccess("onboarding:moderate") && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeSection(s.id); }}
                                            className={`p-2 rounded-lg transition-colors ${activeSectionId === s.id ? "hover:bg-indigo-500 text-indigo-200 hover:text-white" : "hover:bg-red-50 text-slate-300 hover:text-red-500"}`}
                                        >
                                            <span className="material-icons-outlined text-lg">delete</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                         {canAccess("onboarding:moderate") && (
                            <div className="pt-4 flex gap-3">
                                <input
                                    id="otf-new-section-title"
                                    type="text"
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:border-indigo-500"
                                    placeholder="New Section Title..."
                                    value={newSectionTitle}
                                    onChange={(e) => setNewSectionTitle(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSection()}
                                />
                                <button 
                                    onClick={addSection}
                                    className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all"
                                >
                                    <span className="material-icons-outlined">add</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Field Builder Column */}
                <div className="lg:col-span-2 bg-slate-50 rounded-[48px] p-10 border border-slate-100 min-h-[500px]">
                    {activeSectionId ? (
                        <motion.div 
                            key={activeSectionId} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-10"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {sections.find(s => s.id === activeSectionId)?.title}
                                    </h4>
                                    <p className="text-slate-500 text-xs font-medium mt-1">Configure fields for this section.</p>
                                </div>
                                <span className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black  ">
                                    {(sections.find(s => s.id === activeSectionId)?.fields || []).length} Fields
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(sections.find(s => s.id === activeSectionId)?.fields || []).map((field, idx) => (
                                    <div key={idx} className="p-6 bg-white rounded-[28px] border border-slate-100 flex items-center justify-between group/field shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/field:bg-indigo-50 group-hover/field:text-indigo-600 transition-colors">
                                                <span className="material-icons-outlined text-lg">
                                                    {field.type === "text" ? "input" : field.type === "date" ? "event" : field.type === "select" ? "list" : field.type === "file" ? "upload_file" : "contact_phone"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{field.label}</p>
                                                <p className="text-[9px] font-black text-slate-400  ">{field.type} • {field.required ? "Required" : "Optional"}</p>
                                            </div>
                                        </div>
                                         {canAccess("onboarding:moderate") && (
                                            <button 
                                                onClick={() => removeField(activeSectionId, idx)}
                                                className="opacity-0 group-hover/field:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <span className="material-icons-outlined text-lg">close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                             {/* Add New Field Box */}
                            {canAccess("onboarding:moderate") && (
                                <div className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-6">
                                    <h5 className="text-xs font-black   text-slate-400">Add New Field</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="otf-new-field-label" className="text-[9px] font-black text-slate-500   ml-1">Field Label (Display)</label>
                                            <input
                                                id="otf-new-field-label"
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                placeholder="e.g. Your Mobile Number"
                                                value={newFieldLabel}
                                                onChange={(e) => {
                                                    setNewFieldLabel(e.target.value);
                                                    if (!newFieldName) {
                                                        setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="otf-new-field-type" className="text-[9px] font-black text-slate-500   ml-1">Field Type</label>
                                            <select
                                                id="otf-new-field-type"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                value={newFieldType}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                onChange={(e) => setNewFieldType(e.target.value as any)}
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="email">Email Address</option>
                                                <option value="phone">Phone Number</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date Picker</option>
                                                <option value="select">Dropdown (Select)</option>
                                                <option value="file">File Upload</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="otf-new-field-name" className="text-[9px] font-black text-slate-500   ml-1">Unique Identifier</label>
                                            <input
                                                id="otf-new-field-name"
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                placeholder="e.g. mobile_number"
                                                value={newFieldName}
                                                onChange={(e) => setNewFieldName(e.target.value)}
                                            />
                                        </div>
                                        {newFieldType === "select" && (
                                            <div className="space-y-2">
                                                <label htmlFor="otf-new-field-options" className="text-[9px] font-black text-slate-500   ml-1">Options (Comma Separated)</label>
                                                <input
                                                    id="otf-new-field-options"
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:border-indigo-500 outline-none"
                                                    placeholder="e.g. Option 1, Option 2, Option 3"
                                                    value={newFieldOptions}
                                                    onChange={(e) => setNewFieldOptions(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-end pb-1 gap-3">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setNewFieldRequired(!newFieldRequired)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setNewFieldRequired(!newFieldRequired); } }}
                                                className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${newFieldRequired ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-100 text-slate-400"}`}
                                            >
                                                <span className="material-icons-outlined text-lg">{newFieldRequired ? "check_box" : "check_box_outline_blank"}</span>
                                                <span className="text-[10px] font-black  ">Mark as Required</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={addField}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px]   hover:bg-black transition-all shadow-lg"
                                    >
                                        Add Field to {sections.find(s => s.id === activeSectionId)?.title}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-6">
                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-slate-200">
                                <span className="material-icons-outlined text-5xl text-indigo-500 animate-pulse">layers</span>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900">Select a Section</h4>
                                <p className="text-slate-500 text-xs font-medium max-w-[240px] mx-auto mt-2 leading-relaxed">
                                    Add or select a section from the left column to start building your custom form.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 flex gap-4">
                <button 
                    onClick={() => router.push("/enterprise/settings/onboarding-templates")}
                    className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs   transition-all"
                >
                    Cancel
                </button>
                {canAccess("onboarding:moderate") && (
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs   transition-all shadow-2xl shadow-indigo-500/40"
                    >
                        {template ? "Update Template" : "Save Template"}
                    </button>
                )}
            </div>
        </div>
    );
}
