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
        bgColor: "bg-[#E3F2FD]",
        iconColor: "text-[#1976D2]",
        borderColor: "border-[#BBDEFB]/80",
    },
    {
        labelKey: "general.assessmentTemplates",
        descKey: "general.assessmentTemplatesDesc",
        icon: "quiz",
        href: "/enterprise/templates/assessments",
        permission: "assessments:read",
        bgColor: "bg-[#FEF3C7]",
        iconColor: "text-[#EF6C00]",
        borderColor: "border-[#FDE68A]/80",
    },
    {
        labelKey: "general.interviewTemplates",
        descKey: "general.interviewTemplatesDesc",
        icon: "psychology",
        href: "/enterprise/templates/interview-templates",
        permission: "interviews:read",
        bgColor: "bg-[#E8F5E9]",
        iconColor: "text-[#2E7D32]",
        borderColor: "border-[#C8E6C9]/80",
    },
    {
        labelKey: "general.onboardingTemplates",
        descKey: "general.onboardingTemplatesDesc",
        icon: "rule",
        href: "/enterprise/templates/onboarding-templates",
        permission: "onboarding:read",
        bgColor: "bg-[#F3F9FE]",
        iconColor: "text-[#42A5F5]",
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
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("general.templatesHub")}</h1>
                        <PageHelp title={tr("general.templatesHelpTitle")}>
                            <p>{tr("general.templatesHelpBody")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("general.templatesSubtitle")}</p>
                </div>
            </header>

            {cards.length === 0 ? (
                <div className="py-16 text-center border border-[#E0E0E0] rounded-[4px] bg-white shadow-sm">
                    <p className="text-[13.5px] text-[#757575] font-medium">{tr("general.noTemplateAccess")}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {cards.map((c) => (
                        <Link
                            key={c.href}
                            href={c.href}
                            className="group bg-white border border-[#E0E0E0] hover:border-[#1976D2]/40 rounded-[4px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-11 h-11 rounded-[4px] ${c.bgColor} ${c.iconColor} ${c.borderColor} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                    <span className="material-symbols-rounded text-[22px]">{c.icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[15px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors">{tr(c.labelKey)}</h3>
                                    <p className="text-[13px] text-[#616161] font-medium mt-1 leading-relaxed">{tr(c.descKey)}</p>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-[#E0E0E0] flex items-center justify-between text-[#757575] group-hover:text-[#1976D2] transition-colors">
                                <span className="text-[12.5px] font-semibold">{tr("general.manageTemplates")}</span>
                                <span className="material-symbols-rounded text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Tip strip */}
            <div className="rounded-[4px] border border-[#BBDEFB]/60 bg-[#E3F2FD]/40 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-[4px] bg-white border border-[#E0E0E0] flex items-center justify-center text-[#1976D2] shadow-sm shrink-0">
                    <span className="material-symbols-rounded text-[20px]">smart_toy</span>
                </div>
                <div className="flex-1">
                    <p className="text-[13.5px] font-bold text-[#212121]">{tr("general.croarPilotCreates")}</p>
                    <p className="text-[12.5px] text-[#616161] font-medium mt-0.5">
                        {tr("general.croarPilotCreatesBody")}
                    </p>
                </div>
                <Link
                    href="/enterprise/croar-pilot"
                    className="h-9 px-4 rounded-[4px] bg-[#1976D2] text-white text-[12.5px] font-semibold hover:bg-[#1565C0] transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                    <span className="material-symbols-rounded text-[16px]">smart_toy</span>
                    <span>{tr("general.openCroarPilot")}</span>
                </Link>
            </div>
        </div>
    );
}
