"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { format } from "date-fns";
import { useDivision } from "@/context/DivisionContext";

interface ActivityLog {
    id: number;
    user_name: string;
    action: string;
    details: string;
    timestamp: string;
}

export default function AdminActivityPage() {
    const { selectedDivisionId, selectedDepartmentId, selectedBatch } = useDivision();

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">System Audit Log</h1>
                <p className="text-sm font-medium text-slate-500 max-w-2xl">Monitoring administrative operations and system-wide activities across the ecosystem.</p>
            </div>
            <ActivityLogList divisionId={selectedDivisionId} departmentId={selectedDepartmentId} batch={selectedBatch} />
        </div>
    );
}

function ActivityLogList({ divisionId, departmentId, batch }: { divisionId: number | null, departmentId: number | null, batch: string | null }) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [divisionId, departmentId, batch]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());
            if (batch) params.append("batch", batch);

            const res = await apiClient.get(`/api/v1/admin/activity?${params.toString()}`);
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch activity logs", e);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        return "text-slate-600 bg-slate-50";
    };

    const getActionIcon = (action: string) => {
        if (action.includes("GD")) return "groups";
        if (action.includes("INTERVIEW")) return "smart_toy";
        if (action.includes("ASSESSMENT")) return "assignment";
        if (action.includes("QUESTION")) return "help_outline";
        if (action.includes("SCENARIO")) return "record_voice_over";
        if (action.includes("JOB_PROFILE")) return "work_outline";
        if (action.includes("STUDENT")) return "people";
        if (action.includes("PSYCHOMETRIC")) return "psychology_alt";
        if (action.includes("RESUME")) return "description";
        if (action.includes("BULK")) return "cloud_upload";
        return "info";
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => {
                        if (!logs.length) return;
                        const headers = ["User", "Action", "Details", "Timestamp"];
                        const rows = logs.map(l => [
                            l.user_name,
                            l.action,
                            l.details.replace(/,/g, ";"), // Prevent commas from breaking CSV
                            format(new Date(l.timestamp), "yyyy-MM-dd HH:mm:ss")
                        ]);
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "System_Audit_Log.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    title="Export Logs"
                >
                    <span className="material-icons-outlined">download</span>
                    Export
                </button>
                <button
                    onClick={fetchLogs}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Refresh"
                >
                    <span className="material-icons-outlined">refresh</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12 text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">Syncing Audit Stream...</div>
            ) : logs.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] text-center">
                    <span className="material-icons-outlined text-4xl text-slate-300 mb-4">history</span>
                    <p className="text-slate-400 text-sm font-medium">No system activity has been recorded for this selection.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {logs.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getActionColor(log.action)}`}>
                                    <span className="material-icons-outlined text-xl">{getActionIcon(log.action)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{log.user_name}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-full">
                                            {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
