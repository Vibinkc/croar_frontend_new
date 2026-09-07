"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
    const { t: tr } = useI18n();
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
        "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

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
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("postOnboarding.projectsTitle")}</h1>
                        <PageHelp title={tr("postOnboarding.projectsTitle")}>
                            <p>{tr("postOnboarding.projectsHelp1")}</p>
                            <p><strong>{tr("postOnboarding.newProject")}</strong> {tr("postOnboarding.projectsHelp2")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("postOnboarding.projectsSubtitle")}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {canAccess("projects:create") && (
                        <Link
                            href="/enterprise/projects/add"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> {tr("postOnboarding.newProject")}
                        </Link>
                    )}
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("postOnboarding.totalProjects")} value={projects.length} icon="folder" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
                <StatCard label={tr("postOnboarding.activeMissions")} value={projects.filter(p => p.status === 'Active').length} icon="rocket_launch" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={tr("postOnboarding.completed")} value={projects.filter(p => p.status === 'Completed').length} icon="task_alt" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
                <StatCard label={tr("postOnboarding.resources")} value={projects.reduce((acc, p) => acc + (p.members?.length || 0), 0)} icon="group" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tr("postOnboarding.searchProjectsPlaceholder")}
                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[160px]`}
                        >
                            <option value="all">{tr("postOnboarding.allStatuses")}</option>
                            <option value="Active">{tr("postOnboarding.activeMissions")}</option>
                            <option value="Completed">{tr("postOnboarding.completed")}</option>
                            <option value="On Hold">{tr("postOnboarding.onHold")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Project list */}
            <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    projects.length === 0 ? (
                        <EmptyState
                            icon="lan"
                            tone="brand"
                            title={tr("postOnboarding.createFirstProject")}
                            description={tr("postOnboarding.createFirstProjectDesc")}
                            action={
                                canAccess("projects:create") ? (
                                    <Link href="/enterprise/projects/add">
                                        <Button icon="add">{tr("postOnboarding.newProject")}</Button>
                                    </Link>
                                ) : undefined
                            }
                        />
                    ) : (
                        <EmptyState
                            icon="search_off"
                            tone="muted"
                            title={tr("postOnboarding.noProjectsMatch")}
                            description={tr("postOnboarding.adjustFiltersDesc")}
                            action={
                                <Button variant="secondary" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                    {tr("postOnboarding.clearAllFilters")}
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_0.9fr_1.2fr_110px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.projectDetails")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.timeline")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.team")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("postOnboarding.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_0.9fr_1.2fr_110px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                                >
                                    {/* Project details */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                            <FolderKanban className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <Link href={`/enterprise/projects/${proj.id}`} className="block text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">
                                                {proj.name}
                                            </Link>
                                            <span className="block text-[12px] text-[#757575] truncate mt-0.5">{proj.description || tr("postOnboarding.noDescriptionProvided")}</span>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-1 text-[12px] text-[#757575] md:hidden">
                                                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : tr("postOnboarding.tba")}</span>
                                                <span className={jetbrainsMono.className}>{(proj.members || []).length} {tr("postOnboarding.membersLabel")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 text-[13px] text-[#424242] min-w-0">
                                        <Calendar className="w-4 h-4 text-[#9E9E9E] shrink-0" />
                                        <span className="truncate">
                                            {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : tr("postOnboarding.tba")} – {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : tr("postOnboarding.tba")}
                                        </span>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">{statusBadge(proj.status)}</div>

                                    {/* Team (desktop) */}
                                    <div className="hidden md:flex items-center gap-2 min-w-0">
                                        <div className="flex -space-x-2">
                                            {(proj.members || []).slice(0, 3).map((m: Member, i: number) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-[#E3F2FD] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#1976D2] uppercase">
                                                    {m.first_name?.[0]}{m.last_name?.[0]}
                                                </div>
                                            ))}
                                            {(proj.members || []).length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-[#EEEEEE] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#757575]">
                                                    +{(proj.members || []).length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[12px] text-[#757575] ${jetbrainsMono.className}`}>{(proj.members || []).length}</span>
                                    </div>

                                    {/* Status + actions (mobile bundles status; desktop = actions cell) */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">{statusBadge(proj.status)}</div>

                                        {canAccess("projects:update") && (
                                            <Link
                                                href={`/enterprise/projects/${proj.id}/edit`}
                                                className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2] transition-colors"
                                                title={tr("postOnboarding.editProject")}
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
                                                className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors"
                                                title={tr("postOnboarding.deleteProject")}
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
                title={tr("postOnboarding.terminateMission")}
                message={tr("postOnboarding.deleteProjectMessage", { name: projectToDelete?.name || "" })}
                confirmLabel={tr("postOnboarding.yesTerminate")}
                cancelLabel={tr("postOnboarding.no")}
                isDestructive={true}
            />
        </div>
    );
}
