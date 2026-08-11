"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import { Search, Filter, Plus, Loader2, Mail, MoreHorizontal, X, ChevronDown, Zap, Reply, ThumbsUp, Send } from "lucide-react";
import ConnectMailbox from "@/components/sourcing/ConnectMailbox";

interface Sequence {
    sequence_id: string;
    name: string;
    owner?: string;
    privacy?: string;
    steps?: any[];
    created_at?: string;
    stats?: { total?: number; active?: number; opened?: number; clicked?: number; replied?: number; interested?: number; bounced?: number };
}

const fmtDate = (iso?: string) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }); };

export default function SequencesPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const router = useRouter();
    const [seqs, setSeqs] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ right: number; top?: number; bottom?: number }>({ right: 0, top: 0 });
    const [period, setPeriod] = useState(7);
    const [sentByDay, setSentByDay] = useState<Record<string, number>>({});
    const [showConnectGate, setShowConnectGate] = useState(false);
    const [checkingConn, setCheckingConn] = useState(false);

    // Before creating a sequence, require the org to have a connected mailbox.
    const openCreate = async () => {
        if (!token) return;
        setCheckingConn(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/connections`, { headers: { Authorization: `Bearer ${token}` } });
            const d = res.ok ? await res.json() : { connected: false };
            if (d.connected) setShowCreate(true); else setShowConnectGate(true);
        } catch { setShowConnectGate(true); } finally { setCheckingConn(false); }
    };

    const fetchSeqs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setSeqs(await res.json());
        } catch { /* ignore */ } finally { setLoading(false); }
    };
    const fetchSchedule = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/schedule`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); setSentByDay(d.sent_by_day || {}); }
        } catch { /* ignore */ }
    };
    useEffect(() => { fetchSeqs(); fetchSchedule(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

    const createSeq = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newName.trim(), steps: [{ type: "email", subject: "", body: "Hi {{First Name}},\n\n", delay_days: 0 }] }),
            });
            if (res.ok) { const s = await res.json(); router.push(`/enterprise/sourcing/sequences/${s.sequence_id}`); }
        } catch { /* ignore */ } finally { setCreating(false); }
    };
    const deleteSeq = async (id: string) => {
        setMenuId(null);
        if (!window.confirm(t("sequences.confirmDelete"))) return;
        setSeqs((p) => p.filter((s) => s.sequence_id !== id));
        try { await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignore */ }
    };

    // Schedule chart: a window centered on today. No real send/schedule events yet → all zeros.
    const schedule = useMemo(() => {
        const days: { label: string; isToday: boolean; sent: number; scheduled: number }[] = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = -period; i <= period; i++) {
            const d = new Date(today); d.setDate(today.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            days.push({ label: i === 0 ? "Today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), isToday: i === 0, sent: sentByDay[iso] || 0, scheduled: 0 });
        }
        return days;
    }, [period, sentByDay]);
    const scheduleTotals = useMemo(() => schedule.reduce((a, d) => ({ sent: a.sent + d.sent, scheduled: a.scheduled + d.scheduled }), { sent: 0, scheduled: 0 }), [schedule]);

    const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return seqs.filter((s) => !q || `${s.name} ${s.owner || ""}`.toLowerCase().includes(q)); }, [seqs, search]);
    const totals = useMemo(() => seqs.reduce((a, s) => ({ total: a.total + (s.stats?.total || 0), active: a.active + (s.stats?.active || 0), opened: a.opened + (s.stats?.opened || 0), clicked: a.clicked + (s.stats?.clicked || 0), replied: a.replied + (s.stats?.replied || 0), interested: a.interested + (s.stats?.interested || 0) }), { total: 0, active: 0, opened: 0, clicked: 0, replied: 0, interested: 0 }), [seqs]);

    return (
        <div className="px-4 sm:px-6 md:px-7 py-5 max-w-[1320px] mx-auto w-full">
            <div className="flex items-center justify-between gap-4 mb-5">
                <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C]">{t("sequences.title")}</h1>
                <button onClick={openCreate} disabled={checkingConn} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] flex items-center gap-2 disabled:opacity-60">{checkingConn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t("sequences.newSequence")}</button>
            </div>

            {/* Overview stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                {([
                    { label: t("sequences.total"), value: totals.total, Icon: Mail, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.28)" },
                    { label: t("sequences.sent"), value: totals.total, Icon: Send, grad: "linear-gradient(135deg,#F6B65C,#D97706)", glow: "rgba(217,119,6,0.25)" },
                    { label: t("sequences.active"), value: totals.active, Icon: Zap, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                    { label: t("sequences.replied"), value: totals.replied, Icon: Reply, grad: "linear-gradient(135deg,#5EC5D6,#0E7C8A)", glow: "rgba(14,124,138,0.25)" },
                    { label: t("sequences.interested"), value: totals.interested, Icon: ThumbsUp, grad: "linear-gradient(135deg,#F58AB0,#D6336C)", glow: "rgba(214,51,108,0.25)" },
                ]).map((s) => (
                    <div key={s.label} className="relative bg-white border border-[#E8EAED] rounded-[14px] p-4 overflow-hidden shadow-sm">
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className="text-[24px] font-extrabold tracking-[-1px] text-[#15171C] mt-1.5">{s.value}</div>
                            </div>
                            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[17px] h-[17px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Schedule chart */}
            <div className="rounded-[14px] border border-[#E8EAED] bg-white p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[15px] font-bold text-[#15171C]">{t("sequences.schedule")}</h3>
                        <div className="relative">
                            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="appearance-none h-8 pl-3 pr-8 rounded-[8px] border border-[#E1E4E8] bg-white text-[12.5px] font-semibold text-[#374151] outline-none cursor-pointer">
                                <option value={7}>{t("sequences.periodDays", { days: 7 })}</option>
                                <option value={14}>{t("sequences.periodDays", { days: 14 })}</option>
                                <option value={30}>{t("sequences.periodDays", { days: 30 })}</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-[#9AA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[12.5px] font-bold">
                        <span className="flex items-center gap-1.5 text-[#374151]"><span className="w-2.5 h-2.5 rounded-full bg-[#8B7DEB]" /> {scheduleTotals.sent} {t("sequences.sentLegend")}</span>
                        <span className="flex items-center gap-1.5 text-[#374151]"><span className="w-2.5 h-2.5 rounded-full bg-[#5B53E0]" /> {scheduleTotals.scheduled} {t("sequences.scheduledLegend")}</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={schedule} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A929E" }} interval={period <= 7 ? 0 : Math.floor(period / 5)} axisLine={{ stroke: "#EEF0F3" }} tickLine={false} />
                        <YAxis allowDecimals={false} domain={[0, Math.max(4, ...schedule.map((d) => Math.max(d.sent, d.scheduled))) + 1]} width={28} tick={{ fontSize: 11, fill: "#8A929E" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E8EAED", fontSize: 12 }} />
                        <ReferenceLine x="Today" stroke="#9AA3AF" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="sent" stroke="#8B7DEB" strokeWidth={2.5} dot={{ r: 3, fill: "#8B7DEB", strokeWidth: 0 }} activeDot={{ r: 5 }} name={t("sequences.sent")} />
                        <Line type="monotone" dataKey="scheduled" stroke="#5B53E0" strokeWidth={2} dot={false} name={t("sequences.scheduled")} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF]" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("sequences.searchPlaceholder")} className="w-full h-11 pl-10 pr-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                </div>
                <button className="h-11 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA] flex items-center gap-2"><Filter className="w-4 h-4 text-[#5B53E0]" /> {t("sequences.allOwners")}</button>
            </div>

            <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-sm overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#5B53E0] animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-[14px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center mb-3"><Mail className="w-6 h-6" /></div>
                        <p className="text-[14px] font-bold text-[#15171C]">{t("sequences.emptyTitle")}</p>
                        <p className="text-[12.5px] text-[#8A929E] mt-1 mb-4">{t("sequences.emptyDesc")}</p>
                        <button onClick={openCreate} disabled={checkingConn} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] disabled:opacity-60">{t("sequences.newSequence")}</button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.05em] border-b border-[#E8EAED] bg-[#FAFBFC]">
                                <th className="px-6 py-3">{t("sequences.colName")}</th><th className="px-6 py-3">{t("sequences.privacy")}</th><th className="px-6 py-3">{t("sequences.steps")}</th><th className="px-6 py-3">{t("sequences.total")}</th><th className="px-6 py-3">{t("sequences.opened")}</th><th className="px-6 py-3">{t("sequences.replied")}</th><th className="px-6 py-3">{t("sequences.created")}</th><th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.sequence_id} onClick={() => router.push(`/enterprise/sourcing/sequences/${s.sequence_id}`)} className="border-b border-[#F0F0F1] last:border-b-0 hover:bg-[#F7F8FA]/60 transition-colors cursor-pointer">
                                    <td className="px-6 py-4"><p className="text-[14px] font-bold text-[#15171C]">{s.name}</p></td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#6B6F76]">{s.privacy || t("sequences.shared")}</td>
                                    <td className="px-6 py-4 text-[12.5px] font-semibold text-[#374151]">{(s.steps || []).length}</td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#374151]">{s.stats?.total ?? 0}</td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#374151]">{s.stats?.opened ?? 0}</td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#374151]">{s.stats?.replied ?? 0}</td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#6B6F76] whitespace-nowrap">{fmtDate(s.created_at)}</td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const up = window.innerHeight - r.bottom < 130; setMenuPos({ right: Math.max(12, window.innerWidth - r.right), top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined }); setMenuId(menuId === s.sequence_id ? null : s.sequence_id); }} className="p-1.5 rounded-lg hover:bg-[#F0F0F1] text-[#9AA3AF]"><MoreHorizontal className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Row action menu (fixed so it escapes the table's overflow clipping) */}
            {menuId && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                    <div style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right }} className="z-50 w-36 bg-white rounded-[10px] border border-[#E8EAED] shadow-[0_12px_30px_rgba(15,23,42,0.16)] p-1.5">
                        <button onClick={() => { router.push(`/enterprise/sourcing/sequences/${menuId}`); }} className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("common.edit")}</button>
                        <button onClick={() => deleteSeq(menuId)} className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-semibold text-[#C0383C] hover:bg-rose-50">{t("common.delete")}</button>
                    </div>
                </>
            )}

            {showCreate && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white p-6 rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold text-[#15171C]">{t("sequences.newSequence")}</h3><button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button></div>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createSeq(); }} autoFocus placeholder={t("sequences.namePlaceholder")} className="w-full h-11 px-3.5 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                        <div className="flex justify-end gap-2.5">
                            <button onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-[10px] border border-[#E1E4E8] text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("common.cancel")}</button>
                            <button onClick={createSeq} disabled={!newName.trim() || creating} className="h-10 px-5 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] disabled:opacity-50 flex items-center gap-2">{creating && <Loader2 className="w-4 h-4 animate-spin" />} {t("common.create")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect-mailbox gate — shown when creating a sequence with no mailbox connected */}
            {showConnectGate && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowConnectGate(false)}>
                    <div className="bg-white rounded-[16px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EAED]">
                            <h3 className="text-[16px] font-bold text-[#15171C]">{t("sequences.createSequence")}</h3>
                            <button onClick={() => setShowConnectGate(false)} className="h-8 px-3 rounded-[8px] border border-[#E1E4E8] text-[12.5px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{t("common.close")}</button>
                        </div>
                        <div className="p-8">
                            <ConnectMailbox
                                showLater
                                onConnected={() => { setShowConnectGate(false); setShowCreate(true); }}
                                onLater={() => { setShowConnectGate(false); setShowCreate(true); }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
