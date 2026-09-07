"use client";

import React from "react";
import Link from "next/link";
import { useGuide } from "./GuideProvider";
import { useLocalStorage } from "./storage";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

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
    const { t: tr } = useI18n();
    const [done, setDone] = useLocalStorage<Record<string, boolean>>("croar.guide.checklist.v1", {});
    const completed = CHECKLIST.filter((i) => done[i.id]).length;
    const checklistLabels: Record<string, string> = {
        company: tr("sharedUi.checklistCompany"),
        job: tr("sharedUi.checklistJob"),
        employees: tr("sharedUi.checklistEmployees"),
        survey: tr("sharedUi.checklistSurvey"),
        payroll: tr("sharedUi.checklistPayroll"),
    };

    return (
        <>
            {helpOpen && (
                <>
                    {/* click-away catcher */}
                    <div className="fixed inset-0 z-[55]" onClick={() => setHelpOpen(false)} aria-hidden />

                    <div className="fixed bottom-[84px] right-5 z-[60] w-[340px] max-w-[calc(100vw-28px)] bg-white rounded-[4px] border border-[#E0E0E0] shadow-[0_22px_60px_rgba(0,0,0,0.24)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-5 pt-5 pb-4 bg-[#1E2A38] text-white relative">
                            <div
                                className="absolute inset-0 opacity-70"
                                style={{ background: "radial-gradient(120% 120% at 100% 0%, rgba(25,118,210,0.45), transparent 60%)" }}
                            />
                            <div className="relative">
                                <h3 className="text-[15.5px] font-bold">{tr("sharedUi.helpGettingStarted")}</h3>
                                <p className="text-[12px] text-white/55 mt-0.5">{tr("sharedUi.findYourWay")}</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            <button
                                onClick={() => { setHelpOpen(false); setGuideOpen(true); }}
                                className="w-full flex items-center gap-3 p-3 rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 hover:bg-[#FAFCFE] transition-all text-left"
                            >
                                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                    <i className="mdi mdi-book-open-page-variant text-[20px]" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-bold text-[#212121]">{tr("sharedUi.browseFullGuide")}</span>
                                    <span className="block text-[11.5px] text-[#757575]">{tr("sharedUi.everyModuleWorkflow")}</span>
                                </span>
                            </button>

                            <button
                                onClick={startTour}
                                className="w-full flex items-center gap-3 p-3 rounded-[4px] border border-[#E0E0E0] hover:border-[#1976D2]/40 hover:bg-[#FAFCFE] transition-all text-left"
                            >
                                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                    <i className="mdi mdi-play-circle text-[20px]" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-bold text-[#212121]">{tr("sharedUi.takeProductTour")}</span>
                                    <span className="block text-[11.5px] text-[#757575]">{tr("sharedUi.thirtySecondWalkthrough")}</span>
                                </span>
                            </button>

                            <div>
                                <div className="flex items-center justify-between mb-2 px-0.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#757575]">{tr("sharedUi.gettingStarted")}</span>
                                    <span className="text-[11px] font-semibold text-[#1976D2]">{completed}/{CHECKLIST.length}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {CHECKLIST.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2.5">
                                            <button
                                                onClick={() => setDone((d) => ({ ...d, [item.id]: !d[item.id] }))}
                                                aria-label={done[item.id] ? tr("sharedUi.markIncomplete") : tr("sharedUi.markComplete")}
                                                className={`w-5 h-5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${done[item.id] ? "bg-[#1976D2] border-[#1976D2] text-white" : "border-[#CBD0D8] text-transparent hover:border-[#1976D2]"}`}
                                            >
                                                <i className="mdi mdi-check text-[15px]" />
                                            </button>
                                            <Link
                                                href={item.href}
                                                onClick={() => setHelpOpen(false)}
                                                className={`flex-1 text-[13px] py-1.5 transition-colors ${done[item.id] ? "text-[#9E9E9E] line-through" : "text-[#424242] hover:text-[#1976D2]"}`}
                                            >
                                                {checklistLabels[item.id] ?? item.label}
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#757575] block mb-2 px-0.5">{tr("sharedUi.tips")}</span>
                                <div className="rounded-[4px] bg-[#FAFAFA] border border-[#E0E0E0] p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#424242]">{tr("sharedUi.searchJumpAnything")}</span>
                                        <kbd className="text-[10.5px] font-bold bg-white border border-[#E0E0E0] text-[#616161] rounded-[3px] px-1.5 h-5 inline-flex items-center">⌘K</kbd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12.5px] text-[#424242]">{tr("sharedUi.closeDialogsTour")}</span>
                                        <kbd className="text-[10.5px] font-bold bg-white border border-[#E0E0E0] text-[#616161] rounded-[3px] px-1.5 h-5 inline-flex items-center">Esc</kbd>
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
                aria-label={tr("sharedUi.help")}
                title={tr("sharedUi.helpGettingStarted")}
                className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-[#1976D2] text-white shadow-[0_10px_28px_rgba(25,118,210,0.4)] hover:bg-[#1565C0] transition-colors flex items-center justify-center"
            >
                <Icon name={helpOpen ? "close" : "question_mark"} className="text-[24px]" />
            </button>
        </>
    );
}
