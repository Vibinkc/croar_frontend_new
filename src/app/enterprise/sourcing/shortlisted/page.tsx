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
} from "lucide-react";
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
        case "Contacted": case "mail_sent": return "bg-[#D97706]";
        case "Responded": case "Interested": case "Interest Expressed": case "applied": return "bg-[#15803D]";
        case "Hired": return "bg-[#5B53E0]";
        case "Not a fit": return "bg-[#C0383C]";
        default: return "bg-[#3B82F6]"; // Not Contacted
    }
};

const shortlistTimeAgo = (iso?: string): string => {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "—";
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
const CHART_PALETTE = ["#5B53E0", "#8B7DFF", "#34D399", "#F6B65C", "#6E8BEA", "#EF4444", "#0E8A6E", "#A78BFA"];
const STATUS_HEX: Record<string, string> = {
    "Not Contacted": "#3B82F6", "Contacted": "#D97706", "Responded": "#15803D",
    "Interested": "#10B981", "Not a fit": "#C0383C", "Hired": "#5B53E0",
};

const CardShell = ({ title, subtitle, empty, isEmpty, children }: { title: string; subtitle?: string; empty?: string; isEmpty?: boolean; children: React.ReactNode }) => (
    <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#15171C]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#8A929E] mt-0.5 mb-3">{subtitle}</p>}
        {!subtitle && <div className="mb-3" />}
        {isEmpty ? <p className="text-[13px] text-[#9AA3AF] py-6 text-center">{empty}</p> : children}
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
                        <span className={`text-[22px] font-semibold text-[#15171C] leading-none ${jetbrainsMono.className}`}>{total}</span>
                        <span className="text-[10px] text-[#8A929E] mt-0.5">total</span>
                    </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                    {items.map((d, i) => (
                        <div key={d.label} className="flex items-center gap-2 text-[12.5px]">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color(d.label, i) }} />
                            <span className="flex-1 text-[#374151] truncate" title={d.label}>{d.label}</span>
                            <span className="font-bold text-[#15171C]">{d.count}</span>
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
                        <span key={it.label} style={{ fontSize: `${fs}px`, opacity: 0.55 + scale * 0.45 }} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F4F3FD] text-[#4B4794] font-bold">
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
        <div className="rounded-[12px] px-3.5 py-2.5" style={{ background: "#1B1D24", boxShadow: "0 10px 28px rgba(0,0,0,0.28)" }}>
            <div className="text-[11px] text-[#9AA3AF] mb-1">{label}{suffix}</div>
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
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="label"
                        interval={0}
                        angle={-90}
                        textAnchor="end"
                        height={92}
                        tickMargin={8}
                        tick={{ fontSize: 10, fill: "#8A929E" }}
                        tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + "…" : v)}
                    />
                    <YAxis allowDecimals={false} width={26} tick={{ fontSize: 10, fill: "#8A929E" }} />
                    <Tooltip cursor={{ stroke: "#C4C9D0", strokeWidth: 1 }} content={<ChartTooltip noun={noun || "candidates"} />} />
                    <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} fill="url(#skillFill)" dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
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
            const n = m ? parseFloat(m[1]) : NaN;
            return isNaN(n) ? null : Math.min(n, 50);
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
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{t("shortlisted.title")}</h1>
                        <PageHelp title={t("shortlisted.helpTitle")}>
                            <p>{t("shortlisted.helpBody")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{t("shortlisted.subtitle")}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                        href="/enterprise/sourcing/chat"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold hover:bg-[#4A43C9] shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {t("shortlisted.sourceTalent")}
                    </Link>
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: t("shortlisted.statTotal"), value: stats.total, Icon: Users, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.3)" },
                    { label: t("shortlisted.statGithub"), value: stats.github, Icon: Github, grad: "linear-gradient(135deg,#3A3D45,#15171C)", glow: "rgba(21,23,28,0.25)" },
                    { label: t("shortlisted.statLinkedin"), value: stats.linkedin, Icon: Linkedin, grad: "linear-gradient(135deg,#60A5FA,#3559C7)", glow: "rgba(53,89,199,0.3)" },
                    { label: t("shortlisted.statOthers"), value: stats.others, Icon: Sparkles, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.3)" },
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
                        placeholder={isListening ? t("shortlisted.listening") : t("shortlisted.searchPlaceholder")}
                        className={`w-full h-11 bg-white border rounded-[12px] pl-11 pr-11 text-sm font-semibold text-[#1F2127] placeholder:text-[#9AA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B53E0]/20 transition-all shadow-sm ${
                            isListening ? 'border-red-300 ring-2 ring-red-200' : 'border-[#E1E4E8] focus:border-[#5B53E0]'
                        }`}
                    />
                    <button
                        onClick={toggleSpeechRecognition}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-[#9AA3AF] hover:bg-[#F4F5F7] hover:text-[#4B5563]'}`}
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
                    className={`h-11 px-4 rounded-[12px] flex items-center gap-2 text-[13px] font-semibold transition-all active:scale-95 border ${
                        isSelectionMode
                            ? 'bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6] shadow-sm'
                            : 'bg-white border-[#E1E4E8] text-[#4B5563] hover:border-[#DAD7F6] hover:bg-[#F7F8FA] shadow-sm'
                    }`}
                >
                    {isSelectionMode ? <CheckSquare className="w-4 h-4 text-[#5B53E0]" /> : <Square className="w-4 h-4" />}
                    <span>{isSelectionMode ? t("shortlisted.exitSelection") : t("shortlisted.select")}</span>
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
                        <option value="ALL">{t("shortlisted.allJobRoles")}</option>
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
                        <option value="ALL">{t("shortlisted.allSources")}</option>
                        <option value="AI Sourcing">{t("shortlisted.aiSourcing")}</option>
                        <option value="Job Portal">{t("shortlisted.jobPortal")}</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>

                <button
                    onClick={() => setView(v => v === "insights" ? "list" : "insights")}
                    className="h-11 px-4 rounded-[12px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA] hover:border-[#DAD7F6] shadow-sm flex items-center gap-2 md:ml-auto"
                >
                    {view === "insights" ? <><List className="w-4 h-4 text-[#5B53E0]" /> {t("shortlisted.viewList")}</> : <><BarChart3 className="w-4 h-4 text-[#5B53E0]" /> {t("shortlisted.viewInsights")}</>}
                </button>
            </div>

            {view === "insights" ? (
                insights.total === 0 ? (
                    <div className="bg-white rounded-[14px] border border-[#E8EAED] p-16 text-center shadow-sm">
                        <div className="w-12 h-12 rounded-[14px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center mx-auto mb-3"><BarChart3 className="w-6 h-6" /></div>
                        <p className="text-[14px] font-bold text-[#15171C]">{t("shortlisted.noInsights")}</p>
                        <p className="text-[12.5px] text-[#8A929E] mt-1">{t("shortlisted.noInsightsDesc")}</p>
                    </div>
                ) : (
                <div className="space-y-5">
                    {/* Top Locations — city list + map */}
                    <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6 shadow-sm">
                        <h3 className="text-[15px] font-bold text-[#15171C]">{t("shortlisted.topLocations")}</h3>
                        <p className="text-[12px] text-[#8A929E] mt-0.5 mb-4">{t("shortlisted.topCities")}</p>
                        {insights.locations.length === 0 ? (
                            <p className="text-[13px] text-[#9AA3AF] py-6 text-center">{t("shortlisted.noLocationData")}</p>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
                                <div className="space-y-1">
                                    {insights.locations.map((l) => (
                                        <div key={l.label} className="flex items-center justify-between gap-3 py-1.5 border-b border-[#F4F5F7] last:border-0">
                                            <span className="text-[13px] font-semibold text-[#374151] truncate" title={l.label}>{l.label}</span>
                                            <span className={`text-[13px] font-bold text-[#15171C] ${jetbrainsMono.className}`}>{l.count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-[10px] overflow-hidden border border-[#E8EAED] bg-[#F7F8FA] min-h-[320px] flex items-center justify-center">
                                    {insights.countryMap.length === 0 ? (
                                        <p className="text-[12.5px] text-[#9AA3AF] px-6 text-center">{t("shortlisted.noCountryMap")}</p>
                                    ) : (
                                        <Chart
                                            chartType="GeoChart"
                                            width="100%"
                                            height="360px"
                                            data={[["Country", "Candidates"], ...insights.countryMap.map(([code, count]) => [code, count] as [string, number])]}
                                            options={{
                                                region: "world",
                                                displayMode: "regions",
                                                colorAxis: { colors: ["#DAD7F6", "#5B53E0"] },
                                                backgroundColor: "transparent",
                                                datalessRegionColor: "#EEF0F3",
                                                defaultColor: "#F1F5F9",
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
                        const HL = ({ children }: { children: React.ReactNode }) => <span className="bg-[#F4F3FD] text-[#4B4794] font-semibold px-1.5 py-0.5 rounded-[6px]">{children}</span>;
                        const takes: React.ReactNode[] = [];
                        if (s[0]) takes.push(<>{t("shortlisted.takeMostCommonSkill")} <HL>{s[0].label} ({s[0].pct}%)</HL>{s[1] ? <> {t("shortlisted.takeAlongside")} <HL>{s[1].label} ({s[1].pct}%)</HL></> : null}.</>);
                        if (l[0]) takes.push(<>{t("shortlisted.takeTalentConcentration")} <HL>{l[0].label}</HL> {t("shortlisted.takeLeadsWith")} <HL>{l[0].count} {t("shortlisted.takeCandidatesWord")}</HL>{l[1] ? <>{t("shortlisted.takeFollowedBy")} <HL>{l[1].label}</HL></> : null}.</>);
                        takes.push(<>{t("shortlisted.takeOutreachReadiness")} <HL>{insights.contactable} {t("shortlisted.takeOf")} {insights.total}</HL> {t("shortlisted.takeHaveEmail")} <HL>{insights.contacted}</HL> {t("shortlisted.takeBeenContacted")}</>);
                        if (insights.expStats) takes.push(<>{t("shortlisted.takeExperience")} <HL>{insights.expStats.avg} {t("shortlisted.takeYears")}</HL> {t("shortlisted.takeMedian")} <HL>{insights.expStats.median}</HL>).</>);
                        return (
                            <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#5B53E0]" />
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{t("shortlisted.keyTakeaways")}</h3>
                                </div>
                                <p className="text-[12px] text-[#8A929E] mt-0.5 mb-4">{t("shortlisted.signalsShortlist")}</p>
                                <ul className="space-y-3">
                                    {takes.map((t, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#374151] leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#5B53E0] mt-2 shrink-0" />
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
                        <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#15171C]">{t("shortlisted.yearsExp")}</h3>
                            <p className="text-[12px] text-[#8A929E] mt-0.5">{t("shortlisted.totalFulltime")}</p>
                            <div className="text-center mt-5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A929E]">{t("shortlisted.average")}</span>
                                <div className={`text-[38px] font-semibold tracking-[-1px] text-[#15171C] leading-none mt-1 ${jetbrainsMono.className}`}>{insights.expStats.avg} {t("shortlisted.yrs")}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#E8EAED] text-center">
                                {[["P25", insights.expStats.p25], [t("shortlisted.medianLabel"), insights.expStats.median], ["P75", insights.expStats.p75]].map(([k, v]) => (
                                    <div key={k as string}>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A929E]">{k}</p>
                                        <p className={`text-[15px] font-extrabold text-[#15171C] mt-1 ${jetbrainsMono.className}`}>{v} {t("shortlisted.yrs")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-[14px] border border-[#E8EAED] p-6 shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#15171C]">{t("shortlisted.numProfilesByExp")}</h3>
                            <p className="text-[12px] text-[#8A929E] mt-0.5 mb-3">{t("shortlisted.distExp")}</p>
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={insights.expDist} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#5B53E0" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#5B53E0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#8A929E" }} interval={0} />
                                    <YAxis allowDecimals={false} width={28} tick={{ fontSize: 10, fill: "#8A929E" }} />
                                    <Tooltip cursor={{ stroke: "#C4C9D0", strokeWidth: 1 }} content={<ChartTooltip noun={t("shortlisted.profilesNoun")} suffix={t("shortlisted.yearsExpSuffix")} />} />
                                    <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} fill="url(#expFill)" dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
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
                            colorFor={(label) => (label === t("shortlisted.hasEmail") ? "#15803D" : "#C4C9D0")}
                        />
                        <DonutCard title={t("shortlisted.shortlistedByJob")} subtitle={t("shortlisted.shortlistedByJobSub")} empty={t("shortlisted.notTiedToJob")} items={insights.jobs} />
                    </div>
                </div>
                )
            ) : (
            /* Content Table */
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
                        <h3 className="text-[18px] font-bold text-[#15171C] mb-1.5">{t("shortlisted.noCandidates")}</h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-6">{t("shortlisted.noCandidatesDesc")}</p>
                        <button onClick={() => { setSearchQuery(""); setSelectedJobId("ALL"); setSelectedSource("ALL"); }} className="px-6 h-11 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] font-semibold text-[13.5px] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-all">{t("shortlisted.clearFilters")}</button>
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
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colFullName")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colProfiles")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colStatus")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colDate")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colCurrentRole")}</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colSkills")}</th>
                                {!isSelectionMode && (
                                    <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">{t("shortlisted.colActions")}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F1]">
                            {filteredShortlists.map((item) => (
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
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-semibold text-[#15171C] group-hover:text-[#5B53E0] transition-all whitespace-nowrap">{item.profile?.full_name || 'Candidate'}</span>
                                            {item.profile?.profile_url && (
                                                <a href={item.profile.profile_url} target="_blank" rel="noreferrer" className="text-[#9AA3AF] hover:text-[#5B53E0]"><ExternalLink className="w-3.5 h-3.5" /></a>
                                            )}
                                        </div>
                                        {item.profile?.location && <span className="text-[11.5px] text-[#9AA3AF] font-medium">{item.profile.location}</span>}
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
                                            if (!showPlatform && !li && !gh && !email && !phone) return <span className="text-[#C4C9D0] text-[12px]">—</span>;
                                            return (
                                                <div className="flex items-center gap-2">
                                                    {showPlatform && (
                                                        <a href={p.profile_url} target="_blank" rel="noreferrer" title={p.platform} className="hover:opacity-80">
                                                            <PlatformLogoRenderer platform={p.platform} className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {li && <a href={li} target="_blank" rel="noreferrer" title="LinkedIn" className="text-[#0A66C2] hover:opacity-80"><Linkedin className="w-4 h-4" /></a>}
                                                    {email && <a href={`mailto:${email}`} title={email} className="text-[#6B6F76] hover:text-[#5B53E0]"><Mail className="w-4 h-4" /></a>}
                                                    {phone && <a href={`tel:${phone}`} title={phone} className="text-[#6B6F76] hover:text-[#5B53E0]"><Phone className="w-4 h-4" /></a>}
                                                    {gh && <a href={gh} target="_blank" rel="noreferrer" title="GitHub" className="text-[#1F2127] hover:opacity-80"><Github className="w-4 h-4" /></a>}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setOpenStatusId(openStatusId === item.shortlist_id ? null : item.shortlist_id)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#374151] hover:text-[#15171C]">
                                                <span className={`w-2 h-2 rounded-full ${statusDot(item.status)}`} />
                                                {item.status || "Not Contacted"}
                                                {savingStatusId === item.shortlist_id ? <div className="w-3 h-3 border-2 border-[#5B53E0] border-t-transparent rounded-full animate-spin" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9AA3AF]" />}
                                            </button>
                                            {openStatusId === item.shortlist_id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setOpenStatusId(null)} />
                                                    <div className="absolute left-0 top-7 z-50 w-44 bg-white rounded-[10px] border border-[#E8EAED] shadow-[0_12px_30px_rgba(15,23,42,0.16)] p-1.5">
                                                        {OUTREACH_STATUSES.map((s) => (
                                                            <button key={s} onClick={() => updateStatus(item, s)} className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-[8px] text-[12.5px] font-semibold hover:bg-[#F7F8FA] ${(item.status || "Not Contacted") === s ? "text-[#5B53E0]" : "text-[#374151]"}`}>
                                                                <span className={`w-2 h-2 rounded-full ${statusDot(s)}`} /> {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[12.5px] text-[#6B6F76] whitespace-nowrap">{shortlistTimeAgo(item.shortlisted_at)}</td>
                                    <td className="px-6 py-4 text-[13px] font-semibold text-[#374151] max-w-[220px] truncate">{item.profile?.headline || "—"}</td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const skills: string[] = (item.profile?.skills || []).filter(Boolean);
                                            if (skills.length === 0) return <span className="text-[#C4C9D0] text-[12px]">—</span>;
                                            return (
                                                <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
                                                    {skills.slice(0, 4).map((sk, si) => (
                                                        <span key={si} className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[11px] font-semibold whitespace-nowrap">{sk}</span>
                                                    ))}
                                                    {skills.length > 4 && (
                                                        <span className="text-[11px] font-bold text-[#8A929E]" title={skills.slice(4).join(", ")}>+{skills.length - 4}</span>
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
                                                            {t("shortlisted.viewProfile")}
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
                                                            {isSendingJD === (item.profile.profile_url || item.profile.full_name) ? t("shortlisted.sending") : t("shortlisted.sendJD")}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/engagement/${item.shortlist_id}?source=Direct Link`;
                                                                navigator.clipboard.writeText(link);
                                                                alert(t("shortlisted.engagementLinkCopied"));
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#15171C] rounded-[8px] transition-colors text-left group"
                                                        >
                                                            <Link2 className="w-4 h-4 text-[#8A929E] group-hover:text-[#5B53E0] transition-colors" />
                                                            {t("shortlisted.copyEngagementLink")}
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
                                                            {t("shortlisted.moveToAnotherJob")}
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
                            className="bg-[#15171C]/95 backdrop-blur-xl border border-white/10 rounded-[16px] p-4 shadow-[0_20px_50px_rgba(15,23,28,0.3)] flex items-center gap-8 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                                <div className="w-10 h-10 rounded-xl bg-[#5B53E0] flex items-center justify-center text-white font-extrabold shadow-sm">
                                    {selectedIds.size}
                                </div>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-white text-[13px] font-bold">{t("shortlisted.candidatesSelected")}</span>
                                    <span className="text-[#8A929E] text-[9.5px] font-bold uppercase tracking-widest">• {t("shortlisted.readyForBulk")}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={bulkSendJD}
                                    className="h-11 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#4A43C9] transition-all hover:shadow-[0_4px_12px_rgba(91,83,224,0.24)] active:scale-95 whitespace-nowrap"
                                >
                                    <Send className="w-4 h-4" />
                                    {t("shortlisted.sendJDToSelected")}
                                </button>

                                <button
                                    onClick={bulkRemove}
                                    className="h-11 px-4 rounded-[10px] bg-white/10 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-rose-600 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t("shortlisted.bulkRemoveBtn")}
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedIds(new Set());
                                        setIsSelectionMode(false);
                                    }}
                                    className="h-11 px-4 text-[#9AA3AF] hover:text-white text-[13px] font-semibold transition-all hover:bg-white/5 rounded-[10px]"
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
                                        <Briefcase className="w-4.5 h-4.5 text-[#5B53E0]" /> {t("shortlisted.moveCandidate")}
                                    </h3>
                                    <p className="text-[12.5px] text-[#8A929E] font-medium">{t("shortlisted.selectTargetJob")} <span className="text-[#5B53E0] font-bold">{movingCandidate?.profile.full_name}</span></p>
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
                                                <span className="text-[9.5px] font-bold text-[#9AA3AF] uppercase tracking-wider mt-0.5">{t("shortlisted.activeRequisition")}</span>
                                            </div>
                                        </div>
                                        {job.id === movingCandidate?.job_id && (
                                            <span className="text-[10px] font-bold text-[#5B53E0] bg-[#ECEBFB] px-2 py-0.5 rounded-[6px] border border-[#DAD7F6]/85">{t("shortlisted.current")}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="px-6 py-4 bg-[#F7F8FA]/50 border-t border-[#E8EAED] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsMoveModalOpen(false)}
                                    className="px-4 py-2 border border-[#E1E4E8] bg-white hover:bg-[#F4F5F7] text-[13px] font-semibold text-[#374151] rounded-[9px] transition-all"
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
