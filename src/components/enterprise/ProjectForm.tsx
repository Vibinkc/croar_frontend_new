"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
    const { t: tr } = useI18n();
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
                    alert(tr("forms.projectUpdatedSuccess"));
                    router.push("/enterprise/projects");
                }
            } else {
                const err = await res.json();
                alert(err.detail || tr("forms.somethingWentWrong"));
            }
        } catch (error) {
            console.error("Error saving project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async (employeeId: string) => {
        if (!projectId) {
            alert(tr("forms.alertSaveProjectFirst"));
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
            alert(tr("forms.alertColumnExists"));
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
            alert(tr("forms.alertCannotRemoveColumn"));
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
                help={<><p>{tr("forms.projHelp1")}</p><p>{tr("forms.projHelp2")}</p></>}
                title={projectId ? tr("forms.projectConsole") : tr("forms.newProject")}
                subtitle={projectId ? (formData.name || tr("forms.manageProjectSubtitle")) : tr("forms.fillBasicProjectInfo")}
                onBack={() => router.push("/enterprise/projects")}
                actions={
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        icon={projectId ? "save" : "add"}
                    >
                        {isLoading ? tr("forms.saving") : projectId ? tr("forms.saveChanges") : tr("forms.createProject")}
                    </Button>
                }
            />

            {/* Tabs */}
            <div className="flex gap-1.5 p-1.5 bg-white border border-[#E0E0E0] rounded-[4px] w-fit">
                <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className={`px-5 py-2 rounded-[4px] text-[13px] font-semibold transition-colors ${
                        activeTab === "basic" ? "bg-[#1976D2] text-white shadow-[0_4px_12px_rgba(25,118,210,0.28)]" : "text-[#757575] hover:text-[#424242] hover:bg-[#F5F6F8]"
                    }`}
                >{tr("forms.tabSettings")}</button>
                <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={`px-5 py-2 rounded-[4px] text-[13px] font-semibold transition-colors ${
                        activeTab === "members" ? "bg-[#1976D2] text-white shadow-[0_4px_12px_rgba(25,118,210,0.28)]" : "text-[#757575] hover:text-[#424242] hover:bg-[#F5F6F8]"
                    }`}
                >{tr("forms.tabTeam")}</button>
                {projectId && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("tasks")}
                        className={`px-5 py-2 rounded-[4px] text-[13px] font-semibold transition-colors ${
                            activeTab === "tasks" ? "bg-[#1976D2] text-white shadow-[0_4px_12px_rgba(25,118,210,0.28)]" : "text-[#757575] hover:text-[#424242] hover:bg-[#F5F6F8]"
                        }`}
                    >{tr("forms.tabTasksBoard")}</button>
                )}
            </div>

            {activeTab === "basic" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* General Information */}
                    <Card padding="lg">
                        <CardHeader title={tr("forms.generalInformation")} subtitle={tr("forms.generalInfoSubtitle")} />
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label={tr("forms.projectName")} htmlFor="project-name" required>
                                    <Input
                                        id="project-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder={tr("forms.projectNamePlaceholder")}
                                    />
                                </Field>
                                <Field label={tr("forms.company")} htmlFor="project-company" required>
                                    <Select
                                        id="project-company"
                                        name="company_id"
                                        value={formData.company_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{tr("forms.selectCompany")}</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Select>
                                </Field>
                            </div>

                            <Field label={tr("forms.description")} htmlFor="project-description">
                                <Textarea
                                    id="project-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder={tr("forms.descriptionPlaceholder")}
                                    className="resize-none"
                                />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <Field label={tr("forms.status")} htmlFor="project-status">
                                    <Select
                                        id="project-status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Active">{tr("forms.active")}</option>
                                        <option value="Completed">{tr("forms.completed")}</option>
                                        <option value="On Hold">{tr("forms.onHold")}</option>
                                    </Select>
                                </Field>
                                <Field label={tr("forms.startDate")} htmlFor="project-start-date">
                                    <Input
                                        id="project-start-date"
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className={jetbrainsMono.className}
                                    />
                                </Field>
                                <Field label={tr("forms.endDate")} htmlFor="project-end-date">
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
                            title={tr("forms.kanbanWorkflow")}
                            subtitle={tr("forms.kanbanWorkflowSubtitle")}
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
                                        className="flex items-center gap-2 bg-[#E3F2FD] border border-[#1976D2]/15 pl-2.5 pr-2 py-2 rounded-[4px] group cursor-grab active:cursor-grabbing hover:bg-[#E3E1F9] transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <i className="mdi mdi-drag text-[#757575] text-[18px]" />
                                        <span className="text-[13px] font-semibold text-[#1976D2]">{col}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveColumn(col)}
                                            className="text-[#1976D2]/50 hover:text-[#E53935] transition-colors flex items-center"
                                        >
                                            <i className="mdi mdi-close text-[18px]" />
                                        </button>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                            <div className="flex gap-2">
                                <input
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColumn())}
                                    placeholder={tr("forms.addNewStagePlaceholder")}
                                    className="h-10 bg-white border border-dashed border-[#E0E0E0] rounded-[4px] px-3.5 text-[13px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all w-44"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddColumn}
                                    className="w-10 h-10 rounded-[4px] bg-[#EEEEEE] text-[#757575] hover:bg-[#1976D2] hover:text-white transition-colors flex items-center justify-center"
                                >
                                    <i className="mdi mdi-plus text-[20px]" />
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
                        <CardHeader title={tr("forms.projectTeam")} subtitle={tr("forms.projectTeamSubtitle")} />
                        <div className="grid gap-3">
                            {(formData.members || []).length === 0 ? (
                                <div className="p-10 border border-dashed border-[#E0E0E0] rounded-[4px] text-center">
                                    <p className="text-[13px] font-medium text-[#757575]">{tr("forms.noMembersAssigned")}</p>
                                </div>
                            ) : (
                                formData.members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-3.5 bg-[#FAFAFA] rounded-[4px] border border-[#E0E0E0] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#212121] text-white flex items-center justify-center font-semibold text-[13px] uppercase">
                                                {m.first_name[0]}{m.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-[#212121] capitalize">{m.first_name} {m.last_name}</p>
                                                <p className="text-[12px] font-medium text-[#757575]">{m.designation || tr("forms.projectMember")}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="w-9 h-9 rounded-[4px] text-[#9E9E9E] hover:text-[#E53935] hover:bg-[#FFEBEE] transition-colors flex items-center justify-center"
                                        >
                                            <i className="mdi mdi-delete text-[20px]" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Add Members */}
                    <Card padding="lg">
                        <CardHeader title={tr("forms.assignTalent")} subtitle={tr("forms.assignTalentSubtitle")} />
                        <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                            {employees
                                .filter(emp => !(formData.members || []).some((m) => m.id === emp.id))
                                .map((emp) => (
                                    <div key={emp.id} className="flex items-center justify-between p-3.5 bg-white border border-[#E0E0E0] rounded-[4px] hover:border-[#1976D2]/30 hover:bg-[#FAFAFA] transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#EEEEEE] text-[#757575] group-hover:bg-[#E3F2FD] group-hover:text-[#1976D2] flex items-center justify-center font-semibold text-[13px] transition-colors uppercase">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-[#212121] capitalize">{emp.first_name} {emp.last_name}</p>
                                                <p className="text-[12px] font-medium text-[#757575]">{emp.designation || tr("forms.available")}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleAddMember(emp.id)}
                                        >
                                            {tr("forms.assign")}
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
