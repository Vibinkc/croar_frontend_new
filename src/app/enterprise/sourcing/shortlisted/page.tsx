"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Bookmark,
    Mail,
    Trash2,
    ExternalLink,
    MapPin,
    Building,
    Briefcase,
    Zap,
    Send,
    ChevronRight,
    ArrowLeft,
    Sparkles,
    Search,
    Filter,
    Plus,
    Clock,
    CheckCircle2,
    Github,
    Linkedin,
    ChevronDown,
    LayoutGrid,
    List,
    Mic,
    MicOff,
    MoreVertical,
    Eye,
    Square,
    CheckSquare,
    X
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api-config";

const PLATFORM_DOMAINS: Record<string, string> = {
    github: "github.com",
    linkedin: "linkedin.com",
    stackoverflow: "stackoverflow.com",
    gitlab: "gitlab.com",
    devto: "dev.to",
    arxiv: "arxiv.org",
    reddit: "reddit.com",
    hackernews: "news.ycombinator.com",
    hashnode: "hashnode.com",
    medium: "medium.com",
    researchgate: "researchgate.net",
    crunchbase: "crunchbase.com",
    dribbble: "dribbble.com",
    levelsfyi: "levels.fyi",
    kaggle: "kaggle.com",
    hackerrank: "hackerrank.com",
    leetcode: "leetcode.com",
    producthunt: "producthunt.com",
    twitter: "twitter.com",
    wellfound: "wellfound.com",
    openstreetmap: "openstreetmap.org",
    behance: "behance.net",
    googlescholar: "scholar.google.com",
    companywebsites: "google.com",
    patentdatabases: "patents.google.com",
    conferencespeakers: "luma.com",
    academicjournals: "scholar.google.com"
};

const PlatformLogoRenderer = ({ platform, className }: { platform: string; className?: string }) => {
    const pLower = (platform || "github").toLowerCase().replace(/[^a-z]/g, '');
    const domain = PLATFORM_DOMAINS[pLower] || `${pLower}.com`;

    if (pLower === "leetcode") {
        return (
            <img
                src="https://th.bing.com/th/id/ODF.upVNUB5XO1Zanzj_gP5PwA?w=32&h=32&qlt=90&pcl=fffffc&o=6&pid=1.2"
                alt="LeetCode"
                className={`${className} object-contain rounded-md`}
            />
        );
    }

    return (
        <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
            alt={platform}
            className={`${className} object-contain rounded-md`}
            onError={(e) => {
                (e.target as HTMLImageElement).src = `https://logo.clearbit.com/${domain}`;
            }}
        />
    );
};

interface ShortlistedProfile {
    shortlist_id: string;
    job_id: string;
    job_title: string;
    profile: any;
    shortlisted_at: string;
    status: string;
    candidate_interest?: any;
    source?: string;
}

