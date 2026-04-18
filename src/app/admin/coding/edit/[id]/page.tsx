"use client";

import { useState, useEffect, use } from "react";
import QuestionForm from "@/components/admin/QuestionForm";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

export default function EditCodingQuestionPage({ params }: { params: Promise<{ id: string }> }) {
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
        <div className="flex flex-col items-center justify-center p-32 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="text-[10px] font-black  tracking-[0.4em] text-slate-400 mt-8 animate-pulse">Accessing_Module_Core</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 px-6 pb-24">
            {/* Premium Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all active:scale-95 group"
                    >
                        <span className="material-icons-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black   rounded-lg border border-indigo-100">Coding Hub</span>
                            <span className="text-slate-300 text-xs">/</span>
                            <span className="text-[9px] font-black text-slate-400  ">Protocol Evolution</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight ">Calibrate_Module</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-900  tracking-[0.2em]">Module_In_Calibration</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="bg-slate-50/50 px-10 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-icons-outlined text-slate-400 text-lg">settings_suggest</span>
                                <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 ">Configuration_Matrix</span>
                            </div>
                        </div>
                        <div className="p-10">
                            {initialData && (
                                <QuestionForm
                                    onSuccess={() => router.push("/admin/coding")}
                                    onCancel={() => router.push("/admin/coding")}
                                    initialType="CODING"
                                    lockType={true}
                                    initialData={initialData}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <span className="material-icons-outlined text-8xl">auto_awesome</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black   mb-4 text-indigo-400">Calibration Notes</h3>
                            <p className="text-[11px] font-bold text-slate-400   leading-relaxed mb-6">
                                You are modifying an existing algorithmic protocol. Changes will be synchronized across all dependent assessments.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: 'history', text: 'Preserve Logic Consistency' },
                                    { icon: 'code', text: 'Verify Test Case Integrity' },
                                    { icon: 'security', text: 'Maintain Security Protocols' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                                            <span className="material-icons-outlined text-[14px] text-indigo-400">{item.icon}</span>
                                        </div>
                                        <span className="text-[9px] font-black   text-slate-200">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8">
                        <h3 className="text-[10px] font-black text-slate-400  tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            System_Diagnostic
                        </h3>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-200 mb-4">
                                <span className="material-icons-outlined text-3xl">construction</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-900   mb-1">Status: Operational</span>
                            <span className="text-[8px] font-bold text-slate-400  ">ID: {initialData?.id || 'AUTH_PENDING'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
