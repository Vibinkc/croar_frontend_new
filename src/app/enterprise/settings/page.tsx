"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { PageHelp } from "@/components/ds";
import {
    Building2, 
    Upload, 
    MapPin, 
    CheckCircle2, 
    AlertCircle,
    Save,
    Camera,
    Trash2,
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
            <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Header skeleton — mirrors the real sticky header so nothing shifts on load */}
                <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="w-44 h-6 bg-[#E8EAED] rounded-[8px] animate-pulse" />
                        <div className="w-60 h-4 bg-[#E8EAED] rounded-[6px] animate-pulse" />
                    </div>
                    <div className="w-9 h-9 bg-[#E8EAED] rounded-[10px] animate-pulse" />
                </header>

                {/* Centered, branded spinner so users clearly see it's working */}
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative w-12 h-12">
                        <span className="absolute inset-0 rounded-full border-[3px] border-[#E8EAED]" />
                        <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#5B53E0] animate-spin" />
                    </div>
                    <p className="text-[12.5px] font-semibold text-[#8A929E]">Loading settings…</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 bg-white rounded-[14px] border border-[#E8EAED] animate-pulse shadow-sm" />
                        ))}
                    </div>
                    <div className="md:col-span-8 h-96 bg-white rounded-[14px] border border-[#E8EAED] animate-pulse shadow-sm" />
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
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

            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Organization Profile</h1>
                        <PageHelp title="Settings">
                            <p>Your organisation&apos;s profile and company-wide settings.</p>
                            <p>Set up company details here. Manage who can access Croar in <strong>Team</strong> and <strong>Permissions</strong>.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage your global brand presence</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {canAccess("organization:update") && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-all disabled:opacity-40"
                        >
                            {isSaving ? (
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            Update Profile
                        </button>
                    )}
                    
                    <button 
                        onClick={fetchProfile}
                        className="w-9 h-9 rounded-[10px] hover:bg-[#E8EAED] flex items-center justify-center text-[#6B6F76] transition-colors border border-transparent hover:border-[#E8EAED]"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Unified Settings Card */}
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-[#E8EAED] rounded-[14px] p-6 sm:p-8 shadow-sm"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Brand Preview & Health */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="text-center space-y-5">
                            {/* Logo */}
                            <div className="relative w-32 h-32 mx-auto group/logo">
                                <div className="absolute inset-0 bg-[#F4F5F7]/50 rounded-[12px] border border-[#E8EAED] overflow-hidden flex items-center justify-center p-5 shadow-inner transition-transform group-hover/logo:scale-95">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-[#9AA3AF]" />
                                    )}
                                </div>
                                {canAccess("organization:update") && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        title={logoUrl ? "Replace logo" : "Upload logo"}
                                        className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#15171C] text-white rounded-[8px] flex items-center justify-center shadow-lg hover:bg-[#5B53E0] transition-all scale-0 group-hover/logo:scale-100"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                                {canAccess("organization:update") && logoUrl && (
                                    <button
                                        onClick={() => setLogoUrl("")}
                                        title="Remove logo"
                                        className="absolute -top-1 -right-1 w-8 h-8 bg-white border border-[#F7D7D7] text-[#C0383C] rounded-[8px] flex items-center justify-center shadow-lg hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all scale-0 group-hover/logo:scale-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/85 backdrop-blur-sm rounded-[12px] flex flex-col items-center justify-center gap-1.5">
                                         <RefreshCcw className="w-5 h-5 text-[#5B53E0] animate-spin" />
                                         <span className="text-[9.5px] font-bold text-[#8A929E]">Updating</span>
                                    </div>
                                )}
                            </div>

                            {/* Name & Location */}
                            <div className="space-y-2">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-[#5B53E0] uppercase tracking-wider">{industry || "Brand Identity"}</p>
                                    <h2 className="text-lg font-extrabold text-[#15171C] tracking-[-0.3px] leading-tight truncate">{name || "Your Company"}</h2>
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-[#8A929E]">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-[12.5px] font-semibold">{location || "Location not set"}</span>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <div className="px-2.5 py-2 bg-[#F4F5F7]/50 rounded-[8px] border border-[#E8EAED]/60 flex flex-col items-center gap-1">
                                    <Shield className="w-3.5 h-3.5 text-[#15803D]" />
                                    <span className="text-[9.5px] font-bold text-[#8A929E]">Verified</span>
                                </div>
                                <div className="px-2.5 py-2 bg-[#F4F5F7]/50 rounded-[8px] border border-[#E8EAED]/60 flex flex-col items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-[#5B53E0]" />
                                    <span className="text-[9.5px] font-bold text-[#8A929E]">Premium</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-[#E8EAED]" />

                        {/* Health Status */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[12px] font-bold text-[#15171C]">Health Status</h3>
                                <Activity className="w-3.5 h-3.5 text-[#5B53E0]" />
                            </div>
                            <div className="space-y-3.5">
                                {[
                                    { label: "Candidate Portals", status: "Optimal" },
                                    { label: "Brand Propagation", status: "Syncing" }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-[#8A929E]">{item.label}</span>
                                            <span className="text-[#5B53E0]">{item.status}</span>
                                        </div>
                                        <div className="h-1 bg-[#F1F2F5] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#5B53E0] w-full animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle Divider (LG Screens) */}
                    <div className="hidden lg:flex lg:col-span-1 self-stretch justify-center">
                        <div className="w-px h-full bg-[#E8EAED]" />
                    </div>

                    {/* Right Column: Configuration Form */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Section: Basic Information */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1 h-4 bg-[#5B53E0] rounded-full" />
                                <h3 className="text-[15px] font-bold text-[#15171C]">Basic Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="company-name" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Company Name</label>
                                    <input
                                        id="company-name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        readOnly={!canAccess("organization:update")}
                                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                        placeholder="Enter your legal company name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="company-industry" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Industry</label>
                                    <input
                                        id="company-industry"
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        readOnly={!canAccess("organization:update")}
                                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                        placeholder="e.g. Technology, Healthcare"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="company-location" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Location / Headquarters</label>
                                <div className="relative">
                                    <input
                                        id="company-location"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        readOnly={!canAccess("organization:update")}
                                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                        placeholder="e.g. London, United Kingdom"
                                    />
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-[#E8EAED]" />

                        {/* Section: Brand Assets */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1 h-4 bg-[#5B53E0] rounded-full" />
                                <h3 className="text-[15px] font-bold text-[#15171C]">Brand Assets</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="company-logo-url" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Logo URL</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                id="company-logo-url"
                                                value={logoUrl}
                                                onChange={e => setLogoUrl(e.target.value)}
                                                readOnly={!canAccess("organization:update")}
                                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[13.5px] text-[#374151] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                placeholder="https://your-domain.com/logo.png"
                                            />
                                        </div>
                                        {canAccess("organization:update") && (
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] bg-[#15171C] text-white text-[13px] font-semibold hover:bg-[#252830] transition-all whitespace-nowrap shadow-sm"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                Upload
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-[#ECEBFB]/50 border border-[#DAD7F6] rounded-[10px] flex gap-3">
                                    <Shield className="w-4 h-4 text-[#5B53E0] shrink-0 mt-0.5" />
                                    <p className="text-[13px] text-[#5B53E0] leading-relaxed font-semibold">
                                        Your logo will be used across all candidate-facing materials, including job boards, email templates, and career portals.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
