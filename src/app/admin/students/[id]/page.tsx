"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { apiClient } from "@/utils/api";

import JobSimulationResult from "@/components/results/JobSimulationResult";
import PsychometricResult from "@/components/results/PsychometricResult";
import EvaluatorResult from "@/components/results/EvaluatorResult";
import InterviewResult from "@/components/results/InterviewResult";
import AssessmentResult from "@/components/results/AssessmentResult";

export default function StudentDetail() {
    const params = useParams();
    const id = params?.id;

    const [user, setUser] = useState<any>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        if (id) fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        try {
            // 1. Fetch User Details
            const res = await apiClient.get(`/api/v1/users/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);

                const statsRes = await apiClient.get(`/api/v1/progress/stats?user_id=${id}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                }
            }

            const resActivity = await apiClient.get(`/api/v1/activity/user/${id}/comprehensive-activity`);

            if (resActivity.ok) {
                const data = await resActivity.json();
                setActivityData(data);
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
            // If item has no ID (legacy data), we can't fetch details
            if (!item.id && item.type !== 'PSYCHOMETRIC') { // Psychometric might work differently if referenced via ID
                // For legacy support or if ID missing
                console.warn("No activity ID found");
                setLoadingReport(false);
                return;
            }

            const res = await apiClient.get(`/api/v1/activity/details/${item.type}/${item.id}`);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            } else {
                console.error("Failed to fetch report details");
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

        // Practice Stats Section
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

        const safeName = user ? `${user.first_name}_${user.last_name}` : `Student_${id}`;
        const safeDep = user?.department?.name || user?.department_id || "No_Dept";
        const safeBatch = user?.batch || "No_Batch";

        link.setAttribute("download", `${safeName}_${safeDep}_${safeBatch}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-slate-500">Loading student profile...</div>;

    const { timeline = [], practice_stats = [] } = activityData || {};

    return (
        <div className="space-y-8 max-w-7xl mx-auto relative">
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
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Retrieving Secure Report...</p>
                                </div>
                            ) : reportData ? (
                                <>
                                    {selectedActivity.type === 'JOB_SIMULATION' && (
                                        <JobSimulationResult
                                            attempt={reportData.attempt}
                                            isModal={true}
                                            onClose={() => setSelectedActivity(null)}
                                        />
                                    )}
                                    {selectedActivity.type === 'PSYCHOMETRIC' && (
                                        <PsychometricResult
                                            result={reportData.result}
                                            test={reportData.test}
                                            isModal={true}
                                            onClose={() => setSelectedActivity(null)}
                                        />
                                    )}
                                    {selectedActivity.type === 'SUBJECTIVE' && (
                                        <EvaluatorResult
                                            result={reportData.result}
                                            problem={reportData.problem}
                                            isModal={true}
                                            onClose={() => setSelectedActivity(null)}
                                        />
                                    )}
                                    {selectedActivity.type === 'INTERVIEW' && (
                                        <div className="p-8">
                                            <InterviewResult
                                                result={reportData.result}
                                                isModal={true}
                                                onClose={() => setSelectedActivity(null)}
                                            />
                                        </div>
                                    )}
                                    {selectedActivity.type === 'ASSESSMENT' && (
                                        <div className="p-8">
                                            <AssessmentResult
                                                result={reportData.result}
                                                test={reportData.test}
                                                questions={reportData.questions}
                                                onClose={() => setSelectedActivity(null)}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-20 text-center text-slate-400">
                                    <p>Failed to load report details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/students" className="text-sm font-bold text-slate-400 hover:text-slate-900 mb-2 inline-flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">arrow_back</span>
                        Back to Operatives
                    </Link>
                    <div className="flex items-center gap-4">
                        <Image
                            src="/Academik_logo.png"
                            alt="Academik Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                        />
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                            OPERATIVE LOG: {user ? `${user.first_name} ${user.last_name}` : `#${id}`}
                        </h1>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Activity Monitoring & Performance Analysis</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportReport}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Total Activities" value={timeline.length} icon="history" theme="blue" />
                <StatCard label="Practice Modules" value={practice_stats.length} icon="school" theme="violet" />
                <StatCard label="Latest Score" value={timeline[0]?.score ? `${Math.round(timeline[0].score)}%` : "N/A"} icon="analytics" theme="emerald" />
                <StatCard label="Last Active" value={timeline[0]?.date ? format(new Date(timeline[0].date), "MMM d, HH:mm") : "Never"} icon="schedule" theme="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Practice Stats */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-icons-outlined text-slate-500 text-sm">fitness_center</span>
                            Practice Progress
                        </h3>
                        <div className="space-y-3">
                            {practice_stats.map((stat: any, i: number) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>{stat.topic} <span className="text-slate-400 font-normal">({stat.module_type})</span></span>
                                        <span className="text-slate-900">{Math.round(stat.progress_percentage)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                                            style={{ width: `${stat.progress_percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                        <span>{stat.completed_questions} / {stat.total_questions} Solved</span>
                                        <span>{stat.correct_answers} Correct</span>
                                    </div>
                                </div>
                            ))}
                            {practice_stats.length === 0 && <p className="text-xs text-slate-400 italic">No practice data recorded.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-icons-outlined text-slate-500 text-sm">timeline</span>
                            Activity Timeline
                        </h3>

                        <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-100">
                            {timeline.map((item: any, i: number) => {
                                const typeColors = getTypeColor(item.type);
                                return (
                                    <div key={i} className="relative pl-8 group">
                                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${typeColors.bg} ${typeColors.text}`}>
                                            <span className="material-icons-outlined text-xs font-bold">{getTypeIcon(item.type)}</span>
                                        </div>
                                        <div className={`bg-white rounded-xl p-3 border ${typeColors.border} hover:border-slate-300 transition-colors group-hover:shadow-sm`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                                                        {item.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-slate-500 block">
                                                        {item.date ? format(new Date(item.date), "MMM d, yyyy") : "N/A"}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        {item.date ? format(new Date(item.date), "h:mm a") : ""}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            <div className="mt-3 text-xs text-slate-600 bg-white rounded-lg p-3 border border-slate-100">
                                                {renderDetails(item)}
                                            </div>

                                            {/* View Report Button */}
                                            {['JOB_SIMULATION', 'PSYCHOMETRIC', 'SUBJECTIVE', 'INTERVIEW', 'ASSESSMENT'].includes(item.type) && (
                                                <button
                                                    onClick={() => handleViewReport(item)}
                                                    className="mt-4 w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 group border-dashed"
                                                >
                                                    View Detailed Report
                                                    <span className="material-icons-outlined text-xs">arrow_forward</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                );
                            })}
                            {timeline.length === 0 && (
                                <div className="pl-12 py-8 text-sm text-slate-400 italic">
                                    No activity recorded for this operative yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, theme = 'primary' }: any) {
    const themeColors: any = {
        primary: { bg: 'bg-[var(--color-primary)]/10', text: 'text-[var(--color-primary)]' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    };
    const colors = themeColors[theme] || themeColors.primary;

    return (
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                <span className="material-icons-outlined text-lg">{icon}</span>
            </div>
            <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                <div className="text-base font-black text-slate-900">{value}</div>
            </div>
        </div>
    );
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'JOB_SIMULATION': return 'work';
        case 'AI_INTERVIEW': case 'INTERVIEW': return 'video_camera_front'; // Handle both naming conventions if any
        case 'ASSESSMENT': return 'assignment_turned_in';
        case 'AI_EVALUATOR': case 'SUBJECTIVE': return 'rate_review';
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
    const { details, score } = item;
    // ensure details exists
    const d = details || {};

    if (item.type === 'JOB_SIMULATION') {
        return (
            <div className="space-y-1">
                <div className="flex justify-between font-bold">
                    <span>Score: <span className="text-slate-900">{Math.round(score || 0)}%</span></span>
                    <span>Rounds: {d.rounds}</span>
                </div>
                {d.feedback?.strengths && (
                    <div className="mt-2">
                        <span className="font-bold text-slate-700 block mb-1">Strengths:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                            {d.feedback.strengths.slice(0, 2).map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    if (item.type === 'AI_INTERVIEW' || item.type === 'INTERVIEW') {
        return (
            <div className="space-y-1">
                <div className="flex justify-between font-bold">
                    <span>Performance: <span className="text-slate-900">{Math.round(score || 0)}%</span></span>
                    {d.type && <span className="capitalize">{d.type.toLowerCase()} Mode</span>}
                </div>
            </div>
        );
    }

    if (item.type === 'ASSESSMENT' || item.type === 'AI_EVALUATOR' || item.type === 'SUBJECTIVE') {
        return (
            <div className="flex gap-4">
                <div className="font-bold">Score: <span className="text-slate-900">{Math.round(score || 0)}%</span></div>
                {d.grammar && <div>Grammar: {Math.round(d.grammar)}%</div>}
            </div>
        );
    }

    if (item.type === 'PSYCHOMETRIC') {
        return (
            <div>
                <div className="font-bold mb-1">Trait Score: {Math.round(score || 0)}%</div>
                <p className="line-clamp-2">{d.summary}</p>
            </div>
        );
    }

    return <div>Score: {score}</div>;
}
