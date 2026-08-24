"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Chart } from "react-google-charts";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { API_BASE_URL } from "@/lib/api-config";
import {
    FolderOpen, Search, Sparkles, ArrowRight, Bot, Loader2, Play, Pause, ChevronDown, ChevronUp, Plus,
    Filter, ThumbsUp, ExternalLink, Linkedin, Github, SlidersHorizontal, Radar, Mail, Phone, X,
    ChevronLeft, ChevronRight, Users, CheckCircle2,
} from "lucide-react";

interface Project {
    project_id: string;
    name: string;
    owner?: string;
    department?: string;
    visibility?: string;
    collaborators?: string[];
    ats_job_id?: string | null;
    ats_job_title?: string | null;
    agent?: {
        status?: string; paused?: boolean; daily_target?: number; outreach_mode?: string; approval_type?: string;
        response_window_days?: number; auto_resource?: boolean;
        filters?: any[]; criteria?: string[]; query?: string;
        outreach_sequence_id?: string; outreach_sequence_name?: string;
    };
    stats?: { shortlisted?: number; contacted?: number; interested?: number };
}

type StatItem = { label: string; count: number; pct: number };

// Tally a field across profiles → sorted [label, count][].
function tallyField(profiles: any[], get: (p: any) => string[]): [string, number][] {
    const m = new Map<string, number>();
    for (const p of profiles) for (const v of get(p)) { const t = (v || "").trim(); if (t) m.set(t, (m.get(t) || 0) + 1); }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

// Best-effort city/region → ISO country code (for the regions map — needs no API key).
function toCountry(location: string): string | null {
    const s = (location || "").toLowerCase();
    if (!s) return null;
    if (/\b(usa|u\.s\.|united states|america)\b/.test(s) || /\b(california|texas|new york|florida|washington|illinois|massachusetts|san francisco|bay area|berkeley|oakland|seattle|austin|boston|san mateo|dallas|new jersey|redwood|daly city|union city)\b/.test(s)) return "US";
    if (/\b(india|bangalore|bengaluru|mumbai|delhi|pune|chennai|hyderabad|noida|gurgaon)\b/.test(s)) return "IN";
    if (/\b(uk|united kingdom|england|london|manchester)\b/.test(s)) return "GB";
    if (/\b(germany|berlin|munich|hamburg)\b/.test(s)) return "DE";
    if (/\b(canada|toronto|vancouver|montreal)\b/.test(s)) return "CA";
    if (/\b(australia|sydney|melbourne)\b/.test(s)) return "AU";
    if (/\b(bangladesh|dhaka|satkhira)\b/.test(s)) return "BD";
    if (/\b(pakistan|karachi|lahore)\b/.test(s)) return "PK";
    if (/\b(france|paris)\b/.test(s)) return "FR";
    if (/\b(singapore)\b/.test(s)) return "SG";
    const last = s.split(",").map((x) => x.trim()).pop() || "";
    return last.length >= 4 && last.length <= 24 && /^[a-z ]+$/.test(last) ? last.toUpperCase() : null;
}

// Platform → domain for a favicon icon.
function platformDomain(plat: string): string {
    const p = (plat || "").toLowerCase().trim();
    const map: Record<string, string> = {
        github: "github.com", linkedin: "linkedin.com", stackoverflow: "stackoverflow.com", gitlab: "gitlab.com",
        devto: "dev.to", arxiv: "arxiv.org", reddit: "reddit.com", hashnode: "hashnode.com", medium: "medium.com",
        researchgate: "researchgate.net", crunchbase: "crunchbase.com", dribbble: "dribbble.com", kaggle: "kaggle.com",
        hackerrank: "hackerrank.com", leetcode: "leetcode.com", producthunt: "producthunt.com", twitter: "x.com",
        wellfound: "wellfound.com", behance: "behance.net", googlescholar: "scholar.google.com",
    };
    for (const k of Object.keys(map)) if (p.includes(k)) return map[k];
    return p ? `${p.replace(/[^a-z0-9.]/g, "")}.com` : "google.com";
}

// Short chip label for a (possibly long) criterion sentence.
function criterionShort(c: string): string {
    const t = (c || "").trim();
    if (t.length <= 18) return t;
    const m = t.match(/\b(Python|Node(?:\.js)?|React|Java|Golang|Go|Rust|TypeScript|JavaScript|AWS|GCP|Azure|Backend|Frontend|Full[- ]?stack|Founding|Leadership|ERP|Enterprise|Micro-?services|Kubernetes|Docker|SQL|NoSQL|Machine Learning|ML|AI|DevOps|Security)\b/i);
    if (m) return m[1].replace(/\.js$/i, "");
    return t.split(/\s+/).slice(0, 2).join(" ");
}

// Best-effort structured filters (role + location) from a query, for the Calibrate panel.
function deriveFilters(text: string): string[] {
    const t = (text || "").trim();
    if (!t) return [];
    const out: string[] = [];
    const role = t.split(/\s+(?:in|with|based|expert|experienced|,)/i)[0].trim();
    if (role && role.length < 40) out.push(role);
    const loc = t.match(/\bin\s+([A-Z][A-Za-z .'-]+?)(?:\s*,|\s+(?:with|and|expert|experienced)\b|$)/i);
    if (loc?.[1]) out.push(loc[1].trim());
    return out.slice(0, 3);
}

const SUGGESTIONS = [
    "Sales Manager in Dallas with 5+ years of experience in ERP solutions",
    "ERP Sales Manager based in Dallas with a background in enterprise software",
    "Senior Sales Manager in Dallas, expert in complex ERP implementations",
    "Sales Manager in Dallas experienced with cloud-based ERP systems",
];
const TARGETS = [5, 15, 25, 50, 75];

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const projectId = String(params?.id || "");

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<"search" | "agent">("search");
    const [query, setQuery] = useState("");

    // Agent config view: null = workspace; else the agent 3-step flow.
    const [agentTab, setAgentTab] = useState<null | "calibrate" | "settings" | "sourcing" | "candidates">(null);
    const [projCands, setProjCands] = useState<any[]>([]);
    const [candsLoading, setCandsLoading] = useState(false);
    const [candSubTab, setCandSubTab] = useState<"all" | "ai" | "shortlisted">("all");
    const [replyView, setReplyView] = useState<any | null>(null); // candidate whose reply is being read
    const [dailyTarget, setDailyTarget] = useState(15);
    const [outreach, setOutreach] = useState<"ai_sequence" | "existing" | "shortlist">("shortlist");
    const [approval, setApproval] = useState<"automatic" | "manual">("manual");
    // Response-window SLA: days a contacted candidate has to reply before we re-source. 0 = off.
    const [responseWindow, setResponseWindow] = useState(0);
    const [autoResource, setAutoResource] = useState(true);
    const [slaOverdue, setSlaOverdue] = useState(0);

    const [sourcing, setSourcing] = useState(false);
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
    const [collabInput, setCollabInput] = useState("");
    const [showAtsMenu, setShowAtsMenu] = useState(false);
    const [sequences, setSequences] = useState<any[]>([]);
    const [generatingSeq, setGeneratingSeq] = useState(false);
    // Review Profiles modal (rich detail + per-criterion AI analysis + navigation).
    const [reviewList, setReviewList] = useState<any[] | null>(null);
    const [reviewIdx, setReviewIdx] = useState(0);
    const [reviewAnalysis, setReviewAnalysis] = useState<Record<string, any[]>>({});
    const [analyzing, setAnalyzing] = useState(false);
    const [bioExpanded, setBioExpanded] = useState(false);
    const [showCriteriaEdit, setShowCriteriaEdit] = useState(false);
    const [newCriterion, setNewCriterion] = useState("");
    // Filters editor (structured: titles + location + keywords).
    const [showFilterEdit, setShowFilterEdit] = useState(false);
    const [fTitles, setFTitles] = useState<string[]>([]);
    const [fLocation, setFLocation] = useState("");
    const [fKeywords, setFKeywords] = useState<string[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [newKeyword, setNewKeyword] = useState("");
    // Talent Insights modal (aggregates over a sample of the search pool).
    const [showInsights, setShowInsights] = useState(false);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [talent, setTalent] = useState<null | {
        total: number; skills: StatItem[]; titles: StatItem[]; employers: StatItem[];
        locations: StatItem[]; countryMap: [string, number][]; sources: StatItem[];
    }>(null);
    // Conversational calibration chat.
    type ChatMsg = { role: "agent" | "user"; content: string; profiles?: any[]; total?: number };
    const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatBusy, setChatBusy] = useState(false);
    const [approvingUrl, setApprovingUrl] = useState<string | null>(null);
    const chatStarted = useRef(false);

    const agent = project?.agent;
    const criteria = useMemo(() => agent?.criteria || deriveCriteria(query || agent?.query || ""), [agent, query]);
    const filters = useMemo(() => {
        const fl: any[] = Array.isArray(agent?.filters) ? agent!.filters! : [];
        if (fl.length) {
            const t = fl.filter((f) => f.type === "title").length;
            const hasLoc = fl.some((f) => f.type === "location");
            const kw = fl.filter((f) => f.type === "keyword").length;
            const chips: string[] = [];
            if (t) chips.push(tr("agent.titlesCount", { n: t }));
            if (hasLoc) chips.push(tr("agent.oneLocation"));
            if (kw) chips.push(tr("agent.keywordsCount", { n: kw }));
            if (chips.length) return chips;
        }
        return deriveFilters(query || agent?.query || "");
    }, [agent, query]);

    const fetchProject = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const p: Project = await res.json();
                setProject(p);
                setDailyTarget(p.agent?.daily_target ?? 15);
                setOutreach((p.agent?.outreach_mode as any) || "shortlist");
                setApproval((p.agent?.approval_type as any) || "manual");
                setResponseWindow(p.agent?.response_window_days ?? 0);
                setAutoResource(p.agent?.auto_resource ?? true);
                // Response-window SLA sweep (runs on open — no background scheduler yet).
                try {
                    const sla = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}/check-responses`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                    if (sla.ok) { const sd = await sla.json(); setSlaOverdue(sd.needs_resourcing || 0); }
                } catch { /* ignore */ }
                if (p.agent?.query) setQuery(p.agent.query);
                if (p.agent?.status && p.agent.status !== "none") setAgentTab("calibrate");
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { fetchProject(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token, projectId]);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/jobs`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) setJobs(await res.json());
            } catch { /* ignore */ }
            try {
                const r = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences`, { headers: { Authorization: `Bearer ${token}` } });
                if (r.ok) setSequences(await r.json());
            } catch { /* ignore */ }
        })();
    }, [token]);

    // Generate an AI outreach sequence from the agent's role/criteria context and link it to the agent.
    const generateAiSequence = async () => {
        setGeneratingSeq(true);
        try {
            const context = `Role: ${agent?.query || query}. Ranking criteria: ${(criteria || []).join(", ") || "none"}. Company: ${project?.name}.`;
            const gen = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences/generate`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ context, steps: 4 }),
            });
            const gd = gen.ok ? await gen.json() : { steps: [] };
            const name = `${(agent?.query || query || "Outreach").slice(0, 40)} — AI sequence`;
            const created = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/sequences`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, steps: gd.steps || [] }),
            });
            if (created.ok) {
                const s = await created.json();
                setSequences((prev) => [s, ...prev]);
                await patch({ outreach_mode: "ai_sequence", outreach_sequence_id: s.sequence_id, outreach_sequence_name: s.name });
            }
        } catch { /* ignore */ } finally { setGeneratingSeq(false); }
    };

    const chatKey = `croar.agent.chat.${projectId}`;
    // Restore saved calibration chat when returning to this agent.
    useEffect(() => {
        if (!projectId) return;
        try {
            const raw = localStorage.getItem(chatKey);
            if (raw) {
                const saved = JSON.parse(raw);
                if (Array.isArray(saved) && saved.length) { setChatMsgs(saved); chatStarted.current = true; }
            }
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Persist the chat (slim — drop heavy scrape data) on every change.
    useEffect(() => {
        if (!projectId || !chatMsgs.length) return;
        try {
            const slim = chatMsgs.map((m) => ({ ...m, profiles: (m.profiles || []).map((p: any) => { const { raw_data, html, ...r } = p; void raw_data; void html; return r; }) }));
            localStorage.setItem(chatKey, JSON.stringify(slim));
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatMsgs, projectId]);

    // Kick off the calibration chat the first time the Calibrate tab opens with a query.
    useEffect(() => {
        if (agentTab === "calibrate" && project && !chatStarted.current && (agent?.query || query)) {
            chatStarted.current = true;
            startCalibrateChat();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentTab, project]);

    const patch = async (body: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (res.ok) setProject(await res.json());
        } catch { /* ignore */ }
    };

    // Submit the search box: "Search" runs the normal sourcing; "Agent" starts calibration.
    const submit = async () => {
        const q = query.trim();
        if (!q) return;
        if (mode === "search") {
            try { sessionStorage.setItem("croar_source_job", JSON.stringify({ title: q, description: "", autostart: true })); } catch { /* ignore */ }
            router.push("/enterprise/sourcing/chat");
        } else {
            await patch({ status: "calibrating", query: q, criteria: deriveCriteria(q) });
            chatStarted.current = false;
            try { localStorage.removeItem(`croar.agent.chat.${projectId}`); } catch { /* ignore */ }
            setChatMsgs([]);
            setAgentTab("calibrate");
        }
    };

    const addCriterion = async () => {
        const c = newCriterion.trim();
        if (!c) return;
        await patch({ criteria: [...(criteria || []), c].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12) });
        setNewCriterion("");
    };
    const removeCriterion = async (c: string) => {
        await patch({ criteria: (criteria || []).filter((x) => x !== c) });
    };
    const moveCriterion = async (i: number, dir: -1 | 1) => {
        const n = [...(criteria || [])];
        const j = i + dir;
        if (j < 0 || j >= n.length) return;
        [n[i], n[j]] = [n[j], n[i]];
        await patch({ criteria: n });
    };
    const editCriterion = async (i: number, val: string) => {
        const n = [...(criteria || [])];
        n[i] = val;
        await patch({ criteria: n });
    };

    // ---- Structured filters editor ----
    const openFilterEdit = () => {
        const fl: any[] = Array.isArray(agent?.filters) ? agent!.filters! : [];
        const titles = fl.filter((f) => f.type === "title").map((f) => f.value);
        const loc = fl.find((f) => f.type === "location")?.value || "";
        const kws = fl.filter((f) => f.type === "keyword").map((f) => f.value);
        if (titles.length === 0 && !loc && kws.length === 0) {
            const df = deriveFilters(agent?.query || query);
            setFTitles(df[0] ? [df[0]] : []);
            setFLocation(df[1] || "");
            setFKeywords([]);
        } else {
            setFTitles(titles); setFLocation(loc); setFKeywords(kws);
        }
        setShowFilterEdit(true);
    };
    // Aggregate a sample of the search pool for the Talent Insights modal.
    const openInsights = async () => {
        setShowInsights(true);
        setInsightsLoading(true);
        setTalent(null);
        const q = agent?.query || query;
        const { total, profiles } = await fetchProfilesFor(q, 50);
        const denom = profiles.length || 1;
        const pctList = (entries: [string, number][], n: number): StatItem[] =>
            entries.slice(0, n).map(([label, count]) => ({ label, count, pct: Math.round((count / denom) * 100) }));
        const countryMap = (() => {
            const m = new Map<string, number>();
            for (const p of profiles) { const c = toCountry(p.location || ""); if (c) m.set(c, (m.get(c) || 0) + 1); }
            return Array.from(m.entries());
        })();
        const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
        setTalent({
            total: total || profiles.length,
            skills: pctList(tallyField(profiles, (p) => p.skills || []), 10),
            titles: pctList(tallyField(profiles, (p) => [p.headline || ""]).filter(([l]) => l.length < 48), 10),
            employers: pctList(tallyField(profiles, (p) => [p.company || ""]), 10),
            locations: pctList(tallyField(profiles, (p) => [p.location || ""]), 10),
            countryMap,
            // Platform/source is present on every profile — always a populated chart.
            sources: pctList(tallyField(profiles, (p) => [cap(p.platform || "")]), 8),
        });
        setInsightsLoading(false);
    };

    const saveFilters = async () => {
        const filters = [
            ...fTitles.map((v) => ({ type: "title", value: v })),
            ...(fLocation ? [{ type: "location", value: fLocation }] : []),
            ...fKeywords.map((v) => ({ type: "keyword", value: v })),
        ];
        const q = [fTitles.join(", "), fLocation ? `in ${fLocation}` : "", fKeywords.join(" ")].filter(Boolean).join(" ").trim() || (agent?.query || query);
        await patch({ filters, query: q });
        setQuery(q);
        setShowFilterEdit(false);
        appendFreshPicks(tr("agent.updatedFilters"));
    };

    // ---- Conversational calibration ----
    const rankByCriteria = (profiles: any[], crit: string[]): any[] => {
        if (!crit.length) return profiles;
        const score = (p: any) => {
            const hay = [(p.skills || []).join(" "), p.headline, p.ai_summary, p.company].filter(Boolean).join(" ").toLowerCase();
            return crit.reduce((n, c) => n + (hay.includes(c.toLowerCase().replace(/\.js$/, "")) ? 1 : 0), 0);
        };
        return [...profiles].map((p, i) => ({ p, i, s: score(p) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.p);
    };

    const fetchProfilesFor = async (q: string, limit: number): Promise<{ total: number; profiles: any[] }> => {
        try {
            // fresh=true → the agent always live-scrapes fresh profiles (never reuses DB results).
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat_db?q=${encodeURIComponent(q)}&page=1&limit=${limit}&fresh=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { const d = await res.json(); return { total: d.total_count || (d.profiles || []).length, profiles: d.profiles || [] }; }
        } catch { /* ignore */ }
        return { total: 0, profiles: [] };
    };

    const callCalibrate = async (payload: any): Promise<{ message: string; add_criteria: string[] }> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}/calibrate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) return await res.json();
        } catch { /* ignore */ }
        return { message: "", add_criteria: [] };
    };

    // Start the calibration conversation: run the search + a friendly agent intro.
    const startCalibrateChat = async () => {
        const q = agent?.query || query;
        if (!q) return;
        setChatBusy(true);
        const { total, profiles } = await fetchProfilesFor(q, 12);
        const ranked = rankByCriteria(profiles, criteria).slice(0, 3);
        const { message } = await callCalibrate({ mode: "start", query: q, criteria, total });
        setChatMsgs([
            { role: "user", content: tr("agent.lookingFor", { query: q }) },
            { role: "agent", content: message || tr("agent.builtSearch", { count: total.toLocaleString() }), profiles: ranked, total },
        ]);
        setChatBusy(false);
    };

    // Approve a candidate → agent learns, biases the search, surfaces fresh picks.
    // Persist a candidate to this project's shortlist (Candidates tab). source: AI Sourcing | Manual Approval | Direct
    const shortlistProfile = async (p: any, source: string, status: string) => {
        try {
            await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlist`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ project_id: projectId, source, status, profile: p, job_id: project?.ats_job_id || null, job_title: project?.ats_job_title || project?.name || null }),
            });
        } catch { /* ignore */ }
    };

    const fetchProjectCandidates = async () => {
        if (!projectId || !token) return;
        setCandsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}/candidates`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); setProjCands(d.candidates || []); }
        } catch { /* ignore */ } finally { setCandsLoading(false); }
    };
    useEffect(() => { if (agentTab === "candidates") fetchProjectCandidates(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [agentTab, projectId, token]);

    const setCandidateStatus = async (item: any, status: string) => {
        setProjCands((c) => c.map((x) => (x.shortlist_id === item.shortlist_id ? { ...x, status } : x)));
        try { await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${item.shortlist_id}/status`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }); } catch { /* ignore */ }
    };
    const removeCandidate = async (item: any) => {
        setProjCands((c) => c.filter((x) => x.shortlist_id !== item.shortlist_id));
        try { await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlisted/${item.shortlist_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignore */ }
    };

    const approveProfile = async (p: any, reason: string) => {
        const q = agent?.query || query;
        setApprovingUrl(p.profile_url || p.full_name);
        setChatBusy(true);
        void shortlistProfile(p, "Manual Approval", "Approved"); // approved candidates land in the Candidates tab
        setChatMsgs((m) => [...m, { role: "user", content: tr("agent.approvedWithReason", { name: p.full_name, reason: reason || tr("agent.good") }) }]);
        const { message, add_criteria } = await callCalibrate({ mode: "approve", query: q, criteria, profile: { full_name: p.full_name, headline: p.headline, company: p.company, location: p.location, skills: p.skills, ai_summary: p.ai_summary }, reason });
        const merged = Array.from(new Set([...(criteria || []), ...add_criteria])).slice(0, 10);
        if (add_criteria.length) await patch({ criteria: merged });
        // Re-run + re-rank with the biased criteria and surface fresh picks.
        const { total, profiles } = await fetchProfilesFor(q, 15);
        const already = new Set(chatMsgs.flatMap((mm) => (mm.profiles || []).map((x) => x.profile_url)));
        const fresh = rankByCriteria(profiles.filter((x) => !already.has(x.profile_url)), merged).slice(0, 3);
        setChatMsgs((m) => [...m, { role: "agent", content: message || tr("agent.capturedWhatWorked"), profiles: fresh, total }]);
        setApprovingUrl(null);
        setChatBusy(false);
    };

    // ---- Review Profiles modal ----
    const pKey = (p: any) => p?.profile_url || p?.full_name || "";
    const fetchAnalysis = async (p: any) => {
        if (!p) return;
        const key = pKey(p);
        if (reviewAnalysis[key]) return; // cached
        // Analyze against the ranking criteria; if none set, fall back to the search intent so the
        // panel is never empty.
        const base = (criteria && criteria.length) ? criteria : deriveCriteria(agent?.query || query);
        const effective = base.length ? base : [`Fits the search: ${agent?.query || query}`].filter(Boolean);
        if (!effective.length) { setReviewAnalysis((m) => ({ ...m, [key]: [] })); return; }
        setAnalyzing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}/analyze-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ profile: { full_name: p.full_name, headline: p.headline, company: p.company, location: p.location, skills: p.skills, ai_summary: p.ai_summary }, criteria: effective }),
            });
            const d = res.ok ? await res.json() : { analysis: [] };
            setReviewAnalysis((m) => ({ ...m, [key]: d.analysis || [] }));
        } catch { setReviewAnalysis((m) => ({ ...m, [key]: [] })); } finally { setAnalyzing(false); }
    };
    const openReview = (list: any[], idx: number) => {
        setReviewList(list); setReviewIdx(idx); setBioExpanded(false);
        fetchAnalysis(list[idx]);
    };
    const reviewNav = (dir: -1 | 1) => {
        if (!reviewList) return;
        const n = reviewIdx + dir;
        if (n < 0 || n >= reviewList.length) return;
        setReviewIdx(n); setBioExpanded(false);
        fetchAnalysis(reviewList[n]);
    };

    // Re-run + append fresh picks (used after editing criteria manually).
    const appendFreshPicks = async (note: string) => {
        const q = agent?.query || query;
        if (!q) return;
        setChatBusy(true);
        const { total, profiles } = await fetchProfilesFor(q, 15);
        const already = new Set(chatMsgs.flatMap((mm) => (mm.profiles || []).map((x: any) => x.profile_url)));
        const fresh = rankByCriteria(profiles.filter((x: any) => !already.has(x.profile_url)), criteria).slice(0, 3);
        setChatMsgs((m) => [...m, { role: "agent", content: note, profiles: fresh, total }]);
        setChatBusy(false);
    };

    const sendCalibrateChat = async () => {
        const text = chatInput.trim();
        if (!text || chatBusy) return;
        const q = agent?.query || query;
        setChatInput("");
        setChatMsgs((m) => [...m, { role: "user", content: text }]);
        setChatBusy(true);
        const { message, add_criteria } = await callCalibrate({ mode: "message", query: q, criteria, message: text });
        const merged = Array.from(new Set([...(criteria || []), ...add_criteria])).slice(0, 10);
        if (add_criteria.length) await patch({ criteria: merged });
        let fresh: any[] = [];
        let total = 0;
        if (add_criteria.length) {
            const r = await fetchProfilesFor(q, 15);
            total = r.total;
            const already = new Set(chatMsgs.flatMap((mm) => (mm.profiles || []).map((x) => x.profile_url)));
            fresh = rankByCriteria(r.profiles.filter((x) => !already.has(x.profile_url)), merged).slice(0, 3);
        }
        setChatMsgs((m) => [...m, { role: "agent", content: message || tr("agent.gotIt"), profiles: fresh, total: fresh.length ? total : undefined }]);
        setChatBusy(false);
    };

    // Start sourcing: run the search, shortlist up to daily_target, update project stats + status.
    const startSourcing = async () => {
        const q = agent?.query || query;
        if (!q) return;
        setSourcing(true);
        await patch({ status: "sourcing", daily_target: dailyTarget, outreach_mode: outreach, approval_type: approval, query: q, criteria });
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat_db?q=${encodeURIComponent(q)}&page=1&limit=${dailyTarget}&fresh=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const d = res.ok ? await res.json() : { profiles: [] };
            const profiles = (d.profiles || []).slice(0, dailyTarget);
            let added = 0;
            for (const p of profiles) {
                const { raw_data, html, ...slim } = p;
                void raw_data; void html;
                const r = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/shortlist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ profile: slim, job_id: null, job_title: project?.name, project_id: projectId, source: "AI Sourcing" }),
                });
                if (r.ok) added++;
            }
            // Outreach: when the agent is on Automatic and outreach isn't "just shortlist", email the
            // candidates with an email on file (mail is redirected to the test inbox while testing).
            if (approval === "automatic" && outreach !== "shortlist") {
                const emails = profiles.map((p: any) => p.email).filter(Boolean);
                if (emails.length) {
                    await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/projects/${projectId}/contact`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ emails, subject: `Opportunity: ${project?.name}` }),
                    });
                }
            }
            await fetchProject(); // refresh live stats (shortlisted / contacted)
        } catch { /* ignore */ } finally { setSourcing(false); }
    };

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#5B53E0] animate-spin" /></div>;
    if (!project) return <div className="p-10 text-center text-[#8A929E]">{tr("agent.projectNotFound")}</div>;

    // ---------------- Agent 3-step flow ----------------
    if (agentTab) {
        const paused = !!agent?.paused;
        const status = paused ? tr("projects.paused") : agent?.status === "sourcing" ? tr("projects.sourcing") : tr("projects.calibrating");
        return (
            <div className="px-3 sm:px-4 md:px-5 py-4 max-w-[1320px] mx-auto w-full">
                <div className="flex items-center gap-2 mb-5">
                    <span className={`w-8 h-8 rounded-[9px] text-white flex items-center justify-center ${paused ? "bg-[#9AA3AF]" : "bg-[#5B53E0]"}`}><Bot className="w-4 h-4" /></span>
                    <span className="text-[13px] font-bold text-[#15171C]">{status}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${paused ? "bg-[#F1F2F5] text-[#8A929E]" : "bg-[#EAF7EE] text-[#16A34A]"}`}><span className={`w-1.5 h-1.5 rounded-full ${paused ? "bg-[#9AA3AF]" : "bg-[#16A34A]"}`} />{paused ? tr("projects.inactive") : tr("projects.active")}</span>
                    <button onClick={() => setAgentTab(null)} className="ml-2 text-[12.5px] font-semibold text-[#5B53E0] hover:underline">← {tr("agent.backToProject")}</button>
                    <button onClick={() => patch({ paused: !paused })} className={`ml-auto h-9 px-4 rounded-[10px] text-[13px] font-bold flex items-center gap-1.5 ${paused ? "bg-[#5B53E0] text-white hover:bg-[#4A43C9]" : "border border-[#E1E4E8] bg-white text-[#374151] hover:bg-[#F7F8FA]"}`}>{paused ? <><Play className="w-3.5 h-3.5" /> {tr("agent.activateAgent")}</> : <><Pause className="w-3.5 h-3.5" /> {tr("agent.deactivateAgent")}</>}</button>
                </div>
                {slaOverdue > 0 && (
                    <div className="mb-4 flex items-center gap-3 rounded-[12px] border border-[#F5C6A5] bg-[#FEF6EE] px-4 py-3">
                        <span className="w-2 h-2 rounded-full bg-[#B93815] shrink-0" />
                        <p className="text-[13px] font-semibold text-[#92400E] flex-1">{tr("agent.slaOverdueBanner", { n: slaOverdue })}</p>
                        <button onClick={() => setAgentTab("calibrate")} className="h-9 px-4 rounded-[10px] bg-[#B93815] text-white text-[12.5px] font-bold hover:bg-[#9A2E12] whitespace-nowrap">{tr("agent.sourceReplacements")}</button>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-[150px_minmax(0,1fr)] gap-4">
                    {/* Left tabs */}
                    <div className="space-y-1">
                        {([["calibrate", tr("agent.calibrate"), SlidersHorizontal], ["settings", tr("agent.settings"), Filter], ["sourcing", tr("agent.sourcing"), Radar], ["candidates", tr("agent.candidates"), Users]] as const).map(([key, label, Icon]) => (
                            <button key={key} onClick={() => setAgentTab(key)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-colors ${agentTab === key ? "bg-[#F4F3FD] text-[#5B53E0]" : "text-[#4B5563] hover:bg-[#F7F8FA]"}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                        <div className="mt-4 rounded-[12px] border border-[#DAD7F6] bg-[#F4F3FD]/60 p-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-full bg-[#5B53E0] text-white text-[10px] font-bold uppercase tracking-wider mb-2">{tr("agent.agent")}</span>
                            <p className="text-[13px] font-bold text-[#15171C]">{tr("agent.automateSourcing")}</p>
                            <p className="text-[11.5px] text-[#8A929E] mt-1">{tr("agent.agentDesc")}</p>
                        </div>
                    </div>

                    {/* Right content */}
                    <div className="min-w-0">
                        {agentTab === "calibrate" && (
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_230px] gap-4">
                                <div className="flex flex-col min-w-0">
                                    <div className="flex flex-col min-w-0" style={{ height: "78vh", maxHeight: "78vh" }}>
                                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3.5 min-w-0 no-scrollbar">
                                            {chatMsgs.length === 0 && chatBusy && <div className="text-center text-[12.5px] text-[#8A929E] py-10 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {tr("agent.buildingSearch")}</div>}
                                            {chatMsgs.map((m, mi) => (
                                                m.role === "user" ? (
                                                    <div key={mi} className="flex justify-end">
                                                        <div className="max-w-[85%] bg-white border border-[#E8EAED] shadow-sm rounded-[14px] px-4 py-2.5 text-[13px] text-[#1F2127]">{m.content}</div>
                                                    </div>
                                                ) : (
                                                    <div key={mi} className="space-y-2.5 min-w-0">
                                                        <p className="text-[13px] text-[#374151] leading-relaxed break-words">{m.content}</p>
                                                        {typeof m.total === "number" && (
                                                            <div className="flex items-center justify-between text-[12px] text-[#8A929E] border-b border-[#F0F0F1] pb-1.5">
                                                                <span className="font-bold text-[#15171C]">{tr("agent.searchResults")}</span>
                                                                <span>{tr("agent.totalMatches", { count: m.total.toLocaleString() })}</span>
                                                            </div>
                                                        )}
                                                        {(m.profiles || []).map((p, pi) => (
                                                            <div key={pi} className="rounded-[12px] border border-[#E8EAED] p-3.5 hover:bg-[#F7F8FA]/50 transition-colors overflow-hidden">
                                                                <div className="flex items-start justify-between gap-3 min-w-0">
                                                                    <div className="cursor-pointer min-w-0 flex-1" onClick={() => openReview(m.profiles || [], pi)}>
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="text-[13px] font-bold text-[#15171C] truncate">{p.full_name}</span>
                                                                            {p.profile_url && <a href={p.profile_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#5B53E0] text-[11.5px] font-semibold inline-flex items-center gap-0.5 shrink-0">{(p.platform || "").toLowerCase().includes("linkedin") ? "LinkedIn" : tr("agent.profile")}<ExternalLink className="w-3 h-3" /></a>}
                                                                        </div>
                                                                        <p className="text-[12px] text-[#6B6F76] mt-0.5 truncate">{p.headline || tr("agent.professional")}{p.company ? ` ${tr("agent.at")} ${p.company}` : ""}</p>
                                                                        {p.location && <p className="text-[11px] text-[#9AA3AF] mt-0.5">{p.location}</p>}
                                                                    </div>
                                                                    <button onClick={() => { const r = window.prompt(tr("agent.whyGoodFit", { name: p.full_name }), "good"); if (r !== null) approveProfile(p, r); }} disabled={chatBusy} className="shrink-0 px-3 py-1.5 rounded-[8px] bg-[#5B53E0] text-white text-[11.5px] font-bold hover:bg-[#4A43C9] disabled:opacity-50 flex items-center gap-1">{approvingUrl === (p.profile_url || p.full_name) ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} {tr("agent.approve")}</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            ))}
                                            {chatBusy && chatMsgs.length > 0 && <div className="text-[12px] text-[#8A929E] flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {tr("agent.thinking")}</div>}
                                        </div>
                                        <div className="border-t border-[#E8EAED] p-3">
                                            <div className="flex items-end gap-2 rounded-[12px] border border-[#E1E4E8] px-3 py-2 focus-within:border-[#5B53E0]">
                                                <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCalibrateChat(); } }} rows={1} placeholder={tr("agent.tellMePlaceholder")} className="flex-1 resize-none bg-transparent outline-none text-[13px] text-[#1F2127] placeholder:text-[#9AA3AF]" />
                                                <button onClick={sendCalibrateChat} disabled={!chatInput.trim() || chatBusy} className="w-8 h-8 rounded-full bg-[#5B53E0] text-white flex items-center justify-center disabled:opacity-40 shrink-0"><ArrowRight className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <button onClick={openFilterEdit} className="w-full text-left rounded-[14px] border border-[#E8EAED] bg-white p-4 shadow-sm hover:border-[#DAD7F6] transition-colors">
                                        <div className="flex items-center gap-1.5 mb-2"><Filter className="w-3.5 h-3.5 text-[#5B53E0]" /><span className="text-[13px] font-bold text-[#15171C]">{tr("agent.filters")}</span></div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {filters.length ? filters.map((f: string, i: number) => (
                                                <span key={i} className="px-2.5 py-1 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[11.5px] font-semibold">{f}</span>
                                            )) : <span className="text-[12px] text-[#9AA3AF]">{tr("agent.addFilters")}</span>}
                                        </div>
                                    </button>
                                    <button onClick={() => setShowCriteriaEdit(true)} className="w-full text-left rounded-[14px] border border-[#E8EAED] bg-white p-4 shadow-sm hover:border-[#DAD7F6] transition-colors">
                                        <div className="flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5 text-[#5B53E0]" /><span className="text-[13px] font-bold text-[#15171C]">{tr("agent.criteria")}</span></div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {criteria.map((c, i) => <span key={i} className="px-2.5 py-1 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[11.5px] font-semibold">{criterionShort(c)}</span>)}
                                            {criteria.length === 0 && <span className="text-[12px] text-[#9AA3AF]">{tr("agent.addCriteria")}</span>}
                                        </div>
                                    </button>
                                    <div className="rounded-[14px] border border-[#E8EAED] bg-white p-4 shadow-sm">
                                        <p className="text-[12px] font-semibold text-[#8A929E]">{tr("agent.potentialLeads")}</p>
                                        <p className="text-[26px] font-extrabold text-[#15171C] mt-1">{(() => { const t = [...chatMsgs].reverse().find((m) => typeof m.total === "number")?.total; return t != null ? shortNum(t) : "—"; })()}</p>
                                        <p className="text-[11.5px] text-[#8A929E] mt-1 mb-3">{tr("agent.qualifiedLeadsNote")}</p>
                                        <button onClick={openInsights} className="w-full h-9 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{tr("agent.viewInsights")}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {agentTab === "settings" && (
                            <div className="max-w-2xl space-y-7">
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("agent.dailyTarget")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mb-3">{tr("agent.dailyTargetDesc")}</p>
                                    <div className="grid grid-cols-5 gap-3">
                                        {TARGETS.map((t) => (
                                            <button key={t} onClick={() => setDailyTarget(t)} className={`rounded-[12px] border px-3 py-5 text-center transition-all ${dailyTarget === t ? "border-[#5B53E0] bg-[#F4F3FD] ring-2 ring-[#5B53E0]/15" : "border-[#E1E4E8] bg-white hover:border-[#DAD7F6]"}`}>
                                                <div className="text-[22px] font-extrabold text-[#15171C]">{t}</div>
                                                <div className="text-[11px] text-[#8A929E] font-semibold">{tr("agent.leads")}</div>
                                                {t >= 50 && <div className="text-[10px] text-[#5B53E0] font-bold mt-0.5">x{t === 50 ? 2 : 3} {tr("agent.agents")}</div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("agent.outreach")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mb-3">{tr("agent.outreachDesc")}</p>
                                    <div className="space-y-2.5">
                                        {/* AI sequence */}
                                        <div className={`rounded-[12px] border p-4 transition-all ${outreach === "ai_sequence" ? "border-[#5B53E0] bg-[#F4F3FD]/50" : "border-[#E1E4E8] bg-white"}`}>
                                            <button onClick={() => setOutreach("ai_sequence")} className="w-full flex items-start gap-3 text-left">
                                                <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${outreach === "ai_sequence" ? "border-[#5B53E0] bg-[#5B53E0]" : "border-[#C4C9D0]"}`} />
                                                <div>
                                                    <p className="text-[13px] font-bold text-[#15171C] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#5B53E0]" />{tr("agent.aiSequence")}</p>
                                                    <p className="text-[12px] text-[#8A929E] mt-0.5 italic">{tr("agent.aiSequenceDesc")}</p>
                                                </div>
                                            </button>
                                            {outreach === "ai_sequence" && (
                                                <div className="mt-3 pl-7">
                                                    {agent?.outreach_sequence_id ? (
                                                        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E8EAED] bg-white px-3 py-2.5">
                                                            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#374151] truncate"><Mail className="w-4 h-4 text-[#8A929E]" /> {agent.outreach_sequence_name || tr("agent.aiSequence")}</span>
                                                            <span className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[12px] text-[#8A929E]">{sequences.find((s) => s.sequence_id === agent.outreach_sequence_id)?.steps?.length ?? "—"} {tr("agent.stepsSuffix")}</span>
                                                                <button onClick={() => router.push(`/enterprise/sourcing/sequences/${agent.outreach_sequence_id}`)} className="h-8 px-3 rounded-[8px] border border-[#E1E4E8] text-[12.5px] font-bold text-[#374151] hover:bg-[#F7F8FA]">{tr("common.edit")}</button>
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <button onClick={generateAiSequence} disabled={generatingSeq} className="h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[12.5px] font-bold hover:bg-[#4A43C9] disabled:opacity-60 flex items-center gap-2">{generatingSeq ? <><Loader2 className="w-4 h-4 animate-spin" /> {tr("agent.drafting")}</> : <><Sparkles className="w-4 h-4" /> {tr("agent.generateDraftSequence")}</>}</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Use existing sequence */}
                                        <div className={`rounded-[12px] border p-4 transition-all ${outreach === "existing" ? "border-[#5B53E0] bg-[#F4F3FD]/50" : "border-[#E1E4E8] bg-white"}`}>
                                            <button onClick={() => setOutreach("existing")} className="w-full flex items-start gap-3 text-left">
                                                <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${outreach === "existing" ? "border-[#5B53E0] bg-[#5B53E0]" : "border-[#C4C9D0]"}`} />
                                                <div><p className="text-[13px] font-bold text-[#15171C]">{tr("agent.useExisting")}</p><p className="text-[12px] text-[#8A929E] mt-0.5">{tr("agent.useExistingDesc")}</p></div>
                                            </button>
                                            {outreach === "existing" && (
                                                <div className="mt-3 pl-7">
                                                    <select
                                                        value={agent?.outreach_sequence_id || ""}
                                                        onChange={(e) => { const s = sequences.find((x) => x.sequence_id === e.target.value); patch({ outreach_mode: "existing", outreach_sequence_id: e.target.value, outreach_sequence_name: s?.name || "" }); }}
                                                        className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] text-[#374151] bg-white outline-none focus:border-[#5B53E0]"
                                                    >
                                                        <option value="">{tr("agent.selectSequence")}</option>
                                                        {sequences.map((s) => <option key={s.sequence_id} value={s.sequence_id}>{s.name}</option>)}
                                                    </select>
                                                    {sequences.length === 0 && <p className="text-[11.5px] text-[#9AA3AF] mt-1.5">{tr("agent.noSequencesYet")}</p>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Add to shortlist */}
                                        <button onClick={() => setOutreach("shortlist")} className={`w-full flex items-start gap-3 text-left rounded-[12px] border p-4 transition-all ${outreach === "shortlist" ? "border-[#5B53E0] bg-[#F4F3FD]/50" : "border-[#E1E4E8] bg-white hover:border-[#DAD7F6]"}`}>
                                            <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${outreach === "shortlist" ? "border-[#5B53E0] bg-[#5B53E0]" : "border-[#C4C9D0]"}`} />
                                            <div><p className="text-[13px] font-bold text-[#15171C]">{tr("agent.addToShortlist")}</p><p className="text-[12px] text-[#8A929E] mt-0.5">{tr("agent.addToShortlistDesc")}</p></div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("agent.approvalType")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mb-3">{tr("agent.approvalDesc")}</p>
                                    <div className="space-y-2.5">
                                        {([["automatic", tr("agent.automatic"), tr("agent.automaticDesc")],
                                           ["manual", tr("agent.manual"), tr("agent.manualDesc")]] as const).map(([key, label, desc]) => (
                                            <button key={key} onClick={() => setApproval(key)} className={`w-full flex items-start gap-3 text-left rounded-[12px] border p-4 transition-all ${approval === key ? "border-[#5B53E0] bg-[#F4F3FD]/50" : "border-[#E1E4E8] bg-white hover:border-[#DAD7F6]"}`}>
                                                <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${approval === key ? "border-[#5B53E0] bg-[#5B53E0]" : "border-[#C4C9D0]"}`} />
                                                <div>
                                                    <p className="text-[13px] font-bold text-[#15171C]">{label}</p>
                                                    <p className="text-[12px] text-[#8A929E] mt-0.5">{desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{tr("agent.responseWindowTitle")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mb-3">{tr("agent.responseWindowDesc")}</p>
                                    <div className="grid grid-cols-6 gap-2">
                                        {[{ v: 0, l: tr("agent.responseOff") }, { v: 1, l: "1d" }, { v: 2, l: "2d" }, { v: 3, l: "3d" }, { v: 5, l: "5d" }, { v: 7, l: "7d" }].map((o) => (
                                            <button key={o.v} onClick={() => setResponseWindow(o.v)} className={`rounded-[12px] border px-2 py-4 text-center text-[13px] font-bold transition-all ${responseWindow === o.v ? "border-[#5B53E0] bg-[#F4F3FD] ring-2 ring-[#5B53E0]/15 text-[#5B53E0]" : "border-[#E1E4E8] bg-white text-[#374151] hover:border-[#DAD7F6]"}`}>{o.l}</button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2.5">
                                        <span className="text-[12.5px] text-[#8A929E]">{tr("agent.customWindowLabel")}</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={365}
                                            value={responseWindow > 0 ? responseWindow : ""}
                                            onChange={(e) => { const n = parseInt(e.target.value, 10); setResponseWindow(Number.isFinite(n) && n > 0 ? Math.min(365, n) : 0); }}
                                            placeholder={tr("agent.customWindowPlaceholder")}
                                            className={`w-24 h-9 rounded-[10px] border px-3 text-[13px] font-semibold text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 ${responseWindow > 0 && ![1, 2, 3, 5, 7].includes(responseWindow) ? "border-[#5B53E0] bg-[#F4F3FD]" : "border-[#E1E4E8] bg-white"}`}
                                        />
                                        <span className="text-[12.5px] text-[#8A929E]">{tr("agent.daysUnit")}</span>
                                    </div>
                                    {responseWindow > 0 && (
                                        <label className="mt-3 flex items-center gap-2.5 cursor-pointer">
                                            <input type="checkbox" checked={autoResource} onChange={(e) => setAutoResource(e.target.checked)} className="w-4 h-4 accent-[#5B53E0]" />
                                            <span className="text-[13px] text-[#374151]">{tr("agent.autoResourceLabel")}</span>
                                        </label>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={async () => { await patch({ daily_target: dailyTarget, outreach_mode: outreach, approval_type: approval, response_window_days: responseWindow, auto_resource: autoResource }); setAgentTab("sourcing"); }}
                                        className="h-11 px-6 rounded-[10px] bg-[#5B53E0] text-white text-[14px] font-bold hover:bg-[#4A43C9] flex items-center gap-2"
                                    >
                                        {tr("agent.continue")} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {agentTab === "sourcing" && (
                            <div className="flex flex-col items-center justify-center text-center py-20 max-w-md mx-auto">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${paused ? "bg-[#F1F2F5] text-[#9AA3AF]" : "bg-[#F4F3FD] text-[#5B53E0]"}`}>{paused ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</div>
                                <h3 className="text-[17px] font-bold text-[#15171C]">{paused ? tr("agent.agentDeactivated") : agent?.status === "sourcing" ? tr("agent.agentSourcing") : tr("agent.readyToSource")}</h3>
                                <p className="text-[13px] text-[#8A929E] mt-1.5">{paused ? tr("agent.pausedDesc") : tr("agent.readyDesc", { count: dailyTarget })}</p>
                                {paused ? (
                                    <button onClick={() => patch({ paused: false })} className="mt-6 h-11 px-6 rounded-[10px] bg-[#5B53E0] text-white text-[14px] font-bold hover:bg-[#4A43C9] flex items-center gap-2"><Play className="w-4 h-4" /> {tr("agent.activateAgent")}</button>
                                ) : (
                                    <button onClick={startSourcing} disabled={sourcing} className="mt-6 h-11 px-6 rounded-[10px] bg-[#5B53E0] text-white text-[14px] font-bold hover:bg-[#4A43C9] disabled:opacity-60 flex items-center gap-2">
                                        {sourcing ? <><Loader2 className="w-4 h-4 animate-spin" /> {tr("agent.sourcingProgress")}</> : <><Radar className="w-4 h-4" /> {tr("agent.startSourcing")}</>}
                                    </button>
                                )}
                                {project.stats?.shortlisted ? <p className="text-[12.5px] text-[#15803D] font-semibold mt-4">{tr("agent.shortlistedSoFar", { count: project.stats.shortlisted })}</p> : null}
                            </div>
                        )}

                        {agentTab === "candidates" && (() => {
                            const srcMeta = (s: string) => {
                                const v = (s || "").toLowerCase();
                                if (v.includes("manual") || v.includes("approv")) return { label: tr("agent.approved"), cls: "bg-[#E6F4EA] text-[#15803D]" };
                                if (v.includes("direct")) return { label: tr("agent.direct"), cls: "bg-[#EEF0FB] text-[#4B4FD6]" };
                                return { label: tr("agent.aiSourced"), cls: "bg-[#F4F3FD] text-[#5B53E0]" };
                            };
                            const statusCls = (st: string) => {
                                const v = (st || "").toLowerCase();
                                if (v.includes("interest") || v.includes("respond") || v.includes("hired")) return "bg-[#E6F4EA] text-[#15803D]";
                                if (v.includes("contact") || v.includes("sent")) return "bg-[#FEF3E2] text-[#B45309]";
                                if (v.includes("approv")) return "bg-[#EEF0FB] text-[#4B4FD6]";
                                return "bg-[#F1F2F5] text-[#6B6F76]";
                            };
                            const isAi = (s: string) => { const v = (s || "").toLowerCase(); return !(v.includes("manual") || v.includes("approv") || v.includes("direct")); };
                            const aiList = projCands.filter((c) => isAi(c.source));
                            const slList = projCands.filter((c) => !isAi(c.source));
                            const view = candSubTab === "ai" ? aiList : candSubTab === "shortlisted" ? slList : projCands;
                            const subTabs: [typeof candSubTab, string, number][] = [["all", tr("agent.tabAll"), projCands.length], ["ai", tr("agent.tabAiSourced"), aiList.length], ["shortlisted", tr("agent.tabShortlisted"), slList.length]];
                            return (
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <h3 className="text-[16px] font-bold text-[#15171C]">{tr("agent.candidates")}</h3>
                                            <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("agent.candidatesDesc")}</p>
                                        </div>
                                        <button onClick={fetchProjectCandidates} className="h-9 px-3.5 rounded-[10px] border border-[#E1E4E8] bg-white text-[12.5px] font-semibold text-[#374151] hover:bg-[#F7F8FA]">{tr("agent.refresh")}</button>
                                    </div>
                                    <div className="flex items-center gap-1 mb-3 border-b border-[#E8EAED]">
                                        {subTabs.map(([k, label, n]) => (
                                            <button key={k} onClick={() => setCandSubTab(k)} className={`px-3.5 py-2 text-[12.5px] font-semibold border-b-2 -mb-px transition-colors ${candSubTab === k ? "border-[#5B53E0] text-[#5B53E0]" : "border-transparent text-[#8A929E] hover:text-[#374151]"}`}>{label}<span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${candSubTab === k ? "bg-[#ECEBFB] text-[#5B53E0]" : "bg-[#F1F2F5] text-[#8A929E]"}`}>{n}</span></button>
                                        ))}
                                    </div>
                                    {candsLoading ? (
                                        <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 text-[#5B53E0] animate-spin" /></div>
                                    ) : view.length === 0 ? (
                                        <div className="rounded-[14px] border border-dashed border-[#D8DBE0] bg-[#FBFBFC] py-14 text-center">
                                            <p className="text-[14px] font-bold text-[#15171C]">{tr("agent.noCandidatesYet")}</p>
                                            <p className="text-[12.5px] text-[#8A929E] mt-1">{tr("agent.noCandidatesDesc")}</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-[14px] border border-[#E8EAED] bg-white overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[720px]">
                                                <thead>
                                                    <tr className="bg-[#F7F8FA] text-[10.5px] uppercase tracking-[0.04em] text-[#8A929E]">
                                                        <th className="px-4 py-2.5 font-bold">{tr("agent.colCandidate")}</th>
                                                        <th className="px-4 py-2.5 font-bold">{tr("agent.colSource")}</th>
                                                        <th className="px-4 py-2.5 font-bold">{tr("agent.colId")}</th>
                                                        <th className="px-4 py-2.5 font-bold">{tr("agent.colStatus")}</th>
                                                        <th className="px-4 py-2.5 font-bold text-right">{tr("agent.colActions")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {view.map((c) => {
                                                        const p = c.profile || {};
                                                        const sm = srcMeta(c.source);
                                                        return (
                                                            <tr key={c.shortlist_id} className="border-t border-[#F0F0F1] hover:bg-[#F7F8FA]/50">
                                                                <td className="px-4 py-3">
                                                                    <div className="min-w-0 cursor-pointer" onClick={() => openReview([p], 0)}>
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="text-[13.5px] font-bold text-[#15171C] truncate">{p.full_name || "Unknown"}</span>
                                                                            {p.profile_url && <a href={p.profile_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#5B53E0] text-[11px] font-semibold inline-flex items-center gap-0.5 shrink-0">{tr("agent.profile")}<ExternalLink className="w-3 h-3" /></a>}
                                                                        </div>
                                                                        <p className="text-[12px] text-[#8A929E] truncate mt-0.5">{p.headline || p.company || p.location || "—"}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sm.cls}`}>{sm.label}</span></td>
                                                                <td className="px-4 py-3"><span className="text-[11.5px] font-mono text-[#8A929E]" title={c.shortlist_id}>{(c.shortlist_id || "").slice(0, 8)}</span></td>
                                                                <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusCls(c.status)}`}>{c.status || tr("agent.notContacted")}</span></td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-1.5 justify-end">
                                                                        {(c.sent_body || c.reply_body) && <button onClick={() => setReplyView(c)} title={tr("agent.viewThread")} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#5B53E0] hover:bg-[#F4F3FD]"><Mail className="w-4 h-4" /></button>}
                                                                        <button onClick={() => setCandidateStatus(c, "Interested")} title={tr("agent.markVerified")} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#15803D] hover:bg-[#E6F4EA]"><CheckCircle2 className="w-4 h-4" /></button>
                                                                        <button onClick={() => removeCandidate(c)} title={tr("agent.remove")} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#9AA3AF] hover:text-[#C0383C] hover:bg-rose-50"><X className="w-4 h-4" /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Candidate conversation thread — what we sent + what they replied, stored per candidate */}
                {replyView && (() => {
                    const c = replyView; const p = c.profile || {};
                    return (
                    <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-start justify-center px-4 py-10 overflow-y-auto no-scrollbar" onClick={() => setReplyView(null)}>
                        <div className="bg-white rounded-[16px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="p-5 border-b border-[#E8EAED] flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="text-[16px] font-bold text-[#15171C] truncate">{tr("agent.conversation")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5 truncate">{p.full_name || "—"}{p.email ? ` · ${p.email}` : ""}</p>
                                </div>
                                <button onClick={() => setReplyView(null)} className="w-8 h-8 rounded-[8px] border border-[#E1E4E8] flex items-center justify-center text-[#4B5563] hover:bg-[#F7F8FA] shrink-0"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                                {c.sent_body && (
                                    <div className="rounded-[12px] border border-[#E1E4E8] bg-[#F7F8FA] p-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#5B53E0]">{tr("agent.sentLabel")}</span>
                                            <span className="text-[11px] text-[#8A929E]">{c.sent_at ? new Date(c.sent_at).toLocaleString() : ""}</span>
                                        </div>
                                        {c.sent_subject && <p className="text-[13px] font-bold text-[#15171C] mb-1">{c.sent_subject}</p>}
                                        <div className="text-[13px] text-[#374151] leading-relaxed break-words [&_*]:!m-0 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: c.sent_body }} />
                                    </div>
                                )}
                                {c.reply_body ? (
                                    <div className="rounded-[12px] border border-[#C7D7FE] bg-[#EFF4FF] p-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#3538CD]">{tr("agent.candidateReply")}</span>
                                            <span className="text-[11px] text-[#8A929E]">{c.reply_at ? new Date(c.reply_at).toLocaleString() : ""}</span>
                                        </div>
                                        {c.reply_subject && <p className="text-[13px] font-bold text-[#15171C] mb-1">{c.reply_subject}</p>}
                                        <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap break-words">{c.reply_body}</p>
                                    </div>
                                ) : (
                                    <p className="text-[12.5px] text-[#8A929E] text-center py-4 rounded-[12px] border border-dashed border-[#D8DBE0] bg-[#FBFBFC]">{tr("agent.noReplyYet")}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    );
                })()}

                {/* Review Profiles modal */}
                {reviewList && reviewList[reviewIdx] && (() => {
                    const p = reviewList[reviewIdx];
                    const analysis = reviewAnalysis[pKey(p)] || [];
                    const bio = p.ai_summary || "";
                    const skills: string[] = p.skills || [];
                    const edu = p.raw_data?.education || p.raw_data?.school || null;
                    const verdictBadge = (v: string) => v === "Good Match" ? "bg-[#E6F4EA] text-[#15803D]" : v === "Partial Match" ? "bg-[#FEF3E2] text-[#B45309]" : "bg-[#F1F2F5] text-[#8A929E]";
                    return (
                    <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-start justify-center px-4 py-8 overflow-y-auto no-scrollbar" onClick={() => setReviewList(null)}>
                        <div className="bg-white rounded-[16px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-5 border-b border-[#E8EAED] flex items-center justify-between">
                                <h3 className="text-[17px] font-bold text-[#15171C]">{tr("agent.reviewProfiles")}</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => reviewNav(-1)} disabled={reviewIdx === 0} className="w-8 h-8 rounded-[8px] border border-[#E1E4E8] flex items-center justify-center text-[#4B5563] hover:bg-[#F7F8FA] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                                        <span className="text-[13px] font-semibold text-[#4B5563]">{tr("agent.ofCount", { current: reviewIdx + 1, total: reviewList.length })}</span>
                                        <button onClick={() => reviewNav(1)} disabled={reviewIdx === reviewList.length - 1} className="w-8 h-8 rounded-[8px] border border-[#E1E4E8] flex items-center justify-center text-[#4B5563] hover:bg-[#F7F8FA] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => setReviewList(null)} className="h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9]">{tr("agent.finishReview")}</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                {/* Left: profile */}
                                <div className="p-6 border-r border-[#E8EAED]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[19px] font-extrabold text-[#15171C]">{p.full_name || tr("agent.candidate")}</h4>
                                                {p.profile_url && <a href={p.profile_url} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-[#374151] border border-[#E1E4E8] rounded-full px-2.5 py-1 hover:bg-[#F7F8FA]">{tr("agent.fullProfile")}</a>}
                                            </div>
                                            <p className="text-[13px] text-[#8A929E] mt-1">{p.location || "—"}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {(p.platform || "").toLowerCase().includes("linkedin") && <span className="w-7 h-7 rounded-[7px] bg-[#0A66C2] text-white flex items-center justify-center"><Linkedin className="w-4 h-4" /></span>}
                                            {(p.platform || "").toLowerCase().includes("github") && <span className="w-7 h-7 rounded-[7px] bg-[#15171C] text-white flex items-center justify-center"><Github className="w-4 h-4" /></span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-[13px] text-[#374151]">
                                        {p.company && <span className="inline-flex items-center gap-1.5"><span className="w-4 h-4 rounded-[4px] bg-[#F4F3FD] inline-flex items-center justify-center text-[#5B53E0] text-[9px] font-bold">{(p.company || "?").charAt(0)}</span>{p.company}</span>}
                                        {edu && <span className="inline-flex items-center gap-1.5 text-[#6B6F76]">🎓 {edu}</span>}
                                    </div>

                                    {/* Real fetched data only */}
                                    <div className="pt-5 mt-5 border-t border-[#E8EAED] space-y-5">
                                        {p.headline && (
                                            <div className="flex items-start gap-2 text-[13px] text-[#374151]">
                                                <span className="w-6 h-6 rounded-[7px] bg-[#F4F3FD] text-[#5B53E0] flex items-center justify-center shrink-0"><SlidersHorizontal className="w-3.5 h-3.5" /></span>
                                                <span className="font-semibold">{p.headline}</span>
                                            </div>
                                        )}
                                        {bio && (
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-1.5">{tr("agent.summary")}</p>
                                                <p className="text-[13px] text-[#4B5563] leading-relaxed">{bioExpanded || bio.length <= 240 ? bio : bio.slice(0, 240) + "…"}{bio.length > 240 && <button onClick={() => setBioExpanded(!bioExpanded)} className="text-[#5B53E0] font-semibold ml-1">{bioExpanded ? tr("agent.readLess") : tr("agent.readMore")}</button>}</p>
                                            </div>
                                        )}
                                        {skills.length > 0 && (
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-2">{tr("agent.skills")}</p>
                                                <div className="flex flex-wrap gap-1.5">{skills.map((s, i) => <span key={i} className="px-2.5 py-1 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[12px] font-semibold">{s}</span>)}</div>
                                            </div>
                                        )}
                                        {(p.email || p.raw_data?.phone || p.platform) && (
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-2">{tr("agent.contactSource")}</p>
                                                <div className="space-y-1.5 text-[13px] text-[#374151]">
                                                    {p.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#8A929E]" /> {p.email}</p>}
                                                    {p.raw_data?.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#8A929E]" /> {p.raw_data.phone}</p>}
                                                    {p.platform && (
                                                        <p className="text-[#6B6F76] flex items-center gap-1.5">{tr("agent.sourceLabel")}
                                                            <img src={`https://www.google.com/s2/favicons?sz=64&domain=${platformDomain(p.platform)}`} alt={p.platform} className="w-4 h-4 rounded-sm object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                            <span className="capitalize font-semibold text-[#374151]">{p.platform}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {(p.followers != null || p.public_repos != null) && (
                                            <div className="flex gap-6">
                                                {p.followers != null && <div><p className="text-[18px] font-extrabold text-[#15171C]">{p.followers}</p><p className="text-[11px] text-[#8A929E]">{tr("agent.followers")}</p></div>}
                                                {p.public_repos != null && <div><p className="text-[18px] font-extrabold text-[#15171C]">{p.public_repos}</p><p className="text-[11px] text-[#8A929E]">{tr("agent.repos")}</p></div>}
                                            </div>
                                        )}
                                        {!p.headline && !bio && skills.length === 0 && !p.email && <p className="text-[12.5px] text-[#9AA3AF]">{tr("agent.noAdditionalDetails")}</p>}
                                    </div>
                                </div>

                                {/* Right: criteria analysis */}
                                <div className="p-6 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-[#5B53E0]" /><h4 className="text-[15px] font-bold text-[#15171C]">{tr("agent.criteriaAnalysis")}</h4></div>
                                    <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar max-h-[46vh]">
                                        {analyzing && analysis.length === 0 ? (
                                            <div className="flex items-center gap-2 text-[12.5px] text-[#8A929E]"><Loader2 className="w-4 h-4 animate-spin" /> {tr("agent.analyzingCriteria")}</div>
                                        ) : analysis.length === 0 ? (
                                            <p className="text-[12.5px] text-[#9AA3AF]">{tr("agent.addRankingCriteria")}</p>
                                        ) : analysis.map((a: any, i: number) => (
                                            <div key={i}>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold ${verdictBadge(a.verdict)}`}><ThumbsUp className="w-3.5 h-3.5" /> {a.verdict || tr("agent.noSignal")}</span>
                                                <p className="text-[13.5px] font-bold text-[#15171C] mt-2">{a.criterion}</p>
                                                <p className="text-[12.5px] text-[#6B6F76] mt-1 leading-relaxed">{a.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-[#E8EAED]">
                                        <button onClick={() => reviewIdx < reviewList.length - 1 ? reviewNav(1) : setReviewList(null)} className="h-10 px-5 rounded-[10px] bg-[#FDECEC] text-[#C0383C] text-[13px] font-bold hover:bg-[#FADBDB]">{tr("agent.notAFit")}</button>
                                        <button onClick={() => { const cur = p; if (reviewIdx < reviewList.length - 1) reviewNav(1); else setReviewList(null); approveProfile(cur, "looks good"); }} className="h-10 px-5 rounded-[10px] bg-[#E6F4EA] text-[#15803D] text-[13px] font-bold hover:bg-[#D6EFDD]">{tr("agent.looksGood")}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })()}

                {/* Criteria editor modal — ranked, most→least important */}
                {showCriteriaEdit && (
                    <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowCriteriaEdit(false)}>
                        <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 pb-3 flex items-center justify-between">
                                <h3 className="text-[17px] font-bold text-[#15171C] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#5B53E0]" /> {tr("agent.criteria")}</h3>
                                <button onClick={() => setShowCriteriaEdit(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="px-6 pb-4 overflow-y-auto no-scrollbar">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mb-2">{tr("agent.mostImportant")}</p>
                                <div className="space-y-2.5">
                                    {(criteria || []).map((c, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <div className="flex flex-col pt-2">
                                                <button disabled={i === 0} onClick={() => moveCriterion(i, -1)} className="text-[#C4C9D0] hover:text-[#5B53E0] disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                                                <button disabled={i === (criteria || []).length - 1} onClick={() => moveCriterion(i, 1)} className="text-[#C4C9D0] hover:text-[#5B53E0] disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                                            </div>
                                            <span className="w-5 text-center text-[13px] font-bold text-[#8A929E] pt-2">{i + 1}</span>
                                            <textarea
                                                value={c}
                                                onChange={(e) => editCriterion(i, e.target.value)}
                                                rows={Math.min(3, Math.ceil((c.length || 20) / 60))}
                                                className="flex-1 resize-none px-3 py-2 rounded-[10px] border border-[#E1E4E8] text-[13px] text-[#1F2127] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 leading-relaxed"
                                            />
                                            <button onClick={() => removeCriterion(c)} className="mt-2 w-6 h-6 rounded-full border border-[#F3C6C6] text-[#EF4444] hover:bg-rose-50 flex items-center justify-center shrink-0"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    {(criteria || []).length === 0 && <p className="text-[12.5px] text-[#9AA3AF] py-4 text-center">{tr("agent.noCriteriaYet")}</p>}
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A929E] mt-3">{tr("agent.leastImportant")}</p>

                                <div className="flex items-center gap-2 mt-4">
                                    <input value={newCriterion} onChange={(e) => setNewCriterion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCriterion(); }} placeholder={tr("agent.criterionPlaceholder")} className="flex-1 h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                                </div>
                            </div>
                            <div className="p-5 border-t border-[#E8EAED] flex items-center justify-end gap-2.5">
                                <button onClick={addCriterion} disabled={!newCriterion.trim()} className="h-10 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F7F8FA] disabled:opacity-50 flex items-center gap-1.5"><Plus className="w-4 h-4" /> {tr("agent.addCriterion")}</button>
                                <button onClick={() => { setShowCriteriaEdit(false); appendFreshPicks(tr("agent.updatedCriteria")); }} className="h-10 px-6 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] flex items-center gap-1.5">{tr("agent.update")} <ArrowRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters editor modal — titles + location + keywords */}
                {showFilterEdit && (
                    <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowFilterEdit(false)}>
                        <div className="bg-white rounded-[14px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-lg w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 pb-3 flex items-center justify-between">
                                <h3 className="text-[17px] font-bold text-[#15171C] flex items-center gap-2"><Filter className="w-4 h-4 text-[#5B53E0]" /> {tr("agent.filters")}</h3>
                                <button onClick={() => setShowFilterEdit(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="px-6 pb-4 overflow-y-auto no-scrollbar space-y-5">
                                <div>
                                    <p className="text-[13px] font-bold text-[#15171C] mb-1.5">{tr("agent.jobTitles")}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {fTitles.map((t, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[12px] font-semibold">{t}<button onClick={() => setFTitles(fTitles.filter((_, j) => j !== i))} className="w-4 h-4 rounded-full hover:bg-[#E4E1F7] flex items-center justify-center"><X className="w-3 h-3" /></button></span>
                                        ))}
                                        {fTitles.length === 0 && <span className="text-[12px] text-[#9AA3AF]">{tr("agent.noTitlesYet")}</span>}
                                    </div>
                                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) { setFTitles([...fTitles, newTitle.trim()]); setNewTitle(""); } }} placeholder={tr("agent.titlePlaceholder")} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-[#15171C] mb-1.5">{tr("agent.location")}</p>
                                    <input value={fLocation} onChange={(e) => setFLocation(e.target.value)} placeholder={tr("agent.locationPlaceholder")} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-[#15171C] mb-1.5">{tr("agent.keywords")}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {fKeywords.map((k, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[12px] font-semibold">{k}<button onClick={() => setFKeywords(fKeywords.filter((_, j) => j !== i))} className="w-4 h-4 rounded-full hover:bg-[#E4E1F7] flex items-center justify-center"><X className="w-3 h-3" /></button></span>
                                        ))}
                                        {fKeywords.length === 0 && <span className="text-[12px] text-[#9AA3AF]">{tr("agent.noKeywords")}</span>}
                                    </div>
                                    <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newKeyword.trim()) { setFKeywords([...fKeywords, newKeyword.trim()]); setNewKeyword(""); } }} placeholder={tr("agent.keywordPlaceholder")} className="w-full h-10 px-3 rounded-[10px] border border-[#E1E4E8] text-[13px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15" />
                                </div>
                            </div>
                            <div className="p-5 border-t border-[#E8EAED] flex items-center justify-end gap-2.5">
                                <button onClick={() => setShowFilterEdit(false)} className="h-10 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[#374151] text-[13px] font-semibold hover:bg-[#F7F8FA]">{tr("common.cancel")}</button>
                                <button onClick={saveFilters} className="h-10 px-6 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] flex items-center gap-1.5">{tr("agent.saveChanges")} <ArrowRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Talent Insights modal */}
                {showInsights && (
                    <div className="fixed inset-0 bg-[#15171C]/40 backdrop-blur-sm z-50 flex items-start justify-center px-4 py-8 overflow-y-auto no-scrollbar" onClick={() => setShowInsights(false)}>
                        <div className="bg-white rounded-[16px] border border-[#E8EAED] shadow-[0_14px_34px_rgba(15,23,42,0.16)] max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-[#E8EAED] flex items-center justify-between sticky top-0 bg-white rounded-t-[16px]">
                                <h3 className="text-[17px] font-bold text-[#15171C]">{tr("agent.talentInsights")} <span className="text-[#8A929E] font-semibold text-[14px]">({talent ? shortNum(talent.total) : "…"} matches)</span></h3>
                                <button onClick={() => setShowInsights(false)} className="p-1.5 hover:bg-[#F0F0F1] text-[#9AA3AF] rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-6">
                                {insightsLoading || !talent ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3"><Loader2 className="w-6 h-6 text-[#5B53E0] animate-spin" /><p className="text-[12.5px] text-[#8A929E]">{tr("agent.analyzingPool")}</p></div>
                                ) : (talent.skills.length === 0 && talent.titles.length === 0 && talent.employers.length === 0 && talent.locations.length === 0 && talent.sources.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
                                        <div className="w-12 h-12 rounded-[14px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                                        <p className="text-[14px] font-bold text-[#15171C]">{tr("agent.notEnoughData")}</p>
                                        <p className="text-[12.5px] text-[#8A929E] max-w-sm">{tr("agent.notEnoughDataDesc")}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {/* Only sections we actually have data for. */}
                                        {talent.sources.length > 0 && <BarList title={tr("agent.sourcesTitle")} subtitle={tr("agent.sourcesSub")} empty="" items={talent.sources} />}
                                        {talent.skills.length > 0 && <BarList title={tr("agent.skills")} subtitle={tr("agent.skillsSub")} empty="" items={talent.skills} />}
                                        {talent.titles.length > 0 && <BarList title={tr("agent.jobTitlesTitle")} subtitle={tr("agent.jobTitlesSub")} empty="" items={talent.titles} />}
                                        {talent.employers.length > 0 && <BarList title={tr("agent.employersTitle")} subtitle={tr("agent.employersSub")} empty="" items={talent.employers} />}
                                        {talent.locations.length > 0 && (
                                            <div className="rounded-[14px] border border-[#E8EAED] bg-[#FAFBFC] p-5">
                                                <h3 className="text-[15px] font-bold text-[#15171C]">{tr("agent.topLocations")}</h3>
                                                <p className="text-[12px] text-[#8A929E] mb-4">{tr("agent.topCitiesPool")}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.1fr] gap-4 items-start">
                                                    <div className="space-y-1">
                                                        {talent.locations.map((l) => (
                                                            <div key={l.label} className="flex items-center justify-between gap-2 py-1 border-b border-[#EEF0F3] last:border-0">
                                                                <span className="text-[12.5px] font-semibold text-[#374151] truncate" title={l.label}>{l.label}</span>
                                                                <span className="text-[12.5px] font-bold text-[#15171C]">{shortNum(l.count)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {talent.countryMap.length > 0 && (
                                                        <div className="rounded-[10px] overflow-hidden border border-[#E8EAED] bg-white min-h-[220px] flex items-center justify-center">
                                                            <Chart chartType="GeoChart" width="100%" height="240px"
                                                                data={[[tr("agent.country"), tr("agent.candidates")], ...talent.countryMap.map(([code, count]) => [code, count] as [string, number])]}
                                                                options={{ region: "world", displayMode: "regions", colorAxis: { colors: ["#DAD7F6", "#5B53E0"] }, backgroundColor: "transparent", datalessRegionColor: "#EEF0F3", defaultColor: "#F1F5F9", legend: "none", keepAspectRatio: true }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ---------------- Project workspace ----------------
    return (
        <div className="px-4 sm:px-6 md:px-7 py-6 max-w-[1320px] mx-auto w-full">
            <div className="flex items-center gap-2 text-[12.5px] text-[#8A929E] mb-4">
                <button onClick={() => router.push("/enterprise/sourcing/projects")} className="hover:text-[#5B53E0] font-semibold">{tr("agent.projects")}</button>
                <span>›</span><span className="font-bold text-[#15171C]">{project.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Search hero */}
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-11 h-11 rounded-[12px] bg-[#F4F3FD] text-[#5B53E0] flex items-center justify-center"><FolderOpen className="w-6 h-6" /></span>
                        <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-[#15171C]">{project.name}</h1>
                    </div>

                    <div className="rounded-[16px] border border-[#E1E4E8] bg-white p-4 shadow-sm">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                            placeholder={tr("agent.searchHeroPlaceholder")}
                            rows={2}
                            className="w-full resize-none bg-transparent outline-none text-[14px] text-[#1F2127] placeholder:text-[#9AA3AF]"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center bg-[#F4F5F7] border border-[#E8EAED] rounded-full p-0.5">
                                <button onClick={() => setMode("search")} className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-all ${mode === "search" ? "bg-white text-[#5B53E0] shadow-sm" : "text-[#6B6F76]"}`}><Search className="w-3.5 h-3.5" /> {tr("common.search")}</button>
                                <button onClick={() => setMode("agent")} className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 transition-all ${mode === "agent" ? "bg-white text-[#5B53E0] shadow-sm" : "text-[#6B6F76]"}`}><Sparkles className="w-3.5 h-3.5" /> {tr("agent.agent")}</button>
                            </div>
                            <button onClick={submit} disabled={!query.trim()} className="w-9 h-9 rounded-full bg-[#F4F3FD] text-[#5B53E0] hover:bg-[#E4E1F7] flex items-center justify-center disabled:opacity-40 transition-colors"><ArrowRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <p className="text-[11px] text-[#9AA3AF] mt-2 px-1">
                        {mode === "agent" ? tr("agent.agentModeHint") : tr("agent.searchModeHint")}
                    </p>

                    <div className="mt-4 space-y-2">
                        {SUGGESTIONS.map((s) => (
                            <button key={s} onClick={() => { setQuery(s); }} className="block w-full text-left text-[13px] text-[#4B5563] hover:text-[#5B53E0] py-1.5 transition-colors">{s}</button>
                        ))}
                    </div>

                    {/* Agent status card */}
                    <div className="mt-8">
                        <h3 className="text-[14px] font-bold text-[#15171C] mb-2">{tr("agent.agentStatus")}</h3>
                        <div className="rounded-[14px] border border-[#E8EAED] bg-white p-4 shadow-sm flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className={`w-9 h-9 rounded-[10px] text-white flex items-center justify-center ${agent?.paused ? "bg-[#9AA3AF]" : "bg-[#5B53E0]"}`}><Bot className="w-5 h-5" /></span>
                                <div>
                                    <p className="text-[13px] font-bold text-[#15171C] flex items-center gap-2">
                                        {agent?.paused ? tr("agent.deactivated") : agent?.status === "sourcing" ? tr("projects.sourcing") : agent?.status === "calibrating" ? tr("projects.calibrating") : tr("agent.noAgentYet")}
                                        {agent?.status && agent.status !== "none" && <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${agent?.paused ? "bg-[#F1F2F5] text-[#8A929E]" : "bg-[#EAF7EE] text-[#16A34A]"}`}><span className={`w-1.5 h-1.5 rounded-full ${agent?.paused ? "bg-[#9AA3AF]" : "bg-[#16A34A]"}`} />{agent?.paused ? tr("projects.inactive") : tr("projects.active")}</span>}
                                    </p>
                                    <p className="text-[11.5px] text-[#8A929E]">{agent?.paused ? tr("agent.pausedShort") : agent?.status && agent.status !== "none" ? tr("agent.automatingOutreach") : tr("agent.setupAgentHint")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {agent?.status && agent.status !== "none" && (
                                    <button onClick={() => patch({ paused: !agent?.paused })} className={`h-9 px-3.5 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 ${agent?.paused ? "bg-[#5B53E0] text-white hover:bg-[#4A43C9]" : "border border-[#E1E4E8] bg-white text-[#374151] hover:bg-[#F7F8FA]"}`}>{agent?.paused ? <><Play className="w-3.5 h-3.5" /> {tr("agent.activate")}</> : <><Pause className="w-3.5 h-3.5" /> {tr("agent.deactivate")}</>}</button>
                                )}
                                <button
                                    onClick={() => { if (!agent?.status || agent.status === "none") { if (!query.trim()) setMode("agent"); else submit(); } else setAgentTab("calibrate"); }}
                                    className="h-9 px-4 rounded-[10px] border border-[#E1E4E8] bg-white text-[13px] font-semibold text-[#374151] hover:bg-[#F7F8FA]"
                                >
                                    {agent?.status && agent.status !== "none" ? tr("agent.openAgent") : tr("agent.setupAgent")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right config + shortlist */}
                <div className="space-y-5">
                    <div className="rounded-[14px] border border-[#E8EAED] bg-white p-5 shadow-sm">
                        <p className="text-[12px] font-semibold text-[#8A929E] mb-3">{tr("agent.configuration")}</p>
                        <ConfigRow label={tr("agent.owner")} value={<span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-[#ECEBFB] text-[#5B53E0] text-[9px] font-extrabold flex items-center justify-center uppercase">{(project.owner || "?").charAt(0)}</span>{project.owner}</span>} />
                        <ConfigRow label={tr("agent.collaborators")} value={
                            <div className="flex flex-col items-end gap-1">
                                {(project.collaborators || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {(project.collaborators || []).map((c, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4F3FD] text-[#4B4794] text-[11px] font-semibold">
                                                {c}
                                                <button onClick={() => patch({ collaborators: (project.collaborators || []).filter((x) => x !== c) })} className="hover:text-[#5B53E0]">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <input
                                    value={collabInput}
                                    onChange={(e) => setCollabInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && collabInput.trim()) { patch({ collaborators: [...(project.collaborators || []), collabInput.trim()] }); setCollabInput(""); } }}
                                    placeholder={tr("agent.addCollaborator")}
                                    className="text-[12.5px] text-right bg-transparent outline-none placeholder:text-[#9AA3AF] w-32"
                                />
                            </div>
                        } />
                        <ConfigRow label={tr("agent.visibility")} value={
                            <select value={project.visibility || "Shared"} onChange={(e) => patch({ visibility: e.target.value })} className="text-[13px] font-semibold text-[#374151] bg-transparent outline-none cursor-pointer">
                                <option value="Shared">{tr("agent.shared")}</option><option value="Private">{tr("agent.private")}</option>
                            </select>
                        } />
                        <ConfigRow label={tr("agent.atsJob")} value={
                            <div className="relative">
                                <button onClick={() => setShowAtsMenu((v) => !v)} className="text-[13px] font-semibold text-[#374151] hover:text-[#5B53E0] inline-flex items-center gap-1">
                                    {project.ats_job_title || <span className="text-[#9AA3AF]">{tr("agent.linkAtsJob")}</span>} <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                {showAtsMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowAtsMenu(false)} />
                                        <div className="absolute right-0 top-7 z-50 w-56 max-h-64 overflow-y-auto bg-white rounded-[10px] border border-[#E8EAED] shadow-[0_12px_30px_rgba(15,23,42,0.16)] p-1.5">
                                            {project.ats_job_id && <button onClick={() => { patch({ ats_job_id: "", ats_job_title: "" }); setShowAtsMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[12.5px] font-semibold text-[#C0383C] hover:bg-rose-50">{tr("agent.unlink")}</button>}
                                            {jobs.length === 0 ? <p className="px-2.5 py-2 text-[12px] text-[#9AA3AF]">{tr("agent.noJobsFound")}</p> : jobs.map((j) => (
                                                <button key={j.id} onClick={() => { patch({ ats_job_id: j.id, ats_job_title: j.title }); setShowAtsMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[12.5px] font-semibold text-[#374151] hover:bg-[#F7F8FA] truncate">{j.title}</button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        } />
                        <ConfigRow label={tr("agent.department")} value={
                            <input defaultValue={project.department || ""} onBlur={(e) => e.target.value !== (project.department || "") && patch({ department: e.target.value })} placeholder={tr("agent.select")} className="text-[13px] font-semibold text-[#374151] bg-transparent outline-none text-right w-28 placeholder:text-[#9AA3AF]" />
                        } last />
                    </div>

                    <div className="rounded-[14px] border border-[#E8EAED] bg-white p-5 shadow-sm">
                        <p className="text-[12px] font-semibold text-[#8A929E] mb-3">{tr("agent.shortlist")}</p>
                        {project.stats?.shortlisted ? (
                            <div className="text-center py-2">
                                <p className="text-[28px] font-extrabold text-[#15171C]">{project.stats.shortlisted}</p>
                                <p className="text-[12px] text-[#8A929E]">{tr("agent.candidatesShortlisted")}</p>
                                <button onClick={() => router.push("/enterprise/sourcing/shortlisted")} className="mt-3 text-[12.5px] font-bold text-[#5B53E0] hover:underline">{tr("agent.viewShortlist")} →</button>
                            </div>
                        ) : (
                            <div className="space-y-2 py-2">
                                {[0, 1, 2].map((i) => <div key={i} className="h-9 rounded-[8px] bg-[#F4F5F7]" />)}
                                <p className="text-[12px] text-[#9AA3AF] text-center pt-2">{tr("agent.noProfilesShortlisted")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function BarList({ title, subtitle, items, empty }: { title: string; subtitle: string; items: StatItem[]; empty: string }) {
    return (
        <div className="rounded-[14px] border border-[#E8EAED] bg-[#FAFBFC] p-5">
            <h3 className="text-[15px] font-bold text-[#15171C]">{title}</h3>
            <p className="text-[12px] text-[#8A929E] mb-4">{subtitle}</p>
            {items.length === 0 ? (
                <p className="text-[13px] text-[#9AA3AF] py-6 text-center">{empty}</p>
            ) : (
                <div className="space-y-2.5">
                    {items.map((it) => (
                        <div key={it.label} className="flex items-center gap-3">
                            <span className="w-32 sm:w-40 shrink-0 text-[12.5px] font-semibold text-[#374151] truncate" title={it.label}>{it.label}</span>
                            <div className="flex-1 h-6 bg-white rounded-[6px] overflow-hidden border border-[#EEF0F3]">
                                <div className="h-full rounded-[6px] bg-[#7C6CF6]" style={{ width: `${Math.max(it.pct, 3)}%` }} />
                            </div>
                            <span className="w-20 shrink-0 text-right text-[12px] font-bold text-[#374151]">{it.count} ({it.pct}%)</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConfigRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
    return (
        <div className={`flex items-center justify-between gap-3 py-2.5 ${last ? "" : "border-b border-[#F4F5F7]"}`}>
            <span className="text-[12.5px] text-[#8A929E]">{label}</span>
            <span className="text-[13px] font-semibold text-[#374151]">{value}</span>
        </div>
    );
}

function deriveCriteria(text: string): string[] {
    const t = (text || "").trim();
    if (!t) return [];
    const out: string[] = [];
    const m = t.match(/(?:skilled in|experience (?:in|with)|expertise in|expert in|background in)\s+(.+?)(?:\.|$)/i);
    if (m?.[1]) out.push(...m[1].split(/,|\band\b|\bor\b/i).map((s) => s.replace(/[.]+$/, "").trim()).filter((s) => s.length > 1 && s.length < 24));
    if (/\berp\b/i.test(t)) out.push("ERP");
    if (/\benterprise\b/i.test(t)) out.push("Enterprise");
    return Array.from(new Set(out)).slice(0, 5);
}

function shortNum(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(n);
}
