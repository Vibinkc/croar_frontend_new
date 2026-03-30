"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { format } from "date-fns";

export default function DiscussionResults() {
    const params = useParams();
    const sessionId = params.id as string;

    return (
        <DiscussionScoreVisualizer sessionId={sessionId} />
    );
}

function DiscussionScoreVisualizer({ sessionId }: { sessionId: string }) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/api/v1/discussion/${sessionId}/results`);
                if (res.ok) {
                    setResults(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sessionId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading_GD_Rankings</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Group Discussion Leaderboard</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session ID: {sessionId}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((res, index) => (
                    <div key={res.user_id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                        <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <span className="material-icons-outlined text-8xl">leaderboard</span>
                        </div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md ${index === 0 ? "bg-amber-400 shadow-amber-200" :
                                index === 1 ? "bg-slate-400 shadow-slate-200" :
                                    index === 2 ? "bg-orange-400 shadow-orange-200" : "bg-slate-100 text-slate-400"
                                }`}>
                                #{res.ranking}
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase">
                                {res.user_name ? res.user_name.split(" ").map((n: any) => n[0]).join("") : "?"}
                            </div>
                        </div>

                        <div className="mb-5 relative z-10">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{res.user_name}</h3>
                            <p className="text-[9px] font-medium text-slate-400 mb-3">{res.user_email}</p>

                            <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-100">
                                <p className="text-[10px] font-medium text-slate-600 leading-relaxed italic">
                                    "{res.summary}"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                            <div>
                                <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <span className="material-icons-outlined text-[10px]">thumb_up</span> Strengths
                                </h4>
                                <ul className="space-y-1">
                                    {res.feedback?.strengths?.map((s: string, i: number) => (
                                        <li key={i} className="text-[9px] text-slate-500 font-medium pl-2 border-l-2 border-emerald-100">{s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <span className="material-icons-outlined text-[10px]">thumb_down</span> Areas for Growth
                                </h4>
                                <ul className="space-y-1">
                                    {res.feedback?.weaknesses?.map((w: string, i: number) => (
                                        <li key={i} className="text-[9px] text-slate-500 font-medium pl-2 border-l-2 border-rose-100">{w}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}

                {results.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                        <span className="material-icons-outlined text-4xl mb-3 opacity-30">pending_actions</span>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">No_Results_Available_Yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
