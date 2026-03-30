"use client";

import QuestionForm from "@/components/admin/QuestionForm";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateEvaluatorTaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const departmentId = searchParams.get("department_id") ? parseInt(searchParams.get("department_id")!) : null;

    const handleBack = () => {
        const url = `/admin/evaluator${departmentId ? `?department_id=${departmentId}` : ""}`;
        router.push(url);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-32 px-6 pt-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="material-icons-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Evaluator Engine v1.0</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Initialize Protocol</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
                        <span className="text-xs font-bold text-slate-700">Neural Configuration Active</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-icons-outlined text-slate-400 text-sm">settings_suggest</span>
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">Configuration Gateway</span>
                    </div>
                </div>
                <div className="p-6">
                    <QuestionForm
                        onSuccess={(newQ: any) => handleBack()}
                        onCancel={() => handleBack()}
                        initialType="SUBJECTIVE"
                        lockType={true}
                        departmentId={departmentId}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-70">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                        <span className="material-icons-outlined text-xl">psychology</span>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Logic_Link</p>
                        <p className="text-[10px] font-bold text-slate-900 uppercase">GPT-4o Analysis</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                        <span className="material-icons-outlined text-xl">spellcheck</span>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Grammar_Check</p>
                        <p className="text-[10px] font-bold text-slate-900 uppercase">Enabled</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                        <span className="material-icons-outlined text-xl">mood</span>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Tone_Mapping</p>
                        <p className="text-[10px] font-bold text-slate-900 uppercase">Multi-Spectral</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
