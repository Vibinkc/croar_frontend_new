"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Card, Badge, Button, PageHelp, jetbrainsMono } from "@/components/ds";

interface Employee {
    first_name: string;
    last_name: string;
}

interface Assignment {
    id: string;
    relation: string;
    status: 'PENDING' | 'COMPLETED';
    ratee: Employee;
    cycle: {
        name: string;
    };
}

export default function X360MyAssessments() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyAssessments();
    }, []);

    const fetchMyAssessments = async () => {
        try {
            const res = await apiClient.get("/api/v1/enterprise/x360/my-assessments");
            if (res.ok) {
                const data = await res.json();
                setAssignments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const pending = assignments.filter(a => a.status === 'PENDING');
    const completed = assignments.filter(a => a.status === 'COMPLETED');

    const initials = (e: Employee) => `${e.first_name?.[0] ?? ""}${e.last_name?.[0] ?? ""}`;

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("assess360.myAssessments")}</h1>
                        <PageHelp title={tr("assess360.myAssessments")}>{tr("assess360.myHelp")}</PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("assess360.mySubtitle")}</p>
                </div>
                {!loading && (
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Badge tone="warning" dot>
                            <span className={jetbrainsMono.className}>{pending.length}</span> {tr("assess360.pending")}
                        </Badge>
                        <Badge tone="teal" dot>
                            <span className={jetbrainsMono.className}>{completed.length}</span> {tr("assess360.done")}
                        </Badge>
                    </div>
                )}
            </header>

            {/* Action Required */}
            <section className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                    <span className="material-symbols-rounded text-[#EF6C00] text-[19px]">pending_actions</span>
                    <h2 className="text-[13px] font-bold text-[#212121] tracking-tight">{tr("assess360.actionRequired")}</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[84px] bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : pending.length === 0 ? (
                    <Card padding="none" className="overflow-hidden">
                        <div className="flex flex-col items-center justify-center p-16 md:p-20 text-center">
                            <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5 text-[#BDBDBD]">
                                <span className="material-symbols-rounded text-[32px]">done_all</span>
                            </div>
                            <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("assess360.allCaughtUp")}</h3>
                            <p className="text-[#757575] text-[14px] max-w-xs mx-auto">{tr("assess360.nothingAssigned")}</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {pending.map((ass) => (
                            <Card key={ass.id} interactive padding="none" className="overflow-hidden group">
                                <div className="flex items-center justify-between gap-3 p-4">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <span className="w-11 h-11 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0 text-[14px] font-bold">
                                            {initials(ass.ratee)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#212121] truncate">{ass.ratee.first_name} {ass.ratee.last_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge tone="indigo">{ass.relation}</Badge>
                                                <span className="text-[12px] text-[#757575] truncate">{ass.cycle?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/enterprise/assessments-360/${ass.id}`} className="shrink-0">
                                        <Button size="sm" trailingIcon="arrow_forward">{tr("assess360.start")}</Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed */}
            {!loading && completed.length > 0 && (
                <section className="space-y-3.5">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-rounded text-[#2E7D32] text-[19px]">task_alt</span>
                        <h2 className="text-[13px] font-bold text-[#212121] tracking-tight">{tr("assess360.completed")}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {completed.map((ass) => (
                            <Card key={ass.id} padding="none" className="overflow-hidden bg-[#FAFAFA] border-[#E0E0E0]">
                                <div className="flex items-center gap-3.5 p-4">
                                    <span className="w-10 h-10 rounded-[4px] bg-white border border-[#E0E0E0] text-[#757575] flex items-center justify-center shrink-0 text-[12px] font-bold">
                                        {initials(ass.ratee)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13.5px] font-bold text-[#424242] truncate">{ass.ratee.first_name} {ass.ratee.last_name}</p>
                                        <p className="text-[12px] text-[#757575] truncate">{ass.cycle?.name}</p>
                                    </div>
                                    <span className="material-symbols-rounded text-[#2E7D32] text-[20px] shrink-0">check_circle</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
