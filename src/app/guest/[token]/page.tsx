"use client";

/**
 * What a guest sees. No login, no sidebar, no product chrome — the link is the credential and
 * this is the whole of their access.
 *
 * It sits outside /enterprise on purpose. Everything under that path assumes a logged-in
 * EnterpriseUser and renders the shell around it; a guest has neither, and putting their view
 * inside that tree would mean one missed check away from showing them the nav.
 *
 * The page states its own limits at the bottom. Someone handed a link to a stranger's hiring
 * pipeline should be able to see what they are and are not being shown without asking.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { Icon, cn } from "@/components/ds";

interface Job {
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    candidate_count: number;
}
interface Home {
    guest: { display_name: string; department: string | null; access_level: string };
    company: { name: string | null };
    jobs: Job[];
}
interface Candidate {
    id: string;
    full_name: string;
    total_experience: number | null;
    skills: string[];
    email: string | null;
    phone: string | null;
    status_id: number;
    applied_at: string | null;
}

// The canonical funnel, matching application_statuses. Shown by name because a guest has no
// reason to know what status 4 means.
const STAGES: Record<number, string> = {
    1: "Applied",
    2: "Screening",
    3: "Interview",
    4: "Offer",
    5: "Hired",
    6: "Rejected",
    7: "Withdrawn",
};

const TONE: Record<number, string> = {
    1: "bg-[#EEEEEE] text-[#4F4F4F]",
    2: "bg-[#E3F2FD] text-[#1565C0]",
    3: "bg-[#E3F2FD] text-[#1565C0]",
    4: "bg-[#FFF3E0] text-[#EF6C00]",
    5: "bg-[#E8F5E9] text-[#2E7D32]",
    6: "bg-[#FFEBEE] text-[#C62828]",
    7: "bg-[#EEEEEE] text-[#757575]",
};

export default function GuestPortalPage() {
    const params = useParams<{ token: string }>();
    const token = params.token;

    const [home, setHome] = useState<Home | null>(null);
    const [dead, setDead] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openJob, setOpenJob] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loadingCands, setLoadingCands] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/guest-portal/${token}`);
            if (!res.ok) { setDead(true); return; }
            setHome(await res.json());
        } catch {
            setDead(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { void load(); }, [load]);

    const openCandidates = async (jobId: string) => {
        if (openJob === jobId) { setOpenJob(null); return; }
        setOpenJob(jobId);
        setLoadingCands(true);
        setCandidates([]);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/guest-portal/${token}/jobs/${jobId}/candidates`);
            if (res.ok) setCandidates((await res.json()).candidates || []);
        } finally {
            setLoadingCands(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
            </main>
        );
    }

    if (dead || !home) {
        return (
            <main className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4">
                <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-8 max-w-[420px] text-center">
                    <Icon name="link-off" className="text-[40px] text-[#BDBDBD]" />
                    <h1 className="text-[18px] font-medium text-[#212121] mt-3">This link is no longer valid</h1>
                    <p className="text-[13.5px] text-[#757575] mt-2 leading-relaxed">
                        It may have been revoked, or replaced by a newer one. Ask whoever invited you to send a fresh link.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F5F6F8]">
            <header className="h-[56px] bg-[#1976D2] text-white flex items-center px-6">
                <span className="text-[17px] font-medium">{home.company.name || "Hiring"}</span>
                <span className="ml-auto text-[13px] text-white/85">{home.guest.display_name}</span>
            </header>

            <div className="max-w-[900px] mx-auto px-6 py-6">
                <h1 className="text-[22px] font-medium text-[#212121]">
                    {home.guest.department ? `${home.guest.department} roles` : "Shared with you"}
                </h1>
                <p className="text-[13.5px] text-[#757575] mt-1">
                    {home.jobs.length === 1
                        ? "1 job has been shared with you."
                        : `${home.jobs.length} jobs have been shared with you.`}
                </p>

                {home.jobs.length === 0 ? (
                    <div className="mt-5 bg-white border border-[#E0E0E0] rounded-[4px] p-8 text-center">
                        <Icon name="briefcase-outline" className="text-[36px] text-[#BDBDBD]" />
                        <p className="text-[14px] text-[#212121] mt-2">Nothing has been shared yet</p>
                        <p className="text-[13px] text-[#757575] mt-1">
                            Your access is set up, but there are no jobs in it right now.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 flex flex-col gap-3">
                        {home.jobs.map((j) => (
                            <div key={j.id} className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => void openCandidates(j.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#FAFCFE] transition-colors"
                                >
                                    <span className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center shrink-0">
                                        <Icon name="briefcase-outline" className="text-[22px]" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[15px] font-medium text-[#212121]">{j.title}</span>
                                        <span className="block text-[12.5px] text-[#757575]">
                                            {[j.department, j.location].filter(Boolean).join(" · ") || "—"}
                                        </span>
                                    </span>
                                    <span className="text-[13px] text-[#616161] tabular-nums shrink-0">
                                        {j.candidate_count === 1 ? "1 candidate" : `${j.candidate_count} candidates`}
                                    </span>
                                    <Icon
                                        name={openJob === j.id ? "chevron-up" : "chevron-down"}
                                        className="text-[22px] text-[#BDBDBD] shrink-0"
                                    />
                                </button>

                                {openJob === j.id && (
                                    <div className="border-t border-[#E0E0E0]">
                                        {loadingCands ? (
                                            <div className="flex justify-center py-8">
                                                <div className="w-5 h-5 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                                            </div>
                                        ) : candidates.length === 0 ? (
                                            <p className="px-4 py-6 text-[13px] text-[#757575] text-center">
                                                Nobody has applied to this one yet.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse min-w-[600px]">
                                                    <thead className="bg-[#F5F6F8] border-b border-[#E0E0E0]">
                                                        <tr>
                                                            {["Candidate", "Experience", "Skills", "Stage"].map((h) => (
                                                                <th key={h} className="py-2 px-4 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#EEEEEE]">
                                                        {candidates.map((c) => (
                                                            <tr key={c.id}>
                                                                <td className="py-2.5 px-4">
                                                                    <span className="block text-[13.5px] text-[#212121]">{c.full_name}</span>
                                                                    <span className="block text-[12px] text-[#757575]">{c.email || "—"}</span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-[12.5px] text-[#616161] tabular-nums">
                                                                    {c.total_experience === null ? "—" : `${c.total_experience} yrs`}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-[12.5px] text-[#616161] max-w-[240px]">
                                                                    {c.skills.length ? c.skills.slice(0, 4).join(", ") : "—"}
                                                                </td>
                                                                <td className="py-2.5 px-4">
                                                                    <span className={cn(
                                                                        "inline-flex rounded-[3px] px-2 py-0.5 text-[11.5px] font-medium uppercase tracking-[0.3px]",
                                                                        TONE[c.status_id] || TONE[1]
                                                                    )}>
                                                                        {STAGES[c.status_id] || "—"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-[11.5px] text-[#757575] mt-6 leading-relaxed">
                    You are viewing this as a guest. You can see the jobs shared with you and who has applied to them.
                    You cannot see other jobs, internal notes, salary information, or anything else in this account.
                    Whoever invited you can withdraw this link at any time.
                </p>
            </div>
        </main>
    );
}
