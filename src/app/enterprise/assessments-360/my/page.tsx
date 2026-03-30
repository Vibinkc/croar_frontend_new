"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

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

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading...</div>;

    const pending = assignments.filter(a => a.status === 'PENDING');
    const completed = assignments.filter(a => a.status === 'COMPLETED');

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Assessments</h1>
                <p className="text-slate-500 font-medium mt-1">Provide feedback for yourself and your colleagues.</p>
            </div>

            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Action Required</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pending.length === 0 ? (
                        <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <span className="material-symbols-rounded text-4xl text-slate-300 mb-2">done_all</span>
                            <p className="text-slate-500 font-bold">You're all caught up!</p>
                            <p className="text-slate-400 text-xs mt-1">No pending feedback requests for you.</p>
                        </div>
                    ) : (
                        pending.map((ass) => (
                            <div key={ass.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                                        {ass.ratee.first_name?.[0]}{ass.ratee.last_name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{ass.ratee.first_name} {ass.ratee.last_name}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{ass.relation}</span>
                                        </div>
                                    </div>
                                </div>
                                <Link 
                                    href={`/enterprise/assessments-360/${ass.id}`}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Start
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {completed.length > 0 && (
                <section className="space-y-4 pt-4 border-t border-slate-50">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Completed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completed.map((ass) => (
                            <div key={ass.id} className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-transparent">
                                <div className="w-10 h-10 bg-white text-slate-400 border border-slate-100 rounded-xl flex items-center justify-center font-bold text-xs">
                                    {ass.ratee.first_name?.[0]}{ass.ratee.last_name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{ass.ratee.first_name} {ass.ratee.last_name}</p>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Completed</p>
                                </div>
                                <span className="material-symbols-rounded text-emerald-500 text-lg">check_circle</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
