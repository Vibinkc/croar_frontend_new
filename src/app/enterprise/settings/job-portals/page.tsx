"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
    Globe, 
    Search, 
    Zap, 
    CheckCircle2, 
    ExternalLink, 
    ShieldCheck, 
    Settings2,
    RefreshCw,
    AlertCircle,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    if (view === 'detail' && selectedPortal) {
        return (
            <div className="min-h-screen bg-slate-50/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Detail Header */}
                <div className="bg-white border-b border-slate-100 px-8 py-4 sticky top-0 z-30 shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setView('grid')}
                                className="w-10 h-10 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                            >
                                <AlertCircle className="w-5 h-5 rotate-180" />
                            </button>
                            <div className="h-8 w-px bg-slate-100" />
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                <img src={selectedPortal.logo} alt="" className="w-6 h-6 object-contain" />
                                <span className="text-sm font-black text-slate-900">{selectedPortal.name}</span>
                                <Settings2 className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="px-5 py-2.5 text-slate-500 font-black text-[11px] uppercase tracking-wider hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 rounded-lg transition-all border border-transparent hover:border-[#7C3AED]/10">
                                Settings
                            </button>
                            <button 
                                onClick={() => setShowAddAccount(true)}
                                className="px-6 py-3 bg-[#7C3AED] text-white rounded-lg font-black text-[11px] uppercase tracking-wider shadow-xl shadow-[#7C3AED]/10 hover:bg-[#6D28D9] active:scale-95 transition-all"
                            >
                                Connect {selectedPortal.name}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-header / Status */}
                <div className="bg-white border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Portal Ready for Integration</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto p-8">
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 space-y-8">
                        <div className="space-y-6">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <Info className="w-5 h-5 text-[#7C3AED]" />
                                Configuration Steps
                            </h2>
                            
                            <div className="space-y-6 pl-1 border-l-2 border-slate-50">
                                {[
                                    `Contact your ${selectedPortal.name} Account Manager to initiate the process.`,
                                    "Request for Reference key & API Key.",
                                    `Click on "Connect ${selectedPortal.name}" and provide the details below.`,
                                    "Save the entered information to add your account successfully.",
                                    "Once saved, you can allocate credits to your team for utilization.",
                                    "Embark on your recruitment journey!"
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-[11px] font-black text-[#7C3AED] shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed pt-0.5">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <div className="p-6 bg-[#7C3AED]/5 rounded-xl border border-[#7C3AED]/10 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-[#7C3AED] uppercase tracking-widest mb-1">Secure Integration</h4>
                                    <p className="text-xs font-bold text-[#7C3AED]/70 leading-relaxed">
                                        Your credentials are encrypted and stored securely. We only use these keys to synchronize job data with {selectedPortal.name}.
                                    </p>
                                </div>
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
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                            />
                            <motion.div 
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="bg-white w-full max-w-lg h-full relative z-10 shadow-2xl flex flex-col border-l border-slate-100"
                            >
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Account</h3>
                                    <button onClick={() => setShowAddAccount(false)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all">
                                        <AlertCircle className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Name *</label>
                                        <input type="text" placeholder="Enter username" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name *</label>
                                        <input type="text" placeholder="Portal display name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key *</label>
                                        <input type="password" placeholder="••••••••••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subscription (Annually)</label>
                                        <input type="text" placeholder="Select subscription" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all outline-none" />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available</label>
                                            <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-400">0</div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posted</label>
                                            <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-400">0</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Posting Notification To</label>
                                        <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all outline-none appearance-none">
                                            <option>Default Recruiter</option>
                                        </select>
                                    </div>

                                    <label className="flex items-start gap-3 group cursor-pointer pt-4">
                                        <div className="relative flex items-center mt-0.5">
                                            <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-slate-200 transition-all checked:border-[#7C3AED] checked:bg-[#7C3AED]" />
                                            <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 ml-0.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 select-none group-hover:text-[#7C3AED] transition-colors leading-snug">Create candidate/Pipeline Directly (if applied)</span>
                                    </label>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                                    <button 
                                        onClick={() => setShowAddAccount(false)}
                                        className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-[#7C3AED] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-8 py-3 bg-[#7C3AED] text-white rounded-lg font-black text-[11px] uppercase tracking-[0.15em] shadow-xl shadow-[#7C3AED]/10 hover:bg-[#6D28D9] transition-all flex items-center gap-2"
                                    >
                                        {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
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
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 pt-2 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-xl shadow-slate-200/20">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#7C3AED] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#7C3AED]/10">
                        <Globe className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Job Portal Integrations</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Connect with global talent nodes</p>
                    </div>
                </div>

                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[10px] uppercase tracking-wider shadow-xl shadow-[#7C3AED]/10 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing Portals..." : "Sync Integrations"}
                </button>
            </div>

            {/* Portals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PORTALS.map((portal) => (
                    <motion.div 
                        key={portal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        {portal.connected && (
                            <div className="absolute top-0 right-0 p-4">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Connected</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className={`w-16 h-16 ${portal.bg} rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-sm border border-slate-50 p-2`}>
                                <img src={portal.logo} alt={portal.name} className="w-full h-full object-contain" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{portal.name}</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {portal.description}
                                </p>
                            </div>


                            <div className="pt-6 flex items-center gap-3">
                                <button 
                                    onClick={() => openPortalDetail(portal)}
                                    className={`flex-1 h-12 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${
                                    portal.connected 
                                    ? "bg-slate-50 text-slate-900 border border-slate-100 hover:bg-slate-100" 
                                    : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-[#7C3AED]/10"
                                }`}>
                                    {portal.connected ? "Configure Settings" : "Connect Portal"}
                                </button>
                                <button className="w-12 h-12 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-[#7C3AED] flex items-center justify-center transition-all">
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
