"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Activity, Clock, ShieldAlert, History } from "lucide-react";
import { Card, Badge, Button, EmptyState, PageHeader, jetbrainsMono } from "@/components/ds";

interface AuditLog {
    id: string;
    action: string;
    details?: unknown;
    timestamp: string;
    admin_id?: string;
}

export default function AuditLogsPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        if (token) fetchLogs();
    }, [token]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/audit-logs`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title={t("superAdmin.auditLogs")}
                subtitle={t("superAdmin.auditLogsSubtitle")}
                help={<><p>{t("superAdmin.auditLogsHelp1")}</p><p>{t("superAdmin.auditLogsHelp2")}</p></>}
                actions={
                    <Button variant="secondary" icon="refresh" onClick={fetchLogs} disabled={isLoading}>
                        {t("superAdmin.refresh")}
                    </Button>
                }
            />

            {isLoading ? (
                <Card padding="none" className="overflow-hidden">
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-14 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                </Card>
            ) : logs.length === 0 ? (
                <Card padding="none">
                    <EmptyState
                        tone="muted"
                        icon="history"
                        title={t("superAdmin.noActivityLogs")}
                        description={t("superAdmin.noActivityLogsDesc")}
                    />
                </Card>
            ) : (
                <Card padding="none" className="overflow-hidden">
                    <div className="divide-y divide-[#F0F0F1]">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3.5 px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                            >
                                {/* Icon chip */}
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0 mt-0.5">
                                    <Activity className="w-[17px] h-[17px]" />
                                </span>

                                {/* Action + meta */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-[14px] font-bold text-[#15171C] truncate">
                                            {log.action}
                                        </span>
                                        <Badge tone="indigo">{t("superAdmin.action")}</Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        <span className={`inline-flex items-center gap-1.5 text-[11.5px] text-[#8A929E] ${jetbrainsMono.className}`}>
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#8A929E]">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            {t("superAdmin.admin")}: {log.admin_id?.split('-')[0] || t("superAdmin.system")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
