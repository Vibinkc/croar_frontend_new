"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface Division {
    id: number;
    name: string;
    slug: string;
}

export default function DivisionsPage() {
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            const res = await apiClient.get("/api/v1/hierarchy/divisions");
            if (res.ok) {
                const data = await res.json();
                setDivisions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading divisions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-0.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">COLLEGE DIVISIONS</h1>
                <p className="text-[10px] font-bold text-[var(--color-primary)]  ">Academic Portfolio Management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                {divisions.map((division) => {
                    return (
                        <Link
                            key={division.id}
                            href={`/admin/divisions/${division.id}/admins`}
                            className="flex flex-col p-5 bg-white border border-slate-200 rounded-3xl hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-indigo-100 transition-all text-left group"
                        >
                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                                <span className="material-icons-outlined text-xl text-slate-600 group-hover:text-white">account_balance</span>
                            </div>
                            <h3 className="font-bold text-base text-slate-900">{division.name}</h3>
                            <p className="text-[10px] text-slate-500  font-black  mt-0.5">College Division</p>
                        </Link>
                    );
                })}
            </div>

            {divisions.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed">
                    <span className="material-icons-outlined text-4xl text-slate-300 mb-4 block">inventory_2</span>
                    <p className="text-slate-400 font-bold  text-xs ">No academic divisions found.</p>
                </div>
            )}
        </div>
    );
}
