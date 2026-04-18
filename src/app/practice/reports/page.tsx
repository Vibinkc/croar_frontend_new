"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";
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
} from "recharts";

import JobSimulationResult from "@/components/results/JobSimulationResult";
import PsychometricResult from "@/components/results/PsychometricResult";
import EvaluatorResult from "@/components/results/EvaluatorResult";
import InterviewResult from "@/components/results/InterviewResult";
import AssessmentResult from "@/components/results/AssessmentResult";

export default function StudentReportsPage() {
    const { user: authUser } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Modal State
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Basic Me stats
            const statsRes = await apiClient.get("/api/v1/users/me/stats");
            if (statsRes.ok) setStats(await statsRes.json());

            // 2. Fetch Detailed Me info
            const meRes = await apiClient.get("/api/v1/users/me");
            if (meRes.ok) {
                const meData = await meRes.json();
                setUser(meData);

                // 3. Fetch Comprehensive Activity
                const activityRes = await apiClient.get(`/api/v1/activity/user/${meData.id}/comprehensive-activity`);
                if (activityRes.ok) setActivityData(await activityRes.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = async (item: any) => {
        setSelectedActivity(item);
        setLoadingReport(true);
        setReportData(null);

        try {
            const res = await apiClient.get(`/api/v1/activity/details/${item.type}/${item.id}`);
            if (res.ok) {
                setReportData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReport(false);
        }
    };

    const handleExportReport = () => {
        if (!activityData) return;
        const { timeline = [], practice_stats = [] } = activityData;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "PRACTICE PROGRESS\n";
        csvContent += "Topic,Module Type,Progress %,Completed,Total,Correct\n";
        practice_stats.forEach((s: any) => {
            csvContent += `${s.topic},${s.module_type},${s.progress_percentage},${s.completed_questions},${s.total_questions},${s.correct_answers}\n`;
        });
        csvContent += "\nACTIVITY TIMELINE\n";
        csvContent += "Date,Time,Type,Title,Score %\n";
        timeline.forEach((item: any) => {
            const dateStr = item.date ? format(new Date(item.date), "yyyy-MM-dd") : "N/A";
            const timeStr = item.date ? format(new Date(item.date), "HH:mm") : "N/A";
            csvContent += `${dateStr},${timeStr},${item.type},${item.title},${item.score || 0}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `My_Performance_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Syncing_Telemetry</p>
        </div>
    );

    const { timeline = [], practice_stats = [] } = activityData || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* Report Modal */}
            {selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative flex flex-col">
                        <button
                            onClick={() => setSelectedActivity(null)}
                            className="absolute top-6 right-6 z-[60] bg-slate-100 hover:bg-slate-200 text-slate-500 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm group"
                        >
                            <span className="material-icons-outlined text-xl group-hover:rotate-90 transition-transform">close</span>
                        </button>

                        <div className="p-1">
                            {loadingReport ? (
                                <div className="p-20 text-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full mx-auto mb-4"></div>
                                    <p className="text-sm font-bold text-slate-400  ">Retrieving Secure Report...</p>
                                </div>
                            ) : reportData ? (
                                <>
                                    {selectedActivity.type === 'JOB_SIMULATION' && <JobSimulationResult attempt={reportData.attempt} isModal={true} onClose={() => setSelectedActivity(null)} />}
                                    {selectedActivity.type === 'PSYCHOMETRIC' && <PsychometricResult result={reportData.result} test={reportData.test} isModal={true} onClose={() => setSelectedActivity(null)} />}
                                    {selectedActivity.type === 'SUBJECTIVE' && <EvaluatorResult result={reportData.result} problem={reportData.problem} isModal={true} onClose={() => setSelectedActivity(null)} />}
                                    {selectedActivity.type === 'INTERVIEW' && (
                                        <div className="p-8"><InterviewResult result={reportData.result} isModal={true} onClose={() => setSelectedActivity(null)} /></div>
                                    )}
                                    {selectedActivity.type === 'ASSESSMENT' && (
                                        <div className="p-8">
                                            <AssessmentResult result={reportData.result} test={reportData.test} questions={reportData.questions} onClose={() => setSelectedActivity(null)} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-20 text-center text-slate-400"><p>Failed to load report details.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-[10px] font-black  tracking-[0.4em] text-slate-400 mb-2">My Intelligence Dashboard</h2>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight ">Activity Monitoring & Performance Analysis</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Personal log and live performance telemetry feed.</p>
                </div>
                <button
                    onClick={handleExportReport}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs   hover:bg-slate-700 transition-all shadow-xl shadow-slate-200"
                >
                    Export Report
                </button>
            </div>

            {/* Combined Stats Row (Horizontal) */}
            <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-2">
                {/* Rankings */}
                {stats?.rankings?.map((rank: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm transition-all hover:shadow-md flex-shrink-0 min-w-[200px]">
                        <span className="text-[8px] font-black   text-slate-400 block mb-1">{rank.label}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-slate-900">#{rank.rank}</span>
                            <span className="text-[9px] text-slate-400 font-bold">/ {rank.total}</span>
                        </div>
                    </div>
                ))}

                {/* Telemetry Stats */}
                <StatCard label="Total Activities" value={timeline.length} icon="history" theme="blue" />
                <StatCard label="Practice Modules" value={practice_stats.length} icon="school" theme="violet" />
                <StatCard label="Latest Score" value={timeline[0]?.score != null ? `${Math.round(timeline[0].score)}%` : "N/A"} icon="analytics" theme="emerald" />
                <StatCard label="Last Active" value={timeline[0]?.date ? format(new Date(timeline[0].date), "MMM d, HH:mm") : "Never"} icon="schedule" theme="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Practice Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                        <h3 className="text-xs font-black text-slate-900   mb-6 flex items-center gap-2">
                            <span className="material-icons-outlined text-slate-400">fitness_center</span>
                            Practice Progress
                        </h3>
                        <div className="space-y-6">
                            {practice_stats.map((stat: any, i: number) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                                        <span className=" tracking-tight">{stat.topic} <span className="text-slate-400 font-medium">({stat.module_type})</span></span>
                                        <span className="text-slate-900">{Math.round(stat.progress_percentage)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                                            style={{ width: `${stat.progress_percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-bold  ">
                                        <span>{stat.completed_questions} / {stat.total_questions} Solved</span>
                                        <span className="text-emerald-500">{stat.correct_answers} Correct</span>
                                    </div>
                                </div>
                            ))}
                            {practice_stats.length === 0 && <p className="text-xs text-slate-400 ">No practice telemetry detected.</p>}
                        </div>
                    </div>

                    {/* Performance Benchmarking Mini Chart */}
                    {stats?.comparisons && (
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black text-slate-900   mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-slate-400">compare_arrows</span>
                                Peer Benchmarking
                            </h3>
                            <div className="w-full h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.comparisons}>
                                        <XAxis dataKey="metric" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                                        <Bar dataKey="user" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="batch_avg" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between mt-4">
                                <div className="text-center flex-1">
                                    <div className="text-[8px] font-black text-slate-400 ">You</div>
                                    <div className="text-xs font-black">{stats.comparisons[0]?.user}%</div>
                                </div>
                                <div className="text-center flex-1">
                                    <div className="text-[8px] font-black text-slate-400 ">Batch</div>
                                    <div className="text-xs font-black">{stats.comparisons[0]?.batch_avg}%</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Activity Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                        <h3 className="text-xs font-black text-slate-900   mb-8 flex items-center gap-2">
                            <span className="material-icons-outlined text-slate-400">timeline</span>
                            Activity Timeline Feed
                        </h3>

                        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-50">
                            {timeline.map((item: any, i: number) => {
                                const typeColors = getTypeColor(item.type);
                                return (
                                    <div key={i} className="relative pl-12 group">
                                        <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-md z-10 ${typeColors.bg} ${typeColors.text}`}>
                                            <span className="material-icons-outlined text-lg font-bold">{getTypeIcon(item.type)}</span>
                                        </div>
                                        <div className={`${typeColors.bg} rounded-2xl p-6 border ${typeColors.border} hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1`}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900  tracking-tight">{item.title}</h4>
                                                    <span className="text-[9px] font-black  tracking-[0.2em] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 inline-block mt-2">
                                                        {item.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-left sm:text-right shrink-0">
                                                    <div className="text-xs font-black text-slate-400  ">
                                                        {item.date ? format(new Date(item.date), "MMM d, yyyy") : "N/A"}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-300">
                                                        {item.date ? format(new Date(item.date), "h:mm a") : ""}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-2xl p-4 border border-slate-100/50 flex items-center justify-between">
                                                {renderDetails(item)}
                                                <div className={`text-xl font-black ${item.score >= 80 ? 'text-emerald-500' : item.score >= 50 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                    {item.score}%
                                                </div>
                                            </div>

                                            {['JOB_SIMULATION', 'PSYCHOMETRIC', 'SUBJECTIVE', 'INTERVIEW', 'ASSESSMENT'].includes(item.type) && (
                                                <button
                                                    onClick={() => handleViewReport(item)}
                                                    className="mt-6 w-full bg-white hover:bg-slate-900 hover:text-white text-slate-600 py-3.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 group font-black text-[10px]  tracking-[0.2em] hover:shadow-lg"
                                                >
                                                    View Intelligence Report
                                                    <span className="material-icons-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, theme = 'primary' }: any) {
    const themeColors: any = {
        primary: { bg: 'bg-slate-50', text: 'text-slate-400', hoverBg: 'group-hover:bg-slate-900', hoverText: 'group-hover:text-white' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-500', hoverBg: 'group-hover:bg-blue-500', hoverText: 'group-hover:text-white' },
        violet: { bg: 'bg-violet-50', text: 'text-violet-500', hoverBg: 'group-hover:bg-violet-500', hoverText: 'group-hover:text-white' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', hoverBg: 'group-hover:bg-emerald-500', hoverText: 'group-hover:text-white' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-500', hoverBg: 'group-hover:bg-amber-500', hoverText: 'group-hover:text-white' },
    };
    const colors = themeColors[theme] || themeColors.primary;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3 group hover:shadow-md transition-all duration-300 flex-shrink-0 min-w-[240px]">
            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} ${colors.hoverBg} ${colors.hoverText} transition-all`}>
                <span className="material-icons-outlined text-lg">{icon}</span>
            </div>
            <div>
                <div className="text-[9px] font-black text-slate-400   mb-0.5">{label}</div>
                <div className="text-lg font-black text-slate-900 tracking-tight">{value}</div>
            </div>
        </div>
    );
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'JOB_SIMULATION': return 'work';
        case 'INTERVIEW': return 'video_camera_front';
        case 'ASSESSMENT': return 'assignment_turned_in';
        case 'SUBJECTIVE': return 'rate_review';
        case 'PSYCHOMETRIC': return 'psychology';
        default: return 'circle';
    }
}

function getTypeColor(type: string) {
    switch (type) {
        case 'JOB_SIMULATION': return { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' };
        case 'AI_INTERVIEW': case 'INTERVIEW': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' };
        case 'ASSESSMENT': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
        case 'AI_EVALUATOR': case 'SUBJECTIVE': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
        case 'PSYCHOMETRIC': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
        default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
    }
}

function renderDetails(item: any) {
    const { details } = item;
    const d = details || {};

    if (item.type === 'JOB_SIMULATION') {
        return <div className="text-[10px] font-black text-slate-400 ">Operational Rounds: <span className="text-slate-900">{d.rounds}</span></div>;
    }
    if (item.type === 'INTERVIEW') {
        return <div className="text-[10px] font-black text-slate-400  capitalize">{d.type?.toLowerCase() || 'Video'} Mode Active</div>;
    }
    if (item.type === 'ASSESSMENT') {
        return <div className="text-[10px] font-black text-slate-400 ">{d.total_questions} Logical Units Analyzed</div>;
    }
    if (item.type === 'PSYCHOMETRIC') {
        return <div className="text-[10px] font-black text-slate-400 ">Primary Trait: <span className="text-slate-900">{d.trait}</span></div>;
    }
    return <div className="text-[10px] font-black text-slate-400 ">Historical Telemetry Recorded</div>;
}
