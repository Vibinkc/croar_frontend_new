"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Building2, 
    Upload, 
    MapPin, 
    Globe, 
    ExternalLink, 
    CheckCircle2, 
    AlertCircle,
    Save,
    Camera,
    Zap,
    Shield
} from "lucide-react";

interface CompanyProfile {
    id: string;
    name: string;
    logo_url?: string;
    industry?: string;
    location?: string;
}

export default function OrganizationProfilePage() {
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profile, setProfile] = useState<CompanyProfile | null>(null);

    // Form Stats
    const [name, setName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [industry, setIndustry] = useState("");
    const [location, setLocation] = useState("");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const primary = Array.isArray(data) ? data[0] : data;
                if (!primary) {
                    setIsLoading(false);
                    return;
                }
                setProfile(primary);
                setName(primary.name || "");
                setLogoUrl(primary.logo_url || "");
                setIndustry(primary.industry || "");
                setLocation(primary.location || "");
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        } finally {
            setTimeout(() => setIsLoading(false), 800); // Smooth transition
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/upload/logo`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const fullUrl = data.url.startsWith("http") ? data.url : `${BACKEND_URL}${data.url}`;
                setLogoUrl(fullUrl);
                showToast("Logo synchronized.");
            } else {
                showToast("Upload failed.", "error");
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Sync error.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isUpdate = !!profile?.id;
            const url = isUpdate 
                ? `${BACKEND_URL}/api/v1/enterprise/company/${profile.id}`
                : `${BACKEND_URL}/api/v1/enterprise/company/`;
            
            const method = isUpdate ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, logo_url: logoUrl, industry, location })
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                showToast(isUpdate ? "Profile Synchronized" : "Identity Created");
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(errData.detail || "Save failed.", "error");
            }
        } catch (e) {
            console.error("Error saving profile", e);
            showToast("Server error.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = 
        name !== (profile?.name || "") ||
        logoUrl !== (profile?.logo_url || "") ||
        industry !== (profile?.industry || "") ||
        location !== (profile?.location || "");

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center px-10 border-b-4 border-slate-800">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-white/10 rounded-lg animate-pulse" />
                            <div className="w-32 h-3 bg-white/5 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-10">
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 h-96 rounded-[2.5rem] animate-pulse opacity-50 shadow-2xl" />
                        <div className="bg-white h-48 rounded-[2rem] border border-slate-100 animate-pulse" />
                    </div>
                    <div className="col-span-12 lg:col-span-8">
                        <div className="bg-white h-[600px] rounded-[2.5rem] border border-slate-100 animate-pulse shadow-sm" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed top-10 right-10 z-[500] px-6 py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 ${toast.type === "success" ? "bg-slate-900 text-white" : "bg-rose-500 text-white"}`}>
                        <span className="material-symbols-rounded text-lg text-emerald-400">{toast.type === "success" ? "verified" : "error"}</span>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tactical Command Header */}
            <motion.section 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border-b-4 border-slate-800"
            >
                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-inner group">
                        <Building2 className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-emerald-400">Live Identity Node</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none italic uppercase">Organization Profile</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Global Brand & Localization Control Center</p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="px-8 h-14 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-slate-900/50 flex items-center gap-3 group"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        )}
                        Sync Core
                    </button>
                </div>

                {/* Tactical background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-64 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            </motion.section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Tactical Identity HUD */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 space-y-6"
                >
                    <div className="bg-slate-950 rounded-[2.5rem] p-8 text-center space-y-8 relative overflow-hidden shadow-2xl border border-slate-800 group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative z-10">
                            <div className="relative w-44 h-44 mx-auto group/logo">
                                <div className="absolute inset-0 bg-white rounded-[3rem] overflow-hidden flex items-center justify-center p-8 transition-all group-hover/logo:scale-[0.98] shadow-inner-xl">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 className="w-20 h-20 text-slate-100" />
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 w-14 h-14 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-slate-900 hover:text-white transition-all scale-0 group-hover/logo:scale-100"
                                >
                                    <Camera className="w-6 h-6" />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center gap-3 border border-white/10">
                                         <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                         <span className="text-[8px] font-black uppercase tracking-widest text-white">Uploading...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2 leading-none">Legal Entity Signature</p>
                                <h2 className="text-3xl font-black text-white tracking-widest leading-none uppercase truncate">{name || "TECH_CORP_NULL"}</h2>
                            </div>
                            <div className="flex items-center justify-center gap-2 group/loc cursor-default">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] transition-colors group-hover/loc:text-white">{location || "LOC_UNSET"}</span>
                            </div>
                        </div>

                        <div className="relative z-10 pt-4 grid grid-cols-2 gap-3">
                            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-1.5 transition-all hover:bg-white/10">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Secure_Vault</span>
                            </div>
                            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-1.5 transition-all hover:bg-white/10">
                                <Zap className="w-4 h-4 text-indigo-400" />
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">High_Prior</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Operational Readiness</h3>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: "Candidate Portals", status: "Active" },
                                { label: "HR Document Sync", status: "Enabled" },
                                { label: "Brand Propagation", status: "Live" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{item.label}</span>
                                        <span className="text-emerald-500">{item.status}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-full animate-[shimmer_3s_infinite]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Right: Detailed Configuration Node */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-8"
                >
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/20 p-8 lg:p-12 space-y-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                        
                        {/* Section: Core Identity */}
                        <section className="space-y-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-1 bg-[#0F172A] h-8 rounded-full" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Master Profile Settings</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Propagate identity across all sub-nodes</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-slate-900 transition-colors">Legal Organization Name</label>
                                    <input 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-slate-800 font-black focus:bg-white focus:border-slate-900 transition-all outline-none text-sm shadow-inner"
                                        placeholder="E.G. APPXCESS LTD"
                                    />
                                </div>
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-slate-900 transition-colors">Industry Vertical</label>
                                    <input 
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-slate-800 font-black focus:bg-white focus:border-slate-900 transition-all outline-none text-sm shadow-inner"
                                        placeholder="E.G. NEURAL NETWORKS"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section: Geographic Hub */}
                        <section className="space-y-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-1 bg-[#0F172A] h-8 rounded-full" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Primary Locale Configuration</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Timezone and region locking</p>
                                </div>
                            </div>

                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-slate-900 transition-colors">Geographic Headquarters</label>
                                <div className="relative">
                                    <input 
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 pl-14 text-slate-800 font-black focus:bg-white focus:border-slate-900 transition-all outline-none text-sm shadow-inner"
                                        placeholder="E.G. LONDON, UNITED KINGDOM"
                                    />
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        </section>

                        {/* Section: Asset Management */}
                        <section className="space-y-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-1 bg-[#0F172A] h-8 rounded-full" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Master Visual Assets</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Manage high-resolution brand markers</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-slate-900 transition-colors">Master Logo Reference (CDN)</label>
                                    <div className="relative">
                                        <input 
                                            value={logoUrl}
                                            onChange={e => setLogoUrl(e.target.value)}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-6 pr-44 text-slate-700 font-bold focus:bg-white focus:border-slate-900 transition-all outline-none text-xs shadow-inner"
                                            placeholder="HTTPS://CDN.CROAR.AI/ASSETS/LOGO_LIGHT.SVG"
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute right-2 top-2 bottom-2 px-6 bg-slate-950 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all flex items-center gap-2.5 shadow-lg active:scale-95"
                                        >
                                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                                            Upload Marker
                                        </button>
                                    </div>
                                </div>
                                
                                <AnimatePresence>
                                    {logoUrl && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex gap-4">
                                            <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed uppercase tracking-tight">
                                                Visual identity verified. This asset is automatically injected into all candidate touchpoints including email headers, portal login screens, and PDF exports.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
