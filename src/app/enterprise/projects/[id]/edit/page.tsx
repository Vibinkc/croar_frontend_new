"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import ProjectForm from "@/components/enterprise/ProjectForm";
import Link from "next/link";

export default function EditProjectPage() {
    const params = useParams();
    const { token } = useAuth();
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
            <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-slate-50/10">
                <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-10">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <span className="material-symbols-rounded text-slate-400 text-3xl">error</span>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Project Not Found</h2>
                <p className="text-sm font-medium text-slate-500 max-w-sm mt-2">The project you are looking for does not exist or has been deleted.</p>
                <Link 
                    href="/enterprise/projects"
                    className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                >Back to Projects</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30">
            <div className="p-4 sm:p-6">
                <Link 
                    href="/enterprise/projects"
                    className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-[#7C3AED] transition-colors mb-6 uppercase tracking-widest"
                >
                    <span className="material-symbols-rounded text-sm">arrow_back</span>{""}
                    Back to Projects
                </Link>
                <ProjectForm projectId={id} initialData={project} />
            </div>
        </div>
    );
}
