"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import {
    FolderKanban,
    Search,
    Filter,
    ChevronDown,
    Plus,
    Calendar,
    FileEdit,
    Trash2,
} from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Badge, StatCard, StatGrid, EmptyState, Button, PageHelp, jetbrainsMono } from "@/components/ds";

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

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    const statusBadge = (status: string) =>
        status === "Active" ? (
            <Badge tone="success" dot>{status}</Badge>
        ) : status === "Completed" ? (
            <Badge tone="indigo" dot>{status}</Badge>
        ) : (
            <Badge tone="neutral" dot>{status || "—"}</Badge>
        );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Projects</h1>
                        <PageHelp title="Projects">
                            <p>Organise work into projects, each with its own team and kanban board.</p>
                            <p><strong>New Project</strong> to create one; open a project to manage its board and members. Tasks live inside projects.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Track milestones, resources &amp; deployment progress</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {canAccess("projects:moderate") && (
                        <Link
                            href="/enterprise/projects/add"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> New Project
                        </Link>
                    )}
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label="Total Projects" value={projects.length} icon="folder" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label="Active Missions" value={projects.filter(p => p.status === 'Active').length} icon="rocket_launch" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Completed" value={projects.filter(p => p.status === 'Completed').length} icon="task_alt" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
                <StatCard label="Resources" value={projects.reduce((acc, p) => acc + (p.members?.length || 0), 0)} icon="group" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects by name or description…"
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[160px]`}
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active Missions</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Project list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    projects.length === 0 ? (
                        <EmptyState
                            icon="lan"
                            tone="brand"
                            title="Create your first project"
                            description="Group work into projects with their own team and board, then add tasks."
                            action={
                                canAccess("projects:moderate") ? (
                                    <Link href="/enterprise/projects/add">
                                        <Button icon="add">New Project</Button>
                                    </Link>
                                ) : undefined
                            }
                        />
                    ) : (
                        <EmptyState
                            icon="search_off"
                            tone="muted"
                            title="No projects match your filters"
                            description="Try adjusting your filters or search terms to find what you're looking for."
                            action={
                                <Button variant="secondary" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                    Clear all filters
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_0.9fr_1.2fr_110px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Project Details</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Timeline</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Team</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_0.9fr_1.2fr_110px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Project details */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <FolderKanban className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <Link href={`/enterprise/projects/${proj.id}`} className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">
                                                {proj.name}
                                            </Link>
                                            <span className="block text-[12px] text-[#8A929E] truncate mt-0.5">{proj.description || "No description provided"}</span>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-1 text-[12px] text-[#8A929E] md:hidden">
                                                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : "TBA"}</span>
                                                <span className={jetbrainsMono.className}>{(proj.members || []).length} members</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 text-[13px] text-[#374151] min-w-0">
                                        <Calendar className="w-4 h-4 text-[#9AA3AF] shrink-0" />
                                        <span className="truncate">
                                            {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : "TBA"} – {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : "TBA"}
                                        </span>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">{statusBadge(proj.status)}</div>

                                    {/* Team (desktop) */}
                                    <div className="hidden md:flex items-center gap-2 min-w-0">
                                        <div className="flex -space-x-2">
                                            {(proj.members || []).slice(0, 3).map((m: Member, i: number) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-[#ECEBFB] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#5B53E0] uppercase">
                                                    {m.first_name?.[0]}{m.last_name?.[0]}
                                                </div>
                                            ))}
                                            {(proj.members || []).length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-[#F1F2F5] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#8A929E]">
                                                    +{(proj.members || []).length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[12px] text-[#8A929E] ${jetbrainsMono.className}`}>{(proj.members || []).length}</span>
                                    </div>

                                    {/* Status + actions (mobile bundles status; desktop = actions cell) */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">{statusBadge(proj.status)}</div>

                                        {canAccess("projects:moderate") && (
                                            <Link
                                                href={`/enterprise/projects/${proj.id}/edit`}
                                                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                                title="Edit Project"
                                            >
                                                <FileEdit className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {canAccess("projects:delete") && (
                                            <button
                                                onClick={() => {
                                                    setProjectToDelete({ id: proj.id, name: proj.name });
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                                title="Delete Project"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
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
