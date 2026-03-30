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
    Zap
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

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/company/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Assumes the first company in the managed list is the primary one for this agent
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
            setIsLoading(false);
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
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const fullUrl = data.url.startsWith("http") ? data.url : `${BACKEND_URL}${data.url}`;
                setLogoUrl(fullUrl);
            } else {
                alert("Upload failed. please try again.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("An error occurred during upload.");
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
                body: JSON.stringify({
                    name,
                    logo_url: logoUrl,
                    industry,
                    location
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setName(data.name || "");
                setLogoUrl(data.logo_url || "");
                setIndustry(data.industry || "");
                setLocation(data.location || "");
                alert(isUpdate ? "Organization profile updated successfully!" : "Organization profile created successfully!");
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to ${isUpdate ? 'update' : 'create'} profile: ${errData.detail || 'Unknown error'}`);
            }
        } catch (e) {
            console.error("Error saving profile", e);
            alert("Error saving profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header with Glass Effect */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white/40 backdrop-blur-md border border-white/60 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
            >
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">ORGANIZATION PROFILE</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-none">Identity Control Center</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-4 bg-[#0F172A] hover:bg-[#1E293B] text-white font-black rounded-2xl shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                        {isSaving ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isSaving ? "SAVING CHANGES..." : "SYNC BRANDING"}
                    </button>
                </div>

                {/* Decorative background shape */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Identity Preview Card */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 space-y-8"
                >
                    <div className="bg-[#0F172A] rounded-[3rem] p-10 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-indigo-900/20 group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10">
                            <div className="relative w-40 h-40 mx-auto group/logo">
                                <div className="absolute inset-0 bg-white shadow-inner rounded-[2.5rem] overflow-hidden flex items-center justify-center p-6 border-4 border-slate-800 transition-all group-hover/logo:scale-[1.02] group-hover/logo:border-indigo-500">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 className="w-16 h-16 text-slate-200" />
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all scale-0 group-hover/logo:scale-100"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleLogoUpload}
                                    accept="image/*"
                                />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center">
                                         <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 space-y-3">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] leading-none">Consolidated Entity</p>
                            <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">{name || "AppXcess"}</h2>
                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-bold">{location || "Not Set"}</span>
                            </div>
                        </div>

                        <div className="relative z-10 pt-6 flex justify-center gap-3">
                            <div className="px-5 cy-2.5 bg-slate-800/50 rounded-xl border border-white/5 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sync</span>
                            </div>
                            <div className="px-5 cy-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Premium</span>
                            </div>
                        </div>
                    </div>

                    {/* Small Utility Card */}
                    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-indigo-600" />
                            </div>
                            <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest leading-none">Touchpoint Audit</p>
                        </div>
                        <ul className="space-y-4">
                            {[
                                { label: "Branded Portals", status: "Active" },
                                { label: "Candidate Emails", status: "Enabled" },
                                { label: "Job Descriptions", status: "Live" }
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">{item.label}</span>
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">{item.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                {/* Right: Detailed Configuration */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-8"
                >
                    <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/20 p-12 space-y-12">
                        {/* Section 1: Core Meta */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight italic uppercase">Core Identity</h3>
                                    <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                                </div>
                                <Globe className="w-6 h-6 text-slate-300" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Legal Entity Name</label>
                                    <input 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none"
                                        placeholder="Enter company name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Industry Vertical</label>
                                    <input 
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none"
                                        placeholder="e.g. Fintech, Creative Agency"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Localization */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight italic uppercase">Primary Locale</h3>
                                    <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                                </div>
                                <MapPin className="w-6 h-6 text-slate-300" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Geographic Headquarters</label>
                                <input 
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none"
                                    placeholder="e.g. London, United Kingdom"
                                />
                            </div>
                        </section>

                        {/* Section 3: Branding Assets */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight italic uppercase">Visual Assets</h3>
                                    <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                                </div>
                                <Camera className="w-6 h-6 text-slate-300" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Master Logo CDN Link</label>
                                    <div className="relative">
                                        <input 
                                            value={logoUrl}
                                            onChange={e => setLogoUrl(e.target.value)}
                                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-40 text-slate-600 font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none text-sm"
                                            placeholder="https://cdn.example.com/logo.png"
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 active:scale-95"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            Upload File
                                        </button>
                                    </div>
                                </div>
                                
                                <AnimatePresence>
                                    {logoUrl && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl border-dashed"
                                        >
                                            <AlertCircle className="w-5 h-5 text-indigo-500 mt-0.5" />
                                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                                This URL is served globally to all candidates. Ensure the image is hosted on a secure (HTTPS) connection and has a transparent background for best results.
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
