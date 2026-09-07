"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import ProjectForm from "@/components/enterprise/ProjectForm";
import Link from "next/link";

export default function EditProjectPage() {
    const params = useParams();
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
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
            } else if (res.status === 404) {
                router.push("/404");
            }
        } catch (error) {
            console.error("Error fetching project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <div className="w-10 h-10 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-10 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-[#F5F6F8] rounded-[4px] flex items-center justify-center mb-5">
                    <span className="material-symbols-rounded text-[#BDBDBD] text-[32px]">error</span>
                </div>
                <h2 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121]">{tr("general.projectNotFound")}</h2>
                <p className="text-[14px] text-[#757575] max-w-sm mt-2">{tr("general.projectNotFoundDesc")}</p>
                <Link
                    href="/enterprise/projects"
                    className="mt-7 inline-flex items-center gap-2 h-[42px] px-5 rounded-[4px] bg-white border border-[#E0E0E0] text-[#424242] text-[13.5px] font-semibold hover:bg-[#F5F6F8] transition-colors"
                >
                    <span className="material-symbols-rounded text-[19px]">arrow_back</span>
                    {tr("general.backToProjects")}
                </Link>
            </div>
        );
    }

    return <ProjectForm projectId={id} initialData={project} />;
}
