"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";
import { PageHeader, StatGrid, StatCard, Card, Badge, Icon } from "@/components/ds";
import { useI18n } from "@/context/I18nContext";

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
    const { t } = useI18n();
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
            ? { gradient: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)", icon: "dns", tone: "success" as const }
            : health === "Degraded"
                ? { gradient: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)", icon: "warning", tone: "warning" as const }
                : health === "Down"
                    ? { gradient: "linear-gradient(135deg,#F87171,#DC2626)", glow: "rgba(198,40,40,0.25)", icon: "error", tone: "danger" as const }
                    : { gradient: "linear-gradient(135deg,#94A3B8,#616161)", glow: "rgba(100,116,139,0.25)", icon: "dns", tone: "neutral" as const };

    const quickActions = [
        { label: t("superAdmin.newOrganization"), desc: t("superAdmin.provisionNewTenant"), icon: "add_business", href: "/super-admin/organizations" },
        { label: t("superAdmin.globalRbacEditor"), desc: t("superAdmin.managePlatformRoles"), icon: "security", href: "/super-admin/roles" },
        { label: t("superAdmin.organizations"), desc: t("superAdmin.everyOrgOnPlatform"), icon: "corporate_fare", href: "/super-admin/organizations" },
        { label: t("superAdmin.auditLogs"), desc: t("superAdmin.reviewPlatformActivity"), icon: "receipt_long", href: "/super-admin/logs" },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title={t("superAdmin.platformOverview")}
                subtitle={t("superAdmin.platformOverviewSubtitle")}
                help={<><p>{t("superAdmin.overviewHelp1")}</p><p>{t("superAdmin.overviewHelp2")}</p></>}
                actions={<Badge tone={isLoading ? "neutral" : healthStyle.tone} dot>{isLoading ? t("superAdmin.checkingStatus") : health === "Operational" ? t("superAdmin.livePlatformStatus") : health === "Degraded" ? t("superAdmin.systemDegraded") : health === "Down" ? t("superAdmin.systemDown") : t("superAdmin.statusUnknown")}</Badge>}
            />

            {/* Stats */}
            <StatGrid>
                <StatCard label={t("superAdmin.totalOrganizations")} value={isLoading ? "—" : stats?.tenants ?? 0} icon="corporate_fare" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
                <StatCard label={t("superAdmin.platformUsers")} value={isLoading ? "—" : stats?.users ?? 0} icon="groups" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={t("superAdmin.globalRoles")} value={isLoading ? "—" : stats?.global_roles ?? 0} icon="security" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
                <StatCard label={t("superAdmin.systemHealth")} value={isLoading ? "—" : stats?.system_status ?? t("superAdmin.unknown")} icon={healthStyle.icon} gradient={healthStyle.gradient} glow={healthStyle.glow} />
            </StatGrid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Quick actions */}
                <div className="lg:col-span-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#757575] mb-3 px-1">{t("superAdmin.administrativeActions")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickActions.map((a) => (
                            <Link key={a.label} href={a.href} className="group">
                                <Card interactive className="flex items-center gap-3.5 h-full">
                                    <span className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0 group-hover:bg-[#1976D2] group-hover:text-white transition-colors">
                                        <Icon name={a.icon} className="text-[20px]" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors">{a.label}</p>
                                        <p className="text-[12px] text-[#757575] mt-0.5">{a.desc}</p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent activity */}
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#757575] mb-3 px-1">{t("superAdmin.recentActivity")}</h3>
                    <Card padding="none" className="overflow-hidden">
                        {logsLoading ? (
                            <div className="p-4 space-y-2.5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-12 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                                ))}
                            </div>
                        ) : recent.length === 0 ? (
                            <p className="px-5 py-8 text-center text-[12.5px] text-[#757575]">{t("superAdmin.noRecentActivity")}</p>
                        ) : (
                            <div className="divide-y divide-[#EEEEEE]">
                                {recent.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-1.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[12.5px] font-semibold text-[#424242] leading-snug break-words">{log.action}</p>
                                            <p className="text-[11px] text-[#9E9E9E] mt-1">{timeAgo(log.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/super-admin/logs" className="block text-center py-3 text-[12.5px] font-semibold text-[#1976D2] hover:bg-[#FAFAFA] transition-colors border-t border-[#EEEEEE]">
                            {t("superAdmin.viewDetailedLogs")}
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function SuperAdminDashboard() {
    const { t } = useI18n();
    return (
        <Suspense fallback={<div className="p-8 text-[13px] text-[#757575]">{t("superAdmin.loadingSystemMetrics")}</div>}>
            <SuperAdminDashboardContent />
        </Suspense>
    );
}
