"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion } from "framer-motion";
import { 
    History, 
    Clock, 
    Activity, 
    ShieldAlert, 
    RefreshCcw, 
    Terminal,
    Search,
    ChevronRight,
    Eye
} from "lucide-react";

interface AuditLog {
    id: string;
    action: string;
    details: any;
    timestamp: string;
    admin_id?: string;
}

export default function AuditLogsPage() {
    const { token } = useAuth();
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

    if (isLoading) {
        return <div className="p-8"><div className="h-96 bg-white rounded-2xl animate-pulse border border-slate-100" /></div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex items-center justify-between bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Terminal className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Audit Intelligence</h1>
                        <p className="text-slate-400 font-medium">Real-time stream of all platform operations</p>
                    </div>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="relative z-10 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5"
                >
                    <RefreshCcw className="w-6 h-6 text-indigo-300" />
                </button>
            </div>

            {/* Timeline View */}
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No activity logs recorded yet.</p>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</span>
                                        <ChevronRight className="w-3 h-3 text-slate-300" />
                                        <span className="text-sm font-black text-slate-900">{log.action}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 border-l border-slate-100 pl-4">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">Admin: {log.admin_id?.split('-')[0] || "System"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-600 text-[10px] font-black uppercase transition-all shadow-sm">
                                <Eye className="w-3.5 h-3.5" />
                                View Details
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
