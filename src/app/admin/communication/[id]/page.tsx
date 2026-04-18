"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { format } from "date-fns";

export default function CommunicationResults() {
    const params = useParams();
    const router = useRouter();
    const scenarioId = params.id as string;

    return (
        <CommunicationScoreList scenarioId={scenarioId} />
    );
}

function CommunicationScoreList({ scenarioId }: { scenarioId: string }) {
    const [scores, setScores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/api/v1/coach/scenarios/${scenarioId}/attempts`);
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
    }, [scenarioId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Loading_Results</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900  tracking-tighter mb-2">Communication Analysis</h1>
                    <p className="text-xs font-bold text-slate-400  ">Scenario ID: {scenarioId}</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-6 text-[10px] font-black text-slate-400  ">Student</th>
                                <th className="p-6 text-[10px] font-black text-slate-400  ">Date</th>
                                <th className="p-6 text-[10px] font-black text-slate-400  ">Score (Arg)</th>
                                <th className="p-6 text-[10px] font-black text-slate-400  ">Breakdown (F/G/C/R)</th>
                                <th className="p-6 text-[10px] font-black text-slate-400  ">Transcription</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {scores.map((score) => (
                                <tr key={score.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                {score.user_name ? score.user_name[0] : "?"}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900  tracking-wide">
                                                    {score.user_name}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">{score.user_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[11px] font-bold text-slate-500 lowercase">
                                        {format(new Date(score.created_at), "MMM d, yyyy • h:mm a")}
                                    </td>
                                    <td className="p-6">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full border ${score.score >= 8 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                            score.score >= 5 ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                "bg-rose-50 border-rose-100 text-rose-600"
                                            }`}>
                                            <span className="text-[10px] font-black">{score.score.toFixed(1)}/10</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2 text-[9px] font-black text-slate-500">
                                            <span title="Fluency" className="bg-slate-100 px-1.5 py-0.5 rounded">{score.fluency}</span>
                                            <span title="Grammar" className="bg-slate-100 px-1.5 py-0.5 rounded">{score.grammar}</span>
                                            <span title="Confidence" className="bg-slate-100 px-1.5 py-0.5 rounded">{score.confidence}</span>
                                            <span title="Relevance" className="bg-slate-100 px-1.5 py-0.5 rounded">{score.relevance}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-[11px] font-medium text-slate-600 line-clamp-2 max-w-sm leading-relaxed ">
                                            "{score.transcription}"
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {scores.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-300">
                                        <span className="material-icons-outlined text-4xl mb-4 block opacity-30">record_voice_over</span>
                                        <p className="text-[10px] font-black  tracking-[0.2em]">No_Analyzed_Attempts</p>
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
