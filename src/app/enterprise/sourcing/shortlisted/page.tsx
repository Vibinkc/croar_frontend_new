"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Link2,
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
    Phone,
    BarChart3,
    X
} from "@/components/icons";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";
import { Chart } from "react-google-charts";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import { jetbrainsMono, PageHelp } from "@/components/ds";

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
    owner?: string;
}

// Outreach statuses for the Shortlist status dropdown (matches the backend allow-list).
const OUTREACH_STATUSES = ["Not Contacted", "Contacted", "Responded", "Interested", "Not a fit", "Hired"];
const statusDot = (s?: string) => {
    switch (s) {
        case "Contacted": case "mail_sent": return "bg-[#EF6C00]";
        case "Responded": case "Interested": case "Interest Expressed": case "applied": return "bg-[#2E7D32]";
        case "Hired": return "bg-[#1976D2]";
        case "Not a fit": return "bg-[#C62828]";
        default: return "bg-[#1E88E5]"; // Not Contacted
    }
};

const shortlistTimeAgo = (iso?: string): string => {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "—";
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    const mins = Math.floor(secs / 60), hrs = Math.floor(mins / 60), days = Math.floor(hrs / 24);
    if (secs < 60) return "just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    if (days === 1) return "a day ago";
    if (days < 30) return `${days} days ago`;
    return new Date(iso).toLocaleDateString();
};

// Best-effort city/region string → ISO country code (for the regions map, which needs no API key).
const extractCountry = (location: string): string | null => {
    const s = (location || "").toLowerCase();
    if (!s) return null;
    if (/\b(usa|u\.s\.|united states|america)\b/.test(s) || /\b(california|texas|new york|florida|washington|illinois|massachusetts|dallas|plano|coppell|austin|houston|seattle|san francisco|chicago|boston|los angeles|new jersey|georgia|atlanta|denver|colorado|arizona|oregon|virginia|ohio|michigan|fort worth)\b/.test(s)) return "US";
    if (/\b(india|bangalore|bengaluru|mumbai|delhi|pune|chennai|hyderabad|kolkata|noida|gurgaon|gurugram)\b/.test(s)) return "IN";
    if (/\b(uk|united kingdom|england|london|manchester|britain|scotland|wales)\b/.test(s)) return "GB";
    if (/\b(germany|berlin|munich|münchen|hamburg|frankfurt)\b/.test(s)) return "DE";
    if (/\b(canada|toronto|vancouver|montreal|ottawa)\b/.test(s)) return "CA";
    if (/\b(australia|sydney|melbourne|brisbane|perth)\b/.test(s)) return "AU";
    if (/\b(france|paris|lyon)\b/.test(s)) return "FR";
    if (/\b(brazil|sao paulo|são paulo|rio)\b/.test(s)) return "BR";
    if (/\b(netherlands|amsterdam)\b/.test(s)) return "NL";
    if (/\b(spain|madrid|barcelona)\b/.test(s)) return "ES";
    if (/\b(singapore)\b/.test(s)) return "SG";
    if (/\b(japan|tokyo|osaka)\b/.test(s)) return "JP";
    if (/\b(china|beijing|shanghai|shenzhen)\b/.test(s)) return "CN";
    if (/\b(ireland|dublin)\b/.test(s)) return "IE";
    if (/\b(pakistan|karachi|lahore)\b/.test(s)) return "PK";
    if (/\b(nigeria|lagos)\b/.test(s)) return "NG";
    if (/\b(uae|dubai|abu dhabi|emirates)\b/.test(s)) return "AE";
    // Fallback: last comma-separated token that looks like a country name.
    const last = s.split(",").map(x => x.trim()).pop() || "";
    return last.length >= 4 && last.length <= 24 && /^[a-z ]+$/.test(last) ? last.toUpperCase() : null;
};

const socialLinkFor = (profile: any, kind: "linkedin" | "github"): string | null => {
    if (!profile) return null;
    const links = profile.social_links || [];
    const hit = links.find((l: any) => (l?.provider || "").toLowerCase().includes(kind));
    if (hit?.url) return hit.url;
    if ((profile.platform || "").toLowerCase().includes(kind) && profile.profile_url) return profile.profile_url;
    return null;
};

type StatItem = { label: string; count: number; pct: number };
const CHART_PALETTE = ["#1976D2", "#42A5F5", "#66BB6A", "#FFB74D", "#42A5F5", "#E53935", "#2E7D32", "#A78BFA"];
const STATUS_HEX: Record<string, string> = {
    "Not Contacted": "#1E88E5", "Contacted": "#EF6C00", "Responded": "#2E7D32",
    "Interested": "#43A047", "Not a fit": "#C62828", "Hired": "#1976D2",
};

const CardShell = ({ title, subtitle, empty, isEmpty, children }: { title: string; subtitle?: string; empty?: string; isEmpty?: boolean; children: React.ReactNode }) => (
    <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#212121]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#757575] mt-0.5 mb-3">{subtitle}</p>}
        {!subtitle && <div className="mb-3" />}
        {isEmpty ? <p className="text-[13px] text-[#9E9E9E] py-6 text-center">{empty}</p> : children}
    </div>
);

