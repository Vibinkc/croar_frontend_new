"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

export default function ResumeBuilderAdmin() {
    return (
        <HierarchyDrilldown
            title="Resume Builder Management"
            description="Manage and create automated resume templates and scoring criteria."
            renderContent={(divisionId, departmentId) => (
                <ResumeBuilderList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function ResumeBuilderList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [analyzedFields, setAnalyzedFields] = useState<any>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [divisionId, departmentId]);

    const fetchTemplates = async () => {
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const res = await apiClient.get(`/api/v1/resume/builder/templates?${params.toString()}`);
            if (res.ok) {
                setTemplates(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAnalyze = async () => {
        if (!templateFile) return alert("Select a file first");
        setAnalyzing(true);
        const formData = new FormData();
        formData.append("file", templateFile);

        try {
            const res = await apiClient.post(`/api/v1/resume/builder/analyze`, formData);
            if (res.ok) {
                setAnalyzedFields(await res.json());
            } else {
                alert("Analysis failed");
            }
        } catch (err) {
            alert("Analysis failed");
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!templateName || (!templateFile && !editingId) || !analyzedFields) return;

        const formData = new FormData();
        formData.append("name", templateName);
        formData.append("fields", JSON.stringify(analyzedFields));
        if (departmentId) formData.append("department_id", departmentId.toString());

        if (templateFile) {
            formData.append("file", templateFile);
        }

        try {
            let res;
            if (editingId) {
                res = await apiClient.put(`/api/v1/resume/builder/template/${editingId}`, formData);
            } else {
                res = await apiClient.post(`/api/v1/resume/builder/template`, formData);
            }

            if (res.ok) {
                alert(editingId ? "Template updated!" : "Template saved!");
                resetForm();
                fetchTemplates();
            } else {
                alert("Operation failed");
            }
        } catch (err) {
            alert("Operation failed");
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this template?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/resume/builder/template/${id}`);
            if (res.ok) fetchTemplates();
        } catch (err) { console.error(err); }
    };

    const handleEdit = (tmpl: any) => {
        setTemplateName(tmpl.name);
        setAnalyzedFields({
            ...tmpl.extracted_fields,
            html_template: tmpl.html_template
        });
        setEditingId(tmpl.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetForm = () => {
        setTemplateName("");
        setTemplateFile(null);
        setAnalyzedFields(null);
        setEditingId(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section matching Aptitude style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Resume Templates</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Template Architecture & Parsing Rules
                    </p>
                </div>
            </div>

            {/* Create New Template */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black mb-4 text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <span className="material-icons-outlined text-lg text-slate-400">post_add</span>
                    {editingId ? "Edit Resume Template" : "Create New Resume Template"}
                </h2>
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Template Name</label>
                        <input
                            className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none transition-all font-medium text-black text-xs"
                            placeholder="e.g. Software Engineer Resume"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reference PDF {editingId && "(Optional if keeping existing)"}</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf"
                                className="block w-full text-xs text-slate-500
                                  file:mr-4 file:py-3 file:px-6
                                  file:rounded-xl file:border-0
                                  file:text-[10px] file:font-black file:uppercase file:tracking-widest
                                  file:bg-slate-50 file:text-slate-700
                                  hover:file:bg-[var(--color-primary)] hover:file:text-white
                                  file:transition-all
                                  cursor-pointer
                                "
                                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>

                    {!analyzedFields && (
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing || !templateFile}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${analyzing || !templateFile ? "bg-slate-50 text-slate-300 cursor-not-allowed" : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-xl shadow-indigo-100"}`}
                        >
                            {analyzing ? "Analyzing Document..." : "Analyze & Extract Fields"}
                        </button>
                    )}

                    {analyzedFields && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Extracted Structure Preview</h3>
                                <div className="text-[10px] overflow-auto max-h-60 bg-white p-4 rounded-xl border border-slate-100 font-mono text-slate-500">
                                    <pre>{JSON.stringify(analyzedFields, null, 2)}</pre>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-[var(--color-primary-dark)] transition-all"
                                >
                                    {editingId ? "Update Template" : "Save Template"}
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2.5 bg-slate-50 text-slate-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    {editingId ? "Cancel Edit" : "Reset Form"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* List Templates */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Existing Templates</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{templates.length} Active Architectures</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 flex flex-col group relative overflow-hidden h-full min-h-[200px]">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <span className="material-icons-outlined text-6xl">description</span>
                            </div>

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
                                    <span className="material-icons-outlined text-lg">description</span>
                                </div>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{format(new Date(t.created_at), "MMM d, yyyy")}</span>
                            </div>

                            <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1 relative z-10">{t.name}</h3>
                            <p className="text-[9px] font-bold text-slate-400 truncate mb-4 uppercase tracking-widest relative z-10">FILE: {t.file_url.split('/').pop()}</p>

                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50 relative z-10">
                                <div className="flex gap-2">
                                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:bg-indigo-50/50 group-hover:text-indigo-500 transition-colors">
                                        {t.extracted_fields?.sections?.length || 0} SECTIONS
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all" title="Edit">
                                        <span className="material-icons-outlined text-xs">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all" title="Delete">
                                        <span className="material-icons-outlined text-xs">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-300 bg-slate-50/10 rounded-[2rem] border-2 border-dashed border-slate-100">
                            <span className="material-icons-outlined text-4xl mb-4 block opacity-30">cloud_upload</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No_Templates_Deployed</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
