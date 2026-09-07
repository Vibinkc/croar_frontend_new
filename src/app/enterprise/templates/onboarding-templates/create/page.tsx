"use client";

import React from "react";
import OnboardingTemplateForm from "@/components/enterprise/OnboardingTemplateForm";
import Link from "next/link";
import { useI18n } from "@/context/I18nContext";

export default function CreateOnboardingTemplatePage() {
    const { t: tr } = useI18n();
    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#FDFEFF] font-sans">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10">
                <Link 
                    href="/enterprise/templates/onboarding-templates"
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                >
                    <i className="mdi mdi-arrow-left" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{tr("templatesMgmt.createTemplate")}</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">{tr("templatesMgmt.createOnboardingSubtitle")}</p>
                </div>
            </div>

            <OnboardingTemplateForm />
        </div>
    );
}
