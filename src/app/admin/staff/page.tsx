"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useDivision } from "@/context/DivisionContext";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface Staff {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    department_id: number | null;
    batch: string | null;
    member_id: string | null;
}

export default function StaffPage() {
    const { role } = useAuth();

    return (
        <HierarchyDrilldown
            title={role === "ADMIN" ? "HOD DIRECTORY" : "STAFF DIRECTORY"}
            description={role === "ADMIN" ? "Manage department heads and high-level administrative personnel." : "Manage teaching staff and operational personnel."}
            renderContent={(divisionId, departmentId) => (
                <StaffList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function StaffList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { role } = useAuth();
    const { selectedBatch } = useDivision();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStaff();
    }, [divisionId, departmentId, selectedBatch]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());
            if (selectedBatch) params.append("batch", selectedBatch);

            const res = await apiClient.get(`/api/v1/users/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (role === "SUB_ADMIN") {
                    setStaff(data.filter((u: any) => u.role === "STAFF"));
                } else if (role === "ADMIN") {
                    setStaff(data.filter((u: any) => u.role === "SUB_ADMIN"));
                } else {
                    setStaff(data);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black  tracking-[0.3em] text-slate-400">Syncing_Directory</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end">
                {(role === "ADMIN" || role === "SUB_ADMIN") && (
                    <Link
                        href="/admin/staff/create"
                        className="group bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-indigo-100"
                    >
                        <span className="material-icons-outlined text-base group-hover:rotate-90 transition-transform">add</span>
                        <span className="text-[10px] font-black  ">
                            {role === "ADMIN" ? "Add HOD" : "Add Staff"}
                        </span>
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-[9px] font-black text-slate-400  ">Ecosystem Member</th>
                            <th className="px-6 py-3.5 text-left text-[9px] font-black text-slate-400  ">Member ID</th>
                            <th className="px-6 py-3.5 text-left text-[9px] font-black text-slate-400  ">Batch</th>
                            <th className="px-6 py-3.5 text-left text-[9px] font-black text-slate-400  ">Role_Signature</th>
                            <th className="px-6 py-3.5 text-left text-[9px] font-black text-slate-400  ">Email_Address</th>
                            <th className="px-6 py-3.5 text-left text-[9px] font-black text-slate-400  ">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {staff.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition-all group">
                                <td className="px-6 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-700 text-[10px] border border-slate-200/50 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all transform group-hover:scale-110">
                                            {s.first_name[0]}{s.last_name[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-xs font-black text-slate-900  tracking-tight">{s.first_name} {s.last_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5 whitespace-nowrap">
                                    <div className="text-[10px] font-black text-slate-900  tracking-tight">{s.member_id || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-3.5 whitespace-nowrap">
                                    <div className="text-[10px] font-black text-slate-900  tracking-tight">{s.batch || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-3.5 whitespace-nowrap">
                                    <span className={`text-[9px] font-black   px-2.5 py-1 rounded-full border ${s.role === 'SUB_ADMIN' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        {s.role === 'SUB_ADMIN' ? 'HOD' : 'Staff'}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5 whitespace-nowrap">
                                    <div className="text-[10px] font-black text-slate-400 font-mono">{s.email}</div>
                                </td>
                                <td className="px-6 py-3.5 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 text-[9px] font-black   rounded-full border ${s.is_active ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                        {s.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <span className="material-icons-outlined text-5xl mb-4 opacity-30">person_off</span>
                                        <p className="text-[10px] font-black  tracking-[0.2em]">No_Staff_Found</p>
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
