"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import {
    Button,
    Card,
    CardHeader,
    Input,
    Field,
    Badge,
    PageHeader,
    jetbrainsMono,
} from "@/components/ds";

interface Question {
    id: string;
    text: string;
    type: string;
    category: string;
}

interface Template {
    id: string;
    name: string;
    description?: string;
    questions?: {
        question: {
            id: string;
        };
    }[];
}

interface AIQuestion {
    text: string;
    type: string;
    category: string;
}

interface X360TemplateFormProps {
    mode: "create" | "edit";
    templateId?: string;
}

export default function X360TemplateForm({ mode, templateId }: X360TemplateFormProps) {
    const isEdit = mode === "edit";
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // AI Wizard State
    const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
    const [industryNature, setIndustryNature] = useState("");
    const [generatingAi, setGeneratingAi] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        question_ids: [] as string[]
    });

    useEffect(() => {
        if (isEdit) {
            const fetchData = async () => {
                try {
                    // 1. Fetch all questions
                    const qRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const qData = await qRes.json();
                    if (Array.isArray(qData)) setQuestions(qData);

                    // 2. Fetch existing template
                    const tRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/templates`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const tData = await tRes.json();
                    const currentTpl = tData.find((t: Template) => t.id === templateId);
                    if (currentTpl) {
                        setFormData({
                            name: currentTpl.name,
                            description: currentTpl.description || "",
                            question_ids: currentTpl.questions?.map((q: { question: { id: string } }) => q.question.id) || []
                        });
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            fetchQuestions();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId, token]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuestions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generateWithAi = async () => {
        if (!industryNature) return;
        setGeneratingAi(true);
        try {
            const genRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions/ai-generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categories: ["PERFORMANCE", "LEADERSHIP", "CULTURE"],
                    count: 5,
                    additional_context: industryNature
                })
            });

            if (genRes.ok) {
                const aiQuestions: AIQuestion[] = await genRes.json();
                const newQuestionIds: string[] = [];

                for (const q of aiQuestions) {
                    const saveRes = await fetch(`${BACKEND_URL}/api/v1/enterprise/x360/questions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: q.text,
                            type: q.type,
                            category: q.category
                        })
                    });
                    if (saveRes.ok) {
                        const savedQ = await saveRes.json();
                        newQuestionIds.push(savedQ.id);
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    question_ids: [...new Set([...prev.question_ids, ...newQuestionIds])]
                }));
                fetchQuestions();
                setIsAiWizardOpen(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(
                isEdit
                    ? `${BACKEND_URL}/api/v1/enterprise/x360/templates/${templateId}`
                    : `${BACKEND_URL}/api/v1/enterprise/x360/templates`,
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                }
            );
            if (res.ok) {
                router.push('/enterprise/assessments-360/templates');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleQuestion = (id: string) => {
        setFormData(prev => {
            const ids = prev.question_ids.includes(id)
                ? prev.question_ids.filter(q => q !== id)
                : [...prev.question_ids, id];
            return { ...prev, question_ids: ids };
        });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
            <div className="w-10 h-10 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-[1100px] mx-auto w-full px-4 sm:px-5 md:px-7 pb-24 space-y-6 animate-in fade-in duration-500">
            {/* Page header (sticky) */}
            <PageHeader
                help={<><p>{tr("forms.x360Help1")}</p><p>{tr("forms.x360Help2")}</p></>}
                title={isEdit ? tr("forms.refineFramework") : tr("forms.constructFramework")}
                subtitle={isEdit ? tr("forms.refineSubtitle") : tr("forms.constructSubtitle")}
                onBack={() => router.push('/enterprise/assessments-360/templates')}
                actions={
                    <Button
                        size="sm"
                        icon={isEdit ? 'published_with_changes' : 'rocket_launch'}
                        onClick={handleSave}
                        disabled={submitting || formData.question_ids.length === 0}
                    >
                        {isEdit ? (submitting ? tr("forms.updatingEllipsis") : tr("forms.updateFramework")) : (submitting ? tr("forms.deployingEllipsis") : tr("forms.deployFramework"))}
                    </Button>
                }
            />

            {/* Meta Config */}
            <Card padding="lg">
                <CardHeader
                    title={isEdit ? tr("forms.frameworkDetails") : tr("forms.frameworkSetup")}
                    subtitle={isEdit ? tr("forms.frameworkDetailsSubtitle") : tr("forms.frameworkSetupSubtitle")}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label={tr("forms.frameworkDesignation")} htmlFor={`${isEdit ? 'edit' : 'new'}-framework-name`} required>
                        <Input
                            id={`${isEdit ? 'edit' : 'new'}-framework-name`}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            placeholder={tr("forms.frameworkDesignationPlaceholder")}
                        />
                    </Field>
                    <Field label={isEdit ? tr("forms.organizationContext") : tr("forms.strategicObjective")} htmlFor={`${isEdit ? 'edit' : 'new'}-framework-description`}>
                        <Input
                            id={`${isEdit ? 'edit' : 'new'}-framework-description`}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder={isEdit ? tr("forms.orgContextPlaceholder") : tr("forms.strategicObjectivePlaceholder")}
                        />
                    </Field>
                </div>
            </Card>

            {/* Selection Pool - Grouped by Category */}
            <Card padding="lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-[4px] bg-[#212121] text-white flex items-center justify-center shrink-0">
                            <i className="mdi mdi-file-tree text-[22px]" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-bold text-[#212121]">{isEdit ? tr("forms.competencyRefinement") : tr("forms.competencyArchitecture")}</h3>
                            <p className="text-[12.5px] text-[#757575] mt-0.5">{isEdit ? tr("forms.competencyRefinementSubtitle") : tr("forms.competencyArchitectureSubtitle")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#1976D2] mb-1">{tr("forms.totalSelected")}</span>
                            <span className={`text-[24px] font-semibold tracking-[-1px] text-[#212121] ${jetbrainsMono.className}`}>{formData.question_ids.length}</span>
                        </div>
                        <Button
                            type="button"
                            variant="dark"
                            icon="psychology"
                            onClick={() => setIsAiWizardOpen(true)}
                            className="bg-[#1976D2] border-transparent text-white hover:bg-[#1565C0] shadow-[0_6px_16px_rgba(25,118,210,0.28)]"
                        >
                            {isEdit ? tr("forms.aiStrategyWizard") : tr("forms.strategyWizard")}
                        </Button>
                    </div>
                </div>

                <div className="space-y-8">
                    {Array.from(new Set(questions.map(q => q.category))).sort((a, b) => String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0).map(cat => {
                        const catQuestions = questions.filter(q => q.category === cat);
                        const selectedInCat = catQuestions.filter(q => formData.question_ids.includes(q.id)).length;

                        return (
                            <div key={cat} className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-[#E0E0E0]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center font-semibold text-[13px] transition-all ${jetbrainsMono.className} ${selectedInCat > 0 ? 'bg-[#1976D2] text-white shadow-[0_6px_16px_rgba(25,118,210,0.28)]' : 'bg-[#EEEEEE] text-[#9E9E9E]'}`}>
                                            {selectedInCat}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-[14px] font-bold text-[#212121]">{cat.replaceAll('_', ' ')}</h4>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575]">{catQuestions.length} {tr("forms.totalOptions")}</p>
                                        </div>
                                    </div>
                                    {selectedInCat > 0 && (
                                        <Badge tone="indigo">{selectedInCat} {tr("forms.chosen")}</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {catQuestions.map(q => {
                                        const isSelected = formData.question_ids.includes(q.id);
                                        return (
                                            <div
                                                key={q.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleQuestion(q.id)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { toggleQuestion(q.id); } }}
                                                className={`p-4 rounded-[4px] cursor-pointer transition-all flex flex-col gap-3 border relative group ${
                                                    isSelected
                                                    ? 'border-[#1976D2] bg-[#F8F7FE] ring-2 ring-[#1976D2]/15'
                                                    : 'border-[#E0E0E0] bg-white hover:border-[#E0E0E0] hover:bg-[#FAFAFA]'
                                                }`}
                                            >
                                                <div className="flex-1">
                                                    <p className={`text-[13.5px] font-semibold leading-relaxed transition-colors ${isSelected ? 'text-[#212121]' : 'text-[#424242]'}`}>
                                                        {q.text}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center pt-2.5 border-t border-[#E0E0E0] mt-auto">
                                                    <Badge tone="neutral" className="rounded-[3px] px-2 py-0.5 text-[10px]">{q.type}</Badge>
                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-[#1976D2] border-[#1976D2] text-white' : 'bg-[#F5F6F8] border-[#E0E0E0] text-transparent group-hover:border-[#9E9E9E]'}`}>
                                                        <i className="mdi mdi-check text-[15px] font-bold" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Finalize */}
            <Card padding="lg" className="flex flex-col items-center text-center">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575] mb-3">{isEdit ? tr("forms.finalArchitecture") : tr("forms.frameworkReadiness")}</span>
                <h4 className="text-[20px] font-extrabold tracking-[-0.5px] text-[#212121] mb-1.5">
                    <span className={jetbrainsMono.className}>{formData.question_ids.length}</span> {isEdit ? tr("forms.questionsConfigured") : tr("forms.questionsSelected")}
                </h4>
                <p className="text-[13px] text-[#757575] max-w-sm mb-6">{isEdit ? tr("forms.verifySelection") : tr("forms.reviewCompetencyMix")}</p>
                <Button
                    size="lg"
                    icon={submitting ? undefined : (isEdit ? 'published_with_changes' : 'rocket_launch')}
                    onClick={handleSave}
                    disabled={submitting || formData.question_ids.length === 0}
                    className="px-10"
                >
                    {submitting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {isEdit ? tr("forms.persistingEllipsis") : tr("forms.sequencingEllipsis")}
                        </>
                    ) : (
                        <span>{isEdit ? tr("forms.updateFrameworkStructure") : tr("forms.deployAssessmentFramework")}</span>
                    )}
                </Button>
            </Card>

            {/* AI Wizard Modal */}
            {isAiWizardOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#212121]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card padding="none" className="w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.24)] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-[#E0E0E0] flex justify-between items-center bg-[#FAFAFA]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center">
                                    <i className="mdi mdi-brain text-[19px]" />
                                </span>
                                <h2 className="text-[15px] font-bold text-[#212121]">{tr("forms.aiStrategyWizard")}</h2>
                            </div>
                            <button onClick={() => setIsAiWizardOpen(false)} className="w-7 h-7 rounded-[3px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors">
                                <i className="mdi mdi-close text-[19px]" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <Field
                                label={isEdit ? tr("forms.describeYourIndustry") : tr("forms.industryForContext")}
                                htmlFor={`${isEdit ? 'edit' : 'new'}-industry-nature`}
                                hint={isEdit ? tr("forms.industryHintEdit") : tr("forms.industryHintNew")}
                            >
                                <Input
                                    id={`${isEdit ? 'edit' : 'new'}-industry-nature`}
                                    value={industryNature}
                                    onChange={(e) => setIndustryNature(e.target.value)}
                                    placeholder={isEdit ? tr("forms.industryPlaceholderEdit") : tr("forms.industryPlaceholderNew")}
                                    autoFocus
                                />
                            </Field>
                            <Button
                                fullWidth
                                variant="dark"
                                onClick={generateWithAi}
                                disabled={generatingAi || !industryNature}
                                className="bg-[#212121] border-transparent text-white hover:bg-[#1976D2]"
                            >
                                {generatingAi ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        {tr("forms.generatingEllipsis")}
                                    </>
                                ) : (
                                    <>
                                        <i className="mdi mdi-auto-fix text-[19px]" />
                                        <span>{tr("forms.injectAiInsights")}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
