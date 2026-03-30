"use client";

import { useState, useEffect, use } from "react";
import QuestionForm from "@/components/admin/QuestionForm";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

export default function EditEvaluatorTaskPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.get(`/api/v1/content/questions/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setInitialData(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading_Protocol_Matrix</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] shadow-sm transition-all"
                >
                    <span className="material-icons-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Update_Evaluation_Protocol</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Modify Subjective Neural Analysis Module</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
                        <span className="text-[9px] font-black tracking-[0.4em] text-[var(--color-primary)] uppercase">Configuration_Gateway</span>
                    </div>
                </div>
                <div className="p-6">
                    {initialData && (
                        <QuestionForm
                            onSuccess={() => router.push("/admin/evaluator")}
                            onCancel={() => router.push("/admin/evaluator")}
                            initialType="SUBJECTIVE"
                            lockType={true}
                            initialData={initialData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
