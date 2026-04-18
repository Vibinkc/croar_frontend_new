"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    batch?: string | null;
    member_id?: string | null;
    department?: { name: string };
    performance_score?: number;
    assessment_avg?: number;
    job_sim_avg?: number;
    practice_avg?: number;
}

export default function StudentReportsPage() {
    return (
        <HierarchyDrilldown
            title="STUDENT REPORTS"
            description="Visual analytics and detailed reports for student performance."
            renderContent={(divisionId, departmentId) => (
                <ReportsContent divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function ReportsContent({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived stats
    const [stats, setStats] = useState({
        distribution: [] as any[],
        activity: [] as any[],
        performance: [] as any[],
        topPerformers: [] as any[]
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

            // Use the new comprehensive report endpoint
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

    const calculateStats = (data: User[]) => {
        // 1. Activity Distribution (Active vs Inactive)
        const activeCount = data.filter(u => u.is_active).length;
        const inactiveCount = data.length - activeCount;
        const distribution = [
            { name: "Active", value: activeCount, color: "#4f46e5" },
            { name: "Inactive", value: inactiveCount, color: "#cbd5e1" }
        ];

        // 2. Batch Performance (Average Score per Batch)
        const batchMap = new Map<string, { total: number; count: number }>();
        data.forEach(u => {
            const batch = u.batch || "Unknown";
            const current = batchMap.get(batch) || { total: 0, count: 0 };
            batchMap.set(batch, {
                total: current.total + (u.performance_score || 0),
                count: current.count + 1
            });
        });

        const performance = Array.from(batchMap.entries()).map(([name, val]) => ({
            name,
            avgScore: Math.round(val.total / val.count)
        }));

        // 3. Module Performance Breakdown (Real Data)
        let totalAss = 0, totalJob = 0, totalPrac = 0;
        let countAss = 0, countJob = 0, countPrac = 0;

        data.forEach(u => {
            if (u.assessment_avg) { totalAss += u.assessment_avg; countAss++; }
            if (u.job_sim_avg) { totalJob += u.job_sim_avg; countJob++; }
            if (u.practice_avg) { totalPrac += u.practice_avg; countPrac++; }
        });

        const activity = [
            { name: 'Assessments', value: countAss ? Math.round(totalAss / countAss) : 0, fill: '#8b5cf6' },
            { name: 'Job Sims', value: countJob ? Math.round(totalJob / countJob) : 0, fill: '#ec4899' },
            { name: 'Practice', value: countPrac ? Math.round(totalPrac / countPrac) : 0, fill: '#14b8a6' },
        ];

        // 4. Top Performers
        const topPerformers = [...data]
            .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
            .slice(0, 5)
            .map(u => ({
                name: `${u.first_name} ${u.last_name}`,
                score: u.performance_score
            }));

        setStats({ distribution, performance, activity, topPerformers });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Loading_Reports</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 1: Status Distribution */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-xs font-black   text-slate-400 mb-6 w-full text-left">Operative Status</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Batch Performance */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black   text-slate-400 mb-6">Batch Performance Avg</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.performance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 3: Module Performance Breakdown */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black   text-slate-400 mb-6">Module Performance Avg</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.activity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                    {stats.activity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 4: Top Performers */}
                <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black   text-slate-400 mb-6">Top Performers Leaderboard</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topPerformers} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900  ">Operative Directory</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{users.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-50">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400  ">Operative</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400  ">Batch</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400  ">Performance</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400  ">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-all">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-xs mr-4">
                                                {user.first_name[0]}{user.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 ">{user.first_name} {user.last_name}</div>
                                                <div className="text-[10px] text-slate-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{user.batch || 'N/A'}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${user.performance_score || 0}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">{user.performance_score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Link href={`/admin/students/${user.id}`}>
                                            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black   hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200">
                                                View Report
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-xs ">
                                        No operatives found in this selection.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
