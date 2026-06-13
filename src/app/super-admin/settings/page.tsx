"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Settings, 
    Save, 
    RefreshCcw, 
    ShieldCheck, 
    UserPlus, 
    LogIn, 
    CheckCircle2, 
    AlertCircle,
    Activity
} from "lucide-react";

interface SystemSetting {
    key: string;
    value_bool: boolean | null;
    value_str: string | null;
    description: string;
}

export default function PlatformSettingsPage() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch settings", e);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const toggleSetting = async (key: string, currentValue: boolean) => {
        setIsSaving(key);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/settings/${key}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ value: !currentValue })
            });

            if (res.ok) {
                const updated = await res.json();
                setSettings(prev => prev.map(s => s.key === key ? updated : s));
                showToast(`${key.replace('_', ' ')} updated successfully.`);
            } else {
                showToast("Failed to update setting.", "error");
            }
        } catch (err) {
            showToast("Connection error.", "error");
        } finally {
            setIsSaving(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                <div className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className={`fixed bottom-10 right-10 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 border backdrop-blur-md ${toast.type === "success" ? "bg-white/90 border-slate-100 text-slate-900" : "bg-rose-50/90 border-rose-100 text-rose-600"}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-100 text-rose-500"}`}>
                            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
                        <p className="text-slate-500 text-xs font-medium">Configure global application behavior</p>
                    </div>
                </div>
                <button 
                    onClick={fetchSettings}
                    className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                >
                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Grid of Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map((setting) => (
                    <motion.div 
                        key={setting.key}
                        whileHover={{ y: -2 }}
                        className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                {setting.key === 'signup_enabled' ? (
                                    <UserPlus className="w-6 h-6 text-indigo-600" />
                                ) : setting.key === 'google_sso_enabled' ? (
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                ) : setting.key === 'microsoft_sso_enabled' ? (
                                    <ShieldCheck className="w-6 h-6 text-rose-600" />
                                ) : (
                                    <LogIn className="w-6 h-6 text-slate-600" />
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {isSaving === setting.key && <RefreshCcw className="w-4 h-4 animate-spin text-slate-400" />}
                                <button
                                    onClick={() => toggleSetting(setting.key, !!setting.value_bool)}
                                    disabled={isSaving !== null}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${setting.value_bool ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${setting.value_bool ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                {setting.key.replace('_', ' ')}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {setting.description}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${setting.value_bool ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {setting.value_bool ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Platform Health / Info Section */}
            <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                        <ShieldCheck className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Security & Governance</h2>
                        <p className="text-slate-400 text-sm max-w-xl font-medium">
                            These settings control the core entry points of the Croar platform. Changes are applied instantly across all regions. Ensure you have proper authorization before disabling critical services.
                        </p>
                    </div>
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs">
                        System Authority: v1.0.4
                    </div>
                </div>
            </div>
        </div>
    );
}
