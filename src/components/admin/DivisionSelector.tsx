"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import { useAuth } from "@/context/AuthContext";

interface Division {
    id: number;
    name: string;
    slug: string;
}

export default function DivisionSelector() {
    const { role, divisionId } = useAuth();
    const { selectedDivisionId, setSelectedDivisionId } = useDivision();
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (divisionId) {
            // Division Admin: Force selection and don't load list
            setSelectedDivisionId(divisionId);
            setLoading(false);
            return;
        }

        // Only fetch if admin (assuming only admins can switch divs)
        if (role === "ADMIN") {
            fetchDivisions();
        } else {
            setLoading(false);
        }
    }, [role, divisionId]);

    const fetchDivisions = async () => {
        try {
            const res = await apiClient.get("/api/v1/hierarchy/divisions");
            if (res.ok) {
                const data = await res.json();
                setDivisions(data);
            }
        } catch (e) {
            console.error("Failed to fetch divisions", e);
        } finally {
            setLoading(false);
        }
    };

    if (role !== "ADMIN" || loading) return null;

    // If divisionId is set (Division Admin), we don't show the selector (or we could show it disabled)
    // The user wants "in the filter there should be dep of their division".
    // If we hide this, only DepartmentSelector will show. That seems correct.
    if (divisionId) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-sm pointer-events-none">
                    account_balance
                </span>
                <select
                    value={selectedDivisionId || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDivisionId(val ? Number(val) : null);
                    }}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 outline-none hover:border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all cursor-pointer min-w-[200px]"
                >
                    <option value="" className="text-slate-500 font-bold">All Divisions</option>
                    {divisions.map((div) => (
                        <option key={div.id} value={div.id}>
                            {div.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                    <span className="material-icons-outlined text-slate-400 text-sm">expand_more</span>
                </div>
            </div>
        </div>
    );
}
