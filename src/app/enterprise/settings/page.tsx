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
    Shield,
    RefreshCcw,
    Activity
} from "lucide-react";

interface CompanyProfile {
    id: string;
    name: string;
    logo_url?: string;
    industry?: string;
    location?: string;
}

export default function OrganizationProfilePage() {
    const { token, canAccess } = useAuth();
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
            setTimeout(() => setIsLoading(false), 600);
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
                showToast("Logo updated successfully.");
            } else {
                showToast("Upload failed.", "error");
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Connection error.", "error");
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
                showToast(isUpdate ? "Profile successfully updated" : "Organization profile created");
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
            <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="h-32 bg-slate-900 rounded-xl relative overflow-hidden flex items-center px-10 shadow-xl shadow-indigo-100/50">
                    <div className="flex items-center gap-6 text-white/20">
                        <div className="w-16 h-16 bg-white/10 rounded-xl animate-pulse" />
                        <div className="space-y-3">
                            <div className="w-64 h-8 bg-white/10 rounded-xl animate-pulse" />
                            <div className="w-40 h-4 bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4 h-96 bg-white rounded-xl border border-slate-100 animate-pulse" />
                    <div className="md:col-span-8 h-96 bg-white rounded-xl border border-slate-100 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pt-2 animate-in fade-in duration-700">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className={`fixed bottom-10 right-10 z-[500] px-6 py-4 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-3 border border-slate-100 backdrop-blur-md ${toast.type === "success" ? "bg-white text-slate-900" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-100 text-rose-500"}`}>
                            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">business</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Organization Profile</h1>
                        <p className="text-slate-500 text-[10px] font-medium   ">Manage your global brand presence</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canAccess("organization:moderate") && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px]   flex items-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <RefreshCcw className="w-3 h-3 animate-spin" />
                            ) : (
                                <Save className="w-3 h-3" />
                            )}
                            Update Profile
                        </button>
                    )}
                    
                    <button 
                        onClick={fetchProfile}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Brand Preview */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 space-y-6"
                >
                    <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="text-center space-y-8">
                            <div className="relative w-40 h-40 mx-auto group/logo">
                                <div className="absolute inset-0 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center p-8 shadow-inner transition-transform group-hover/logo:scale-95">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 className="w-16 h-16 text-slate-200" />
                                    )}
                                </div>
                                {canAccess("organization:moderate") && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-all scale-0 group-hover/logo:scale-100"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2">
                                         <RefreshCcw className="w-6 h-6 text-indigo-600 animate-spin" />
                                         <span className="text-[10px] font-bold text-slate-500 ">Updating</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-indigo-600  ">{industry || "Brand Identity"}</p>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight  truncate">{name || "Your Company"}</h2>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">{location || "Location not set"}</span>
                                </div>
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1.5">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-500">Verified</span>
                                </div>
                                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1.5">
                                    <Zap className="w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-bold text-slate-500">Premium</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-900  ">Health Status</h3>
                            <Activity className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="space-y-5">
                            {[
                                { label: "Candidate Portals", status: "Optimal" },
                                { label: "Brand Propagation", status: "Syncing" }
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold ">
                                        <span className="text-slate-500">{item.label}</span>
                                        <span className="text-indigo-600">{item.status}</span>
                                    </div>
                                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-full animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Configuration */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-8"
                >
                    <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-8 lg:p-12 space-y-12">
                        {/* Section: Basic Information */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-lg font-bold text-slate-900">Basic Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Company Name</label>
                                    <input 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        readOnly={!canAccess("organization:moderate")}
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                        placeholder="Enter your legal company name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Industry</label>
                                    <input 
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        readOnly={!canAccess("organization:moderate")}
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-900 font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                        placeholder="e.g. Technology, Healthcare"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">Location / Headquarters</label>
                                <div className="relative">
                                    <input 
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        readOnly={!canAccess("organization:moderate")}
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-12 text-slate-900 font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                        placeholder="e.g. London, United Kingdom"
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </section>

                        {/* Section: Brand Assets */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-lg font-bold text-slate-900">Brand Assets</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Logo URL</label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <input 
                                                value={logoUrl}
                                                onChange={e => setLogoUrl(e.target.value)}
                                                readOnly={!canAccess("organization:moderate")}
                                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-slate-700 font-medium focus:bg-white focus:border-indigo-600 transition-all outline-none text-sm"
                                                placeholder="https://your-domain.com/logo.png"
                                            />
                                        </div>
                                        {canAccess("organization:moderate") && (
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-12 px-6 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Upload
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl flex gap-4">
                                    <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-indigo-900/70 leading-relaxed font-medium">
                                        Your logo will be used across all candidate-facing materials, including job boards, email templates, and career portals.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
