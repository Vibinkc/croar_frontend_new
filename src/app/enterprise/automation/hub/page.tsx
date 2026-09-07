"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { PageHelp } from "@/components/ds";

export default function AutomationHubPage() {
    const { canAccess } = useAuth();
    const { t: tr } = useI18n();

    const modules = [
        {
            id: "canvas",
            label: tr("automation.canvasTitle"),
            icon: "account_tree",
            path: "/enterprise/automation",
            description: tr("automation.descCanvas"),
            permission: "automation:read",            color: "indigo"
        },
        {
            id: "mail",
            label: tr("automation.mailTitle"),
            icon: "mark_email_unread",
            path: "/enterprise/automation/mail",
            description: tr("automation.descMail"),
            permission: "communications:moderate",            color: "blue"
        },
        {
            id: "assessment",
            label: tr("automation.assessmentTitle"),
            icon: "psychology",
            path: "/enterprise/automation/assessment",
            description: tr("automation.descAssessment"),
            permission: "assessments:moderate",            color: "amber"
        },
        {
            id: "interview",
            label: tr("automation.interviewTitle"),
            icon: "event_available",
            path: "/enterprise/automation/interview",
            description: tr("automation.descInterview"),
            permission: "interviews:moderate",            color: "emerald"
        },
        {
            id: "onboarding",
            label: tr("automation.onboardingTitle"),
            icon: "person_add",
            path: "/enterprise/automation/onboarding",
            description: tr("automation.descOnboarding"),
            permission: "onboarding:moderate",            color: "purple"
        }
    ].filter(m => canAccess(m.permission));

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 bg-[#FAFAFA] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1E88E5]/10 flex items-center justify-center shrink-0 shadow-sm shadow-[#1E88E5]/5">
                        <span className="material-symbols-rounded text-[#1E88E5] text-2xl">settings_suggest</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{tr("automation.hubTitle")}</h1>
                            <PageHelp title={tr("automation.hubTitle")}>
                                <p>{tr("automation.hubHelp")}</p>
                            </PageHelp>
                        </div>
                        <p className="text-slate-500 text-[13px] font-medium mt-1">
                            {tr("automation.hubSubtitle")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Hub Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tr("automation.colModule")}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tr("automation.colPurpose")}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tr("automation.status")}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{tr("automation.colAccess")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {modules.map((module) => (
                                <tr key={module.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                                                module.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                                module.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                                module.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                                module.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                                'bg-purple-50 text-purple-600'
                                            }`}>
                                                <span className="material-symbols-rounded text-xl">{module.icon}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 leading-tight">{module.label}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{tr("automation.systemModule")}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-500 max-w-md">
                                            {module.description}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* Tiles are already filtered to modules the user can access, so "Available"
                                            is an honest, static indicator — there's no real per-module health signal,
                                            so we don't fake a live "Operational/Active" pulse. */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">{tr("automation.availableStatus")}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link 
                                            href={module.path}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-black hover:border-[#1E88E5] hover:text-[#1E88E5] transition-all shadow-sm active:scale-95 group-hover:shadow-indigo-100 group-hover:shadow-md"
                                        >
                                            {tr("automation.openModule")}
                                            <span className="material-symbols-rounded text-base">arrow_forward</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-rounded text-indigo-600">lightbulb</span>
                        <h3 className="text-sm font-black text-indigo-900">{tr("automation.efficiencyTip")}</h3>
                    </div>
                    <p className="text-[11px] text-indigo-700/80 font-medium leading-relaxed">
                        {tr("automation.tip1")}
                    </p>
                </div>
                <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-rounded text-emerald-600">bolt</span>
                        <h3 className="text-sm font-black text-emerald-900">{tr("automation.instantExecution")}</h3>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed">
                        {tr("automation.tip2")}
                    </p>
                </div>
                <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-rounded text-amber-600">auto_awesome</span>
                        <h3 className="text-sm font-black text-amber-900">{tr("automation.aiOptimization")}</h3>
                    </div>
                    <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                        {tr("automation.tip3")}
                    </p>
                </div>
            </div>
        </div>
    );
}
