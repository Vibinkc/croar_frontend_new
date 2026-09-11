"use client";

/**
 * Sourcing Hub — Manatal's screen rebuilt component for component in Croar's design system.
 *
 * Their anatomy is kept exactly: filter rail, a result row with four icon actions and its four
 * labelled blocks (candidate information / company / contact details / skills), a full-height
 * profile drawer with Education, Experience and Skills panels over a sticky action bar, and an
 * Add-to-job dialog with a status filter and a keyword box. Since the app-wide reskin the
 * material matches too — Manatal's blue, Material greys, 4px corners and Roboto.
 *
 * Two of their rules are kept because they are right, not because they are theirs:
 *   · Add to job stays disabled until the profile has been imported. A search result is a
 *     stranger on the internet; only a candidate can go on a pipeline.
 *   · Adding someone to a job does not tell them. The invite is a separate, deliberate act.
 *
 * One is dropped: their row checkboxes are decoration until you pay for bulk. Here they drive a
 * real bulk import, because a control that selects things and then offers nothing is worse than
 * no control at all.
 *
 * What runs underneath differs and the page says so. Manatal queries a licensed database of
 * ~700 million warehoused profiles at a credit per search. Croar composes the same filters into
 * a live web search: fewer results, current rather than stored, no credit.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, PageHeader, cn, Icon } from "@/components/ds";

type Row = Record<string, string>;

interface Profile {
    full_name: string;
    headline?: string | null;
    location?: string | null;
    company?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    profile_url?: string | null;
    skills?: string[];
    education?: Row[];
    experience?: Row[];
    ai_summary?: string | null;
}

interface Job {
    id: string;
    title: string;
    department?: string | null;
    status?: string | null;
}

interface Folder {
    id: string;
    name: string;
    candidate_count: number;
}

/* ─────────────────────────── small shared pieces ─────────────────────────── */

/** Deterministic avatar tint, so the same person keeps the same colour across renders. */
const TONES: [string, string][] = [
    ["#E3F2FD", "#1976D2"],
    ["#E8F5E9", "#2E7D32"],
    ["#FFF3E0", "#EF6C00"],
    ["#E3F2FD", "#1565C0"],
    ["#FFEBEE", "#C62828"],
    ["#EEEEEE", "#4F4F4F"],
];
function toneFor(seed: string): [string, string] {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + (seed.codePointAt(i) ?? 0)) >>> 0;
    return TONES[h % TONES.length];
}

function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
    const [bg, fg] = toneFor(name);
    const [broken, setBroken] = useState(false);
    return (
        <span
            className="shrink-0 rounded-full flex items-center justify-center font-bold overflow-hidden"
            style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.36) }}
        >
            {src && !broken ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img role="presentation" src={src} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
            ) : (
                name.trim().charAt(0).toUpperCase() || "?"
            )}
        </span>
    );
}

/** The square icon buttons on a result row and in the drawer header. */
function IconAction({
    icon, label, onClick, disabled, tone = "quiet",
}: {
    icon: string; label: string; onClick?: () => void; disabled?: boolean; tone?: "quiet" | "solid";
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors shrink-0",
                "disabled:opacity-35 disabled:pointer-events-none",
                tone === "solid"
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "text-[#9E9E9E] hover:bg-[#F5F6F8] hover:text-[#1976D2]"
            )}
        >
            <Icon name={icon} className="text-[20px]" />
        </button>
    );
}

/** The small grey caption above each block on a result row. */
function Caption({ children }: { children: React.ReactNode }) {
    return <p className="text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#9E9E9E] mb-1.5">{children}</p>;
}

function Line({ icon, children, tone }: { icon: string; children: React.ReactNode; tone?: string }) {
    return (
        <span className={cn("flex items-center gap-1.5 text-[12.5px] min-w-0", tone || "text-[#4F4F4F]")}>
            <Icon name={icon} className="text-[16px] text-[#9E9E9E] shrink-0" />
            <span className="truncate">{children}</span>
        </span>
    );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={cn(
                "w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors shrink-0",
                checked ? "bg-[#1976D2] border-[#1976D2] text-white" : "bg-white border-[#E0E0E0] hover:border-[#1976D2]"
            )}
        >
            {checked && <i className="mdi mdi-check text-[14px] leading-none" />}
        </button>
    );
}

/** A titled panel with a grey header strip — the drawer's Education / Experience / Skills cards. */
function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={cn("rounded-[4px] border border-[#E0E0E0] bg-white overflow-hidden", className)}>
            <header className="px-4 py-2.5 bg-[#F5F6F8] border-b border-[#E0E0E0]">
                <h3 className="text-[13px] font-bold text-[#212121]">{title}</h3>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function NoData({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <i className="mdi mdi-inbox text-[26px] text-[#E0E0E0]" />
            <p className="text-[12.5px] text-[#9E9E9E]">{text}</p>
        </div>
    );
}

