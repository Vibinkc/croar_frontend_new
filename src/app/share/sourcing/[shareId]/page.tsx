"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles, ExternalLink, Bookmark, ArrowRight, ThumbsUp, Loader2 } from "@/components/icons";
import { API_BASE_URL } from "@/lib/api-config";
import { useI18n } from "@/context/I18nContext";

interface ShareProfile {
    full_name?: string;
    headline?: string;
    company?: string;
    location?: string;
    profile_url?: string;
    platform?: string;
    ai_summary?: string;
    skills?: string[];
    [key: string]: unknown;
}

interface SharedSearch {
    brand?: string;
    query?: string;
    title?: string;
    criteria?: string[];
    created_at?: string;
    profiles?: ShareProfile[];
}

// Minimal, self-contained criterion check so the public page can show the same 👍 signals.
const criterionLabel = (c: string) => (c || "").trim();
const passesCriterion = (p: ShareProfile, c: string) => {
    const k = criterionLabel(c).toLowerCase().replace(/\.js$/, "");
    if (!k) return false;
    const skills = (p.skills || []).map((s) => (s || "").toLowerCase());
    if (skills.some((s) => s.includes(k))) return true;
    return [p.headline, p.ai_summary, p.company].filter(Boolean).join(" ").toLowerCase().includes(k);
};

export default function SharedSourcingPage() {
    const { t } = useI18n();
    const params = useParams();
    const shareId = String(params?.shareId || "");
    const [data, setData] = useState<SharedSearch | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGate, setShowGate] = useState(false);

    useEffect(() => {
        if (!shareId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/enterprise/sourcing/chat/share/${shareId}`);
                if (!res.ok) throw new Error("not found");
                setData(await res.json());
            } catch {
                setError(t("candidate.sharedSearchNotExist"));
            } finally {
                setLoading(false);
            }
        })();
    }, [shareId]);

    const createdOn = useMemo(() => {
        if (!data?.created_at) return null;
        const d = new Date(data.created_at);
        return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }, [data?.created_at]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <Loader2 className="w-6 h-6 text-[#1976D2] animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-center px-6">
                <div className="w-12 h-12 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center mb-3"><Sparkles className="w-6 h-6" /></div>
                <h1 className="text-[18px] font-bold text-[#212121]">{t("candidate.sharedSearchUnavailable")}</h1>
                <p className="text-[13px] text-[#757575] mt-1 max-w-sm">{error || t("candidate.couldntLoad")}</p>
                <a href="/" className="mt-5 px-5 h-10 inline-flex items-center rounded-[4px] bg-[#1976D2] text-white text-[13px] font-bold hover:bg-[#1565C0] transition-colors">{t("candidate.goToCroar")}</a>
            </div>
        );
    }

    const profiles = data.profiles || [];
    const criteria = data.criteria || [];

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-[4px] bg-[#212121] text-white flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                            <h1 className="text-[20px] font-extrabold text-[#212121] tracking-[-0.4px]">{t("candidate.aiSourcing")} <span className="text-[#1976D2]">{t("candidate.byBrand", { brand: data.brand || "Croar" })}</span></h1>
                        </div>
                        {createdOn && <p className="text-[12.5px] text-[#757575] mt-1">{t("candidate.createdOnDate", { date: createdOn })}</p>}
                    </div>
                    <button
                        onClick={() => setShowGate(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-bold hover:bg-[#1565C0] transition-colors"
                    >
                        {t("candidate.editSearch")} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Query bubble */}
                <div className="flex items-start gap-3 mt-6">
                    <div className="w-9 h-9 rounded-full bg-[#E0E0E0] shrink-0" />
                    <div className="flex-1 bg-white border border-[#E0E0E0] rounded-[4px] px-5 py-4 shadow-sm">
                        <p className="text-[14px] text-[#263238]">{data.query || data.title}</p>
                    </div>
                </div>

                {/* Results */}
                <h2 className="text-[16px] font-bold text-[#212121] mt-8 mb-3">{t("candidate.searchResults")}</h2>
                <div className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-hidden">
                    {profiles.length === 0 ? (
                        <p className="text-[13px] text-[#757575] text-center py-12">{t("candidate.noProfiles")}</p>
                    ) : (
                        profiles.map((p, i) => (
                            <div key={i} className="p-6 border-b border-[#E0E0E0] last:border-b-0 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[15px] font-bold text-[#212121]">{p.full_name || t("candidate.candidateFallback")}</h3>
                                            {p.profile_url && (
                                                <a href={p.profile_url} target="_blank" rel="noreferrer" className="text-[#1976D2] hover:text-[#1565C0]"><ExternalLink className="w-4 h-4" /></a>
                                            )}
                                        </div>
                                        <p className="text-[12.5px] font-semibold text-[#4F4F4F]">
                                            {p.headline || t("candidate.professional")}{p.company ? t("candidate.atCompany", { company: p.company }) : ""}{p.location ? ` · ${p.location}` : ""}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowGate(true)}
                                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] border border-[#E0E0E0] bg-white text-[#263238] text-[12px] font-bold hover:bg-[#FAFAFA] transition-colors"
                                    >
                                        <Bookmark className="w-4 h-4 text-[#9E9E9E]" /> {t("candidate.shortlist")}
                                    </button>
                                </div>

                                {criteria.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {criteria.map((c, ci) => {
                                            const pass = passesCriterion(p, c);
                                            return (
                                                <span key={ci} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${pass ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#EEEEEE] text-[#9E9E9E]"}`}>
                                                    {pass ? <ThumbsUp className="w-3 h-3" /> : <span className="text-[13px] leading-none">–</span>}
                                                    {criterionLabel(c)}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {p.ai_summary && (
                                    <div className="flex items-start gap-2.5 text-[12.5px] text-[#4F4F4F] leading-relaxed">
                                        <Sparkles className="w-4 h-4 text-[#1976D2] mt-0.5 shrink-0" />
                                        <p>{p.ai_summary}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <p className="text-center text-[11.5px] text-[#9E9E9E] mt-6">{t("candidate.sharedFooter", { brand: data.brand || "Croar" })}</p>
            </div>

            {/* Account gate */}
            {showGate && (
                <div className="fixed inset-0 bg-[#212121]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowGate(false)}>
                    <div className="bg-white p-6 rounded-[4px] border border-[#E0E0E0] shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-[17px] font-bold text-[#212121]">{t("candidate.createCroarAccount")}</h3>
                        <p className="text-[13.5px] text-[#616161] -mt-1">{t("candidate.gateDescription")}</p>
                        <div className="flex items-center justify-end gap-2.5">
                            <a href="/enterprise/login" className="h-10 px-4 inline-flex items-center rounded-[4px] border border-[#E0E0E0] bg-white text-[#424242] text-[13px] font-semibold hover:bg-[#FAFAFA] transition-colors">{t("candidate.createAccount")}</a>
                            <a href="/enterprise/sourcing/chat" className="h-10 px-4 inline-flex items-center gap-1.5 rounded-[4px] bg-[#1976D2] text-white text-[13px] font-bold hover:bg-[#1565C0] transition-colors">{t("candidate.copyAndEditSearch")} <ArrowRight className="w-4 h-4" /></a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
