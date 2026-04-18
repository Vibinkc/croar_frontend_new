"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/utils/api";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";
import Link from "next/link";

interface ResumeConfig {
    id: number;
    name: string;
    instruction_text: string;
    created_at: string;
}

export default function ResumeConfigPage() {
    return (
        <HierarchyDrilldown
            title="RESUME SCORER CONFIG"
            description="Define ATS rules, instructions, and scoring criteria for automated resume evaluation."
            renderContent={(divisionId, departmentId) => (
                <ResumeScorerList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function ResumeScorerList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const [configs, setConfigs] = useState<ResumeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [instruction, setInstruction] = useState("");
    const [formatFile, setFormatFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, [divisionId, departmentId]);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());

            const res = await apiClient.get(`/api/v1/resume/config?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("instruction_text", instruction);
            if (departmentId) formData.append("department_id", departmentId.toString());

            if (formatFile) {
                formData.append("file", formatFile);
            }

            let res;
            if (editingId) {
                res = await apiClient.put(`/api/v1/resume/config/${editingId}`, formData);
            } else {
                res = await apiClient.post(`/api/v1/resume/config`, formData);
            }

            if (res.ok) {
                resetForm();
                fetchConfigs();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this configuration?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/resume/config/${id}`);
            if (res.ok) fetchConfigs();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (config: ResumeConfig) => {
        setName(config.name);
        setInstruction(config.instruction_text);
        setEditingId(config.id);
        setIsCreating(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetForm = () => {
        setName("");
        setInstruction("");
        setFormatFile(null);
        setEditingId(null);
        setIsCreating(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Loading_Architecture</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section matching Aptitude style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight ">Resume Scorer Config</h1>
                    <p className="text-[10px] font-bold text-slate-400   mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Define ATS Rules & Scoring Criteria
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            if (isCreating) resetForm();
                            else setIsCreating(true);
                        }}
                        className={`group ${isCreating ? "bg-slate-100 text-slate-400 hover:bg-slate-200" : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"} px-6 py-3.5 rounded-2xl text-[10px] font-black   transition-all shadow-xl shadow-indigo-100/50 hover:shadow-indigo-200 flex items-center gap-3 active:scale-95`}
                    >
                        <span className="material-icons-outlined text-sm font-bold group-hover:rotate-90 transition-transform duration-500">{isCreating ? "close" : "add"}</span>
                        <span>{isCreating ? "Discard" : "New Configuration"}</span>
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-in slide-in-from-top-4 duration-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-base font-black text-slate-900  tracking-tight">{editingId ? "Modify Configuration" : "Initialize New Config"}</h3>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5">Config Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Data Scientist Resume"
                                className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none transition-all font-medium text-black text-xs"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-1.5">Instructions for AI Engine</label>
                            <textarea
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="Describe architectural patterns or skills the AI should evaluate. E.g. 'Must include Python, SQL.'"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none transition-all font-medium text-black min-h-[100px] text-xs"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400   mb-2">Reference Protocol (PDF) - Optional</label>
                            <label className="flex flex-col items-center px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50/30 hover:border-[var(--color-primary)]/50 transition-all group">
                                <span className="material-icons-outlined text-slate-300 mb-2 text-3xl transition-transform group-hover:scale-110 group-hover:text-[var(--color-primary)]">upload_file</span>
                                <span className="text-[10px] font-black text-slate-400   group-hover:text-[var(--color-primary)]">{formatFile ? formatFile.name : (editingId ? "Replace Protocol" : "Initialize Reference PDF")}</span>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setFormatFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-50">
                            <button type="submit" className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-2.5 rounded-xl text-[10px] font-black   transition-all shadow-xl shadow-indigo-100">
                                {editingId ? "Update Protocol" : "Deploy Config"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Configs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map(config => (
                    <div key={config.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-xl hover:border-slate-300 transition-all duration-500 group relative overflow-hidden flex flex-col h-full min-h-[220px]">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <span className="material-icons-outlined text-6xl">verified</span>
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
                                <span className="material-icons-outlined text-lg">terminal</span>
                            </div>
                            <span className="text-[8px] font-black text-[var(--color-primary)]   bg-indigo-50/50 border border-indigo-100 px-2 py-1 rounded-lg group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">ID_{config.id.toString().padStart(3, '0')}</span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900  tracking-tight mb-2 relative z-10 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{config.name}</h3>
                        <div className="relative z-10 flex-1 mb-4">
                            <p className="text-[9px] font-medium text-slate-400 line-clamp-3 bg-slate-50 p-3 rounded-xl leading-relaxed  border border-slate-100/50 group-hover:border-indigo-50/50 transition-colors">
                                "{config.instruction_text}"
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center relative z-10 mt-auto">
                            <span className="text-[8px] font-bold text-slate-300   flex items-center gap-1.5">
                                <span className="material-icons-outlined text-[10px]">calendar_today</span>
                                {new Date(config.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                                <Link href={`/admin/resume-scorer/${config.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all" title="Results">
                                    <span className="material-icons-outlined text-xs">analytics</span>
                                </Link>
                                <button onClick={() => handleEdit(config)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 text-slate-600 transition-all" title="Edit">
                                    <span className="material-icons-outlined text-xs">edit</span>
                                </button>
                                <button onClick={() => handleDelete(config.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all" title="Delete">
                                    <span className="material-icons-outlined text-xs">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {configs.length === 0 && (
                <div className="py-20 text-center text-slate-300 bg-slate-50/10 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <span className="material-icons-outlined text-4xl mb-4 block opacity-30">settings_input_component</span>
                    <p className="text-[10px] font-black  tracking-[0.2em]">No_Configurations_Deployed</p>
                </div>
            )}
        </div>
    );
}
