"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import ProjectKanban from "./ProjectKanban";
import { Reorder } from "framer-motion";

interface ProjectFormProps {
    projectId?: string;
    initialData?: any;
}

export default function ProjectForm({ projectId, initialData }: ProjectFormProps) {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [employees, setEmployees] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    
    const [formData, setFormData] = useState<any>({
        name: "",
        description: "",
        status: "Active",
        start_date: "",
        end_date: "",
        company_id: "",
        members: [],
        tasks: [],
        kanban_columns: ["Planning", "Development", "Testing", "Done"]
    });

    const [newColumnName, setNewColumnName] = useState("");

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : "",
                end_date: initialData.end_date ? initialData.end_date.split('T')[0] : "",
                kanban_columns: initialData.kanban_columns || ["Planning", "Development", "Testing", "Done"]
            });
        }
    }, [initialData]);

    const fetchProjectData = async () => {
        if (!projectId) return;
        try {
            const res = await apiClient.get(`/api/v1/enterprise/projects/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    ...data,
                    start_date: data.start_date ? data.start_date.split('T')[0] : "",
                    end_date: data.end_date ? data.end_date.split('T')[0] : "",
                });
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchCompanies();
        fetchEmployees();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await apiClient.get("/api/v1/enterprise/company/");
            if (res.ok) setCompanies(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchEmployees = async () => {
        try {
            const res = await apiClient.get("/api/v1/enterprise/employees/");
            if (res.ok) setEmployees(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const url = projectId ? `/api/v1/enterprise/projects/${projectId}` : "/api/v1/enterprise/projects/";
            const method = projectId ? "PATCH" : "POST";
            
            const res = await apiClient.request(url, {
                method,
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    status: formData.status,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null,
                    company_id: formData.company_id,
                    kanban_columns: formData.kanban_columns
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (!projectId) {
                    router.push(`/enterprise/projects/${data.id}`);
                } else {
                    fetchProjectData();
                    alert("Project updated successfully!");
                    router.push("/enterprise/projects");
                }
            } else {
                const err = await res.json();
                alert(err.detail || "Something went wrong");
            }
        } catch (error) {
            console.error("Error saving project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async (employeeId: string) => {
        if (!projectId) {
            alert("Please save the project basics first before adding members.");
            return;
        }
        try {
            const res = await apiClient.request(`/api/v1/enterprise/projects/${projectId}/members`, {
                method: "POST",
                body: JSON.stringify({ employee_id: employeeId })
            });
            if (res.ok) {
                const updated = await res.json();
                setFormData(updated);
            }
        } catch (e) { console.error(e); }
    };

    const handleRemoveMember = async (employeeId: string) => {
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/projects/${projectId}/members/${employeeId}`);
            if (res.ok) {
                const updated = await res.json();
                setFormData(updated);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddColumn = () => {
        if (!newColumnName.trim()) return;
        if (formData.kanban_columns.includes(newColumnName.trim())) {
            alert("Column already exists");
            return;
        }
        setFormData((prev: any) => ({
            ...prev,
            kanban_columns: [...prev.kanban_columns, newColumnName.trim()]
        }));
        setNewColumnName("");
    };

    const handleRemoveColumn = (col: string) => {
        if (formData.tasks.some((t: any) => t.column === col)) {
            alert("Cannot remove column while it has tasks. Move or delete tasks first.");
            return;
        }
        setFormData((prev: any) => ({
            ...prev,
            kanban_columns: prev.kanban_columns.filter((c: string) => c !== col)
        }));
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {projectId ? "Project Console" : "New Project"}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {projectId ? formData.name : "Fill in the basic project information"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-[#7C3AED] text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#6D28D9] shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : projectId ? "Save Changes" : "Create Project"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
                <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === "basic" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                >Settings</button>
                <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === "members" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                >Team</button>
                {projectId && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("tasks")}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            activeTab === "tasks" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >Tasks & Board</button>
                )}
            </div>

            <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm border-t-4 border-t-[#7C3AED] animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
                {activeTab === "basic" && (
                    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-300">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-3 py-1 rounded-full">General Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name*</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                                        placeholder="Enter project name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company*</label>
                                    <select
                                        name="company_id"
                                        value={formData.company_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all resize-none"
                                    placeholder="Describe the project goals..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kanban Workflow Configuration */}
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-3 py-1 rounded-full">Kanban Workflow</h4>
                                <p className="text-[10px] text-slate-400 font-bold ml-1 mt-1">Define the custom stages for your project's task board.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Reorder.Group 
                                    axis="x" 
                                    values={formData.kanban_columns} 
                                    onReorder={(newOrder) => setFormData((prev: any) => ({ ...prev, kanban_columns: newOrder }))}
                                    className="flex flex-wrap gap-3"
                                >
                                    {formData.kanban_columns?.map((col: string, idx: number) => (
                                        <Reorder.Item 
                                            key={col} 
                                            value={col}
                                            className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-xl group cursor-grab active:cursor-grabbing hover:bg-indigo-100/50 transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <span className="material-symbols-rounded text-slate-400 text-sm">drag_indicator</span>
                                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{col}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveColumn(col)}
                                                className="text-indigo-300 hover:text-rose-500 transition-colors"
                                            >
                                                <span className="material-symbols-rounded text-base font-black">close</span>
                                            </button>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                                <div className="flex gap-2">
                                    <input
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColumn())}
                                        placeholder="Add new stage..."
                                        className="bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all w-40"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddColumn}
                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-[#7C3AED] hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <span className="material-symbols-rounded">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "members" && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Current Members */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-3 py-1 rounded-full">Project Team</h4>
                                <div className="grid gap-3">
                                    {(formData.members || []).length === 0 ? (
                                        <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                                            <p className="text-xs font-bold text-slate-400">No members assigned yet.</p>
                                        </div>
                                    ) : (
                                        formData.members.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                        {m.first_name[0]}{m.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 tracking-tight">{m.first_name} {m.last_name}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.designation || "Project Member"}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveMember(m.id)}
                                                    className="w-9 h-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-rounded text-xl">delete</span>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Add Members */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-slate-50 w-fit px-3 py-1 rounded-full">Assign Talent</h4>
                                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {employees
                                        .filter(emp => !(formData.members || []).some((m: any) => m.id === emp.id))
                                        .map((emp) => (
                                            <div key={emp.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#7C3AED]/20 hover:bg-slate-50/50 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 group-hover:bg-[#7C3AED]/10 group-hover:text-[#7C3AED] flex items-center justify-center font-black text-xs uppercase transition-all shadow-sm">
                                                        {emp.first_name[0]}{emp.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 tracking-tight">{emp.first_name} {emp.last_name}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.designation || "Available"}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleAddMember(emp.id)}
                                                    className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#7C3AED] hover:border-[#7C3AED] hover:bg-white transition-all shadow-sm"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "tasks" && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <ProjectKanban 
                            projectId={projectId!}
                            columns={formData.kanban_columns}
                            tasks={formData.tasks || []}
                            members={formData.members || []}
                            onRefresh={fetchProjectData}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
