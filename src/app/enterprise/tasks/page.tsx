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
        "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("postOnboarding.projectTasks")}</h1>
                        <PageHelp title={tr("postOnboarding.projectTasks")}>
                            <p>{tr("postOnboarding.tasksHelp1")}</p>
                            <p>{tr("postOnboarding.tasksHelp2")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("postOnboarding.tasksSubtitle")}</p>
                </div>

                <div className="relative shrink-0 sm:min-w-[220px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard
                    label={tr("postOnboarding.totalTasks")}
                    value={tasks.length}
                    icon="task_alt"
                    gradient="linear-gradient(135deg,#42A5F5,#1976D2)"
                    glow="rgba(25,118,210,0.28)"
                />
                <StatCard
                    label={tr("postOnboarding.inProgress")}
                    value={tasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length}
                    icon="sync"
                    gradient="linear-gradient(135deg,#42A5F5,#1565C0)"
                    glow="rgba(21,101,192,0.25)"
                />
                <StatCard
                    label={tr("postOnboarding.completed")}
                    value={tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length}
                    icon="check_circle"
                    gradient="linear-gradient(135deg,#66BB6A,#2E7D32)"
                    glow="rgba(46,125,50,0.25)"
                />
                <StatCard
                    label={tr("postOnboarding.upcoming")}
                    value={tasks.filter(t => t.due_date && new Date(t.due_date) > new Date()).length}
                    icon="event"
                    gradient="linear-gradient(135deg,#FFB74D,#EF6C00)"
                    glow="rgba(239,108,0,0.25)"
                />
            </StatGrid>

            {/* Content Area */}
            {isLoading ? (
                <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-4 space-y-2.5 min-h-[420px]">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                    ))}
                </div>
            ) : selectedProjectId !== "all" && selectedProjectData ? (
                /* Kanban View */
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span
                                className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0"
                                style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 6px 14px rgba(25,118,210,0.28)" }}
                            >
                                <Network className="w-[18px] h-[18px]" />
                            </span>
                            <div>
                                <h2 className="text-[16px] font-bold text-[#212121] tracking-tight leading-none">{selectedProjectData.name} {tr("postOnboarding.boardSuffix")}</h2>
                                <p className="text-[12.5px] text-[#757575] mt-1">{tr("postOnboarding.kanbanWorkspace")}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchProjectSpecificData(selectedProjectId)}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shrink-0"
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
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
                            <input
                                type="text"
                                placeholder={tr("postOnboarding.searchTasksPlaceholder")}
                                className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
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
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        </div>
                    </div>

                    {/* Task list */}
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                        {filteredGridTasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.taskDetails")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.project")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.assignee")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.status")}</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.dueDate")}</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EEEEEE]">
                                        {filteredGridTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-[#FAFAFA] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors">{task.title}</span>
                                                        <span className="text-[12.5px] text-[#757575] line-clamp-1 mt-0.5">{task.description || tr("postOnboarding.noDescription")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-[#1976D2]" />
                                                        <span className="text-[13px] font-medium text-[#424242]">{task.project?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {task.assignee ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center text-[11px] font-extrabold uppercase border border-[#BBDEFB]/60">
                                                                {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                            </div>
                                                            <span className="text-[13px] font-medium text-[#424242] capitalize">{task.assignee.first_name} {task.assignee.last_name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[13px] text-[#9E9E9E]">{tr("postOnboarding.unassigned")}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge tone={statusTone(task.status)} dot>{task.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-[13px] text-[#424242]">
                                                        <Calendar className="w-4 h-4 text-[#9E9E9E]" />
                                                        <span className={jetbrainsMono.className}>
                                                            {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : tr("postOnboarding.noDate")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/enterprise/projects/${task.project_id}`}
                                                        className="w-9 h-9 rounded-[4px] text-[#9E9E9E] hover:text-[#1976D2] hover:bg-[#E3F2FD] flex items-center justify-center transition-colors ml-auto"
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
