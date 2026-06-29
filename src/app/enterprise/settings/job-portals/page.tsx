"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    Globe,
    Zap,
    CheckCircle2,
    ExternalLink,
    ShieldCheck,
    Settings2,
    RefreshCw,
    ArrowLeft,
    X,
    Info,
    Plus,
    Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jetbrainsMono, PageHelp } from "@/components/ds";

const PORTALS = [
    {
        id: "google-talent",
        name: "Google Jobs",
        description: "Direct indexing on Google Search Results globally.",
        status: "Free Indexing",
        connected: false,
        logo: "https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png",
        color: "text-blue-500",
        bg: "bg-white",
        features: ["Global Reach", "Auto-indexing", "Direct Apply"]
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        description: "Post jobs as Limited Listings for free organic reach.",
        status: "Free (Limited)",
        connected: false,
        logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
        color: "text-indigo-500",
        bg: "bg-white",
        features: ["Company Page Sync", "Organic Search", "Brand Presence"]
    }
];

export default function JobPortalsPage() {
    const { token } = useAuth();
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [selectedPortal, setSelectedPortal] = useState<any>(null);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 1500);
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setShowAddAccount(false);
            alert("Account added successfully!");
        }, 1500);
    };

    const openPortalDetail = (portal: any) => {
        setSelectedPortal(portal);
        setView('detail');
    };

    const connectedCount = PORTALS.filter((p) => p.connected).length;

    const statCards = [
        {
            label: "Available Portals",
            value: PORTALS.length,
            Icon: Globe,
            grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)",
            glow: "rgba(91,83,224,0.3)",
        },
        {
            label: "Connected",
            value: connectedCount,
            Icon: CheckCircle2,
            grad: "linear-gradient(135deg,#34D399,#0E8A6E)",
            glow: "rgba(14,138,110,0.3)",
        },
        {
            label: "Live Listings",
            value: 0,
            Icon: Zap,
            grad: "linear-gradient(135deg,#60A5FA,#3559C7)",
            glow: "rgba(53,89,199,0.3)",
        },
        {
            label: "Pending Sync",
            value: PORTALS.length - connectedCount,
            Icon: RefreshCw,
            grad: "linear-gradient(135deg,#FBBF24,#D97706)",
            glow: "rgba(217,119,6,0.3)",
        },
    ];

    if (view === 'detail' && selectedPortal) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Detail Header (sticky) */}
                <header className="sticky top-0 z-20 pt-4 sm:pt-5 md:pt-6 pb-4 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={() => setView('grid')}
                            className="w-10 h-10 rounded-[10px] border border-[#E1E4E8] bg-white flex items-center justify-center text-[#6B6F76] hover:text-[#15171C] hover:bg-[#F4F5F7] transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-11 h-11 rounded-[12px] bg-white border border-[#E8EAED] flex items-center justify-center p-2 shrink-0">
                                <img src={selectedPortal.logo} alt="" className="w-full h-full object-contain" />
                            </span>
                            <div className="min-w-0">
                                <h1 className="text-[20px] md:text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight truncate">{selectedPortal.name}</h1>
                                <p className="text-[13px] text-[#8A929E] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready for integration
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13.5px] font-semibold hover:bg-[#F4F5F7] transition-colors">
                            <Settings2 className="w-4 h-4 text-[#8A929E]" /> Settings
                        </button>
                        <button
                            onClick={() => setShowAddAccount(true)}
                            className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors"
                        >
                            <Link2 className="w-4 h-4" /> Connect {selectedPortal.name}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Configuration steps */}
                    <div className="lg:col-span-2 bg-white rounded-[16px] border border-[#E8EAED] p-7 md:p-9">
                        <div className="flex items-center gap-3 mb-7">
                            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 6px 14px rgba(91,83,224,0.3)" }}>
                                <Info className="w-[18px] h-[18px]" />
                            </span>
                            <div>
                                <h2 className="text-[17px] font-extrabold text-[#15171C] tracking-[-0.3px]">Configuration Steps</h2>
                                <p className="text-[13px] text-[#8A929E]">Follow these steps to connect {selectedPortal.name}</p>
                            </div>
                        </div>

                        <div className="space-y-5 pl-1 border-l-2 border-[#F0F0F1] ml-3">
                            {[
                                `Contact your ${selectedPortal.name} Account Manager to initiate the process.`,
                                "Request for Reference key & API Key.",
                                `Click on "Connect ${selectedPortal.name}" and provide the details below.`,
                                "Save the entered information to add your account successfully.",
                                "Once saved, you can allocate credits to your team for utilization.",
                                "Embark on your recruitment journey!"
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 items-start group -ml-[15px]">
                                    <div className={`w-7 h-7 rounded-full bg-[#ECEBFB] border border-[#DAD7F6] flex items-center justify-center text-[12px] font-bold text-[#5B53E0] shrink-0 group-hover:bg-[#5B53E0] group-hover:text-white group-hover:border-[#5B53E0] transition-colors ${jetbrainsMono.className}`}>
                                        {i + 1}
                                    </div>
                                    <p className="text-[14px] font-medium text-[#374151] leading-relaxed pt-0.5">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Side: secure + features */}
                    <div className="space-y-6">
                        <div className="rounded-[16px] p-7 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1B1D24,#0E1014)" }}>
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle,rgba(91,83,224,0.45),transparent 70%)" }} />
                            <div className="relative">
                                <span className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 8px 20px rgba(91,83,224,0.4)" }}>
                                    <ShieldCheck className="w-5 h-5" />
                                </span>
                                <h4 className="text-[15px] font-extrabold mb-2">Secure Integration</h4>
                                <p className="text-[13px] text-white/65 leading-relaxed">
                                    Your credentials are encrypted and stored securely. We only use these keys to synchronize job data with {selectedPortal.name}.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[16px] border border-[#E8EAED] p-7">
                            <h4 className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.08em] mb-4">What you get</h4>
                            <div className="space-y-3">
                                {selectedPortal.features.map((f: string) => (
                                    <div key={f} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-[18px] h-[18px] text-[#0E8A6E] shrink-0" />
                                        <span className="text-[14px] font-medium text-[#374151]">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Account Drawer/Modal */}
                <AnimatePresence>
                    {showAddAccount && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-end">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowAddAccount(false)}
                                className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-[2px]"
                            />
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="bg-white w-full max-w-lg h-full relative z-10 shadow-2xl flex flex-col border-l border-[#E8EAED]"
                            >
                                <div className="px-7 py-6 border-b border-[#E8EAED] flex items-center justify-between bg-[#F7F8FA]/60">
                                    <div className="flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 6px 14px rgba(91,83,224,0.3)" }}>
                                            <Plus className="w-[18px] h-[18px]" />
                                        </span>
                                        <h3 className="text-[18px] font-extrabold text-[#15171C] tracking-[-0.3px]">Add Account</h3>
                                    </div>
                                    <button onClick={() => setShowAddAccount(false)} className="w-9 h-9 rounded-full hover:bg-[#E8EAED] flex items-center justify-center text-[#9AA3AF] hover:text-[#4B5563] transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                                    <div className="space-y-1.5">
                                        <label htmlFor="jp-username" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">User Name *</label>
                                        <input id="jp-username" type="text" placeholder="Enter username" className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="jp-display-name" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">Display Name *</label>
                                        <input id="jp-display-name" type="text" placeholder="Portal display name" className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="jp-api-key" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">API Key *</label>
                                        <input id="jp-api-key" type="password" placeholder="••••••••••••••••" className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="jp-subscription" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">Subscription (Annually)</label>
                                        <input id="jp-subscription" type="text" placeholder="Select subscription" className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="jp-available" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">Available</label>
                                            <div id="jp-available" className={`w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-semibold text-[#9AA3AF] ${jetbrainsMono.className}`}>0</div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="jp-posted" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">Posted</label>
                                            <div id="jp-posted" className={`w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-semibold text-[#9AA3AF] ${jetbrainsMono.className}`}>0</div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="jp-notification-to" className="text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em] ml-0.5">Job Posting Notification To</label>
                                        <select id="jp-notification-to" className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E8EAED] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] focus:bg-white transition-all outline-none appearance-none">
                                            <option>Default Recruiter</option>
                                        </select>
                                    </div>

                                    <label className="flex items-start gap-3 group cursor-pointer pt-2">
                                        <div className="relative flex items-center mt-0.5">
                                            <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border-2 border-[#D4D7DC] transition-all checked:border-[#5B53E0] checked:bg-[#5B53E0]" />
                                            <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 ml-0.5" />
                                        </div>
                                        <span className="text-[13px] font-medium text-[#4B5563] select-none group-hover:text-[#5B53E0] transition-colors leading-snug">Create candidate/Pipeline Directly (if applied)</span>
                                    </label>
                                </div>

                                <div className="px-7 py-5 bg-[#F7F8FA]/60 border-t border-[#E8EAED] flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setShowAddAccount(false)}
                                        className="px-5 h-11 rounded-[10px] text-[#6B6F76] font-semibold text-[13.5px] hover:text-[#15171C] hover:bg-[#E8EAED]/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-2 px-6 h-11 bg-[#5B53E0] text-white rounded-[10px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] hover:bg-[#4A43C9] transition-colors disabled:opacity-60"
                                    >
                                        {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                                        Save Account
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 pt-4 sm:pt-5 md:pt-6 pb-4 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.6px] text-[#15171C] leading-tight">Job Portals</h1>
                        <PageHelp title="Job Portals">
                            <p>Connect job boards so you can publish your jobs to them.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[14px] text-[#8A929E] mt-1">Connect &amp; sync your listings with global talent platforms</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-60 self-start sm:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing Portals..." : "Sync Integrations"}
                </button>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((s) => (
                    <div
                        key={s.label}
                        className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[28px] font-semibold tracking-[-1px] text-[#15171C] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Portals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {PORTALS.map((portal, idx) => (
                    <motion.div
                        key={portal.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-[16px] border border-[#E8EAED] p-7 hover:shadow-[0_12px_32px_rgba(15,16,20,0.08)] hover:border-[#DAD7F6] transition-all group relative overflow-hidden"
                    >
                        {portal.connected ? (
                            <div className="absolute top-5 right-5">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E3F4EF] text-[#0E8A6E] rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Connected</span>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute top-5 right-5">
                                <span className="px-2.5 py-1 bg-[#F4F5F7] text-[#8A929E] rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#E8EAED]">{portal.status}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="w-16 h-16 bg-white rounded-[14px] flex items-center justify-center transition-transform group-hover:scale-105 duration-500 border border-[#E8EAED] shadow-sm p-2.5">
                                <img src={portal.logo} alt={portal.name} className="w-full h-full object-contain" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-[18px] font-extrabold text-[#15171C] tracking-[-0.3px]">{portal.name}</h3>
                                <p className="text-[13.5px] text-[#6B6F76] font-medium leading-relaxed">
                                    {portal.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {portal.features.map((f) => (
                                    <span key={f} className="px-2.5 py-1 bg-[#ECEBFB]/60 text-[#5B53E0] rounded-full text-[11px] font-semibold">
                                        {f}
                                    </span>
                                ))}
                            </div>

                            <div className="pt-3 flex items-center gap-3">
                                <button
                                    onClick={() => openPortalDetail(portal)}
                                    className={`flex-1 h-11 rounded-[10px] font-semibold text-[13.5px] transition-colors ${
                                        portal.connected
                                            ? "bg-[#F4F5F7] text-[#15171C] border border-[#E8EAED] hover:bg-[#ECEBFB]/60"
                                            : "bg-[#5B53E0] text-white hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.24)]"
                                    }`}>
                                    {portal.connected ? "Configure Settings" : "Connect Portal"}
                                </button>
                                <button className="w-11 h-11 bg-white border border-[#E8EAED] rounded-[10px] text-[#9AA3AF] hover:text-[#5B53E0] hover:border-[#DAD7F6] flex items-center justify-center transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
