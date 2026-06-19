"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AutomationHubPage() {
    const { canAccess } = useAuth();

    const modules = [
        {
            id: "canvas",
            label: "Automation Canvas",
            icon: "account_tree",
            path: "/enterprise/automation",
            description: "Visual workflow builder for end-to-end hiring pipelines.",
            permission: "automation:read",
            status: "Operational",
            color: "indigo"
        },
        {
            id: "mail",
            label: "Mail Automation",
            icon: "mark_email_unread",
            path: "/enterprise/automation/mail",
            description: "Auto-send personalized emails based on candidate stage moves.",
            permission: "communications:moderate",
            status: "Active",
            color: "blue"
        },
        {
            id: "assessment",
            label: "Assessment Automation",
            icon: "psychology",
            path: "/enterprise/automation/assessment",
            description: "Trigger AI-powered technical assessments and cognitive tests.",
            permission: "assessments:moderate",
            status: "Active",
            color: "amber"
        },
        {
            id: "interview",
            label: "Interview Automation",
            icon: "event_available",
            path: "/enterprise/automation/interview",
            description: "Auto-schedule interviews with smart interviewer slot matching.",
            permission: "interviews:moderate",
            status: "Active",
            color: "emerald"
        },
        {
            id: "onboarding",
            label: "Onboarding Automation",
            icon: "person_add",
            path: "/enterprise/automation/onboarding",
            description: "Initiate employee onboarding flows and welcome sequences.",
            permission: "onboarding:moderate",
            status: "Active",
            color: "purple"
        }
    ].filter(m => canAccess(m.permission));

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0 shadow-sm shadow-[#7C3AED]/5">
                        <span className="material-symbols-rounded text-[#7C3AED] text-2xl">settings_suggest</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Automation Management Hub</h1>
                        <p className="text-slate-500 text-[13px] font-medium mt-1">
                            Centralized control for all enterprise automation modules and workflows.
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
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Automation Module</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose & Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Access</th>
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
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">System Module</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-500 max-w-md">
                                            {module.description}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">{module.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link 
                                            href={module.path}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-black hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all shadow-sm active:scale-95 group-hover:shadow-indigo-100 group-hover:shadow-md"
                                        >
                                            {"OPEN MODULE"}
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
                        <h3 className="text-sm font-black text-indigo-900">Efficiency Tip</h3>
                    </div>
                    <p className="text-[11px] text-indigo-700/80 font-medium leading-relaxed">
                        Use the Automation Canvas to visualize the entire sequence of your hiring pipeline before configuring individual rules.
                    </p>
                </div>
                <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-rounded text-emerald-600">bolt</span>
                        <h3 className="text-sm font-black text-emerald-900">Instant Execution</h3>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed">
                        Mail and Assessment automations can be set to &apos;Immediate&apos; to trigger the second a candidate moves to a specific stage.
                    </p>
                </div>
                <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-rounded text-amber-600">auto_awesome</span>
                        <h3 className="text-sm font-black text-amber-900">AI Optimization</h3>
                    </div>
                    <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                        Assessment automation uses AI to generate unique questions based on the job requirements and candidate seniority.
                    </p>
                </div>
            </div>
        </div>
    );
}
