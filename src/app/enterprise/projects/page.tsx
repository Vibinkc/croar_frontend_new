"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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
        proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 pt-2 animate-in fade-in duration-500">
            {/* Tactical Command Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-[2rem] border border-slate-100 p-3 shadow-xl shadow-slate-200/40">
                <div className="relative group flex-1 w-full sm:w-auto">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-indigo-500 transition-colors">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search deployments..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] font-black placeholder:text-slate-400 placeholder:uppercase placeholder:tracking-widest focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/enterprise/projects/add"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        <span className="material-symbols-rounded text-lg">add_circle</span>
                        Deploy Project
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-slate-50 h-48 rounded-[2.5rem] animate-pulse border border-slate-100"></div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-rounded text-4xl text-slate-100">account_tree</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Active Deployments</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize your first multi-member project mission to begin tracking progress.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((proj) => (
                        <motion.div
                            layout
                            key={proj.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2.5rem] border border-slate-100 p-1.5 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-6 pb-2 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                            <span className="material-symbols-rounded text-xl">folder_managed</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${proj.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{proj.status}</p>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mt-1 uppercase truncate max-w-[160px] group-hover:text-indigo-600 transition-colors italic">{proj.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                        <Link href={`/enterprise/projects/${proj.id}`} className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                                            <span className="material-symbols-rounded text-base">edit</span>
                                        </Link>
                                        <button onClick={() => { setProjectToDelete({ id: proj.id, name: proj.name }); setIsDeleteModalOpen(true); }} className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                                            <span className="material-symbols-rounded text-base">delete</span>
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight line-clamp-2 h-10 opacity-70">
                                    {proj.description || "Operational parameters not specified for this mission."}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex -space-x-2.5">
                                        {proj.members.length > 0 ? proj.members.slice(0, 4).map((m, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-slate-100" title={`${m.first_name} ${m.last_name}`}>
                                                {m.first_name[0]}
                                            </div>
                                        )) : (
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Unit_Null</span>
                                        )}
                                        {proj.members.length > 4 && (
                                            <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-400 shadow-sm ring-1 ring-slate-100">
                                                +{proj.members.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1 text-right">Mission End</p>
                                        <p className="text-[10px] font-black text-slate-800 leading-none tabular-nums text-right italic">{proj.end_date ? new Date(proj.end_date).toLocaleDateString() : 'TBD'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between rounded-b-[2.5rem] border-t border-slate-50">
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <span className="material-symbols-rounded text-sm">schedule</span>
                                    <span className="text-[9px] font-black tracking-widest uppercase truncate">{proj.start_date ? new Date(proj.start_date).toLocaleDateString() : 'TBD'}</span>
                                </div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">Tactical_Report</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

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
