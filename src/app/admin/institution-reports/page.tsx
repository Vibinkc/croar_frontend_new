"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import { useAuth } from "@/context/AuthContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts";

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    batch?: string | null;
    performance_score?: number;
    assessment_avg?: number;
    job_sim_avg?: number;
    practice_avg?: number;
    division_name?: string;
}

export default function InstitutionReportsPage() {
    const { role } = useAuth();
    const { selectedBatch } = useDivision();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        institutionalBreakdown: [] as any[]
    });

    useEffect(() => {
        fetchUsers();
    }, [selectedBatch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("role", "STUDENT");
            if (selectedBatch) params.append("batch", selectedBatch);

            const res = await apiClient.get(`/api/v1/users/reports/comprehensive?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                calculateStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        // Group by Institution (Division)
        interface InstStats {
            count: number;
            totalScore: number;
            assTotal: number;
            jobTotal: number;
            pracTotal: number;
            departments: Set<string>;
        }
        const instMap = new Map<string, InstStats>();

        data.forEach(u => {
            const inst = u.division_name || "Unknown Institution";
            const dept = u.department_name || "Unknown Department";

            const current = instMap.get(inst) || {
                count: 0, totalScore: 0,
                assTotal: 0, jobTotal: 0, pracTotal: 0,
                departments: new Set<string>()
            };

            current.departments.add(dept);
            instMap.set(inst, {
                count: current.count + 1,
                totalScore: current.totalScore + (u.performance_score || 0),
                assTotal: current.assTotal + (u.assessment_avg || 0),
                jobTotal: current.jobTotal + (u.job_sim_avg || 0),
                pracTotal: current.pracTotal + (u.practice_avg || 0),
                departments: current.departments
            });
        });

        const institutionalBreakdown = Array.from(instMap.entries()).map(([name, val]) => ({
            name,
            avg: Math.round(val.totalScore / val.count),
            assessment: Math.round(val.assTotal / val.count),
            jobSim: Math.round(val.jobTotal / val.count),
            practice: Math.round(val.pracTotal / val.count),
            count: val.count,
            deptCount: val.departments.size
        })).sort((a, b) => b.avg - a.avg);

        setStats({ institutionalBreakdown });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading_Institutional_Analytics</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Institution Reports</h2>
                <p className="text-sm text-slate-500 italic">
                    High-level comparison across all institutions {selectedBatch ? `for Batch ${selectedBatch}` : '(Global Overview)'}
                </p>
            </div>

            {/* Top Colleges Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.institutionalBreakdown.slice(0, 3).map((inst, index) => (
                    <div key={inst.name} className={`relative overflow-hidden rounded-[2.5rem] p-8 border ${index === 0 ? 'bg-slate-900 text-white border-slate-800 shadow-2xl' : 'bg-white text-slate-900 border-slate-100 shadow-sm'
                        }`}>
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <span className="material-icons-outlined text-8xl">
                                {index === 0 ? 'star' : index === 1 ? 'trending_up' : 'verified'}
                            </span>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    #{index + 1}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${index === 0 ? 'text-slate-400' : 'text-slate-400'
                                    }`}>
                                    {index === 0 ? 'Top Performing College' : 'Elite Institution'}
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight mb-1 truncate">{inst.name}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
                                {inst.deptCount} Departments • {inst.count} Students
                            </p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black">{inst.avg}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">Global Score</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Institutional Comparison Matrix</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-college performance analytics</p>
                </div>
                <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution</th>
                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</th>
                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</th>
                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Score</th>
                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessments</th>
                            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Sims</th>
                            <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank Index</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {stats.institutionalBreakdown.map((inst, idx) => (
                            <tr key={inst.name} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4">
                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{inst.name}</div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <div className="text-[11px] font-bold text-slate-500">{inst.deptCount} Units</div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <div className="text-[11px] font-bold text-slate-500">{inst.count}</div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <div className="inline-flex px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black">
                                        {inst.avg}%
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <div className="text-[11px] font-bold text-slate-600">{inst.assessment}%</div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <div className="text-[11px] font-bold text-slate-600">{inst.jobSim}%</div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex items-center justify-end gap-3 text-[10px] font-black text-slate-400">
                                        #{idx + 1}
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--color-primary)]" style={{ width: `${inst.avg}%` }} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
