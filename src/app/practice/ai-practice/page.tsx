"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";

interface Domain {
    name: string;
    weightage: number;
}

interface AssessmentPreview {
    preview_id: string;
    sections: {
        title: string;
        weightage: number;
        question_count: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: any[];
    }[];
    total_questions_generated: number;
}

interface Assessment {
    id: number;
    title: string;
    is_completed: boolean;
    created_at: string;
    is_ai_generated: boolean;
    question_count: number;
    time_limit_minutes: number;
    last_attempt_id?: number;
}

interface AIProtocol {
    id: number;
    source_type: string;
    detected_domains: Record<string, number>;
    modules: string[];
    generation_status: 'PENDING' | 'GENERATED' | 'COMPLETED';
    created_at: string;
    assessment_id: number | null;
}

export default function AIPracticePage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"LIST" | "CREATE">("LIST");
    const [step, setStep] = useState<1 | 2>(1); // 1: Upload, 2: Configure
    const [sourceType, setSourceType] = useState<"RESUME" | "JD">("RESUME");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [configId, setConfigId] = useState<number | null>(null);
    const [protocols, setProtocols] = useState<AIProtocol[]>([]);
    const [detectedDomains, setDetectedDomains] = useState<Domain[]>([]);
    const [totalQuestions, setTotalQuestions] = useState(30);
    const [codingQuestions, setCodingQuestions] = useState(2);
    const [showCodingCard, setShowCodingCard] = useState(false);
    const [subjectiveQuestions, setSubjectiveQuestions] = useState(1);
    const [showSubjectiveCard, setShowSubjectiveCard] = useState(true);
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
    const [previewData, setPreviewData] = useState<AssessmentPreview | null>(null);
    const [history, setHistory] = useState<Assessment[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const [assessmentsRes, protocolsRes] = await Promise.all([
                apiClient.get("/api/v1/assessments"),
                apiClient.get("/api/v1/assessments/ai/protocols")
            ]);

            if (assessmentsRes.ok) {
                const data: Assessment[] = await assessmentsRes.json();
                setHistory(data.filter(a => a.is_ai_generated).sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ));
            }

            if (protocolsRes.ok) {
                const data: AIProtocol[] = await protocolsRes.json();
                // Filter for protocols that don't have an assessment yet
                setProtocols(data.filter(p => p.generation_status === 'PENDING'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setAnalyzing(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("source_type", sourceType);

        try {
            const res = await apiClient.post("/api/v1/assessments/ai/analyze", formData);
            if (res.ok) {
                const data = await res.json();
                setConfigId(data.config_id);
                // Convert domains object to array
                const domainsArray = Object.entries(data.detected_domains).map(([name, weightage]) => ({
                    name,
                    weightage: Number(weightage)
                }));
                setDetectedDomains(domainsArray);

                // Check if coding round is recommended
                if (data.modules && data.modules.includes("CODING")) {
                    setShowCodingCard(true);
                    setCodingQuestions(2);
                } else {
                    setShowCodingCard(false);
                    setCodingQuestions(0);
                }

                // Default Subjective to active for robustness
                setShowSubjectiveCard(true);
                setSubjectiveQuestions(1);

                setStep(2);
                setViewMode("CREATE");
            } else {
                alert("Failed to analyze file. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during analysis.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleWeightageChange = (index: number, newValue: number) => {
        // Auto-balancing logic
        const newDomains = [...detectedDomains];
        const oldVal = newDomains[index].weightage;

        // If value hasn't changed, do nothing
        if (oldVal === newValue) return;

        // Set new value
        newDomains[index].weightage = newValue;

        // Calculate how much we need to redistribute
        const diff = newValue - oldVal; // +ve if increased, -ve if decreased
        // We need to subtract 'diff' from others

        const remainingWeight = 100 - newValue;

        if (remainingWeight < 0) {
            // Should not happen with slider max=100, but logic:
            // Force this one to 100, others to 0
            newDomains[index].weightage = 100;
            newDomains.forEach((d, i) => { if (i !== index) d.weightage = 0; });
        } else if (remainingWeight === 0) {
            newDomains.forEach((d, i) => { if (i !== index) d.weightage = 0; });
        } else {
            // Distribute remainingWeight proportionally among others based on their existing weights relative to each other
            const othersTotal = 100 - oldVal;

            if (othersTotal === 0) {
                // Others were 0, so distribute equally
                const otherCount = newDomains.length - 1;
                const share = Math.floor(remainingWeight / otherCount);
                newDomains.forEach((d, i) => {
                    if (i !== index) d.weightage = share;
                });
            } else {
                // Proportional distribution
                let distributed = 0;
                newDomains.forEach((d, i) => {
                    if (i !== index) {
                        // ratio of this domain among ONLY the others
                        const ratio = d.weightage / othersTotal;
                        const newW = Math.round(ratio * remainingWeight);
                        d.weightage = newW;
                        distributed += newW;
                    }
                });

                // Fix rounding errors by adjusting the largest of the others (or just the first one)
                const error = remainingWeight - distributed;
                if (error !== 0) {
                    // Find first other index
                    const firstOther = newDomains.findIndex((_, i) => i !== index);
                    if (firstOther !== -1) {
                        newDomains[firstOther].weightage += error;
                    }
                }
            }
        }

        setDetectedDomains(newDomains);
    };

    const getTotalWeightage = () => {
        return detectedDomains.reduce((sum, d) => sum + d.weightage, 0);
    };

    const handleNormalize = () => {
        const equalShare = Math.floor(100 / detectedDomains.length);
        const newDomains = detectedDomains.map(d => ({ ...d, weightage: equalShare }));

        // Fix remainder
        const currentSum = newDomains.reduce((a, b) => a + b.weightage, 0);
        if (currentSum < 100) {
            newDomains[0].weightage += (100 - currentSum);
        }
        setDetectedDomains(newDomains);
    };

    const handleGenerate = async () => {
        if (!configId) return;

        const totalWeight = getTotalWeightage();
        // Allow 0 weightage only if we are in "Coding Only" mode (totalQuestions === 0)
        if (totalQuestions > 0 && totalWeight !== 100) {
            alert(`Total weightage must be 100% for aptitude questions. Current: ${totalWeight}%`);
            return;
        }

        setLoading(true);
        try {
            const domainsObj = detectedDomains.reduce((acc, d) => {
                acc[d.name] = d.weightage;
                return acc;
            }, {} as Record<string, number>);

            const res = await apiClient.post("/api/v1/assessments/ai/generate", {
                config_id: configId,
                domains: domainsObj,
                total_questions: totalQuestions,
                coding_questions: showCodingCard ? codingQuestions : 0,
                subjective_questions: showSubjectiveCard ? subjectiveQuestions : 0,
                difficulty: difficulty
            });

            if (res.ok) {
                const data = await res.json();
                setPreviewData(data);
                await createAssessment(data.preview_id);
            } else {
                alert("Failed to generate questions. Please try again.");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during generation.");
            setLoading(false);
        }
    };

    const createAssessment = async (previewId: string) => {
        try {
            const res = await apiClient.post("/api/v1/assessments/ai/create", {
                preview_id: previewId,
                time_limit_minutes: Math.ceil(totalQuestions * 1.5) // 1.5 min per question
            });

            if (res.ok) {
                const data = await res.json();

                // If we generated an interview and NO aptitude/coding questions, go straight to interview
                if (data.interview_id && data.total_questions === 0) {
                    router.push(`/practice/interviews/${data.interview_id}`);
                } else {
                    // Otherwise go to assessment (standard flow)
                    // The assessment runner could optionally link to the interview later
                    router.push(`/practice/assessments/${data.id}?from=ai`);
                }
            } else {
                alert("Failed to create assessment.");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleCancelCreate = () => {
        setViewMode("LIST");
        setStep(1);
        setFile(null);
        setConfigId(null);
        setDetectedDomains([]);
        setSourceType("RESUME");
    };

    const resumeProtocol = (protocol: AIProtocol) => {
        setConfigId(protocol.id);
        const domainsArray = Object.entries(protocol.detected_domains).map(([name, weightage]) => ({
            name,
            weightage: Number(weightage)
        }));
        setDetectedDomains(domainsArray);

        if (protocol.modules && protocol.modules.includes("CODING")) {
            setShowCodingCard(true);
            setCodingQuestions(2);
        } else {
            setShowCodingCard(false);
            setCodingQuestions(0);
        }

        // Default Subjective to active if not present in modules (legacy compatibility)
        // Or if we track it in modules later, we can check. For now, enable it.
        setShowSubjectiveCard(true);
        setSubjectiveQuestions(1);

        setSourceType(protocol.source_type as "RESUME" | "JD");
        setStep(2);
        setViewMode("CREATE");
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-[#f8fafc] min-h-screen">
            {/* Hero Section */}
            <section className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl mb-12 border border-white/10">
                {/* Background Pattern/Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-slate-900/60 z-0"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px]"></div>

                <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                <span className="text-[10px] font-black text-indigo-300  ">AI Kernel v3.0</span>
                            </div>
                            <h2 className="text-4xl font-black text-white  tracking-tight leading-[1.1]">
                                Adaptive Neural <br /> Protocols
                            </h2>
                        </div>
                        <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed opacity-80">
                            Generate personalized training protocols via resume or job description analysis. Identify and correct neural deficiencies.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        {/* Status Box */}
                        <div className="flex items-center gap-5 bg-white/5 p-5 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                                <span className="material-icons-outlined text-2xl">psychology</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500   mb-1.5">Network Status</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black text-white">{loadingHistory ? "..." : history.length}</span>
                                    <span className="text-[10px] font-bold text-slate-500  ">Sessions</span>
                                </div>
                            </div>
                        </div>

                        {/* Initialize Button */}
                        {viewMode === "LIST" && (
                            <button
                                onClick={() => setViewMode("CREATE")}
                                className="h-16 px-8 bg-white text-slate-900 rounded-[1.25rem] font-black text-[11px]   hover:bg-slate-100 transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <span className="material-icons-outlined text-xl">add_circle</span>
                                Initialize Session
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {viewMode === "CREATE" ? (
                /* -------------------------------------------------------------------------- */
                /*                               Create View                                  */
                /* -------------------------------------------------------------------------- */
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleCancelCreate}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                        >
                            <span className="material-icons-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-slate-400   mb-0.5">Protocol Initialization</p>
                            <h2 className="text-xl font-black text-slate-900  tracking-tight flex items-center gap-3">
                                New Training Session
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="material-icons-outlined text-4xl text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">smart_toy</span>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-900  tracking-tight">Generating Protocol</h3>
                                <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
                                    Our AI is analyzing your domains and constructing a custom assessment matrix. This may take a moment.
                                </p>
                            </div>
                        </div>
                    ) : step === 1 ? (
                        <div className="max-w-2xl mx-auto space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSourceType("RESUME")}
                                    className={`relative p-5 rounded-2xl border-2 transition-all group ${sourceType === "RESUME"
                                        ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 shadow-xl shadow-indigo-500/5"
                                        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${sourceType === "RESUME" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"}`}>
                                        <span className="material-icons-outlined text-2xl">description</span>
                                    </div>
                                    <span className="text-[10px] font-black  tracking-[0.1em]">My Resume</span>
                                    {sourceType === "RESUME" && (
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSourceType("JD")}
                                    className={`relative p-5 rounded-2xl border-2 transition-all group ${sourceType === "JD"
                                        ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 shadow-xl shadow-indigo-500/5"
                                        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${sourceType === "JD" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"}`}>
                                        <span className="material-icons-outlined text-2xl">work</span>
                                    </div>
                                    <span className="text-[10px] font-black  tracking-[0.1em]">Target JD</span>
                                    {sourceType === "JD" && (
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500"></div>
                                    )}
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center space-y-4 bg-white hover:border-indigo-300 transition-all group shadow-sm">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                                    <span className="material-icons-outlined text-3xl">cloud_upload</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900  tracking-tight">Upload {sourceType === "RESUME" ? "Resume" : "JD"}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold   mt-1">PDF or DOCX (MAX 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black   rounded-xl hover:bg-slate-800 cursor-pointer transition-all shadow-lg shadow-slate-900/10"
                                    >
                                        <span className="material-icons-outlined text-sm">{file ? "sync" : "attach_file"}</span>
                                        {file ? "Replace File" : "Choose File"}
                                    </label>
                                    {file && (
                                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black   flex items-center gap-2 animate-in fade-in zoom-in-95">
                                            <span className="material-icons-outlined text-sm">check_circle</span>
                                            {file.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!file || analyzing}
                                className="w-full py-4 bg-slate-900 text-white font-black text-sm   rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                                {analyzing ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Analyze & Detect Domains
                                        <span className="material-icons-outlined">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Step 2: Configure */
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900  tracking-tight">Detected Domains</h3>
                                    <div className="px-3 py-1 rounded-lg text-[10px] font-black   bg-slate-900 text-white border border-slate-800">
                                        100% Balanced
                                    </div>
                                </div>

                                {/* Visual Distribution Bar - Professional Cool Tones */}
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-sm">
                                    {detectedDomains.map((domain, index) => {
                                        // Cool Spectrum Palette
                                        const colors = [
                                            "bg-slate-900", "bg-indigo-600", "bg-blue-600", "bg-violet-600",
                                            "bg-sky-600", "bg-purple-600", "bg-cyan-600", "bg-slate-500"
                                        ];
                                        const color = colors[index % colors.length];
                                        return (
                                            <div
                                                key={index}
                                                className={`h-full ${color} transition-all duration-300 border-r border-white/10 last:border-0`}
                                                style={{ width: `${domain.weightage}%` }}
                                                title={`${domain.name}: ${domain.weightage}%`}
                                            ></div>
                                        );
                                    })}
                                </div>

                                {/* Compact Grid Layout to reduce scrolling */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {detectedDomains.map((domain, index) => {
                                        const iconColor = "text-indigo-600 bg-indigo-50";

                                        return (
                                            <div key={index} className="bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-[1.5rem] p-4 shadow-sm hover:shadow-lg transition-all duration-300">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-9 h-9 rounded-xl flex-shrink-0 ${iconColor} flex items-center justify-center shadow-sm`}>
                                                            <span className="material-icons-outlined text-xl">layers</span>
                                                        </div>
                                                        <h4 className="font-black text-[10px] text-slate-900  tracking-tight truncate">{domain.name}</h4>
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex-shrink-0">{domain.weightage}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="1"
                                                    value={domain.weightage}
                                                    onChange={(e) => handleWeightageChange(index, Number(e.target.value))}
                                                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 space-y-6 sticky top-8 shadow-xl shadow-slate-200/50">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900  tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <span className="w-2 h-4 bg-indigo-600 rounded-full"></span>
                                            Configuration
                                        </h3>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400   mb-3 block">Complexity Level</label>
                                                <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                    {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setDifficulty(d)}
                                                            className={`flex-1 py-2 rounded-lg text-[9px] font-black   transition-all ${difficulty === d
                                                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                                                : "text-slate-400 hover:text-slate-600"
                                                                }`}
                                                        >
                                                            {d}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-baseline mb-3">
                                                    <label className="text-[10px] font-bold text-slate-400   block">
                                                        Neural Load
                                                    </label>
                                                    <span className="text-sm font-black text-indigo-600">{totalQuestions} Qs</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="50"
                                                    step="5"
                                                    value={totalQuestions}
                                                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                                                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${totalQuestions === 0 ? "bg-slate-100 accent-slate-300" : "bg-slate-100 accent-indigo-600"
                                                        }`}
                                                />
                                                <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-2 font-mono  tracking-tighter">
                                                    <span>{totalQuestions === 0 ? "CODING_ONLY" : "ZERO"}</span>
                                                    <span>FIFTY_MAX</span>
                                                </div>
                                            </div>

                                            {showCodingCard && (
                                                <div className="bg-slate-950 rounded-2xl p-5 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/10">
                                                    {/* Background Glow */}
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>

                                                    <div className="relative z-10 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                                                    <span className="material-icons-outlined text-sm">terminal</span>
                                                                </div>
                                                                <h4 className="text-[9px] font-black text-white  tracking-[0.2em]">Coding Module</h4>
                                                            </div>
                                                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                                                <span className="text-[7px] font-black text-emerald-400 ">Active</span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between items-baseline mb-2.5">
                                                                <label className="text-[8px] font-bold text-slate-400  tracking-[0.2em]">Intensity</label>
                                                                <span className="text-[10px] font-black text-indigo-400">{codingQuestions} TASKS</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                step="1"
                                                                value={codingQuestions}
                                                                onChange={(e) => setCodingQuestions(Number(e.target.value))}
                                                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 hover:accent-indigo-300 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Mock Interview Configuration */}
                                            {showSubjectiveCard && (
                                                <div className="bg-rose-950 rounded-2xl p-5 text-white relative overflow-hidden group shadow-2xl shadow-rose-500/10">
                                                    {/* Background Glow */}
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>

                                                    <div className="relative z-10 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                                                                    <span className="material-icons-outlined text-sm">videocam</span>
                                                                </div>
                                                                <h4 className="text-[9px] font-black text-white  tracking-[0.2em]">AI Mock Interview</h4>
                                                            </div>
                                                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                                                <span className="text-[7px] font-black text-emerald-400 ">Active</span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between items-baseline mb-2.5">
                                                                <label className="text-[8px] font-bold text-slate-400  tracking-[0.2em]">Intensity</label>
                                                                <span className="text-[10px] font-black text-rose-400">{subjectiveQuestions} MODULES</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="3"
                                                                step="1"
                                                                value={subjectiveQuestions}
                                                                onChange={(e) => setSubjectiveQuestions(Number(e.target.value))}
                                                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
                                                            />
                                                            <p className="text-[8px] text-slate-400 mt-2 font-medium leading-relaxed">
                                                                {subjectiveQuestions === 1 ? "Short behavioral Check-in" : subjectiveQuestions === 2 ? "Standard Technical Interview" : "Deep Technical & Behavioral Dive"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <button
                                            onClick={handleGenerate}
                                            className="w-full py-4 bg-indigo-600 text-white font-black text-[10px]  tracking-[0.2em] rounded-xl hover:bg-indigo-700 transition-all shadow-[0_15px_30px_-10px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            Initiate Generation
                                            <span className="material-icons-outlined text-sm">bolt</span>
                                        </button>

                                        <button
                                            onClick={handleNormalize}
                                            className="w-full py-3 bg-slate-50 text-slate-500 font-black text-[9px]   rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            Recalibrate Balance
                                            <span className="material-icons-outlined text-sm">refresh</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* -------------------------------------------------------------------------- */
                /*                               List View                                    */
                /* -------------------------------------------------------------------------- */
                <div className="mb-12 space-y-8">
                    {/* Pending Protocols Section */}
                    {protocols.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-indigo-100 flex-grow"></div>
                                <h3 className="text-sm font-black text-indigo-400  ">Pending Protocols</h3>
                                <div className="h-px bg-indigo-100 flex-grow"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {protocols.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => resumeProtocol(p)}
                                        className="group cursor-pointer relative bg-white border border-slate-100 rounded-[2.5rem] p-7 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[200px]"
                                    >
                                        {/* Hover Gradient Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-transparent to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-sm transition-all duration-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6">
                                                    <span className="material-icons-outlined">pending_actions</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[7px] font-black text-indigo-400  tracking-[0.2em] mb-1.5 opacity-60">Status: Suspended</span>
                                                    <div className="w-10 h-10 rounded-full border-2 border-slate-50 flex items-center justify-center text-indigo-600 bg-white shadow-sm group-hover:border-indigo-600 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-300">
                                                        <span className="material-icons-outlined text-lg">play_arrow</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xl font-black text-slate-900 transition-colors  tracking-tight line-clamp-2 leading-tight group-hover:text-indigo-900">
                                                    {p.source_type === "RESUME" ? "Analysis: CV" : "Analysis: Job"}
                                                </h4>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.keys(p.detected_domains).slice(0, 3).map((d, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[7px] font-black text-slate-400  ">
                                                            {d}
                                                        </span>
                                                    ))}
                                                    {Object.keys(p.detected_domains).length > 3 && (
                                                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[7px] font-black text-slate-400  ">
                                                            +{Object.keys(p.detected_domains).length - 3}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 text-[9px] font-black text-slate-400   pt-5 border-t border-slate-50 group-hover:border-indigo-50 transition-colors">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="material-icons-outlined text-[12px]">calendar_today</span>
                                                        {new Date(p.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-indigo-600 ml-auto group-hover:translate-x-[-2px] transition-transform">Resume Flow</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 flex-grow"></div>
                        <h3 className="text-sm font-black text-slate-400  ">Recorded Sessions</h3>
                        <div className="h-px bg-slate-200 flex-grow"></div>
                    </div>

                    {loadingHistory ? (
                        <div className="flex justify-center p-8">
                            <span className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></span>
                        </div>
                    ) : (history.length === 0 && protocols.length === 0) ? (
                        <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                            <span className="material-icons-outlined text-4xl text-slate-300">smart_toy</span>
                            <div>
                                <h4 className="text-sm font-black text-slate-400  ">No Protocols Active</h4>
                                <p className="text-[10px] text-slate-400 font-bold   mt-1">Initialize a new adaptive training session to begin.</p>
                            </div>
                        </div>
                    ) : history.length === 0 && protocols.length > 0 ? (
                        <div className="py-12 text-center text-slate-400 text-[10px] font-black  ">
                            No completed sessions yet. Resume a pending protocol above.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map(a => (
                                <Link
                                    href={a.is_completed && a.last_attempt_id ? `/practice/assessments/results/${a.last_attempt_id}?from=ai` : `/practice/assessments/${a.id}?from=ai`}
                                    key={a.id}
                                    className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-7 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[200px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${a.is_completed ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                                <span className="material-icons-outlined">{a.is_completed ? 'verified' : 'bolt'}</span>
                                            </div>

                                            <div className="w-10 h-10 rounded-full border-2 border-slate-50 flex items-center justify-center text-slate-300 group-hover:border-indigo-600 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-300 bg-white shadow-sm">
                                                <span className="material-icons-outlined text-lg">arrow_outward</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-900 transition-colors  tracking-tight line-clamp-2 leading-tight">
                                                {a.title}
                                            </h4>

                                            <div className="flex items-center gap-3 text-[9px] font-black text-slate-400   pt-5 border-t border-slate-50 group-hover:border-indigo-50 transition-colors">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors"></span>
                                                    {a.question_count} Units
                                                </span>
                                                <span className={a.is_completed ? "text-emerald-500 ml-auto flex items-center gap-1" : "text-amber-500 ml-auto flex items-center gap-1"}>
                                                    <span className={`w-1 h-1 rounded-full ${a.is_completed ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    {a.is_completed ? "Finalized" : "On-Going"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
