"use client";

import React from "react";
import Link from "next/link";
import { useGuide } from "./GuideProvider";
import { useLocalStorage } from "./storage";

/** Getting-started checklist. Links go to the action that completes each step. */
const CHECKLIST: { id: string; label: string; href: string }[] = [
    { id: "company", label: "Set up your company profile", href: "/enterprise/settings" },
    { id: "job", label: "Post your first job", href: "/enterprise/jobs/create" },
    { id: "employees", label: "Add your employees", href: "/enterprise/employees/add" },
    { id: "survey", label: "Launch a survey or 360", href: "/enterprise/surveys/new" },
    { id: "payroll", label: "Configure payroll", href: "/enterprise/payroll/settings" },
];

/**
 * Persistent Help launcher: a floating "?" button that opens a panel with a
 * Getting-Started checklist, keyboard shortcuts, and a button to replay the tour.
 * The whole onboarding system is re-findable from here.
 */
export function HelpButton() {
    const { startTour, helpOpen, setHelpOpen, setGuideOpen } = useGuide();
    const [done, setDone] = useLocalStorage<Record<string, boolean>>("croar.guide.checklist.v1", {});
    const completed = CHECKLIST.filter((i) => done[i.id]).length;

    return (
        <>
            {helpOpen && (
                <>
                    {/* click-away catcher */}
                    <div className="fixed inset-0 z-[55]" onClick={() => setHelpOpen(false)} aria-hidden />

                    <div className="fixed bottom-[84px] right-5 z-[60] w-[340px] max-w-[calc(100vw-28px)] bg-white rounded-[16px] border border-[#E8EAED] shadow-[0_22px_60px_rgba(15,23,42,0.24)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-5 pt-5 pb-4 bg-[#0E1014] text-white relative">
                            <div
                                className="absolute inset-0 opacity-70"
                                style={{ background: "radial-gradient(120% 120% at 100% 0%, rgba(91,83,224,0.45), transparent 60%)" }}
                            />
                            <div className="relative">
                                <h3 className="text-[15.5px] font-bold">Help &amp; getting started</h3>
                                <p className="text-[12px] text-white/55 mt-0.5">Find your way around Croar.</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            <button
                                onClick={() => { setHelpOpen(false); setGuideOpen(true); }}
                                className="w-full flex items-center gap-3 p-3 rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/40 hover:bg-[#FAFAFE] transition-all text-left"
                            >
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-[20px]">menu_book</span>
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-bold text-[#15171C]">Browse the full guide</span>
                                    <span className="block text-[11.5px] text-[#8A929E]">Every module &amp; workflow, explained in detail.</span>
                                </span>
                            </button>

                            <button
                                onClick={startTour}
                                className="w-full flex items-center gap-3 p-3 rounded-[12px] border border-[#E8EAED] hover:border-[#5B53E0]/40 hover:bg-[#FAFAFE] transition-all text-left"
                            >
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-[20px]">play_circle</span>
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-bold text-[#15171C]">Take the product tour</span>
                                    <span className="block text-[11.5px] text-[#8A929E]">A 30-second walkthrough of the basics.</span>
                                </span>
                            </button>

                            <div>
                                <div className="flex items-center justify-between mb-2 px-0.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#8A929E]">Getting started</span>
                                    <span className="text-[11px] font-semibold text-[#5B53E0]">{completed}/{CHECKLIST.length}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {CHECKLIST.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2.5">
                                            <button
                                                onClick={() => setDone((d) => ({ ...d, [item.id]: !d[item.id] }))}
                                                aria-label={done[item.id] ? "Mark incomplete" : "Mark complete"}
                                                className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors ${done[item.id] ? "bg-[#5B53E0] border-[#5B53E0] text-white" : "border-[#CBD0D8] text-transparent hover:border-[#5B53E0]"}`}
                                            >
                                                <span className="material-symbols-rounded text-[15px]">check</span>
                                            </button>
                                            <Link
                                                href={item.href}
                                                onClick={() => setHelpOpen(false)}
                                                className={`flex-1 text-[13px] py-1.5 transition-colors ${done[item.id] ? "text-[#9AA3AF] line-through" : "text-[#374151] hover:text-[#5B53E0]"}`}
                                            >
                                                {item.label}
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#8A929E] block mb-2 px-0.5">Tips</span>
                                <div className="rounded-[12px] bg-[#F7F8FA] border border-[#E8EAED] p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#374151]">Search &amp; jump to anything</span>
                                        <kbd className="text-[10.5px] font-bold bg-white border border-[#E1E4E8] text-[#6B6F76] rounded-[5px] px-1.5 h-5 inline-flex items-center">⌘K</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#374151]">Close dialogs &amp; this tour</span>
                                        <kbd className="text-[10.5px] font-bold bg-white border border-[#E1E4E8] text-[#6B6F76] rounded-[5px] px-1.5 h-5 inline-flex items-center">Esc</kbd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <button
                data-tour="help"
                onClick={() => setHelpOpen(!helpOpen)}
                aria-label="Help"
                title="Help & getting started"
                className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-[#5B53E0] text-white shadow-[0_10px_28px_rgba(91,83,224,0.4)] hover:bg-[#4A43C9] transition-colors flex items-center justify-center"
            >
                <span className="material-symbols-rounded text-[24px]">{helpOpen ? "close" : "question_mark"}</span>
            </button>
        </>
    );
}
