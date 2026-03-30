"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { useDivision } from "@/context/DivisionContext";
import HierarchyDrilldown from "@/components/admin/HierarchyDrilldown";

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    batch?: string | null;
    member_id?: string | null;
}

export default function UsersPage() {
    return (
        <HierarchyDrilldown
            title="USER DATABASE"
            description="Manage operative profiles, monitor activity, and regulate access control."
            renderContent={(divisionId, departmentId) => (
                <UserList divisionId={divisionId} departmentId={departmentId} />
            )}
        />
    );
}

function UserList({ divisionId, departmentId }: { divisionId: number | null, departmentId: number | null }) {
    const { selectedBatch } = useDivision();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [divisionId, departmentId, selectedBatch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("role", "STUDENT");
            if (divisionId) params.append("division_id", divisionId.toString());
            if (departmentId) params.append("department_id", departmentId.toString());
            if (selectedBatch) params.append("batch", selectedBatch);

            const res = await apiClient.get(`/api/v1/users/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this operative?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/users/users/${id}`);
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing_Database</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => {
                        if (!users.length) return;
                        const headers = ["ID", "First Name", "Last Name", "Email", "Batch", "Role", "Status"];
                        const rows = users.map(u => [u.id, u.first_name, u.last_name, u.email, u.batch || "N/A", u.role, u.is_active ? "Active" : "Inactive"]);
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "Students_List.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="bg-white border border-slate-200 text-slate-400 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all shadow-sm"
                >
                    <span className="material-icons-outlined text-lg">download</span>
                    Export CSV
                </button>
                <Link
                    href="/admin/staff/create"
                    className="group bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-indigo-100"
                >
                    <span className="material-icons-outlined text-lg group-hover:rotate-90 transition-transform">add</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Operative</span>
                </Link>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th scope="col" className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Operative
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Member_ID
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Batch
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Email_Address
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Status
                            </th>
                            <th scope="col" className="relative px-3 py-2">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-all group">
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 font-black text-xs border border-slate-200/50 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all transform group-hover:scale-110">
                                            {user.first_name[0]}{user.last_name[0]}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.first_name} {user.last_name}</div>

                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{user.member_id || 'N/A'}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{user.batch || 'N/A'}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-[11px] font-black text-slate-400 font-mono">{user.email}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <span style={{ fontSize: '9px' }} className={`px-3 py-1.5 inline-flex font-black uppercase tracking-widest rounded-full border ${user.is_active
                                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                                        : 'bg-slate-50 text-slate-300 border-slate-100'
                                        }`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-5">
                                        <Link href={`/admin/students/edit/${user.id}`} className="text-slate-300 hover:text-slate-900 transition-all hover:scale-125">
                                            <span className="material-icons-outlined">edit</span>
                                        </Link>
                                        <Link href={`/admin/students/${user.id}`} className="text-slate-300 hover:text-slate-900 transition-all hover:scale-125" title="View Activity">
                                            <span className="material-icons-outlined">visibility</span>
                                        </Link>
                                        <button onClick={() => handleDelete(user.id)} className="text-slate-200 hover:text-rose-500 transition-all hover:scale-125">
                                            <span className="material-icons-outlined">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <span className="material-icons-outlined text-5xl mb-4 opacity-30">database_off</span>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No_Operatives_Found</p>
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
