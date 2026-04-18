"use client";

import { useState, useEffect } from "react";
import { useDivision } from "@/context/DivisionContext";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface Division {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface HierarchyDrilldownProps {
    title: string;
    description?: string;
    renderContent: (divId: number | null, deptId: number | null) => React.ReactNode;
    allowDivisionOverview?: boolean;
}

export default function HierarchyDrilldown({ title, description, renderContent, allowDivisionOverview }: HierarchyDrilldownProps) {
    const { selectedDivisionId: globalDivId } = useDivision();
    const { role } = useAuth();

    const [localDivId, setLocalDivId] = useState<number | null>(null);
    const [localDeptId, setLocalDeptId] = useState<number | null>(null);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Sync with global division filter
    useEffect(() => {
        if (globalDivId) {
            setLocalDivId(globalDivId);
            setLocalDeptId(null); // Reset department when division changes globally
        } else {
            setLocalDivId(null);
            setLocalDeptId(null);
        }
    }, [globalDivId]);

    // Fetch Divisions
    useEffect(() => {
        const fetchDivs = async () => {
            try {
                const res = await apiClient.get("/api/v1/hierarchy/divisions");
                if (res.ok) setDivisions(await res.json());
            } catch (e) {
                console.error("Failed to fetch divisions", e);
            }
        };
        fetchDivs();
    }, []);

    // Fetch Departments when division selection changes
    useEffect(() => {
        const fetchDepts = async () => {
            if (!localDivId) {
                setDepartments([]);
                return;
            }
            setLoading(true);
            try {
                const res = await apiClient.get(`/api/v1/hierarchy/departments?division_id=${localDivId}`);
                if (res.ok) setDepartments(await res.json());
            } catch (e) {
                console.error("Failed to fetch departments", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDepts();
    }, [localDivId]);

    const activeDiv = divisions.find(d => d.id === localDivId);
    const activeDept = departments.find(d => d.id === localDeptId);

    // If it's a Sub-Admin or Staff, they skip the drill-down usually because they are locked to a department.
    // However, the user wants this "properly for all pages". 
    // If role != ADMIN, they don't even see the DivisionSelector usually.
    // But let's handle it: If they have a department_id, we just show content.
    // For now, assume this is primarily for the ADMIN (Principal) view.

    if (role !== "ADMIN") {
        return renderContent(null, null); // Backend handles its own isolation
    }

    // STATE 1: Select Division
    if (!localDivId) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                    {description && <p className="text-sm text-slate-500">{description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {divisions.map((div, index) => {
                        const variants = [
                            { text: "text-[var(--color-primary)]", bg: "bg-indigo-50/30", border: "hover:border-[var(--color-primary)]", icon: "text-[var(--color-primary)]", iconBg: "bg-indigo-50", shadow: "hover:shadow-indigo-100/50" },
                            { text: "text-[var(--color-secondary)]", bg: "bg-purple-50/30", border: "hover:border-[var(--color-secondary)]", icon: "text-[var(--color-secondary)]", iconBg: "bg-purple-50", shadow: "hover:shadow-purple-100/50" },
                            { text: "text-blue-600", bg: "bg-blue-50/30", border: "hover:border-blue-600", icon: "text-blue-600", iconBg: "bg-blue-50", shadow: "hover:shadow-blue-100/50" },
                            { text: "text-slate-600", bg: "bg-slate-50/30", border: "hover:border-slate-400", icon: "text-slate-600", iconBg: "bg-slate-100", shadow: "hover:shadow-slate-200/50" },
                        ];
                        const variant = variants[index % variants.length];
                        return (
                            <button
                                key={div.id}
                                onClick={() => setLocalDivId(div.id)}
                                className={`flex flex-col p-5 ${variant.bg} border border-transparent ${variant.border} rounded-2xl ${variant.shadow} transition-all text-left group relative overflow-hidden`}
                            >
                                <div className={`h-10 w-10 ${variant.iconBg} rounded-xl flex items-center justify-center mb-3 ${variant.text} group-hover:scale-110 transition-all`}>
                                    <span className="material-icons-outlined text-xl">account_balance</span>
                                </div>
                                <h3 className="font-bold text-base text-slate-900 z-10">{div.name}</h3>
                                <p className={`text-[9px] font-black ${variant.text}   mt-0.5 z-10`}>College Division</p>
                                <div className={`absolute -bottom-3 -right-3 opacity-5 ${variant.text} group-hover:opacity-10 transition-all duration-500`}>
                                    <span className="material-icons-outlined text-6xl">account_balance</span>
                                </div>
                            </button>
                        );
                    })}
                    {divisions.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No divisions found</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // STATE 2: Select Department (Skip if division overview is allowed)
    if (localDivId && !localDeptId && !allowDivisionOverview) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <nav className="flex items-center gap-2 text-xs font-black   text-slate-400">
                    <button onClick={() => setLocalDivId(null)} className="hover:text-black transition-all">All Colleges</button>
                    <span className="material-icons-outlined text-sm">chevron_right</span>
                    <span className="text-black">{activeDiv?.name}</span>
                </nav>

                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">Select Department</h2>
                    <p className="text-sm text-slate-500">Choose a department in {activeDiv?.name} to view {title.toLowerCase()}.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept, index) => {
                        const variants = [
                            { text: "text-[var(--color-primary)]", bg: "bg-indigo-50/30", border: "hover:border-[var(--color-primary)]", icon: "text-[var(--color-primary)]", iconBg: "bg-indigo-50", shadow: "hover:shadow-indigo-100/50" },
                            { text: "text-[var(--color-secondary)]", bg: "bg-purple-50/30", border: "hover:border-[var(--color-secondary)]", icon: "text-[var(--color-secondary)]", iconBg: "bg-purple-50", shadow: "hover:shadow-purple-100/50" },
                            { text: "text-blue-600", bg: "bg-blue-50/30", border: "hover:border-blue-600", icon: "text-blue-600", iconBg: "bg-blue-50", shadow: "hover:shadow-blue-100/50" },
                            { text: "text-slate-600", bg: "bg-slate-50/30", border: "hover:border-slate-400", icon: "text-slate-600", iconBg: "bg-slate-100", shadow: "hover:shadow-slate-200/50" },
                        ];
                        const variant = variants[index % variants.length];
                        return (
                            <button
                                key={dept.id}
                                onClick={() => setLocalDeptId(dept.id)}
                                className={`flex flex-col p-5 ${variant.bg} border border-transparent ${variant.border} rounded-2xl ${variant.shadow} transition-all text-left group relative overflow-hidden`}
                            >
                                <div className={`h-10 w-10 ${variant.iconBg} rounded-xl flex items-center justify-center mb-3 ${variant.text} group-hover:scale-110 transition-all`}>
                                    <span className="material-icons-outlined text-xl">school</span>
                                </div>
                                <h3 className="font-bold text-base text-slate-900 z-10">{dept.name}</h3>
                                <p className={`text-[9px] font-black ${variant.text}   mt-0.5 z-10`}>Academic Department</p>
                                <div className={`absolute -bottom-3 -right-3 opacity-5 ${variant.text} group-hover:opacity-10 transition-all duration-500`}>
                                    <span className="material-icons-outlined text-6xl">school</span>
                                </div>
                            </button>
                        );
                    })}
                    {!loading && departments.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No departments found for this division</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // STATE 3: Final Content
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <nav className="flex items-center gap-2 text-xs font-black   text-slate-400">
                <button
                    onClick={() => { setLocalDivId(null); setLocalDeptId(null); }}
                    className="hover:text-black transition-all"
                    disabled={!!globalDivId} // Disable if global filter is locked
                >
                    All Colleges
                </button>
                <span className="material-icons-outlined text-sm">chevron_right</span>
                <button onClick={() => setLocalDeptId(null)} className="hover:text-black transition-all">{activeDiv?.name}</button>
                {activeDept && (
                    <>
                        <span className="material-icons-outlined text-sm">chevron_right</span>
                        <span className="text-black">{activeDept?.name}</span>
                    </>
                )}
            </nav>

            {renderContent(localDivId, localDeptId)}
        </div>
    );
}
