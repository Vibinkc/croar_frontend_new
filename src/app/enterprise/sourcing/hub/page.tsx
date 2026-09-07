"use client";

/**
 * Sourcing Hub — Manatal's screen, on Croar's own sourcing.
 *
 * Filter rail on the left, results on the right, a profile slide-over, and the two-step import
 * their flow uses: Create as candidate, then Add to job. That order is theirs and it is right —
 * a search result is a stranger on the internet until someone decides otherwise, so Add to job
 * stays disabled until the profile has been imported.
 *
 * What runs underneath is different and the page says so. Manatal queries a licensed database
 * of ~700 million profiles and charges a credit per search. Croar composes the filters into a
 * web search: fewer results, current rather than warehoused, no credit. Pretending otherwise
 * would set an expectation the results cannot meet.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

interface Profile {
    full_name: string;
    headline?: string | null;
    location?: string | null;
    company?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    profile_url?: string | null;
    skills?: string[];
    ai_summary?: string | null;
}

interface Job {
    id: string;
    title: string;
    department?: string | null;
}

/** One filter section in the rail, collapsible like theirs. */
function Section({
    title, icon, open, onToggle, count, children,
}: {
    title: string; icon: string; open: boolean; onToggle: () => void;
    count?: number; children: React.ReactNode;
}) {
    return (
        <div className="border-b border-[#E8EAED] last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3.5 py-3 text-left hover:bg-[#FAFAFB] transition-colors"
            >
                <span className="material-symbols-rounded text-[18px] text-[#8A929E]">{icon}</span>
                <span className="flex-1 text-[13px] font-semibold text-[#15171C]">{title}</span>
                {count ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#5B53E0] text-white">{count}</span>
                ) : null}
                <span className={`material-symbols-rounded text-[18px] text-[#C3C7CE] transition-transform ${open ? "" : "-rotate-90"}`}>
                    expand_more
                </span>
            </button>
            {open && <div className="px-3.5 pb-3.5 flex flex-col gap-2">{children}</div>}
        </div>
    );
}

const INPUT =
    "w-full h-9 px-2.5 rounded-[8px] border border-[#E8EAED] bg-white text-[12.5px] text-[#15171C] placeholder:text-[#A8AEB8] focus:border-[#5B53E0]/50 outline-none";

