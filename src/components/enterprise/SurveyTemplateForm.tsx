"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import {
    PageHeader,
    Card,
    CardHeader,
    Field,
    Input,
    Textarea,
    Select,
    Badge,
    Button,
    jetbrainsMono,
} from "@/components/ds";

interface SurveyType {
    id: string;
    name: string;
    description: string;
}

interface Question {
    text: string;
    type: "RATING" | "TEXT" | "MCQ";
    scale_min: number;
    scale_max: number;
    options?: string; // stringified JSON array
}

// Options can arrive as a JSON string (the stored shape), an actual array, or
// an array of {label/text/value} objects — normalize all of them to strings so
// the inputs never render blank.
const safeOptions = (v: unknown): string[] => {
    if (v == null) return [];
    let arr: unknown = v;
    if (typeof v === "string") {
        const s = v.trim();
        if (!s) return [];
        try {
            arr = JSON.parse(s);
        } catch {
            // Tolerate Python-style single-quoted lists, else comma-separated.
            try { arr = JSON.parse(s.replace(/'/g, '"')); }
            catch { arr = s.split(",").map(x => x.trim()).filter(Boolean); }
        }
    }
    if (!Array.isArray(arr)) return [];
    return arr.map(o => {
        if (typeof o === "string") return o;
        if (o && typeof o === "object") {
            const obj = o as Record<string, unknown>;
            return String(obj.label ?? obj.text ?? obj.value ?? obj.name ?? "");
        }
        return String(o ?? "");
    });
};

interface SurveyTemplateFormProps {
    mode: "create" | "edit";
    templateId?: string;
}

/**
 * Shared create/edit form for survey templates. The only differences between the two pages are the
 * initial data load, the submit verb (POST vs PUT), and the header/button copy — everything else is
 * identical, so both pages render this component.
 */
export default function SurveyTemplateForm({ mode, templateId }: SurveyTemplateFormProps) {
    const router = useRouter();
    const { t: tr } = useI18n();
    const isEdit = mode === "edit" && !!templateId;
    const [types, setTypes] = useState<SurveyType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // AI Wizard State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [industryNature, setIndustryNature] = useState("");
    const [generatingAi, setGeneratingAi] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        survey_type_id: "",
        title: "",
        description: "",
        questions: [] as Question[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isEdit) {
                    const [typesRes, tplRes] = await Promise.all([
                        apiClient.get('/api/v1/enterprise/surveys/types'),
                        apiClient.get(`/api/v1/enterprise/surveys/templates/${templateId}`)
                    ]);

                    if (typesRes.ok) setTypes(await typesRes.json());
                    if (tplRes.ok) {
                        const tpl = await tplRes.json();
                        setFormData({
                            survey_type_id: tpl.survey_type_id,
                            title: tpl.title,
                            description: tpl.description || "",
                            questions: tpl.questions.map((q: { text: string; type: Question["type"]; scale_min?: number; scale_max?: number; options?: string }) => ({
                                text: q.text,
                                type: q.type,
                                scale_min: q.scale_min || 1,
                                scale_max: q.scale_max || 5,
                                options: q.options || JSON.stringify(["Option 1", "Option 2"])
                            }))
                        });
                    }
                } else {
                    const res = await apiClient.get('/api/v1/enterprise/surveys/types');
                    if (res.ok) setTypes(await res.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isEdit, templateId]);

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, { text: "", type: "RATING", scale_min: 1, scale_max: 5, options: JSON.stringify(["Option 1", "Option 2"]) }]
        }));
    };

    const removeQuestion = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx)
        }));
    };

    const updateQuestion = (idx: number, field: keyof Question, value: string | number) => {
        setFormData(prev => {
            const qs = [...prev.questions];
            qs[idx] = { ...qs[idx], [field]: value };
            return { ...prev, questions: qs };
        });
    };

    const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
        const q = formData.questions[qIdx];
        const opts = safeOptions(q.options);
        opts[optIdx] = val;
        updateQuestion(qIdx, "options", JSON.stringify(opts));
    };

    const addOption = (qIdx: number) => {
        const q = formData.questions[qIdx];
        const opts = safeOptions(q.options);
        opts.push(`Option ${opts.length + 1}`);
        updateQuestion(qIdx, "options", JSON.stringify(opts));
    };

    const removeOption = (qIdx: number, optIdx: number) => {
        const q = formData.questions[qIdx];
        const opts = safeOptions(q.options).filter((_: string, i: number) => i !== optIdx);
        updateQuestion(qIdx, "options", JSON.stringify(opts));
    };

    const generateWithAi = async () => {
        if (!formData.survey_type_id || !industryNature) return;
        setGeneratingAi(true);
        try {
            const res = await apiClient.post('/api/v1/enterprise/surveys/ai-generate-questions', {
                survey_type_id: formData.survey_type_id,
                industry_nature: industryNature,
                count: 5
            });
            if (res.ok) {
                const aiQuestions = await res.json();
                const formatted = aiQuestions.map((q: { text: string; type: Question["type"]; options?: string[] }) => ({
                    text: q.text,
                    type: q.type,
                    scale_min: 1,
                    scale_max: 5,
                    options: q.options ? JSON.stringify(q.options) : JSON.stringify(["Option 1", "Option 2"])
                }));
                setFormData(prev => ({
                    ...prev,
                    questions: [...prev.questions, ...formatted]
                }));
                setIsAiModalOpen(false);
            } else {
                // Report it. The server now returns 503 with a reason (e.g. the AI account is
                // out of credit) instead of an empty 200, and swallowing that here would leave
                // the user staring at a modal that appears to do nothing.
                const err = await res.json().catch(() => null);
                alert(err?.detail || tr("common.aiGenerationFailed"));
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
            const res = isEdit
                ? await apiClient.put(`/api/v1/enterprise/surveys/templates/${templateId}`, formData)
                : await apiClient.post('/api/v1/enterprise/surveys/templates', formData);
            if (res.ok) {
                if (isEdit) alert(tr("forms2.frameworkUpdated"));
                router.push('/enterprise/surveys/templates');
            } else if (isEdit) {
                alert(tr("forms2.frameworkUpdateFailed"));
            }
        } catch (error) {
            console.error(error);
            if (isEdit) alert(tr("forms2.saveError"));
        } finally {
            setSubmitting(false);
        }
    };

    const headerTitle = isEdit ? tr("forms2.editFramework") : tr("forms2.createFramework");
    const headerSubtitle = isEdit ? tr("forms2.refineSubtitle") : tr("forms2.designSubtitle");
    const submitLabel = isEdit ? (submitting ? tr("forms2.savingChanges") : tr("forms2.saveFramework")) : (submitting ? tr("forms2.deploying") : tr("forms2.deployFramework"));

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="w-10 h-10 border-4 border-[#5B53E0] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const submitDisabled = submitting || !formData.survey_type_id || !formData.title || formData.questions.length === 0 || formData.questions.some(q => !q.text.trim());

    return (
        <div className="max-w-[920px] mx-auto px-4 sm:px-5 md:px-7 pb-20 space-y-6 animate-in fade-in duration-500">
            <PageHeader
                help={<><p>{tr("forms2.surveyHelpP1")}</p><p>{tr("forms2.surveyHelpP2")}</p></>}
                title={headerTitle}
                subtitle={headerSubtitle}
                onBack={() => router.push('/enterprise/surveys/templates')}
                actions={
                    <Button
                        form="template-form"
                        type="submit"
                        disabled={submitDisabled}
                    >
                        {submitLabel}
                    </Button>
                }
            />

            <form id="template-form" onSubmit={handleSave} className="space-y-6">
                {/* Framework configuration */}
                <Card>
                    <CardHeader title={tr("forms2.frameworkConfiguration")} subtitle={tr("forms2.frameworkConfigSubtitle")} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <Field label={tr("forms2.surveyCategory")} htmlFor="survey-category" required>
                            <div className="relative">
                                <Select
                                    id="survey-category"
                                    className="pr-10"
                                    value={formData.survey_type_id}
                                    onChange={(e) => setFormData({...formData, survey_type_id: e.target.value})}
                                    required
                                >
                                    <option value="">{tr("forms2.selectTargetType")}</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </Select>
                                <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] pointer-events-none text-[20px]">expand_more</span>
                            </div>
                        </Field>

                        <Field label={tr("forms2.frameworkTitle")} htmlFor="framework-title" required>
                            <Input
                                id="framework-title"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder={tr("forms2.frameworkTitlePlaceholder")}
                                required
                            />
                        </Field>

                        <Field label={tr("forms2.executiveInstructions")} htmlFor="executive-instructions" className="md:col-span-2">
                            <Textarea
                                id="executive-instructions"
                                className="min-h-[100px] leading-relaxed"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={tr("forms2.executiveInstructionsPlaceholder")}
                            />
                        </Field>
                    </div>
                </Card>

                {/* Question stack */}
                <Card>
                    <CardHeader
                        title={
                            <span className="inline-flex items-center gap-2.5">
                                {tr("forms2.questionStack")}
                                <Badge tone="indigo">
                                    <span className={jetbrainsMono.className}>{formData.questions.length}</span> {tr("forms2.items")}
                                </Badge>
                            </span>
                        }
                        subtitle={tr("forms2.questionStackSubtitle")}
                        action={
                            <div className="flex flex-wrap gap-2.5">
                                <Button
                                    variant="dark"
                                    size="sm"
                                    type="button"
                                    icon="psychology"
                                    onClick={() => setIsAiModalOpen(true)}
                                    disabled={!formData.survey_type_id}
                                    className="bg-[#15171C] text-white border-transparent hover:bg-[#4A43C9]"
                                >
                                    {tr("forms2.aiWizard")}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    icon="add"
                                    onClick={addQuestion}
                                >
                                    {tr("forms2.addQuestion")}
                                </Button>
                            </div>
                        }
                    />

                    {formData.questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-[#E8EAED] rounded-[14px] bg-[#F7F8FA]/50">
                            <div className="w-14 h-14 rounded-[16px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center mb-4">
                                <span className="material-symbols-rounded text-[28px]">help_center</span>
                            </div>
                            <h3 className="text-[15px] font-bold text-[#15171C] mb-1">{tr("forms2.noQuestionsYet")}</h3>
                            <p className="text-[13px] text-[#8A929E] max-w-xs mx-auto">{tr("forms2.noQuestionsHint")}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {formData.questions.map((q, i) => (
                                <Card key={i} padding="md" className="relative group bg-[#FCFCFD] animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(i)}
                                            className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:text-[#C0383C] hover:bg-[#FDECEC] transition-colors"
                                            aria-label={tr("forms2.removeQuestion")}
                                        >
                                            <span className="material-symbols-rounded text-[20px]">delete</span>
                                        </button>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className={`w-10 h-10 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] font-bold flex items-center justify-center shrink-0 ${jetbrainsMono.className}`}>{i+1}</div>
                                        <div className="flex-1 min-w-0 space-y-4 pr-10">
                                            <input
                                                className="w-full bg-transparent border-none focus:ring-0 text-[#15171C] font-bold text-[17px] placeholder:text-[#C7CCD4] p-0 outline-none"
                                                value={q.text}
                                                onChange={(e) => updateQuestion(i, "text", e.target.value)}
                                                placeholder={tr("forms2.questionTextPlaceholder")}
                                                required
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {(["RATING", "TEXT", "MCQ"] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => updateQuestion(i, "type", type)}
                                                        className={`px-4 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all border ${q.type === type ? 'bg-[#5B53E0] border-[#5B53E0] text-white shadow-[0_4px_12px_rgba(91,83,224,0.24)]' : 'bg-white border-[#E1E4E8] text-[#8A929E] hover:text-[#374151] hover:border-[#9AA3AF]'}`}
                                                    >
                                                        {type === 'RATING' ? tr("forms2.typeRating") : type === 'TEXT' ? tr("forms2.typeDescriptive") : tr("forms2.typeMultiChoice")}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {q.type === 'MCQ' && (
                                        <div className="ml-14 mt-5 animate-in fade-in duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {safeOptions(q.options).map((opt: string, optIdx: number) => (
                                                    <div key={optIdx} className="flex gap-2 items-center group/opt">
                                                        <div className={`w-8 h-8 rounded-[8px] bg-[#F1F2F5] flex items-center justify-center text-[11px] font-bold text-[#8A929E] group-hover/opt:bg-[#ECEBFB] group-hover/opt:text-[#5B53E0] transition-colors shrink-0 ${jetbrainsMono.className}`}>{String.fromCodePoint(65 + optIdx)}</div>
                                                        <Input
                                                            className="h-10 flex-1"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(i, optIdx, e.target.value)}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(i, optIdx)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#C7CCD4] hover:text-[#C0383C] hover:bg-[#FDECEC] transition-colors shrink-0"
                                                            aria-label={tr("forms2.removeOption")}
                                                        >
                                                            <span className="material-symbols-rounded text-[18px]">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => addOption(i)}
                                                    className="h-10 px-4 border border-dashed border-[#E1E4E8] rounded-[10px] text-[12px] font-semibold text-[#8A929E] hover:border-[#5B53E0] hover:text-[#5B53E0] transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">add_circle</span>
                                                    <span>{tr("forms2.addChoice")}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="pt-2 flex justify-end">
                    <Button
                        size="lg"
                        type="submit"
                        disabled={submitDisabled}
                        className="px-10"
                    >
                        {submitLabel}
                    </Button>
                </div>
            </form>

            {/* AI Wizard Modal */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15171C]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card padding="none" className="w-full max-w-md shadow-[0_24px_60px_rgba(15,23,42,0.22)] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-[#E8EAED] flex justify-between items-center bg-[#F7F8FA]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                    <span className="material-symbols-rounded text-[20px]">psychology</span>
                                </span>
                                <h2 className="text-[16px] font-bold text-[#15171C]">{tr("forms2.aiStrategyWizard")}</h2>
                            </div>
                            <button
                                onClick={() => setIsAiModalOpen(false)}
                                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#8A929E] hover:text-[#374151] hover:bg-[#F1F2F5] transition-colors"
                                aria-label={tr("common.close")}
                            >
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <Field
                                label={tr("forms2.describeIndustry")}
                                htmlFor="industry-nature"
                                hint={tr("forms2.industryHint")}
                            >
                                <Input
                                    id="industry-nature"
                                    value={industryNature}
                                    onChange={(e) => setIndustryNature(e.target.value)}
                                    placeholder={tr("forms2.industryPlaceholder")}
                                    autoFocus
                                />
                            </Field>
                            <Button
                                variant="dark"
                                fullWidth
                                onClick={generateWithAi}
                                disabled={generatingAi || !industryNature}
                                className="bg-[#15171C] text-white border-transparent hover:bg-[#4A43C9]"
                            >
                                {generatingAi ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {tr("forms2.generating")}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-[19px]">magic_button</span>
                                        <span>{tr("forms2.generateStrategy")}</span>
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
