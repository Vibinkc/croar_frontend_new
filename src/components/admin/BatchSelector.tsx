"use client";

import { useEffect, useState } from "react";
import { useDivision } from "@/context/DivisionContext";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";

export default function BatchSelector() {
    const { role, batch: userBatch } = useAuth();
    const { selectedDivisionId, selectedDepartmentId, selectedBatch, setSelectedBatch } = useDivision();
    const [batches, setBatches] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (role !== "STUDENT") {
            fetchBatches(selectedDivisionId, selectedDepartmentId);
        }
    }, [role, selectedDivisionId, selectedDepartmentId]);

    const fetchBatches = async (divId: number | null, deptId: number | null) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (divId) params.append("division_id", divId.toString());
            if (deptId) params.append("department_id", deptId.toString());

            const res = await apiClient.get(`/api/v1/hierarchy/batches?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setBatches(data);
            }
        } catch (e) {
            console.error("Failed to fetch batches", e);
        } finally {
            setLoading(false);
        }
    };

    const isStaff = role === "STAFF";

    useEffect(() => {
        if (isStaff && userBatch && selectedBatch !== userBatch) {
            setSelectedBatch(userBatch);
        }
    }, [isStaff, userBatch, selectedBatch, setSelectedBatch]);

    if (role === "STUDENT" || (batches.length === 0 && !loading)) return null;

    const displayedBatches = isStaff && userBatch
        ? batches.filter(b => b === userBatch)
        : batches;

    // For non-staff (Admin, Sub-Admin), always show the selector if batches exist
    if (!isStaff && batches.length === 0 && !loading) return null;
    if (isStaff && displayedBatches.length === 0 && !loading) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-sm pointer-events-none">
                    event_repeat
                </span>
                <select
                    value={selectedBatch || ""}
                    onChange={(e) => {
                        if (isStaff) return; // Prevent change if staff (though UI should reflect this)
                        const val = e.target.value;
                        setSelectedBatch(val ? val : null);
                    }}
                    disabled={isStaff}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-12 pr-10 py-2.5 outline-none hover:border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all cursor-pointer min-w-[150px] disabled:cursor-default"
                >
                    {!isStaff && <option value="" className="text-slate-500 font-bold">All Batches</option>}
                    {displayedBatches.map((b) => (
                        <option key={b} value={b}>
                            {b}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                    <span className="material-icons-outlined text-slate-400 text-sm">expand_more</span>
                </div>
            </div>
        </div>
    );
}
