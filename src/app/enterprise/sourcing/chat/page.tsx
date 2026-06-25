"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    Sparkles, 
    Send, 
    Zap, 
    ExternalLink, 
    MapPin, 
    Award,
    Briefcase,
    ArrowRight,
    Users,
    Edit,
    Linkedin,
    Github,
    Twitter,
    X,
    Filter,
    User,
    Bookmark,
    ChevronDown,
    FileText,
    Wrench,
    Target,
    UploadCloud,
    Building,
    Pin,
    Trash2,

    Mail,
    Phone,
    Mic,
    MicOff,
    Globe,
    BarChart
} from "lucide-react";
import { Chart } from "react-google-charts";
import { API_BASE_URL } from "@/lib/api-config";

interface Profile {
    full_name: string;
    headline?: string;
    location?: string;
    platform: string;
    profile_url: string;
    ai_summary?: string;
    skills?: string[];
    avatar_url?: string;
    company?: string;
    hireable?: boolean;
    email?: string;
    raw_data?: any;
    [key: string]: any;
}

const getPlatformDomain = (plat: string) => {
    if (!plat) return "google.com";
    const p = plat.toLowerCase().trim();
    if (p.includes("github")) return "github.com";
    if (p.includes("linkedin")) return "linkedin.com";
    if (p.includes("stackoverflow")) return "stackoverflow.com";
    if (p.includes("gitlab")) return "gitlab.com";
    if (p.includes("devto") || p.includes("dev.to")) return "dev.to";
    if (p.includes("arxiv")) return "arxiv.org";
    if (p.includes("reddit")) return "reddit.com";
    if (p.includes("hackernews")) return "news.ycombinator.com";
    if (p.includes("hashnode")) return "hashnode.com";
    if (p.includes("medium")) return "medium.com";
    if (p.includes("researchgate")) return "researchgate.net";
    if (p.includes("crunchbase")) return "crunchbase.com";
    if (p.includes("dribbble")) return "dribbble.com";
    if (p.includes("levelsfyi") || p.includes("levels.fyi")) return "levels.fyi";
    if (p.includes("kaggle")) return "kaggle.com";
    if (p.includes("hackerrank")) return "hackerrank.com";
    if (p.includes("leetcode")) return "leetcode.com";
    if (p.includes("producthunt")) return "producthunt.com";
    if (p.includes("twitter")) return "x.com";
    if (p.includes("wellfound")) return "wellfound.com";
    if (p.includes("openstreetmap")) return "openstreetmap.org";
    if (p.includes("behance")) return "behance.net";
    if (p.includes("googlescholar")) return "scholar.google.com";
    return `${p}.com`;
};

