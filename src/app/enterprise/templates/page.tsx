"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { PageHelp } from "@/components/ds";

// Reusable template cards styled under the design system rules.
const TEMPLATE_CARDS = [
    {
        labelKey: "general.emailTemplates",
        descKey: "general.emailTemplatesDesc",
        icon: "mail",
        href: "/enterprise/templates/email-templates",
        permission: "communications:read",
        bgColor: "bg-[#ECEBFB]",
        iconColor: "text-[#5B53E0]",
        borderColor: "border-[#DAD7F6]/80",
    },
    {
        labelKey: "general.assessmentTemplates",
        descKey: "general.assessmentTemplatesDesc",
        icon: "quiz",
        href: "/enterprise/templates/assessments",
        permission: "assessments:read",
        bgColor: "bg-[#FEF3C7]",
        iconColor: "text-[#D97706]",
        borderColor: "border-[#FDE68A]/80",
    },
    {
        labelKey: "general.interviewTemplates",
        descKey: "general.interviewTemplatesDesc",
        icon: "psychology",
        href: "/enterprise/templates/interview-templates",
        permission: "interviews:read",
        bgColor: "bg-[#E3F4EF]",
        iconColor: "text-[#0E8A6E]",
        borderColor: "border-[#BFF0E2]/80",
    },
    {
        labelKey: "general.onboardingTemplates",
        descKey: "general.onboardingTemplatesDesc",
        icon: "rule",
        href: "/enterprise/templates/onboarding-templates",
        permission: "onboarding:read",
        bgColor: "bg-[#F5F3FF]",
        iconColor: "text-[#8B5CF6]",
        borderColor: "border-[#EBE7FF]/80",
    },
];

export default function TemplatesHubPage() {
    const { canAccess } = useAuth();
    const { t: tr } = useI18n();
    const cards = TEMPLATE_CARDS.filter((c) => canAccess(c.permission));

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">{tr("general.templatesHub")}</h1>
                        <PageHelp title={tr("general.templatesHelpTitle")}>
                            <p>{tr("general.templatesHelpBody")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("general.templatesSubtitle")}</p>
                </div>
            </header>

            {cards.length === 0 ? (
                <div className="py-16 text-center border border-[#E8EAED] rounded-[14px] bg-white shadow-sm">
                    <p className="text-[13.5px] text-[#8A929E] font-medium">{tr("general.noTemplateAccess")}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {cards.map((c) => (
                        <Link
                            key={c.href}
                            href={c.href}
                            className="group bg-white border border-[#E8EAED] hover:border-[#5B53E0]/40 rounded-[14px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-11 h-11 rounded-[10px] ${c.bgColor} ${c.iconColor} ${c.borderColor} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                    <span className="material-symbols-rounded text-[22px]">{c.icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[15px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">{tr(c.labelKey)}</h3>
                                    <p className="text-[13px] text-[#6B6F76] font-medium mt-1 leading-relaxed">{tr(c.descKey)}</p>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-[#E8EAED] flex items-center justify-between text-[#8A929E] group-hover:text-[#5B53E0] transition-colors">
                                <span className="text-[12.5px] font-semibold">{tr("general.manageTemplates")}</span>
                                <span className="material-symbols-rounded text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Tip strip */}
            <div className="rounded-[14px] border border-[#DAD7F6]/60 bg-[#ECEBFB]/40 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-white border border-[#E8EAED] flex items-center justify-center text-[#5B53E0] shadow-sm shrink-0">
                    <span className="material-symbols-rounded text-[20px]">smart_toy</span>
                </div>
                <div className="flex-1">
                    <p className="text-[13.5px] font-bold text-[#15171C]">{tr("general.croarPilotCreates")}</p>
                    <p className="text-[12.5px] text-[#6B6F76] font-medium mt-0.5">
                        {tr("general.croarPilotCreatesBody")}
                    </p>
                </div>
                <Link
                    href="/enterprise/croar-pilot"
                    className="h-9 px-4 rounded-[10px] bg-[#5B53E0] text-white text-[12.5px] font-semibold hover:bg-[#4A43C9] transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                    <span className="material-symbols-rounded text-[16px]">smart_toy</span>
                    <span>{tr("general.openCroarPilot")}</span>
                </Link>
            </div>
        </div>
    );
}
