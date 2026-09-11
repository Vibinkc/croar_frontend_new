"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    Sparkles, 
    Send, 
    Zap, 
    ExternalLink, 
    MapPin,
    Award,
    ArrowRight,
    CircleCheck,
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
    Share,
    Eye,
    Building,
    Pin,
    Trash2,

    Mail,
    Phone,
    Globe,
    BarChart,
    ThumbsUp,
    Plus,
    List,
    Table2,
    ChevronUp
} from "@/components/icons";
import { Chart } from "react-google-charts";
import { API_BASE_URL } from "@/lib/api-config";
import { PageHelp, Icon } from "@/components/ds";
import { stripTagsAndEntities } from "@/utils/html";
import { useAutoFocus } from "@/hooks/useAutoFocus";

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
    origin?: "client_db" | "croar_db" | "fresh";
    last_scraped_at?: string | null;
    [key: string]: any;
}

/** Human-friendly "how long ago we last pulled this profile" (e.g. "3d ago"). */
const timeAgo = (iso?: string | null): string | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return "just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
};

/** Label + color for where a profile came from (client history vs global pool vs live). */
const originMeta = (origin?: string): { label: string; cls: string } | null => {
    if (origin === "client_db") return { label: "From your database", cls: "bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]" };
    if (origin === "croar_db") return { label: "From Croar database", cls: "bg-[#EFF4FF] text-[#3538CD] border-[#C7D7FE]" };
    if (origin === "fresh") return { label: "Freshly sourced", cls: "bg-[#FEF6EE] text-[#D84315] border-[#F9DBAF]" };
    return null;
};

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

// ---------------------------------------------------------------------------
// Criteria engine — rank/evaluate each profile against user-defined ranking criteria.
// Croar has no per-criterion LLM grader, so we evaluate deterministically from the
// data we DO have (skills, headline, ai_summary, company, raw_data). Each criterion
// yields a pass ("👍" + a short reason) or "unknown" (no clear signal).
// ---------------------------------------------------------------------------

type CriterionVerdict = { status: "pass" | "unknown"; reason: string };