/** A value added to a multi-value filter, removable — their chips. */
function Chips({ values, onRemove }: { values: string[]; onRemove: (v: string) => void }) {
    if (!values.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {values.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 rounded-[6px] bg-[#E4F5EF] text-[#0E8A6E]">
                    <span className="material-symbols-rounded text-[13px]">check_circle</span>
                    {v}
                    <button onClick={() => onRemove(v)} aria-label={`Remove ${v}`} className="hover:text-[#0A6B55]">
                        <span className="material-symbols-rounded text-[14px]">cancel</span>
                    </button>
                </span>
            ))}
        </div>
    );
}

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
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    const [viewing, setViewing] = useState<Profile | null>(null);
    const [imported, setImported] = useState<Record<string, string>>({}); // profile key -> candidate id
    const [busy, setBusy] = useState("");
    const [jobPicker, setJobPicker] = useState<Profile | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobQuery, setJobQuery] = useState("");
    const [toast, setToast] = useState("");

    const keyOf = (p: Profile) => p.profile_url || p.email || p.full_name;
    const canSearch = titles.length > 0 || skills.length > 0 || company.trim() !== "";

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

    useEffect(() => {
        if (!authLoading && token) void loadJobs();
    }, [authLoading, token, loadJobs]);

    const search = async () => {
        if (!token || !canSearch) return;
        setSearching(true);
        setError("");
        try {
            const p = new URLSearchParams();
            titles.forEach((t) => p.append("job_titles", t));
            skills.forEach((s) => p.append("skills", s));
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
                setError(typeof data.detail === "string" ? data.detail : tr("hub.searchFailed"));
                return;
            }
            setResults(data.results || []);
            setQuery(data.query || "");
            setSearched(true);
        } catch {
            setError(tr("hub.searchFailed"));
        } finally {
            setSearching(false);
        }
    };

    const importProfile = async (p: Profile, jobId?: string) => {
        if (!token) return;
        setBusy(keyOf(p));
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/sourcing/hub/import`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: p.full_name, email: p.email, headline: p.headline,
                    location: p.location, company: p.company, profile_url: p.profile_url,
                    avatar_url: p.avatar_url, skills: p.skills || [], ai_summary: p.ai_summary,
                    job_id: jobId || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setToast(typeof data.detail === "string" ? data.detail : tr("hub.importFailed"));
                return;
            }
            setImported((m) => ({ ...m, [keyOf(p)]: data.candidate_id }));
            setToast(
                jobId
                    ? (data.already_on_job ? tr("hub.alreadyOnJob") : tr("hub.addedToJob"))
                    : tr("hub.createdCandidate")
            );
            setJobPicker(null);
        } finally {
            setBusy("");
            window.setTimeout(() => setToast(""), 3200);
        }
    };

    const addChip = (draft: string, values: string[], set: (v: string[]) => void, clear: () => void) => {
        const v = draft.trim();
        if (v && !values.includes(v)) set([...values, v]);
        clear();
    };

    const shownJobs = jobs.filter((j) => j.title.toLowerCase().includes(jobQuery.trim().toLowerCase()));

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 pt-5 pb-3 flex items-baseline justify-between gap-4 flex-wrap">
                <h1 className="text-[22px] font-bold text-[#15171C]">{tr("hub.title")}</h1>
                <p className="text-[12px] text-[#8A929E]">{tr("hub.poweredBy")}</p>
            </div>

            <div className="flex-1 flex gap-4 px-6 pb-6 min-h-0">
                {/* ── filter rail ─────────────────────────────────────────────── */}
                <aside className="w-[280px] shrink-0 flex flex-col rounded-[12px] border border-[#E8EAED] bg-white overflow-hidden">
                    <div className="px-3.5 py-3 border-b border-[#E8EAED] flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#15171C]">{tr("hub.filters")}</span>
                        <button
                            onClick={() => {
                                setTitles([]); setSkills([]); setLocation(""); setCompany("");
                                setYearsMin(""); setYearsMax(""); setSchool(""); setDegree(""); setMajor("");
                            }}
                            className="text-[12px] font-semibold text-[#5B53E0] hover:text-[#4840C4]"
                        >
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
                            />
                            <Chips values={titles} onRemove={(v) => setTitles(titles.filter((x) => x !== v))} />
                        </Section>

                        <Section title={tr("hub.location")} icon="location_on"
                                 open={open.location} onToggle={() => setOpen((o) => ({ ...o, location: !o.location }))}>
                            <input className={INPUT} value={location} placeholder={tr("hub.enterLocation")}
                                   onChange={(e) => setLocation(e.target.value)} />
                            {/* Manatal has a radius here. A web search cannot be bounded by
                                kilometres the way a geocoded database can, so rather than a
                                control that does nothing, the reason is on the page. */}
                            <p className="text-[11px] text-[#8A929E] leading-relaxed">{tr("hub.noRadius")}</p>
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
                            />
                            <Chips values={skills} onRemove={(v) => setSkills(skills.filter((x) => x !== v))} />
                        </Section>

                        <Section title={tr("hub.experience")} icon="badge"
                                 open={!!open.years} onToggle={() => setOpen((o) => ({ ...o, years: !o.years }))}>
                            <div className="flex gap-2 items-center">
                                <input className={INPUT} type="number" min={0} value={yearsMin}
                                       placeholder={tr("hub.min")} onChange={(e) => setYearsMin(e.target.value)} />
                                <span className="text-[#A8AEB8]">–</span>
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

                    <div className="p-3 border-t border-[#E8EAED]">
                        <button
                            onClick={() => void search()}
                            disabled={!canSearch || searching}
                            className="w-full h-10 rounded-[10px] bg-[#5B53E0] text-white text-[13px] font-bold hover:bg-[#4A43C9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                        >
                            <span className={`material-symbols-rounded text-[18px] ${searching ? "animate-spin" : ""}`}>
                                {searching ? "progress_activity" : "search"}
                            </span>
                            {searching ? tr("hub.searching") : tr("hub.search")}
                        </button>
                        {!canSearch && <p className="text-[11px] text-[#8A929E] text-center mt-2">{tr("hub.needAFilter")}</p>}
                    </div>
                </aside>

                {/* ── results ─────────────────────────────────────────────────── */}
                <main className="flex-1 min-w-0 rounded-[12px] border border-[#E8EAED] bg-white flex flex-col overflow-hidden">
                    {error && (
                        <p className="m-4 text-[12.5px] text-[#C0383C] bg-[#FCE8E8] rounded-[8px] px-3 py-2">{error}</p>
                    )}

                    {!searched && !searching ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 gap-3">
                            <span className="material-symbols-rounded text-[44px] text-[#C3C7CE]">person_search</span>
                            <h2 className="text-[16px] font-bold text-[#15171C]">{tr("hub.emptyTitle")}</h2>
                            <p className="text-[13px] text-[#8A929E] max-w-[440px] leading-relaxed">{tr("hub.emptyDesc")}</p>
                        </div>
                    ) : searching ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-[#5B53E0]/30 border-t-[#5B53E0] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-[#E8EAED] flex items-baseline gap-3 flex-wrap">
                                <span className="text-[13px] font-bold text-[#15171C]">
                                    {tr("hub.resultCount", { count: results.length })}
                                </span>
                                {query && <span className="text-[11.5px] text-[#8A929E] font-mono">{query}</span>}
                            </div>

                            {results.length === 0 ? (
                                <p className="p-8 text-center text-[13px] text-[#8A929E]">{tr("hub.noResults")}</p>
                            ) : (
                                <div className="flex-1 overflow-y-auto divide-y divide-[#F0F0F1]">
                                    {results.map((p) => {
                                        const k = keyOf(p);
                                        const done = !!imported[k];
                                        return (
                                            <div key={k} className="p-4 flex items-start gap-3 hover:bg-[#FAFAFB] transition-colors">
                                                <span className="w-10 h-10 shrink-0 rounded-full bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center text-[14px] font-bold overflow-hidden">
                                                    {p.avatar_url ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover"
                                                             onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                                    ) : p.full_name.charAt(0)}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <button onClick={() => setViewing(p)} className="text-[14px] font-bold text-[#5B53E0] hover:text-[#4840C4] text-left">
                                                        {p.full_name}
                                                    </button>
                                                    {p.headline && <p className="text-[12.5px] text-[#374151]">{p.headline}</p>}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11.5px] text-[#8A929E]">
                                                        {p.location && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="material-symbols-rounded text-[14px]">location_on</span>{p.location}
                                                            </span>
                                                        )}
                                                        {p.company && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="material-symbols-rounded text-[14px]">apartment</span>{p.company}
                                                            </span>
                                                        )}
                                                        {/* Contact presence is the thing that decides whether this
                                                            person can be reached at all, so it is on the row. */}
                                                        <span className={`inline-flex items-center gap-1 ${p.email ? "text-[#0E8A6E]" : "text-[#B26B08]"}`}>
                                                            <span className="material-symbols-rounded text-[14px]">{p.email ? "mail" : "mail_off"}</span>
                                                            {p.email || tr("hub.noEmail")}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {done ? (
                                                        <>
                                                            <span className="text-[10px] font-bold px-2 py-1 rounded-[5px] uppercase tracking-wide bg-[#E4F5EF] text-[#0E8A6E]">
                                                                {tr("hub.imported")}
                                                            </span>
                                                            <button
                                                                onClick={() => { setJobPicker(p); setJobQuery(""); }}
                                                                className="h-8 px-3 rounded-[8px] border border-[#E8EAED] bg-white text-[12px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 hover:text-[#5B53E0] transition-colors"
                                                            >
                                                                {tr("hub.addToJob")}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => void importProfile(p)}
                                                            disabled={busy === k}
                                                            className="h-8 px-3 rounded-[8px] bg-[#5B53E0] text-white text-[12px] font-semibold hover:bg-[#4A43C9] transition-colors disabled:opacity-50"
                                                        >
                                                            {busy === k ? tr("hub.saving") : tr("hub.createCandidate")}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* ── profile slide-over ──────────────────────────────────────────── */}
            {viewing && (
                <div className="fixed inset-0 z-[200] flex justify-end" onClick={() => setViewing(null)}>
                    <div className="absolute inset-0 bg-[#15171C]/40" />
                    <div className="relative w-full max-w-[520px] h-full bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-start gap-3">
                            <span className="w-12 h-12 shrink-0 rounded-full bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center text-[17px] font-bold">
                                {viewing.full_name.charAt(0)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[17px] font-bold text-[#15171C]">{viewing.full_name}</h2>
                                {viewing.headline && <p className="text-[12.5px] text-[#8A929E]">{viewing.headline}</p>}
                            </div>
                            <button onClick={() => setViewing(null)} aria-label={tr("hub.close")} className="text-[#8A929E] hover:text-[#15171C]">
                                <span className="material-symbols-rounded text-[22px]">close</span>
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            {viewing.ai_summary && (
                                <div className="rounded-[10px] bg-[#F7F8FA] p-3">
                                    <p className="text-[10px] font-bold text-[#5B53E0] uppercase tracking-wider mb-1">{tr("hub.summary")}</p>
                                    <p className="text-[12.5px] text-[#374151] leading-relaxed">{viewing.ai_summary}</p>
                                </div>
                            )}
                            <dl className="grid grid-cols-[110px_1fr] gap-y-2 gap-x-3 text-[12.5px]">
                                {([
                                    [tr("hub.location"), viewing.location],
                                    [tr("hub.company"), viewing.company],
                                    [tr("hub.email"), viewing.email || tr("hub.noEmail")],
                                ] as [string, string | null | undefined][]).map(([k, v]) => (
                                    <div key={k} className="contents">
                                        <dt className="text-[#8A929E]">{k}</dt>
                                        <dd className="text-[#15171C] break-words">{v || "—"}</dd>
                                    </div>
                                ))}
                            </dl>
                            {viewing.skills && viewing.skills.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#8A929E] uppercase tracking-wider mb-1.5">{tr("hub.skills")}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {viewing.skills.map((s) => (
                                            <span key={s} className="text-[11.5px] font-semibold px-2 py-1 rounded-[6px] bg-[#F7F8FA] border border-[#E8EAED] text-[#4B5057]">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {viewing.profile_url && (
                                <a href={viewing.profile_url} target="_blank" rel="noopener noreferrer"
                                   className="text-[12.5px] font-semibold text-[#5B53E0] hover:text-[#4840C4]">
                                    {tr("hub.openProfile")}
                                </a>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-[#E8EAED] px-5 py-3 flex items-center gap-2">
                            <button
                                onClick={() => void importProfile(viewing)}
                                disabled={!!imported[keyOf(viewing)] || busy === keyOf(viewing)}
                                className="h-9 px-4 rounded-[9px] bg-[#5B53E0] text-white text-[12.5px] font-bold hover:bg-[#4A43C9] transition-colors disabled:opacity-40"
                            >
                                {imported[keyOf(viewing)] ? tr("hub.imported") : tr("hub.createCandidate")}
                            </button>
                            {/* Disabled until imported — their rule, and the right one: you cannot
                                put a search result on a job, only a candidate. */}
                            <button
                                onClick={() => { setJobPicker(viewing); setJobQuery(""); }}
                                disabled={!imported[keyOf(viewing)]}
                                title={imported[keyOf(viewing)] ? undefined : tr("hub.importFirst")}
                                className="h-9 px-4 rounded-[9px] border border-[#E8EAED] bg-white text-[12.5px] font-semibold text-[#374151] hover:border-[#5B53E0]/50 transition-colors disabled:opacity-40"
                            >
                                {tr("hub.addToJob")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── add-to-job picker ───────────────────────────────────────────── */}
            {jobPicker && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center px-4" onClick={() => setJobPicker(null)}>
                    <div className="absolute inset-0 bg-[#15171C]/40" />
                    <div className="relative w-full max-w-[440px] bg-white rounded-[14px] border border-[#E8EAED] shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-[#15171C]">{tr("hub.addToJob")}</h3>
                            <button onClick={() => setJobPicker(null)} aria-label={tr("hub.close")} className="text-[#8A929E] hover:text-[#15171C]">
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <input className={INPUT} value={jobQuery} placeholder={tr("hub.searchJobs")}
                                   onChange={(e) => setJobQuery(e.target.value)} />
                            <p className="text-[11.5px] text-[#8A929E]">{tr("hub.jobCount", { count: shownJobs.length })}</p>
                            <div className="max-h-[300px] overflow-y-auto divide-y divide-[#F0F0F1]">
                                {shownJobs.map((j) => (
                                    <button
                                        key={j.id}
                                        onClick={() => void importProfile(jobPicker, j.id)}
                                        className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-[#FAFAFB] transition-colors px-1"
                                    >
                                        <span className="w-8 h-8 shrink-0 rounded-full bg-[#E4F5EF] text-[#0E8A6E] flex items-center justify-center text-[12px] font-bold">
                                            {j.title.charAt(0)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-semibold text-[#15171C]">{j.title}</span>
                                            {j.department && <span className="block text-[11.5px] text-[#8A929E]">{j.department}</span>}
                                        </span>
                                        <span className="material-symbols-rounded text-[18px] text-[#5B53E0]">add_circle</span>
                                    </button>
                                ))}
                                {shownJobs.length === 0 && (
                                    <p className="py-6 text-center text-[12.5px] text-[#8A929E]">{tr("hub.noJobs")}</p>
                                )}
                            </div>
                            {/* Adding does not tell them. Say it here, where the decision is made. */}
                            <p className="text-[11px] text-[#8A929E] leading-relaxed border-t border-[#F0F0F1] pt-3">
                                {tr("hub.noNotify")}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-[10px] bg-[#15171C] text-white text-[12.5px] font-semibold shadow-lg">
                    {toast}
                </div>
            )}
        </div>
    );
}
