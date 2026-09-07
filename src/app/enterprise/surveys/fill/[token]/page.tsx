"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Button, Card, Badge, Field, Textarea, CroarLogo, CroarMark, jetbrainsMono } from "@/components/ds";

interface Question {
    id: string;
    text: string;
    type: "RATING" | "TEXT" | "MCQ";
    scale_min: number;
    scale_max: number;
    options?: string;
}

interface Invite {
    instance: {
        name: string;
        template: {
            description: string;
            survey_type: {
                name: string;
            };
            questions: Question[];
        };
    };
}

interface Response {
    question_id: string;
    answer_value: number | null;
    answer_text: string;
}

const safeOptions = (v: string | undefined | null): string[] => {
    try {
        const a = JSON.parse(v || "[]");
        return Array.isArray(a) ? a : [];
    } catch {
        return [];
    }
};

export default function FillSurvey({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const { t: tr } = useI18n();
    const router = useRouter();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [responses, setResponses] = useState<Response[]>([]);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await apiClient.get(`/api/v1/enterprise/surveys/invite/${token}`);
                if (res.ok) {
                    const data = await res.json();
                    setInvite(data);
                    // Initialize responses
                    setResponses(data.instance.template.questions.map((q: Question) => ({
                        question_id: q.id,
                        answer_value: q.type === 'RATING' ? 3 : null,
                        answer_text: ""
                    })));
                } else {
                    router.push('/404');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvite();
    }, [token, router]);

    const updateResponse = (idx: number, field: keyof Response, value: string | number | null) => {
        setResponses(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiClient.post(`/api/v1/enterprise/surveys/submit/${token}`, { responses });
            if (res.ok) {
                setCompleted(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[#F5F6F8]">
            <div className="flex flex-col items-center gap-5">
                <div className="w-12 h-12 border-[3px] border-[#1976D2] border-t-transparent rounded-full animate-spin" />
                <p className="text-[12px] font-semibold text-[#757575]">{tr("surveysExt.loadingSurvey")}</p>
            </div>
        </div>
    );

    if (completed) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-4 py-8">
            <div className="w-full max-w-[480px] space-y-5 animate-in fade-in zoom-in-95 duration-500">
                <Card padding="lg" className="text-center">
                    <div className="w-16 h-16 rounded-[4px] bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto mb-6">
                        <i className="mdi mdi-check-decagram text-[34px]" />
                    </div>
                    <h1 className="text-[24px] font-extrabold text-[#212121] tracking-[-0.3px] mb-2">{tr("surveysExt.thankYou")}</h1>
                    <p className="text-[14px] text-[#424242] leading-relaxed">
                        {tr("surveysExt.feedbackRecorded")}
                    </p>
                </Card>

                <Card padding="lg" className="space-y-4">
                    <div className="flex items-center gap-3">
                        <CroarMark size={40} />
                        <div>
                            <h3 className="text-[14px] font-bold text-[#212121]">{tr("surveysExt.neuralCoachingLab")}</h3>
                            <p className="text-[12px] text-[#757575]">{tr("surveysExt.behavioralIntelligence")}</p>
                        </div>
                    </div>
                    <p className="text-[13px] text-[#424242] leading-relaxed">
                        {tr("surveysExt.neuralCoachingDesc")}
                    </p>
                    <Button
                        type="button"
                        fullWidth
                        icon="play_circle"
                        onClick={() => router.push('/enterprise/ai-training/portal')}
                    >
                        {tr("surveysExt.engageSimulation")}
                    </Button>
                </Card>

                <div className="text-center">
                    <Button type="button" variant="ghost" size="sm" icon="close" onClick={() => window.close()}>
                        {tr("surveysExt.closePortal")}
                    </Button>
                </div>
            </div>
        </div>
    );

    const questions = invite?.instance.template.questions ?? [];

    return (
        <div className="min-h-screen bg-[#F5F6F8]">
            <div className="max-w-[720px] mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
                {/* Brand */}
                <div className="flex justify-center">
                    <CroarLogo size={32} />
                </div>

                {/* Intro */}
                <Card padding="lg" className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <Badge tone="indigo">{invite?.instance.template.survey_type.name}</Badge>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#757575]">
                            <i className="mdi mdi-lock text-[15px]" />
                            {tr("surveysExt.confidential")}
                        </span>
                    </div>
                    <h1 className="text-[26px] leading-tight font-extrabold text-[#212121] tracking-[-0.4px]">
                        {invite?.instance.name}
                    </h1>
                    <p className="text-[14px] text-[#424242] leading-relaxed">
                        {invite?.instance.template.description || tr("surveysExt.everyVoiceMatters")}
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[#757575] leading-relaxed">
                        <i className="mdi mdi-information text-[16px]" />
                        {tr("surveysExt.answerAllConfidential")}
                    </p>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {questions.map((q: Question, i: number) => (
                        <Card key={q.id} padding="lg" className="space-y-6">
                            <div className="flex gap-3.5 items-start">
                                <span className={`${jetbrainsMono.className} w-8 h-8 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] text-[13px] font-semibold flex items-center justify-center shrink-0`}>
                                    {i + 1}
                                </span>
                                <div className="pt-1 space-y-1">
                                    <h2 className="text-[16px] font-bold text-[#212121] leading-snug">{q.text}</h2>
                                    <p className="text-[12px] text-[#757575]">
                                        {q.type === 'MCQ'
                                            ? tr("surveysExt.selectOneOption")
                                            : q.type === 'RATING'
                                                ? (q.scale_min != null && q.scale_max != null
                                                    ? tr("surveysExt.rateFromTo", { min: q.scale_min, max: q.scale_max })
                                                    : tr("surveysExt.rateOnScale"))
                                                : tr("surveysExt.typeYourResponse")}
                                    </p>
                                </div>
                            </div>

                            {q.type === 'RATING' && (
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-semibold text-[#757575]">{tr("surveysExt.leastAgree")}</span>
                                        <div className={`${jetbrainsMono.className} text-[32px] font-bold text-[#1976D2] leading-none`}>
                                            {responses[i]?.answer_value}
                                        </div>
                                        <span className="text-[11px] font-semibold text-[#757575]">{tr("surveysExt.fullyAgree")}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min={q.scale_min}
                                            max={q.scale_max}
                                            step="1"
                                            className="w-full h-2 bg-[#E0E0E0] rounded-full appearance-none cursor-pointer accent-[#1976D2] outline-none"
                                            value={responses[i]?.answer_value || 3}
                                            onChange={(e) => updateResponse(i, "answer_value", Number.parseInt(e.target.value))}
                                        />
                                        <div className="flex justify-between mt-3 px-0.5">
                                            {[...new Array(q.scale_max - q.scale_min + 1)].map((_, idx) => (
                                                <div key={idx} className={`w-1 rounded-full transition-all ${responses[i]?.answer_value === idx + q.scale_min ? 'h-4 bg-[#1976D2]' : 'h-3 bg-[#E0E0E0]'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {q.type === 'MCQ' && (
                                <div className="grid grid-cols-1 gap-2.5">
                                    {safeOptions(q.options).map((opt: string, optIdx: number) => (
                                        <button
                                            key={optIdx}
                                            type="button"
                                            onClick={() => updateResponse(i, "answer_value", optIdx)}
                                            className={`w-full p-4 rounded-[4px] text-left font-medium text-[14px] transition-all flex items-center justify-between border ${responses[i]?.answer_value === optIdx ? 'border-[#1976D2] bg-[#E3F2FD] text-[#1976D2]' : 'border-[#E0E0E0] bg-white text-[#424242] hover:border-[#90CAF9]'}`}
                                        >
                                            {opt}
                                            {responses[i]?.answer_value === optIdx && (
                                                <i className="mdi mdi-check-circle text-[20px]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'TEXT' && (
                                <Field>
                                    <Textarea
                                        className="min-h-[120px]"
                                        value={responses[i]?.answer_text || ""}
                                        onChange={(e) => updateResponse(i, "answer_text", e.target.value)}
                                        placeholder={tr("surveysExt.shareThoughts")}
                                    />
                                </Field>
                            )}
                        </Card>
                    ))}

                    <div className="pt-2 flex flex-col items-center gap-4">
                        <Button
                            type="submit"
                            size="lg"
                            fullWidth
                            disabled={submitting}
                            icon={submitting ? undefined : "send"}
                        >
                            {submitting ? tr("surveysExt.submitting") : tr("surveysExt.completeEntry")}
                        </Button>
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#757575]">
                            <i className="mdi mdi-lock text-[15px]" />
                            {tr("surveysExt.encryptedSubmission")}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
