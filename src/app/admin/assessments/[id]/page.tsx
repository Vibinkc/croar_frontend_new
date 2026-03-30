"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface Candidate {
    id: number;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        profile_image: string | null;
    };
    score: number;
    total_questions: number;
    percentage: number;
    completed_at: string;
    status: string;
}

interface AssessmentDetails {
    id: number;
    title: string;
    description: string;
    time_limit_minutes: number;
    question_count: number;
}

export default function AssessmentCandidatesPage() {
    const params = useParams();
    const router = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [gradeFilter, setGradeFilter] = useState("All Grades");

    useEffect(() => {
        if (params.id) {
            fetchCandidates(params.id as string);
            fetchAssessmentDetails(params.id as string);
        }
    }, [params]);

    const fetchAssessmentDetails = async (id: string) => {
        try {
            const res = await apiClient.get(`/api/v1/assessments/${id}`);
            if (res.ok) {
                const data = await res.json();
                setAssessment(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCandidates = async (id: string) => {
        try {
            const res = await apiClient.get(`/api/v1/assessments/${id}/candidates`);
            if (res.ok) {
                const data = await res.json();
                setCandidates(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getGradingBadge = (percentage: number) => {
        if (percentage >= 80) return <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest border border-slate-300">Expert</span>;
        if (percentage >= 50) return <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">Intermediate</span>;
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-100">Beginner</span>;
    };

    const getRatingStars = (percentage: number) => {
        const stars = Math.round((percentage / 100) * 5);
        return (
            <div className="flex text-slate-800 text-sm">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-icons-outlined text-base">
                        {i < stars ? "star" : "star_border"}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) return <div>Loading...</div>;

    const getGrade = (percentage: number) => {
        if (percentage >= 80) return "Expert";
        if (percentage >= 50) return "Intermediate";
        return "Beginner";
    };

    const filteredCandidates = candidates.filter(candidate => {
        // Search Filter
        const fullName = `${candidate.user.first_name} ${candidate.user.last_name}`.toLowerCase();
        const email = candidate.user.email.toLowerCase();
        const search = searchTerm.toLowerCase();
        const matchesSearch = fullName.includes(search) || email.includes(search);

        // Status Filter
        const matchesStatus = statusFilter === "All Status" || candidate.status === statusFilter;

        // Grade Filter
        const grade = getGrade(candidate.percentage);
        const matchesGrade = gradeFilter === "All Grades" || grade === gradeFilter;

        return matchesSearch && matchesStatus && matchesGrade;
    });

    const handleExport = () => {
        if (!filteredCandidates.length) return;

        // Create CSV headers
        const headers = ["Candidate", "Email", "Score", "Total Questions", "Percentage", "Grade", "Status", "Completed At"];

        // Map data to rows
        const rows = filteredCandidates.map(c => [
            `${c.user.first_name} ${c.user.last_name}`,
            c.user.email,
            c.score,
            c.total_questions,
            `${c.percentage}%`,
            getGrade(c.percentage),
            c.status,
            c.completed_at
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(val => `"${val}"`).join(","))
        ].join("\n");

        // Create blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${assessment?.title || "Assessment"}_Candidates.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                <Link href="/admin/assessments" className="hover:text-slate-900 transition-colors">Assessments</Link>
                <span className="material-icons-outlined text-sm">chevron_right</span>
                <span className="text-slate-900">{assessment?.title || "Candidates"}</span>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{assessment?.title}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            {filteredCandidates.length} Candidates
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            {assessment?.time_limit_minutes} MINS
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span className="material-icons-outlined text-lg">download</span>
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative">
                        <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 w-64"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        >
                            <option>All Status</option>
                            <option>Completed</option>
                            <option>In Progress</option>
                        </select>
                        <select
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        >
                            <option>All Grades</option>
                            <option>Expert</option>
                            <option>Intermediate</option>
                            <option>Beginner</option>
                        </select>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Grading</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 shrink-0 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold overflow-hidden">
                                            {candidate.user.first_name[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-slate-900">{candidate.user.first_name} {candidate.user.last_name}</div>
                                            <div className="text-xs font-medium text-slate-400">{candidate.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-black text-slate-900">{candidate.percentage}%</div>
                                    <div className="text-[10px] font-bold text-slate-400">{candidate.score}/{candidate.total_questions} Pts</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getGradingBadge(candidate.percentage)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getRatingStars(candidate.percentage)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-pulse"></span>
                                        {candidate.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                                        <Link href={`/admin/students/${candidate.user.id}`} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="View Profile">
                                            <span className="material-icons-outlined text-lg">open_in_new</span>
                                        </Link>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                            <span className="material-icons-outlined text-lg">more_horiz</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <span className="material-icons-outlined text-4xl mb-2 opacity-50">people_outline</span>
                                        <p className="text-sm font-medium">No candidates have taken this assessment yet.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
