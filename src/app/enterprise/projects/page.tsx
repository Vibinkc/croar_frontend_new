"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    start_date: string;
    end_date: string;
    members: any[];
}

export default function ProjectsPage() {
    const { token } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredProjects = projects.filter(proj => 
        proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-4 pt-2 animate-in fade-in duration-500">
            {/* Command Bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 overflow-x-auto no-scrollbar">
                <div className="relative group min-w-[200px] flex-1">
                    <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#7C3AED] transition-colors">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/5 focus:bg-white focus:border-[#7C3AED] transition-all"
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0"></div>

                <Link
                    href="/enterprise/projects/add"
                    className="bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#6D28D9] shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap flex-shrink-0"
                >
                    <span className="material-symbols-rounded text-lg">add</span>
                    Create Project
                </Link>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[calc(100vh-12rem)] overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4 flex-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-slate-50 h-16 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <span className="material-symbols-rounded text-3xl text-slate-300">account_tree</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No Projects Found</h3>
                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                            Create your first project to start managing teams and assignments.
                        </p>
                        <Link href="/enterprise/projects/add" className="px-4 py-2 bg-indigo-50 text-[#7C3AED] font-bold text-xs rounded-lg hover:bg-slate-200 transition-all">Create New Project</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProjects.map((proj) => (
                                    <tr key={proj.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{proj.name}</span>
                                                <span className="text-[10px] font-semibold text-slate-500 line-clamp-1 max-w-[300px]">{proj.description || "No description"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                                proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                proj.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'Active' ? 'bg-emerald-500' : proj.status === 'Completed' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                                                {proj.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {proj.members.slice(0, 3).map((m, i) => (
                                                    <div key={i} className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white" title={`${m.first_name} ${m.last_name}`}>
                                                        {m.first_name[0]}
                                                    </div>
                                                ))}
                                                {proj.members.length > 3 && (
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-500">
                                                        +{proj.members.length - 3}
                                                    </div>
                                                )}
                                                {proj.members.length === 0 && (
                                                    <span className="text-[10px] font-bold text-slate-400 italic">No members</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-600">Start: {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : 'TBD'}</span>
                                                <span className="text-[10px] font-bold text-slate-400">End: {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : 'TBD'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/enterprise/projects/${proj.id}`}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 border border-transparent hover:border-[#7C3AED]/10 flex items-center justify-center transition-all"
                                                    title="Edit Project"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </Link>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Are you sure you want to delete this project?")) {
                                                            try {
                                                                const res = await apiClient.delete(`/api/v1/enterprise/projects/${proj.id}`);
                                                                if (res.ok) fetchProjects();
                                                                else alert("Failed to delete project");
                                                            } catch (e) {
                                                                console.error(e);
                                                            }
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center transition-all"
                                                    title="Delete Project"
                                                >
                                                    <span className="material-symbols-rounded text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
