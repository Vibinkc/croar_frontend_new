"use client";

/**
 * Advanced Search — Manatal's Candidates › Advanced Search, on Croar's kit.
 *
 * The counterpart to the Sourcing Hub, and deliberately a separate screen. The hub asks "who
 * else is out there?" and answers from a live web search, where the filters become one phrase
 * and matching is fuzzy. This asks "who do we already know?" and answers from your own
 * database, where every filter is a real column and matching is exact.
 *
 * The rail says so on each control that behaves differently from its twin in the hub — an
 * identical-looking filter that means something else is the trap worth designing out.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, EmptyState, PageHeader, cn, Icon } from "@/components/ds";

interface Result {
    id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    skills?: string[];
    source_platform?: string | null;
    total_experience?: number | null;
    headline?: string | null;
    location?: string | null;
    company?: string | null;
}

interface Folder {
    id: string;
    name: string;
    candidate_count: number;
}

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

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
    const [bg, fg] = toneFor(name);
    return (
        <span
            className="shrink-0 rounded-full flex items-center justify-center font-bold"
            style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.36) }}
        >
            {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
    );
}

const INPUT =
    "w-full h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="border-b border-[#E0E0E0] last:border-b-0 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2.5">
                <Icon name={icon} className="text-[18px] text-[#9E9E9E]" />
                <span className="text-[13px] font-semibold text-[#212121]">{title}</span>
            </div>
            <div className="flex flex-col gap-2">{children}</div>
        </div>
    );
}

export default function AdvancedSearchPage() {
    const { t: tr } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillDraft, setSkillDraft] = useState("");
    const [matchAll, setMatchAll] = useState(false);
    const [location, setLocation] = useState("");
    const [company, setCompany] = useState("");
    const [source, setSource] = useState("");
    const [folderId, setFolderId] = useState("");
    const [hasEmail, setHasEmail] = useState<"any" | "yes" | "no">("any");
    const [yearsMin, setYearsMin] = useState("");
    const [yearsMax, setYearsMax] = useState("");

    const [sources, setSources] = useState<string[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searched, setSearched] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const PAGE_SIZE = 25;

    const pendingSkills = skillDraft.trim() ? [...skills, skillDraft.trim()] : skills;

    const loadFacets = useCallback(async () => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [f, d] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/search/facets`, { headers }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/folders`, { headers }),
            ]);
            if (f.ok) setSources((await f.json()).sources || []);
            if (d.ok) setFolders(await d.json());
        } catch {
            /* the dropdowns fall back to their "any" option */
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && token) void loadFacets();
    }, [authLoading, token, loadFacets]);

    const run = async (goToPage = 1) => {
        if (!token) return;
        setSearching(true);
        setError("");
        try {
            setSkills(pendingSkills);
            setSkillDraft("");

            const p = new URLSearchParams();
            if (name.trim()) p.set("name", name.trim());
            if (email.trim()) p.set("email", email.trim());
            pendingSkills.forEach((s) => p.append("skills", s));
            if (matchAll) p.set("match_all_skills", "true");
            if (location.trim()) p.set("location", location.trim());
            if (company.trim()) p.set("company", company.trim());
            if (source) p.set("source", source);
            if (folderId) p.set("folder_id", folderId);
            if (hasEmail !== "any") p.set("has_email", hasEmail === "yes" ? "true" : "false");
            if (yearsMin) p.set("years_min", yearsMin);
            if (yearsMax) p.set("years_max", yearsMax);
            p.set("page", String(goToPage));
            p.set("page_size", String(PAGE_SIZE));

            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/candidates/search?${p}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                setError(typeof data.detail === "string" ? data.detail : tr("advSearch.failed"));
                setResults([]);
                setSearched(false);
                return;
            }
            setResults(data.results || []);
            setTotal(data.total || 0);
            setPage(goToPage);
            setSearched(true);
        } catch {
            setError(tr("advSearch.failed"));
        } finally {
            setSearching(false);
        }
    };

    const clearAll = () => {
        setName(""); setEmail(""); setSkills([]); setSkillDraft(""); setMatchAll(false);
        setLocation(""); setCompany(""); setSource(""); setFolderId("");
        setHasEmail("any"); setYearsMin(""); setYearsMax("");
    };

    const addSkill = () => {
        const v = skillDraft.trim();
        if (v && !skills.includes(v)) setSkills([...skills, v]);
        setSkillDraft("");
    };

    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={tr("advSearch.title")}
                    subtitle={tr("advSearch.subtitle")}
                    icon="search"
                />
            </div>

            <div className="flex-1 flex gap-4 px-6 py-4 min-h-0">
                {/* ── filter rail ──────────────────────────────────────────────── */}
                <aside className="w-[300px] shrink-0 hidden lg:flex flex-col rounded-[4px] border border-[#E0E0E0] bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#212121]">{tr("advSearch.filters")}</span>
                        <button type="button" onClick={clearAll} className="text-[12.5px] font-semibold text-[#1976D2] hover:text-[#1565C0]">
                            {tr("advSearch.clearAll")}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <Section title={tr("advSearch.nameEmail")} icon="person">
                            <input className={INPUT} value={name} placeholder={tr("advSearch.namePlaceholder")}
                                   onChange={(e) => setName(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === "Enter") void run(1); }} />
                            <input className={INPUT} value={email} placeholder={tr("advSearch.emailPlaceholder")}
                                   onChange={(e) => setEmail(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === "Enter") void run(1); }} />
                        </Section>

                        <Section title={tr("advSearch.skills")} icon="stars">
                            <input
                                className={INPUT}
                                value={skillDraft}
                                placeholder={tr("advSearch.skillPlaceholder")}
                                onChange={(e) => setSkillDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                                onBlur={addSkill}
                            />
                            {skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map((s) => (
                                        <span key={s} className="inline-flex items-center gap-1 text-[11.5px] font-semibold pl-2 pr-1 py-1 rounded-[4px] bg-[#E3F2FD] text-[#1565C0]">
                                            {s}
                                            <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                                                <i className="mdi mdi-close-circle text-[15px]" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* "React or Vue" and "React and Vue" are both real asks; guessing
                                between them would make half of all searches wrong. */}
                            {skills.length > 1 && (
                                <div className="flex rounded-[4px] border border-[#E0E0E0] overflow-hidden">
                                    {([["any", tr("advSearch.matchAny")], ["all", tr("advSearch.matchAll")]] as const).map(([k, label]) => (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => setMatchAll(k === "all")}
                                            className={cn(
                                                "flex-1 h-8 text-[12px] font-semibold transition-colors",
                                                (k === "all") === matchAll ? "bg-[#1976D2] text-white" : "bg-white text-[#4F4F4F] hover:bg-[#F5F6F8]"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section title={tr("advSearch.location")} icon="location_on">
                            <input className={INPUT} value={location} placeholder={tr("advSearch.locationPlaceholder")}
                                   onChange={(e) => setLocation(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === "Enter") void run(1); }} />
                        </Section>

                        <Section title={tr("advSearch.company")} icon="apartment">
                            <input className={INPUT} value={company} placeholder={tr("advSearch.companyPlaceholder")}
                                   onChange={(e) => setCompany(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === "Enter") void run(1); }} />
                        </Section>

                        <Section title={tr("advSearch.experience")} icon="badge">
                            <div className="flex gap-2 items-center">
                                <input className={INPUT} type="number" min={0} value={yearsMin}
                                       placeholder={tr("advSearch.min")} onChange={(e) => setYearsMin(e.target.value)} />
                                <span className="text-[#BDBDBD]">–</span>
                                <input className={INPUT} type="number" min={0} value={yearsMax}
                                       placeholder={tr("advSearch.max")} onChange={(e) => setYearsMax(e.target.value)} />
                            </div>
                            <p className="text-[11px] text-[#9E9E9E]">{tr("advSearch.experienceNote")}</p>
                        </Section>

                        <Section title={tr("advSearch.folder")} icon="folder">
                            <select className={INPUT} value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                                <option value="">{tr("advSearch.anyFolder")}</option>
                                {folders.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name} ({f.candidate_count})</option>
                                ))}
                            </select>
                        </Section>

                        <Section title={tr("advSearch.source")} icon="input">
                            <select className={INPUT} value={source} onChange={(e) => setSource(e.target.value)}>
                                <option value="">{tr("advSearch.anySource")}</option>
                                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Section>

                        <Section title={tr("advSearch.contactable")} icon="mail">
                            <select className={INPUT} value={hasEmail} onChange={(e) => setHasEmail(e.target.value as "any" | "yes" | "no")}>
                                <option value="any">{tr("advSearch.anyContact")}</option>
                                <option value="yes">{tr("advSearch.hasEmail")}</option>
                                <option value="no">{tr("advSearch.noEmail")}</option>
                            </select>
                        </Section>
                    </div>

                    <div className="p-3 border-t border-[#E0E0E0]">
                        <Button fullWidth icon={searching ? "progress_activity" : "search"}
                                onClick={() => void run(1)} disabled={searching}>
                            {searching ? tr("advSearch.searching") : tr("advSearch.search")}
                        </Button>
                        {/* No filters means everyone, which is a legitimate ask — say so rather
                            than disabling the button and leaving the reason unexplained. */}
                        <p className="text-[11px] text-[#757575] text-center mt-2">{tr("advSearch.noFiltersNote")}</p>
                    </div>
                </aside>

                {/* ── results ──────────────────────────────────────────────────── */}
                <main className="flex-1 min-w-0 rounded-[4px] border border-[#E0E0E0] bg-white flex flex-col overflow-hidden">
                    {error && (
                        <p className="m-4 text-[12.5px] text-[#C62828] bg-[#FFEBEE] rounded-[4px] px-3 py-2">{error}</p>
                    )}

                    {!searched && !searching ? (
                        <EmptyState icon="manage_search" title={tr("advSearch.emptyTitle")}
                                    description={tr("advSearch.emptyDesc")}
                                    action={<Button size="sm" icon="search" onClick={() => void run(1)}>{tr("advSearch.searchAll")}</Button>}
                                    className="flex-1" />
                    ) : searching ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between gap-3 flex-wrap">
                                <span className="text-[13px] font-semibold text-[#212121] tabular-nums">
                                    {tr("advSearch.rangeCount", {
                                        from: total ? (page - 1) * PAGE_SIZE + 1 : 0,
                                        to: Math.min(page * PAGE_SIZE, total),
                                        total,
                                    })}
                                </span>
                                {lastPage > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <Button size="sm" variant="secondary" icon="chevron_left"
                                                disabled={page <= 1} onClick={() => void run(page - 1)}>
                                            {tr("advSearch.prev")}
                                        </Button>
                                        <span className="text-[12px] text-[#9E9E9E] tabular-nums px-1">{page} / {lastPage}</span>
                                        <Button size="sm" variant="secondary" trailingIcon="chevron_right"
                                                disabled={page >= lastPage} onClick={() => void run(page + 1)}>
                                            {tr("advSearch.next")}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {results.length === 0 ? (
                                <EmptyState icon="search_off" tone="muted" title={tr("advSearch.noResults")}
                                            description={tr("advSearch.noResultsDesc")} className="flex-1" />
                            ) : (
                                <div className="flex-1 overflow-y-auto divide-y divide-[#EEEEEE]">
                                    {results.map((c) => {
                                        const label = c.full_name || tr("advSearch.unnamed");
                                        return (
                                            <div key={c.id} className="p-4 flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors">
                                                <Avatar name={label} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[14px] font-bold text-[#212121]">{label}</span>
                                                        {c.source_platform && <Badge tone="neutral">{c.source_platform}</Badge>}
                                                        {typeof c.total_experience === "number" && (
                                                            <Badge tone="indigo">{tr("advSearch.yearsExp", { count: c.total_experience })}</Badge>
                                                        )}
                                                    </div>
                                                    {c.headline && <p className="text-[12.5px] text-[#4F4F4F] mt-0.5">{c.headline}</p>}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-[#757575]">
                                                        {c.email ? (
                                                            <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-[#2E7D32] hover:underline">
                                                                <i className="mdi mdi-email text-[15px]" />{c.email}
                                                            </a>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[#EF6C00]">
                                                                <i className="mdi mdi-email-off text-[15px]" />{tr("advSearch.noEmailShort")}
                                                            </span>
                                                        )}
                                                        {c.location && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <i className="mdi mdi-map-marker text-[15px]" />{c.location}
                                                            </span>
                                                        )}
                                                        {c.company && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <i className="mdi mdi-office-building text-[15px]" />{c.company}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {c.skills && c.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {c.skills.slice(0, 10).map((s) => (
                                                                <span key={s} className="text-[11.5px] font-semibold px-2 py-0.5 rounded-[3px] bg-[#E3F2FD] text-[#1565C0]">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                            {c.skills.length > 10 && (
                                                                <span className="text-[11.5px] text-[#9E9E9E] self-center">+{c.skills.length - 10}</span>
                                                            )}
                                                        </div>
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
        </div>
    );
}
