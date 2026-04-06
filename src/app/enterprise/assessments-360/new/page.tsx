"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Template {
    id: string;
    name: string;
    description: string;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    designation?: string;
}

export default function X360NewCycle() {
    const { token } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        template_id: "",
        ratee_ids: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tplRes, empRes] = await Promise.all([
                    apiClient.get("/api/v1/enterprise/x360/templates"),
                    apiClient.get("/api/v1/enterprise/employees/")
                ]);
                
                if (tplRes.ok) {
                    const data = await tplRes.json();
                    setTemplates(Array.isArray(data) ? data : []);
                }
                if (empRes.ok) {
                    const data = await empRes.json();
                    setEmployees(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiClient.post("/api/v1/enterprise/x360/cycles", formData);
            if (res.ok) {
                router.push("/enterprise/assessments-360");
            } else {
                alert("Failed to start cycle");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRatee = (id: string) => {
        setFormData(prev => ({
            ...prev,
            ratee_ids: prev.ratee_ids.includes(id)
                ? prev.ratee_ids.filter(rid => rid !== id)
                : [...prev.ratee_ids, id]
        }));
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-center pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/assessments-360')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Start New 360 Cycle</h1>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm text-indigo-500">add_task</span>
                            Configure and launch a new feedback round
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/10 space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Cycle Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Cycle Name</label>
                                <input 
                                    className="w-full px-5 py-3 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-300"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Q1 Leadership Review"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Start Date</label>
                                    <input 
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-xs text-slate-600"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">End Date</label>
                                    <input 
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-xs text-slate-600"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest px-1">Select Template</label>
                            <div className="space-y-3">
                                {templates.map(tpl => (
                                    <div 
                                        key={tpl.id}
                                        onClick={() => setFormData(prev => ({
                                            ...prev, 
                                            template_id: prev.template_id === tpl.id ? "" : tpl.id
                                        }))}
                                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${formData.template_id === tpl.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-900 text-xs truncate leading-tight mb-0.5">{tpl.name}</h4>
                                            <p className="text-[9px] text-slate-400 line-clamp-1 italic font-medium">{tpl.description || "Active Framework"}</p>
                                        </div>
                                        {formData.template_id === tpl.id && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[14px]">check</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting || !formData.template_id || formData.ratee_ids.length === 0}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                        >
                            {submitting ? 'Transmitting...' : 'Launch Cycle'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/10">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Target Employees</h3>
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full">{formData.ratee_ids.length} SELECTIONS noted</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {employees.map(emp => (
                            <div 
                                key={emp.id}
                                onClick={() => toggleRatee(emp.id)}
                                className={`p-4 border-2 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-3 ${formData.ratee_ids.includes(emp.id) ? 'border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                            >
                                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] transition-all ${formData.ratee_ids.includes(emp.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                    {formData.ratee_ids.includes(emp.id) ? (
                                        <span className="material-symbols-rounded text-sm">check</span>
                                    ) : (
                                        emp.first_name[0]
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-slate-900 truncate leading-tight mb-0.5">{emp.first_name} {emp.last_name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{emp.designation || 'Specialist'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
}
