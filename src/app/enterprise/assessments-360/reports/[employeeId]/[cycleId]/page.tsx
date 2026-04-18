"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend 
} from 'recharts';

export default function X360ReportPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const employeeId = params.employeeId as string;
    const cycleId = params.cycleId as string;

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/x360/reports/${employeeId}/${cycleId}`);
                if (res.ok) {
                    setReport(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [employeeId, cycleId]);

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Generating report...</div>;
    if (!report) return <div className="p-12 text-center text-rose-500 font-bold">Report not found.</div>;

    const chartData = report.category_scores.map((cs: any) => ({
        subject: cs.category,
        Self: cs.self_score || 0,
        Manager: cs.manager_score || 0,
        Peers: cs.peer_score || 0,
        Average: cs.overall_average || 0,
        fullMark: 5
    }));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors mb-2">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">360° Feedback Report</h1>
                    <p className="text-slate-500 font-bold  text-[10px] tracking-[0.2em]">Cycle: {report.template_name}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-600  ">Completion</p>
                        <p className="text-2xl font-black text-emerald-700">{Math.round((report.completed_assignments / report.total_assignments) * 100)}%</p>
                    </div>
                    <div className="w-px h-10 bg-emerald-200"></div>
                    <div>
                        <p className="text-xs font-bold text-slate-600">{report.completed_assignments} / {report.total_assignments}</p>
                        <p className="text-[10px] font-bold text-slate-400  tracking-tighter">Assignments</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm h-[500px] flex flex-col">
                    <h3 className="font-black text-slate-800  text-xs  mb-6">Competency Overview</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#64748b" />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#94a3b8" />
                                <Radar name="Self" dataKey="Self" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.4} />
                                <Radar name="Manager" dataKey="Manager" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                                <Radar name="Average" dataKey="Average" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Summary Table */}
                <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="font-black text-slate-800  text-xs  mb-6">Aggregate Scores</h3>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400   border-b border-slate-50">
                                    <th className="py-4 px-2">Category</th>
                                    <th className="py-4 px-2 text-center">Self</th>
                                    <th className="py-4 px-2 text-center">Manager</th>
                                    <th className="py-4 px-2 text-center">Peers</th>
                                    <th className="py-4 px-2 text-center">Avg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report.category_scores.map((cs: any) => (
                                    <tr key={cs.category} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-5 px-2 text-xs font-black text-slate-700  tracking-tighter">{cs.category}</td>
                                        <td className="py-5 px-2 text-center font-bold text-sm text-indigo-600">{cs.self_score?.toFixed(1) || '-'}</td>
                                        <td className="py-5 px-2 text-center font-bold text-sm text-orange-600">{cs.manager_score?.toFixed(1) || '-'}</td>
                                        <td className="py-5 px-2 text-center font-bold text-sm text-slate-600">{cs.peer_score?.toFixed(1) || '-'}</td>
                                        <td className="py-5 px-2 text-center font-black text-sm text-emerald-600">{cs.overall_average?.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Qualitative Feedback */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Qualitative Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.text_responses.length === 0 ? (
                        <p className="col-span-2 text-slate-400 font-bold  py-10 bg-white rounded-xl border border-dashed text-center">
                            No qualitative responses yet.
                        </p>
                    ) : (
                        report.text_responses.map((resp: any, idx: number) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3 hover:border-indigo-100 transition-all">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black  text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{resp.category}</span>
                                    <span className="text-[10px] font-black  text-slate-400 ">{resp.relation}</span>
                                </div>
                                <p className="text-[11px] font-black text-slate-400  tracking-tighter">Question: {resp.question}</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed ">"{resp.answer}"</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
