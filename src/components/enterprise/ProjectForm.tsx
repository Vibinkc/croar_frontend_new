"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import ProjectKanban from "./ProjectKanban";
import { Reorder } from "framer-motion";
import { Button, Card, CardHeader, Input, Textarea, Select, Field, PageHeader, jetbrainsMono } from "@/components/ds";

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    designation?: string;
}

interface Company {
    id: string;
    name: string;
}

interface Task {
    id: string;
    title: string;
    description: string;
    column: string;
    status: string;
    due_date?: string | null;
    assignee?: Employee;
    employee_id?: string | null;
}

interface ProjectData {
    id?: string;
    name: string;
    description: string;
    status: string;
    start_date: string;
    end_date: string;
    company_id: string;
    members: Employee[];
    tasks: Task[];
    kanban_columns: string[];
}

interface ProjectFormProps {
    projectId?: string;
    initialData?: ProjectData;
}

export default function ProjectForm({ projectId, initialData }: ProjectFormProps) {
    const router = useRouter();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    
    const [formData, setFormData] = useState<ProjectData>({
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
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const url = projectId ? `/api/v1/enterprise/projects/${projectId}` : "/api/v1/enterprise/projects/";
            const method = projectId ? "PUT" : "POST";
            
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
        setFormData((prev) => ({
            ...prev,
            kanban_columns: [...prev.kanban_columns, newColumnName.trim()]
        }));
        setNewColumnName("");
    };

    const handleRemoveColumn = (col: string) => {
        if (formData.tasks.some((t) => t.column === col)) {
            alert("Cannot remove column while it has tasks. Move or delete tasks first.");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            kanban_columns: prev.kanban_columns.filter((c: string) => c !== col)
        }));
    };

    return (
        <div className="max-w-[1100px] mx-auto w-full px-4 sm:px-5 md:px-7 pb-10 space-y-6 animate-in fade-in duration-500">
            <PageHeader
                help={<><p>Name the project, set up its board columns and add team members.</p><p>Save to create it, then add and track tasks from the board.</p></>}
                title={projectId ? "Project Console" : "New Project"}
                subtitle={projectId ? (formData.name || "Manage project settings, team & board") : "Fill in the basic project information"}
                onBack={() => router.push("/enterprise/projects")}
                actions={
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        icon={projectId ? "save" : "add"}
                    >
                        {isLoading ? "Saving..." : projectId ? "Save Changes" : "Create Project"}
                    </Button>
                }
            />

            {/* Tabs */}
            <div className="flex gap-1.5 p-1.5 bg-white border border-[#E8EAED] rounded-[14px] w-fit">
                <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className={`px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors ${
                        activeTab === "basic" ? "bg-[#5B53E0] text-white shadow-[0_4px_12px_rgba(91,83,224,0.28)]" : "text-[#8A929E] hover:text-[#374151] hover:bg-[#F4F5F7]"
                    }`}
                >Settings</button>
                <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={`px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors ${
                        activeTab === "members" ? "bg-[#5B53E0] text-white shadow-[0_4px_12px_rgba(91,83,224,0.28)]" : "text-[#8A929E] hover:text-[#374151] hover:bg-[#F4F5F7]"
                    }`}
                >Team</button>
                {projectId && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("tasks")}
                        className={`px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors ${
                            activeTab === "tasks" ? "bg-[#5B53E0] text-white shadow-[0_4px_12px_rgba(91,83,224,0.28)]" : "text-[#8A929E] hover:text-[#374151] hover:bg-[#F4F5F7]"
                        }`}
                    >Tasks &amp; Board</button>
                )}
            </div>

            {activeTab === "basic" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* General Information */}
                    <Card padding="lg">
                        <CardHeader title="General Information" subtitle="Core details that describe this project." />
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Project Name" htmlFor="project-name" required>
                                    <Input
                                        id="project-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter project name"
                                    />
                                </Field>
                                <Field label="Company" htmlFor="project-company" required>
                                    <Select
                                        id="project-company"
                                        name="company_id"
                                        value={formData.company_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Description" htmlFor="project-description">
                                <Textarea
                                    id="project-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Describe the project goals..."
                                    className="resize-none"
                                />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <Field label="Status" htmlFor="project-status">
                                    <Select
                                        id="project-status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </Select>
                                </Field>
                                <Field label="Start Date" htmlFor="project-start-date">
                                    <Input
                                        id="project-start-date"
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className={jetbrainsMono.className}
                                    />
                                </Field>
                                <Field label="End Date" htmlFor="project-end-date">
                                    <Input
                                        id="project-end-date"
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className={jetbrainsMono.className}
                                    />
                                </Field>
                            </div>
                        </div>
                    </Card>

                    {/* Kanban Workflow Configuration */}
                    <Card padding="lg">
                        <CardHeader
                            title="Kanban Workflow"
                            subtitle="Define the custom stages for your project's task board."
                        />
                        <div className="flex flex-wrap gap-3">
                            <Reorder.Group
                                axis="x"
                                values={formData.kanban_columns}
                                onReorder={(newOrder) => setFormData((prev) => ({ ...prev, kanban_columns: newOrder }))}
                                className="flex flex-wrap gap-3"
                            >
                                {formData.kanban_columns?.map((col: string, idx: number) => (
                                    <Reorder.Item
                                        key={col}
                                        value={col}
                                        className="flex items-center gap-2 bg-[#ECEBFB] border border-[#5B53E0]/15 pl-2.5 pr-2 py-2 rounded-[10px] group cursor-grab active:cursor-grabbing hover:bg-[#E3E1F9] transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <span className="material-symbols-rounded text-[#8A929E] text-[18px]">drag_indicator</span>
                                        <span className="text-[13px] font-semibold text-[#5B53E0]">{col}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveColumn(col)}
                                            className="text-[#5B53E0]/50 hover:text-[#EF4444] transition-colors flex items-center"
                                        >
                                            <span className="material-symbols-rounded text-[18px]">close</span>
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
                                    className="h-10 bg-white border border-dashed border-[#E1E4E8] rounded-[10px] px-3.5 text-[13px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all w-44"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddColumn}
                                    className="w-10 h-10 rounded-[10px] bg-[#F1F2F5] text-[#8A929E] hover:bg-[#5B53E0] hover:text-white transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-rounded text-[20px]">add</span>
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "members" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    {/* Current Members */}
                    <Card padding="lg">
                        <CardHeader title="Project Team" subtitle="People currently assigned to this project." />
                        <div className="grid gap-3">
                            {(formData.members || []).length === 0 ? (
                                <div className="p-10 border border-dashed border-[#E1E4E8] rounded-[12px] text-center">
                                    <p className="text-[13px] font-medium text-[#8A929E]">No members assigned yet.</p>
                                </div>
                            ) : (
                                formData.members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-[12px] border border-[#E8EAED] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#15171C] text-white flex items-center justify-center font-semibold text-[13px] uppercase">
                                                {m.first_name[0]}{m.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-[#15171C] capitalize">{m.first_name} {m.last_name}</p>
                                                <p className="text-[12px] font-medium text-[#8A929E]">{m.designation || "Project Member"}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="w-9 h-9 rounded-[9px] text-[#9AA3AF] hover:text-[#EF4444] hover:bg-[#FDECEC] transition-colors flex items-center justify-center"
                                        >
                                            <span className="material-symbols-rounded text-[20px]">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Add Members */}
                    <Card padding="lg">
                        <CardHeader title="Assign Talent" subtitle="Add available employees to the project." />
                        <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                            {employees
                                .filter(emp => !(formData.members || []).some((m) => m.id === emp.id))
                                .map((emp) => (
                                    <div key={emp.id} className="flex items-center justify-between p-3.5 bg-white border border-[#E8EAED] rounded-[12px] hover:border-[#5B53E0]/30 hover:bg-[#F7F8FA] transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#F1F2F5] text-[#8A929E] group-hover:bg-[#ECEBFB] group-hover:text-[#5B53E0] flex items-center justify-center font-semibold text-[13px] transition-colors uppercase">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-[#15171C] capitalize">{emp.first_name} {emp.last_name}</p>
                                                <p className="text-[12px] font-medium text-[#8A929E]">{emp.designation || "Available"}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleAddMember(emp.id)}
                                        >
                                            Assign
                                        </Button>
                                    </div>
                                ))
                            }
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "tasks" && (
                <div className="animate-in fade-in duration-300">
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
    );
}
