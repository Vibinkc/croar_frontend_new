"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";
import { PageHeader, StatGrid, StatCard, Card, Badge } from "@/components/ds";

interface PlatformStats {
    tenants: number;
    users: number;
    global_roles: number;
    system_status: string;
}

interface ActivityLog {
    id: string;
    action: string;
    timestamp: string;
}

/** Compact "x ago" from an ISO timestamp. */
function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return "just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function SuperAdminDashboardContent() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [recent, setRecent] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(true);

    useEffect(() => {
        apiClient
            .get("/api/v1/super-admin/stats")
            .then(async (res) => { if (res.ok) setStats(await res.json()); })
            .catch((e) => console.error("Failed to fetch platform stats", e))
            .finally(() => setIsLoading(false));

        // Real recent activity (top 5 audit-log entries) — replaces placeholders.
        apiClient
            .get("/api/v1/super-admin/system/audit-logs?limit=5")
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    setRecent(Array.isArray(data) ? data.slice(0, 5) : []);
                }
            })
            .catch((e) => console.error("Failed to fetch recent activity", e))
            .finally(() => setLogsLoading(false));
    }, []);

    // System-health presentation, driven by the real backend signal
    // (Operational / Degraded / Down).
    const health = stats?.system_status;
    const healthStyle =
        health === "Operational"
            ? { gradient: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)", icon: "dns", tone: "success" as const }
            : health === "Degraded"
                ? { gradient: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)", icon: "warning", tone: "warning" as const }
                : health === "Down"
                    ? { gradient: "linear-gradient(135deg,#F87171,#DC2626)", glow: "rgba(220,38,38,0.25)", icon: "error", tone: "danger" as const }
                    : { gradient: "linear-gradient(135deg,#94A3B8,#64748B)", glow: "rgba(100,116,139,0.25)", icon: "dns", tone: "neutral" as const };

    const quickActions = [
        { label: "New Organization", desc: "Provision a new tenant", icon: "add_business", href: "/super-admin/organizations" },
        { label: "Global RBAC Editor", desc: "Manage platform roles", icon: "security", href: "/super-admin/roles" },
        { label: "Organizations", desc: "Every org on the platform", icon: "corporate_fare", href: "/super-admin/organizations" },
        { label: "Audit Logs", desc: "Review platform activity", icon: "receipt_long", href: "/super-admin/logs" },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Platform Overview"
                subtitle="Platform-wide analytics and system controls for Croar"
                help={<><p>The command centre for the whole platform.</p><p>Provision tenants, manage global roles and users, and monitor system health from here.</p></>}
                actions={<Badge tone={isLoading ? "neutral" : healthStyle.tone} dot>{isLoading ? "Checking status…" : health === "Operational" ? "Live platform status" : health === "Degraded" ? "System degraded" : health === "Down" ? "System down" : "Status unknown"}</Badge>}
            />

            {/* Stats */}
            <StatGrid>
                <StatCard label="Total Organizations" value={isLoading ? "—" : stats?.tenants ?? 0} icon="corporate_fare" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label="Platform Users" value={isLoading ? "—" : stats?.users ?? 0} icon="groups" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Global Roles" value={isLoading ? "—" : stats?.global_roles ?? 0} icon="security" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label="System Health" value={isLoading ? "—" : stats?.system_status ?? "Unknown"} icon={healthStyle.icon} gradient={healthStyle.gradient} glow={healthStyle.glow} />
            </StatGrid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Quick actions */}
                <div className="lg:col-span-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#8A929E] mb-3 px-1">Administrative actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickActions.map((a) => (
                            <Link key={a.label} href={a.href} className="group">
                                <Card interactive className="flex items-center gap-3.5 h-full">
                                    <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0 group-hover:bg-[#5B53E0] group-hover:text-white transition-colors">
                                        <span className="material-symbols-rounded text-[20px]">{a.icon}</span>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">{a.label}</p>
                                        <p className="text-[12px] text-[#8A929E] mt-0.5">{a.desc}</p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent activity */}
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#8A929E] mb-3 px-1">Recent activity</h3>
                    <Card padding="none" className="overflow-hidden">
                        {logsLoading ? (
                            <div className="p-4 space-y-2.5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-12 bg-[#F4F5F7] rounded-[10px] animate-pulse" />
                                ))}
                            </div>
                        ) : recent.length === 0 ? (
                            <p className="px-5 py-8 text-center text-[12.5px] text-[#8A929E]">No recent activity yet.</p>
                        ) : (
                            <div className="divide-y divide-[#F0F0F1]">
                                {recent.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#5B53E0] mt-1.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[12.5px] font-semibold text-[#374151] leading-snug break-words">{log.action}</p>
                                            <p className="text-[11px] text-[#9AA3AF] mt-1">{timeAgo(log.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/super-admin/logs" className="block text-center py-3 text-[12.5px] font-semibold text-[#5B53E0] hover:bg-[#F7F8FA] transition-colors border-t border-[#F0F0F1]">
                            View detailed logs
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function SuperAdminDashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-[13px] text-[#8A929E]">Loading system metrics…</div>}>
            <SuperAdminDashboardContent />
        </Suspense>
    );
}
