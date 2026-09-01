"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";
import { Badge, Card, cn } from "@/components/ds";

/**
 * The Sourcing tab's landing view: one card per way of getting candidates onto this job.
 *
 * This is navigation, not content — each card hands back to the job detail page, which already
 * owns the panels (Profile Sourcing, AI Recommendations) and the publish modal. Keeping it
 * presentational is what stops this from becoming a second copy of those screens.
 */

export type SourcingDestination = "career_page" | "job_boards" | "sourcing_hub" | "recommendations";

interface Channel {
    id: SourcingDestination;
    icon: string;
    /** i18n key suffixes under `jobSourcing.` */
    titleKey: string;
    descKey: string;
    /** Tailwind classes for the icon chip. */
    chip: string;
    /** Shown when the channel is live for this job. */
    live?: boolean;
}

export default function JobSourcingTab({
    isPublished,
    onNavigate,
}: {
    /** Whether the job is already live on the public career page. */
    isPublished: boolean;
    onNavigate: (destination: SourcingDestination) => void;
}) {
    const { t: tr } = useI18n();

    const channels: Channel[] = [
        {
            id: "career_page",
            icon: "public",
            titleKey: "careerPage",
            descKey: "careerPageDesc",
            chip: "bg-[#E7ECFB] text-[#3559C7]",
            live: isPublished,
        },
        {
            id: "job_boards",
            icon: "campaign",
            titleKey: "jobBoards",
            descKey: "jobBoardsDesc",
            chip: "bg-[#FEF3E2] text-[#D97706]",
        },
        {
            id: "sourcing_hub",
            icon: "travel_explore",
            titleKey: "sourcingHub",
            descKey: "sourcingHubDesc",
            chip: "bg-[#ECEBFB] text-[#5B53E0]",
        },
        {
            id: "recommendations",
            icon: "auto_awesome",
            titleKey: "recommendations",
            descKey: "recommendationsDesc",
            chip: "bg-[#E3F4EF] text-[#0E8A6E]",
        },
    ];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-[15px] font-bold text-[#15171C]">{tr("jobSourcing.title")}</h3>
                <p className="text-[12.5px] text-[#8A929E] mt-0.5">{tr("jobSourcing.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels.map(ch => (
                    <Card
                        key={ch.id}
                        padding="sm"
                        interactive
                        role="button"
                        tabIndex={0}
                        onClick={() => onNavigate(ch.id)}
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onNavigate(ch.id);
                            }
                        }}
                        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B53E0]/40"
                    >
                        <div className="flex items-start gap-3.5">
                            <span
                                className={cn(
                                    "w-11 h-11 shrink-0 rounded-[12px] flex items-center justify-center",
                                    ch.chip
                                )}
                            >
                                <span className="material-symbols-rounded text-[22px]">{ch.icon}</span>
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-[13.5px] font-bold text-[#15171C]">
                                        {tr(`jobSourcing.${ch.titleKey}`)}
                                    </h4>
                                    {ch.live && (
                                        <Badge tone="success" dot>
                                            {tr("jobSourcing.live")}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[12px] text-[#8A929E] leading-relaxed">
                                    {tr(`jobSourcing.${ch.descKey}`)}
                                </p>
                            </div>
                            <span className="material-symbols-rounded text-[20px] text-[#C3C7CE] shrink-0">
                                chevron_right
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