/** One row of a history — logo disc, title, subtitle, dates. */
function HistoryItem({ title, subtitle, meta }: { title: string; subtitle?: string; meta?: string }) {
    const [bg, fg] = toneFor(subtitle || title);
    return (
        <div className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{ background: bg, color: fg }}
            >
                {(subtitle || title).trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#212121] leading-snug">{title}</p>
                {subtitle && <p className="text-[12.5px] text-[#4F4F4F] leading-snug">{subtitle}</p>}
                {meta && <p className="text-[11.5px] text-[#9E9E9E] mt-0.5">{meta}</p>}
            </div>
        </div>
    );
}

/* ──────────────────────────────── filter rail ─────────────────────────────── */

function Section({
    title, icon, open, onToggle, count, children,
}: {
    title: string; icon: string; open: boolean; onToggle: () => void;
    count?: number; children: React.ReactNode;
}) {
    return (
        <div className="border-b border-[#E0E0E0] last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
            >
                <Icon name={icon} className="text-[18px] text-[#9E9E9E]" />
                <span className="flex-1 text-[13px] font-semibold text-[#212121]">{title}</span>
                {count ? (
                    <span className="text-[10px] font-bold w-[18px] h-[18px] rounded-full bg-[#1976D2] text-white flex items-center justify-center">
                        {count}
                    </span>
                ) : null}
                <span className={cn("mdi mdi-chevron-down text-[18px] text-[#BDBDBD] transition-transform", !open && "-rotate-90")} />
            </button>
            {open && <div className="px-4 pb-4 flex flex-col gap-2">{children}</div>}
        </div>
    );
}

const INPUT =
    "w-full h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

function Chips({ values, onRemove }: { values: string[]; onRemove: (v: string) => void }) {
    if (!values.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {values.map((v) => (
                <span
                    key={v}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold pl-1.5 pr-1 py-1 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32]"
                >
                    <i className="mdi mdi-check-circle text-[14px]" />
                    {v}
                    <button type="button" onClick={() => onRemove(v)} aria-label={`Remove ${v}`} className="hover:text-[#0A6B55]">
                        <i className="mdi mdi-close-circle text-[15px]" />
                    </button>
                </span>
            ))}
        </div>
    );
}

/* ──────────────────────────────────── page ────────────────────────────────── */

