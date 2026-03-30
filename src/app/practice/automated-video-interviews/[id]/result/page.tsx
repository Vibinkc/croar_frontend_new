"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import Link from "next/link";
import AIGenerationOverlay from "@/components/ui/AIGenerationOverlay";
import InterviewResult from "@/components/results/InterviewResult";

interface AnalysisResult {
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    tone_analysis: string;
    detailed_feedback: string;
}

export default function AnalysisResultPage() {
    const { id } = useParams();
    // const { accessToken } = useAuth();
    const router = useRouter();
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedResults = localStorage.getItem(`interview_results_${id}`);
        if (storedResults) {
            analyzeResults(JSON.parse(storedResults));
        } else if (!storedResults) {
            router.push("/practice/automated-video-interviews"); // No results found
        }
    }, [id]);

    const analyzeResults = async (transcript: any[]) => {
        try {
            const response = await apiClient.post(`/api/v1/interviews/${id}/analyze-async`, { transcript });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <AIGenerationOverlay isOpen={isLoading} title="Analyzing Biometrics & Content" />
            {!result && !isLoading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Error loading results.</p>
                </div>
            ) : result && (
                <InterviewResult result={result} />
            )}
        </div>
    );
}
