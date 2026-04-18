"use client";

import React from "react";
import OnboardingTemplateForm from "@/components/enterprise/OnboardingTemplateForm";
import Link from "next/link";

export default function CreateOnboardingTemplatePage() {
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Template</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Design a new custom onboarding flow.</p>
                </div>
            </div>

            <OnboardingTemplateForm />
        </div>
    );
}
