"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

interface Job {
    id: string;
    title: string;
}

interface Candidate {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    skills: string[];
    created_at: string;
    resume_url?: string;
    applied_jobs?: { id: string; title: string }[];
    parsed_data?: any;
}

const CandidateProfileModal = ({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) => {
    const details = candidate.parsed_data || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{candidate.full_name}</h2>
                        <div className="flex flex-col gap-1.5 mt-2 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-base text-slate-400">email</span>
                                {candidate.email}
                            </div>
                            {candidate.phone && (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-rounded text-base text-slate-400">call</span>
                                    {candidate.phone}
                                </div>
                            )}
                            {details.location && (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-rounded text-base text-slate-400">location_on</span>
                                    {details.location}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Resume Action */}
                    {candidate.resume_url && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-500">
                                    <span className="material-symbols-rounded">picture_as_pdf</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Resume.pdf</h3>
                                    <p className="text-xs text-slate-500">Uploaded {new Date(candidate.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(candidate.resume_url, '_blank')}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                View Resume
                            </button>
                        </div>
                    )}

                    {/* Applied Jobs */}
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                            <span className="material-symbols-rounded text-indigo-500 text-lg">work</span>
                            Applied Jobs
                        </h3>
                        {candidate.applied_jobs && candidate.applied_jobs.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {candidate.applied_jobs.map((job, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                        {job.title}
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic">No specific jobs linked (General Pool)</p>
                        )}
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                                <span className="material-symbols-rounded text-emerald-500 text-lg">code</span>
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-bold shadow-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Parsed Details (if available, e.g. experience) */}
                    {details.experience && (
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                                <span className="material-symbols-rounded text-amber-500 text-lg">history</span>
                                Experience
                            </h3>
                            {Array.isArray(details.experience) ? (
                                <div className="space-y-3">
                                    {details.experience.map((exp: any, i: number) => (
                                        <div key={i} className="relative pl-4 border-l-2 border-slate-100">
                                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white"></div>
                                            <h4 className="text-sm font-bold text-slate-800">{exp.title || "Role"}</h4>
                                            <p className="text-xs text-slate-500 font-medium">{exp.company || "Company"}</p>
                                            {exp.dates && <p className="text-[10px] text-slate-400 mt-0.5">{exp.dates}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{String(details.experience)}</p>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default function AllCandidatesPage() {
    const { token } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
    const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [appsRes, jobsRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/v1/enterprise/applications/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);

            if (appsRes.ok) {
                const appsData = await appsRes.json();

                // Create a map of jobs for quick lookup since app.job might be missing
                // Need to use the jobsData we just fetched, but it's inside the if block above.
                // Wait, jobsData is scoped to the if block? No, let's declare it outside.
                // Actually, let's just use the jobs state setter but we need the raw data here.
                // Ah, looking at previous code: `const jobsData = await jobsRes.json();` is inside `if (jobsRes.ok)`.
                // So I need access to `jobsData`.

                // Let's restructure slightly to ensure we have access.
                let currentJobs: Job[] = [];
                if (jobsRes.ok) {
                    currentJobs = await jobsRes.json();
                    setJobs(currentJobs);
                }

                // Group by candidate to avoid duplicates and aggregate jobs
                const jobsMap = new Map(currentJobs.map((j: any) => [j.id, j]));
                const candidateMap = new Map<string, Candidate>();

                appsData.forEach((app: any) => {
                    const cand = app.candidate;
                    if (!candidateMap.has(cand.id)) {
                        candidateMap.set(cand.id, {
                            ...cand,
                            applied_jobs: []
                        });
                    }

                    // Use job_requirement_id to find the job details
                    const jobId = app.job_requirement_id;
                    if (jobId && jobsMap.has(jobId)) {
                        const jobInfo = jobsMap.get(jobId);
                        const candidateEntry = candidateMap.get(cand.id);

                        // Avoid adding duplicate jobs for the same candidate
                        if (candidateEntry && !candidateEntry.applied_jobs?.some(j => j.id === jobId)) {
                            candidateEntry.applied_jobs?.push({
                                id: jobId,
                                title: jobInfo.title
                            });
                        }
                    }
                });

                setCandidates(Array.from(candidateMap.values()));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesJob = selectedJobId === "ALL" || candidate.applied_jobs?.some(job => job.id === selectedJobId);

        return matchesSearch && matchesJob;
    });

    return (
        <div className="p-6 space-y-6 pt-2 animate-in fade-in duration-500">
            {/* Header / Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-6 px-6 py-5 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-6 w-full xl:w-auto">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Bank</h1>
                        <p className="text-xs text-slate-500 font-medium">{filteredCandidates.length} Active Profiles</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden xl:block"></div>

                    {/* Job Filter */}
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer"
                        >
                            <option value="ALL">All Jobs</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                        <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-4 w-full xl:w-auto justify-end">
                    {/* Search */}
                    <div className="flex-1 max-w-md relative group">
                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#7C3AED] transition-colors">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, email, or skills..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 focus:bg-white focus:border-[#7C3AED] transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[calc(100vh-12rem)]">
                {isLoading ? (
                    <div className="p-6 space-y-4 flex-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-slate-50 h-16 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <span className="material-symbols-rounded text-3xl text-slate-300">group_off</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No Candidates Found</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            Try adjusting your filters or search query.
                        </p>
                    </div>
                ) : (
                    <div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applied For</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Skills</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCandidates.map(candidate => (
                                    <tr key={candidate.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 text-[#7C3AED] flex items-center justify-center font-bold text-xs border border-indigo-100/50 shadow-sm">
                                                    {candidate.full_name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-[#7C3AED] transition-colors">{candidate.full_name}</span>
                                                    <span className="text-xs text-slate-500 font-medium">{candidate.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {candidate.applied_jobs && candidate.applied_jobs.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {candidate.applied_jobs.slice(0, 2).map((job, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 truncate max-w-[150px]">
                                                            {job.title}
                                                        </span>
                                                    ))}
                                                    {candidate.applied_jobs.length > 2 && (
                                                        <span className="inline-flex items-center px-1.5 py-1 rounded-md bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-100">+{candidate.applied_jobs.length - 2}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">General Pool</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {candidate.skills?.slice(0, 3).map((s, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                                                        {s}
                                                    </span>
                                                ))}
                                                {candidate.skills && candidate.skills.length > 3 && (
                                                    <span className="text-[10px] font-bold text-slate-400 self-center">+{candidate.skills.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {candidate.resume_url && (
                                                    <button
                                                        onClick={() => window.open(candidate.resume_url, '_blank')}
                                                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5"
                                                    >
                                                        <span className="material-symbols-rounded text-sm">description</span>
                                                        Resume
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setViewCandidate(candidate)}
                                                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold hover:bg-[#7C3AED]/20 transition-all flex items-center gap-1.5"
                                                >
                                                    Open Profile
                                                    <span className="material-symbols-rounded text-sm">arrow_forward</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {viewCandidate && (
                    <CandidateProfileModal candidate={viewCandidate} onClose={() => setViewCandidate(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
