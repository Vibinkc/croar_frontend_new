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
                setTasks(data);
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
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
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
                        className="bg-transparent border-none text-[9px] font-black text-slate-900 uppercase tracking-widest focus:outline-none focus:ring-0 cursor-pointer min-w-[160px]"
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
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Interactive Kanban Workspace</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => fetchProjectSpecificData(selectedProjectId)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            <span className="material-symbols-rounded text-sm">refresh</span>
                            Sync Board
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
                /* Consolidated Grid View */
                <div className="space-y-6">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[280px] relative">
                            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search tasks, descriptions or project names..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-[10px] font-bold focus:outline-none focus:ring-0 transition-all border border-transparent focus:border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredGridTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredGridTasks.map((task) => (
                                <TaskCard 
                                    key={task.id}
                                    task={task}
                                    getStatusColor={getStatusColor}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-rounded text-slate-300 text-4xl">folder_off</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">No tasks found</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                We couldn't find any tasks matching your criteria. Try adjusting your search or selecting a specific project.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
