"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

interface Template {
    id: string;
    title: string;
    description: string;
    survey_type: { name: string };
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    designation: string;
}

export default function LaunchSurvey() {
    const { token } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        template_id: "",
        name: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        target_group: "ALL" as "ALL" | "CUSTOM",
        employee_ids: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tplRes, empRes] = await Promise.all([
                    apiClient.get('/api/v1/enterprise/surveys/templates'),
                    apiClient.get('/api/v1/enterprise/employees/')
                ]);
                if (tplRes.ok) setTemplates(await tplRes.json());
                if (empRes.ok) setEmployees(await empRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleEmployee = (id: string) => {
        setFormData(prev => {
            const ids = prev.employee_ids.includes(id) 
                ? prev.employee_ids.filter(e => e !== id) 
                : [...prev.employee_ids, id];
            return { ...prev, employee_ids: ids };
        });
    };

    const handleLaunch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiClient.post('/api/v1/enterprise/surveys/launch', formData);
            if (res.ok) {
                router.push('/enterprise/surveys');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">Syncing with personnel database...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-center pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/enterprise/surveys')} className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center text-xl">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Launch Survey Campaign</h1>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Select target audience and deploy feedback framework</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleLaunch} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/10 space-y-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Campaign Name</label>
                            <input 
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Annual Engagement Survey"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Start Date</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-700"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">End Date</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-700"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Selected Framework</label>
                            <div className="space-y-2">
                                {templates.map(tpl => (
                                    <div 
                                        key={tpl.id}
                                        onClick={() => setFormData({...formData, template_id: tpl.id})}
                                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${formData.template_id === tpl.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-0.5">{tpl.survey_type.name}</p>
                                            <h4 className="font-black text-slate-900 text-xs truncate leading-tight">{tpl.title}</h4>
                                        </div>
                                        {formData.template_id === tpl.id && <span className="material-symbols-rounded text-indigo-600 text-lg">check_circle</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting || !formData.template_id || (formData.target_group === 'CUSTOM' && formData.employee_ids.length === 0)}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-100 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Launching...' : 'DEPLOY SURVEY'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/10 h-full flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 px-1 border-b border-slate-50 pb-6 uppercase tracking-[0.1em] font-black">
                        <div>
                            <h3 className="text-xl text-slate-900">Configure Audience</h3>
                            <p className="text-slate-400 text-[9px] mt-1">Select target employees for this campaign</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, target_group: 'ALL'})}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${formData.target_group === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                Entire Organization
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, target_group: 'CUSTOM'})}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${formData.target_group === 'CUSTOM' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                Custom Selection
                            </button>
                        </div>
                    </div>

                    <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar transition-opacity ${formData.target_group === 'ALL' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        {employees.map(emp => (
                            <div 
                                key={emp.id}
                                onClick={() => toggleEmployee(emp.id)}
                                className={`p-4 border-2 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-3 ${formData.employee_ids.includes(emp.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] transition-all border ${formData.employee_ids.includes(emp.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
                                    {formData.employee_ids.includes(emp.id) ? <span className="material-symbols-rounded text-sm font-black">check</span> : emp.first_name[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-slate-900 truncate leading-tight">{emp.first_name} {emp.last_name}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{emp.designation || 'Specialist'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {formData.target_group === "ALL" && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-12 text-center pointer-events-none">
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-50 animate-in zoom-in duration-500 max-w-sm">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-rounded text-4xl">public</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-3">Organization Wide</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                                    Survey will be dispatched to <span className="text-indigo-600 font-black">all {employees.length} employees</span> in the personnel database.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
