"use client";

import { useEffect, useState, useRef } from "react";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import { useAuth } from "@/context/AuthContext";

interface Department {
    id: number;
    name: string;
}

export default function DepartmentSelector() {
    const { role, departmentId, divisionId } = useAuth();
    const { selectedDivisionId, setSelectedDivisionId, selectedDepartmentId, setSelectedDepartmentId } = useDivision();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const INITIAL_DISPLAY_COUNT = 5;

    useEffect(() => {
        // For HOD/Staff, auto-set their department and division and don't load list
        if (role === "SUB_ADMIN" || role === "STAFF") {
            if (divisionId) setSelectedDivisionId(divisionId);
            if (departmentId) setSelectedDepartmentId(departmentId);
            return;
        }

        if (selectedDivisionId) {
            fetchDepartments(selectedDivisionId);
        } else {
            setDepartments([]);
            setSelectedDepartmentId(null);
        }
    }, [selectedDivisionId, role, departmentId, divisionId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowAll(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchDepartments = async (divId: number) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/hierarchy/departments?division_id=${divId}`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (e) {
            console.error("Failed to fetch departments", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDepartment = (deptId: number | null) => {
        setSelectedDepartmentId(deptId);
        setIsOpen(false);
        setShowAll(false);
    };

    // Show if a division is selected (either by global filter or inherently by Division Admin role)
    // BUT hide for HOD/Staff as they are locked to one department
    if (!selectedDivisionId || role === "SUB_ADMIN" || role === "STAFF") return null;

    const selectedDept = departments.find(d => d.id === selectedDepartmentId);
    const displayedDepartments = showAll ? departments : departments.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = departments.length > INITIAL_DISPLAY_COUNT;

    return (
        <div className="flex items-center gap-2">
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none hover:border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all cursor-pointer min-w-[200px] ${loading ? 'opacity-50' : ''}`}
                    disabled={loading}
                >
                    <span className="material-icons-outlined text-sm text-slate-400">domain</span>
                    <span className="flex-1 text-left truncate">
                        {selectedDept ? selectedDept.name : "All Departments"}
                    </span>
                    <span className="material-icons-outlined text-sm text-slate-400">
                        {isOpen ? "expand_less" : "expand_more"}
                    </span>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[300px] overflow-y-auto">
                            {/* All Departments Option */}
                            <button
                                onClick={() => handleSelectDepartment(null)}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 ${!selectedDepartmentId ? "bg-slate-100 text-slate-900" : "text-slate-600"
                                    }`}
                            >
                                <span className="material-icons-outlined text-sm">apps</span>
                                All Departments
                            </button>

                            {/* Department List */}
                            {displayedDepartments.map((dept) => (
                                <button
                                    key={dept.id}
                                    onClick={() => handleSelectDepartment(dept.id)}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 ${selectedDepartmentId === dept.id ? "bg-slate-100 text-slate-900" : "text-slate-600"
                                        }`}
                                >
                                    <span className="material-icons-outlined text-sm">school</span>
                                    {dept.name}
                                </button>
                            ))}

                            {/* More Button */}
                            {hasMore && !showAll && (
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors border-t border-slate-100 flex items-center gap-2"
                                >
                                    <span className="material-icons-outlined text-sm">expand_more</span>
                                    More ({departments.length - INITIAL_DISPLAY_COUNT} more)
                                </button>
                            )}

                            {/* Show Less Button */}
                            {showAll && hasMore && (
                                <button
                                    onClick={() => setShowAll(false)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors border-t border-slate-100 flex items-center gap-2"
                                >
                                    <span className="material-icons-outlined text-sm">expand_less</span>
                                    Show Less
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
