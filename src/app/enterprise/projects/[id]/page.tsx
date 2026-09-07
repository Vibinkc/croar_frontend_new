"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import ProjectForm from "@/components/enterprise/ProjectForm";
import { Button, Card } from "@/components/ds";

export default function ProjectDetailsPage() {
    const params = useParams();
    const { token } = useAuth();
    const { t: tr } = useI18n();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const id = params.id as string;

    useEffect(() => {
        if (token && id) {
            fetchProject();
        }
    }, [token, id]);

    const fetchProject = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/enterprise/projects/${id}`);
            if (res.ok) {
                setProject(await res.json());
            }
        } catch (error) {
            console.error("Error fetching project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                {/* Header skeleton */}
                <div className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-[#E0E0E0] rounded-[4px] animate-pulse" />
                        <div className="h-3.5 w-32 bg-[#EFF0F2] rounded-[3px] animate-pulse" />
                    </div>
                    <div className="h-9 w-32 bg-[#E0E0E0] rounded-[4px] animate-pulse shrink-0" />
                </div>

                {/* Tabs skeleton */}
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-9 w-24 bg-[#E0E0E0] rounded-[4px] animate-pulse" />
                    ))}
                </div>

                {/* Body skeleton */}
                <Card padding="lg" className="border-t-[3px] border-t-[#1976D2] min-h-[420px] space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <div className="h-3 w-24 bg-[#EFF0F2] rounded-[3px] animate-pulse" />
                            <div className="h-12 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        </div>
                        <div className="space-y-2.5">
                            <div className="h-3 w-24 bg-[#EFF0F2] rounded-[3px] animate-pulse" />
                            <div className="h-12 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        <div className="h-3 w-24 bg-[#EFF0F2] rounded-[3px] animate-pulse" />
                        <div className="h-24 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2.5">
                                <div className="h-3 w-20 bg-[#EFF0F2] rounded-[3px] animate-pulse" />
                                <div className="h-12 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
                {/* Header (sticky) */}
                <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13px] font-semibold hover:bg-[#F5F6F8] transition-colors shadow-sm shrink-0"
                    >
                        <i className="mdi mdi-arrow-left text-[18px]" />
                        {tr("common.back")}
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("postOnboarding.project")}</h1>
                        <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("postOnboarding.projectConsoleSettings")}</p>
                    </div>
                </header>

                {/* Empty / not-found state */}
                <Card padding="lg" className="flex flex-col items-center justify-center text-center py-16 md:py-24">
                    <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5">
                        <i className="mdi mdi-folder-remove text-[#BDBDBD] text-[34px]" />
                    </div>
                    <h2 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("postOnboarding.projectNotFound")}</h2>
                    <p className="text-[#757575] text-[14px] max-w-xs mx-auto mb-7">
                        {tr("postOnboarding.projectNotFoundDesc")}
                    </p>
                    <Button variant="secondary" icon="arrow_back" onClick={() => window.history.back()}>
                        {tr("postOnboarding.goBack")}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <ProjectForm projectId={id} initialData={project} />
        </div>
    );
}
