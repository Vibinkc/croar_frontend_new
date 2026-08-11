"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import { format } from "date-fns";
import {
    Search,
    Filter,
    ChevronDown,
    RefreshCcw,
    Network,
    ExternalLink,
    Calendar,
} from "lucide-react";
import ProjectKanban from "@/components/enterprise/ProjectKanban";
import { apiClient } from "@/utils/api";
import { StatCard, StatGrid, Badge, EmptyState, Button, PageHelp, jetbrainsMono } from "@/components/ds";

interface Member {
    id: string;
    first_name: string;
    last_name: string;
}

interface Project {
    id: string;
    name: string;
    kanban_columns: string[];
    members: Member[];
}

interface ProjectTask {
    id: string;
    title: string;
    description: string;
    status: string;
    column: string;
    due_date: string | null;
    project_id: string;
    employee_id: string | null;
    project?: {
        name: string;
    };
    assignee?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export default function GlobalTasksPage() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");


    useEffect(() => {
        if (token) {
            fetchProjects();
            if (selectedProjectId === "all") {
                fetchAllTasks();
            } else {
                fetchProjectSpecificData(selectedProjectId);
            }
        }
    }, [token, selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const res = await apiClient.request("/api/v1/enterprise/projects/");
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (err) {
            console.error("Failed to fetch projects", err);
        }
    };

    const fetchAllTasks = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.request("/api/v1/enterprise/projects/tasks/all");
            if (res.ok) {
                const data = await res.json();
                setTasks(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch all tasks", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjectSpecificData = async (id: string) => {
        setIsLoading(true);
        try {
            // Fetch project details
            const projRes = await apiClient.request(`/api/v1/enterprise/projects/${id}`);
            if (projRes.ok) {
                const projData = await projRes.json();
                setSelectedProjectData(projData);
            }

            // Fetch project tasks
            const taskRes = await apiClient.request(`/api/v1/enterprise/projects/${id}/tasks`);
            if (taskRes.ok) {
                const taskData = await taskRes.json();
                setTasks(taskData);
            }
        } catch (err) {
            console.error("Failed to fetch project data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredGridTasks = tasks.filter(task => {
        const matchesSearch = (task.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (task.project?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusTone = (status: string): "success" | "info" | "warning" | "neutral" => {
        switch (status.toLowerCase()) {
            case "done":
            case "completed":
                return "success";
            case "development":
            case "in progress":
                return "info";
            case "testing":
            case "review":
                return "warning";
            default:
                return "neutral";
        }
    };

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("postOnboarding.projectTasks")}</h1>
                        <PageHelp title={tr("postOnboarding.projectTasks")}>
                            <p>{tr("postOnboarding.tasksHelp1")}</p>
                            <p>{tr("postOnboarding.tasksHelp2")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("postOnboarding.tasksSubtitle")}</p>
                </div>

                <div className="relative shrink-0 sm:min-w-[220px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    <select
                        className={`${selectCls} w-full`}
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                        <option value="all">{tr("postOnboarding.allProjectsGrid")}</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard
                    label={tr("postOnboarding.totalTasks")}
                    value={tasks.length}
                    icon="task_alt"
                    gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
                    glow="rgba(91,83,224,0.28)"
                />
                <StatCard
                    label={tr("postOnboarding.inProgress")}
                    value={tasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length}
                    icon="sync"
                    gradient="linear-gradient(135deg,#6E8BEA,#3559C7)"
                    glow="rgba(53,89,199,0.25)"
                />
                <StatCard
                    label={tr("postOnboarding.completed")}
                    value={tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length}
                    icon="check_circle"
                    gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
                    glow="rgba(14,138,110,0.25)"
                />
                <StatCard
                    label={tr("postOnboarding.upcoming")}
                    value={tasks.filter(t => t.due_date && new Date(t.due_date) > new Date()).length}
                    icon="event"
                    gradient="linear-gradient(135deg,#F6B65C,#D97706)"
                    glow="rgba(217,119,6,0.25)"
                />
            </StatGrid>

            {/* Content Area */}
            {isLoading ? (
                <div className="bg-white rounded-[14px] border border-[#E8EAED] p-4 space-y-2.5 min-h-[420px]">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                    ))}
                </div>
            ) : selectedProjectId !== "all" && selectedProjectData ? (
                /* Kanban View */
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span
                                className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0"
                                style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 6px 14px rgba(91,83,224,0.28)" }}
                            >
                                <Network className="w-[18px] h-[18px]" />
                            </span>
                            <div>
                                <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight leading-none">{selectedProjectData.name} {tr("postOnboarding.boardSuffix")}</h2>
                                <p className="text-[12.5px] text-[#8A929E] mt-1">{tr("postOnboarding.kanbanWorkspace")}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchProjectSpecificData(selectedProjectId)}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shrink-0"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            {tr("postOnboarding.syncBoard")}
                        </button>
                    </div>

                    <ProjectKanban
                        projectId={selectedProjectData.id}
                        columns={selectedProjectData.kanban_columns}
                        tasks={tasks}
                        members={selectedProjectData.members}
                        onRefresh={() => fetchProjectSpecificData(selectedProjectId)}
                    />
                </div>
            ) : (
                /* Consolidated Table View */
                <div className="space-y-6">
                    {/* Toolbar: search + filter */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                            <input
                                type="text"
                                placeholder={tr("postOnboarding.searchTasksPlaceholder")}
                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`${selectCls} w-full md:min-w-[170px]`}
                            >
                                <option value="all">{tr("postOnboarding.allStages")}</option>
                                <option value="Pending">{tr("postOnboarding.pending")}</option>
                                <option value="Doing">{tr("postOnboarding.inProgress")}</option>
                                <option value="Done">{tr("postOnboarding.completed")}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        </div>
                    </div>

                    {/* Task list */}
                    <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                        {filteredGridTasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.taskDetails")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.project")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.assignee")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.status")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.dueDate")}</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{tr("postOnboarding.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F0F0F1]">
                                        {filteredGridTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-[#F7F7F8] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">{task.title}</span>
                                                        <span className="text-[12.5px] text-[#8A929E] line-clamp-1 mt-0.5">{task.description || tr("postOnboarding.noDescription")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-[#5B53E0]" />
                                                        <span className="text-[13px] font-medium text-[#374151]">{task.project?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {task.assignee ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center text-[11px] font-extrabold uppercase border border-[#DAD7F6]/60">
                                                                {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                            </div>
                                                            <span className="text-[13px] font-medium text-[#374151] capitalize">{task.assignee.first_name} {task.assignee.last_name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[13px] text-[#9AA3AF]">{tr("postOnboarding.unassigned")}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge tone={statusTone(task.status)} dot>{task.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-[13px] text-[#374151]">
                                                        <Calendar className="w-4 h-4 text-[#9AA3AF]" />
                                                        <span className={jetbrainsMono.className}>
                                                            {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : tr("postOnboarding.noDate")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/enterprise/projects/${task.project_id}`}
                                                        className="w-9 h-9 rounded-[9px] text-[#9AA3AF] hover:text-[#5B53E0] hover:bg-[#ECEBFB] flex items-center justify-center transition-colors ml-auto"
                                                        title={tr("postOnboarding.viewProjectBoard")}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : tasks.length === 0 ? (
                            <EmptyState
                                tone="brand"
                                icon="checklist"
                                title={tr("postOnboarding.noTasksYet")}
                                description={tr("postOnboarding.noTasksYetDesc")}
                                action={
                                    <Link href="/enterprise/projects">
                                        <Button>{tr("postOnboarding.goToProjects")}</Button>
                                    </Link>
                                }
                            />
                        ) : (
                            <EmptyState
                                tone="muted"
                                icon="search_off"
                                title={tr("postOnboarding.noTasksFound")}
                                description={tr("postOnboarding.noTasksFoundDesc")}
                                action={
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("all");
                                        }}
                                    >
                                        {tr("postOnboarding.resetFilters")}
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
