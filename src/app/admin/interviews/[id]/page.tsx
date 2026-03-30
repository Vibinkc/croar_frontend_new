"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { format } from "date-fns";

export default function InterviewResults() {
    const params = useParams();
    const interviewId = params.id as string;

    return (
        <InterviewAttemptList interviewId={interviewId} />
    );
}

function InterviewAttemptList({ interviewId }: { interviewId: string }) {
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/api/v1/interviews/${interviewId}/attempts`);
                if (res.ok) {
                    setAttempts(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [interviewId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading_Interview_Data</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Interview Session Results</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interview ID: {interviewId}</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Score</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Feedback Summary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attempts.map((att) => (
                                <tr key={att.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                {att.user_name ? att.user_name[0] : "?"}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                                    {att.user_name}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">{att.user_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[11px] font-bold text-slate-500 lowercase">
                                        {format(new Date(att.created_at), "MMM d, yyyy • h:mm a")}
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${att.type === 'LIVE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {att.type}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full border ${(att.overall_score || 0) >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                (att.overall_score || 0) >= 50 ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                    "bg-rose-50 border-rose-100 text-rose-600"
                                            }`}>
                                            <span className="text-[10px] font-black">{att.overall_score ? att.overall_score.toFixed(0) : 0}%</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-[11px] font-medium text-slate-400 line-clamp-2 max-w-sm leading-relaxed">
                                            {att.ai_feedback?.summary || att.ai_feedback?.detailed_feedback || "No summary available"}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {attempts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-300">
                                        <span className="material-icons-outlined text-4xl mb-4 block opacity-30">videocam_off</span>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No_Interviews_Recorded</p>
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
