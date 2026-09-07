"use client";

import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { jetbrainsMono } from "@/components/ds";

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
    const { t: tr } = useI18n();

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

    // Save / validation / dirty-check state
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [initialSnapshot, setInitialSnapshot] = useState("");

    useEffect(() => {
        if (template) {
            setTimeout(() => {
                const secs = template.form_config?.sections || [];
                setName(template.name);
                setDescription(template.description || "");
                setSections(secs);
                if (secs.length > 0) {
                    setActiveSectionId(secs[0].id);
                }
                setInitialSnapshot(JSON.stringify({ name: template.name, description: template.description || "", sections: secs }));
            }, 0);
        } else {
            setInitialSnapshot(JSON.stringify({ name: "", description: "", sections: [] }));
        }
    }, [template]);

    const isDirty = JSON.stringify({ name, description, sections }) !== initialSnapshot;

    const handleSave = async () => {
        if (!name.trim()) { setSaveError(tr("forms.errAddTemplateName")); return; }
        if (sections.length === 0) { setSaveError(tr("forms.errAddSection")); return; }
        const totalFields = sections.reduce((acc, s) => acc + s.fields.length, 0);
        if (totalFields === 0) { setSaveError(tr("forms.errAddField")); return; }
        setSaveError(null);

        const payload = {
            name,
            description,
            sections: sections.map(s => s.id),
            form_config: { sections }
        };

        const url = template
            ? `${BACKEND_URL}/api/v1/enterprise/onboarding/templates/${template.id}`
            : `${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`;

        setIsSaving(true);
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
                router.push("/enterprise/templates/onboarding-templates");
            } else {
                const err = await res.json();
                setSaveError(err.detail || tr("forms.errFailedSaveTemplate"));
            }
        } catch (error) {
            console.error("Error saving template:", error);
            setSaveError(tr("forms.errSaveWentWrong"));
        } finally {
            setIsSaving(false);
        }
    };

    const addSection = () => {
        if (!newSectionTitle.trim()) {
            alert(tr("forms.alertSectionTitleFirst"));
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
            alert(tr("forms.alertSelectSectionFirst"));
            return;
        }
        if (!newFieldLabel.trim()) {
            alert(tr("forms.alertFieldLabelRequired"));
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-5 space-y-4 shadow-sm">
                        <div className="space-y-1.5">
                            <label htmlFor="otf-template-name" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("forms.templateName")}</label>
                            <input
                                id="otf-template-name"
                                type="text"
                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                placeholder={tr("forms.templateNamePlaceholder")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                readOnly={!canAccess("onboarding:moderate")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="otf-template-description" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("forms.overallDescription")}</label>
                            <textarea
                                id="otf-template-description"
                                className="w-full bg-white border border-[#E0E0E0] rounded-[4px] p-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none min-h-[100px] leading-relaxed"
                                placeholder={tr("forms.overallDescriptionPlaceholder")}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                readOnly={!canAccess("onboarding:moderate")}
                            />
                        </div>
                    </div>

                    {/* Section Management */}
                    <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-5 space-y-4 shadow-sm">
                        <label htmlFor="otf-new-section-title" className="text-[11.5px] font-bold text-[#757575] ml-0.5 block">{tr("forms.defineSections")}</label>
                        <div className="space-y-2">
                            {sections.map((s, idx) => (
                                <div
                                    key={s.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveSectionId(s.id)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setActiveSectionId(s.id); } }}
                                    className={`group flex items-center justify-between p-3.5 rounded-[4px] border transition-all cursor-pointer ${activeSectionId === s.id ? "bg-[#E3F2FD] border-[#1976D2] text-[#1976D2]" : "bg-white border-[#E0E0E0] text-[#424242] hover:border-[#1976D2]/40 hover:bg-[#F8F9FA]"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[11px] font-bold ${activeSectionId === s.id ? "text-[#1976D2]/70" : "text-[#757575]"}`}>{idx + 1}</span>
                                        <span className="text-[13.5px] font-bold">{s.title}</span>
                                    </div>
                                    {canAccess("onboarding:moderate") && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeSection(s.id); }}
                                            className={`p-1 rounded-[3px] transition-colors ${activeSectionId === s.id ? "hover:bg-[#1976D2]/10 text-[#1976D2]" : "hover:bg-red-50 text-[#757575] hover:text-rose-500"}`}
                                        >
                                            <span className="material-icons-outlined text-[16px]">delete</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {canAccess("onboarding:moderate") && (
                            <div className="pt-2 flex gap-2">
                                <input
                                    id="otf-new-section-title"
                                    type="text"
                                    className="flex-1 h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                    placeholder={tr("forms.newSectionTitlePlaceholder")}
                                    value={newSectionTitle}
                                    onChange={(e) => setNewSectionTitle(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSection()}
                                />
                                <button 
                                    onClick={addSection}
                                    className="w-10 h-10 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] flex items-center justify-center transition-all shadow-sm"
                                >
                                    <span className="material-icons-outlined text-[20px]">add</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Field Builder Column */}
                <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[4px] p-6 min-h-[500px] shadow-sm">
                    {activeSectionId ? (
                        <motion.div 
                            key={activeSectionId} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center pb-2 border-b border-[#E0E0E0]">
                                <div>
                                    <h4 className="text-[16px] font-extrabold text-[#212121] tracking-tight">
                                        {sections.find(s => s.id === activeSectionId)?.title}
                                    </h4>
                                    <p className="text-[12px] text-[#757575] mt-0.5">{tr("forms.configureFields")}</p>
                                </div>
                                <span className="px-2.5 py-1 bg-[#E3F2FD] text-[#1976D2] rounded-[3px] border border-[#BBDEFB]/60 text-[10px] font-bold">
                                    {(sections.find(s => s.id === activeSectionId)?.fields || []).length} {tr("forms.fieldsLabel")}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(sections.find(s => s.id === activeSectionId)?.fields || []).map((field, idx) => (
                                    <div key={idx} className="p-3.5 bg-white rounded-[4px] border border-[#E0E0E0] flex items-center justify-between group/field hover:border-[#1976D2]/40 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 transition-colors">
                                                <span className="material-icons-outlined text-[18px]">
                                                    {field.type === "text" ? "input" : field.type === "date" ? "event" : field.type === "select" ? "list" : field.type === "file" ? "upload_file" : "contact_phone"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[13.5px] font-bold text-[#212121]">{field.label}</p>
                                                <p className="text-[10px] text-[#757575] uppercase tracking-wider font-semibold">{field.type} • {field.required ? tr("forms.required") : tr("forms.optional")}</p>
                                            </div>
                                        </div>
                                        {canAccess("onboarding:moderate") && (
                                            <button 
                                                onClick={() => removeField(activeSectionId, idx)}
                                                className="opacity-0 group-hover/field:opacity-100 p-1 text-[#757575] hover:text-rose-500 hover:bg-rose-50 rounded-[3px] transition-all"
                                            >
                                                <span className="material-icons-outlined text-[16px]">close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add New Field Box */}
                            {canAccess("onboarding:moderate") && (
                                <div className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-[4px] p-5 space-y-5">
                                    <h5 className="text-[12.5px] font-bold text-[#212121]">{tr("forms.addNewField")}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="otf-new-field-label" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("forms.fieldLabelDisplay")}</label>
                                            <input
                                                id="otf-new-field-label"
                                                type="text"
                                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                placeholder={tr("forms.fieldLabelPlaceholder")}
                                                value={newFieldLabel}
                                                onChange={(e) => {
                                                    setNewFieldLabel(e.target.value);
                                                    if (!newFieldName) {
                                                        setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="otf-new-field-type" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("forms.fieldType")}</label>
                                            <select
                                                id="otf-new-field-type"
                                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all cursor-pointer"
                                                value={newFieldType}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                onChange={(e) => setNewFieldType(e.target.value as any)}
                                            >
                                                <option value="text">{tr("forms.typeTextInput")}</option>
                                                <option value="email">{tr("forms.typeEmailAddress")}</option>
                                                <option value="phone">{tr("forms.phoneNumber")}</option>
                                                <option value="number">{tr("forms.typeNumber")}</option>
                                                <option value="date">{tr("forms.typeDatePicker")}</option>
                                                <option value="select">{tr("forms.typeDropdown")}</option>
                                                <option value="file">{tr("forms.typeFileUpload")}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="otf-new-field-name" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("forms.uniqueIdentifier")}</label>
                                            <input
                                                id="otf-new-field-name"
                                                type="text"
                                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                placeholder={tr("forms.uniqueIdentifierPlaceholder")}
                                                value={newFieldName}
                                                onChange={(e) => setNewFieldName(e.target.value)}
                                            />
                                        </div>
                                        {newFieldType === "select" && (
                                            <div className="space-y-1.5">
                                                <label htmlFor="otf-new-field-options" className="text-[11px] font-bold text-[#757575] ml-0.5">{tr("forms.optionsCommaSeparated")}</label>
                                                <input
                                                    id="otf-new-field-options"
                                                    type="text"
                                                    className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                    placeholder={tr("forms.optionsPlaceholder")}
                                                    value={newFieldOptions}
                                                    onChange={(e) => setNewFieldOptions(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-end pb-0.5 gap-3">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setNewFieldRequired(!newFieldRequired)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setNewFieldRequired(!newFieldRequired); } }}
                                                className={`flex items-center gap-2 cursor-pointer h-10 px-3.5 rounded-[4px] border transition-all ${newFieldRequired ? "bg-[#E3F2FD]/30 border-[#1976D2] text-[#1976D2]" : "bg-white border-[#E0E0E0] text-[#757575]"}`}
                                            >
                                                <span className="material-icons-outlined text-[18px]">{newFieldRequired ? "check_box" : "check_box_outline_blank"}</span>
                                                <span className="text-[11px] font-bold">{tr("forms.markAsRequired")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={addField}
                                        className="w-full h-10 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-sm transition-all flex items-center justify-center"
                                    >
                                        {tr("forms.addFieldTo")} {sections.find(s => s.id === activeSectionId)?.title}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                            <div className="w-14 h-14 bg-[#E3F2FD] border border-[#BBDEFB]/60 text-[#1976D2] rounded-[4px] flex items-center justify-center">
                                <span className="material-icons-outlined text-3xl animate-pulse">layers</span>
                            </div>
                            <div>
                                <h4 className="text-[16px] font-bold text-[#212121]">{tr("forms.selectASection")}</h4>
                                <p className="text-[#757575] text-[12.5px] leading-relaxed max-w-[240px] mx-auto mt-1.5">
                                    {tr("forms.selectSectionHint")}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {saveError && (
                <div className="mt-6 flex items-start gap-2.5 rounded-[4px] border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <span className="material-icons-outlined text-[18px] text-amber-600 mt-0.5 shrink-0">error_outline</span>
                    <p className="text-[12.5px] font-semibold text-amber-800 leading-relaxed">{saveError}</p>
                </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#E0E0E0] pt-6">
                <button
                    onClick={() => router.push("/enterprise/templates/onboarding-templates")}
                    className="h-10 px-6 bg-white border border-[#E0E0E0] hover:bg-[#F5F6F8] text-[#424242] rounded-[4px] font-semibold text-[13px] shadow-sm transition-all"
                >
                    {tr("common.cancel")}
                </button>
                {canAccess("onboarding:moderate") && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (!!template && !isDirty)}
                        title={template && !isDirty ? tr("forms.noChangesToSave") : undefined}
                        className="h-10 px-6 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13px] shadow-[0_4px_12px_rgba(25,118,210,0.2)] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1976D2]"
                    >
                        {isSaving && <span className="material-icons-outlined text-[18px] animate-spin">progress_activity</span>}
                        {isSaving ? (template ? tr("forms.updating") : tr("forms.savingEllipsis")) : (template ? tr("forms.updateTemplate") : tr("forms.saveTemplate"))}
                    </button>
                )}
            </div>
        </div>
    );
}
