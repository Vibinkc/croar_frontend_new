"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    RefreshCcw,
    ShieldCheck,
    UserPlus,
    LogIn,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { Card, CardHeader, Badge, Button, PageHeader, jetbrainsMono } from "@/components/ds";

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
            <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                <div className="h-16 bg-white rounded-[14px] border border-[#E8EAED] animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2].map(i => <div key={i} className="h-44 bg-white rounded-[14px] border border-[#E8EAED] animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-[12px] shadow-[0_14px_34px_rgba(15,23,42,0.16)] text-[13.5px] font-semibold flex items-center gap-3 border ${toast.type === "success" ? "bg-white border-[#E8EAED] text-[#15171C]" : "bg-[#FDECEC] border-[#F7D7D7] text-[#C0383C]"}`}
                    >
                        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${toast.type === "success" ? "bg-[#E6F4EA] text-[#15803D]" : "bg-[#FDECEC] text-[#C0383C]"}`}>
                            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <PageHeader
                title="Platform Settings"
                subtitle="Configure global application behavior"
                help={<><p>Configure platform-wide settings and defaults.</p></>}
                actions={
                    <Button variant="secondary" icon="refresh" onClick={fetchSettings} disabled={isSaving !== null}>
                        Refresh
                    </Button>
                }
            />

            {/* Settings sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {settings.map((setting) => (
                    <Card key={setting.key} interactive className="flex flex-col">
                        <div className="flex items-start justify-between gap-4">
                            <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                {setting.key === 'signup_enabled' ? (
                                    <UserPlus className="w-5 h-5" />
                                ) : setting.key === 'google_sso_enabled' || setting.key === 'microsoft_sso_enabled' ? (
                                    <ShieldCheck className="w-5 h-5" />
                                ) : (
                                    <LogIn className="w-5 h-5" />
                                )}
                            </span>

                            <div className="flex items-center gap-3">
                                {isSaving === setting.key && <RefreshCcw className="w-4 h-4 animate-spin text-[#8A929E]" />}
                                <button
                                    onClick={() => toggleSetting(setting.key, !!setting.value_bool)}
                                    disabled={isSaving !== null}
                                    className={`relative w-12 h-6.5 rounded-full transition-colors duration-300 flex items-center px-0.5 disabled:opacity-60 ${setting.value_bool ? 'bg-[#5B53E0]' : 'bg-[#E1E4E8]'}`}
                                    style={{ height: "26px", width: "46px" }}
                                >
                                    <span className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${setting.value_bool ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 space-y-1.5">
                            <h3 className="text-[15px] font-bold text-[#15171C] capitalize">
                                {setting.key.replace('_', ' ')}
                            </h3>
                            <p className="text-[12.5px] text-[#8A929E] leading-relaxed">
                                {setting.description}
                            </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-[#E8EAED] flex items-center justify-between">
                            <span className="text-[12px] text-[#8A929E]">Global status</span>
                            <Badge tone={setting.value_bool ? "success" : "danger"} dot>
                                {setting.value_bool ? 'Active' : 'Disabled'}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Security & Governance panel */}
            <Card>
                <CardHeader
                    title={<>Security &amp; Governance</>}
                    subtitle="Core entry points for the Croar platform"
                    action={
                        <span className={`inline-flex items-center h-7 px-3 rounded-[8px] bg-[#F1F2F5] text-[#4B5563] text-[12px] font-semibold ${jetbrainsMono.className}`}>
                            v1.0.4
                        </span>
                    }
                />
                <div className="flex items-start gap-4">
                    <span className="w-11 h-11 rounded-[12px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                    </span>
                    <p className="text-[13.5px] text-[#374151] leading-relaxed max-w-2xl">
                        These settings control the core entry points of the Croar platform. Changes are applied instantly across all regions. Ensure you have proper authorization before disabling critical services.
                    </p>
                </div>
            </Card>
        </div>
    );
}
