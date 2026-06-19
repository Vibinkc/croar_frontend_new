"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// One place for every reusable template, instead of four scattered settings pages.
const TEMPLATE_CARDS = [
    {
        label: "Email Templates",
        desc: "Reusable emails for screening, offers, rejections and more.",
        icon: "mail",
        href: "/enterprise/settings/templates",
        permission: "communications:read",
        gradient: "from-indigo-500 to-blue-500",
        glow: "group-hover:shadow-indigo-200",
        accent: "text-indigo-600",
    },
    {
        label: "Assessment Templates",
        desc: "Aptitude / coding test configs with generated questions.",
        icon: "quiz",
        href: "/enterprise/settings/assessments",
        permission: "assessments:read",
        gradient: "from-amber-500 to-orange-500",
        glow: "group-hover:shadow-amber-200",
        accent: "text-amber-600",
    },
    {
        label: "Interview Templates",
        desc: "Structured AI or human interview plans and questions.",
        icon: "psychology",
        href: "/enterprise/settings/interview-templates",
        permission: "interviews:read",
        gradient: "from-emerald-500 to-teal-500",
        glow: "group-hover:shadow-emerald-200",
        accent: "text-emerald-600",
    },
    {
        label: "Onboarding Templates",
        desc: "Form sections, fields and required documents for new hires.",
        icon: "rule",
        href: "/enterprise/settings/onboarding-templates",
        permission: "onboarding:read",
        gradient: "from-violet-500 to-fuchsia-500",
        glow: "group-hover:shadow-violet-200",
        accent: "text-violet-600",
    },
];

export default function TemplatesHubPage() {
    const { canAccess } = useAuth();
    const cards = TEMPLATE_CARDS.filter((c) => canAccess(c.permission));

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                    <span className="material-symbols-rounded text-2xl">dashboard_customize</span>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Templates</h1>
                    <p className="text-sm text-slate-500 font-semibold mt-1.5">All your reusable templates in one place.</p>
                </div>
            </div>

            {cards.length === 0 ? (
                <p className="text-sm text-slate-400 py-16 text-center">You don&apos;t have access to any template types.</p>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                    {cards.map((c) => (
                        <Link
                            key={c.href}
                            href={c.href}
                            className={`group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-2xl ${c.glow} hover:-translate-y-1 transition-all duration-300`}
                        >
                            {/* soft corner glow */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`} />

                            <div className="relative flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                                    <span className="material-symbols-rounded text-[28px]">{c.icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{c.label}</h3>
                                    <p className="text-[13px] text-slate-500 font-semibold mt-1 leading-relaxed">{c.desc}</p>
                                </div>
                            </div>

                            <div className="relative mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className={`text-xs font-black ${c.accent}`}>Manage templates</span>
                                <span className={`material-symbols-rounded ${c.accent} group-hover:translate-x-1 transition-transform`}>arrow_forward</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Tip strip */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <span className="material-symbols-rounded">smart_toy</span>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">Croar Pilot creates these for you</p>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        When the AI builds a hiring pipeline, it auto-generates role-specific email, assessment, interview and onboarding templates — they all show up here.
                    </p>
                </div>
                <Link
                    href="/enterprise/croar-pilot"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0"
                >
                    <span className="material-symbols-rounded text-base">smart_toy</span>
                    Open Croar Pilot
                </Link>
            </div>
        </div>
    );
}
