"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ProjectCard from "@/components/enterprise/ProjectCard";

interface Member {
    first_name: string;
    last_name: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    start_date: string;
    end_date: string;
    members: Member[];
}

export default function ProjectsPage() {
    const { token, canAccess } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        if (token) {
            fetchProjects();
        }
    }, [token]);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/v1/enterprise/projects/");
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!projectToDelete) return;
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/projects/${projectToDelete.id}`);
            if (res.ok) fetchProjects();
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
        }
    };

    const filteredProjects = projects.filter(proj => 
        (statusFilter === "all" || proj.status === statusFilter) &&
        (proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen">
            {/* Header */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0 shadow-sm shadow-[#7C3AED]/5">
                            <span className="material-symbols-rounded text-[#7C3AED] text-2xl">account_tree</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Project Management</h1>
                            <p className="text-slate-500 text-[13px] font-medium mt-1">
                                Track project milestones, manage team resources, and monitor deployment progress.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {canAccess("projects:moderate") && (
                            <Link
                                href="/enterprise/projects/add"
                                className="flex items-center gap-2 px-5 h-11 bg-[#7C3AED] text-white rounded-lg text-xs font-black hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7C3AED]/20 active:scale-95"
                            >
                                <span className="material-symbols-rounded text-lg">add_circle</span>
                                NEW PROJECT
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Projects", value: projects.length, icon: "rule", color: "indigo" },
                        { label: "Active Missions", value: projects.filter(p => p.status === 'Active').length, icon: "rocket_launch", color: "emerald" },
                        { label: "Completed", value: projects.filter(p => p.status === 'Completed').length, icon: "task_alt", color: "amber" },
                        { label: "Resources", value: projects.reduce((acc, p) => acc + (p.members?.length || 0), 0), icon: "groups", color: "purple" }
                    ].map((stat, i) => (
                        <div key={i} className="group bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#7C3AED]/20 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                                    stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                    stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                    'bg-purple-50 text-purple-600'
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
            </div>

            {/* Interaction Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#7C3AED]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects by name or description..."
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm min-w-[200px]">
                    <span className="material-symbols-rounded text-slate-400 ml-2 text-lg">filter_list</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Active">Active Missions</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-slate-50 h-16 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-rounded text-4xl text-slate-100">account_tree</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800  tracking-tight">No Active Projects</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize your first multi-member project mission to begin tracking progress.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Project Details</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Team</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProjects.map((proj) => (
                                    <tr key={proj.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <Link href={`/enterprise/projects/${proj.id}`} className="flex flex-col group/title">
                                                <span className="text-sm font-bold text-slate-900 group-hover/title:text-[#7C3AED] transition-colors">{proj.name}</span>
                                                <span className="text-xs text-slate-500 line-clamp-1">{proj.description || "No description provided"}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                                    <span className="material-symbols-rounded text-sm text-slate-400">calendar_today</span>
                                                    {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : "TBA"} - {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : "TBA"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                                proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                proj.status === 'Completed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    proj.status === 'Active' ? 'bg-emerald-500' :
                                                    proj.status === 'Completed' ? 'bg-indigo-500' :
                                                    'bg-slate-400'
                                                }`}></span>
                                                {proj.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {(proj.members || []).slice(0, 3).map((m: Member, i: number) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                                            {m.first_name?.[0]}{m.last_name?.[0]}
                                                        </div>
                                                    ))}
                                                    {(proj.members || []).length > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                            +{(proj.members || []).length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-400">{(proj.members || []).length} Members</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {canAccess("projects:moderate") && (
                                                    <Link
                                                        href={`/enterprise/projects/${proj.id}/edit`}
                                                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 flex items-center justify-center transition-all"
                                                        title="Edit Project"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">edit</span>
                                                    </Link>
                                                )}
                                                {canAccess("projects:delete") && (
                                                    <button
                                                        onClick={() => {
                                                            setProjectToDelete({ id: proj.id, name: proj.name });
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all"
                                                        title="Delete Project"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Terminate Mission Deployment?"
                message={`Are you sure you want to delete "${projectToDelete?.name}"? All associated task nodes and timeline data will be permanently wiped.`}
                confirmLabel="Yes, Terminate"
                cancelLabel="No"
                isDestructive={true}
            />
        </div>
    );
}
