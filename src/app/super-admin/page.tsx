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

function SuperAdminDashboardContent() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get("/api/v1/super-admin/stats");
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error("Failed to fetch platform stats", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const quickActions = [
        { label: "Provision New Org", desc: "Spin up a dedicated tenant", icon: "add_business", href: "/super-admin/colleges" },
        { label: "Global RBAC Editor", desc: "Manage platform roles", icon: "security", href: "/super-admin/roles" },
        { label: "Tenants Inventory", desc: "Monitor every instance", icon: "storage", href: "/super-admin/colleges/list" },
        { label: "Audit Logs", desc: "Review platform activity", icon: "receipt_long", href: "/super-admin/logs" },
    ];

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Platform Overview"
                subtitle="Platform-wide analytics and system controls for Croar"
                help={<><p>The command centre for the whole platform.</p><p>Provision tenants, manage global roles and users, and monitor system health from here.</p></>}
                actions={<Badge tone="success" dot>Live platform status</Badge>}
            />

            {/* Stats */}
            <StatGrid>
                <StatCard label="Total Organizations" value={isLoading ? "—" : stats?.tenants ?? 0} icon="corporate_fare" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label="Platform Users" value={isLoading ? "—" : stats?.users ?? 0} icon="groups" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Global Roles" value={isLoading ? "—" : stats?.global_roles ?? 0} icon="security" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label="System Health" value={isLoading ? "—" : stats?.system_status ?? "Operational"} icon="dns" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
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
                        <div className="divide-y divide-[#F0F0F1]">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B53E0] mt-1.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[12.5px] font-semibold text-[#374151] leading-snug">Organization &quot;TechCorp&quot; was provisioned by root admin.</p>
                                        <p className="text-[11px] text-[#9AA3AF] mt-1">45 minutes ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
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
