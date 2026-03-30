"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";
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
}

export default function DepartmentReportsPage() {
    return (
        <HierarchyDrilldown
            title="DEPARTMENT REPORTS"
            description="Deep dive into batch-wise performance and departmental analytics."
            allowDivisionOverview={true}
            renderContent={(divisionId, departmentId) => (
                <DepartmentContent divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function DepartmentContent({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        performance: [] as any[],
        batchBreakdown: [] as any[],
        departmentBreakdown: [] as any[]
    });

    useEffect(() => {
        fetchUsers();
    }, [divisionId, departmentId, selectedBatch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("role", "STUDENT");
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());
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
        // 1. Batch Performance (Average Score per Batch)
        const batchMap = new Map<string, { total: number; count: number }>();
        const batchDetailsMap = new Map<string, {
            count: number;
            totalScore: number;
            assTotal: number;
            assCount: number;
            jobTotal: number;
            jobCount: number;
            pracTotal: number;
            pracCount: number;
        }>();

        // 2. Department Breakdown (for Institution Admin Overview)
        interface DeptStats {
            count: number;
            totalScore: number;
            assTotal: number;
            jobTotal: number;
            pracTotal: number;
            batches: Set<string>;
        }
        const deptMap = new Map<string, DeptStats>();

        data.forEach(u => {
            const batch = u.batch || "Unknown";
            const dept = u.department_name || "Unknown";

            // Batch Chart
            const currentBatch = batchMap.get(batch) || { total: 0, count: 0 };
            batchMap.set(batch, {
                total: currentBatch.total + (u.performance_score || 0),
                count: currentBatch.count + 1
            });

            // Batch Details
            const batchDetails = batchDetailsMap.get(batch) || {
                count: 0, totalScore: 0,
                assTotal: 0, assCount: 0,
                jobTotal: 0, jobCount: 0,
                pracTotal: 0, pracCount: 0
            };
            batchDetailsMap.set(batch, {
                count: batchDetails.count + 1,
                totalScore: batchDetails.totalScore + (u.performance_score || 0),
                assTotal: batchDetails.assTotal + (u.assessment_avg || 0),
                assCount: batchDetails.assCount + (u.assessment_avg ? 1 : 0),
                jobTotal: batchDetails.jobTotal + (u.job_sim_avg || 0),
                jobCount: batchDetails.jobCount + (u.job_sim_avg ? 1 : 0),
                pracTotal: batchDetails.pracTotal + (u.practice_avg || 0),
                pracCount: batchDetails.pracCount + (u.practice_avg ? 1 : 0)
            });

            // Dept Details
            const deptDetails = deptMap.get(dept) || {
                count: 0, totalScore: 0,
                assTotal: 0, jobTotal: 0, pracTotal: 0,
                batches: new Set<string>()
            };
            if (u.batch) deptDetails.batches.add(u.batch);
            deptMap.set(dept, {
                count: deptDetails.count + 1,
                totalScore: deptDetails.totalScore + (u.performance_score || 0),
                assTotal: deptDetails.assTotal + (u.assessment_avg || 0),
                jobTotal: deptDetails.jobTotal + (u.job_sim_avg || 0),
                pracTotal: deptDetails.pracTotal + (u.practice_avg || 0),
                batches: deptDetails.batches
            });
        });

        const performance = Array.from(batchMap.entries()).map(([name, val]) => ({
            name,
            avgScore: Math.round(val.total / val.count)
        }));

        const batchBreakdown = Array.from(batchDetailsMap.entries()).map(([name, val]) => ({
            name,
            avg: Math.round(val.totalScore / val.count),
            assessment: val.assCount ? Math.round(val.assTotal / val.assCount) : 0,
            jobSim: val.jobCount ? Math.round(val.jobTotal / val.jobCount) : 0,
            practice: val.pracCount ? Math.round(val.pracTotal / val.pracCount) : 0
        }));

        const departmentBreakdown = Array.from(deptMap.entries()).map(([name, val]) => ({
            name,
            avg: Math.round(val.totalScore / val.count),
            assessment: Math.round(val.assTotal / val.count),
            jobSim: Math.round(val.jobTotal / val.count),
            practice: Math.round(val.pracTotal / val.count),
            count: val.count,
            batches: Array.from(val.batches).join(", ")
        })).sort((a, b) => b.avg - a.avg);

        setStats({ performance, batchBreakdown, departmentBreakdown });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading_Analytics</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Institution Admin Overview (only if viewing multiple departments) */}
            {!departmentId && stats.departmentBreakdown.length > 0 && (
                <div className="space-y-8">
                    {/* Leaderboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.departmentBreakdown.slice(0, 3).map((dept, index) => (
                            <div key={dept.name} className={`relative overflow-hidden rounded-[2.5rem] p-8 border ${index === 0 ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-200' : 'bg-white text-slate-900 border-slate-100 shadow-sm'
                                }`}>
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <span className="material-icons-outlined text-8xl">
                                        {index === 0 ? 'emoji_events' : index === 1 ? 'military_tech' : 'workspace_premium'}
                                    </span>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-white text-indigo-600' : 'bg-slate-900 text-white'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${index === 0 ? 'text-indigo-200' : 'text-slate-400'
                                            }`}>
                                            {index === 0 ? 'Top Performer' : 'High Performance'}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tight mb-1 truncate">{dept.name}</h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${index === 0 ? 'text-indigo-200' : 'text-slate-400'
                                        }`}>
                                        {dept.count} Students • {selectedBatch ? `Batch ${selectedBatch}` : 'Global Avg'}
                                    </p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black">{dept.avg}%</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${index === 0 ? 'text-indigo-200' : 'text-slate-400'
                                            }`}>Overall Score</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Institutional Overview</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Comparing HOD performance across all departments {selectedBatch && `for Batch ${selectedBatch}`}
                            </p>
                        </div>
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Batches</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Score</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessments</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Sims</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.departmentBreakdown.map((dept) => (
                                    <tr key={dept.name} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{dept.name}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {dept.batches.split(", ").map((b: string) => (
                                                    <span key={b} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                                                        {b}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="text-[11px] font-bold text-slate-500">{dept.count}</div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="inline-flex px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black">
                                                {dept.avg}%
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="text-[11px] font-bold text-slate-600">{dept.assessment}%</div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="text-[11px] font-bold text-slate-600">{dept.jobSim}%</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--color-primary)]" style={{ width: `${dept.avg}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Batch Performance Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Batch Performance Score Average</h3>
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.performance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="avgScore" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Cards Section */}
            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white">
                <div className="mb-10">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Departmental Breakdown</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Analytical insights across academic batches</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {stats.batchBreakdown.map((batch) => (
                        <div key={batch.name} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 transition-all hover:bg-white/[0.08] hover:scale-[1.02]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-xl font-black text-white uppercase tracking-tight block">{batch.name}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target Batch</span>
                                </div>
                                <div className="bg-indigo-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-500/20">
                                    {batch.avg}% OVERALL
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-violet-400" />
                                            Assessments
                                        </span>
                                        <span className="text-white">{batch.assessment}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-400 transition-all duration-1000" style={{ width: `${batch.assessment}%` }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-pink-400" />
                                            Job Simulations
                                        </span>
                                        <span className="text-white">{batch.jobSim}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-pink-400 transition-all duration-1000" style={{ width: `${batch.jobSim}%` }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-teal-400" />
                                            Practice Modules
                                        </span>
                                        <span className="text-white">{batch.practice}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-400 transition-all duration-1000" style={{ width: `${batch.practice}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
