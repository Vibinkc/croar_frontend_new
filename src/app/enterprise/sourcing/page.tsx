"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MapPin,
    Globe,
    Github,
    Linkedin,
    ExternalLink,
    User,
    ChevronLeft,
    ChevronRight,
    X,
    Zap,
    Users,
    SearchCode,
    DollarSign,
    Trophy,
    Award,
    Gift,
    Paintbrush,
    MessageSquare,
    Briefcase,
    Mail,
    Phone,
    Building,
    BookOpen,
    Code,
    Twitter,
    Facebook,
    Youtube,
    Instagram,
    Pin,
    Calendar,
    ArrowRight,
    Eye,
    Sparkles,
    Link as LinkIcon
} from "@/components/icons";
import { API_BASE_URL } from "@/lib/api-config";
import { useI18n } from "@/context/I18nContext";
import { PageHelp, Icon } from "@/components/ds";

const PLATFORM_LOGOS: Record<string, React.FC<{ className?: string }>> = {
    github: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
    ),
    linkedin: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#0077b5">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
    ),
    stackoverflow: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#f48024">
            <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 10.705l1.554-1.462 11.01 11.719-1.554 1.462zM7.535 7.185l1.191-1.765 12.596 8.503-1.191 1.765zm2.855-4.221L11.914 1.5 24 9.178l-1.524 1.457z"/>
        </svg>
    ),
    gitlab: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#fc6d26">
            <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.417-.724-.417-.86 0l-2.664 8.189H7.575L4.911 1.263c-.136-.417-.725-.417-.861 0L1.386 9.452.044 13.587c-.151.465.012.979.405 1.264l11.55 8.39 11.55-8.39c.393-.285.556-.799.406-1.264z"/>
        </svg>
    ),
    devto: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.5 13.5c0-.8-.2-1.3-.5-1.5.3-.2.5-.7.5-1.5 0-1.2-.8-2-2-2H6v10h3.5c1.2 0 2-.8 2-2zm-2.2-3.2c.4 0 .7.2.7.7s-.3.7-.7.7H7.7v-1.4h1.6zm0 3.4H7.7v-1.4h1.6c.4 0 .7.2.7.7s-.3.7-.7.7zm5.7-1.2V9.5h-1.5v3.5h1.5zm2.5-3.5h-1.5v3.5c0 .6.4 1 1 1h.5v-1h-.5V11h.5v-1.5zm6.5 2V5c0-1.1-.9-2-2-2H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2v-5.5zM19 13.5c0 1.9-1.3 3.5-3 3.5s-3-1.6-3-3.5 1.3-3.5 3-3.5 3 1.6 3 3.5z"/>
        </svg>
    ),
    twitter: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
    ),
    producthunt: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#da552f">
            <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm-1-17h2.5c2.481 0 4.5 1.623 4.5 4s-2.019 4-4.5 4H11v4H8V7h3zm3 5c.827 0 1.5-.673 1.5-1.5S14.827 9 14 9h-3v3h3z"/>
        </svg>
    ),
    reddit: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#ff4500">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.305.73-.495 1.196-.495.968 0 1.753.785 1.753 1.753 0 .736-.454 1.365-1.097 1.622.011.102.016.208.016.315 0 2.846-3.411 5.161-7.618 5.161-4.207 0-7.618-2.315-7.618-5.161 0-.104.004-.207.015-.306a1.745 1.745 0 0 1-1.088-1.631c0-.968.785-1.753 1.753-1.753.468 0 .89.19 1.2.497 1.195-.86 2.854-1.425 4.681-1.49l.865-4.053a.35.35 0 0 1 .42-.267l2.875.607a1.25 1.25 0 0 1 .435-.198zm-6.105 7.613c-.687 0-1.25.563-1.25 1.25s.563 1.25 1.25 1.25 1.25-.563 1.25-1.25-.563-1.25-1.25-1.25zm4.2 0c-.687 0-1.25.563-1.25 1.25s.563 1.25 1.25 1.25 1.25-.563 1.25-1.25-.563-1.25-1.25-1.25zm-5.01 3.513a5.55 5.55 0 0 0 3.015 1.282.35.35 0 0 0 .315-.175.35.35 0 0 0-.07-.384c-.6-.566-1.575-1.12-2.39-1.12-.132 0-.256.035-.36.1-.25.152-.41.42-.41.714z"/>
        </svg>
    ),
    hackernews: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#ff6600">
            <path d="M0 24V0h24v24H0zM11.2 13l-3.5-7h2l2.3 4.8L14.3 6h1.9l-3.5 7v5h-1.5v-5z"/>
        </svg>
    ),
    wellfound: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.954 4.569c-.885.393-1.83.659-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.957-2.173-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
        </svg>
    ),
    medium: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.54 12a6.8 6.8 0 11-13.54 0 6.8 6.8 0 0113.54 0zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM23.97 12c0 3.17-.31 5.75-.7 5.75-.39 0-.7-2.58-.7-5.75s.31-5.75.7-5.75c.39 0 .7 2.58.7 5.75z"/>
        </svg>
    ),
    hashnode: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#2962ff">
            <path d="M22.6 10.3l-8.9-8.9a2.5 2.5 0 00-3.5 0l-8.9 8.9a2.5 2.5 0 000 3.5l8.9 8.9a2.5 2.5 0 003.5 0l8.9-8.9a2.5 2.5 0 000-3.5zm-10.6 6.3a4.6 4.6 0 114.6-4.6 4.6 4.6 0 01-4.6 4.6z"/>
        </svg>
    ),
    arxiv: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-red-600 text-white flex items-center justify-center rounded-lg px-2 py-1`}>arXiv</div>
    ),
    researchgate: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-[#00ccbb] text-white flex items-center justify-center rounded-lg px-2 py-1`}>RG</div>
    ),
    crunchbase: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-[#0284c7] text-white flex items-center justify-center rounded-lg px-2 py-1`}>CB</div>
    ),
    dribbble: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="#ea4c89">
            <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.115-2.55-.801-5.13-.365 1.11 2.94 1.56 5.49 1.62 5.79 1.95-1.41 3.21-3.6 3.51-5.425zm-5.261 6.541c-.06-.315-.54-2.97-1.74-5.94-2.55.93-4.95 2.82-5.34 3.12-.03.03-.06.06-.09.09.24.21.48.39.72.6.9 1.47 2.1 2.13 3.63 2.13 1.05 0 1.95-.21 2.82-.6zM8.831 21.22c.3-.24 2.85-2.25 5.31-3.21.09-.03.18-.06.27-.09-1.02-2.73-2.1-5.13-2.31-5.61-.03 0-.06.03-.09.03C5.641 14.11 2.5 14 2.081 14c-.06 1.83.6 3.51 1.74 4.77 1.44 1.44 3.39 2.22 5.01 2.45zM2.141 12.11c.42 0 3.24.09 6.27-.99.09-.03.18-.06.27-.09-.45-1.05-.96-2.13-1.35-3.03C3.691 9.47 2.431 11.21 2.141 12.11zm4.86-5.821c.36.84.87 1.83 1.32 2.76 2.58-.9 4.8-2.61 5.16-2.88-1.5-1.11-3.42-1.77-5.49-1.17-.33.09-.66.18-.99.29zm10.23-.42c-.33.27-2.67 2.01-5.43 2.94.21.48 1.14 2.49 1.62 3.66 2.43-.36 4.56.24 5.04.39.12-.9.18-1.8.18-2.73 0-1.56-.45-3.03-1.41-4.26z"/>
        </svg>
    ),
    levelsfyi: ({ className }) => (
        <div className={`${className} font-bold text-[9px] bg-black text-yellow-500 flex items-center justify-center rounded-lg px-1.5 py-1`}>Levels.fyi</div>
    ),
    kaggle: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-[#20beff] text-white flex items-center justify-center rounded-lg px-2 py-1`}>Kaggle</div>
    ),
    hackerrank: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-[#2ec866] text-white flex items-center justify-center rounded-lg px-2 py-1`}>HR</div>
    ),
    leetcode: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-[#ffa116] text-white flex items-center justify-center rounded-lg px-2 py-1`}>LC</div>
    ),
    openstreetmap: ({ className }) => (
        <div className={`${className} font-bold text-[10px] bg-[#7eb900] text-white flex items-center justify-center rounded-lg px-2 py-1`}>OSM</div>
    )
};

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
    const pLower = platform.toLowerCase().replaceAll(/[^a-z]/g, '');
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

