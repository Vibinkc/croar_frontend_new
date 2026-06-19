"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { format } from "date-fns";
import ProjectKanban from "@/components/enterprise/ProjectKanban";
import { apiClient } from "@/utils/api";
import TaskCard from "@/components/enterprise/TaskCard";

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

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "done":
            case "completed":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "development":
            case "in progress":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "testing":
            case "review":
                return "bg-amber-100 text-amber-700 border-amber-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">Project Tasks</h1>
                    <p className="text-slate-500 text-[10px] font-medium">Manage and track assignments across all projects</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="material-symbols-rounded text-slate-400 ml-1.5 text-lg">filter_list</span>
                    <select
                        className="bg-transparent border-none text-[9px] font-black text-slate-900   focus:outline-none focus:ring-0 cursor-pointer min-w-[160px]"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                        <option value="all">All Projects (Grid)</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks", value: tasks.length, icon: "assignment", color: "indigo" },
                    { label: "In Progress", value: tasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length, icon: "sync", color: "blue" },
                    { label: "Completed", value: tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length, icon: "task_alt", color: "emerald" },
                    { label: "Upcoming", value: tasks.filter(t => t.due_date && new Date(t.due_date) > new Date()).length, icon: "event", color: "amber" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-amber-50 text-amber-600'
                            }`}>
                                <span className="material-symbols-rounded text-xl">{stat.icon}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 mb-0.5 tracking-tight">{stat.value}</p>
                        <p className="text-[11px] font-bold text-slate-400 capitalize">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : selectedProjectId !== "all" && selectedProjectData ? (
                /* Kanban View */
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                            <span className="material-symbols-rounded">account_tree</span>
                        </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 leading-none">{selectedProjectData.name} Board</h2>
                                <p className="text-[9px] font-black text-slate-400   mt-1">Interactive Kanban Workspace</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => fetchProjectSpecificData(selectedProjectId)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-600   hover:bg-slate-50 transition-all"
                        >
                            <span className="material-symbols-rounded text-sm">refresh</span>
                            {"Sync Board"}
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
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[280px] relative group">
                            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#7C3AED]">search</span>
                            <input
                                type="text"
                                placeholder="Search tasks, descriptions or project names..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[11px] font-bold focus:outline-none focus:ring-0 transition-all focus:bg-white focus:border-[#7C3AED]/20 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 min-w-[180px]">
                            <span className="material-symbols-rounded text-slate-400 ml-1.5 text-lg">filter_alt</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full bg-transparent border-none text-[10px] font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-tight"
                            >
                                <option value="all">All Stages</option>
                                <option value="Pending">Pending</option>
                                <option value="Doing">In Progress</option>
                                <option value="Done">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {filteredGridTasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredGridTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">{task.title}</span>
                                                        <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description || "No description"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{task.project?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {task.assignee ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black uppercase">
                                                                {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-bold text-slate-700 capitalize">{task.assignee.first_name} {task.assignee.last_name}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                                        <span className="material-symbols-rounded text-sm text-slate-400">event</span>
                                                        {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No date"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link 
                                                        href={`/enterprise/projects/${task.project_id}`}
                                                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 flex items-center justify-center transition-all ml-auto"
                                                        title="View Project Board"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">open_in_new</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-xl p-20 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-rounded text-slate-300 text-4xl">folder_off</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">No tasks found</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                                    We couldn&apos;t find any tasks matching your criteria. Try adjusting your search or selecting a specific project.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
