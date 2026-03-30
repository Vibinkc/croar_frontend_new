"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiClient } from "@/utils/api";

interface Result {
    user_id: number;
    user_name: string;
    ranking: number;
    summary: string;
    feedback: {
        strengths: string[];
        weaknesses: string[];
    };
}

export default function GDResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [results, setResults] = useState<Result[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = Cookies.get("user");
        if (userStr) {
            try { setCurrentUser(JSON.parse(userStr)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            // const token = Cookies.get("auth_");
            const response = await apiClient.get(`/api/v1/discussion/${id}/results`);
            if (response.ok) {
                const data = await response.json();
                setResults(data);
            }
        } catch (error) {
            console.error("Failed to fetch GD results:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Post-GD Analysis</span>
                    <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">AI Assessment Report</h1>
                    <p className="text-slate-500 font-medium text-lg">Detailed performance breakdown for the discussion session</p>
                </div>

                {isLoading ? (
                    <div className="h-[50vh] flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                        <p className="font-black text-slate-400 uppercase tracking-widest animate-pulse">AI is preparing your report...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Leaderboard */}
                        <div className="lg:col-span-1 space-y-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Final Ranking</h3>
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
                                {results.map((res, i) => (
                                    <div key={i} className={`p-6 flex items-center justify-between border-b border-slate-50 last:border-0 ${res.user_id === currentUser?.id ? 'bg-slate-50' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                                                {res.ranking}
                                            </div>
                                            <p className="font-black text-slate-800 uppercase text-sm">{res.user_name}</p>
                                        </div>
                                        {res.user_id === currentUser?.id && <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">Current User</span>}
                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* Detailed Tabs */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Personalized Feedback</h3>
                            <div className="space-y-4">
                                {results.map((res, i) => (
                                    <div key={i} className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200 border border-slate-100">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                    <span className="material-icons text-slate-400">person</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{res.user_name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rank #{res.ranking}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-600 font-medium italic mb-8 border-l-4 border-slate-200 pl-6 text-lg leading-relaxed">
                                            "{res.summary}"
                                        </p>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Top Strengths</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {res.feedback.strengths.map((s, j) => (
                                                        <span key={j} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 italic">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Areas for Growth</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {res.feedback.weaknesses.map((w, j) => (
                                                        <span key={j} className="px-3 py-1.5 bg-white text-slate-500 rounded-xl text-xs font-bold border border-slate-100 italic">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
