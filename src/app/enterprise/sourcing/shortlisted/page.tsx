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
import { jetbrainsMono } from "@/components/ds";

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
    const pLower = (platform || "github").toLowerCase().replaceAll(/[^a-z]/g, '');
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
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Talent Pipeline</h1>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage &amp; coordinate shortlisted candidates across job roles</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                        href="/enterprise/sourcing/chat"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Source Talent
                    </Link>
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: "Total Shortlisted", value: stats.total, Icon: Users, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.3)" },
                    { label: "GitHub Profiles", value: stats.github, Icon: Github, grad: "linear-gradient(135deg,#3A3D45,#15171C)", glow: "rgba(21,23,28,0.25)" },
                    { label: "LinkedIn Profiles", value: stats.linkedin, Icon: Linkedin, grad: "linear-gradient(135deg,#60A5FA,#3559C7)", glow: "rgba(53,89,199,0.3)" },
                    { label: "Other Sources", value: stats.others, Icon: Sparkles, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.3)" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative bg-white border border-[#E8EAED] hover:border-[#D4D7DC] rounded-[14px] p-5 overflow-hidden transition-all duration-300 hover:shadow-sm"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[30px] font-semibold tracking-[-1px] text-[#15171C] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isListening ? "Listening... Speak now" : "Search by candidate name, headline or keywords..."}
                        className={`w-full h-11 bg-white border rounded-[12px] pl-11 pr-11 text-sm font-semibold text-[#1F2127] placeholder:text-[#9AA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 transition-all shadow-sm ${
                            isListening ? 'border-red-300 ring-2 ring-red-200' : 'border-[#E1E4E8] focus:border-[#5B53E0]'
                        }`}
                    />
                    <button
                        onClick={toggleSpeechRecognition}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-[#9AA3AF] hover:bg-[#F4F5F7] hover:text-[#4B5563]'}`}
                        title={isListening ? "Stop Listening" : "Voice Search"}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>

                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if (isSelectionMode) setSelectedIds(new Set());
                    }}
                    className={`h-11 px-4 rounded-[12px] flex items-center gap-2 text-[13px] font-semibold transition-all active:scale-95 border ${
                        isSelectionMode
                            ? 'bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6] shadow-sm'
                            : 'bg-white border-[#E1E4E8] text-[#4B5563] hover:border-[#DAD7F6] hover:bg-[#F7F8FA] shadow-sm'
                    }`}
                >
                    {isSelectionMode ? <CheckSquare className="w-4 h-4 text-[#5B53E0]" /> : <Square className="w-4 h-4" />}
                    <span>{isSelectionMode ? "Exit Selection" : "Select"}</span>
                </button>

                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]">
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="bg-white border border-[#E1E4E8] rounded-[12px] h-11 pl-9 pr-9 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] hover:bg-[#F7F8FA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm min-w-[180px]"
                    >
                        <option value="ALL">All Job Roles</option>
                        {jobOptions.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF]">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="bg-white border border-[#E1E4E8] rounded-[12px] h-11 pl-9 pr-9 text-[13.5px] font-semibold text-[#374151] hover:border-[#DAD7F6] hover:bg-[#F7F8FA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm min-w-[160px]"
                    >
                        <option value="ALL">All Sources</option>
                        <option value="AI Sourcing">AI Sourcing</option>
                        <option value="Job Portal">Job Portal</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F7F8FA] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredShortlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="relative mb-6">
                            <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/12 blur-2xl" />
                            <div className="relative w-16 h-16 rounded-[18px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 12px 30px rgba(91,83,224,0.4)" }}>
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#15171C] mb-1.5">No candidates found</h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-6">Try adjusting your filters or search terms to find specific talent.</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); }} className="px-6 h-11 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-all">Clear All Filters</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                {isSelectionMode && (
                                    <th className="px-6 py-3.5 text-left w-[50px]">
                                        <button
                                            onClick={toggleAll}
                                            className="text-[#9AA3AF] hover:text-[#5B53E0] transition-all"
                                        >
                                            {selectedIds.size === filteredShortlists.length && filteredShortlists.length > 0
                                                ? <CheckSquare className="w-5 h-5 text-[#5B53E0]" />
                                                : <Square className="w-5 h-5" />
                                            }
                                        </button>
                                    </th>
                                )}
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Candidate</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Job Role</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Headline / Organization</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Source</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Status</th>
                                {!isSelectionMode && (
                                    <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F1]">
                            {filteredShortlists.map((item, index) => (
                                <tr key={item.shortlist_id} className={`hover:bg-[#F7F8FA]/60 transition-colors group ${selectedIds.has(item.shortlist_id) ? 'bg-[#ECEBFB]/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleSelection(item.shortlist_id)}
                                                className="text-[#C4C9D0] hover:text-[#5B53E0] transition-all"
                                            >
                                                {selectedIds.has(item.shortlist_id)
                                                    ? <CheckSquare className="w-5 h-5 text-[#5B53E0]" />
                                                    : <Square className="w-5 h-5" />
                                                }
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3.5">
                                            <img
                                                src={item.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profile?.full_name || 'Candidate')}&background=random&color=fff`}
                                                alt={item.profile?.full_name || 'Candidate'}
                                                className="w-10 h-10 rounded-[10px] object-cover shadow-sm border border-white"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profile?.full_name || 'Candidate')}&background=random&color=fff`;
                                                }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-semibold text-[#15171C] group-hover:text-[#5B53E0] transition-all truncate">{item.profile?.full_name || 'Candidate'}</span>
                                                <span className="text-[12px] text-[#9AA3AF] mt-0.5 font-medium truncate">{item.profile?.location || "Remote"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#ECEBFB]/70 text-[#5B53E0] text-[11.5px] font-semibold border border-[#DAD7F6]/80 shadow-sm">
                                            {item.job_title}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[13px] font-semibold text-[#374151] truncate max-w-[220px]">{item.profile?.headline || "Senior Professional"}</span>
                                            {item.profile?.company && (
                                                <span className="text-[11px] font-bold text-[#9AA3AF] flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                                                    <Building className="w-3.5 h-3.5 text-[#C4C9D0]" /> {item.profile.company}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-[8px] bg-[#F7F8FA] flex items-center justify-center border border-[#E8EAED]">
                                                <PlatformLogoRenderer platform={item.profile?.platform || 'github'} className="w-4 h-4" />
                                            </div>
                                            <span className="text-[11.5px] font-semibold text-[#4B5563] tracking-normal">{item.source || 'AI Sourcing'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === 'applied' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#E3F4EF]/80 text-[#0E8A6E] text-[11px] font-bold border border-[#BFF0E2]/60 uppercase tracking-wider shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0E8A6E]" />
                                                Applied for Job
                                            </span>
                                        ) : item.status === 'Interest Expressed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#FEF3E2]/80 text-[#D97706] text-[11px] font-bold border border-[#FCE1BF]/60 uppercase tracking-wider shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                                Interest Expressed
                                            </span>
                                        ) : item.status === 'mail_sent' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#ECEBFB]/80 text-[#5B53E0] text-[11px] font-bold border border-[#DAD7F6]/60 uppercase tracking-wider shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#5B53E0]" />
                                                Mail Sent
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#F1F2F5]/80 text-[#6B6F76] text-[11px] font-bold border border-[#E8EAED]/60 uppercase tracking-wider shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#9AA3AF]" />
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
                                                    className={`w-8 h-8 flex items-center justify-center rounded-[10px] border transition-all active:scale-95 ${
                                                        activeMenu === item.shortlist_id
                                                            ? 'bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6] shadow-sm'
                                                            : 'text-[#8A929E] hover:bg-[#F4F5F7] hover:text-[#15171C] border-transparent hover:border-[#E8EAED]'
                                                    }`}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {activeMenu === item.shortlist_id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, x: 15 }}
                                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                                        className="absolute right-[45px] top-0 z-[100] min-w-[190px] bg-white rounded-[12px] border border-[#E8EAED] shadow-[0_12px_24px_rgba(21,23,28,0.08)] p-1.5"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <a
                                                            href={item.profile?.profile_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#15171C] rounded-[8px] transition-colors group"
                                                        >
                                                            <Eye className="w-4 h-4 text-[#8A929E] group-hover:text-[#5B53E0] transition-colors" />
                                                            View Profile
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                sendJD(item.profile, item.job_title, item.job_id);
                                                                setActiveMenu(null);
                                                            }}
                                                            disabled={isSendingJD === (item.profile.profile_url || item.profile.full_name)}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#15171C] rounded-[8px] transition-colors text-left group disabled:opacity-50"
                                                        >
                                                            {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? (
                                                                <div className="w-4 h-4 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin shrink-0" />
                                                            ) : (
                                                                <Send className="w-4 h-4 text-[#8A929E] group-hover:text-[#5B53E0] transition-colors" />
                                                            )}
                                                            {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? "Sending..." : "Send JD"}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/engagement/${item.shortlist_id}?source=Direct Link`;
                                                                navigator.clipboard.writeText(link);
                                                                alert("Engagement link copied to clipboard!");
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#15171C] rounded-[8px] transition-colors text-left group"
                                                        >
                                                            <Bookmark className="w-4 h-4 text-[#8A929E] group-hover:text-[#5B53E0] transition-colors" />
                                                            Copy Share Link
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setMovingCandidate(item);
                                                                setIsMoveModalOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#15171C] rounded-[8px] transition-colors text-left group"
                                                        >
                                                            <Briefcase className="w-4 h-4 text-[#8A929E] group-hover:text-[#5B53E0] transition-colors" />
                                                            Move to Job
                                                        </button>

                                                        <div className="my-1.5 border-t border-[#F1F2F5]" />

                                                        <button
                                                            onClick={() => {
                                                                removeShortlist(item.shortlist_id);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-[8px] transition-colors text-left group"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
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
                            className="bg-[#15171C]/95 backdrop-blur-xl border border-white/10 rounded-[16px] p-4 shadow-[0_20px_50px_rgba(15,23,28,0.3)] flex items-center gap-8 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                                <div className="w-10 h-10 rounded-xl bg-[#5B53E0] flex items-center justify-center text-white font-extrabold shadow-sm">
                                    {selectedIds.size}
                                </div>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-white text-[13px] font-bold">Candidates Selected</span>
                                    <span className="text-[#8A929E] text-[9.5px] font-bold uppercase tracking-widest">• Ready for Bulk Action</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => {
                                        alert(`Sending JDs to ${selectedIds.size} candidates...`);
                                        // Implementation for bulk JD send
                                    }}
                                    className="h-11 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#4A43C9] transition-all hover:shadow-[0_4px_12px_rgba(91,83,224,0.24)] active:scale-95 whitespace-nowrap"
                                >
                                    <Send className="w-4 h-4" />
                                    Send JD to All
                                </button>

                                <button
                                    onClick={() => {
                                        alert(`Bulk removing ${selectedIds.size} candidates...`);
                                        // Implementation for bulk remove
                                    }}
                                    className="h-11 px-4 rounded-[10px] bg-white/10 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-rose-600 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Bulk Remove
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedIds(new Set());
                                        setIsSelectionMode(false);
                                    }}
                                    className="h-11 px-4 text-[#9AA3AF] hover:text-white text-[13px] font-semibold transition-all hover:bg-white/5 rounded-[10px]"
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#15171C]/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="w-full max-w-md bg-white rounded-[14px] shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED] overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-[#E8EAED] flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-[16px] font-extrabold text-[#15171C] flex items-center gap-2">
                                        <Briefcase className="w-4.5 h-4.5 text-[#5B53E0]" /> Move Candidate
                                    </h3>
                                    <p className="text-[12.5px] text-[#8A929E] font-medium">Select target job for <span className="text-[#5B53E0] font-bold">{movingCandidate?.profile.full_name}</span></p>
                                </div>
                                <button onClick={() => setIsMoveModalOpen(false)} className="p-1.5 hover:bg-[#F4F5F7] text-[#9AA3AF] hover:text-[#4B5563] rounded-lg transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 max-h-[350px] overflow-y-auto no-scrollbar space-y-2">
                                {jobOptions.map(job => (
                                    <button
                                        key={job.id}
                                        disabled={job.id === movingCandidate?.job_id}
                                        onClick={() => moveCandidate(job.id, job.title)}
                                        className={`w-full flex items-center justify-between p-3 rounded-[12px] border transition-all text-left group ${
                                            job.id === movingCandidate?.job_id 
                                            ? 'bg-[#F7F8FA] border-[#E8EAED] opacity-50 cursor-not-allowed'
                                            : 'bg-white border-[#E8EAED] hover:border-[#5B53E0] hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center transition-all ${
                                                job.id === movingCandidate?.job_id ? 'bg-[#E1E4E8] text-[#9AA3AF]' : 'bg-[#F7F8FA] text-[#9AA3AF] group-hover:bg-[#5B53E0] group-hover:text-white'
                                            }`}>
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13.5px] font-semibold text-[#15171C] truncate max-w-[200px]">{job.title}</span>
                                                <span className="text-[9.5px] font-bold text-[#9AA3AF] uppercase tracking-wider mt-0.5">Active Requisition</span>
                                            </div>
                                        </div>
                                        {job.id === movingCandidate?.job_id && (
                                            <span className="text-[10px] font-bold text-[#5B53E0] bg-[#ECEBFB] px-2 py-0.5 rounded-[6px] border border-[#DAD7F6]/85">Current</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="px-6 py-4 bg-[#F7F8FA]/50 border-t border-[#E8EAED] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsMoveModalOpen(false)}
                                    className="px-4 py-2 border border-[#E1E4E8] bg-white hover:bg-[#F4F5F7] text-[13px] font-semibold text-[#374151] rounded-[9px] transition-all"
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