// Donut with center total + legend.
function DonutCard({ title, subtitle, empty, items, colorFor }: { title: string; subtitle?: string; empty: string; items: StatItem[]; colorFor?: (label: string, i: number) => string }) {
    const total = items.reduce((s, d) => s + d.count, 0);
    const color = (label: string, i: number) => colorFor ? colorFor(label, i) : CHART_PALETTE[i % CHART_PALETTE.length];
    return (
        <CardShell title={title} subtitle={subtitle} isEmpty={total === 0} empty={empty}>
            <div className="flex items-center gap-5">
                <div className="relative w-[140px] h-[140px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={items} dataKey="count" nameKey="label" innerRadius={44} outerRadius={68} paddingAngle={2} stroke="none">
                                {items.map((d, i) => <Cell key={i} fill={color(d.label, i)} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-[22px] font-semibold text-[#212121] leading-none ${jetbrainsMono.className}`}>{total}</span>
                        <span className="text-[10px] text-[#757575] mt-0.5">total</span>
                    </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                    {items.map((d, i) => (
                        <div key={d.label} className="flex items-center gap-2 text-[12.5px]">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color(d.label, i) }} />
                            <span className="flex-1 text-[#424242] truncate" title={d.label}>{d.label}</span>
                            <span className="font-bold text-[#212121]">{d.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </CardShell>
    );
}

// Frequency-scaled tag cloud (for skills).
function TagCloudCard({ title, empty, items }: { title: string; empty: string; items: StatItem[] }) {
    const max = Math.max(...items.map((i) => i.count), 1);
    return (
        <CardShell title={title} isEmpty={items.length === 0} empty={empty}>
            <div className="flex flex-wrap gap-2 items-center pt-1">
                {items.map((it) => {
                    const scale = it.count / max; // 0..1
                    const fs = 12 + Math.round(scale * 8); // 12..20px
                    return (
                        <span key={it.label} style={{ fontSize: `${fs}px`, opacity: 0.55 + scale * 0.45 }} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F3F9FE] text-[#0D47A1] font-bold">
                            {it.label}<span className="text-[10px] font-semibold opacity-70">{it.count}</span>
                        </span>
                    );
                })}
            </div>
        </CardShell>
    );
}

// Dark rounded tooltip (matches the reference chart).
function ChartTooltip({ active, payload, label, noun = "candidates", suffix = "" }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-[4px] px-3.5 py-2.5" style={{ background: "#1B1D24", boxShadow: "0 10px 28px rgba(0,0,0,0.28)" }}>
            <div className="text-[11px] text-[#9E9E9E] mb-1">{label}{suffix}</div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                <span className="w-2 h-2 rounded-full" style={{ background: "#5B9BF5" }} />
                <span><b>{payload[0].value}</b> {noun}</span>
            </div>
        </div>
    );
}

// Smooth area/line chart (for skills) — same look as the experience distribution.
function AreaCard({ title, empty, items, noun }: { title: string; empty: string; items: StatItem[]; noun?: string }) {
    const data = items.slice(0, 10);
    return (
        <CardShell title={title} isEmpty={data.length === 0} empty={empty}>
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 78 }}>
                    <defs>
                        <linearGradient id="skillFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1E88E5" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#1E88E5" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="label"
                        interval={0}
                        angle={-90}
                        textAnchor="end"
                        height={92}
                        tickMargin={8}
                        tick={{ fontSize: 10, fill: "#757575" }}
                        tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + "…" : v)}
                    />
                    <YAxis allowDecimals={false} width={26} tick={{ fontSize: 10, fill: "#757575" }} />
                    <Tooltip cursor={{ stroke: "#BDBDBD", strokeWidth: 1 }} content={<ChartTooltip noun={noun || "candidates"} />} />
                    <Area type="monotone" dataKey="count" stroke="#1E88E5" strokeWidth={2.5} fill="url(#skillFill)" dot={{ r: 3, fill: "#1E88E5", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
            </ResponsiveContainer>
        </CardShell>
    );
}

export default function ShortlistedTalentPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const [shortlists, setShortlists] = useState<ShortlistedProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
    const [selectedSource, setSelectedSource] = useState<string>("ALL");
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingCandidate, setMovingCandidate] = useState<ShortlistedProfile | null>(null);
    const [isMoving, setIsMoving] = useState(false);
    const [allJobs, setAllJobs] = useState<{id: string, title: string}[]>([]);
    const [view, setView] = useState<"list" | "insights">("list");
    const [openStatusId, setOpenStatusId] = useState<string | null>(null);
    const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

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
        if (!confirm(t("shortlisted.confirmRemove"))) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setShortlists(prev => prev.filter(s => s.shortlist_id !== id));
            } else {
                alert(t("shortlisted.removeError"));
            }
        } catch (e) {
            console.error("Failed to remove shortlist", e);
            alert(t("shortlisted.removeErrorConn"));
        }
    };

    const updateStatus = async (item: ShortlistedProfile, status: string) => {
        setOpenStatusId(null);
        setSavingStatusId(item.shortlist_id);
        setShortlists(prev => prev.map(s => s.shortlist_id === item.shortlist_id ? { ...s, status } : s));
        try {
            await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${item.shortlist_id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
        } catch { /* ignore */ } finally {
            setSavingStatusId(null);
        }
    };

    // --- Bulk actions (wired to the existing per-item endpoints) ---
    const bulkRemove = async () => {
        if (selectedIds.size === 0 || !token) return;
        const ids = Array.from(selectedIds);
        if (!confirm(t("shortlisted.bulkRemoveConfirm").replace("{count}", String(ids.length)))) return;
        const results = await Promise.allSettled(
            ids.map(id => fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            }))
        );
        const okIds = ids.filter((_, i) => {
            const r = results[i];
            return r.status === "fulfilled" && r.value.ok;
        });
        setShortlists(prev => prev.filter(s => !okIds.includes(s.shortlist_id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        if (okIds.length < ids.length) {
            alert(t("shortlisted.bulkRemovePartial").replace("{ok}", String(okIds.length)).replace("{total}", String(ids.length)));
        }
    };

    const bulkSendJD = async () => {
        if (selectedIds.size === 0 || !token) return;
        const items = shortlists.filter(s => selectedIds.has(s.shortlist_id));
        const withEmail = items.filter(s => s.profile?.email);
        const noEmail = items.length - withEmail.length;
        if (withEmail.length === 0) {
            alert(t("shortlisted.noEmailsBulk"));
            return;
        }
        if (!confirm(t("shortlisted.bulkSendConfirm").replace("{count}", String(withEmail.length)))) return;
        const results = await Promise.allSettled(
            withEmail.map(s => fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/send-jd`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    email: s.profile.email,
                    full_name: s.profile.full_name,
                    job_title: s.job_title,
                    job_id: s.job_id,
                    profile_url: s.profile.profile_url,
                })
            }))
        );
        const sentIds = new Set<string>();
        results.forEach((r, i) => {
            if (r.status === "fulfilled" && r.value.ok) sentIds.add(withEmail[i].shortlist_id);
        });
        setShortlists(prev => prev.map(s => sentIds.has(s.shortlist_id) ? { ...s, status: "mail_sent" } : s));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        const failed = withEmail.length - sentIds.size;
        alert(
            t("shortlisted.bulkSendResult").replace("{count}", String(sentIds.size)) +
            (noEmail ? t("shortlisted.bulkSendSkipped").replace("{count}", String(noEmail)) : "") +
            (failed ? t("shortlisted.bulkSendFailed").replace("{count}", String(failed)) : "")
        );
    };

    const [isSendingJD, setIsSendingJD] = useState<string | null>(null);

    const sendJD = async (profile: any, jobTitle: string, jobId: string) => {
        if (!token) return;

        const candidateEmail = profile.email;
        if (!candidateEmail) {
            alert(t("shortlisted.noEmailSingle"));
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
                alert(t("shortlisted.sendJDSuccess").replace("{job}", jobTitle).replace("{name}", profile.full_name).replace("{email}", candidateEmail));

                // Update local state to show 'mail_sent' status
                setShortlists(prev => prev.map(item => {
                    if (item.job_id === jobId && item.profile.email === candidateEmail) {
                        return { ...item, status: 'mail_sent' };
                    }
                    return item;
                }));
            } else {
                const error = await res.json();
                alert(t("shortlisted.sendJDFailed").replace("{error}", error.detail || t("shortlisted.unknownError")));
            }
        } catch (e) {
            console.error("Failed to send JD", e);
            alert(t("shortlisted.sendJDError"));
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
            alert(t("shortlisted.micError"));
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

    const jobOptions = allJobs.length > 0 ? allJobs : Array.from(new Set(shortlists.map(s => JSON.stringify({ id: s.job_id, title: s.job_title }))))
        .map(j => JSON.parse(j));

    const stats = {
        total: shortlists.length,
        github: shortlists.filter(s => s.profile && s.profile.platform === "github").length,
        linkedin: shortlists.filter(s => s.profile && s.profile.platform === "linkedin").length,
        others: shortlists.filter(s => s.profile && s.profile.platform !== "github" && s.profile.platform !== "linkedin").length
    };

    // Aggregate insights — computed only from data we actually store per shortlisted profile
    // (status, skills, location, company, job, source, contactability). Nothing fabricated.
    const insights = useMemo(() => {
        const list = shortlists;
        const total = list.length;
        const denom = total || 1;
        const tally = (get: (s: ShortlistedProfile) => string[]) => {
            const m = new Map<string, number>();
            for (const s of list) for (const v of get(s)) { const t = (v || "").trim(); if (t) m.set(t, (m.get(t) || 0) + 1); }
            return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
        };
        const pctList = (entries: [string, number][], n: number) =>
            entries.slice(0, n).map(([label, count]) => ({ label, count, pct: Math.round((count / denom) * 100) }));
        // Tally the ACTUAL status values present (incl. legacy ones like "Shortlisted"/"mail_sent"),
        // so the chart always reflects real data instead of only the fixed outreach list.
        const statusCounts = tally(s => [s.status || "Not Contacted"]).map(([label, count]) => ({ label, count }));

        // Years of experience — parsed from whatever field a profile happens to carry (often absent
        // on sourced profiles, so this can be empty).
        const parseExp = (s: ShortlistedProfile): number | null => {
            const raw = s.candidate_interest?.total_experience ?? s.profile?.total_experience ?? s.profile?.years_experience ?? s.profile?.raw_data?.total_experience;
            if (raw == null) return null;
            const m = String(raw).match(/(\d+(?:\.\d+)?)/);
            const n = m ? Number.parseFloat(m[1]) : Number.NaN;
            return Number.isNaN(n) ? null : Math.min(n, 50);
        };
        const expValues = list.map(parseExp).filter((n): n is number => n != null).sort((a, b) => a - b);
        const pctile = (p: number) => {
            if (!expValues.length) return 0;
            const idx = Math.min(expValues.length - 1, Math.floor((p / 100) * expValues.length));
            return expValues[idx];
        };
        const expStats = expValues.length ? {
            count: expValues.length,
            avg: Math.round((expValues.reduce((a, b) => a + b, 0) / expValues.length) * 10) / 10,
            p25: pctile(25), median: pctile(50), p75: pctile(75),
        } : null;
        let expDist: { year: string; count: number }[] = [];
        if (expValues.length) {
            const min = Math.floor(expValues[0]);
            const max = Math.ceil(expValues[expValues.length - 1]);
            const buckets = new Map<number, number>();
            for (const v of expValues) buckets.set(Math.round(v), (buckets.get(Math.round(v)) || 0) + 1);
            expDist = [];
            for (let y = min; y <= max; y++) expDist.push({ year: String(y), count: buckets.get(y) || 0 });
        }

        return {
            total,
            contactable: list.filter(s => s.profile?.email).length,
            contacted: list.filter(s => (s.status || "Not Contacted") !== "Not Contacted").length,
            statusCounts,
            skills: pctList(tally(s => (s.profile?.skills as string[] | undefined) || []), 10),
            locations: pctList(tally(s => [s.profile?.location || ""]), 8),
            countryMap: (() => {
                const m = new Map<string, number>();
                for (const s of list) { const c = extractCountry(s.profile?.location || ""); if (c) m.set(c, (m.get(c) || 0) + 1); }
                return Array.from(m.entries());
            })(),
            jobs: pctList(tally(s => [s.job_title || ""]), 8),
            expStats,
            expDist,
        };
    }, [shortlists]);

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
                alert(t("shortlisted.moveSuccess").replace("{job}", targetJobTitle));
                setIsMoveModalOpen(false);
                setMovingCandidate(null);
                fetchShortlists();
            } else {
                alert(t("shortlisted.moveFailed"));
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
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{t("shortlisted.title")}</h1>
                        <PageHelp title={t("shortlisted.helpTitle")}>
                            <p>{t("shortlisted.helpBody")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{t("shortlisted.subtitle")}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                        href="/enterprise/sourcing/chat"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold hover:bg-[#1565C0] shadow-[0_4px_12px_rgba(25,118,210,0.28)] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {t("shortlisted.sourceTalent")}
                    </Link>
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: t("shortlisted.statTotal"), value: stats.total, Icon: Users, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.3)" },
                    { label: t("shortlisted.statGithub"), value: stats.github, Icon: Github, grad: "linear-gradient(135deg,#3A3D45,#212121)", glow: "rgba(0,0,0,0.25)" },
                    { label: t("shortlisted.statLinkedin"), value: stats.linkedin, Icon: Linkedin, grad: "linear-gradient(135deg,#60A5FA,#1565C0)", glow: "rgba(21,101,192,0.3)" },
                    { label: t("shortlisted.statOthers"), value: stats.others, Icon: Sparkles, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.3)" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative bg-white border border-[#E0E0E0] hover:border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden transition-all duration-300 hover:shadow-sm"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{s.label}</span>
                                <div className={`text-[30px] font-semibold tracking-[-1px] text-[#212121] mt-2 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-10 h-10 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-[18px] h-[18px]" />
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isListening ? t("shortlisted.listening") : t("shortlisted.searchPlaceholder")}
                        className={`w-full h-11 bg-white border rounded-[4px] pl-11 pr-11 text-sm font-semibold text-[#263238] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 transition-all shadow-sm ${
                            isListening ? 'border-red-300 ring-2 ring-red-200' : 'border-[#E0E0E0] focus:border-[#1976D2]'
                        }`}
                    />
                    <button
                        onClick={toggleSpeechRecognition}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-[#9E9E9E] hover:bg-[#F5F6F8] hover:text-[#4F4F4F]'}`}
                        title={isListening ? t("shortlisted.stopListening") : t("shortlisted.voiceSearch")}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>

                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if (isSelectionMode) setSelectedIds(new Set());
                    }}
                    className={`h-11 px-4 rounded-[4px] flex items-center gap-2 text-[13px] font-semibold transition-all active:scale-95 border ${
                        isSelectionMode
                            ? 'bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB] shadow-sm'
                            : 'bg-white border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BBDEFB] hover:bg-[#FAFAFA] shadow-sm'
                    }`}
                >
                    {isSelectionMode ? <CheckSquare className="w-4 h-4 text-[#1976D2]" /> : <Square className="w-4 h-4" />}
                    <span>{isSelectionMode ? t("shortlisted.exitSelection") : t("shortlisted.select")}</span>
                </button>

                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E]">
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="bg-white border border-[#E0E0E0] rounded-[4px] h-11 pl-9 pr-9 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] hover:bg-[#FAFAFA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm min-w-[180px]"
                    >
                        <option value="ALL">{t("shortlisted.allJobRoles")}</option>
                        {jobOptions.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E]">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="bg-white border border-[#E0E0E0] rounded-[4px] h-11 pl-9 pr-9 text-[13.5px] font-semibold text-[#424242] hover:border-[#BBDEFB] hover:bg-[#FAFAFA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm min-w-[160px]"
                    >
                        <option value="ALL">{t("shortlisted.allSources")}</option>
                        <option value="AI Sourcing">{t("shortlisted.aiSourcing")}</option>
                        <option value="Job Portal">{t("shortlisted.jobPortal")}</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                </div>

                <button
                    onClick={() => setView(v => v === "insights" ? "list" : "insights")}
                    className="h-11 px-4 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] font-semibold text-[#424242] hover:bg-[#FAFAFA] hover:border-[#BBDEFB] shadow-sm flex items-center gap-2 md:ml-auto"
                >
                    {view === "insights" ? <><List className="w-4 h-4 text-[#1976D2]" /> {t("shortlisted.viewList")}</> : <><BarChart3 className="w-4 h-4 text-[#1976D2]" /> {t("shortlisted.viewInsights")}</>}
                </button>
            </div>

            {view === "insights" ? (
                insights.total === 0 ? (
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-16 text-center shadow-sm">
                        <div className="w-12 h-12 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center mx-auto mb-3"><BarChart3 className="w-6 h-6" /></div>
                        <p className="text-[14px] font-bold text-[#212121]">{t("shortlisted.noInsights")}</p>
                        <p className="text-[12.5px] text-[#757575] mt-1">{t("shortlisted.noInsightsDesc")}</p>
                    </div>
                ) : (
                <div className="space-y-5">
                    {/* Top Locations — city list + map */}
                    <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
                        <h3 className="text-[15px] font-bold text-[#212121]">{t("shortlisted.topLocations")}</h3>
                        <p className="text-[12px] text-[#757575] mt-0.5 mb-4">{t("shortlisted.topCities")}</p>
                        {insights.locations.length === 0 ? (
                            <p className="text-[13px] text-[#9E9E9E] py-6 text-center">{t("shortlisted.noLocationData")}</p>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
                                <div className="space-y-1">
                                    {insights.locations.map((l) => (
                                        <div key={l.label} className="flex items-center justify-between gap-3 py-1.5 border-b border-[#F5F6F8] last:border-0">
                                            <span className="text-[13px] font-semibold text-[#424242] truncate" title={l.label}>{l.label}</span>
                                            <span className={`text-[13px] font-bold text-[#212121] ${jetbrainsMono.className}`}>{l.count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-[4px] overflow-hidden border border-[#E0E0E0] bg-[#FAFAFA] min-h-[320px] flex items-center justify-center">
                                    {insights.countryMap.length === 0 ? (
                                        <p className="text-[12.5px] text-[#9E9E9E] px-6 text-center">{t("shortlisted.noCountryMap")}</p>
                                    ) : (
                                        <Chart
                                            chartType="GeoChart"
                                            width="100%"
                                            height="360px"
                                            data={[["Country", "Candidates"], ...insights.countryMap.map(([code, count]) => [code, count] as [string, number])]}
                                            options={{
                                                region: "world",
                                                displayMode: "regions",
                                                colorAxis: { colors: ["#BBDEFB", "#1976D2"] },
                                                backgroundColor: "transparent",
                                                datalessRegionColor: "#EEF0F3",
                                                defaultColor: "#EEEEEE",
                                                legend: "none",
                                                keepAspectRatio: true,
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Key Takeaways */}
                    {(() => {
                        const s = insights.skills, l = insights.locations;
                        const HL = ({ children }: { children: React.ReactNode }) => <span className="bg-[#F3F9FE] text-[#0D47A1] font-semibold px-1.5 py-0.5 rounded-[3px]">{children}</span>;
                        const takes: React.ReactNode[] = [];
                        if (s[0]) takes.push(<>{t("shortlisted.takeMostCommonSkill")} <HL>{s[0].label} ({s[0].pct}%)</HL>{s[1] ? <> {t("shortlisted.takeAlongside")} <HL>{s[1].label} ({s[1].pct}%)</HL></> : null}.</>);
                        if (l[0]) takes.push(<>{t("shortlisted.takeTalentConcentration")} <HL>{l[0].label}</HL> {t("shortlisted.takeLeadsWith")} <HL>{l[0].count} {t("shortlisted.takeCandidatesWord")}</HL>{l[1] ? <>{t("shortlisted.takeFollowedBy")} <HL>{l[1].label}</HL></> : null}.</>);
                        takes.push(<>{t("shortlisted.takeOutreachReadiness")} <HL>{insights.contactable} {t("shortlisted.takeOf")} {insights.total}</HL> {t("shortlisted.takeHaveEmail")} <HL>{insights.contacted}</HL> {t("shortlisted.takeBeenContacted")}</>);
                        if (insights.expStats) takes.push(<>{t("shortlisted.takeExperience")} <HL>{insights.expStats.avg} {t("shortlisted.takeYears")}</HL> {t("shortlisted.takeMedian")} <HL>{insights.expStats.median}</HL>).</>);
                        return (
                            <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#1976D2]" />
                                    <h3 className="text-[15px] font-bold text-[#212121]">{t("shortlisted.keyTakeaways")}</h3>
                                </div>
                                <p className="text-[12px] text-[#757575] mt-0.5 mb-4">{t("shortlisted.signalsShortlist")}</p>
                                <ul className="space-y-3">
                                    {takes.map((t, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#424242] leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-2 shrink-0" />
                                            <span>{t}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })()}

                    {/* Years of Experience + distribution — only when candidates actually carry it. */}
                    {insights.expStats && (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                        <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#212121]">{t("shortlisted.yearsExp")}</h3>
                            <p className="text-[12px] text-[#757575] mt-0.5">{t("shortlisted.totalFulltime")}</p>
                            <div className="text-center mt-5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757575]">{t("shortlisted.average")}</span>
                                <div className={`text-[38px] font-semibold tracking-[-1px] text-[#212121] leading-none mt-1 ${jetbrainsMono.className}`}>{insights.expStats.avg} {t("shortlisted.yrs")}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#E0E0E0] text-center">
                                {[["P25", insights.expStats.p25], [t("shortlisted.medianLabel"), insights.expStats.median], ["P75", insights.expStats.p75]].map(([k, v]) => (
                                    <div key={k as string}>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#757575]">{k}</p>
                                        <p className={`text-[15px] font-extrabold text-[#212121] mt-1 ${jetbrainsMono.className}`}>{v} {t("shortlisted.yrs")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-[4px] border border-[#E0E0E0] p-6 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#212121]">{t("shortlisted.numProfilesByExp")}</h3>
                            <p className="text-[12px] text-[#757575] mt-0.5 mb-3">{t("shortlisted.distExp")}</p>
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={insights.expDist} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#1976D2" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#1976D2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#757575" }} interval={0} />
                                    <YAxis allowDecimals={false} width={28} tick={{ fontSize: 10, fill: "#757575" }} />
                                    <Tooltip cursor={{ stroke: "#BDBDBD", strokeWidth: 1 }} content={<ChartTooltip noun={t("shortlisted.profilesNoun")} suffix={t("shortlisted.yearsExpSuffix")} />} />
                                    <Area type="monotone" dataKey="count" stroke="#1E88E5" strokeWidth={2.5} fill="url(#expFill)" dot={{ r: 3, fill: "#1E88E5", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <DonutCard title={t("shortlisted.statusBreakdown")} subtitle={t("shortlisted.statusBreakdownSub")} empty={t("shortlisted.noCandidatesYet")} items={insights.statusCounts.map(s => ({ ...s, pct: Math.round((s.count / (insights.total || 1)) * 100) }))} colorFor={(label, i) => STATUS_HEX[label] || CHART_PALETTE[i % CHART_PALETTE.length]} />
                        <AreaCard title={t("shortlisted.topSkills")} noun={t("shortlisted.candidatesNoun")} empty={t("shortlisted.noSkillDataCards")} items={insights.skills} />
                        <DonutCard
                            title={t("shortlisted.contactability")}
                            subtitle={t("shortlisted.contactabilitySub")}
                            empty={t("shortlisted.noCandidatesYet")}
                            items={[
                                { label: t("shortlisted.hasEmail"), count: insights.contactable, pct: Math.round((insights.contactable / (insights.total || 1)) * 100) },
                                { label: t("shortlisted.noEmail"), count: insights.total - insights.contactable, pct: Math.round(((insights.total - insights.contactable) / (insights.total || 1)) * 100) },
                            ].filter(x => x.count > 0)}
                            colorFor={(label) => (label === t("shortlisted.hasEmail") ? "#2E7D32" : "#BDBDBD")}
                        />
                        <DonutCard title={t("shortlisted.shortlistedByJob")} subtitle={t("shortlisted.shortlistedByJobSub")} empty={t("shortlisted.notTiedToJob")} items={insights.jobs} />
                    </div>
                </div>
                )
            ) : (
            /* Content Table */
            <div className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#FAFAFA] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredShortlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="relative mb-6">
                            <div className="absolute -inset-3 rounded-full bg-[#1976D2]/12 blur-2xl" />
                            <div className="relative w-16 h-16 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 12px 30px rgba(25,118,210,0.4)" }}>
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#212121] mb-1.5">{t("shortlisted.noCandidates")}</h3>
                        <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-6">{t("shortlisted.noCandidatesDesc")}</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); setSelectedSource("ALL"); }} className="px-6 h-11 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(25,118,210,0.28)] transition-all">{t("shortlisted.clearFilters")}</button>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                {isSelectionMode && (
                                    <th className="px-6 py-3.5 text-left w-[50px]">
                                        <button
                                            onClick={toggleAll}
                                            className="text-[#9E9E9E] hover:text-[#1976D2] transition-all"
                                        >
                                            {selectedIds.size === filteredShortlists.length && filteredShortlists.length > 0
                                                ? <CheckSquare className="w-5 h-5 text-[#1976D2]" />
                                                : <Square className="w-5 h-5" />
                                            }
                                        </button>
                                    </th>
                                )}
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colFullName")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colProfiles")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colStatus")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colDate")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colCurrentRole")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colSkills")}</th>
                                {!isSelectionMode && (
                                    <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{t("shortlisted.colActions")}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEEEEE]">
                            {filteredShortlists.map((item) => (
                                <tr key={item.shortlist_id} className={`hover:bg-[#FAFAFA]/60 transition-colors group ${selectedIds.has(item.shortlist_id) ? 'bg-[#E3F2FD]/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleSelection(item.shortlist_id)}
                                                className="text-[#BDBDBD] hover:text-[#1976D2] transition-all"
                                            >
                                                {selectedIds.has(item.shortlist_id)
                                                    ? <CheckSquare className="w-5 h-5 text-[#1976D2]" />
                                                    : <Square className="w-5 h-5" />
                                                }
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-semibold text-[#212121] group-hover:text-[#1976D2] transition-all whitespace-nowrap">{item.profile?.full_name || 'Candidate'}</span>
                                            {item.profile?.profile_url && (
                                                <a href={item.profile.profile_url} target="_blank" rel="noreferrer" className="text-[#9E9E9E] hover:text-[#1976D2]"><ExternalLink className="w-3.5 h-3.5" /></a>
                                            )}
                                        </div>
                                        {item.profile?.location && <span className="text-[11.5px] text-[#9E9E9E] font-medium">{item.profile.location}</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const p = item.profile || {};
                                            const plat = (p.platform || "").toLowerCase();
                                            const isLi = plat.includes("linkedin");
                                            const isGh = plat.includes("github");
                                            const li = socialLinkFor(p, "linkedin");
                                            const gh = socialLinkFor(p, "github");
                                            const email = p.email;
                                            const phone = p.raw_data?.phone;
                                            // Base icon = the profile's own platform (covers wellfound, arxiv, stackoverflow, …)
                                            // so every sourced profile shows at least one icon.
                                            const showPlatform = p.profile_url && p.platform && !isLi && !isGh;
                                            if (!showPlatform && !li && !gh && !email && !phone) return <span className="text-[#BDBDBD] text-[12px]">—</span>;
                                            return (
                                                <div className="flex items-center gap-2">
                                                    {showPlatform && (
                                                        <a href={p.profile_url} target="_blank" rel="noreferrer" title={p.platform} className="hover:opacity-80">
                                                            <PlatformLogoRenderer platform={p.platform} className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {li && <a href={li} target="_blank" rel="noreferrer" title="LinkedIn" className="text-[#0A66C2] hover:opacity-80"><Linkedin className="w-4 h-4" /></a>}
                                                    {email && <a href={`mailto:${email}`} title={email} className="text-[#616161] hover:text-[#1976D2]"><Mail className="w-4 h-4" /></a>}
                                                    {phone && <a href={`tel:${phone}`} title={phone} className="text-[#616161] hover:text-[#1976D2]"><Phone className="w-4 h-4" /></a>}
                                                    {gh && <a href={gh} target="_blank" rel="noreferrer" title="GitHub" className="text-[#263238] hover:opacity-80"><Github className="w-4 h-4" /></a>}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setOpenStatusId(openStatusId === item.shortlist_id ? null : item.shortlist_id)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#424242] hover:text-[#212121]">
                                                <span className={`w-2 h-2 rounded-full ${statusDot(item.status)}`} />
                                                {item.status || "Not Contacted"}
                                                {savingStatusId === item.shortlist_id ? <div className="w-3 h-3 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9E9E9E]" />}
                                            </button>
                                            {openStatusId === item.shortlist_id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setOpenStatusId(null)} />
                                                    <div className="absolute left-0 top-7 z-50 w-44 bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_12px_30px_rgba(0,0,0,0.16)] p-1.5">
                                                        {OUTREACH_STATUSES.map((s) => (
                                                            <button key={s} onClick={() => updateStatus(item, s)} className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-[4px] text-[12.5px] font-semibold hover:bg-[#FAFAFA] ${(item.status || "Not Contacted") === s ? "text-[#1976D2]" : "text-[#424242]"}`}>
                                                                <span className={`w-2 h-2 rounded-full ${statusDot(s)}`} /> {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#616161] whitespace-nowrap">{shortlistTimeAgo(item.shortlisted_at)}</td>
                                    <td className="px-6 py-4 text-[13px] font-semibold text-[#424242] max-w-[220px] truncate">{item.profile?.headline || "—"}</td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const skills: string[] = (item.profile?.skills || []).filter(Boolean);
                                            if (skills.length === 0) return <span className="text-[#BDBDBD] text-[12px]">—</span>;
                                            return (
                                                <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
                                                    {skills.slice(0, 4).map((sk, si) => (
                                                        <span key={si} className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F3F9FE] text-[#0D47A1] text-[11px] font-semibold whitespace-nowrap">{sk}</span>
                                                    ))}
                                                    {skills.length > 4 && (
                                                        <span className="text-[11px] font-bold text-[#757575]" title={skills.slice(4).join(", ")}>+{skills.length - 4}</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    {!isSelectionMode && (
                                        <td className="px-6 py-5 text-right relative">
                                            <div className="flex items-center justify-end relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === item.shortlist_id ? null : item.shortlist_id);
                                                    }}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-[4px] border transition-all active:scale-95 ${
                                                        activeMenu === item.shortlist_id
                                                            ? 'bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB] shadow-sm'
                                                            : 'text-[#757575] hover:bg-[#F5F6F8] hover:text-[#212121] border-transparent hover:border-[#E0E0E0]'
                                                    }`}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {activeMenu === item.shortlist_id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, x: 15 }}
                                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                                        className="absolute right-[45px] top-0 z-[100] min-w-[190px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_12px_24px_rgba(0,0,0,0.08)] p-1.5"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <a
                                                            href={item.profile?.profile_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4F4F4F] hover:bg-[#F5F6F8] hover:text-[#212121] rounded-[4px] transition-colors group"
                                                        >
                                                            <Eye className="w-4 h-4 text-[#757575] group-hover:text-[#1976D2] transition-colors" />
                                                            {t("shortlisted.viewProfile")}
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                sendJD(item.profile, item.job_title, item.job_id);
                                                                setActiveMenu(null);
                                                            }}
                                                            disabled={isSendingJD === (item.profile.profile_url || item.profile.full_name)}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4F4F4F] hover:bg-[#F5F6F8] hover:text-[#212121] rounded-[4px] transition-colors text-left group disabled:opacity-50"
                                                        >
                                                            {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? (
                                                                <div className="w-4 h-4 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin shrink-0" />
                                                            ) : (
                                                                <Send className="w-4 h-4 text-[#757575] group-hover:text-[#1976D2] transition-colors" />
                                                            )}
                                                            {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? t("shortlisted.sending") : t("shortlisted.sendJD")}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/engagement/${item.shortlist_id}?source=Direct Link`;
                                                                navigator.clipboard.writeText(link);
                                                                alert(t("shortlisted.engagementLinkCopied"));
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4F4F4F] hover:bg-[#F5F6F8] hover:text-[#212121] rounded-[4px] transition-colors text-left group"
                                                        >
                                                            <Link2 className="w-4 h-4 text-[#757575] group-hover:text-[#1976D2] transition-colors" />
                                                            {t("shortlisted.copyEngagementLink")}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setMovingCandidate(item);
                                                                setIsMoveModalOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4F4F4F] hover:bg-[#F5F6F8] hover:text-[#212121] rounded-[4px] transition-colors text-left group"
                                                        >
                                                            <Briefcase className="w-4 h-4 text-[#757575] group-hover:text-[#1976D2] transition-colors" />
                                                            {t("shortlisted.moveToAnotherJob")}
                                                        </button>

                                                        <div className="my-1.5 border-t border-[#EEEEEE]" />

                                                        <button
                                                            onClick={() => {
                                                                removeShortlist(item.shortlist_id);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-[4px] transition-colors text-left group"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
                                                            {t("shortlisted.remove")}
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
                            className="bg-[#212121]/95 backdrop-blur-xl border border-white/10 rounded-[4px] p-4 shadow-[0_20px_50px_rgba(15,23,28,0.3)] flex items-center gap-8 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                                <div className="w-10 h-10 rounded-xl bg-[#1976D2] flex items-center justify-center text-white font-extrabold shadow-sm">
                                    {selectedIds.size}
                                </div>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-white text-[13px] font-bold">{t("shortlisted.candidatesSelected")}</span>
                                    <span className="text-[#757575] text-[9.5px] font-bold uppercase tracking-widest">• {t("shortlisted.readyForBulk")}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={bulkSendJD}
                                    className="h-11 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#1565C0] transition-all hover:shadow-[0_4px_12px_rgba(25,118,210,0.24)] active:scale-95 whitespace-nowrap"
                                >
                                    <Send className="w-4 h-4" />
                                    {t("shortlisted.sendJDToSelected")}
                                </button>

                                <button
                                    onClick={bulkRemove}
                                    className="h-11 px-4 rounded-[4px] bg-white/10 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-rose-600 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t("shortlisted.bulkRemoveBtn")}
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedIds(new Set());
                                        setIsSelectionMode(false);
                                    }}
                                    className="h-11 px-4 text-[#9E9E9E] hover:text-white text-[13px] font-semibold transition-all hover:bg-white/5 rounded-[4px]"
                                >
                                    {t("shortlisted.cancel")}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            )}

            {/* Move to Job Modal */}
            <AnimatePresence>
                {isMoveModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#212121]/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="w-full max-w-md bg-white rounded-[4px] shadow-[0_14px_34px_rgba(0,0,0,0.16)] border border-[#E0E0E0] overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-[#E0E0E0] flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-[16px] font-extrabold text-[#212121] flex items-center gap-2">
                                        <Briefcase className="w-4.5 h-4.5 text-[#1976D2]" /> {t("shortlisted.moveCandidate")}
                                    </h3>
                                    <p className="text-[12.5px] text-[#757575] font-medium">{t("shortlisted.selectTargetJob")} <span className="text-[#1976D2] font-bold">{movingCandidate?.profile.full_name}</span></p>
                                </div>
                                <button onClick={() => setIsMoveModalOpen(false)} className="p-1.5 hover:bg-[#F5F6F8] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 max-h-[350px] overflow-y-auto no-scrollbar space-y-2">
                                {jobOptions.map(job => (
                                    <button
                                        key={job.id}
                                        disabled={job.id === movingCandidate?.job_id}
                                        onClick={() => moveCandidate(job.id, job.title)}
                                        className={`w-full flex items-center justify-between p-3 rounded-[4px] border transition-all text-left group ${
                                            job.id === movingCandidate?.job_id 
                                            ? 'bg-[#FAFAFA] border-[#E0E0E0] opacity-50 cursor-not-allowed'
                                            : 'bg-white border-[#E0E0E0] hover:border-[#1976D2] hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center transition-all ${
                                                job.id === movingCandidate?.job_id ? 'bg-[#E0E0E0] text-[#9E9E9E]' : 'bg-[#FAFAFA] text-[#9E9E9E] group-hover:bg-[#1976D2] group-hover:text-white'
                                            }`}>
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13.5px] font-semibold text-[#212121] truncate max-w-[200px]">{job.title}</span>
                                                <span className="text-[9.5px] font-bold text-[#9E9E9E] uppercase tracking-wider mt-0.5">{t("shortlisted.activeRequisition")}</span>
                                            </div>
                                        </div>
                                        {job.id === movingCandidate?.job_id && (
                                            <span className="text-[10px] font-bold text-[#1976D2] bg-[#E3F2FD] px-2 py-0.5 rounded-[3px] border border-[#BBDEFB]/85">{t("shortlisted.current")}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="px-6 py-4 bg-[#FAFAFA]/50 border-t border-[#E0E0E0] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsMoveModalOpen(false)}
                                    className="px-4 py-2 border border-[#E0E0E0] bg-white hover:bg-[#F5F6F8] text-[13px] font-semibold text-[#424242] rounded-[4px] transition-all"
                                >
                                    {t("shortlisted.cancel")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