interface Profile {
    full_name: string;
    headline?: string;
    location?: string;
    platform: string;
    profile_url: string;
    email?: string;
    avatar_url?: string;
    company?: string;
    blog?: string;
    twitter_username?: string;
    public_repos?: number;
    followers?: number;
    following?: number;
    hireable?: boolean;
    skills: string[];
    social_links: { provider: string; url: string }[];
    raw_data?: any;
    ai_summary?: string;
}

export default function ProfileSourcingPage() {
    const { t: tr } = useI18n();
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState("github");
    const [hasContactOnly, setHasContactOnly] = useState(false);
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedProfileDetails, setSelectedProfileDetails] = useState<any>(null);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [pinnedProfiles, setPinnedProfiles] = useState<Profile[]>([]);
    const [viewMode, setViewMode] = useState<"search" | "chat">("search");
    const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string; profiles?: Profile[] }[]>([
        { sender: "bot", text: tr("sourcingIndex.assistantGreeting") }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [searchPhase, setSearchPhase] = useState<"initial" | "filters" | "results">("initial");
    const [extractedFilters, setExtractedFilters] = useState({
        title: "Senior Scientist",
        location: "Australia",
        minExp: "8",
        platform: "github"
    });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Hand-off from "Source manually" after creating a job: pre-fill the search box
    // with the job title so the recruiter can search right away (no auto-run).
    useEffect(() => {
        let raw: string | null = null;
        try { raw = sessionStorage.getItem("croar_source_job"); } catch { return; }
        if (!raw) return;
        try { sessionStorage.removeItem("croar_source_job"); } catch { /* ignore */ }
        try {
            const ctx = JSON.parse(raw);
            const title = (ctx?.title || "").trim();
            if (title) setQuery(title);
        } catch (e) {
            console.error("Failed to read sourcing hand-off:", e);
        }
    }, []);

    const fetchDetails = async (url: string) => {
        setFetchingDetails(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/profile_details?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            setSelectedProfileDetails(data);
        } catch (err) {
            console.error("Failed to fetch details", err);
        } finally {
            setFetchingDetails(false);
        }
    };

    const handleSearch = async (e: React.FormEvent | null, newPage = 1) => {
        if (e) e.preventDefault();
        if (!query) return;

        setLoading(true);
        setPage(newPage);
        setHasSearched(true);

        try {
            // Updated to point to the newly integrated enterprise sourcing route
            const response = await fetch(
                `${API_BASE_URL}/api/v1/enterprise/sourcing/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${newPage}&page_size=15&platform=${selectedPlatform}&has_contact=${hasContactOnly}`
            );
            const data = response.ok ? await response.json() : [];
            setResults(Array.isArray(data) ? data : (data?.profiles ?? []));
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatSend = async (e: React.FormEvent | string) => {
        if (typeof e !== "string" && e) e.preventDefault();
        const userMsg = typeof e === "string" ? e : chatInput;

        if (!userMsg.trim()) return;

        setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
        setChatInput("");
        setChatLoading(true);

        setTimeout(() => {
            const textLower = userMsg.toLowerCase();
            let platformToSearch = "github";

            const platforms = [
                "github", "linkedin", "stackoverflow", "gitlab", "devto",
                "arxiv", "reddit", "hackernews", "hashnode", "medium",
                "researchgate", "crunchbase", "levelsfyi", "kaggle",
                "hackerrank", "leetcode", "producthunt", "twitter", "wellfound"
            ];

            for (const p of platforms) {
                if (textLower.includes(p)) {
                    platformToSearch = p;
                    break;
                }
            }

            let extractedTitle = "Senior Scientist";
            let extractedLoc = "Australia";
            let extractedExp = "8";

            if (textLower.includes("engineer") || textLower.includes("developer")) {
                extractedTitle = "Software Engineer";
            } else if (textLower.includes("marketing")) {
                extractedTitle = "Marketing Manager";
            } else if (textLower.includes("consultant")) {
                extractedTitle = "Consultant";
            } else if (textLower.includes("sales")) {
                extractedTitle = "Sales Manager";
            }

            if (textLower.includes("sf") || textLower.includes("san francisco") || textLower.includes("bay area")) {
                extractedLoc = "San Francisco, CA";
            } else if (textLower.includes("london")) {
                extractedLoc = "London, UK";
            } else if (textLower.includes("europe")) {
                extractedLoc = "Europe";
            } else if (textLower.includes("dallas")) {
                extractedLoc = "Dallas, TX";
            }

            const expMatch = textLower.match(/(\d{1,4})\+?\s{0,4}years?/);
            if (expMatch && expMatch[1]) {
                extractedExp = expMatch[1];
            }

            setExtractedFilters({
                title: extractedTitle,
                location: extractedLoc,
                minExp: extractedExp,
                platform: platformToSearch
            });

            setSearchPhase("filters");
            setChatLoading(false);
        }, 1200);
    };

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 pt-4 sm:pt-5 md:pt-6 pb-4 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.6px] text-[#212121] leading-tight flex items-center gap-3">
                            {tr("sourcingIndex.title")}
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}>
                                {tr("sourcingIndex.new")}
                            </span>
                        </h1>
                        <PageHelp title={tr("sourcingIndex.helpTitle")}>
                            <p>{tr("sourcingIndex.helpBody")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[14px] text-[#757575] mt-1">
                        {tr("sourcingIndex.subtitle")}
                    </p>
                </div>

                <div className="flex bg-white p-1.5 rounded-[4px] border border-[#E0E0E0] shadow-sm self-start sm:self-auto">
                    <button
                        onClick={() => setViewMode("search")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === "search"
                                ? "bg-white text-[#212121] shadow-md border border-[#E0E0E0]"
                                : "text-[#616161] hover:text-[#263238]"
                            }`}
                    >
                        <Search className="w-4 h-4" />
                        {tr("sourcingIndex.searchView")}
                    </button>
                    <button
                        onClick={() => setViewMode("chat")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === "chat"
                                ? "bg-white text-[#212121] shadow-md border border-[#E0E0E0]"
                                : "text-[#616161] hover:text-[#263238]"
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        {tr("sourcingIndex.aiChat")}
                    </button>
                </div>
            </header>

            {viewMode === "search" ? (
                <>
                    <div className="bg-white p-6 rounded-3xl border border-[#E0E0E0] shadow-xl shadow-slate-200/10 space-y-6">
                        <form onSubmit={(e) => handleSearch(e, 1)} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors" />
                                <input
                                    placeholder={tr("sourcingIndex.searchPlaceholder")}
                                    className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-[#424242] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-4 focus:ring-[#1976D2]/10 focus:border-[#1976D2] transition-all"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="md:w-64 relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors" />
                                <input
                                    type="text"
                                    placeholder={tr("sourcingIndex.locationPlaceholder")}
                                    className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-[#424242] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-4 focus:ring-[#1976D2]/10 focus:border-[#1976D2] transition-all"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold py-4 px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200 flex items-center justify-center min-w-[140px]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    tr("sourcingIndex.sourcingData")
                                )}
                            </button>
                        </form>

                        <div className="flex flex-col gap-4 border-t border-[#EEEEEE] pt-4">
                            <p className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-widest">{tr("sourcingIndex.sourcingFrom")}</p>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    { id: "all", label: tr("sourcingIndex.allPlatforms"), icon: Globe },
                                    { id: "github", label: "GitHub", icon: Github },
                                    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
                                    { id: "stackoverflow", label: "Stack Overflow", icon: Code },
                                    { id: "gitlab", label: "GitLab", icon: Code },
                                    { id: "devto", label: "Dev.to", icon: ExternalLink },
                                    { id: "arxiv", label: "ArXiv", icon: BookOpen },
                                    { id: "reddit", label: "Reddit", icon: Users },
                                    { id: "hackernews", label: "Hacker News", icon: ExternalLink },
                                    { id: "hashnode", label: "Hashnode", icon: BookOpen },
                                    { id: "medium", label: "Medium", icon: Globe },
                                    { id: "researchgate", label: "ResearchGate", icon: Globe },
                                    { id: "crunchbase", label: "Crunchbase", icon: Briefcase },
                                    { id: "dribbble", label: "Dribbble", icon: Paintbrush },
                                    { id: "levelsfyi", label: "Levels.fyi", icon: DollarSign },
                                    { id: "kaggle", label: "Kaggle", icon: Trophy },
                                    { id: "hackerrank", label: "HackerRank", icon: Award },
                                    { id: "leetcode", label: "LeetCode", icon: Zap },
                                    { id: "producthunt", label: "Product Hunt", icon: Gift },
                                    { id: "twitter", label: "Twitter (X)", icon: Twitter },
                                    { id: "wellfound", label: "Wellfound", icon: Briefcase },
                                    { id: "openstreetmap", label: "OpenStreetMap", icon: MapPin },
                                    { id: "behance", label: "Behance", icon: Paintbrush },
                                    { id: "googlescholar", label: "Google Scholar", icon: BookOpen },
                                    { id: "companywebsites", label: "Company Websites", icon: Globe },
                                    { id: "patentdatabases", label: "Patent Databases", icon: BookOpen },
                                    { id: "conferencespeakers", label: "Conference Speakers", icon: Users },
                                    { id: "academicjournals", label: "Academic Journals", icon: BookOpen },
                                ].map((platform) => (
                                    <button
                                        key={platform.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPlatform(platform.id);
                                            setResults([]); // Clear results when switching
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${selectedPlatform === platform.id
                                                ? "bg-[#1976D2] text-white border-[#1976D2] shadow-md"
                                                : "bg-white text-[#616161] border-[#E0E0E0] hover:border-[#E0E0E0]"
                                            }`}
                                    >
                                        <PlatformLogoRenderer platform={platform.id} className="w-4 h-4 shrink-0" />
                                        {platform.label}
                                    </button>
                                ))}
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                <input
                                    type="checkbox"
                                    checked={hasContactOnly}
                                    onChange={(e) => setHasContactOnly(e.target.checked)}
                                    className="w-4 h-4 rounded accent-[#1976D2]"
                                />
                                <span className="text-[11px] font-bold text-[#616161] uppercase tracking-widest">
                                    {tr("sourcingIndex.hasContactOnly")}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {!hasSearched ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border border-[#E0E0E0] shadow-sm">
                                <div className="w-20 h-20 bg-[#E3F2FD] rounded-3xl flex items-center justify-center mb-6">
                                    <SearchCode className="w-10 h-10 text-[#1976D2]" />
                                </div>
                                <h3 className="text-xl font-bold text-[#212121] mb-2">{tr("sourcingIndex.readyToSource")}</h3>
                                <p className="text-[#616161] max-w-xs mx-auto">
                                    {tr("sourcingIndex.readyToSourceDesc")}
                                </p>
                            </div>
                        ) : loading && results.length === 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-64 bg-[#FAFAFA] rounded-3xl animate-pulse" />
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                {pinnedProfiles.length > 0 && (
                                    <div className="bg-amber-50/40 border border-amber-100 p-6 rounded-3xl space-y-4">
                                        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                            <Pin className="w-3.5 h-3.5" /> {tr("sourcingIndex.pinnedCandidates")} ({pinnedProfiles.length})
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {pinnedProfiles.map((profile, index) => (
                                                <div key={`pinned-${index}`} className="bg-white p-6 rounded-3xl border border-amber-300 shadow-md flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex gap-2 items-center">
                                                                {profile.avatar_url ? (
                                                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-12 h-12 rounded-2xl object-cover border-2 border-[#EEEEEE] shadow-sm" />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] flex items-center justify-center text-[#9E9E9E]">
                                                                        <User className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => setPinnedProfiles(pinnedProfiles.filter(p => p.profile_url !== profile.profile_url))}
                                                                    className="p-2 rounded-xl bg-amber-500 text-white border border-amber-500"
                                                                >
                                                                    <Pin className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]">
                                                                {profile.platform}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-[#212121] line-clamp-1">{profile.full_name}</h3>
                                                        {profile.headline && <p className="text-xs font-bold text-[#9E9E9E] mt-1 line-clamp-2 min-h-[32px]">{profile.headline}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.map((profile, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`bg-white p-6 rounded-3xl border transition-all group flex flex-col justify-between ${pinnedProfiles.some(p => p.profile_url === profile.profile_url)
                                                    ? 'border-amber-400 shadow-lg ring-1 ring-amber-400'
                                                    : 'border-[#E0E0E0] shadow-sm hover:shadow-xl'
                                                }`}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex gap-2 items-center">
                                                        {profile.avatar_url ? (
                                                            <img
                                                                src={profile.avatar_url}
                                                                alt={profile.full_name}
                                                                className="w-12 h-12 rounded-2xl object-cover border-2 border-[#EEEEEE] shadow-sm transition-transform group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] flex items-center justify-center text-[#9E9E9E] group-hover:bg-[#E3F2FD] group-hover:text-[#1976D2] transition-colors">
                                                                <User className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (pinnedProfiles.some(p => p.profile_url === profile.profile_url)) {
                                                                    setPinnedProfiles(pinnedProfiles.filter(p => p.profile_url !== profile.profile_url));
                                                                } else {
                                                                    setPinnedProfiles([...pinnedProfiles, profile]);
                                                                }
                                                            }}
                                                            className={`p-2 rounded-xl border transition-all ${pinnedProfiles.some(p => p.profile_url === profile.profile_url)
                                                                    ? 'bg-amber-500 text-white border-amber-500'
                                                                    : 'bg-white text-[#9E9E9E] border-[#E0E0E0] hover:border-[#E0E0E0]'
                                                                }`}
                                                        >
                                                            <Pin className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <PlatformLogoRenderer platform={profile.platform} className="w-5 h-5 shrink-0" />
                                                </div>
                                                <h3 className="text-lg font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors line-clamp-1">
                                                    {profile.full_name || tr("sourcingIndex.anonymousProfile")}
                                                </h3>
                                                {profile.headline && (
                                                    <p className="text-xs font-bold text-[#9E9E9E] mt-1 line-clamp-2 min-h-[32px]">
                                                        {profile.headline}
                                                    </p>
                                                )}

                                                <div className="space-y-2 mt-4">
                                                    {profile.company && (
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#616161]">
                                                            <Building className="w-3.5 h-3.5 text-[#9E9E9E]" />
                                                            {profile.company}
                                                        </div>
                                                    )}
                                                    {profile.location && (
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#616161]">
                                                            <MapPin className="w-3.5 h-3.5 text-[#9E9E9E]" />
                                                            {profile.location}
                                                        </div>
                                                    )}
                                                </div>

                                                {profile.hireable && (
                                                    <div className="mt-4 flex justify-end">
                                                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-bold uppercase rounded-full border border-green-100">
                                                            {tr("sourcingIndex.available")}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Social Links Bar */}
                                                {profile.social_links && profile.social_links.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {profile.social_links.map((social, sIdx) => {
                                                            const provider = (social.provider || "").toLowerCase();
                                                            let Icon = LinkIcon;
                                                            if (provider.includes('linkedin')) Icon = Linkedin;
                                                            if (provider.includes('twitter')) Icon = Twitter;
                                                            if (provider.includes('facebook')) Icon = Facebook;
                                                            if (provider.includes('youtube')) Icon = Youtube;
                                                            if (provider.includes('instagram')) Icon = Instagram;
                                                            if (provider.includes('pinterest')) Icon = Pin;

                                                            return (
                                                                <a
                                                                    key={sIdx}
                                                                    href={social.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FAFAFA] text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2] transition-all border border-transparent hover:border-[#BBDEFB] shadow-sm"
                                                                    title={social.provider}
                                                                >
                                                                    <Icon className="w-4 h-4" />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Dynamic API Metadata for non-GitHub platforms */}
                                                {profile.platform !== 'github' && profile.raw_data && (
                                                    <div className="mt-4 pt-4 border-t border-[#EEEEEE]">
                                                        <p className="text-[9px] font-bold text-[#9E9E9E] uppercase tracking-widest mb-3">{tr("sourcingIndex.platformMetadata")}</p>
                                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                                            {Object.entries(profile.raw_data).map(([key, value]) => {
                                                                // Skip complex types and display-only fields
                                                                if (typeof value === 'object' || Array.isArray(value)) return null;
                                                                if (['profile_url', 'avatar_url', 'full_name', 'platform', 'profile_image'].includes(key.toLowerCase())) return null;
                                                                if (value === null || value === undefined || value === '') return null;

                                                                return (
                                                                    <div key={key} className="flex flex-col bg-[#FAFAFA]/50 p-2 rounded-xl border border-[#E0E0E0]/50 hover:bg-white hover:border-[#BBDEFB] transition-all">
                                                                        <span className="text-[7px] font-bold text-[#9E9E9E] uppercase tracking-tighter truncate opacity-70">
                                                                            {key.replaceAll(/([A-Z])/g, ' $1').replaceAll('_', ' ').trim()}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-[#424242] truncate" title={String(value)}>
                                                                            {String(value)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Real Contact Info */}
                                                {(profile.email || (profile.raw_data && profile.raw_data.phone)) && (
                                                    <div className="mt-4 pt-4 border-t border-[#EEEEEE] space-y-2">
                                                        {profile.email && (
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#9E9E9E] group-hover:text-[#4F4F4F] transition-colors">
                                                                <Mail className="w-3.5 h-3.5 text-[#1976D2]" />
                                                                {profile.email}
                                                            </div>
                                                        )}
                                                        {profile.raw_data && profile.raw_data.phone && (
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#9E9E9E] group-hover:text-[#4F4F4F] transition-colors">
                                                                <Phone className="w-3.5 h-3.5 text-[#1976D2]" />
                                                                {profile.raw_data.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                                                    <button
                                                        onClick={() => fetchDetails(profile.profile_url)}
                                                        disabled={fetchingDetails}
                                                        className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-[#EEEEEE] hover:bg-[#E0E0E0] text-[#263238] text-[11px] font-bold transition-all active:scale-95 border border-[#E0E0E0] disabled:opacity-50 w-full"
                                                    >
                                                        {fetchingDetails ? tr("sourcingIndex.scrapingDetails") : tr("sourcingIndex.viewProfileInfo")}
                                                    </button>
                                                    <a
                                                        href={profile.profile_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-[#1976D2] text-white text-[11px] font-bold hover:bg-[#1565C0] transition-all active:scale-95 shadow-lg shadow-indigo-200"
                                                    >
                                                        {tr("sourcingIndex.viewProfile")}
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Sliding Window Pagination */}
                                <div className="flex justify-center items-center gap-2 py-8">
                                    <button
                                        onClick={() => handleSearch(null, page - 1)}
                                        disabled={page === 1 || loading}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#E0E0E0] text-[#9E9E9E] hover:text-[#1976D2] hover:border-[#1976D2] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const pagesToShow = [];
                                            const maxPages = 20;
                                            const startPage = Math.max(1, page - 3);
                                            const endPage = Math.min(maxPages, Math.max(7, page + 3));

                                            for (let i = startPage; i <= endPage; i++) {
                                                pagesToShow.push(i);
                                            }

                                            return pagesToShow.map((pageNum) => (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handleSearch(null, pageNum)}
                                                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${page === pageNum
                                                            ? "bg-[#1976D2] text-white border-[#1976D2] shadow-lg scale-110"
                                                            : "bg-white text-[#616161] border-[#E0E0E0] hover:border-[#E0E0E0]"
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            ));
                                        })()}
                                    </div>

                                    <button
                                        onClick={() => handleSearch(null, page + 1)}
                                        disabled={loading || results.length < 15}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#E0E0E0] text-[#9E9E9E] hover:text-[#1976D2] hover:border-[#1976D2] disabled:opacity-30 transition-all shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border border-[#E0E0E0] shadow-sm">
                                <div className="w-20 h-20 bg-[#FAFAFA] rounded-3xl flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-[#BDBDBD]" />
                                </div>
                                <h3 className="text-xl font-bold text-[#212121] mb-2">{tr("sourcingIndex.noProfilesFound")}</h3>
                                <p className="text-[#616161] max-w-xs mx-auto mb-8">
                                    {tr("sourcingIndex.noProfilesDesc")}
                                </p>
                                <button
                                    onClick={() => {
                                        setQuery("");
                                        setLocation("");
                                        setHasSearched(false);
                                    }}
                                    className="px-8 py-3 bg-[#212121] text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-200"
                                >
                                    {tr("sourcingIndex.resetSearch")}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white p-8 rounded-3xl border border-[#E0E0E0] shadow-xl shadow-slate-200/5 flex flex-col min-h-[550px]">
                    {/* Chat History / Filters / Results */}
                    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full mb-8">
                        {searchPhase === "initial" && (
                            <div className="space-y-6">
                                <div className="text-center max-w-xl mx-auto py-8">
                                    <h2 className="text-2xl font-bold text-[#263238] tracking-tight mb-2">{tr("sourcingIndex.howCanIHelp")}</h2>
                                    <p className="text-sm text-[#9E9E9E] font-bold">{tr("sourcingIndex.chatSubtitle")}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { title: tr("sourcingIndex.ex1Title"), desc: tr("sourcingIndex.ex1Desc"), text: "Software Engineers in SF working at Series B companies, skilled in Python and Node.js" },
                                        { title: tr("sourcingIndex.ex2Title"), desc: tr("sourcingIndex.ex2Desc"), text: "Marketing Manager in Europe, German-speaking, working at a large enterprise" },
                                        { title: tr("sourcingIndex.ex3Title"), desc: tr("sourcingIndex.ex3Desc"), text: "Senior Scientist in Australia, 8+ years experience" },
                                        { title: tr("sourcingIndex.ex4Title"), desc: tr("sourcingIndex.ex4Desc"), text: "Consultant in London with 2+ years experience at top consulting firms" }
                                    ].map((ex, exIdx) => (
                                        <button
                                            key={exIdx}
                                            onClick={() => handleChatSend(ex.text)}
                                            className="p-6 bg-white rounded-2xl text-left border border-[#E0E0E0] hover:border-[#1976D2]/40 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group flex flex-col justify-between h-32"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-[#263238] group-hover:text-[#1976D2] transition-colors">{ex.title}</h4>
                                                <p className="text-xs text-[#9E9E9E] font-bold leading-normal">{ex.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-[#1976D2] font-bold opacity-0 group-hover:opacity-100 transition-all pt-2 mt-auto">
                                                {tr("sourcingIndex.generateWorkflow")} <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchPhase === "filters" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* User bubble representation */}
                                <div className="flex justify-end">
                                    <div className="bg-gradient-to-r from-[#1976D2] to-[#1565C0] text-white p-5 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-100 max-w-xl flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-white">ME</div>
                                        <p>{chatMessages[chatMessages.length - 1]?.text}</p>
                                    </div>
                                </div>

                                {/* AI response bubble & filters */}
                                <div className="flex justify-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B1D24] to-[#1E2A38] flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-lg border border-[#2A2D35]">AI</div>
                                    <div className="bg-white p-6 rounded-3xl border border-[#E0E0E0] shadow-xl shadow-slate-200/10 max-w-2xl w-full space-y-4">
                                        <p className="text-sm font-bold text-[#424242] flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 bg-[#1976D2] rounded-full animate-pulse shadow-glow" />
                                            {tr("sourcingIndex.mappedRules")}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 p-4 bg-[#FAFAFA]/80 rounded-2xl border border-[#E0E0E0]/50 shadow-inner">
                                            <span className="px-3 py-1.5 bg-[#E3F2FD] text-[#1976D2] font-bold text-xs rounded-xl border border-[#BBDEFB] shadow-sm flex items-center gap-1.5">
                                                <Briefcase className="w-3.5 h-3.5" /> {extractedFilters.title}
                                            </span>
                                            <span className="text-[#BDBDBD] font-bold text-xs">&middot;</span>
                                            <span className="px-3 py-1.5 bg-[#E3F2FD] text-[#1976D2] font-bold text-xs rounded-xl border border-[#BBDEFB] shadow-sm flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" /> {extractedFilters.location}
                                            </span>
                                            <span className="text-[#BDBDBD] font-bold text-xs">&middot;</span>
                                            <span className="px-3 py-1.5 bg-[#E3F2FD] text-[#1976D2] font-bold text-xs rounded-xl border border-[#BBDEFB] shadow-sm flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5" /> {extractedFilters.minExp}+ {tr("sourcingIndex.years")}
                                            </span>

                                            <button
                                                onClick={() => setIsFilterModalOpen(true)}
                                                className="ml-auto px-4 py-1.5 bg-white hover:bg-[#FAFAFA] border border-[#E0E0E0] text-[#1976D2] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                                            >
                                                {tr("sourcingIndex.editRule")}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setSearchPhase("initial")}
                                        className="px-6 py-3 bg-[#FAFAFA] hover:bg-[#EEEEEE] border border-[#E0E0E0] text-[#4F4F4F] text-sm font-bold rounded-xl transition-all"
                                    >
                                        {tr("sourcingIndex.resetSearch")}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            setSearchPhase("results");
                                            try {
                                                const res = await fetch(
                                                    `${API_BASE_URL}/api/v1/enterprise/sourcing/search?q=${encodeURIComponent(extractedFilters.title)}&location=${encodeURIComponent(extractedFilters.location)}&page=1&page_size=15&platform=all`
                                                );
                                                const data = res.ok ? await res.json() : [];
                                                setResults(Array.isArray(data) ? data : (data?.profiles ?? []));
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="px-8 py-3 bg-[#1976D2] hover:bg-[#1565C0] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                                    >
                                        {tr("sourcingIndex.runSearch")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 border-4 border-[#BBDEFB] rounded-full animate-pulse" />
                                    <div className="absolute inset-0 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#1976D2] animate-pulse" />
                                </div>
                                <h3 className="text-base font-bold text-[#263238] tracking-tight">{tr("sourcingIndex.gathering")}</h3>
                                <p className="text-xs text-[#9E9E9E] font-bold mt-1">{tr("sourcingIndex.crossReferencing")}</p>
                            </div>
                        )}

                        {searchPhase === "results" && !loading && (
                            <div className="space-y-6">
                                <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Users className="w-4 h-4" /> {tr("sourcingIndex.aiGeneratedResults")} ({results.length})
                                </p>
                                <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
                                    {results.map((profile, index) => (
                                        <div key={index} className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xl shadow-slate-200/5 transition-all flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                            {/* Candidate Top Header row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" className="rounded text-[#1976D2] border-[#E0E0E0] focus:ring-[#1976D2]" />
                                                    <h3 className="text-base font-bold text-[#263238] flex items-center gap-2">
                                                        {profile.full_name || tr("sourcingIndex.anonymous")}
                                                        {profile.platform && (
                                                            <PlatformLogoRenderer platform={profile.platform} className="w-4 h-4" />
                                                        )}
                                                    </h3>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => fetchDetails(profile.profile_url)}
                                                        className="p-2 bg-[#FAFAFA] hover:bg-[#EEEEEE] border border-[#E0E0E0] rounded-xl text-[#9E9E9E] hover:text-[#4F4F4F] transition-all shadow-sm flex items-center justify-center w-9 h-9"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (pinnedProfiles.some(p => p.profile_url === profile.profile_url)) {
                                                                setPinnedProfiles(pinnedProfiles.filter(p => p.profile_url !== profile.profile_url));
                                                            } else {
                                                                setPinnedProfiles([...pinnedProfiles, profile]);
                                                            }
                                                        }}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${pinnedProfiles.some(p => p.profile_url === profile.profile_url)
                                                                ? 'bg-[#1976D2] text-white border-[#1976D2] shadow-sm'
                                                                : 'bg-white text-[#616161] border-[#E0E0E0] hover:border-[#E0E0E0]'
                                                            }`}
                                                    >
                                                        <Pin className="w-3.5 h-3.5" />
                                                        {pinnedProfiles.some(p => p.profile_url === profile.profile_url) ? tr("sourcingIndex.shortlisted") : tr("sourcingIndex.shortlist")}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Profile core data row */}
                                            <div className="flex items-start gap-3 pl-7">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-xl object-cover border border-[#E0E0E0] shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] flex items-center justify-center text-[#9E9E9E] border border-[#E0E0E0] shadow-sm">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-[#424242]">{profile.headline || tr("sourcingIndex.professionalProfile")}</p>
                                                    <p className="text-xs text-[#9E9E9E] font-bold flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-[#BDBDBD]" /> {profile.location || tr("sourcingIndex.global")}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* AI Summary paragraph */}
                                            <div className="pl-7 pt-2 border-t border-[#EEEEEE] flex items-start gap-3 bg-[#E3F2FD]/20 p-4 rounded-xl border border-[#BBDEFB]/10">
                                                <Zap className="w-4 h-4 text-[#1976D2] shrink-0 mt-0.5" />
                                                <p className="text-xs text-[#4F4F4F] font-medium leading-relaxed">
                                                    {profile.ai_summary || (
                                                        <>
                                                            <strong className="text-[#263238]">{profile.full_name}</strong> {tr("sourcingIndex.basedIn")} <span className="px-1.5 py-0.5 bg-[#E3F2FD] text-[#1976D2] font-bold text-[10px] rounded border border-[#BBDEFB]">{profile.location || tr("sourcingIndex.global")}</span> {tr("sourcingIndex.accomplishedExpert")} <span className="px-1.5 py-0.5 bg-[#E3F2FD] text-[#1976D2] font-bold text-[10px] rounded border border-[#BBDEFB]">{profile.platform}</span>.
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#FAFAFA] p-4 rounded-2xl flex items-center gap-2 text-xs font-bold text-[#616161]">
                                            <div className="w-2 h-2 bg-[#9E9E9E] rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-[#9E9E9E] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-[#9E9E9E] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chat Prompt Layout */}
                    {searchPhase === "initial" && (
                        <form onSubmit={handleChatSend} className="max-w-4xl mx-auto relative group w-full">
                            <div className="border-2 border-[#1976D2]/20 group-focus-within:border-[#1976D2] rounded-2xl bg-white shadow-xl shadow-slate-200/5 p-6 transition-all">
                                <textarea
                                    placeholder={tr("sourcingIndex.chatPlaceholder")}
                                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[#424242] font-bold text-base placeholder:text-[#BDBDBD] resize-none h-16"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleChatSend(e);
                                        }
                                    }}
                                    disabled={chatLoading}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="w-11 h-11 rounded-full bg-[#1976D2] hover:bg-[#1565C0] text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-95 shadow-lg shadow-indigo-200"
                                    >
                                        {chatLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl border border-[#E0E0E0] max-w-4xl w-full flex flex-col h-[600px] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[#E0E0E0]">
                            <div>
                                <h3 className="text-lg font-bold text-[#212121]">{tr("sourcingIndex.editFilters")}</h3>
                                <p className="text-xs text-[#9E9E9E] font-bold mt-0.5">{tr("sourcingIndex.approxMatches")}</p>
                            </div>
                            <button
                                onClick={() => setIsFilterModalOpen(false)}
                                className="px-5 py-2 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                            >
                                {tr("sourcingIndex.saveChanges")}
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex overflow-hidden">

                            {/* Right Settings */}
                            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="sourcing-min-exp" className="text-xs font-bold text-[#4F4F4F] uppercase tracking-wider">{tr("sourcingIndex.minExp")}</label>
                                        <input
                                            id="sourcing-min-exp"
                                            type="number"
                                            value={extractedFilters.minExp}
                                            onChange={(e) => setExtractedFilters({ ...extractedFilters, minExp: e.target.value })}
                                            className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl py-3 px-4 text-sm font-semibold text-[#424242] focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="sourcing-max-exp" className="text-xs font-bold text-[#4F4F4F] uppercase tracking-wider">{tr("sourcingIndex.maxExp")}</label>
                                        <input
                                            id="sourcing-max-exp"
                                            type="text"
                                            placeholder={tr("sourcingIndex.maxExpPlaceholder")}
                                            className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl py-3 px-4 text-sm font-semibold text-[#424242] focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="sourcing-job-title" className="text-xs font-bold text-[#4F4F4F] uppercase tracking-wider">{tr("sourcingIndex.jobTitle")}</label>
                                    <input
                                        id="sourcing-job-title"
                                        type="text"
                                        value={extractedFilters.title}
                                        onChange={(e) => setExtractedFilters({ ...extractedFilters, title: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl py-3 px-4 text-sm font-semibold text-[#424242] focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="sourcing-location" className="text-xs font-bold text-[#4F4F4F] uppercase tracking-wider">{tr("sourcingIndex.location")}</label>
                                    <input
                                        id="sourcing-location"
                                        type="text"
                                        value={extractedFilters.location}
                                        onChange={(e) => setExtractedFilters({ ...extractedFilters, location: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-xl py-3 px-4 text-sm font-semibold text-[#424242] focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedProfileDetails && (
                <div
                    role="button"
                    tabIndex={0}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end"
                    onClick={() => setSelectedProfileDetails(null)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedProfileDetails(null);
                    }}
                >
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white h-full w-full max-w-lg shadow-2xl p-6 overflow-y-auto border-l border-[#E0E0E0] flex flex-col relative animate-in slide-in-from-right duration-300"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-[#212121] tracking-tight">
                                    {selectedProfileDetails.title || tr("sourcingIndex.scrapedProfile")}
                                </h2>
                                <a
                                    href={selectedProfileDetails.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-[#1976D2] hover:underline font-bold mt-1 inline-flex items-center gap-1 uppercase tracking-wider"
                                >
                                    {tr("sourcingIndex.viewOriginal")}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>
                            <button
                                onClick={() => setSelectedProfileDetails(null)}
                                className="w-9 h-9 flex items-center justify-center bg-[#FAFAFA] hover:bg-[#EEEEEE] rounded-xl transition-all border border-[#E0E0E0]"
                            >
                                <X className="w-4 h-4 text-[#616161]" />
                            </button>
                        </div>

                        {selectedProfileDetails.error ? (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {selectedProfileDetails.error}
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1">
                                {selectedProfileDetails.sections && selectedProfileDetails.sections.map((sec: string, idx: number) => {
                                    const lines = sec.split("\n");
                                    const firstLine = lines[0];
                                    const isCategory = firstLine === firstLine.toUpperCase() && firstLine.length > 2 && firstLine !== "INFO";

                                    const title = isCategory ? firstLine : "INFO";
                                    const content = isCategory ? lines.slice(1).join("\n") : sec;

                                    let titleColor = "text-[#1976D2]";
                                    if (title === "EXPERIENCE") titleColor = "text-emerald-600";
                                    if (title === "EDUCATION") titleColor = "text-blue-600";
                                    if (title === "SKILLS") titleColor = "text-purple-600";

                                    return (
                                        <div
                                            key={idx}
                                            className="p-4 bg-[#FAFAFA]/50 rounded-2xl border border-[#E0E0E0]/70 hover:bg-white hover:border-[#E0E0E0] transition-all group"
                                        >
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className={`text-[9px] font-bold tracking-widest ${titleColor} uppercase`}>
                                                    {title}
                                                </span>
                                            </div>
                                            <div className="space-y-2 mt-1">
                                                {content.split("\n").map((line, lIdx) => {
                                                    const text = line.trim();
                                                    if (!text) return null;

                                                    const isDate = /^[A-Za-z]{3}\s\d{4}\s*-\s*([A-Za-z]{3}\s\d{4}|Present)/.test(text) || /\d{4}\s*–\s*\d{4}/.test(text) || /^\d{4}\s*-\s*\d{4}$/.test(text);

                                                    if (isDate) {
                                                        return (
                                                            <p key={lIdx} className="text-[10px] font-bold text-[#9E9E9E] flex items-center gap-1.5 mt-1.5 mb-1 bg-[#EEEEEE]/50 w-fit px-2 py-0.5 rounded-md border border-[#E0E0E0]/40">
                                                                <Calendar className="w-3 h-3 text-[#9E9E9E]" />
                                                                {text}
                                                            </p>
                                                        );
                                                    }

                                                    const isShortTitle = text.length < 55 && !text.includes(".") && !text.includes(",") && !text.includes("http");

                                                    if (isShortTitle) {
                                                        return (
                                                            <p key={lIdx} className="text-[11px] font-bold text-[#263238] mt-4 first:mt-0 tracking-tight leading-snug">
                                                                {text}
                                                            </p>
                                                        );
                                                    }

                                                    return (
                                                        <p key={lIdx} className="text-[11px] font-medium text-[#4F4F4F] leading-relaxed pl-2 border-l border-[#E0E0E0] hover:border-indigo-400 transition-colors">
                                                            {text}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-[#E0E0E0] flex justify-end">
                            <button
                                onClick={() => setSelectedProfileDetails(null)}
                                className="w-full py-3.5 bg-slate-950 text-white rounded-xl font-bold text-xs hover:bg-[#263238] transition-all active:scale-98 shadow-lg shadow-slate-200 uppercase tracking-widest"
                            >
                                {tr("sourcingIndex.dismiss")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
