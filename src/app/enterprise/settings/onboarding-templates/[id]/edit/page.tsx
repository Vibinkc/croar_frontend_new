"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import OnboardingTemplateForm from "@/components/enterprise/OnboardingTemplateForm";
import { BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function EditOnboardingTemplatePage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [template, setTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id && token) {
            fetchTemplate();
        }
    }, [id, token]);

    const fetchTemplate = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplate(data);
            }
        } catch (error) {
            console.error("Error fetching template:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#FDFDFF]">
                <div className="animate-spin material-icons-outlined text-indigo-500 text-6xl">sync</div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-10 bg-[#FDFDFF]">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 mb-6">
                    <span className="material-icons-outlined text-5xl text-rose-500">error_outline</span>
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-900">Template Not Found</h4>
                    <Link href="/enterprise/settings/onboarding-templates" className="text-indigo-600 hover:underline mt-4 inline-block font-black text-xs  ">Back to Templates</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#FDFDFF] font-sans">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10">
                <Link 
                    href="/enterprise/settings/onboarding-templates"
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                >
                    <span className="material-icons-outlined">arrow_back</span>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Template</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Update your custom onboarding flow.</p>
                </div>
            </div>

            <OnboardingTemplateForm template={template} />
        </div>
    );
}
