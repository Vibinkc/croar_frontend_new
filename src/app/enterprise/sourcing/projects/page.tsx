"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import {
    Search, Filter, FolderOpen, Plus, Bookmark, Send, ThumbsUp, Loader2, X, Bot, MoreHorizontal, Lock,
} from "lucide-react";

interface Project {
    project_id: string;
    name: string;
    owner?: string;
    department?: string;
    visibility?: string;
    created_at?: string;
    agent?: { status?: string; paused?: boolean };
    stats?: { shortlisted?: number; contacted?: number; interested?: number };
}

const AGENT_STATUS: Record<string, { label: string; dot: string; text: string }> = {
    calibrating: { label: "Calibrating", dot: "bg-[#D97706]", text: "text-[#B45309]" },
    sourcing: { label: "Sourcing", dot: "bg-[#15803D] animate-pulse", text: "text-[#15803D]" },
    paused: { label: "Paused", dot: "bg-[#9AA3AF]", text: "text-[#6B6F76]" },
};

const fmtDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
};

export default function ProjectsPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "calibrating" | "sourcing" | "none">("all");
    const [menuId, setMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ right: number; top?: number; bottom?: number }>({ right: 0, top: 0 });

    const fetchProjects = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setProjects(await res.json());
        } catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { fetchProjects(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

    const createProject = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newName.trim() }),
            });
            if (res.ok) {
                const p = await res.json();
                router.push(`/enterprise/sourcing/projects/${p.project_id}`);
            }
        } catch { /* ignore */ } finally { setCreating(false); }
    };

    const deleteProject = async (id: string) => {
        setMenuId(null);
        if (!window.confirm(t("projects.confirmDelete"))) return;
        setProjects((prev) => prev.filter((p) => p.project_id !== id));
        try {
            await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${id}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` },
            });
        } catch { /* ignore */ }
    };

    const statCards = useMemo(() => {
        const hasAgent = (p: Project) => !!(p.agent?.status && p.agent.status !== "none");
        const activeAgents = projects.filter((p) => hasAgent(p) && !p.agent?.paused).length;
        const shortlisted = projects.reduce((n, p) => n + (p.stats?.shortlisted ?? 0), 0);
        const contacted = projects.reduce((n, p) => n + (p.stats?.contacted ?? 0), 0);
        return [
            { label: t("projects.totalProjects"), value: projects.length, Icon: FolderOpen, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)" },
            { label: t("projects.activeAgents"), value: activeAgents, Icon: Bot, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
            { label: t("projects.shortlisted"), value: shortlisted, Icon: Bookmark, grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)" },
            { label: t("projects.contacted"), value: contacted, Icon: Send, grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
        ];
    }, [projects, t]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return projects.filter((p) => {
            const st = p.agent?.status && p.agent.status !== "none" ? p.agent.status : "none";
            if (statusFilter !== "all" && st !== statusFilter) return false;
            if (!q) return true;
            return `${p.name} ${p.owner || ""}`.toLowerCase().includes(q);
        });
    }, [projects, search, statusFilter]);

    return (
        <div className="px-4 sm:px-6 md:px-7 py-5 max-w-[1320px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C]">{t("projects.title")}</h1>
                    <p className="text-[13px] text-[#8A929E] mt-0.5">{t("projects.subtitle")}</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="h-11 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] flex items-center gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> {t("projects.createNew")}
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((s) => (
                    <div key={s.label} className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden shadow-sm">
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className="text-[28px] font-extrabold tracking-[-1px] text-[#15171C] mt-2">{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("projects.searchPlaceholder")}
                        className="w-full h-11 pl-10 pr-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] text-[#1F2127] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15"
                    />
                </div>
                <div className="relative">
                    <button onClick={() => setShowFilter((v) => !v)} className="h-11 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA] flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#5B53E0]" /> {t("projects.filter")}{statusFilter !== "all" ? `: ${statusFilter}` : ""}
                    </button>
                    {showFilter && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                            <div className="absolute left-0 top-12 z-50 w-52 bg-white rounded-[12px] border border-[#E8EAED] shadow-[0_16px_40px_rgba(15,23,42,0.18)] p-1.5">
                                {([["all", t("projects.allProjects")], ["calibrating", t("projects.calibrating")], ["sourcing", t("projects.sourcing")], ["none", t("projects.noAgent")]] as const).map(([k, label]) => (
                                    <button key={k} onClick={() => { setStatusFilter(k); setShowFilter(false); }} className={`w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-semibold hover:bg-[#F7F8FA] ${statusFilter === k ? "text-[#5B53E0] bg-[#F4F3FD]" : "text-[#374151]"}`}>{label}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h2 className="text-[15px] font-bold text-[#15171C] mb-3">{t("projects.myProjects")} <span className="text-[#8A929E]">({filtered.length})</span></h2>

            <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-sm overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#5B53E0] animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-[14px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center mb-3"><FolderOpen className="w-6 h-6" /></div>
                        <p className="text-[14px] font-bold text-[#15171C]">{t("projects.emptyTitle")}</p>
                        <p className="text-[12.5px] text-[#8A929E] mt-1 mb-4">{t("projects.emptyDesc")}</p>
                        <button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9]">{t("projects.createNew")}</button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[820px]">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em] border-b border-[#E8EAED] bg-[#FAFBFC]">
                                <th className="px-6 py-3">{t("projects.colName")}</th>
                                <th className="px-6 py-3">{t("projects.colAgent")}</th>
                                <th className="px-6 py-3">{t("projects.shortlisted")}</th>
                                <th className="px-6 py-3">{t("projects.contacted")}</th>
                                <th className="px-6 py-3">{t("projects.interested")}</th>
                                <th className="px-6 py-3">{t("projects.colTeam")}</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const st = p.agent?.status && p.agent.status !== "none" ? AGENT_STATUS[p.agent.status] : null;
                                return (
                                    <tr key={p.project_id} onClick={() => router.push(`/enterprise/sourcing/projects/${p.project_id}`)} className="border-b border-[#F0F0F1] last:border-b-0 hover:bg-[#F7F8FA]/60 transition-colors cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-[9px] bg-[#F4F3FD] text-[#5B53E0] flex items-center justify-center shrink-0"><Lock className="w-4 h-4" /></span>
                                                <div>
                                                    <p className="text-[14px] font-bold text-[#15171C]">{p.name}</p>
                                                    <p className="text-[11.5px] text-[#8A929E]">{t("projects.created")} {fmtDate(p.created_at)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {st ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-2 text-[13px] font-semibold ${p.agent?.paused ? "text-[#8A929E]" : st.text}`}>
                                                        <span className={`w-6 h-6 rounded-[7px] flex items-center justify-center ${p.agent?.paused ? "bg-[#F1F2F5] text-[#9AA3AF]" : "bg-[#F4F3FD] text-[#5B53E0]"}`}><Bot className="w-3.5 h-3.5" /></span>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${p.agent?.paused ? "bg-[#9AA3AF]" : st.dot}`} /> {t(`projects.${p.agent?.status}`)}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.agent?.paused ? "bg-[#F1F2F5] text-[#8A929E]" : "bg-[#EAF7EE] text-[#16A34A]"}`}>{p.agent?.paused ? t("projects.inactive") : t("projects.active")}</span>
                                                </span>
                                            ) : <span className="text-[#C4C9D0] font-bold">--</span>}
                                        </td>
                                        <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]"><Bookmark className="w-4 h-4 text-[#9AA3AF]" /> {p.stats?.shortlisted ?? 0}</span></td>
                                        <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]"><Send className="w-4 h-4 text-[#9AA3AF]" /> {p.stats?.contacted ?? 0}</span></td>
                                        <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]"><ThumbsUp className="w-4 h-4 text-[#9AA3AF]" /> {p.stats?.interested ?? 0}</span></td>
                                        <td className="px-6 py-4">
                                            <span className="w-7 h-7 rounded-full bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center text-[11px] font-extrabold uppercase" title={p.owner}>{(p.owner || "?").charAt(0)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const up = window.innerHeight - r.bottom < 130; setMenuPos({ right: Math.max(12, window.innerWidth - r.right), top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined }); setMenuId(menuId === p.project_id ? null : p.project_id); }} className="p-1.5 rounded-lg hover:bg-[#F0F0F1] text-[#9AA3AF] hover:text-[#4B5563]"><MoreHorizontal className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Row action menu (fixed so it escapes the table's overflow clipping) */}
            {menuId && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                    <div style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right }} className="z-50 w-40 bg-white rounded-[10px] border border-[#E8EAED] shadow-[0_12px_30px_rgba(15,23,42,0.16)] p-1.5">
                        <button onClick={() => router.push(`/enterprise/sourcing/projects/${menuId}`)} className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("projects.open")}</button>
                        <button onClick={() => deleteProject(menuId)} className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-semibold text-[#C0383C] hover:bg-rose-50">{t("common.delete")}</button>
                    </div>
                </>
            )}

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white p-6 rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-[#15171C]">{t("projects.createNew")}</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
                            autoFocus
                            placeholder={t("projects.namePlaceholder")}
                            className="w-full h-11 px-3.5 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15"
                        />
                        <div className="flex justify-end gap-2.5">
                            <button onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-[10px] border border-[#E1E4E8] text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("common.cancel")}</button>
                            <button onClick={createProject} disabled={!newName.trim() || creating} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] disabled:opacity-50 flex items-center gap-2">
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />} {t("common.create")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
