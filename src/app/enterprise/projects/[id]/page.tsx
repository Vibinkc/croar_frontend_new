"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import ProjectForm from "@/components/enterprise/ProjectForm";
import { Button, Card } from "@/components/ds";

export default function ProjectDetailsPage() {
    const params = useParams();
    const { token } = useAuth();
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
                <div className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-[#E8EAED] rounded-[8px] animate-pulse" />
                        <div className="h-3.5 w-32 bg-[#EFF0F2] rounded-[6px] animate-pulse" />
                    </div>
                    <div className="h-9 w-32 bg-[#E8EAED] rounded-[10px] animate-pulse shrink-0" />
                </div>

                {/* Tabs skeleton */}
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-9 w-24 bg-[#E8EAED] rounded-[10px] animate-pulse" />
                    ))}
                </div>

                {/* Body skeleton */}
                <Card padding="lg" className="border-t-[3px] border-t-[#5B53E0] min-h-[420px] space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <div className="h-3 w-24 bg-[#EFF0F2] rounded-[6px] animate-pulse" />
                            <div className="h-12 bg-[#F4F5F7] rounded-[10px] animate-pulse" />
                        </div>
                        <div className="space-y-2.5">
                            <div className="h-3 w-24 bg-[#EFF0F2] rounded-[6px] animate-pulse" />
                            <div className="h-12 bg-[#F4F5F7] rounded-[10px] animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        <div className="h-3 w-24 bg-[#EFF0F2] rounded-[6px] animate-pulse" />
                        <div className="h-24 bg-[#F4F5F7] rounded-[10px] animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2.5">
                                <div className="h-3 w-20 bg-[#EFF0F2] rounded-[6px] animate-pulse" />
                                <div className="h-12 bg-[#F4F5F7] rounded-[10px] animate-pulse" />
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
                <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-white border border-[#E1E4E8] text-[#374151] text-[13px] font-semibold hover:bg-[#F4F5F7] transition-colors shadow-sm shrink-0"
                    >
                        <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                        Back
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Project</h1>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Project console &amp; settings</p>
                    </div>
                </header>

                {/* Empty / not-found state */}
                <Card padding="lg" className="flex flex-col items-center justify-center text-center py-16 md:py-24">
                    <div className="w-16 h-16 bg-[#F4F5F7] rounded-[16px] flex items-center justify-center mb-5">
                        <span className="material-symbols-rounded text-[#C7CCD4] text-[34px]">folder_off</span>
                    </div>
                    <h2 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15171C] mb-2">Project Not Found</h2>
                    <p className="text-[#8A929E] text-[14px] max-w-xs mx-auto mb-7">
                        The project you are looking for does not exist or has been deleted.
                    </p>
                    <Button variant="secondary" icon="arrow_back" onClick={() => window.history.back()}>
                        Go Back
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