export default function SourcingHub() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [titles, setTitles] = useState<string[]>([]);
    const [titleDraft, setTitleDraft] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillDraft, setSkillDraft] = useState("");
    const [location, setLocation] = useState("");
    const [company, setCompany] = useState("");
    const [yearsMin, setYearsMin] = useState("");
    const [yearsMax, setYearsMax] = useState("");
    const [school, setSchool] = useState("");
    const [degree, setDegree] = useState("");
    const [major, setMajor] = useState("");

    const [open, setOpen] = useState<Record<string, boolean>>({ titles: true, location: true });
    const [results, setResults] = useState<Profile[]>([]);
    const [query, setQuery] = useState("");
    const [searched, setSearched] = useState(false);
    const [sample, setSample] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    const [drawerAt, setDrawerAt] = useState<number | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [imported, setImported] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string>("");
    const [jobPicker, setJobPicker] = useState<Profile[] | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobQuery, setJobQuery] = useState("");
    const [jobStatus, setJobStatus] = useState("ALL");
    const [folderPicker, setFolderPicker] = useState<Profile[] | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [folderQuery, setFolderQuery] = useState("");
    const [newFolder, setNewFolder] = useState("");
    const [provenance, setProvenance] = useState(false);
    const [toast, setToast] = useState("");

    const keyOf = (p: Profile) => p.profile_url || p.email || p.full_name;

    // A value typed into a box counts before Enter commits it to a chip. Manatal requires the
    // commit and leaves Search dead until you discover that, which is the single most confusing
    // thing about their screen.
    const pendingTitles = titleDraft.trim() ? [...titles, titleDraft.trim()] : titles;
    const pendingSkills = skillDraft.trim() ? [...skills, skillDraft.trim()] : skills;
    const canSearch = pendingTitles.length > 0 || pendingSkills.length > 0 || company.trim() !== "";

    const viewing = drawerAt !== null ? results[drawerAt] ?? null : null;

    const loadJobs = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(Array.isArray(data) ? data : data.items || []);
            }
        } catch {
            /* the picker shows an empty list and says so */
        }
    }, [token]);

    const loadFolders = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setFolders(await res.json());
        } catch {
            /* the picker offers "create a folder" and says the list is empty */
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && token) {
            void loadJobs();
            void loadFolders();
        }
    }, [authLoading, token, loadJobs, loadFolders]);

    // Escape closes whatever is on top; the arrow keys walk the drawer like theirs.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (folderPicker) setFolderPicker(null);
                else if (jobPicker) setJobPicker(null);
                else if (provenance) setProvenance(false);
                else setDrawerAt(null);
            }
            if (drawerAt !== null && !jobPicker && !folderPicker) {
                if (e.key === "ArrowRight" && drawerAt < results.length - 1) setDrawerAt(drawerAt + 1);
                if (e.key === "ArrowLeft" && drawerAt > 0) setDrawerAt(drawerAt - 1);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [drawerAt, results.length, jobPicker, folderPicker, provenance]);

    const search = async () => {
        if (!token || !canSearch) return;
        setSearching(true);
        setError("");
        try {
            // Commit whatever is still in the boxes, so the search matches what is on screen.
            setTitles(pendingTitles);
            setSkills(pendingSkills);
            setTitleDraft("");
            setSkillDraft("");

            const p = new URLSearchParams();
            pendingTitles.forEach((v) => p.append("job_titles", v));
            pendingSkills.forEach((v) => p.append("skills", v));
            if (location.trim()) p.set("location", location.trim());
            if (company.trim()) p.set("company", company.trim());
            if (yearsMin) p.set("years_min", yearsMin);
            if (yearsMax) p.set("years_max", yearsMax);
            if (school.trim()) p.set("school", school.trim());
            if (degree.trim()) p.set("degree", degree.trim());
            if (major.trim()) p.set("major", major.trim());

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/sourcing/hub/search?${p}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                // Clear the previous run: leaving its results under an error banner reads as
                // though they came back from the search that just failed.
                setError(typeof data.detail === "string" ? data.detail : tr("hub.searchFailed"));
                setResults([]);
                setSearched(false);
                return;
            }
            setResults(data.results || []);
            setQuery(data.query || "");
            setSample(!!data.sample);
            setSelected(new Set());
            setSearched(true);
        } catch {
            setError(tr("hub.searchFailed"));
        } finally {
            setSearching(false);
        }
    };

    const say = (msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(""), 3400);
    };

    const importOne = async (p: Profile, jobId?: string, folderId?: string) => {
        if (!token) return false;
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/sourcing/hub/import`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: p.full_name, email: p.email, headline: p.headline,
                location: p.location, company: p.company, profile_url: p.profile_url,
                avatar_url: p.avatar_url, skills: p.skills || [],
                education: p.education || [], experience: p.experience || [],
                ai_summary: p.ai_summary, job_id: jobId || null, folder_id: folderId || null,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            say(typeof data.detail === "string" ? data.detail : tr("hub.importFailed"));
            return false;
        }
        setImported((m) => ({ ...m, [keyOf(p)]: data.candidate_id }));
        return true;
    };

    /** One profile or a whole selection — the same path, so bulk cannot drift from single. */
    const importMany = async (people: Profile[], jobId?: string, folderId?: string) => {
        setBusy(people.length === 1 ? keyOf(people[0]) : "bulk");
        try {
            let ok = 0;
            for (const p of people) if (await importOne(p, jobId, folderId)) ok++;
            setJobPicker(null);
            setFolderPicker(null);
            if (ok) {
                say(
                    folderId
                        ? tr("hub.addedToFolderN", { count: ok })
                        : jobId
                            ? tr("hub.addedToJobN", { count: ok })
                            : tr("hub.createdCandidateN", { count: ok })
                );
                if (people.length > 1) setSelected(new Set());
            }
            // A new folder changes the counts shown in the picker next time it opens.
            if (folderId) void loadFolders();
        } finally {
            setBusy("");
        }
    };

    /** Create a folder and file this selection into it in one go.
     *
     * The alternative — leave the hub, make a folder, come back, search again — loses the
     * search, which is the whole reason the recruiter is on this screen.
     */
    const createFolderAndAdd = async (people: Profile[]) => {
        const name = newFolder.trim();
        if (!name || !token) return;
        setBusy("bulk");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                say(tr("hub.folderCreateFailed"));
                return;
            }
            const folder = await res.json();
            setNewFolder("");
            await importMany(people, undefined, folder.id);
        } finally {
            setBusy("");
        }
    };

    const addChip = (draft: string, values: string[], set: (v: string[]) => void, clear: () => void) => {
        const v = draft.trim();
        if (v && !values.includes(v)) set([...values, v]);
        clear();
    };

    const toggle = (k: string) =>
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
        });

    const allSelected = results.length > 0 && selected.size === results.length;
    const chosen = results.filter((p) => selected.has(keyOf(p)));

    const statuses = useMemo(
        () => Array.from(new Set(jobs.map((j) => j.status).filter((s): s is string => !!s))),
        [jobs]
    );
    const shownFolders = folders.filter((f) =>
        f.name.toLowerCase().includes(folderQuery.trim().toLowerCase())
    );
    const shownJobs = jobs.filter(
        (j) =>
            (jobStatus === "ALL" || j.status === jobStatus) &&
            j.title.toLowerCase().includes(jobQuery.trim().toLowerCase())
    );

    const clearAll = () => {
        setTitles([]); setTitleDraft(""); setSkills([]); setSkillDraft("");
        setLocation(""); setCompany(""); setYearsMin(""); setYearsMax("");
        setSchool(""); setDegree(""); setMajor("");
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("hub.title")}
                    subtitle={tr("hub.poweredBy")}
                    icon="travel_explore"
                    actions={
                        <Button variant="ghost" size="sm" trailingIcon="open_in_new" onClick={() => setProvenance(true)}>
                            {tr("hub.whereFrom")}
                        </Button>
                    }
                />
            </div>

            <div className="flex-1 flex gap-4 px-6 py-4 min-h-0">
                {/* ── filter rail ──────────────────────────────────────────────── */}
                <aside className="w-[288px] shrink-0 hidden lg:flex flex-col rounded-[4px] border border-[#E0E0E0] bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#212121]">{tr("hub.filters")}</span>
                        <button type="button" onClick={clearAll} className="text-[12.5px] font-semibold text-[#1976D2] hover:text-[#1565C0]">
                            {tr("hub.clearAll")}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <Section title={tr("hub.jobTitles")} icon="work" count={titles.length}
                                 open={open.titles} onToggle={() => setOpen((o) => ({ ...o, titles: !o.titles }))}>
                            <input
                                className={INPUT}
                                value={titleDraft}
                                placeholder={tr("hub.enterJobTitle")}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(titleDraft, titles, setTitles, () => setTitleDraft("")); } }}
                                onBlur={() => addChip(titleDraft, titles, setTitles, () => setTitleDraft(""))}
                            />
                            <Chips values={titles} onRemove={(v) => setTitles(titles.filter((x) => x !== v))} />
                            <p className="text-[11px] text-[#9E9E9E]">{tr("hub.enterToAdd")}</p>
                        </Section>

                        <Section title={tr("hub.location")} icon="location_on"
                                 open={open.location} onToggle={() => setOpen((o) => ({ ...o, location: !o.location }))}>
                            <input className={INPUT} value={location} placeholder={tr("hub.enterLocation")}
                                   onChange={(e) => setLocation(e.target.value)} />
                            {/* Manatal has a radius box here. A web search cannot be bounded by
                                kilometres the way a geocoded database can, so the reason is on the
                                page instead of a control that quietly does nothing. */}
                            <p className="text-[11px] text-[#757575] leading-relaxed">{tr("hub.noRadius")}</p>
                        </Section>

                        <Section title={tr("hub.company")} icon="apartment"
                                 open={!!open.company} onToggle={() => setOpen((o) => ({ ...o, company: !o.company }))}>
                            <input className={INPUT} value={company} placeholder={tr("hub.enterCompany")}
                                   onChange={(e) => setCompany(e.target.value)} />
                        </Section>

                        <Section title={tr("hub.skills")} icon="stars" count={skills.length}
                                 open={!!open.skills} onToggle={() => setOpen((o) => ({ ...o, skills: !o.skills }))}>
                            <input
                                className={INPUT}
                                value={skillDraft}
                                placeholder={tr("hub.enterSkill")}
                                onChange={(e) => setSkillDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(skillDraft, skills, setSkills, () => setSkillDraft("")); } }}
                                onBlur={() => addChip(skillDraft, skills, setSkills, () => setSkillDraft(""))}
                            />
                            <Chips values={skills} onRemove={(v) => setSkills(skills.filter((x) => x !== v))} />
                            <p className="text-[11px] text-[#9E9E9E]">{tr("hub.enterToAdd")}</p>
                        </Section>

                        <Section title={tr("hub.experience")} icon="badge"
                                 open={!!open.years} onToggle={() => setOpen((o) => ({ ...o, years: !o.years }))}>
                            <div className="flex gap-2 items-center">
                                <input className={INPUT} type="number" min={0} value={yearsMin}
                                       placeholder={tr("hub.min")} onChange={(e) => setYearsMin(e.target.value)} />
                                <span className="text-[#BDBDBD]">–</span>
                                <input className={INPUT} type="number" min={0} value={yearsMax}
                                       placeholder={tr("hub.max")} onChange={(e) => setYearsMax(e.target.value)} />
                            </div>
                        </Section>

                        <Section title={tr("hub.education")} icon="school"
                                 open={!!open.edu} onToggle={() => setOpen((o) => ({ ...o, edu: !o.edu }))}>
                            <input className={INPUT} value={school} placeholder={tr("hub.school")}
                                   onChange={(e) => setSchool(e.target.value)} />
                            <input className={INPUT} value={degree} placeholder={tr("hub.degree")}
                                   onChange={(e) => setDegree(e.target.value)} />
                            <input className={INPUT} value={major} placeholder={tr("hub.major")}
                                   onChange={(e) => setMajor(e.target.value)} />
                        </Section>
                    </div>

                    <div className="p-3 border-t border-[#E0E0E0]">
                        <Button fullWidth icon={searching ? "progress_activity" : "search"}
                                onClick={() => void search()} disabled={!canSearch || searching}>
                            {searching ? tr("hub.searching") : tr("hub.search")}
                        </Button>
                        {!canSearch && <p className="text-[11px] text-[#757575] text-center mt-2">{tr("hub.needAFilter")}</p>}
                    </div>
                </aside>

                {/* ── results ──────────────────────────────────────────────────── */}
                <main className="flex-1 min-w-0 rounded-[4px] border border-[#E0E0E0] bg-white flex flex-col overflow-hidden">
                    {error && (
                        <p className="m-4 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>
                    )}

                    {!searched && !searching ? (
                        <EmptyState icon="person_search" title={tr("hub.emptyTitle")}
                                    description={tr("hub.emptyDesc")} className="flex-1" />
                    ) : searching ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                            <p className="text-[12.5px] text-[#757575]">{tr("hub.searchingLong")}</p>
                        </div>
                    ) : (
                        <>
                            {sample && (
                                <div className="px-4 py-2.5 bg-[#FFF3E0] border-b border-[#F5D9A8] flex items-start gap-2">
                                    <i className="mdi mdi-flask text-[18px] text-[#EF6C00] shrink-0" />
                                    <p className="text-[12.5px] text-[#8A5A05] leading-relaxed">{tr("hub.sampleBanner")}</p>
                                </div>
                            )}

                            {/* results toolbar — select-all, range count, bulk actions */}
                            <div className="px-4 py-2.5 border-b border-[#E0E0E0] flex items-center gap-3 flex-wrap min-h-[52px]">
                                <Checkbox
                                    checked={allSelected}
                                    label={tr("hub.selectAll")}
                                    onChange={() => setSelected(allSelected ? new Set() : new Set(results.map(keyOf)))}
                                />
                                {selected.size > 0 ? (
                                    <>
                                        <span className="text-[13px] font-bold text-[#212121]">
                                            {tr("hub.nSelected", { count: selected.size })}
                                        </span>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Button size="sm" variant="secondary" icon="person_add"
                                                    disabled={!!busy} onClick={() => void importMany(chosen)}>
                                                {tr("hub.createCandidate")}
                                            </Button>
                                            <Button size="sm" icon="work" disabled={!!busy}
                                                    onClick={() => { setJobPicker(chosen); setJobQuery(""); }}>
                                                {tr("hub.addToJob")}
                                            </Button>
                                            <Button size="sm" variant="secondary" icon="create_new_folder"
                                                    disabled={!!busy}
                                                    onClick={() => { setFolderPicker(chosen); setFolderQuery(""); }}>
                                                {tr("hub.addToFolder")}
                                            </Button>
                                            <button type="button" onClick={() => setSelected(new Set())}
                                                    className="text-[12.5px] font-semibold text-[#757575] hover:text-[#212121]">
                                                {tr("hub.clearSelection")}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[13px] font-semibold text-[#212121] tabular-nums">
                                            {tr("hub.rangeCount", {
                                                from: results.length ? 1 : 0,
                                                to: results.length,
                                                total: results.length,
                                            })}
                                        </span>
                                        {query && (
                                            <span className="text-[11.5px] text-[#9E9E9E] font-mono truncate max-w-[46%]" title={query}>
                                                {query}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {results.length === 0 ? (
                                <EmptyState icon="search_off" tone="muted" title={tr("hub.noResults")}
                                            description={tr("hub.noResultsDesc")} className="flex-1" />
                            ) : (
                                <div className="flex-1 overflow-y-auto divide-y divide-[#EEEEEE]">
                                    {results.map((p, i) => {
                                        const k = keyOf(p);
                                        const done = !!imported[k];
                                        const edu = p.education?.[0];
                                        return (
                                            <article key={k} className="p-4 flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors">
                                                <div className="pt-1.5">
                                                    <Checkbox checked={selected.has(k)} onChange={() => toggle(k)} label={p.full_name} />
                                                </div>
                                                <Avatar name={p.full_name} src={p.avatar_url} />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <button type="button" onClick={() => setDrawerAt(i)}
                                                                className="text-[14.5px] font-bold text-[#1976D2] hover:text-[#1565C0] text-left">
                                                            {p.full_name}
                                                        </button>
                                                        {p.profile_url && (
                                                            <a href={p.profile_url} target="_blank" rel="noopener noreferrer"
                                                               title={tr("hub.openProfile")} className="text-[#9E9E9E] hover:text-[#1976D2]">
                                                                <i className="mdi mdi-link-variant text-[15px]" />
                                                            </a>
                                                        )}
                                                        {sample && <Badge tone="warning">{tr("hub.sampleTag")}</Badge>}
                                                        {done && <Badge tone="teal">{tr("hub.imported")}</Badge>}
                                                    </div>
                                                    {p.headline && <p className="text-[12.5px] text-[#4F4F4F] mt-0.5">{p.headline}</p>}

                                                    {/* Manatal's four labelled blocks, two per column. */}
                                                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-3">
                                                        <div className="min-w-0">
                                                            <Caption>{tr("hub.candidateInformation")}</Caption>
                                                            <div className="flex flex-col gap-1">
                                                                {p.location && <Line icon="location_on">{p.location}</Line>}
                                                                {edu && (
                                                                    <Line icon="school">
                                                                        {[edu.school, edu.degree].filter(Boolean).join(" · ")}
                                                                    </Line>
                                                                )}
                                                                {!p.location && !edu && <span className="text-[12.5px] text-[#BDBDBD]">—</span>}
                                                            </div>
                                                            {p.company && (
                                                                <div className="mt-3">
                                                                    <Caption>{tr("hub.company")}</Caption>
                                                                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#212121] font-medium min-w-0">
                                                                        <Avatar name={p.company} size={22} />
                                                                        <span className="truncate">{p.company}</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <Caption>{tr("hub.contactDetails")}</Caption>
                                                            {/* Whether this person can be reached at all decides whether
                                                                the row is worth acting on, so it is stated here rather
                                                                than left to the drawer. */}
                                                            {p.email ? (
                                                                <a href={`mailto:${p.email}`}
                                                                   className="flex items-center gap-1.5 text-[12.5px] text-[#2E7D32] hover:underline min-w-0">
                                                                    <i className="mdi mdi-email text-[16px] shrink-0" />
                                                                    <span className="truncate">{p.email}</span>
                                                                </a>
                                                            ) : (
                                                                <Line icon="mail_off" tone="text-[#EF6C00]">{tr("hub.noEmail")}</Line>
                                                            )}
                                                            {p.skills && p.skills.length > 0 && (
                                                                <div className="mt-3">
                                                                    <Caption>{tr("hub.candidateSkills")}</Caption>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {p.skills.slice(0, 8).map((s) => (
                                                                            <span key={s} className="text-[11.5px] font-semibold px-2 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1565C0]">
                                                                                {s}
                                                                            </span>
                                                                        ))}
                                                                        {p.skills.length > 8 && (
                                                                            <span className="text-[11.5px] text-[#9E9E9E] self-center">
                                                                                +{p.skills.length - 8}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* the four row actions, in their order */}
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    <IconAction icon="person_add" label={tr("hub.createCandidate")}
                                                                disabled={done || busy === k} onClick={() => void importMany([p])} />
                                                    <IconAction icon="visibility" label={tr("hub.preview")} onClick={() => setDrawerAt(i)} />
                                                    <IconAction icon="work" label={done ? tr("hub.addToJob") : tr("hub.importFirst")}
                                                                disabled={!done} onClick={() => { setJobPicker([p]); setJobQuery(""); }} />
                                                    <IconAction icon="create_new_folder" label={tr("hub.addToFolder")}
                                                                onClick={() => { setFolderPicker([p]); setFolderQuery(""); }} />
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* ── profile drawer ───────────────────────────────────────────────── */}
            {viewing && (
                <div role="presentation" className="fixed inset-0 z-[200] flex justify-end" onClick={() => setDrawerAt(null)}>
                    <div className="absolute inset-0 bg-[#212121]/45" />
                    <div role="presentation" className="relative w-full max-w-[860px] h-full bg-[#F5F6F8] flex flex-col shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                         onClick={(e) => e.stopPropagation()}>
                        {/* title band */}
                        <div className="px-6 h-[58px] shrink-0 bg-[#1976D2] text-white flex items-center justify-between gap-3">
                            <h2 className="text-[17px] font-bold truncate">{viewing.full_name}</h2>
                            <IconAction icon="close" label={tr("hub.close")} tone="solid" onClick={() => setDrawerAt(null)} />
                        </div>

                        {sample && (
                            <div className="px-6 py-2 bg-[#FFF3E0] border-b border-[#F5D9A8] flex items-center gap-2 shrink-0">
                                <i className="mdi mdi-flask text-[17px] text-[#EF6C00]" />
                                <p className="text-[12px] text-[#8A5A05]">{tr("hub.sampleTagLong")}</p>
                            </div>
                        )}

                        {/* identity block */}
                        <div className="px-6 py-5 bg-white border-b border-[#E0E0E0] flex items-start gap-4 shrink-0">
                            <Avatar name={viewing.full_name} src={viewing.avatar_url} size={72} />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-[19px] font-extrabold tracking-[-0.3px] text-[#212121]">{viewing.full_name}</h3>
                                <div className="flex flex-col gap-1 mt-1.5">
                                    {viewing.headline && <Line icon="work">{viewing.headline}</Line>}
                                    {viewing.location && <Line icon="location_on">{viewing.location}</Line>}
                                    {viewing.email && <Line icon="mail" tone="text-[#2E7D32]">{viewing.email}</Line>}
                                </div>
                                {viewing.profile_url && (
                                    <a href={viewing.profile_url} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1 mt-2 text-[12.5px] font-semibold text-[#1976D2] hover:text-[#1565C0]">
                                        <i className="mdi mdi-open-in-new text-[16px]" />
                                        {tr("hub.openProfile")}
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <IconAction icon="person_add" label={tr("hub.createCandidate")}
                                            disabled={!!imported[keyOf(viewing)] || busy === keyOf(viewing)}
                                            onClick={() => void importMany([viewing])} />
                                <IconAction icon="work" label={imported[keyOf(viewing)] ? tr("hub.addToJob") : tr("hub.importFirst")}
                                            disabled={!imported[keyOf(viewing)]}
                                            onClick={() => { setJobPicker([viewing]); setJobQuery(""); }} />
                                <IconAction icon="create_new_folder" label={tr("hub.addToFolder")}
                                            onClick={() => { setFolderPicker([viewing]); setFolderQuery(""); }} />
                            </div>
                        </div>

                        {/* the three panels */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {viewing.ai_summary && (
                                <div className="rounded-[4px] border border-[#BBDEFB] bg-[#E3F2FD] p-4 mb-4">
                                    <p className="text-[10.5px] font-bold text-[#1976D2] uppercase tracking-[0.5px] mb-1">{tr("hub.summary")}</p>
                                    <p className="text-[13px] text-[#424242] leading-relaxed">{viewing.ai_summary}</p>
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-4 items-start">
                                <div className="flex flex-col gap-4">
                                    <Panel title={tr("hub.education")}>
                                        {viewing.education?.length ? (
                                            <div className="divide-y divide-[#EEEEEE]">
                                                {viewing.education.map((e, n) => (
                                                    <HistoryItem key={n} title={e.school || e.degree || "—"}
                                                                 subtitle={[e.degree, e.field].filter(Boolean).join(", ") || undefined}
                                                                 meta={e.years} />
                                                ))}
                                            </div>
                                        ) : <NoData text={tr("hub.noData")} />}
                                    </Panel>

                                    <Panel title={tr("hub.skills")}>
                                        {viewing.skills?.length ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {viewing.skills.map((s) => (
                                                    <span key={s} className="text-[12px] font-semibold px-2.5 py-1 rounded-[4px] bg-[#E3F2FD] text-[#1565C0]">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : <NoData text={tr("hub.noData")} />}
                                    </Panel>
                                </div>

                                <Panel title={tr("hub.experienceHistory")}>
                                    {viewing.experience?.length ? (
                                        <div className="divide-y divide-[#EEEEEE]">
                                            {viewing.experience.map((e, n) => (
                                                <HistoryItem key={n} title={e.title || "—"} subtitle={e.company} meta={e.years} />
                                            ))}
                                        </div>
                                    ) : viewing.headline || viewing.company ? (
                                        // Nothing structured came back, but the headline is a current role and
                                        // saying so beats an empty card that implies no history exists.
                                        <>
                                            <HistoryItem title={viewing.headline || tr("hub.currentRole")} subtitle={viewing.company || undefined} />
                                            <p className="text-[11.5px] text-[#9E9E9E] mt-2 pt-2 border-t border-[#EEEEEE]">
                                                {tr("hub.historyFromHeadline")}
                                            </p>
                                        </>
                                    ) : <NoData text={tr("hub.noData")} />}
                                </Panel>
                            </div>
                        </div>

                        {/* sticky action bar */}
                        <div className="shrink-0 bg-white border-t border-[#E0E0E0] px-5 py-3 flex items-center gap-2 flex-wrap">
                            <IconAction icon="chevron_left" label={tr("hub.previous")}
                                        disabled={drawerAt === null || drawerAt <= 0}
                                        onClick={() => setDrawerAt((i) => (i === null ? i : i - 1))} />
                            <IconAction icon="chevron_right" label={tr("hub.next")}
                                        disabled={drawerAt === null || drawerAt >= results.length - 1}
                                        onClick={() => setDrawerAt((i) => (i === null ? i : i + 1))} />
                            <span className="text-[12px] text-[#9E9E9E] mr-1 tabular-nums">
                                {(drawerAt ?? 0) + 1} / {results.length}
                            </span>

                            <Button size="sm" icon="person_add"
                                    disabled={!!imported[keyOf(viewing)] || busy === keyOf(viewing)}
                                    onClick={() => void importMany([viewing])}>
                                {imported[keyOf(viewing)] ? tr("hub.imported") : tr("hub.createCandidate")}
                            </Button>
                            {/* Disabled until imported — their rule, and the right one. */}
                            <Button size="sm" variant="secondary" icon="work"
                                    disabled={!imported[keyOf(viewing)]}
                                    title={imported[keyOf(viewing)] ? undefined : tr("hub.importFirst")}
                                    onClick={() => { setJobPicker([viewing]); setJobQuery(""); }}>
                                {tr("hub.addToJob")}
                            </Button>
                            <Button size="sm" variant="secondary" icon="create_new_folder"
                                    onClick={() => { setFolderPicker([viewing]); setFolderQuery(""); }}>
                                {tr("hub.addToFolder")}
                            </Button>
                            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setDrawerAt(null)}>
                                {tr("hub.close")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── add to job ───────────────────────────────────────────────────── */}
            {jobPicker && (
                <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={() => setJobPicker(null)}>
                    <div className="absolute inset-0 bg-[#212121]/45" />
                    <div role="presentation" className="relative w-full max-w-[520px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                         onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-[#E0E0E0] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-[16px] font-bold text-[#212121]">{tr("hub.addToJob")}</h3>
                                <p className="text-[12px] text-[#757575] truncate">
                                    {jobPicker.length === 1 ? jobPicker[0].full_name : tr("hub.nSelected", { count: jobPicker.length })}
                                </p>
                            </div>
                            <IconAction icon="close" label={tr("hub.close")} onClick={() => setJobPicker(null)} />
                        </div>

                        <div className="p-5 flex flex-col gap-3">
                            <label className="flex items-center gap-2 text-[12.5px] text-[#4F4F4F]">
                                {tr("hub.searchByStatus")}
                                <select
                                    value={jobStatus}
                                    onChange={(e) => setJobStatus(e.target.value)}
                                    className="h-8 px-2 rounded-[4px] border border-[#E0E0E0] bg-white text-[12.5px] font-semibold text-[#212121] outline-none focus:border-[#1976D2]"
                                >
                                    <option value="ALL">{tr("hub.all")}</option>
                                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>

                            <div className="relative">
                                <i className="mdi mdi-magnify text-[18px] text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input className={cn(INPUT, "pl-9")} value={jobQuery} placeholder={tr("hub.searchJobs")}
                                       onChange={(e) => setJobQuery(e.target.value)} />
                            </div>

                            <p className="text-[12px] text-[#757575]">{tr("hub.jobCount", { count: shownJobs.length })}</p>

                            <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 divide-y divide-[#EEEEEE]">
                                {shownJobs.map((j) => (
                                    <button
                                        key={j.id}
                                        type="button"
                                        disabled={!!busy}
                                        onClick={() => void importMany(jobPicker, j.id)}
                                        className="w-full py-2.5 px-1 flex items-center gap-3 text-left rounded-[4px] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                                    >
                                        <Avatar name={j.title} size={34} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13.5px] font-semibold text-[#212121] truncate">{j.title}</span>
                                            {j.department && <span className="block text-[12px] text-[#757575] truncate">{j.department}</span>}
                                        </span>
                                        {j.status && <span className="w-2 h-2 rounded-full bg-[#1976D2] shrink-0" title={j.status} />}
                                        <i className="mdi mdi-plus text-[20px] text-[#1976D2]" />
                                    </button>
                                ))}
                                {shownJobs.length === 0 && (
                                    <p className="py-8 text-center text-[12.5px] text-[#757575]">{tr("hub.noJobs")}</p>
                                )}
                            </div>

                            {/* Adding does not tell them. Say it where the decision is made. */}
                            <p className="text-[11.5px] text-[#757575] leading-relaxed border-t border-[#EEEEEE] pt-3">
                                {tr("hub.noNotify")}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── add to folder ────────────────────────────────────────────────── */}
            {folderPicker && (
                <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={() => setFolderPicker(null)}>
                    <div className="absolute inset-0 bg-[#212121]/45" />
                    <div role="presentation" className="relative w-full max-w-[520px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                         onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-[#E0E0E0] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-[16px] font-bold text-[#212121]">{tr("hub.addToFolder")}</h3>
                                <p className="text-[12px] text-[#757575] truncate">
                                    {folderPicker.length === 1 ? folderPicker[0].full_name : tr("hub.nSelected", { count: folderPicker.length })}
                                </p>
                            </div>
                            <IconAction icon="close" label={tr("hub.close")} onClick={() => setFolderPicker(null)} />
                        </div>

                        <div className="p-5 flex flex-col gap-3">
                            {/* Create-and-file in one step: leaving the hub to make a folder would lose
                                the search, which is the only reason the recruiter is on this screen. */}
                            <div className="flex gap-2">
                                <input
                                    className={cn(INPUT, "flex-1")}
                                    value={newFolder}
                                    placeholder={tr("hub.newFolderPlaceholder")}
                                    onChange={(e) => setNewFolder(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && newFolder.trim()) void createFolderAndAdd(folderPicker); }}
                                />
                                <Button size="sm" icon="add" disabled={!newFolder.trim() || !!busy}
                                        onClick={() => void createFolderAndAdd(folderPicker)}>
                                    {tr("hub.createAndAdd")}
                                </Button>
                            </div>

                            <div className="relative">
                                <i className="mdi mdi-magnify text-[18px] text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input className={cn(INPUT, "pl-9")} value={folderQuery} placeholder={tr("hub.searchFolders")}
                                       onChange={(e) => setFolderQuery(e.target.value)} />
                            </div>

                            <p className="text-[12px] text-[#757575]">{tr("hub.folderCount", { count: shownFolders.length })}</p>

                            <div className="max-h-[280px] overflow-y-auto -mx-1 px-1 divide-y divide-[#EEEEEE]">
                                {shownFolders.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        disabled={!!busy}
                                        onClick={() => void importMany(folderPicker, undefined, f.id)}
                                        className="w-full py-2.5 px-1 flex items-center gap-3 text-left rounded-[4px] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                                    >
                                        <span className="w-9 h-9 shrink-0 rounded-full bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center">
                                            <i className="mdi mdi-folder text-[19px]" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13.5px] font-semibold text-[#212121] truncate">{f.name}</span>
                                            <span className="block text-[12px] text-[#757575]">
                                                {tr("hub.folderCandidates", { count: f.candidate_count })}
                                            </span>
                                        </span>
                                        <i className="mdi mdi-plus text-[20px] text-[#1976D2]" />
                                    </button>
                                ))}
                                {shownFolders.length === 0 && (
                                    <p className="py-8 text-center text-[12.5px] text-[#757575]">{tr("hub.noFolders")}</p>
                                )}
                            </div>

                            {/* The distinction that makes folders safe to use. */}
                            <p className="text-[11.5px] text-[#757575] leading-relaxed border-t border-[#EEEEEE] pt-3">
                                {tr("hub.folderNote")}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── where the data comes from ────────────────────────────────────── */}
            {provenance && (
                <div role="presentation" className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={() => setProvenance(false)}>
                    <div className="absolute inset-0 bg-[#212121]/45" />
                    <div role="presentation" className="relative w-full max-w-[480px] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] p-6"
                         onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-[17px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("hub.whereFrom")}</h3>
                        <p className="text-[13px] text-[#4F4F4F] leading-relaxed">{tr("hub.whereFromBody")}</p>
                        <div className="flex justify-end mt-5">
                            <Button size="sm" variant="secondary" onClick={() => setProvenance(false)}>{tr("hub.close")}</Button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[4px] bg-[#212121] text-white text-[12.5px] font-semibold shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
                    {toast}
                </div>
            )}
        </div>
    );
}