/** A short display label for a criterion string (e.g. the full sentence → "Python"). */
const criterionLabel = (c: string): string => {
    const t = (c || "").trim();
    // Pull a likely skill/keyword: last capitalized-or-tech token, else first few words.
    const m = t.match(/\b([A-Za-z][A-Za-z0-9+.#]{1,}(?:\.js)?)\b(?=[^A-Za-z0-9]*$)/);
    if (t.length <= 22) return t;
    return (m?.[1] || t.split(/\s+/).slice(0, 2).join(" ")).replace(/[.]$/, "");
};

/** The keywords we scan a profile for, derived from a criterion. */
const criterionKeywords = (c: string): string[] => {
    const label = criterionLabel(c).toLowerCase();
    const extra = label.replace(/\.js$/, "").replace(/[^a-z0-9+.# ]/g, " ").trim();
    return Array.from(new Set([label, extra].filter(Boolean)));
};

const evaluateCriterion = (profile: Profile, criterion: string): CriterionVerdict => {
    const kws = criterionKeywords(criterion);
    const skills = (profile.skills || []).map((s) => (s || "").toLowerCase());
    const inSkills = kws.some((k) => skills.some((s) => s.includes(k)));
    if (inSkills) {
        return { status: "pass", reason: `${criterionLabel(criterion)} is listed in Skills, indicating hands-on experience.` };
    }
    const hay = [profile.headline, profile.ai_summary, profile.company, profile.raw_data?.bio, profile.raw_data?.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    if (kws.some((k) => hay.includes(k))) {
        return { status: "pass", reason: `${criterionLabel(criterion)} appears in their profile, suggesting relevant experience.` };
    }
    return { status: "unknown", reason: `No clear signal for ${criterionLabel(criterion)} in this profile.` };
};

/** 0–100 match score = share of criteria this profile passes. No criteria → null. */
const profileMatchPercent = (profile: Profile, criteria: string[]): number | null => {
    if (!criteria.length) return null;
    const passed = criteria.filter((c) => evaluateCriterion(profile, c).status === "pass").length;
    return Math.round((passed / criteria.length) * 100);
};

/** Short role label for the filters chip (e.g. "Marketing Manager in Europe…" → "Marketing Manager"). */
const deriveRoleLabel = (text: string): string => {
    const t = (text || "").trim();
    const head = t.split(/\s+(?:in|with|working|skilled|based|at)\b|,/i)[0].trim();
    return head.length >= 2 && head.length <= 40 ? head : t.slice(0, 28);
};

/** Best-effort location for the filters chip ("…in Europe, German-speaking" → "Europe"). */
const deriveLocationLabel = (text: string): string | null => {
    const m = (text || "").match(/\bin\s+([A-Za-z][A-Za-z .'-]+?)(?:\s*,|\s+(?:with|working|skilled|and|at)\b|$)/i);
    const loc = m?.[1]?.trim();
    return loc && loc.length <= 30 ? loc : null;
};

/** Best-effort: pull ranking criteria (skills + notable qualifiers) out of a free-text query. */
const deriveCriteriaFromQuery = (text: string): string[] => {
    const t = (text || "").trim();
    if (!t) return [];
    const out: string[] = [];
    // Skills clause: "skilled in X, Y and Z" / "experience in X" / "expertise in X".
    const m = t.match(/(?:skilled in|proficient in|experience (?:in|with)|expertise in|using|knows)\s+(.+?)(?:\.|$)/i);
    if (m?.[1]) {
        out.push(
            ...m[1]
                .split(/,|\band\b|\bor\b|\/|&|\+/i)
                .map((s) => s.replace(/[.]+$/, "").trim())
                .filter((s) => s.length > 1 && s.length < 32),
        );
    }
    // Language ("German-speaking" → "German").
    const lang = t.match(/\b([A-Z][a-z]+)-speaking\b/);
    if (lang?.[1]) out.push(lang[1]);
    // Company size / funding-stage qualifiers used to rank ("large enterprise" → "Enterprise").
    if (/\benterprise\b/i.test(t)) out.push("Enterprise");
    if (/\bstart-?up\b/i.test(t)) out.push("Startup");
    const stage = t.match(/\bSeries [A-D]\b/i);
    if (stage) out.push(stage[0]);
    return Array.from(new Set(out.map((s) => s.trim()).filter(Boolean))).slice(0, 6);
};

export default function ProfileSourcingChatPage() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [searchPhase, setSearchPhase] = useState<"initial" | "filters" | "results">("initial");
    const [query, setQuery] = useState("");
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
    const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
    const [jobs, setJobs] = useState<{id: string, title: string}[]>([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const shortlistNameRef = useAutoFocus<HTMLInputElement>();
    // When we arrived here sourcing FOR a specific job (from the Pipeline / a job page), lock the
    // shortlist to that one job. When the user came in freely and searched, this stays null (all jobs).
    const [lockedJobId, setLockedJobId] = useState<string | null>(null);
    // Mirror of lockedJobId that's always current — saveSession runs inside an async search closure
    // and would otherwise capture a stale (null) lockedJobId, saving the session without its job.
    const lockedJobIdRef = useRef<string | null>(null);
    const lockJob = (id: string | null) => {
        lockedJobIdRef.current = id;
        setLockedJobId(id);
    };
    const [profileToShortlist, setProfileToShortlist] = useState<Profile | null>(null);
    const [isShortlisting, setIsShortlisting] = useState(false);
    // profile_url -> the job id it was shortlisted to, so the card can show "Shortlisted" + a link
    // to that job's Profile Sourcing tab.
    const [shortlisted, setShortlisted] = useState<Record<string, string>>({});


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
    // "New Search" dropdown (saved searches + filter), matching the reference searches menu.
    const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
    const [searchMenuFilter, setSearchMenuFilter] = useState("");
    const [shareCopied, setShareCopied] = useState(false);
    // Public "Share link" modal.
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [shareCreating, setShareCreating] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [searchError, setSearchError] = useState<string | null>(null);
    // Ranking criteria (ordered most→least important) used to score & explain each match.
    const [criteria, setCriteria] = useState<string[]>([]);
    const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
    const [newCriterion, setNewCriterion] = useState("");
    // Results layout: "list" (rich cards) or "table" (per-criterion columns + Match %).
    const [viewMode, setViewMode] = useState<"list" | "table">("list");
    const itemsPerPage = 10;

    // Sourcing can scrape live and take a while. Fetch with a generous client timeout so the request
    // never hangs forever, and surface a clear message instead of a silent empty list.
    const SEARCH_TIMEOUT_MS = 240000; // 4 min
    const fetchSourcing = async (url: string): Promise<Response> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
        try {
            return await fetch(url, {
                signal: controller.signal,
                ...(token ? { headers: { "Authorization": `Bearer ${token}` } } : {}),
            });
        } finally {
            clearTimeout(timer);
        }
    };

    // Load sessions on mount
    useEffect(() => {
        if (token) {
            fetchSessions();
            fetchShortlisted();
        }
    }, [token]);

    // Load which candidates are already shortlisted (and to which job) so cards show "Shortlisted"
    // even after reloading / reopening a search from History.
    const fetchShortlisted = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const map: Record<string, string> = {};
                (Array.isArray(data) ? data : []).forEach((s: { profile?: { profile_url?: string }; job_id?: string }) => {
                    const url = s?.profile?.profile_url;
                    if (url && s.job_id) map[url] = s.job_id;
                });
                setShortlisted(map);
            }
        } catch {
            /* ignore */
        }
    };

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
        setSearchError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sessions/${sessionId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentSessionId(sessionId);
                setChatMessages(data.messages || []);
                // Re-lock the shortlist to the session's job (if it was a job-specific search); a free
                // search has no job_id, so unlock and let the user pick any job.
                if (data.job_id) {
                    setSelectedJobId(data.job_id);
                    lockJob(data.job_id);
                } else {
                    lockJob(null);
                }
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

    // Create a PUBLIC read-only snapshot of the current search (up to 30 profiles) and open the
    // "Share public link" modal with the shareable URL.
    const openShareModal = async () => {
        setIsShareModalOpen(true);
        setShareError(null);
        setShareUrl("");
        setShareCreating(true);
        try {
            const q = query || extractedFilters.title || "";
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    query: q,
                    title: q.slice(0, 60),
                    criteria,
                    profiles: results.slice(0, 30).map((p) => {
                        const { raw_data, html, ...rest } = p as any;
                        void raw_data; void html;
                        return rest;
                    }),
                }),
            });
            if (!res.ok) throw new Error("share failed");
            const data = await res.json();
            setShareUrl(`${window.location.origin}/share/sourcing/${data.share_id}`);
        } catch {
            setShareError(tr("sourcingChat.shareCreateError"));
        } finally {
            setShareCreating(false);
        }
    };

    const copyShareUrl = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 1500);
        } catch {
            /* ignore */
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
                    // The original query text — shown as the subtitle in the New Search dropdown.
                    query: messages.find((m: any) => m?.role === "user")?.content || title,
                    messages: slimMessages,
                    job_id: lockedJobIdRef.current, // ref = always current (state may be stale in this async closure)
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
        if (!window.confirm(tr("sourcingChat.confirmDeleteHistory"))) return;
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
                // Don't default to the first job when we arrived sourcing FOR a specific job
                // (Pipeline / freshly-created job hand-off) — that would silently switch the search
                // to the wrong job.
                if (data.length > 0 && !lockedJobIdRef.current) setSelectedJobId(data[0].id);
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
                // Mark the candidate on the card (shows "Shortlisted" + a link to the job's tab).
                const url = profileToShortlist.profile_url;
                if (url) setShortlisted(prev => ({ ...prev, [url]: selectedJobId }));
                setIsShortlistModalOpen(false);
                setProfileToShortlist(null);
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || tr("sourcingChat.shortlistError"));
            }
        } catch (e) {
            console.error("Failed to shortlist", e);
            alert(tr("sourcingChat.shortlistErrorConn"));
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
        setSearchError(null);
        setCriteria([]); // fresh search starts with no ranking criteria
        // A fresh manual search is a FREE search (not tied to any job) — drop any job lock carried in
        // from a job hand-off/history so the shortlist modal shows ALL jobs to choose from.
        lockJob(null);
    };

    // Step 1 of the flow: from the launcher, a typed query opens the SEARCH BUILDER (review the
    // auto-set filters + ranking criteria, then Run Search). It does NOT fetch yet — that happens on
    // Run Search. (The direct-fetch path `handleChatSend` is still used by Run Search, the JD/Boolean
    // modals, and the job hand-off auto-start.)
    const openSearchBuilder = (text: string) => {
        const t = (text || "").trim();
        if (!t) return;
        setQuery(t);
        setExtractedFilters({
            title: t, // full query drives the search; the chips DISPLAY short derived labels
            location: deriveLocationLabel(t) || "Global",
            minExp: "3",
            platform: "All",
        });
        setCriteria((prev) => (prev.length ? prev : deriveCriteriaFromQuery(t)));
        setShowSuggestions(false);
        setSearchPhase("filters");
    };

    const handleChatSend = (text: string) => {
        setQuery(text);
        setExtractedFilters({
            title: text,
            location: "Global",
            minExp: "3",
            platform: "All"
        });
        // Auto-seed ranking criteria from the query (e.g. "…skilled in Python and Node.js") unless
        // the user already curated their own criteria for this session.
        setCriteria((prev) => (prev.length ? prev : deriveCriteriaFromQuery(text)));
        setSearchPhase("results");
        setCurrentPage(1);
        
        const fetchProfiles = async () => {
            setLoading(true);
            setSearchError(null);
            try {
                const res = await fetchSourcing(
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
                setResults([]);
                setSearchError(
                    e instanceof DOMException && e.name === "AbortError"
                        ? tr("sourcingChat.searchTimeout")
                        : tr("sourcingChat.searchError2")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    };

    const fetchProfilesByPage = async (pageIndex: number, persist: boolean = false) => {
        setLoading(true);
        setSearchError(null);
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

            const res = await fetchSourcing(
                `${API_BASE_URL}/api/v1/enterprise/sourcing/chat_db?q=${encodeURIComponent(finalQuery)}&page=${pageIndex}&limit=${itemsPerPage}`
            );
            if (!res.ok) throw new Error("Database query failed");
            const data = await res.json();
            const newResults = data.profiles || [];
            setResults(newResults);
            setTotalCount(data.total_count || 0);

            // On the initial run (from the builder's "Run Search"), persist this search to history
            // and refresh the map. Pagination re-fetches don't persist (persist=false).
            if (persist) {
                const q = query || extractedFilters.title || finalQuery;
                const title = q.substring(0, 40) + (q.length > 40 ? "..." : "");
                const newMessages = [
                    { role: "user", content: q, timestamp: new Date().toISOString() },
                    { role: "ai", content: `Found ${data.total_count || newResults.length} matches for "${q}"`, results: newResults, timestamp: new Date().toISOString() },
                ];
                setChatMessages(newMessages);
                saveSession(newMessages, title);
                fetchDistribution(q);
            }
        } catch (e) {
            console.error(e);
            setResults([]);
            setSearchError(
                e instanceof DOMException && e.name === "AbortError"
                    ? tr("sourcingChat.searchTimeout")
                    : tr("sourcingChat.searchError2")
            );
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
        "US": "#1E88E5", // Blue
        "IN": "#FB8C00", // Amber
        "GB": "#E53935", // Red
        "DE": "#43A047", // Emerald
        "CA": "#42A5F5", // Violet
        "AU": "#EC4899", // Pink
        "BR": "#06B6D4", // Cyan
        "FR": "#F97316", // Orange
        "JP": "#1976D2", // Indigo
        "CN": "#14B8A6", // Teal
        "SG": "#84CC16", // Lime
        "AE": "#0EA5E9", // Sky
        "NL": "#D946EF", // Fuchsia
        "ES": "#F43F5E", // Rose
        "IT": "#22C55E", // Green
        "CH": "#616161", // Slate
        "SE": "#A855F7", // Purple
        "IL": "#475569"  // Slate-600
    };

    // Aggregated real per-country candidate counts, derived from the backend
    // distribution (preferred) or, failing that, the real loaded result page.
    // No hardcoded sample countries — an empty search yields an empty list.
    const countryCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        // Use fullDistribution from aggregation, fallback to current results page
        const sourceData = fullDistribution.length > 0 ? fullDistribution : results;

        sourceData.forEach(item => {
            const locStr = item.location || "";
            const countryCode = extractCountry(locStr);
            if (countryCode) {
                const addCount = item.count || 1;
                counts[countryCode] = (counts[countryCode] || 0) + addCount;
            }
        });

        // [code, realCount] sorted by real candidate count (desc)
        return Object.entries(counts).sort((a, b) => b[1] - a[1]) as [string, number][];
    }, [results, fullDistribution]);

    const mapData = useMemo(() => {
        // GeoChart with specific colors needs values that map to a color axis
        const data: any[] = [["Country", "ColorValue", { role: "tooltip", type: "string", p: { html: true } }]];

        // We use the index as a color value to force specific colors from the axis
        countryCounts.forEach(([code, count], index) => {
            data.push([
                code,
                index, // This index will map to a specific color in the options
                `<div style="padding:10px; font-family: sans-serif;">
                    <b style="color:#37474F; font-size:14px;">${COUNTRY_NAMES[code] || code}</b><br/>
                    <span style="color:#616161; font-size:12px; font-weight:800;">${count} Candidates</span>
                </div>`
            ]);
        });

        return data;
    }, [countryCounts]);

    const runSearch = () => {
        setSearchPhase("results");
        setCurrentPage(1);
        fetchProfilesByPage(1, true); // persist to history + populate the Insights map
    };

    // Reset to page 1 whenever the platform filter changes so the paginated view stays in range.
    useEffect(() => {
        setCurrentPage(1);
    }, [extractedFilters.platform]);

    // Hand-off from job creation / pipeline: a job can launch sourcing here.
    // "autostart" runs the JD-based AI search immediately; otherwise we just
    // pre-select the job and prefill the search box for a manual search.
    // Guarded so it runs EXACTLY once — otherwise React StrictMode's double-invoke (dev) runs the
    // hand-off, deletes the flag, then re-runs and wrongly restores a previous search.
    const initRan = useRef(false);
    useEffect(() => {
        if (!token || initRan.current) return;
        initRan.current = true;
        let raw: string | null = null;
        try { raw = sessionStorage.getItem("croar_source_job"); } catch { /* ignore */ }
        if (!raw) {
            // No fresh hand-off → restore the last in-progress search so it survives leaving the page
            // (e.g. clicking "View in job") and coming back, instead of resetting to a blank page.
            let sid: string | null = null;
            try { sid = sessionStorage.getItem("croar.sourcing.session"); } catch { /* ignore */ }
            if (sid) loadSession(sid);
            return;
        }
        try { sessionStorage.removeItem("croar_source_job"); } catch { /* ignore */ }
        try {
            const ctx = JSON.parse(raw);
            if (ctx?.id) {
                setSelectedJobId(ctx.id);
                lockJob(ctx.id); // came in FOR this job → shortlist only to it (ref set synchronously)
            }
            // Strip HTML/entities so a rich-text JD never leaks tags into the search query.
            const clean = (s: string) => stripTagsAndEntities(s);
            const jd = (ctx?.description || "").trim();
            const title = clean(ctx?.title || "");
            const skills = clean(ctx?.skills || "");
            if (ctx?.autostart && (title || skills || jd)) {
                if (jd) setJobDescription(jd); // keep the full JD for the JD box / context
                // Search on the ROLE + SKILLS only — the raw JD is messy HTML and matches poorly.
                const searchQuery = [title, skills].filter(Boolean).join(" ") || clean(jd);
                handleChatSend(searchQuery);
            } else if (title) {
                setQuery(title);
            }
        } catch (e) {
            console.error("Failed to start sourcing from job hand-off:", e);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Remember the current session id so the hand-off effect above can restore it on return. Skip the
    // first run so we don't wipe the stored id before the restore has read it.
    const sessionPersistReady = useRef(false);
    useEffect(() => {
        if (!sessionPersistReady.current) {
            sessionPersistReady.current = true;
            return;
        }
        try {
            if (currentSessionId) sessionStorage.setItem("croar.sourcing.session", currentSessionId);
            else sessionStorage.removeItem("croar.sourcing.session");
        } catch {
            /* ignore */
        }
    }, [currentSessionId]);

    // A search returns the FULL match set in one call; the platform filter narrows it client-side.
    const filteredResults = results.filter(
        profile => extractedFilters.platform === "All"
            || (profile.platform && profile.platform.toLowerCase().includes(extractedFilters.platform.toLowerCase()))
    );
    const platformFilterActive = extractedFilters.platform !== "All";
    // "Profiles (N)" is the full (filtered) match count; the list below is paginated 10 per page.
    const profilesCount = filteredResults.length || totalCount;
    // When ranking criteria are set, order matches best-first by their Match % (stable otherwise).
    const rankedResults = useMemo(() => {
        if (!criteria.length) return filteredResults;
        return filteredResults
            .map((p, i) => ({ p, i, score: profileMatchPercent(p, criteria) ?? 0 }))
            .sort((a, b) => b.score - a.score || a.i - b.i)
            .map((x) => x.p);
    }, [filteredResults, criteria]);
    // Pagination is CLIENT-SIDE over the already-fetched set — page 2 shows the next 10, etc. (No
    // re-fetch per page, which previously re-ran the whole search and returned an inconsistent set.)
    const displayedResults = rankedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Skills frequency across the current match pool (for the Insights "Skills" bar chart).
    const skillStats = useMemo(() => {
        const counts = new Map<string, number>();
        for (const p of filteredResults) {
            const seen = new Set<string>();
            for (const raw of p.skills || []) {
                const s = (raw || "").trim();
                if (!s) continue;
                const key = s.toLowerCase();
                if (seen.has(key)) continue; // count each skill once per profile
                seen.add(key);
                counts.set(s, (counts.get(s) || 0) + 1);
            }
        }
        const total = filteredResults.length || 1;
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => ({ skill, count, pct: Math.round((count / total) * 100) }));
    }, [filteredResults]);

    // AI-style key takeaways, derived from the match pool (top skills, top location, seniority mix).
    const keyTakeaways = useMemo(() => {
        const out: string[] = [];
        const n = filteredResults.length;
        if (!n) return out;
        if (skillStats.length) {
            const top = skillStats.slice(0, 3).map((s) => `${s.skill} (${s.pct}%)`).join(", ");
            out.push(tr("sourcingChat.takeawaySkills").replace("{skills}", top));
        }
        if (countryCounts.length) {
            const [code, count] = countryCounts[0];
            out.push(tr("sourcingChat.takeawayCountry").replace("{country}", COUNTRY_NAMES[code] || code).replace("{count}", String(count)));
        }
        const senior = filteredResults.filter((p) => /senior|lead|principal|staff|head|director/i.test(`${p.headline || ""} ${p.ai_summary || ""}`)).length;
        if (senior) out.push(tr("sourcingChat.takeawaySenior").replace("{pct}", String(Math.round((senior / n) * 100))));
        const withEmail = filteredResults.filter((p) => p.email).length;
        if (withEmail) out.push(tr("sourcingChat.takeawayEmail").replace("{withEmail}", String(withEmail)).replace("{total}", String(n)));
        return out;
    }, [filteredResults, skillStats, countryCounts]);

    // Active-filter count for the "Filters" badge (was hardcoded to 2).
    const activeFilterCount = [
        extractedFilters.title.trim() !== "",
        extractedFilters.location.trim() !== "" && extractedFilters.location !== "Global",
        Number(extractedFilters.minExp) > 0,
        platformFilterActive,
    ].filter(Boolean).length;

    return (
        <div className="flex flex-col h-full bg-[#F5F6F8] overflow-hidden animate-in fade-in duration-500">
            <style dangerouslySetInnerHTML={{ __html: `
                main {
                    background-color: white !important;
                }
            ` }} />

            {/* Page header */}
            <header className="sticky top-0 z-20 px-6 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4 shrink-0">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight flex items-center gap-2.5">
                            {tr("sourcingChat.aiSourcingTitle")}
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)" }}>{tr("sourcingChat.beta")}</span>
                        </h1>
                        <PageHelp title={tr("sourcingChat.helpTitle")}>
                            <p>{tr("sourcingChat.helpBody")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("sourcingChat.subtitle")}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                        href="/enterprise/sourcing/shortlisted"
                        title={tr("sourcingChat.viewShortlistedTitle")}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-[13px] font-semibold transition-all border shadow-sm bg-white text-[#4F4F4F] border-[#E0E0E0] hover:bg-[#FAFAFA]"
                    >
                        <Bookmark className="w-4 h-4" /> {tr("sourcingChat.shortlist")}
                    </Link>
                    {searchPhase === "results" && (
                        <button
                            onClick={openShareModal}
                            title={tr("sourcingChat.shareTitle")}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-[13px] font-semibold transition-all border shadow-sm bg-white text-[#4F4F4F] border-[#E0E0E0] hover:bg-[#FAFAFA]"
                        >
                            <Share className="w-4 h-4" /> {tr("sourcingChat.share")}
                        </button>
                    )}
                    <div className="relative">
                        <div className="flex items-center bg-[#1976D2] rounded-[4px] shadow-[0_4px_12px_rgba(25,118,210,0.28)]">
                            <button
                                onClick={createNewChat}
                                className="inline-flex items-center gap-2 h-9 pl-4 pr-3 text-white text-[13px] font-semibold hover:bg-[#1565C0] rounded-l-[10px] transition-colors"
                            >
                                <Plus className="w-4 h-4" /> {tr("sourcingChat.newSearch")}
                            </button>
                            <button
                                onClick={() => setIsSearchMenuOpen((v) => !v)}
                                aria-label={tr("sourcingChat.showSavedSearches")}
                                aria-expanded={isSearchMenuOpen}
                                className="h-9 px-2 border-l border-white/25 text-white hover:bg-[#1565C0] rounded-r-[10px] transition-colors"
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform ${isSearchMenuOpen ? "rotate-180" : ""}`} />
                            </button>
                        </div>
                        {isSearchMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSearchMenuOpen(false)} aria-hidden />
                                <div className="absolute right-0 top-11 z-50 w-[380px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-3 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <input
                                        value={searchMenuFilter}
                                        onChange={(e) => setSearchMenuFilter(e.target.value)}
                                        placeholder={tr("sourcingChat.findSearches")}
                                        ref={shortlistNameRef}
                                        className="w-full h-10 px-3 rounded-[4px] border border-[#1976D2]/50 focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 text-[13px] text-[#263238] placeholder:text-[#9E9E9E] outline-none mb-2"
                                    />
                                    <div className="max-h-[300px] overflow-y-auto -mx-1 px-1">
                                        {(() => {
                                            const q = searchMenuFilter.trim().toLowerCase();
                                            const list = sessions.filter((s) => !q || `${s.title || ""} ${s.query || ""}`.toLowerCase().includes(q));
                                            if (list.length === 0) {
                                                return <p className="text-[12.5px] text-[#757575] px-3 py-8 text-center">{sessions.length ? tr("sourcingChat.noMatchingSearches") : tr("sourcingChat.noSavedSearches")}</p>;
                                            }
                                            return list.map((s) => (
                                                <button
                                                    key={s.session_id}
                                                    onClick={() => { loadSession(s.session_id); setIsSearchMenuOpen(false); setSearchMenuFilter(""); }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-[4px] hover:bg-[#FAFAFA] transition-colors ${currentSessionId === s.session_id ? "bg-[#F3F9FE]" : ""}`}
                                                >
                                                    <div className="text-[14px] font-semibold text-[#212121] truncate">{s.title || tr("sourcingChat.untitledSearch")}</div>
                                                    {s.query && <div className="text-[12px] text-[#757575] truncate mt-0.5">{s.query}</div>}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                    <div className="border-t border-[#E0E0E0] mt-2 pt-2">
                                        <button
                                            onClick={() => { createNewChat(); setIsSearchMenuOpen(false); setSearchMenuFilter(""); }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-[#FAFAFA] text-[#1976D2] text-[14px] font-semibold transition-colors"
                                        >
                                            {tr("sourcingChat.newSearchMenu")} <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Workspace */}
            <div className="flex-1 min-h-0 p-4 md:p-6">
            <div className="flex gap-6 h-full max-w-[1600px] mx-auto w-full">

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden">

                {searchPhase === "initial" && (
                    <div className="flex-1 overflow-y-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="min-h-full flex flex-col justify-center space-y-4 max-w-4xl mx-auto w-full py-4">
                        <div className="text-center max-w-xl mx-auto">
                            <h2 className="text-[22px] font-extrabold text-center text-[#212121] tracking-[-0.5px] mb-2">{tr("sourcingChat.greetingWhoLooking")}</h2>
                        </div>

                        <div className="flex items-center justify-center gap-2.5 flex-wrap">
                            <button 
                                onClick={() => setIsJobModalOpen(true)} 
                                className="flex items-center gap-2 px-3.5 py-1.5 border border-[#E0E0E0] rounded-[4px] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] hover:border-[#BBDEFB]/80 transition-colors shadow-sm"
                            >
                                <FileText className="w-3.5 h-3.5 text-[#E53935]" /> {tr("sourcingChat.jobDescriptionBtn")}
                            </button>
                            <button 
                                onClick={() => setIsBooleanModalOpen(true)} 
                                className="flex items-center gap-2 px-3.5 py-1.5 border border-[#E0E0E0] rounded-[4px] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] hover:border-[#BBDEFB]/80 transition-colors shadow-sm"
                            >
                                <span className="text-[#2E7D32] font-bold text-xs">Σ</span> {tr("sourcingChat.boolean")}
                            </button>
                            <button 
                                onClick={() => setIsCompetitorModalOpen(true)} 
                                className="flex items-center gap-2 px-3.5 py-1.5 border border-[#E0E0E0] rounded-[4px] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] hover:border-[#BBDEFB]/80 transition-colors shadow-sm"
                            >
                                <Target className="w-3.5 h-3.5 text-[#1976D2]" /> {tr("sourcingChat.skillMapping")}
                            </button>

                            <button 
                                onClick={() => setIsFilterModalOpen(true)} 
                                className="flex items-center gap-2 px-3.5 py-1.5 border border-[#E0E0E0] rounded-[4px] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] hover:border-[#BBDEFB]/80 transition-colors shadow-sm"
                            >
                                <Wrench className="w-3.5 h-3.5 text-[#757575]" /> {tr("sourcingChat.selectManually")}
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) openSearchBuilder(query); }} className="max-w-3xl mx-auto w-full">
                            {showSuggestions && (
                                <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-1.5 shadow-md mb-2.5 space-y-0.5 animate-in fade-in duration-500">
                                    {[
                                        tr("sourcingChat.suggestion1"),
                                        tr("sourcingChat.suggestion2"),
                                        tr("sourcingChat.suggestion3"),
                                        tr("sourcingChat.suggestion4"),
                                        tr("sourcingChat.suggestion5")
                                    ].map((rec, rIdx) => (
                                        <button
                                            key={rIdx}
                                            type="button"
                                            onClick={() => { openSearchBuilder(rec); }}
                                            className={`w-full text-left px-3 py-1.5 hover:bg-[#F5F6F8] text-[12.5px] font-semibold text-[#424242] rounded-[4px] transition-colors ${query === rec ? 'bg-[#F5F6F8]' : ''}`}
                                        >
                                            {rec}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="relative flex flex-col bg-white border border-[#E0E0E0] focus-within:border-[#1976D2] focus-within:ring-2 focus-within:ring-[#1976D2]/20 rounded-[4px] px-4 py-3 shadow-sm transition-all duration-300 animate-in fade-in duration-300">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder={tr("sourcingChat.searchPlaceholder")}
                                    className="w-full bg-transparent border-none focus:outline-none text-[14px] font-medium text-[#212121] placeholder:text-[#9E9E9E] mb-2.5"
                                />
                                <div className="flex items-center justify-end">
                                    <button
                                        type="submit"
                                        disabled={!query.trim()}
                                        className="w-9 h-9 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(25,118,210,0.24)] disabled:opacity-40 disabled:shadow-none"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </form>
                      </div>
                    </div>
                )}

                {searchPhase === "filters" && (() => {
                    const roleChip = deriveRoleLabel(query);
                    const locChip = deriveLocationLabel(query) || (extractedFilters.location !== "Global" ? extractedFilters.location : null);
                    const moreFilters = [Number(extractedFilters.minExp) > 0, extractedFilters.platform !== "All"].filter(Boolean).length;
                    return (
                    <div className="flex-1 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="min-h-full flex flex-col justify-center max-w-3xl mx-auto w-full py-8 space-y-5">
                            {/* User message */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#E0E0E0] text-[#616161] flex items-center justify-center font-bold text-[13px] shrink-0 overflow-hidden">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1 bg-white border border-[#E0E0E0] rounded-[4px] px-5 py-4 shadow-sm">
                                    <p className="text-[14px] text-[#263238]">{query}</p>
                                </div>
                            </div>

                            {/* AI: filters */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#212121] text-white flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex-1 bg-white border border-[#E0E0E0] rounded-[4px] px-5 py-4 shadow-sm space-y-3">
                                    <p className="text-[14px] text-[#263238]">
                                        {tr("sourcingChat.filtersMsgPre")} <span className="inline-flex items-center gap-1 font-semibold text-[#1976D2]"><Filter className="w-3.5 h-3.5" />{tr("sourcingChat.filtersLabel")}</span> {tr("sourcingChat.filtersMsgPost")}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button onClick={() => setIsFilterModalOpen(true)} title={tr("sourcingChat.editThisFilter")} className="px-3 py-1.5 rounded-[4px] bg-[#F3F9FE] text-[#0D47A1] text-[13px] font-semibold hover:bg-[#D6E9FA] transition-colors">{roleChip}</button>
                                        {locChip && (
                                            <>
                                                <span className="text-[13px] text-[#757575]">{tr("sourcingChat.inWord")}</span>
                                                <button onClick={() => setIsFilterModalOpen(true)} title={tr("sourcingChat.editThisFilter")} className="px-3 py-1.5 rounded-[4px] bg-[#F3F9FE] text-[#0D47A1] text-[13px] font-semibold hover:bg-[#D6E9FA] transition-colors">{locChip}</button>
                                            </>
                                        )}
                                        {moreFilters > 0 && (
                                            <button onClick={() => setIsFilterModalOpen(true)} className="px-3 py-1.5 rounded-[4px] bg-[#F3F9FE] text-[#0D47A1] text-[13px] font-semibold hover:bg-[#D6E9FA] transition-colors">
                                                {tr("sourcingChat.moreFilters").replace("{count}", String(moreFilters))}
                                            </button>
                                        )}
                                        <button onClick={() => setIsFilterModalOpen(true)} className="text-[13px] font-semibold text-[#1976D2] hover:underline ml-1">{tr("sourcingChat.editFilters")}</button>
                                    </div>
                                </div>
                            </div>

                            {/* Criteria */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 shrink-0" />
                                <div className="flex-1 bg-white border border-[#E0E0E0] rounded-[4px] px-5 py-4 shadow-sm space-y-3">
                                    <p className="text-[14px] text-[#263238]">
                                        {tr("sourcingChat.criteriaMsgPre")} <span className="inline-flex items-center gap-1 font-semibold text-[#1976D2]"><Sparkles className="w-3.5 h-3.5" />{tr("sourcingChat.criteriaLabel")}</span> {tr("sourcingChat.criteriaMsgPost")}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {criteria.map((c, i) => (
                                            <button key={i} onClick={() => setIsCriteriaModalOpen(true)} title={tr("sourcingChat.editThisCriterion")} className="px-3 py-1.5 rounded-[4px] bg-[#F3F9FE] text-[#0D47A1] text-[13px] font-semibold hover:bg-[#D6E9FA] transition-colors">{criterionLabel(c)}</button>
                                        ))}
                                        <button onClick={() => setIsCriteriaModalOpen(true)} className="text-[13px] font-semibold text-[#1976D2] hover:underline ml-1">
                                            {criteria.length ? tr("sourcingChat.editCriteria") : tr("sourcingChat.addCriteria")}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-4 pt-2">
                                <button
                                    onClick={() => { setSearchPhase("initial"); setQuery(""); setCriteria([]); }}
                                    className="text-[14px] font-semibold text-[#4F4F4F] hover:text-[#263238] transition-colors"
                                >
                                    {tr("sourcingChat.resetSearch")}
                                </button>
                                <button
                                    onClick={runSearch}
                                    className="px-6 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] text-white text-[14px] font-bold rounded-[4px] transition-all shadow-[0_6px_16px_rgba(25,118,210,0.28)]"
                                >
                                    {tr("sourcingChat.runSearch")}
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })()}

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-[#BBDEFB] rounded-full animate-pulse" />
                            <div className="absolute inset-0 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#1976D2] animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold text-[#263238] tracking-tight">{tr("sourcingChat.gathering")}</h3>
                        <p className="text-xs text-[#9E9E9E] font-bold mt-1">{tr("sourcingChat.searchingPlatforms")}</p>
                    </div>
                )}

                {searchPhase === "results" && !loading && (
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 max-w-full w-full animate-in fade-in duration-500 pr-1">
                        {/* Search summary bar — query pill + Filters / Criteria pills. */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3 py-1">
                            <div className="flex-1 flex items-center gap-3 bg-white border border-[#E0E0E0] rounded-[4px] pl-3 pr-4 h-14 shadow-sm focus-within:border-[#1976D2] focus-within:ring-2 focus-within:ring-[#1976D2]/15 transition-all">
                                <div className="w-9 h-9 rounded-full bg-[#E0E0E0] text-[#616161] flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
                                    placeholder={tr("sourcingChat.refinePlaceholder")}
                                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#263238] placeholder:text-[#9E9E9E]"
                                />
                            </div>
                            <div className="flex items-center gap-2.5 self-end md:self-center">
                                <button onClick={() => setIsFilterModalOpen(true)} className="h-12 px-5 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] font-semibold text-[#424242] hover:bg-[#FAFAFA] hover:border-[#BBDEFB] transition-colors flex items-center gap-2 shadow-sm">
                                    <Filter className="w-4 h-4 text-[#4F4F4F]" /> {tr("sourcingChat.filters")}
                                    <span className="bg-[#E3F2FD] text-[#1976D2] w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                                </button>
                                <button
                                    onClick={() => setIsCriteriaModalOpen(true)}
                                    title={tr("sourcingChat.criteriaTooltip")}
                                    className="h-12 px-5 bg-white border border-[#E0E0E0] rounded-[4px] text-[14px] font-semibold text-[#424242] hover:bg-[#FAFAFA] hover:border-[#BBDEFB] transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <Sparkles className="w-4 h-4 text-[#1976D2]" /> {tr("sourcingChat.criteria")}
                                    <span className="bg-[#E3F2FD] text-[#1976D2] w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center">{criteria.length}</span>
                                </button>
                            </div>
                        </div>


                        {results.length === 0 ? (
                            searchError ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center bg-[#FEF6EE] rounded-3xl border border-[#F9DBAF]">
                                    <div className="w-11 h-11 rounded-[4px] bg-white text-[#D84315] flex items-center justify-center mb-3 border border-[#F9DBAF]">
                                        <X className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-md font-bold text-[#263238] mb-1">{tr("sourcingChat.searchFailed")}</h3>
                                    <p className="text-[#8A5A2B] text-xs font-medium max-w-sm mb-4">{searchError}</p>
                                    <button
                                        onClick={() => runSearch()}
                                        className="px-5 h-9 bg-[#1976D2] text-white rounded-[4px] text-[13px] font-semibold hover:bg-[#1565C0] transition-colors"
                                    >
                                        {tr("sourcingChat.tryAgain")}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center bg-[#FAFAFA] rounded-3xl border border-[#E0E0E0]">
                                    <h3 className="text-md font-bold text-[#263238] mb-1">{tr("sourcingChat.noProfilesIndexed")}</h3>
                                    <p className="text-[#9E9E9E] text-xs font-medium max-w-xs">
                                        {tr("sourcingChat.noProfilesHint")}
                                    </p>
                                </div>
                            )
                        ) : (
                            <>
                                {/* Tabs + toolbar (matches count · view toggle · pagination) — one row */}
                                <div className="flex items-center justify-between gap-4 border-b border-[#E0E0E0]/50">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setResultsTab("profiles")}
                                            className={`pb-3 text-sm font-bold transition-all relative ${resultsTab === 'profiles' ? 'text-[#1976D2]' : 'text-[#9E9E9E] hover:text-[#4F4F4F]'}`}
                                        >
                                            {tr("sourcingChat.resultsTab")}
                                            {resultsTab === 'profiles' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1976D2] rounded-full" />}
                                        </button>
                                        <button
                                            onClick={() => setResultsTab("insights")}
                                            className={`pb-3 text-sm font-bold transition-all relative ${resultsTab === 'insights' ? 'text-[#1976D2]' : 'text-[#9E9E9E] hover:text-[#4F4F4F]'}`}
                                        >
                                            {tr("sourcingChat.insightsTab")}
                                            {resultsTab === 'insights' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1976D2] rounded-full" />}
                                        </button>
                                        {resultsTab === "profiles" && (
                                            <div className="flex items-center gap-3 pb-2">
                                                <span className="text-[14px] font-extrabold text-[#212121] tracking-[-0.2px]">{tr("sourcingChat.matches")} ({profilesCount.toLocaleString()})</span>
                                                <div className="flex items-center bg-[#F3F9FE] border border-[#D6E9FA] rounded-[4px] p-0.5">
                                                    <button
                                                        onClick={() => setViewMode("list")}
                                                        title={tr("sourcingChat.listView")}
                                                        className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-all ${viewMode === "list" ? "bg-white text-[#1976D2] shadow-sm" : "text-[#9E9E9E] hover:text-[#4F4F4F]"}`}
                                                    >
                                                        <List className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode("table")}
                                                        title={tr("sourcingChat.tableView")}
                                                        className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-all ${viewMode === "table" ? "bg-white text-[#1976D2] shadow-sm" : "text-[#9E9E9E] hover:text-[#4F4F4F]"}`}
                                                    >
                                                        <Table2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {resultsTab === "profiles" && profilesCount > 0 && (
                                        <span className="text-[13px] font-semibold text-[#616161] pb-2">
                                            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, profilesCount)} {tr("sourcingChat.of")} {profilesCount.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                {resultsTab === "insights" ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="py-4 space-y-6"
                                    >
                                        <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm overflow-hidden">
                                            <div className="flex flex-col gap-6">
                                                <div className="text-center max-w-2xl mx-auto space-y-1">
                                                    <h3 className="text-xl font-bold text-[#212121] tracking-tight">{tr("sourcingChat.geospatial")}</h3>
                                                    <p className="text-[#616161] text-xs font-medium">
                                                        {tr("sourcingChat.geospatialDesc")}
                                                    </p>
                                                </div>
 
                                                {/* Color Synchronized Legend at Top — real per-country counts */}
                                                {countryCounts.length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                                        {countryCounts.slice(0, 12).map(([code, count]) => (
                                                            <div
                                                                key={code}
                                                                className="bg-white px-3 py-2.5 rounded-xl border border-[#E0E0E0] shadow-sm flex items-center gap-2 group hover:scale-105 transition-all duration-300"
                                                            >
                                                                <div
                                                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                                                    style={{ backgroundColor: COUNTRY_COLORS[code] || "#CBD5E1" }}
                                                                />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[9px] font-bold text-[#263238] truncate uppercase tracking-tighter">
                                                                        {COUNTRY_NAMES[code] || code}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-[#9E9E9E]">
                                                                        {count} {tr("sourcingChat.candidatesLabel")}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {countryCounts.length === 0 ? (
                                                    <div className="w-full min-h-[500px] bg-[#FAFAFA]/60 rounded-xl border border-[#E0E0E0] flex flex-col items-center justify-center text-center gap-2 px-6">
                                                        <Globe className="w-10 h-10 text-[#BDBDBD]" />
                                                        <h4 className="text-sm font-bold text-[#263238]">{tr("sourcingChat.noLocationData")}</h4>
                                                        <p className="text-[#9E9E9E] text-xs font-medium max-w-xs">
                                                            {tr("sourcingChat.noLocationHint")}
                                                        </p>
                                                    </div>
                                                ) : (
                                                <div className="w-full min-h-[500px] bg-[#FAFAFA]/60 rounded-xl border border-[#E0E0E0] overflow-hidden flex items-center justify-center relative group">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#E3F2FD]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                                    <Chart
                                                        chartType="GeoChart"
                                                        width="100%"
                                                        height="500px"
                                                        data={mapData}
                                                        loader={
                                                            <div className="flex flex-col items-center justify-center gap-4">
                                                                <div className="w-8 h-8 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                                                                <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">{tr("sourcingChat.generatingMap")}</span>
                                                            </div>
                                                        }
                                                        options={{
                                                            region: 'world',
                                                            displayMode: 'regions',
                                                            colorAxis: { 
                                                                values: mapData.slice(1).map((_, idx) => idx),
                                                                colors: mapData.slice(1).map(item => COUNTRY_COLORS[item[0]] || "#E0E0E0")
                                                            },
                                                            backgroundColor: "transparent",
                                                            datalessRegionColor: "#FAFAFA",
                                                            defaultColor: "#EEEEEE",
                                                            legend: 'none',
                                                            keepAspectRatio: true,
                                                            tooltip: { isHtml: true, trigger: 'focus' }
                                                        }}
                                                    />
                                                </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Talent insights: skills breakdown + AI key takeaways. */}
                                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                            <div className="lg:col-span-3 bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BarChart className="w-4 h-4 text-[#1976D2]" />
                                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("sourcingChat.skills")}</h3>
                                                </div>
                                                <p className="text-[12px] text-[#757575] mb-4">{tr("sourcingChat.commonSkills")}</p>
                                                {skillStats.length === 0 ? (
                                                    <p className="text-[13px] text-[#9E9E9E] py-8 text-center">{tr("sourcingChat.noSkillData")}</p>
                                                ) : (
                                                    <div className="space-y-2.5">
                                                        {skillStats.map((s) => (
                                                            <div key={s.skill} className="flex items-center gap-3">
                                                                <span className="w-32 shrink-0 text-[12.5px] font-semibold text-[#424242] truncate" title={s.skill}>{s.skill}</span>
                                                                <div className="flex-1 h-5 bg-[#EEEEEE] rounded-[3px] overflow-hidden">
                                                                    <div className="h-full rounded-[3px] bg-gradient-to-r from-[#42A5F5] to-[#1976D2]" style={{ width: `${Math.max(s.pct, 3)}%` }} />
                                                                </div>
                                                                <span className="w-20 shrink-0 text-right text-[11.5px] font-bold text-[#616161]">{s.count} ({s.pct}%)</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="lg:col-span-2 bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Sparkles className="w-4 h-4 text-[#1976D2]" />
                                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("sourcingChat.keyTakeaways")}</h3>
                                                </div>
                                                <p className="text-[12px] text-[#757575] mb-4">{tr("sourcingChat.signalsPool")}</p>
                                                {keyTakeaways.length === 0 ? (
                                                    <p className="text-[13px] text-[#9E9E9E] py-8 text-center">{tr("sourcingChat.runSearchTakeaways")}</p>
                                                ) : (
                                                    <ul className="space-y-3">
                                                        {keyTakeaways.map((t, i) => (
                                                            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-[#424242] leading-relaxed">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-1.5 shrink-0" />
                                                                <span>{t}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : viewMode === "table" ? (
                                    <div className="w-full animate-in fade-in duration-500 bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[760px]">
                                            <thead>
                                                <tr className="text-[11px] font-bold text-[#757575] uppercase tracking-[0.05em] border-b border-[#E0E0E0] bg-[#FAFAFA]">
                                                    <th className="px-4 py-3">{tr("sourcingChat.colName")}</th>
                                                    <th className="px-4 py-3">{tr("sourcingChat.colProfiles")}</th>
                                                    <th className="px-4 py-3">{tr("sourcingChat.colJobTitle")}</th>
                                                    <th className="px-4 py-3">{tr("sourcingChat.colCompany")}</th>
                                                    <th className="px-4 py-3">{tr("sourcingChat.colShortlistStatus")}</th>
                                                    {criteria.length > 0 && <th className="px-4 py-3">{tr("sourcingChat.colMatch")}</th>}
                                                    {criteria.map((c, ci) => <th key={ci} className="px-4 py-3 text-center whitespace-nowrap">{criterionLabel(c)}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedResults.map((profile, index) => {
                                                    const pct = profileMatchPercent(profile, criteria);
                                                    const isShort = profile.profile_url ? shortlisted[profile.profile_url] : undefined;
                                                    const pctCls = pct === null ? "" : pct >= 100 ? "text-[#2E7D32]" : pct >= 50 ? "text-[#D84315]" : "text-[#616161]";
                                                    return (
                                                        <tr key={index} onClick={() => setSelectedProfile(profile)} className="border-b border-[#EEEEEE] last:border-b-0 hover:bg-[#FAFAFA]/60 transition-colors cursor-pointer">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-[13px] text-[#212121] whitespace-nowrap">{profile.full_name}</span>
                                                                    <a href={profile.profile_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#9E9E9E] hover:text-[#1976D2]"><ExternalLink className="w-3.5 h-3.5" /></a>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {profile.profile_url ? (
                                                                    <a href={profile.profile_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title={profile.platform}>
                                                                        <img src={`https://www.google.com/s2/favicons?sz=64&domain=${getPlatformDomain(profile.platform)}`} alt={profile.platform} className="w-4 h-4 rounded-sm object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                                    </a>
                                                                ) : <span className="text-[#BDBDBD]">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-[12.5px] text-[#4F4F4F] max-w-[220px] truncate">{profile.headline || "—"}</td>
                                                            <td className="px-4 py-3 text-[12.5px] text-[#4F4F4F] whitespace-nowrap">{profile.company || "—"}</td>
                                                            <td className="px-4 py-3">
                                                                {isShort ? (
                                                                    <Link href={`/enterprise/jobs/${isShort}?tab=sourcing`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2E7D32] whitespace-nowrap"><CircleCheck className="w-3.5 h-3.5" /> {tr("sourcingChat.shortlisted")}</Link>
                                                                ) : (
                                                                    <button onClick={(e) => { e.stopPropagation(); openShortlistModal(profile); }} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#1976D2] hover:underline whitespace-nowrap"><Bookmark className="w-3.5 h-3.5" /> {tr("sourcingChat.shortlist")}</button>
                                                                )}
                                                            </td>
                                                            {criteria.length > 0 && <td className={`px-4 py-3 text-[13px] font-bold ${pctCls}`}>{pct}%</td>}
                                                            {criteria.map((c, ci) => {
                                                                const v = evaluateCriterion(profile, c);
                                                                return (
                                                                    <td key={ci} className="px-4 py-3 text-center" title={v.reason}>
                                                                        {v.status === "pass" ? (
                                                                            <span className="inline-flex items-center justify-center w-7 h-6 rounded-md bg-[#E8F5E9] text-[#2E7D32]"><ThumbsUp className="w-3.5 h-3.5" /></span>
                                                                        ) : (
                                                                            <span className="text-[#BDBDBD] font-bold">–</span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col w-full animate-in fade-in duration-500 bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-hidden">
                                        {displayedResults
                                            .map((profile, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-6 border-b border-[#E0E0E0] last:border-b-0 hover:bg-[#FAFAFA]/40 transition-all flex flex-col gap-4 relative cursor-pointer"
                                        onClick={() => setSelectedProfile(profile)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded border-[#E0E0E0] text-[#1976D2] focus:ring-[#1976D2] mt-1"
                                                />
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-bold text-[#212121] flex items-center gap-2">
                                                            {profile.full_name}
                                                        </h3>
                                                        <a href={profile.profile_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#1976D2] hover:text-[#1565C0]">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        {Array.isArray(profile.social_links) && profile.social_links.map((s: any, si: number) => {
                                                            const prov = (s?.provider || "").toLowerCase();
                                                            const url = s?.url;
                                                            if (!url) return null;
                                                            const Icon = prov.includes("linkedin") ? Linkedin : prov.includes("github") ? Github : (prov.includes("twitter") || prov === "x") ? Twitter : null;
                                                            if (!Icon) return null;
                                                            return (
                                                                <a key={si} href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title={prov} className="text-[#616161] hover:text-[#1976D2]">
                                                                    <Icon className="w-4 h-4" />
                                                                </a>
                                                            );
                                                        })}
                                                        {profile.platform && (
                                                            <div className="flex items-center gap-1.5 shrink-0 text-[#616161] font-bold text-[10px]">
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
                                                        {originMeta(profile.origin) && (
                                                            <span
                                                                title={profile.last_scraped_at ? tr("sourcingChat.lastUpdated").replace("{date}", new Date(profile.last_scraped_at).toLocaleString()) : undefined}
                                                                className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${originMeta(profile.origin)!.cls}`}
                                                            >
                                                                {profile.origin === "client_db" ? tr("sourcingChat.originClientDb") : profile.origin === "croar_db" ? tr("sourcingChat.originCroarDb") : tr("sourcingChat.originFresh")}
                                                                {profile.origin !== "fresh" && timeAgo(profile.last_scraped_at) && (
                                                                    <span className="opacity-70">· {timeAgo(profile.last_scraped_at)}</span>
                                                                )}
                                                            </span>
                                                        )}
                                                        {(() => {
                                                            const pct = profileMatchPercent(profile, criteria);
                                                            if (pct === null) return null;
                                                            const cls = pct >= 100 ? "bg-[#E8F5E9] text-[#2E7D32]" : pct >= 50 ? "bg-[#FEF6EE] text-[#D84315]" : "bg-[#EEEEEE] text-[#616161]";
                                                            return <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{pct}% {tr("sourcingChat.matchWord")}</span>;
                                                        })()}
                                                    </div>
                                                    
                                                    <p className="text-xs font-bold text-[#4F4F4F] flex items-center gap-2">
                                                        <Building className="w-4 h-4 text-[#9E9E9E]" /> {profile.headline || tr("sourcingChat.professionalRole")} {profile.company ? ` ${tr("sourcingChat.at")} ${profile.company}` : ""}
                                                    </p>
                                                    {profile.location && (
                                                        <span className="text-[10px] font-bold text-[#9E9E9E] flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-[#BDBDBD]" /> {profile.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end md:self-start" role="button" tabIndex={0} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); } }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedProfile(profile); }}
                                                    title={tr("sourcingChat.previewProfile")}
                                                    className="w-9 h-9 rounded-xl border border-[#E0E0E0] bg-white text-[#616161] hover:text-[#1976D2] hover:bg-[#FAFAFA] flex items-center justify-center transition-all shadow-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {profile.profile_url && shortlisted[profile.profile_url] ? (
                                                    <>
                                                        <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] text-[#2E7D32] font-bold text-xs">
                                                            <CircleCheck className="w-4 h-4" /> {tr("sourcingChat.shortlisted")}
                                                        </span>
                                                        <Link
                                                            href={`/enterprise/jobs/${shortlisted[profile.profile_url]}?tab=sourcing`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            title={tr("sourcingChat.viewJobShortlisted")}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E0E0E0] bg-white text-[#1976D2] font-bold text-xs shadow-sm hover:bg-[#FAFAFA] transition-all"
                                                        >
                                                            {tr("sourcingChat.viewInJob")} <ArrowRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => openShortlistModal(profile)}
                                                        className={`flex items-center rounded-xl border font-bold text-xs shadow-sm bg-white border-[#E0E0E0]/80 transition-all hover:bg-[#FAFAFA]`}
                                                    >
                                                        <div className="flex items-center gap-2 px-3 py-2 text-[#263238] font-bold">
                                                            <Bookmark className={`w-4 h-4 text-[#9E9E9E]`} />
                                                            <span>
                                                                {tr("sourcingChat.shortlist")}
                                                            </span>
                                                        </div>
                                                        <div className="border-l border-[#E0E0E0]/80 h-full py-3 px-2 flex items-center justify-center">
                                                            <ChevronDown className="w-3.5 h-3.5 text-[#263238]" />
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {criteria.length > 0 && (
                                            <div className="pl-8 flex flex-col gap-1.5">
                                                {criteria.map((c, ci) => {
                                                    const v = evaluateCriterion(profile, c);
                                                    return (
                                                        <div key={ci} className="flex items-start gap-2.5">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 min-w-[74px] justify-center ${v.status === "pass" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#EEEEEE] text-[#9E9E9E]"}`}>
                                                                {v.status === "pass" ? <ThumbsUp className="w-3 h-3" /> : <span className="text-[13px] leading-none">–</span>}
                                                                {criterionLabel(c)}
                                                            </span>
                                                            <span className="text-[11.5px] text-[#616161] leading-relaxed pt-0.5">{v.reason}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {profile.ai_summary && (
                                            <div className="pl-8 text-xs font-medium text-[#4F4F4F] leading-relaxed flex items-start gap-3">
                                                <Sparkles className="w-4 h-4 text-[#1976D2] mt-0.5 shrink-0 animate-pulse" />
                                                <p>
                                                    {profile.ai_summary}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                        ))}
                                    </div>
                                )}

                            {resultsTab === "profiles" && Math.ceil(profilesCount / itemsPerPage) > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8 py-4 border-t border-[#EEEEEE]">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${currentPage === 1 ? 'text-[#BDBDBD] bg-[#FAFAFA] border-[#E0E0E0] cursor-not-allowed' : 'text-[#4F4F4F] bg-white border-[#E0E0E0] hover:bg-[#FAFAFA]'}`}
                                    >
                                        {tr("sourcingChat.prev")}
                                    </button>
                                    
                                    {(() => {
                                        const totalPages = Math.ceil(profilesCount / itemsPerPage);
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
                                                            className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all bg-white text-[#616161] border-[#E0E0E0] hover:border-[#BBDEFB] hover:text-[#1976D2]`}
                                                        >
                                                            1
                                                        </button>
                                                        {startPage > 2 && <span className="text-[#BDBDBD] text-xs px-1">...</span>}
                                                    </>
                                                )}

                                                {pages.map(pageIndex => (
                                                    <button 
                                                        key={pageIndex}
                                                        onClick={() => setCurrentPage(pageIndex)}
                                                        className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all ${currentPage === pageIndex ? 'bg-[#1976D2] text-white border-[#1976D2] shadow-sm' : 'bg-white text-[#616161] border-[#E0E0E0] hover:border-[#BBDEFB] hover:text-[#1976D2]'}`}
                                                    >
                                                        {pageIndex}
                                                    </button>
                                                ))}

                                                {endPage < totalPages && (
                                                    <>
                                                        {endPage < totalPages - 1 && <span className="text-[#BDBDBD] text-xs px-1">...</span>}
                                                        <button 
                                                            onClick={() => setCurrentPage(totalPages)}
                                                            className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all bg-white text-[#616161] border-[#E0E0E0] hover:border-[#BBDEFB] hover:text-[#1976D2]`}
                                                        >
                                                            {totalPages}
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}

                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(profilesCount / itemsPerPage)))}
                                        disabled={currentPage === Math.ceil(profilesCount / itemsPerPage)}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${currentPage === Math.ceil(profilesCount / itemsPerPage) ? 'text-[#BDBDBD] bg-[#FAFAFA] border-[#E0E0E0] cursor-not-allowed' : 'text-[#4F4F4F] bg-white border-[#E0E0E0] hover:bg-[#FAFAFA]'}`}
                                    >
                                        {tr("sourcingChat.next")}
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

            {/* Share public link modal. */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200" onClick={() => setIsShareModalOpen(false)}>
                    <div className="bg-white p-6 rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-w-xl w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <h3 className="text-[17px] font-bold text-[#212121]">{tr("sourcingChat.sharePublic")}</h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="p-1.5 hover:bg-[#EEEEEE] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-[13.5px] text-[#616161] -mt-1">{tr("sourcingChat.shareDesc")}</p>

                        {shareError ? (
                            <div className="flex items-center justify-between gap-3 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3">
                                <p className="text-[13px] text-[#C62828] font-semibold">{shareError}</p>
                                <button onClick={openShareModal} className="text-[12px] font-bold text-[#1976D2] hover:underline shrink-0">{tr("sourcingChat.retry")}</button>
                            </div>
                        ) : (
                            <>
                                <input
                                    readOnly
                                    value={shareCreating ? tr("sourcingChat.creatingLink") : shareUrl}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="w-full h-11 px-3.5 rounded-[4px] border border-[#E0E0E0] bg-[#FAFAFA] text-[13px] text-[#424242] outline-none focus:border-[#1976D2]"
                                />
                                <div className="flex items-center justify-end gap-2.5">
                                    <button
                                        onClick={copyShareUrl}
                                        disabled={!shareUrl}
                                        className="h-10 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                                    >
                                        {shareCopied ? tr("sourcingChat.copied") : tr("sourcingChat.copyToClipboard")}
                                    </button>
                                    <button
                                        onClick={() => shareUrl && window.open(shareUrl, "_blank", "noopener")}
                                        disabled={!shareUrl}
                                        className="h-10 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-bold hover:bg-[#1565C0] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {tr("sourcingChat.openUrl")} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Criteria Modal — ranking criteria, most→least important. */}
            {isCriteriaModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200" onClick={() => setIsCriteriaModalOpen(false)}>
                    <div className="bg-white p-6 rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-w-lg w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#212121] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#1976D2]" /> {tr("sourcingChat.criteria")}</h3>
                            <button onClick={() => setIsCriteriaModalOpen(false)} className="p-1.5 hover:bg-[#EEEEEE] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-[12.5px] text-[#757575] -mt-1">{tr("sourcingChat.criteriaModalDesc")}</p>

                        {criteria.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#757575]">{tr("sourcingChat.mostImportant")}</span>
                                {criteria.map((c, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <button disabled={i === 0} onClick={() => setCriteria((prev) => { const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="text-[#BDBDBD] hover:text-[#1976D2] disabled:opacity-30 disabled:hover:text-[#BDBDBD]"><ChevronUp className="w-3.5 h-3.5" /></button>
                                            <button disabled={i === criteria.length - 1} onClick={() => setCriteria((prev) => { const n = [...prev]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} className="text-[#BDBDBD] hover:text-[#1976D2] disabled:opacity-30 disabled:hover:text-[#BDBDBD]"><ChevronDown className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <span className="w-5 text-center text-[12px] font-bold text-[#757575]">{i + 1}</span>
                                        <input
                                            value={c}
                                            onChange={(e) => setCriteria((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                                            className="flex-1 h-9 px-3 rounded-[4px] border border-[#E0E0E0] text-[13px] text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/25 focus:border-[#1976D2]"
                                        />
                                        <button onClick={() => setCriteria((prev) => prev.filter((_, j) => j !== i))} className="text-[#E53935]/70 hover:text-[#E53935] p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#757575] block pt-1">{tr("sourcingChat.leastImportant")}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                value={newCriterion}
                                onChange={(e) => setNewCriterion(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && newCriterion.trim()) { setCriteria((prev) => [...prev, newCriterion.trim()]); setNewCriterion(""); } }}
                                placeholder={tr("sourcingChat.criterionPlaceholder")}
                                className="flex-1 h-10 px-3 rounded-[4px] border border-[#E0E0E0] text-[13px] text-[#263238] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/25 focus:border-[#1976D2]"
                            />
                            <button
                                onClick={() => { if (newCriterion.trim()) { setCriteria((prev) => [...prev, newCriterion.trim()]); setNewCriterion(""); } }}
                                disabled={!newCriterion.trim()}
                                className="h-10 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[#1976D2] text-[13px] font-bold hover:bg-[#FAFAFA] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" /> {tr("sourcingChat.add")}
                            </button>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button onClick={() => setIsCriteriaModalOpen(false)} className="h-10 px-6 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-bold hover:bg-[#1565C0] transition-colors">{tr("sourcingChat.update")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Rule Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-w-md w-full mx-4 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#212121] flex items-center gap-2"><Filter className="w-4 h-4 text-[#1976D2]" /> {tr("sourcingChat.refineConstraints")}</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="p-1.5 hover:bg-[#EEEEEE] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label htmlFor="filter-target-role" className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E] ml-1">{tr("sourcingChat.targetRole")}</label>
                                <input
                                    id="filter-target-role"
                                    type="text"
                                    value={extractedFilters.title}
                                    onChange={(e) => setExtractedFilters({...extractedFilters, title: e.target.value})} 
                                    className="w-full bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 py-2 text-[13.5px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="filter-location-area" className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E] ml-1">{tr("sourcingChat.locationArea")}</label>
                                <input
                                    id="filter-location-area"
                                    type="text"
                                    value={extractedFilters.location}
                                    onChange={(e) => setExtractedFilters({...extractedFilters, location: e.target.value})} 
                                    className="w-full bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 py-2 text-[13.5px] font-medium text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="filter-target-platform" className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E] ml-1">{tr("sourcingChat.targetPlatform")}</label>
                                <div id="filter-target-platform" className="max-h-60 overflow-y-auto p-2 border border-[#E0E0E0]/80 rounded-[4px] bg-[#FAFAFA]/50 space-y-1 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: "All", name: tr("sourcingChat.allPlatforms") },
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
                                                className={`flex items-center gap-2 px-3 py-2 rounded-[4px] text-[11px] font-semibold border transition-all ${
                                                    extractedFilters.platform === plat.id
                                                        ? "bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]"
                                                        : "bg-white border-[#E0E0E0]/50 text-[#4F4F4F] hover:bg-[#FAFAFA]"
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${extractedFilters.platform === plat.id ? "bg-[#1976D2] animate-pulse" : "bg-[#BDBDBD]"}`} />
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
                            className="w-full h-10 bg-[#1976D2] hover:bg-[#1565C0] text-white text-[13px] font-semibold rounded-[4px] transition-colors shadow-[0_6px_16px_rgba(25,118,210,0.28)]"
                        >
                            {tr("sourcingChat.saveRuleAdjustments")}
                        </button>
                    </div>
                </div>
            )}
            {isJobModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[4px] p-6 max-w-2xl w-full shadow-[0_14px_34px_rgba(0,0,0,0.16)] border border-[#E0E0E0] flex flex-col space-y-4 max-h-[90vh]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#212121] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#E53935]" /> {tr("sourcingChat.searchByJD")}
                            </h3>
                            <button 
                                onClick={() => {
                                    if (jobDescription.trim()) {
                                        handleChatSend(jobDescription);
                                    }
                                    setIsJobModalOpen(false);
                                }}
                                className="h-10 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold transition-colors shadow-[0_6px_16px_rgba(25,118,210,0.28)] flex items-center gap-1.5"
                            >
                                {tr("sourcingChat.saveAndSearch")} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto space-y-4">
                            <div className="space-y-1">
                                <label htmlFor="job-description-textarea" className="text-[13px] font-semibold text-[#212121]">{tr("sourcingChat.pasteJD")}</label>
                                <p className="text-xs text-[#9E9E9E] font-medium mb-2">{tr("sourcingChat.jdFormattingNote")}</p>
                                <textarea
                                    id="job-description-textarea"
                                    rows={8}
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder={tr("sourcingChat.pasteJDPlaceholder")}
                                    className="w-full bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-3 text-[13.5px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                                />
                            </div>
                            <div className="border-t border-[#E0E0E0] pt-3 space-y-2">
                                <label htmlFor="job-upload-button" className="text-[13px] font-semibold text-[#212121] flex items-center gap-2">{tr("sourcingChat.uploadJD")}</label>
                                <p className="text-xs text-[#9E9E9E] font-medium">{tr("sourcingChat.uploadJDNote")}</p>
                                <button id="job-upload-button" className="h-9 px-4 border border-[#E0E0E0] rounded-[4px] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shadow-sm">
                                    {tr("sourcingChat.upload")}
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsJobModalOpen(false)}
                            className="w-full h-10 bg-[#F5F6F8] hover:bg-[#E0E0E0] text-[#4F4F4F] text-[13px] font-semibold rounded-[4px] transition-colors border border-[#E0E0E0]"
                        >
                            {tr("sourcingChat.cancel")}
                        </button>
                    </div>
                </div>
            )}

            {isBooleanModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[4px] p-6 max-w-xl w-full shadow-[0_14px_34px_rgba(0,0,0,0.16)] border border-[#E0E0E0] flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#212121] flex items-center gap-2">
                                <span className="text-[#2E7D32] font-bold text-xl">Σ</span> {tr("sourcingChat.searchByBoolean")}
                            </h3>
                            <button 
                                onClick={() => {
                                    if (booleanExpression.trim()) {
                                        handleChatSend(booleanExpression);
                                    }
                                    setIsBooleanModalOpen(false);
                                }}
                                className="h-10 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold transition-colors shadow-[0_6px_16px_rgba(25,118,210,0.28)] flex items-center gap-1.5"
                            >
                                {tr("sourcingChat.saveAndSearch")} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-[#616161] font-bold">{tr("sourcingChat.booleanDesc")}</p>
                        <textarea 
                            rows={5}
                            value={booleanExpression}
                            onChange={(e) => setBooleanExpression(e.target.value)}
                            placeholder="(software OR engineer) AND (python OR java)"
                            className="w-full bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-3 text-[13.5px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                        />
                        <button 
                            onClick={() => setIsBooleanModalOpen(false)}
                            className="w-full h-10 bg-[#F5F6F8] hover:bg-[#E0E0E0] text-[#4F4F4F] text-[13px] font-semibold rounded-[4px] transition-colors border border-[#E0E0E0]"
                        >
                            {tr("sourcingChat.cancel")}
                        </button>
                    </div>
                </div>
            )}

            {isCompetitorModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[4px] p-6 max-w-xl w-full shadow-[0_14px_34px_rgba(0,0,0,0.16)] border border-[#E0E0E0] flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-[#212121] flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#1976D2]" /> {tr("sourcingChat.skillMapping")}
                            </h3>
                            <button 
                                onClick={() => {
                                    if (competitors.trim()) {
                                        handleChatSend(`Targeting talent with specific skills: ${competitors}`);
                                    }
                                    setIsCompetitorModalOpen(false);
                                }}
                                className="h-10 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold transition-colors shadow-[0_6px_16px_rgba(25,118,210,0.28)] flex items-center gap-1.5"
                            >
                                {tr("sourcingChat.saveAndSearch")} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-[#616161] font-bold">{tr("sourcingChat.skillMappingDesc")}</p>
                        <textarea 
                            rows={3}
                            value={competitors}
                            onChange={(e) => setCompetitors(e.target.value)}
                            placeholder={tr("sourcingChat.skillMappingPlaceholder")}
                            className="w-full bg-white border border-[#E0E0E0] rounded-[4px] px-4 py-3 text-[13.5px] font-medium text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                        />
                        <button 
                            onClick={() => setIsCompetitorModalOpen(false)}
                            className="w-full h-10 bg-[#F5F6F8] hover:bg-[#E0E0E0] text-[#4F4F4F] text-[13px] font-semibold rounded-[4px] transition-colors border border-[#E0E0E0]"
                        >
                            {tr("sourcingChat.cancel")}
                        </button>
                    </div>
                </div>
            )}


            {/* Sliding Drawer Panel */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm" role="button" tabIndex={0} onClick={() => setSelectedProfile(null)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setSelectedProfile(null); } }} />
                    <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#212121] flex items-center gap-2">
                                <User className="w-5 h-5 text-[#1976D2]" /> {tr("sourcingChat.candidateDossier")}
                            </h3>
                            <button 
                                onClick={() => setSelectedProfile(null)} 
                                className="p-2 hover:bg-[#FAFAFA] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={selectedProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.full_name)}&background=random&color=fff&size=128`} 
                                    alt={selectedProfile.full_name} 
                                    className="w-16 h-16 rounded-[4px] object-cover border-2 border-[#E0E0E0] shadow-sm"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.full_name)}&background=random&color=fff&size=128`;
                                    }}
                                />
                                <div>
                                    <h2 className="text-lg font-extrabold text-[#212121]">{selectedProfile.full_name}</h2>
                                    <p className="text-[11px] font-bold text-[#1976D2] mt-1 uppercase tracking-wider flex items-center gap-1">
                                        {selectedProfile.platform} {tr("sourcingChat.sourced")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[#E0E0E0]">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">{tr("sourcingChat.professionalRole")}</span>
                                    <p className="text-[14px] font-semibold text-[#212121]">{selectedProfile.headline || tr("sourcingChat.unspecifiedSpecialty")}</p>
                                </div>

                                {selectedProfile.location && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">{tr("sourcingChat.geography")}</span>
                                        <p className="text-[13px] font-medium text-[#424242] flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[#9E9E9E]" /> {selectedProfile.location}
                                        </p>
                                    </div>
                                )}

                                {selectedProfile.company && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">{tr("sourcingChat.organization")}</span>
                                        <p className="text-[13px] font-medium text-[#424242] flex items-center gap-2">
                                            <Building className="w-4 h-4 text-[#9E9E9E]" /> {selectedProfile.company}
                                        </p>
                                    </div>
                                )}

                                {selectedProfile.email && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">{tr("sourcingChat.contactEmail")}</span>
                                        <p className="text-[13px] font-medium text-[#424242] flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[#9E9E9E]" /> {selectedProfile.email}
                                        </p>
                                    </div>
                                )}

                                {selectedProfile.raw_data && selectedProfile.raw_data.phone && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.phoneNumber")}</span>
                                        <p className="text-xs font-bold text-[#4F4F4F] flex items-center gap-1">
                                            <Phone className="w-4 h-4 text-[#BDBDBD]" /> {selectedProfile.raw_data.phone}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Statistics Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#EEEEEE]">
                                {selectedProfile.followers !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.followers")}</span>
                                        <p className="text-xs font-bold text-[#424242]">{selectedProfile.followers}</p>
                                    </div>
                                )}
                                {selectedProfile.following !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.following")}</span>
                                        <p className="text-xs font-bold text-[#424242]">{selectedProfile.following}</p>
                                    </div>
                                )}
                                {selectedProfile.public_repos !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.publicRepos")}</span>
                                        <p className="text-xs font-bold text-[#424242]">{selectedProfile.public_repos}</p>
                                    </div>
                                )}
                                {selectedProfile.blog && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.websiteBlog")}</span>
                                        <a href={selectedProfile.blog} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#1976D2] hover:underline block truncate">
                                            {selectedProfile.blog}
                                        </a>
                                    </div>
                                )}
                                {selectedProfile.hireable !== undefined && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.openToWork")}</span>
                                        <p className="text-xs font-bold text-[#424242]">{selectedProfile.hireable ? tr("sourcingChat.yes") : tr("sourcingChat.no")}</p>
                                    </div>
                                )}
                            </div>

                            {/* Social Links */}
                            {selectedProfile.social_links && selectedProfile.social_links.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-[#EEEEEE]">
                                    <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.associatedProfiles")}</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProfile.social_links.map((link: any, lIdx: number) => (
                                            <a 
                                                key={lIdx} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="px-2.5 py-1 bg-[#FAFAFA] text-[#4F4F4F] hover:text-[#1976D2] text-[10px] font-bold rounded-lg border border-[#E0E0E0] hover:border-[#BBDEFB] transition-all flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" /> {link.provider || tr("sourcingChat.link")}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProfile.ai_summary && (
                                <div className="space-y-2 pt-4 border-t border-[#EEEEEE]">
                                    <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-[#1976D2]" /> {tr("sourcingChat.aiSummaryAssessment")}
                                    </span>
                                    <div className="bg-[#FAFAFA]/80 p-4 rounded-2xl text-xs font-semibold text-[#4F4F4F] leading-relaxed border border-[#E0E0E0]/30 shadow-inner">
                                        {selectedProfile.ai_summary}
                                    </div>
                                </div>
                            )}

                            {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-[#EEEEEE]">
                                    <span className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">{tr("sourcingChat.keyProficiencies")}</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProfile.skills.map((skill, sIdx) => (
                                            <span key={sIdx} className="px-2.5 py-1 bg-[#FAFAFA] text-[#4F4F4F] text-[10px] font-bold rounded-lg border border-[#E0E0E0]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[#E0E0E0] flex gap-3">
                            <a 
                                href={selectedProfile.profile_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1 h-[42px] bg-[#212121] hover:bg-[#263238] text-white rounded-[4px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                {tr("sourcingChat.visitSourceProfile")} <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
            {/* Shortlist Job Modal */}
            {isShortlistModalOpen && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-w-md w-full mx-4 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[15px] font-bold text-[#212121] flex items-center gap-2">
                                    <Bookmark className="w-4 h-4 text-[#1976D2]" /> {tr("sourcingChat.shortlistToJob")}
                                </h3>
                                <p className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">{tr("sourcingChat.assigning")} {profileToShortlist?.full_name}</p>
                            </div>
                            <button onClick={() => setIsShortlistModalOpen(false)} className="p-1.5 hover:bg-[#EEEEEE] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="shortlist-job-role" className="text-[11px] font-bold uppercase tracking-wider text-[#616161] ml-1">{tr("sourcingChat.chooseJobRole")}</label>
                                <div id="shortlist-job-role" className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                                    {jobs.length === 0 ? (
                                        <div className="p-4 bg-[#FAFAFA] rounded-[4px] border border-[#E0E0E0] text-center">
                                            <p className="text-[12px] font-bold text-[#616161] italic">{tr("sourcingChat.noActiveJobs")}</p>
                                        </div>
                                    ) : (
                                        // When sourcing for a specific job (from the Pipeline), only that job is
                                        // shortlistable; otherwise the user can pick any job.
                                        (lockedJobId ? jobs.filter(j => j.id === lockedJobId) : jobs).map(job => (
                                            <button
                                                key={job.id}
                                                onClick={() => setSelectedJobId(job.id)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-[4px] border transition-all text-left ${
                                                    selectedJobId === job.id 
                                                        ? 'bg-[#E3F2FD] border-[#BBDEFB] text-[#1565C0] ring-1 ring-[#BBDEFB]' 
                                                        : 'bg-white border-[#E0E0E0] text-[#4F4F4F] hover:border-[#E0E0E0]'
                                                }`}
                                            >
                                                <span className="text-xs font-bold">{job.title}</span>
                                                {selectedJobId === job.id && <div className="w-2 h-2 rounded-full bg-[#1976D2] shadow-glow animate-pulse" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsShortlistModalOpen(false)}
                                className="flex-1 h-10 px-4 bg-[#F5F6F8] border border-[#E0E0E0] text-[#4F4F4F] text-[13px] font-semibold rounded-[4px] transition-colors"
                            >
                                {tr("sourcingChat.cancel")}
                            </button>
                            <button
                                onClick={handleShortlistConfirm}
                                disabled={!selectedJobId || isShortlisting}
                                className="flex-2 h-10 px-5 bg-[#1976D2] hover:bg-[#1565C0] text-white text-[13px] font-semibold rounded-[4px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-colors disabled:opacity-50"
                            >
                                {isShortlisting ? tr("sourcingChat.adding") : tr("sourcingChat.confirmShortlist")}
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
                            className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-[100]"
                        />
                        
                        {/* Right-Side Sidebar Drawer */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#E0E0E0]"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 bg-white border-b border-[#E0E0E0] flex items-center justify-between gap-3 shrink-0">
                                <div>
                                    <h2 className="text-[20px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#1976D2]" /> {tr("sourcingChat.history")}
                                    </h2>
                                    <p className="text-[13px] text-[#757575] mt-0.5">{tr("sourcingChat.historySubtitle")}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={createNewChat}
                                        className="p-2 hover:bg-[#F5F6F8] rounded-[4px] text-[#1976D2] transition-colors animate-in fade-in"
                                        title={tr("sourcingChat.newChat")}
                                    >
                                        <Edit className="w-4.5 h-4.5" />
                                    </button>
                                    <button 
                                        onClick={() => setIsHistoryOpen(false)} 
                                        className="w-9 h-9 rounded-[4px] hover:bg-[#F5F6F8] flex items-center justify-center text-[#9E9E9E] hover:text-[#424242] transition-colors border border-transparent hover:border-[#E0E0E0]"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* History List Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#FAFAFA]/30">
                                {sessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                        <div className="w-12 h-12 rounded-[4px] bg-[#E3F2FD] flex items-center justify-center text-[#1976D2] mb-3">
                                            <Bookmark className="w-6 h-6" />
                                        </div>
                                        <p className="text-[13px] font-semibold text-[#212121]">{tr("sourcingChat.noChatHistory")}</p>
                                        <p className="text-[11.5px] text-[#757575] mt-1">{tr("sourcingChat.startSearchToSave")}</p>
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
                                            className={`group relative p-4 rounded-[4px] border transition-all cursor-pointer ${
                                                currentSessionId === session.session_id
                                                    ? "bg-white border-[#BBDEFB] shadow-md shadow-indigo-500/5 ring-1 ring-[#1976D2]/15"
                                                    : "bg-white border-[#E0E0E0] hover:bg-[#F5F6F8] hover:border-[#BBDEFB]/50 shadow-sm"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${currentSessionId === session.session_id ? 'bg-[#1976D2] animate-pulse' : 'bg-[#E0E0E0]'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[12.5px] font-semibold truncate ${currentSessionId === session.session_id ? 'text-[#212121]' : 'text-[#424242]'}`}>
                                                        {session.title || tr("sourcingChat.untitledSearch")}
                                                    </p>
                                                    <p className="text-[9px] font-medium text-[#9E9E9E] mt-0.5">
                                                        {new Date(session.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => deleteSession(e, session.session_id)}
                                                    title={tr("sourcingChat.deleteHistory")}
                                                    className="p-1.5 hover:bg-red-50 text-[#9E9E9E] hover:text-[#C62828] rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Pro Sourcing Active Footer */}
                            <div className="p-4 bg-white border-t border-[#E0E0E0] shrink-0">
                                <div className="bg-[#E3F2FD]/60 rounded-[4px] p-3 border border-[#BBDEFB]/85">
                                    <p className="text-[12px] font-bold text-[#1976D2] flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-[#1976D2]" /> {tr("sourcingChat.proSourcingActive")}
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