export default function ShortlistedTalentPage() {
    const { token } = useAuth();
    const [shortlists, setShortlists] = useState<ShortlistedProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
    const [selectedSource, setSelectedSource] = useState<string>("ALL");
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingCandidate, setMovingCandidate] = useState<ShortlistedProfile | null>(null);
    const [isMoving, setIsMoving] = useState(false);
    const [allJobs, setAllJobs] = useState<{id: string, title: string}[]>([]);

    const fetchShortlists = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShortlists(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch shortlists", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllJobs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/jobs/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllJobs(data.map((j: any) => ({ id: j.id, title: j.title })));
            }
        } catch (e) {
            console.error("Failed to fetch jobs", e);
        }
    };

    useEffect(() => {
        if (token) {
            fetchShortlists();
            fetchAllJobs();
        }
    }, [token]);

    const removeShortlist = async (id: string) => {
        if (!token) return;
        if (!confirm("Remove this candidate from shortlist?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setShortlists(prev => prev.filter(s => s.shortlist_id !== id));
            }
        } catch (e) {
            console.error("Failed to remove shortlist", e);
        }
    };

    const [isSendingJD, setIsSendingJD] = useState<string | null>(null);

    const sendJD = async (profile: any, jobTitle: string, jobId: string) => {
        if (!token) return;

        const candidateEmail = profile.email;
        if (!candidateEmail) {
            alert("No email address found for this candidate. Cannot send JD.");
            return;
        }

        setIsSendingJD(profile.profile_url || profile.full_name);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/send-jd`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: candidateEmail,
                    full_name: profile.full_name,
                    job_title: jobTitle,
                    job_id: jobId,
                    profile_url: profile.profile_url
                })
            });

            if (res.ok) {
                alert(`Successfully sent JD for "${jobTitle}" to ${profile.full_name} (${candidateEmail})`);

                // Update local state to show 'mail_sent' status
                setShortlists(prev => prev.map(item => {
                    if (item.job_id === jobId && item.profile.email === candidateEmail) {
                        return { ...item, status: 'mail_sent' };
                    }
                    return item;
                }));
            } else {
                const error = await res.json();
                alert(`Failed to send JD: ${error.detail || "Unknown error"}`);
            }
        } catch (e) {
            console.error("Failed to send JD", e);
            alert("An error occurred while sending the JD.");
        } finally {
            setIsSendingJD(null);
        }
    };

    const [isListening, setIsListening] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredShortlists.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredShortlists.map(s => s.shortlist_id)));
        }
    };

    const toggleSpeechRecognition = async () => {
        if (isListening) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');

                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/enterprise/audio/transcribe`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.text) {
                            setSearchQuery(data.text);
                        }
                    }
                } catch (error) {
                    console.error("Transcription failed:", error);
                } finally {
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (err) {
            console.error("Microphone access failed:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const filteredShortlists = shortlists.filter(item => {
        if (!item.profile) return false;

        const fullName = (item.profile.full_name || "").toLowerCase();
        const headline = (item.profile.headline || "").toLowerCase();
        const search = searchQuery.toLowerCase();

        // New searchable fields from candidate_interest
        const interest = item.candidate_interest || {};
        const exp = (interest.total_experience || "").toString().toLowerCase();
        const relExp = (interest.relevant_experience || "").toString().toLowerCase();
        const company = (interest.previous_company || "").toLowerCase();
        const skills = (interest.top_skills || "").toLowerCase();
        const preference = (interest.work_preference || "").toLowerCase();

        const matchesSearch = 
            fullName.includes(search) || 
            headline.includes(search) ||
            exp.includes(search) ||
            relExp.includes(search) ||
            company.includes(search) ||
            skills.includes(search) ||
            preference.includes(search);

        const matchesJob = selectedJobId === "ALL" || item.job_id === selectedJobId;
        const matchesSource = selectedSource === "ALL" || (item.source || "AI Sourcing") === selectedSource;

        return matchesSearch && matchesJob && matchesSource;
    });

    console.log("Shortlists:", shortlists.length, "Filtered:", filteredShortlists.length, "Search:", searchQuery);

    const jobOptions = allJobs.length > 0 ? allJobs : Array.from(new Set(shortlists.map(s => JSON.stringify({ id: s.job_id, title: s.job_title }))))
        .map(j => JSON.parse(j));

    const stats = {
        total: shortlists.length,
        github: shortlists.filter(s => s.profile && s.profile.platform === "github").length,
        linkedin: shortlists.filter(s => s.profile && s.profile.platform === "linkedin").length,
        others: shortlists.filter(s => s.profile && s.profile.platform !== "github" && s.profile.platform !== "linkedin").length
    };

    const moveCandidate = async (targetJobId: string, targetJobTitle: string) => {
        if (!movingCandidate || !token) return;
        setIsMoving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${movingCandidate.shortlist_id}/move`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ job_id: targetJobId, job_title: targetJobTitle })
            });
            if (res.ok) {
                alert(`Successfully moved to ${targetJobTitle}`);
                setIsMoveModalOpen(false);
                setMovingCandidate(null);
                fetchShortlists();
            } else {
                alert("Failed to move candidate");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Talent Pipeline</h1>
                    <p className="text-sm font-medium text-slate-400">Manage and coordinate shortlisted candidates across job roles</p>
                </div>
                <Link
                    href="/enterprise/sourcing/chat"
                    className="bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-[#6D28D9] shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Source More Talent
                </Link>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-xl transition-all cursor-default group">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-indigo-400">Total Shortlisted</span>
                        <div className="w-12 h-12 rounded-xl bg-indigo-50/50 text-indigo-500 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-indigo-50">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">{stats.total}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-xl transition-all cursor-default group">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-slate-600">GitHub Profiles</span>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-slate-100">
                            <Github className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">{stats.github}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-xl transition-all cursor-default group">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-blue-500">LinkedIn Profiles</span>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-blue-100">
                            <Linkedin className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">{stats.linkedin}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-xl transition-all cursor-default group">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-amber-500">Other Sources</span>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-amber-100">
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-slate-900 mt-auto leading-none">{stats.others}</div>
                </motion.div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isListening ? "Listening... Speak now" : "Search by candidate name, headline or keywords..."}
                        className={`w-full bg-white border rounded-2xl py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm ${isListening ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-100 focus:border-[#7C3AED]'}`}
                    />
                    <button
                        onClick={toggleSpeechRecognition}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        title={isListening ? "Stop Listening" : "Voice Search"}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>


                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if (!isSelectionMode === false) setSelectedIds(new Set());
                    }}
                    className={`h-11 px-6 rounded-2xl flex items-center gap-2 text-xs font-black transition-all active:scale-95 border ${isSelectionMode
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                        }`}
                >
                    {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    <span>{isSelectionMode ? "Exit Selection" : "Select"}</span>
                </button>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-9 pr-10 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm min-w-[180px]"
                    >
                        <option value="ALL">All Job Roles</option>
                        {jobOptions.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-9 pr-10 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm min-w-[160px]"
                    >
                        <option value="ALL">All Sources</option>
                        <option value="AI Sourcing">AI Sourcing</option>
                        <option value="Job Portal">Job Portal</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredShortlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No candidates found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-8">Try adjusting your filters or search terms to find specific talent.</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Clear All Filters</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {isSelectionMode && (
                                    <th className="px-6 py-4 text-left w-[50px]">
                                        <button
                                            onClick={toggleAll}
                                            className="text-slate-400 hover:text-[#7C3AED] transition-all"
                                        >
                                            {selectedIds.size === filteredShortlists.length && filteredShortlists.length > 0
                                                ? <CheckSquare className="w-5 h-5 text-[#7C3AED]" />
                                                : <Square className="w-5 h-5" />
                                            }
                                        </button>
                                    </th>
                                )}
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Job Role</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Headline / Organization</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                {!isSelectionMode && (
                                    <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredShortlists.map((item, index) => (
                                <tr key={item.shortlist_id} className={`hover:bg-slate-50/30 transition-all group ${selectedIds.has(item.shortlist_id) ? 'bg-indigo-50/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => toggleSelection(item.shortlist_id)}
                                                className="text-slate-300 hover:text-[#7C3AED] transition-all"
                                            >
                                                {selectedIds.has(item.shortlist_id)
                                                    ? <CheckSquare className="w-5 h-5 text-[#7C3AED]" />
                                                    : <Square className="w-5 h-5" />
                                                }
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={item.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profile?.full_name || 'Candidate')}&background=random&color=fff`}
                                                alt={item.profile?.full_name || 'Candidate'}
                                                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profile?.full_name || 'Candidate')}&background=random&color=fff`;
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-[#7C3AED] transition-all">{item.profile?.full_name || 'Candidate'}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.profile?.location || "Remote"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-black text-[#7C3AED] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                            {item.job_title}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{item.profile?.headline || "Senior Professional"}</span>
                                            {item.profile?.company && (
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                                                    <Building className="w-3 h-3 text-slate-300" /> {item.profile.company}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm transition-all group-hover:scale-110">
                                                <PlatformLogoRenderer platform={item.profile?.platform || 'github'} className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.source || 'AI Sourcing'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {item.status === 'applied' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100/50 text-emerald-700 text-[9px] font-black border border-emerald-200/50 uppercase tracking-wider">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Applied for Job
                                            </span>
                                        ) : item.status === 'Interest Expressed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100/50 text-amber-700 text-[9px] font-black border border-amber-200/50 uppercase tracking-wider">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                Interest Expressed
                                            </span>
                                        ) : item.status === 'mail_sent' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100/50 text-indigo-700 text-[9px] font-black border border-indigo-200/50 uppercase tracking-wider">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                Mail Sent
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/50 text-slate-500 text-[9px] font-black border border-slate-200/50 uppercase tracking-wider">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                Mail Not Sent
                                            </span>
                                        )}
                                    </td>
                                    {!isSelectionMode && (
                                        <td className="px-6 py-5 text-right relative">
                                            <div className="flex items-center justify-end relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === item.shortlist_id ? null : item.shortlist_id);
                                                    }}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${activeMenu === item.shortlist_id
                                                        ? 'bg-slate-900 text-white shadow-lg'
                                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {activeMenu === item.shortlist_id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, x: 15 }}
                                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                                        className="absolute right-[45px] top-0 z-[100] min-w-[200px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <a
                                                            href={item.profile?.profile_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-[#7C3AED] rounded-xl transition-all group"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </div>
                                                            View Profile
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                sendJD(item.profile, item.job_title, item.job_id);
                                                                setActiveMenu(null);
                                                            }}
                                                            disabled={isSendingJD === (item.profile.profile_url || item.profile.full_name)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-slate-600 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED] rounded-xl transition-all group disabled:opacity-50"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-[#7C3AED]">
                                                                {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? (
                                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Send className="w-3.5 h-3.5" />
                                                                )}
                                                            </div>
                                                            {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? "Sending..." : "Send JD"}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/engagement/${item.shortlist_id}?source=Direct Link`;
                                                                navigator.clipboard.writeText(link);
                                                                alert("Engagement link copied to clipboard!");
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-50 rounded-xl transition-all group"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                <Bookmark className="w-3.5 h-3.5" />
                                                            </div>
                                                            Copy Share Link
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setMovingCandidate(item);
                                                                setIsMoveModalOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-50 rounded-xl transition-all group"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                <Briefcase className="w-3.5 h-3.5" />
                                                            </div>
                                                            Move to Job
                                                        </button>

                                                        <div className="my-1 border-t border-slate-50" />

                                                        <button
                                                            onClick={() => {
                                                                removeShortlist(item.shortlist_id);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all group"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </div>
                                                            Remove
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {/* Bulk Actions Bar */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]">
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center gap-8 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-black">
                                    {selectedIds.size}
                                </div>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-white text-xs font-black">Candidates Selected</span>
                                    <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">• Ready for Bulk Action</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => {
                                        alert(`Sending JDs to ${selectedIds.size} candidates...`);
                                        // Implementation for bulk JD send
                                    }}
                                    className="h-11 px-6 rounded-2xl bg-[#7C3AED] text-white text-[11px] font-black flex items-center gap-2 hover:bg-[#6D28D9] transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Send className="w-4 h-4" />
                                    Send JD to All
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to remove ${selectedIds.size} candidates?`)) {
                                            selectedIds.forEach(id => removeShortlist(id));
                                            setSelectedIds(new Set());
                                            setIsSelectionMode(false);
                                        }
                                    }}
                                    className="h-11 px-6 rounded-2xl bg-white/10 text-white text-[11px] font-black flex items-center gap-2 hover:bg-rose-500 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Bulk Remove
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedIds(new Set());
                                        setIsSelectionMode(false);
                                    }}
                                    className="h-11 px-4 text-slate-400 hover:text-white text-[11px] font-black transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Move to Job Modal */}
            <AnimatePresence>
                {isMoveModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-black text-slate-900">Move Candidate</h3>
                                    <button onClick={() => setIsMoveModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                <p className="text-sm font-bold text-slate-400">Select the destination job for <span className="text-[#7C3AED]">{movingCandidate?.profile.full_name}</span></p>
                            </div>

                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                <div className="space-y-2">
                                    {jobOptions.map(job => (
                                        <button
                                            key={job.id}
                                            disabled={job.id === movingCandidate?.job_id}
                                            onClick={() => moveCandidate(job.id, job.title)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                                                job.id === movingCandidate?.job_id 
                                                ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                                : 'bg-white border-slate-100 hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                    job.id === movingCandidate?.job_id ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-400 group-hover:bg-[#7C3AED] group-hover:text-white'
                                                }`}>
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{job.title}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Requisition</span>
                                                </div>
                                            </div>
                                            {job.id === movingCandidate?.job_id && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase px-2 py-1 bg-white rounded-lg border border-slate-100">Current</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsMoveModalOpen(false)}
                                    className="px-6 py-3 text-xs font-black text-slate-500 hover:bg-white rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
