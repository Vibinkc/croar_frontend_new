"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ProjectCard from "@/components/enterprise/ProjectCard";

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
    const { token, canAccess } = useAuth();
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
        <div className="p-4 sm:p-6 space-y-6 pt-2 animate-in fade-in duration-500">
            {/* Tactical Command Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="relative group flex-1 w-full sm:w-auto">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-[#7C3AED] transition-colors">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search deployments..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-12 pr-6 text-[10px] font-bold placeholder:text-slate-400 placeholder: placeholder: focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                    />
                </div>

                {canAccess("projects:moderate") && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href="/enterprise/projects/add"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl text-[9px] font-black   hover:bg-[#6D28D9] transition-all active:scale-95 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add_circle</span>
                            Deploy
                        </Link>
                    </div>
                )}
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-slate-50 h-40 rounded-xl animate-pulse border border-slate-100"></div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-rounded text-4xl text-slate-100">account_tree</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800  tracking-tight">No Active Deployments</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize your first multi-member project mission to begin tracking progress.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProjects.map((proj) => (
                        <ProjectCard 
                            key={proj.id}
                            project={proj}
                            canModerate={canAccess("projects:moderate")}
                            canDelete={canAccess("projects:delete")}
                            onDelete={(id, name) => {
                                setProjectToDelete({ id, name });
                                setIsDeleteModalOpen(true);
                            }}
                        />
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
