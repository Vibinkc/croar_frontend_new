"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { format } from "date-fns";

export default function ResumeScoreResults() {
    const params = useParams();
    const router = useRouter();
    const configId = params.configId as string;

    // We don't have the config name here unless we fetch the config details too.
    // Ideally we fetch both.

    return (
        <ResumeScoreList configId={configId} />
    );
}

function ResumeScoreList({ configId }: { configId: string }) {
    const [scores, setScores] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Config Details (optional but good for header)
                // We need an endpoint for retrieving single config or just trust the ID. 
                // Assuming existing GET /config implies list, maybe we need filter.
                // Let's just fetch scores first.

                const res = await apiClient.get(`/api/v1/resume/scores?config_id=${configId}`);
                if (res.ok) {
                    setScores(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [configId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading_Results</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Resume Scan Results</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration ID: {configId}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Feedback</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {scores.map((score) => (
                                <tr key={score.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                {score.user ? score.user.first_name[0] : "?"}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
                                                    {score.user ? `${score.user.first_name} ${score.user.last_name}` : "Unknown Student"}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">{score.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-[10px] font-bold text-slate-500 lowercase">
                                        {format(new Date(score.created_at), "MMM d, yyyy • h:mm a")}
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full border ${score.score >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                            score.score >= 60 ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                "bg-rose-50 border-rose-100 text-rose-600"
                                            }`}>
                                            <span className="text-[10px] font-black">{score.score}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-[10px] font-medium text-slate-600 line-clamp-2 max-w-sm leading-relaxed">
                                            {score.feedback_summary}
                                        </p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-[10px] font-black text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] uppercase tracking-widest transition-colors">
                                            View Full Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {scores.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-300">
                                        <span className="material-icons-outlined text-4xl mb-4 block opacity-30">inbox</span>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No_Submissions_Found</p>
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