export default function ProfileSourcingChatPage() {
    const { token } = useAuth();
    const [searchPhase, setSearchPhase] = useState<"initial" | "filters" | "results">("initial");
    const [query, setQuery] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [extractedFilters, setExtractedFilters] = useState({
        title: "",
        location: "Global",
        minExp: "3",
        platform: "All"
    });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isBooleanModalOpen, setIsBooleanModalOpen] = useState(false);
    const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
    const [jobs, setJobs] = useState<{id: string, title: string}[]>([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [profileToShortlist, setProfileToShortlist] = useState<Profile | null>(null);
    const [isShortlisting, setIsShortlisting] = useState(false);


    const [jobDescription, setJobDescription] = useState("");
    const [booleanExpression, setBooleanExpression] = useState("");
    const [competitors, setCompetitors] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [results, setResults] = useState<Profile[]>([]);
    const [fullDistribution, setFullDistribution] = useState<any[]>([]);
    const [resultsTab, setResultsTab] = useState<"profiles" | "insights">("profiles");
    const [pinnedProfiles, setPinnedProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Load sessions on mount
    useEffect(() => {
        if (token) {
            fetchSessions();
        }
    }, [token]);

    const fetchSessions = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sessions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch sessions", e);
        }
    };

    const loadSession = async (sessionId: string) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sessions/${sessionId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentSessionId(sessionId);
                setChatMessages(data.messages || []);
                // If there were results in the last message, show them
                const lastMsg = data.messages?.[data.messages.length - 1];
                if (lastMsg && lastMsg.results) {
                    setResults(lastMsg.results);
                    setSearchPhase("results");
                    setQuery(lastMsg.content);
                    fetchDistribution(lastMsg.content);
                } else {
                    setSearchPhase("initial");
                    setResults([]);
                    setFullDistribution([]);
                }
            }
        } catch (e) {
            console.error("Failed to load session", e);
        } finally {
            setLoading(false);
        }
    };

    const saveSession = async (messages: any[], title: string) => {
        if (!token) return;
        // Strip heavy fields (the full scraped HTML in raw_data) from stored results.
        // Otherwise each saved session balloons to multiple MB (rejected by nginx and,
        // as it grows, MongoDB's 16MB document limit) — which silently broke history.
        const slimMessages = messages.map((m: any) => {
            if (Array.isArray(m?.results)) {
                return {
                    ...m,
                    results: m.results.map((r: any) => {
                        if (!r || typeof r !== "object") return r;
                        const { raw_data, html, ...rest } = r;
                        void raw_data; void html;
                        return rest;
                    }),
                };
            }
            return m;
        });
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    title: title,
                    messages: slimMessages
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (!currentSessionId) {
                    setCurrentSessionId(data.session_id);
                }
                fetchSessions();
            }
        } catch (e) {
            console.error("Failed to save session", e);
        }
    };

    const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!token) return;
        if (!window.confirm("Are you sure you want to delete this search history? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sessions/${sessionId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                if (currentSessionId === sessionId) {
                    createNewChat();
                }
                fetchSessions();
            }
        } catch (e) {
            console.error("Failed to delete session", e);
        }
    };

    const fetchJobs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/jobs`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(Array.isArray(data) ? data : []);
                if (data.length > 0) setSelectedJobId(data[0].id);
            }
        } catch (e) {
            console.error("Failed to fetch jobs", e);
        }
    };

    const openShortlistModal = (profile: Profile) => {
        setProfileToShortlist(profile);
        setIsShortlistModalOpen(true);
        fetchJobs();
    };

    const handleShortlistConfirm = async () => {
        if (!selectedJobId || !profileToShortlist || !token) return;
        setIsShortlisting(true);
        try {
            const job = jobs.find(j => j.id === selectedJobId);
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlist`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    job_id: selectedJobId,
                    job_title: job?.title,
                    profile: profileToShortlist
                })
            });
            if (res.ok) {
                alert(`Successfully shortlisted ${profileToShortlist.full_name} for ${job?.title}`);
                setIsShortlistModalOpen(false);
                setProfileToShortlist(null);
            }
        } catch (e) {
            console.error("Failed to shortlist", e);
        } finally {
            setIsShortlisting(false);
        }
    };




    const createNewChat = () => {
        setCurrentSessionId(null);
        setChatMessages([]);
        setResults([]);
        setFullDistribution([]);
        setSearchPhase("initial");
        setQuery("");
    };
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
                            setQuery(data.text);
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

    const handleChatSend = (text: string) => {
        setQuery(text);
        setExtractedFilters({
            title: text,
            location: "Global",
            minExp: "3",
            platform: "All"
        });
        setSearchPhase("results");
        setCurrentPage(1);
        
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_BASE_URL}/api/v1/enterprise/sourcing/chat_db?q=${encodeURIComponent(text)}&page=1&limit=${itemsPerPage}`
                );
                if (!res.ok) throw new Error("Database query failed");
                const data = await res.json();
                const newResults = data.profiles || [];
                setResults(newResults);
                setTotalCount(data.total_count || 0);
                
                // Fetch full distribution for map
                fetchDistribution(text);

                // Save to History
                const newMessages = [
                    ...chatMessages,
                    { role: "user", content: text, timestamp: new Date().toISOString() },
                    { role: "ai", content: `Found ${data.total_count || newResults.length} matches for "${text}"`, results: newResults, timestamp: new Date().toISOString() }
                ];
                setChatMessages(newMessages);
                saveSession(newMessages, text.substring(0, 40) + (text.length > 40 ? "..." : ""));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    };

    const fetchProfilesByPage = async (pageIndex: number) => {
        setLoading(true);
        try {
            let finalQuery = query;
            if (extractedFilters.title) {
                finalQuery = extractedFilters.title;
            }
            if (extractedFilters.platform && extractedFilters.platform !== "All") {
                finalQuery += ` on ${extractedFilters.platform}`;
            }
            if (extractedFilters.location && extractedFilters.location !== "Global") {
                finalQuery += ` in ${extractedFilters.location}`;
            }

            const res = await fetch(
                `${API_BASE_URL}/api/v1/enterprise/sourcing/chat_db?q=${encodeURIComponent(finalQuery)}&page=${pageIndex}&limit=${itemsPerPage}`
            );
            if (!res.ok) throw new Error("Database query failed");
            const data = await res.json();
            setResults(data.profiles || []);
            setTotalCount(data.total_count || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const extractCountry = (location: string) => {
        if (!location) return null;
        const loc = location.toLowerCase().trim();
        
        // Comprehensive Mapping to ISO Codes
        if (loc.includes("usa") || loc.includes("united states") || loc.includes("us") || loc.includes("america") || loc.includes("california") || loc.includes("new york") || loc.includes("san francisco") || loc.includes("texas")) return "US";
        if (loc.includes("india") || loc.includes("bangalore") || loc.includes("mumbai") || loc.includes("delhi") || loc.includes("pune") || loc.includes("chennai") || loc.includes("hyderabad")) return "IN";
        if (loc.includes("uk") || loc.includes("united kingdom") || loc.includes("london") || loc.includes("manchester") || loc.includes("britain")) return "GB";
        if (loc.includes("germany") || loc.includes("berlin") || loc.includes("munich") || loc.includes("hamburg")) return "DE";
        if (loc.includes("canada") || loc.includes("toronto") || loc.includes("vancouver") || loc.includes("montreal")) return "CA";
        if (loc.includes("australia") || loc.includes("sydney") || loc.includes("melbourne")) return "AU";
        if (loc.includes("brazil") || loc.includes("sao paulo")) return "BR";
        if (loc.includes("france") || loc.includes("paris") || loc.includes("lyon")) return "FR";
        if (loc.includes("japan") || loc.includes("tokyo") || loc.includes("osaka")) return "JP";
        if (loc.includes("china") || loc.includes("beijing") || loc.includes("shanghai") || loc.includes("shenzhen")) return "CN";
        if (loc.includes("singapore")) return "SG";
        if (loc.includes("uae") || loc.includes("dubai") || loc.includes("abu dhabi") || loc.includes("emirates")) return "AE";
        if (loc.includes("netherlands") || loc.includes("amsterdam")) return "NL";
        if (loc.includes("spain") || loc.includes("madrid") || loc.includes("barcelona")) return "ES";
        if (loc.includes("italy") || loc.includes("rome") || loc.includes("milan")) return "IT";
        if (loc.includes("switzerland") || loc.includes("zurich")) return "CH";
        if (loc.includes("sweden") || loc.includes("stockholm")) return "SE";
        if (loc.includes("israel") || loc.includes("tel aviv")) return "IL";
        
        return null;
    };

    const fetchDistribution = async (q: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat_distribution?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setFullDistribution(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const COUNTRY_NAMES: Record<string, string> = {
        "US": "United States",
        "IN": "India",
        "GB": "United Kingdom",
        "DE": "Germany",
        "CA": "Canada",
        "AU": "Australia",
        "BR": "Brazil",
        "FR": "France",
        "JP": "Japan",
        "CN": "China",
        "SG": "Singapore",
        "AE": "United Arab Emirates",
        "NL": "Netherlands",
        "ES": "Spain",
        "IT": "Italy",
        "CH": "Switzerland",
        "SE": "Sweden",
        "IL": "Israel"
    };

    const COUNTRY_COLORS: Record<string, string> = {
        "US": "#3B82F6", // Blue
        "IN": "#F59E0B", // Amber
        "GB": "#EF4444", // Red
        "DE": "#10B981", // Emerald
        "CA": "#8B5CF6", // Violet
        "AU": "#EC4899", // Pink
        "BR": "#06B6D4", // Cyan
        "FR": "#F97316", // Orange
        "JP": "#6366F1", // Indigo
        "CN": "#14B8A6", // Teal
        "SG": "#84CC16", // Lime
        "AE": "#0EA5E9", // Sky
        "NL": "#D946EF", // Fuchsia
        "ES": "#F43F5E", // Rose
        "IT": "#22C55E", // Green
        "CH": "#64748B", // Slate
        "SE": "#A855F7", // Purple
        "IL": "#475569"  // Slate-600
    };

    const mapData = useMemo(() => {
        const counts: Record<string, number> = {};
        let hasData = false;
        
        // Use fullDistribution from aggregation, fallback to current results page
        const sourceData = fullDistribution.length > 0 ? fullDistribution : results;
        
        sourceData.forEach(item => {
            const locStr = item.location || "";
            const countryCode = extractCountry(locStr);
            if (countryCode) {
                const addCount = item.count || 1;
                counts[countryCode] = (counts[countryCode] || 0) + addCount;
                hasData = true;
            }
        });
        
        // GeoChart with specific colors needs values that map to a color axis
        const data: any[] = [["Country", "ColorValue", { role: "tooltip", type: "string", p: { html: true } }]];
        
        const sortedCountries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        
        // We use the index as a color value to force specific colors from the axis
        sortedCountries.forEach(([code, count], index) => {
            data.push([
                code, 
                index, // This index will map to a specific color in the options
                `<div style="padding:10px; font-family: sans-serif;">
                    <b style="color:#1e293b; font-size:14px;">${COUNTRY_NAMES[code] || code}</b><br/>
                    <span style="color:#64748b; font-size:12px; font-weight:800;">${count} Candidates</span>
                </div>`
            ]);
        });
        
        if (!hasData) {
            data.push(["US", 0, "No Candidates"]);
            data.push(["IN", 1, "No Candidates"]);
            data.push(["GB", 2, "No Candidates"]);
        }
        
        return data;
    }, [results, fullDistribution]);

    const runSearch = () => {
        setSearchPhase("results");
        setCurrentPage(1);
        fetchProfilesByPage(1);
    };

    useEffect(() => {
        if (searchPhase === "results") {
            fetchProfilesByPage(currentPage);
        }
    }, [currentPage]);

    return (
        <div className="flex flex-col h-full bg-[#F4F5F7] overflow-hidden animate-in fade-in duration-500">
            <style dangerouslySetInnerHTML={{ __html: `
                main {
                    background-color: white !important;
                }
            ` }} />

            {/* Page header */}
            <header className="px-6 py-4 bg-white border-b border-[#E8EAED] flex items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-[22px] md:text-[24px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight flex items-center gap-2.5">
                        AI Sourcing
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}>Beta</span>
                    </h1>
                    <p className="text-[13.5px] text-[#8A929E] mt-0.5">Search across 30+ public sources to discover the best talent</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`inline-flex items-center gap-2 h-11 px-4 rounded-[10px] text-[13.5px] font-semibold transition-all border shadow-sm ${
                            isHistoryOpen 
                                ? "bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]" 
                                : "bg-white text-[#4B5563] border-[#E8EAED] hover:bg-[#F7F8FA]"
                        }`}
                    >
                        <Bookmark className="w-4 h-4" /> History
                    </button>
                    <button
                        onClick={createNewChat}
                        className="inline-flex items-center gap-2 h-11 px-4 bg-[#5B53E0] text-white rounded-[10px] text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors shrink-0"
                    >
                        <Edit className="w-4 h-4" /> New Search
                    </button>
                </div>
            </header>

            {/* Workspace */}
            <div className="flex-1 min-h-0 p-4 md:p-6">
            <div className="flex gap-6 h-full max-w-[1600px] mx-auto w-full">

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden">

                {/* Subtle tech grid tile background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cpath d='M0 30 L30 30 L30 0 M0 0 L0 30' fill='none' stroke='%235B53E0' stroke-width='1'/%3E%3C/svg%3E")` }} />
                
                {searchPhase === "initial" && (
                    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col justify-center relative z-10">
                        <div className="text-center max-w-xl mx-auto py-4">
                            <h2 className="text-[26px] font-extrabold text-center text-[#15171C] tracking-[-0.5px] mb-8">Hey VIBIN, who are you looking for?</h2>
                        </div>

                        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                            <button 
                                onClick={() => setIsJobModalOpen(true)} 
                                className="flex items-center gap-2 px-4 py-2 border border-[#E1E4E8] rounded-[10px] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] hover:border-[#DAD7F6]/80 transition-colors shadow-sm"
                            >
                                <FileText className="w-3.5 h-3.5 text-[#EF4444]" /> Job Description
                            </button>
                            <button 
                                onClick={() => setIsBooleanModalOpen(true)} 
                                className="flex items-center gap-2 px-4 py-2 border border-[#E1E4E8] rounded-[10px] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] hover:border-[#DAD7F6]/80 transition-colors shadow-sm"
                            >
                                <span className="text-[#15803D] font-bold text-xs">Σ</span> Boolean
                            </button>
                            <button 
                                onClick={() => setIsCompetitorModalOpen(true)} 
                                className="flex items-center gap-2 px-4 py-2 border border-[#E1E4E8] rounded-[10px] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] hover:border-[#DAD7F6]/80 transition-colors shadow-sm"
                            >
                                <Target className="w-3.5 h-3.5 text-[#5B53E0]" /> Skill Mapping
                            </button>

                            <button 
                                onClick={() => setIsFilterModalOpen(true)} 
                                className="flex items-center gap-2 px-4 py-2 border border-[#E1E4E8] rounded-[10px] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] hover:border-[#DAD7F6]/80 transition-colors shadow-sm"
                            >
                                <Wrench className="w-3.5 h-3.5 text-[#8A929E]" /> Select Manually
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) handleChatSend(query); }} className="max-w-3xl mx-auto w-full pt-2">
                            {showSuggestions && (
                                <div className="bg-white border border-[#E8EAED] rounded-[14px] p-3 shadow-md mb-4 space-y-1 animate-in fade-in duration-500">
                                    {[
                                        "Software Engineers in SF working at Series B companies, skilled in Python and Node.js",
                                        "Marketing Manager in Europe, German-speaking, working at a large enterprise",
                                        "Senior Scientist in Australia, 8+ years experience",
                                        "Consultant in London with 2+ years experience at top consulting firms",
                                        "Sales Manager in Dallas with experience in ERP"
                                    ].map((rec, rIdx) => (
                                        <button
                                            key={rIdx}
                                            type="button"
                                            onClick={() => { setQuery(rec); handleChatSend(rec); setShowSuggestions(false); }}
                                            className={`w-full text-left px-4 py-2.5 hover:bg-[#F4F5F7] text-[13px] font-semibold text-[#374151] rounded-[9px] transition-colors ${query === rec ? 'bg-[#F4F5F7]' : ''}`}
                                        >
                                            {rec}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="relative flex flex-col bg-white border border-[#E1E4E8] focus-within:border-[#5B53E0] focus-within:ring-2 focus-within:ring-[#5B53E0]/20 rounded-[14px] px-5 py-4 shadow-sm transition-all duration-300 animate-in fade-in duration-300">
                                <input 
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="Software Engineers with 5+ yrs of experience at fintech companies in the Bay Area"
                                    className="w-full bg-transparent border-none focus:outline-none text-[15px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] mb-4"
                                />
                                <div className="flex items-center justify-between mt-1">
                                    <button
                                        type="button"
                                        onClick={toggleSpeechRecognition}
                                        className={`w-9 h-9 rounded-[9px] border transition-all flex items-center justify-center ${isListening ? 'bg-[#FDECEC] border-[#FDECEC] text-[#C0383C] animate-pulse' : 'bg-[#F4F5F7] border-[#E8EAED] text-[#9AA3AF] hover:text-[#374151] hover:bg-[#E8EAED] shadow-sm'}`}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                    
                                    <button
                                        type="submit"
                                        disabled={!query.trim()}
                                        className="w-9 h-9 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[9px] font-semibold transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(91,83,224,0.24)] disabled:opacity-40 disabled:shadow-none"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {searchPhase === "filters" && (
                    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col justify-center">
                        <div className="flex justify-end">
                            <div className="bg-gradient-to-r from-[#5B53E0] to-[#4A43C9] text-white p-5 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-100 max-w-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-white">ME</div>
                                <p>{query}</p>
                            </div>
                        </div>

                        <div className="flex justify-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B1D24] to-[#0E1014] flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-lg border border-[#2A2D35]">AI</div>
                            <div className="bg-white p-6 rounded-3xl border border-[#E8EAED] shadow-xl shadow-slate-200/10 max-w-2xl w-full space-y-4">
                                <p className="text-sm font-bold text-[#374151] flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-[#5B53E0] rounded-full animate-pulse shadow-glow" />
                                    {" "}<span>I've mapped out targeted search rules matching your directives:</span>
                                </p>

                                <div className="flex flex-wrap items-center gap-2 p-4 bg-[#F7F8FA]/80 rounded-2xl border border-[#E8EAED]/50 shadow-inner">
                                    <span className="px-3 py-1.5 bg-[#ECEBFB] text-[#5B53E0] font-bold text-xs rounded-xl border border-[#DAD7F6] shadow-sm flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" /> {extractedFilters.title}
                                    </span>
                                    <span className="text-[#C4C9D0] font-bold text-xs">&middot;</span>
                                    <span className="px-3 py-1.5 bg-[#ECEBFB] text-[#5B53E0] font-bold text-xs rounded-xl border border-[#DAD7F6] shadow-sm flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> {extractedFilters.location}
                                    </span>
                                    <span className="text-[#C4C9D0] font-bold text-xs">&middot;</span>
                                    <span className="px-3 py-1.5 bg-[#ECEBFB] text-[#5B53E0] font-bold text-xs rounded-xl border border-[#DAD7F6] shadow-sm flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5" /> {extractedFilters.minExp}+ years
                                    </span>

                                    <button
                                        onClick={() => setIsFilterModalOpen(true)}
                                        className="ml-auto px-4 py-1.5 bg-white hover:bg-[#F7F8FA] border border-[#E1E4E8] text-[#5B53E0] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                                    >
                                        Edit Rule
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t border-[#F0F0F1] pt-4">
                            <button
                                onClick={() => setSearchPhase("initial")}
                                className="px-6 py-3 bg-[#F7F8FA] hover:bg-[#F0F0F1] border border-[#E8EAED] text-[#4B5563] text-sm font-bold rounded-xl transition-all"
                            >
                                Reset Search
                            </button>
                            <button
                                onClick={runSearch}
                                className="px-8 py-3 bg-[#5B53E0] hover:bg-[#4A43C9] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                            >
                                Run Search
                            </button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-[#DAD7F6] rounded-full animate-pulse" />
                            <div className="absolute inset-0 border-4 border-[#5B53E0] border-t-transparent rounded-full animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#5B53E0] animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold text-[#1F2127] tracking-tight">Gathering Talent Intel...</h3>
                        <p className="text-xs text-[#9AA3AF] font-bold mt-1">Cross-referencing indexed MongoDB structures.</p>
                    </div>
                )}

                {searchPhase === "results" && !loading && (
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 max-w-full w-full animate-in fade-in duration-500 pr-1">
                        {/* Search Input bar */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3 py-1">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF]" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            runSearch();
                                        }
                                    }}
                                    placeholder="Refine your search..."
                                    className="w-full h-11 bg-white border border-[#E1E4E8] rounded-[12px] pl-11 pr-4 text-sm font-semibold text-[#1F2127] placeholder:text-[#9AA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/30 focus:border-[#5B53E0] transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2.5 self-end md:self-center">
                                <button onClick={() => setIsFilterModalOpen(true)} className="h-11 px-4 bg-white border border-[#E1E4E8] rounded-[12px] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F7F8FA] hover:border-[#DAD7F6] transition-colors flex items-center gap-2 shadow-sm">
                                    <Filter className="w-4 h-4 text-[#5B53E0]" /> Filters <span className="bg-[#ECEBFB] text-[#5B53E0] px-1.5 py-0.5 rounded-md text-[10px] font-bold">2</span>
                                </button>
                                <button className="h-11 px-4 bg-white border border-[#E1E4E8] rounded-[12px] text-[13px] font-semibold text-[#4B5563] hover:bg-[#F7F8FA] hover:border-[#DAD7F6] transition-colors flex items-center gap-2 shadow-sm">
                                    <Sparkles className="w-4 h-4 text-[#5B53E0]" /> Criteria
                                </button>
                            </div>
                        </div>



                        {results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#F7F8FA] rounded-3xl border border-[#E8EAED]">
                                <h3 className="text-md font-bold text-[#1F2127] mb-1">No matching profiles indexed</h3>
                                <p className="text-[#9AA3AF] text-xs font-medium max-w-xs">
                                    Trigger background automated scrapers or loosen standard keyword bindings.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between py-2 border-b border-[#E8EAED]/50">
                                    <div className="flex items-center gap-6">
                                        <button 
                                            onClick={() => setResultsTab("profiles")}
                                            className={`pb-3 text-sm font-bold transition-all relative ${resultsTab === 'profiles' ? 'text-[#5B53E0]' : 'text-[#9AA3AF] hover:text-[#4B5563]'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Profiles ({totalCount || results.length})
                                            </div>
                                            {resultsTab === 'profiles' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B53E0] rounded-full" />}
                                        </button>
                                        <button 
                                            onClick={() => setResultsTab("insights")}
                                            className={`pb-3 text-sm font-bold transition-all relative ${resultsTab === 'insights' ? 'text-[#5B53E0]' : 'text-[#9AA3AF] hover:text-[#4B5563]'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4" /> Global Insights
                                            </div>
                                            {resultsTab === 'insights' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B53E0] rounded-full" />}
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#9AA3AF] uppercase tracking-widest bg-[#F7F8FA] px-3 py-1 rounded-full border border-[#E8EAED]">Live Intel</span>
                                </div>
                                {resultsTab === "insights" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="py-4 space-y-6"
                                    >
                                        <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6 shadow-sm overflow-hidden">
                                            <div className="flex flex-col gap-6">
                                                <div className="text-center max-w-2xl mx-auto space-y-1">
                                                    <h3 className="text-xl font-bold text-[#15171C] tracking-tight">Geospatial Distribution</h3>
                                                    <p className="text-[#6B6F76] text-xs font-medium">
                                                        Deep-dive into your global talent clusters. Every color on the map represents a high-density candidate market.
                                                    </p>
                                                </div>
 
                                                {/* Color Synchronized Legend at Top */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                                    {mapData.slice(1).sort((a, b) => b[1] - a[1]).slice(0, 12).map((item, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="bg-white px-3 py-2.5 rounded-xl border border-[#E8EAED] shadow-sm flex items-center gap-2 group hover:scale-105 transition-all duration-300"
                                                        >
                                                            <div 
                                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                                                                style={{ backgroundColor: COUNTRY_COLORS[item[0]] || "#CBD5E1" }}
                                                            />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[9px] font-bold text-[#1F2127] truncate uppercase tracking-tighter">
                                                                    {COUNTRY_NAMES[item[0]] || item[0]}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-[#9AA3AF]">
                                                                    {item[1]} Candidates
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
 
                                                <div className="w-full min-h-[500px] bg-[#F7F8FA]/60 rounded-xl border border-[#E8EAED] overflow-hidden flex items-center justify-center relative group">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ECEBFB]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                                    <Chart
                                                        chartType="GeoChart"
                                                        width="100%"
                                                        height="500px"
                                                        data={mapData}
                                                        loader={
                                                            <div className="flex flex-col items-center justify-center gap-4">
                                                                <div className="w-8 h-8 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                                                                <span className="text-[10px] font-bold text-[#9AA3AF] uppercase tracking-widest">Generating Global Map...</span>
                                                            </div>
                                                        }
                                                        options={{
                                                            region: 'world',
                                                            displayMode: 'regions',
                                                            colorAxis: { 
                                                                values: mapData.slice(1).map((_, idx) => idx),
                                                                colors: mapData.slice(1).map(item => COUNTRY_COLORS[item[0]] || "#E2E8F0")
                                                            },
                                                            backgroundColor: "transparent",
                                                            datalessRegionColor: "#F8FAFC",
                                                            defaultColor: "#F1F5F9",
                                                            legend: 'none',
                                                            keepAspectRatio: true,
                                                            tooltip: { isHtml: true, trigger: 'focus' }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col w-full animate-in fade-in duration-500 bg-white rounded-[14px] border border-[#E8EAED] shadow-sm overflow-hidden">
                                        {results
                                            .filter(profile => extractedFilters.platform === "All" || (profile.platform && profile.platform.toLowerCase().includes(extractedFilters.platform.toLowerCase())))
                                            .map((profile, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-6 border-b border-[#E8EAED] last:border-b-0 hover:bg-[#F7F8FA]/40 transition-all flex flex-col gap-4 relative cursor-pointer"
                                        onClick={() => setSelectedProfile(profile)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded border-[#D4D7DC] text-[#5B53E0] focus:ring-[#5B53E0] mt-1"
                                                />
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-bold text-[#15171C] flex items-center gap-2">
                                                            {profile.full_name}
                                                        </h3>
                                                        <a href={profile.profile_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#5B53E0] hover:text-[#4A43C9]">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        {profile.platform && (
                                                            <div className="flex items-center gap-1.5 shrink-0 text-[#6B6F76] font-bold text-[10px]">
                                                                <img 
                                                                    src={`https://www.google.com/s2/favicons?sz=64&domain=${getPlatformDomain(profile.platform)}`} 
                                                                    alt={profile.platform} 
                                                                    className="w-3.5 h-3.5 rounded-sm object-contain"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                                <span className="capitalize">{profile.platform}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-xs font-bold text-[#4B5563] flex items-center gap-2">
                                                        <Building className="w-4 h-4 text-[#9AA3AF]" /> {profile.headline || "Professional Role"} {profile.company ? ` at ${profile.company}` : ""}
                                                    </p>
                                                    {profile.location && (
                                                        <span className="text-[10px] font-bold text-[#9AA3AF] flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-[#C4C9D0]" /> {profile.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center self-end md:self-start" role="button" tabIndex={0} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); } }}>
                                                <button
                                                    onClick={() => openShortlistModal(profile)}
                                                    className={`flex items-center rounded-xl border font-bold text-xs shadow-sm bg-white border-[#E1E4E8]/80 transition-all hover:bg-[#F7F8FA]`}
                                                >
                                                    <div className="flex items-center gap-2 px-3 py-2 text-[#1F2127] font-bold">
                                                        <Bookmark className={`w-4 h-4 text-[#9AA3AF]`} /> 
                                                        <span>
                                                            Shortlist
                                                        </span>
                                                    </div>
                                                    <div className="border-l border-[#E1E4E8]/80 h-full py-3 px-2 flex items-center justify-center">
                                                        <ChevronDown className="w-3.5 h-3.5 text-[#1F2127]" />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {profile.ai_summary && (
                                            <div className="pl-8 text-xs font-medium text-[#4B5563] leading-relaxed flex items-start gap-3">
                                                <Sparkles className="w-4 h-4 text-[#5B53E0] mt-0.5 shrink-0 animate-pulse" />
                                                <p>
                                                    {profile.ai_summary}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                        ))}
                                    </div>
                                )}

                            {Math.ceil(totalCount / itemsPerPage) > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8 py-4 border-t border-[#F0F0F1]">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${currentPage === 1 ? 'text-[#C4C9D0] bg-[#F7F8FA] border-[#E8EAED] cursor-not-allowed' : 'text-[#4B5563] bg-white border-[#E1E4E8] hover:bg-[#F7F8FA]'}`}
                                    >
                                        Prev
                                    </button>
                                    
                                    {(() => {
                                        const totalPages = Math.ceil(totalCount / itemsPerPage);
                                        const maxVisible = 5;
                                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                        if (endPage - startPage + 1 < maxVisible) {
                                            startPage = Math.max(1, endPage - maxVisible + 1);
                                        }

                                        const pages = [];
                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(i);
                                        }

                                        return (
                                            <>
                                                {startPage > 1 && (
                                                    <>
                                                        <button 
                                                            onClick={() => setCurrentPage(1)}
                                                            className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all bg-white text-[#6B6F76] border-[#E1E4E8] hover:border-[#DAD7F6] hover:text-[#5B53E0]`}
                                                        >
                                                            1
                                                        </button>
                                                        {startPage > 2 && <span className="text-[#C4C9D0] text-xs px-1">...</span>}
                                                    </>
                                                )}

                                                {pages.map(pageIndex => (
                                                    <button 
                                                        key={pageIndex}
                                                        onClick={() => setCurrentPage(pageIndex)}
                                                        className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all ${currentPage === pageIndex ? 'bg-[#5B53E0] text-white border-[#5B53E0] shadow-sm' : 'bg-white text-[#6B6F76] border-[#E1E4E8] hover:border-[#DAD7F6] hover:text-[#5B53E0]'}`}
                                                    >
                                                        {pageIndex}
                                                    </button>
                                                ))}

                                                {endPage < totalPages && (
                                                    <>
                                                        {endPage < totalPages - 1 && <span className="text-[#C4C9D0] text-xs px-1">...</span>}
                                                        <button 
                                                            onClick={() => setCurrentPage(totalPages)}
                                                            className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all bg-white text-[#6B6F76] border-[#E1E4E8] hover:border-[#DAD7F6] hover:text-[#5B53E0]`}
                                                        >
                                                            {totalPages}
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}

                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
                                        disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${currentPage === Math.ceil(totalCount / itemsPerPage) ? 'text-[#C4C9D0] bg-[#F7F8FA] border-[#E8EAED] cursor-not-allowed' : 'text-[#4B5563] bg-white border-[#E1E4E8] hover:bg-[#F7F8FA]'}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    </div>
                )}
                </div>
            </div>
            </div>

            {/* Edit Rule Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-md w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#15171C] flex items-center gap-2"><Filter className="w-4 h-4 text-[#5B53E0]" /> Refine Constraints</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] hover:text-[#4B5563] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label htmlFor="filter-target-role" className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] ml-1">Target Role</label>
                                <input
                                    id="filter-target-role"
                                    type="text"
                                    value={extractedFilters.title}
                                    onChange={(e) => setExtractedFilters({...extractedFilters, title: e.target.value})} 
                                    className="w-full bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 py-2 text-[13.5px] font-medium text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="filter-location-area" className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] ml-1">Location Area</label>
                                <input
                                    id="filter-location-area"
                                    type="text"
                                    value={extractedFilters.location}
                                    onChange={(e) => setExtractedFilters({...extractedFilters, location: e.target.value})} 
                                    className="w-full bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 py-2 text-[13.5px] font-medium text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="filter-target-platform" className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF] ml-1">Target Platform</label>
                                <div id="filter-target-platform" className="max-h-60 overflow-y-auto p-2 border border-[#E8EAED]/80 rounded-[10px] bg-[#F7F8FA]/50 space-y-1 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: "All", name: "All Platforms" },
                                            { id: "github", name: "GitHub" },
                                            { id: "linkedin", name: "LinkedIn" },
                                            { id: "stackoverflow", name: "Stack Overflow" },
                                            { id: "gitlab", name: "GitLab" },
                                            { id: "devto", name: "Dev.to" },
                                            { id: "arxiv", name: "ArXiv" },
                                            { id: "reddit", name: "Reddit" },
                                            { id: "hackernews", name: "Hacker News" },
                                            { id: "hashnode", name: "Hashnode" },
                                            { id: "medium", name: "Medium" },
                                            { id: "researchgate", name: "ResearchGate" },
                                            { id: "crunchbase", name: "Crunchbase" },
                                            { id: "dribbble", name: "Dribbble" },
                                            { id: "levelsfyi", name: "Levels.fyi" },
                                            { id: "kaggle", name: "Kaggle" },
                                            { id: "hackerrank", name: "HackerRank" },
                                            { id: "LeetCode", name: "LeetCode" },
                                            { id: "producthunt", name: "Product Hunt" },
                                            { id: "twitter", name: "Twitter (X)" },
                                            { id: "wellfound", name: "Wellfound" },
                                            { id: "openstreetmap", name: "OpenStreetMap" },
                                            { id: "behance", name: "Behance" },
                                            { id: "googlescholar", name: "Google Scholar" },
                                            { id: "companywebsites", name: "Company Websites" },
                                            { id: "patentdatabases", name: "Patent Databases" },
                                            { id: "conferencespeakers", name: "Conference Speakers" },
                                            { id: "academicjournals", name: "Academic Journals" }
                                        ].map((plat) => (
                                            <button
                                                key={plat.id}
                                                type="button"
                                                onClick={() => setExtractedFilters({...extractedFilters, platform: plat.id})}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-[8px] text-[11px] font-semibold border transition-all ${
                                                    extractedFilters.platform === plat.id
                                                        ? "bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]"
                                                        : "bg-white border-[#E1E4E8]/50 text-[#4B5563] hover:bg-[#F7F8FA]"
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${extractedFilters.platform === plat.id ? "bg-[#5B53E0] animate-pulse" : "bg-[#C4C9D0]"}`} />
                                                <span className="truncate">{plat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setIsFilterModalOpen(false);
                                runSearch();
                            }} 
                            className="w-full h-10 bg-[#5B53E0] hover:bg-[#4A43C9] text-white text-[13px] font-semibold rounded-[9px] transition-colors shadow-[0_6px_16px_rgba(91,83,224,0.28)]"
                        >
                            Save Rule Adjustments
                        </button>
                    </div>
                </div>
            )}
            {isJobModalOpen && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[14px] p-6 max-w-2xl w-full shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED] flex flex-col space-y-4 max-h-[90vh]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#15171C] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#EF4444]" /> Search by Job Description
                            </h3>
                            <button 
                                onClick={() => {
                                    if (jobDescription.trim()) {
                                        handleChatSend(jobDescription);
                                    }
                                    setIsJobModalOpen(false);
                                }}
                                className="h-10 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[9px] text-[13px] font-semibold transition-colors shadow-[0_6px_16px_rgba(91,83,224,0.28)] flex items-center gap-1.5"
                            >
                                Save & Search <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto space-y-4">
                            <div className="space-y-1">
                                <label htmlFor="job-description-textarea" className="text-[13px] font-semibold text-[#15171C]">Paste Job Description</label>
                                <p className="text-xs text-[#9AA3AF] font-medium mb-2">Don't worry about the formatting, we'll take care of that for you</p>
                                <textarea
                                    id="job-description-textarea"
                                    rows={8}
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste job details here..."
                                    className="w-full bg-white border border-[#E1E4E8] rounded-[10px] px-4 py-3 text-[13.5px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                                />
                            </div>
                            <div className="border-t border-[#E8EAED] pt-3 space-y-2">
                                <label htmlFor="job-upload-button" className="text-[13px] font-semibold text-[#15171C] flex items-center gap-2">Upload Job Description</label>
                                <p className="text-xs text-[#9AA3AF] font-medium">You can upload PDF or text documents like .docx, .txt, or formatted text</p>
                                <button id="job-upload-button" className="h-9 px-4 border border-[#E1E4E8] rounded-[9px] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm">
                                    Upload
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsJobModalOpen(false)} 
                            className="w-full h-10 bg-[#F4F5F7] hover:bg-[#E8EAED] text-[#4B5563] text-[13px] font-semibold rounded-[9px] transition-colors border border-[#E8EAED]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {isBooleanModalOpen && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[14px] p-6 max-w-xl w-full shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED] flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#15171C] flex items-center gap-2">
                                <span className="text-[#15803D] font-bold text-xl">Σ</span> Search by Boolean Expression
                            </h3>
                            <button 
                                onClick={() => {
                                    if (booleanExpression.trim()) {
                                        handleChatSend(booleanExpression);
                                    }
                                    setIsBooleanModalOpen(false);
                                }}
                                className="h-10 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[9px] text-[13px] font-semibold transition-colors shadow-[0_6px_16px_rgba(91,83,224,0.28)] flex items-center gap-1.5"
                            >
                                Save & Search <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-[#6B6F76] font-bold">Enter a boolean expression to search for candidates.</p>
                        <textarea 
                            rows={5}
                            value={booleanExpression}
                            onChange={(e) => setBooleanExpression(e.target.value)}
                            placeholder="(software OR engineer) AND (python OR java)"
                            className="w-full bg-white border border-[#E1E4E8] rounded-[10px] px-4 py-3 text-[13.5px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                        />
                        <button 
                            onClick={() => setIsBooleanModalOpen(false)} 
                            className="w-full h-10 bg-[#F4F5F7] hover:bg-[#E8EAED] text-[#4B5563] text-[13px] font-semibold rounded-[9px] transition-colors border border-[#E8EAED]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {isCompetitorModalOpen && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[14px] p-6 max-w-xl w-full shadow-[0_14px_34px_rgba(15,23,42,0.16)] border border-[#E8EAED] flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#15171C] flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#5B53E0]" /> Skill Mapping
                            </h3>
                            <button 
                                onClick={() => {
                                    if (competitors.trim()) {
                                        handleChatSend(`Targeting talent with specific skills: ${competitors}`);
                                    }
                                    setIsCompetitorModalOpen(false);
                                }}
                                className="h-10 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[9px] text-[13px] font-semibold transition-colors shadow-[0_6px_16px_rgba(91,83,224,0.28)] flex items-center gap-1.5"
                            >
                                Save & Search <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-[#6B6F76] font-bold">Search candidates by providing specific technical skills or domain expertise.</p>
                        <textarea 
                            rows={3}
                            value={competitors}
                            onChange={(e) => setCompetitors(e.target.value)}
                            placeholder="e.g., Python, React, AWS, Docker, Machine Learning"
                            className="w-full bg-white border border-[#E1E4E8] rounded-[10px] px-4 py-3 text-[13.5px] font-medium text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                        />
                        <button 
                            onClick={() => setIsCompetitorModalOpen(false)} 
                            className="w-full h-10 bg-[#F4F5F7] hover:bg-[#E8EAED] text-[#4B5563] text-[13px] font-semibold rounded-[9px] transition-colors border border-[#E8EAED]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}


            {/* Sliding Drawer Panel */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#15171C]/40 backdrop-blur-sm" role="button" tabIndex={0} onClick={() => setSelectedProfile(null)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setSelectedProfile(null); } }} />
                    <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-[#E8EAED] flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#15171C] flex items-center gap-2">
                                <User className="w-5 h-5 text-[#5B53E0]" /> Candidate Dossier
                            </h3>
                            <button 
                                onClick={() => setSelectedProfile(null)} 
                                className="p-2 hover:bg-[#F7F8FA] text-[#9AA3AF] hover:text-[#4B5563] rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={selectedProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.full_name)}&background=random&color=fff&size=128`} 
                                    alt={selectedProfile.full_name} 
                                    className="w-16 h-16 rounded-[18px] object-cover border-2 border-[#E8EAED] shadow-sm"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.full_name)}&background=random&color=fff&size=128`;
                                    }}
                                />
                                <div>
                                    <h2 className="text-lg font-extrabold text-[#15171C]">{selectedProfile.full_name}</h2>
                                    <p className="text-[11px] font-bold text-[#5B53E0] mt-1 uppercase tracking-wider flex items-center gap-1">
                                        {selectedProfile.platform} Sourced
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[#E8EAED]">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">Professional Role</span>
                                    <p className="text-[14px] font-semibold text-[#15171C]">{selectedProfile.headline || "Unspecified Specialty"}</p>
                                </div>

                                {selectedProfile.location && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">Geography</span>
                                        <p className="text-[13px] font-medium text-[#374151] flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[#9AA3AF]" /> {selectedProfile.location}
                                        </p>
                                    </div>
                                )}

                                {selectedProfile.company && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">Organization</span>
                                        <p className="text-[13px] font-medium text-[#374151] flex items-center gap-2">
                                            <Building className="w-4 h-4 text-[#9AA3AF]" /> {selectedProfile.company}
                                        </p>
                                    </div>
                                )}

                                {selectedProfile.email && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">Contact Email</span>
                                        <p className="text-[13px] font-medium text-[#374151] flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[#9AA3AF]" /> {selectedProfile.email}
                                        </p>
                                    </div>
                                )}

                                {selectedProfile.raw_data && selectedProfile.raw_data.phone && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Phone Number</span>
                                        <p className="text-xs font-bold text-[#4B5563] flex items-center gap-1">
                                            <Phone className="w-4 h-4 text-[#C4C9D0]" /> {selectedProfile.raw_data.phone}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Statistics Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F0F0F1]">
                                {selectedProfile.followers !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Followers</span>
                                        <p className="text-xs font-bold text-[#374151]">{selectedProfile.followers}</p>
                                    </div>
                                )}
                                {selectedProfile.following !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Following</span>
                                        <p className="text-xs font-bold text-[#374151]">{selectedProfile.following}</p>
                                    </div>
                                )}
                                {selectedProfile.public_repos !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Public Repos</span>
                                        <p className="text-xs font-bold text-[#374151]">{selectedProfile.public_repos}</p>
                                    </div>
                                )}
                                {selectedProfile.blog && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Website / Blog</span>
                                        <a href={selectedProfile.blog} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#5B53E0] hover:underline block truncate">
                                            {selectedProfile.blog}
                                        </a>
                                    </div>
                                )}
                                {selectedProfile.hireable !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Open to Work</span>
                                        <p className="text-xs font-bold text-[#374151]">{selectedProfile.hireable ? "Yes ✅" : "No ❌"}</p>
                                    </div>
                                )}
                            </div>

                            {/* Social Links */}
                            {selectedProfile.social_links && selectedProfile.social_links.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-[#F0F0F1]">
                                    <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Associated Profiles</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProfile.social_links.map((link: any, lIdx: number) => (
                                            <a 
                                                key={lIdx} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="px-2.5 py-1 bg-[#F7F8FA] text-[#4B5563] hover:text-[#5B53E0] text-[10px] font-bold rounded-lg border border-[#E8EAED] hover:border-[#DAD7F6] transition-all flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" /> {link.provider || "Link"}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProfile.ai_summary && (
                                <div className="space-y-2 pt-4 border-t border-[#F0F0F1]">
                                    <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-[#5B53E0]" /> AI Summary Assessment
                                    </span>
                                    <div className="bg-[#F7F8FA]/80 p-4 rounded-2xl text-xs font-semibold text-[#4B5563] leading-relaxed border border-[#E8EAED]/30 shadow-inner">
                                        {selectedProfile.ai_summary}
                                    </div>
                                </div>
                            )}

                            {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-[#F0F0F1]">
                                    <span className="text-[10px] font-bold uppercase text-[#9AA3AF] tracking-wider">Key proficiencies</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProfile.skills.map((skill, sIdx) => (
                                            <span key={sIdx} className="px-2.5 py-1 bg-[#F7F8FA] text-[#4B5563] text-[10px] font-bold rounded-lg border border-[#E8EAED]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[#E8EAED] flex gap-3">
                            <a 
                                href={selectedProfile.profile_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1 h-[42px] bg-[#15171C] hover:bg-[#1F2127] text-white rounded-[9px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                Visit Source Profile <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
            {/* Shortlist Job Modal */}
            {isShortlistModalOpen && (
                <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-md w-full mx-4 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[15px] font-bold text-[#15171C] flex items-center gap-2">
                                    <Bookmark className="w-4 h-4 text-[#5B53E0]" /> Shortlist to Job Role
                                </h3>
                                <p className="text-[11px] font-bold text-[#9AA3AF] uppercase tracking-wider">Assigning {profileToShortlist?.full_name}</p>
                            </div>
                            <button onClick={() => setIsShortlistModalOpen(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] hover:text-[#4B5563] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="shortlist-job-role" className="text-[11px] font-bold uppercase tracking-wider text-[#6B6F76] ml-1">Choose Job Role</label>
                                <div id="shortlist-job-role" className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                                    {jobs.length === 0 ? (
                                        <div className="p-4 bg-[#F7F8FA] rounded-[10px] border border-[#E8EAED] text-center">
                                            <p className="text-[12px] font-bold text-[#6B6F76] italic">No active jobs found. Create one in Jobs hub first.</p>
                                        </div>
                                    ) : (
                                        jobs.map(job => (
                                            <button
                                                key={job.id}
                                                onClick={() => setSelectedJobId(job.id)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-[10px] border transition-all text-left ${
                                                    selectedJobId === job.id 
                                                        ? 'bg-[#ECEBFB] border-[#DAD7F6] text-[#4A43C9] ring-1 ring-[#DAD7F6]' 
                                                        : 'bg-white border-[#E8EAED] text-[#4B5563] hover:border-[#E1E4E8]'
                                                }`}
                                            >
                                                <span className="text-xs font-bold">{job.title}</span>
                                                {selectedJobId === job.id && <div className="w-2 h-2 rounded-full bg-[#5B53E0] shadow-glow animate-pulse" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsShortlistModalOpen(false)}
                                className="flex-1 h-10 px-4 bg-[#F4F5F7] border border-[#E8EAED] text-[#4B5563] text-[13px] font-semibold rounded-[9px] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShortlistConfirm}
                                disabled={!selectedJobId || isShortlisting}
                                className="flex-2 h-10 px-5 bg-[#5B53E0] hover:bg-[#4A43C9] text-white text-[13px] font-semibold rounded-[9px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors disabled:opacity-50"
                            >
                                {isShortlisting ? "Adding..." : "Confirm Shortlist"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Chat History Sidebar Overlay */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHistoryOpen(false)}
                            className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50"
                        />
                        
                        {/* Right-Side Sidebar Drawer */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#E8EAED]"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 bg-white border-b border-[#E8EAED] flex items-center justify-between gap-3 shrink-0">
                                <div>
                                    <h2 className="text-[20px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#5B53E0]" /> History
                                    </h2>
                                    <p className="text-[13px] text-[#8A929E] mt-0.5">Your past search sessions & queries</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={createNewChat}
                                        className="p-2 hover:bg-[#F4F5F7] rounded-[10px] text-[#5B53E0] transition-colors animate-in fade-in"
                                        title="New Chat"
                                    >
                                        <Edit className="w-4.5 h-4.5" />
                                    </button>
                                    <button 
                                        onClick={() => setIsHistoryOpen(false)} 
                                        className="w-9 h-9 rounded-[10px] hover:bg-[#F4F5F7] flex items-center justify-center text-[#9AA3AF] hover:text-[#374151] transition-colors border border-transparent hover:border-[#E8EAED]"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* History List Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#F7F8FA]/30">
                                {sessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                        <div className="w-12 h-12 rounded-[14px] bg-[#ECEBFB] flex items-center justify-center text-[#5B53E0] mb-3">
                                            <Bookmark className="w-6 h-6" />
                                        </div>
                                        <p className="text-[13px] font-semibold text-[#15171C]">No chat history yet</p>
                                        <p className="text-[11.5px] text-[#8A929E] mt-1">Start a search to save history</p>
                                    </div>
                                ) : (
                                    sessions.map((session) => (
                                        <div
                                            key={session.session_id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                loadSession(session.session_id);
                                                setIsHistoryOpen(false);
                                            }}
                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { loadSession(session.session_id); setIsHistoryOpen(false); } }}
                                            className={`group relative p-4 rounded-[10px] border transition-all cursor-pointer ${
                                                currentSessionId === session.session_id
                                                    ? "bg-white border-[#DAD7F6] shadow-md shadow-indigo-500/5 ring-1 ring-[#5B53E0]/15"
                                                    : "bg-white border-[#E8EAED] hover:bg-[#F4F5F7] hover:border-[#DAD7F6]/50 shadow-sm"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${currentSessionId === session.session_id ? 'bg-[#5B53E0] animate-pulse' : 'bg-[#E1E4E8]'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[12.5px] font-semibold truncate ${currentSessionId === session.session_id ? 'text-[#15171C]' : 'text-[#374151]'}`}>
                                                        {session.title || "Untitled Search"}
                                                    </p>
                                                    <p className="text-[9px] font-medium text-[#9AA3AF] mt-0.5">
                                                        {new Date(session.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => deleteSession(e, session.session_id)}
                                                    title="Delete History"
                                                    className="p-1.5 hover:bg-red-50 text-[#9AA3AF] hover:text-[#C0383C] rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Pro Sourcing Active Footer */}
                            <div className="p-4 bg-white border-t border-[#E8EAED] shrink-0">
                                <div className="bg-[#ECEBFB]/60 rounded-[10px] p-3 border border-[#DAD7F6]/85">
                                    <p className="text-[12px] font-bold text-[#5B53E0] flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-[#5B53E0]" /> Pro Sourcing Active
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

