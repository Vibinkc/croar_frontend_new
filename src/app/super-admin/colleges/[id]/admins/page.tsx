"use client";

import { useEffect, useState, use } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";

interface Admin {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
    is_active: boolean;
}

export default function ManageCollegeAdmins({ params }: { params: Promise<{ id: string }> }) {
    const { id: collegeId } = use(params);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        fetchAdmins();
    }, [collegeId]);

    const fetchAdmins = async () => {
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${collegeId}/admins`);
            if (res.ok) {
                setAdmins(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await apiClient.post(`/api/v1/super-admin/tenants/${collegeId}/admins`, {
                first_name: firstName,
                last_name: lastName,
                email,
                password
            });
            if (res.ok) {
                await fetchAdmins();
                setFirstName("");
                setLastName("");
                setEmail("");
                setPassword("");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create admin");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (adminId: number) => {
        if (!confirm("Are you sure you want to purge this administrator? This will revoke all access immediately.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${collegeId}/admins/${adminId}`);
            if (res.ok || res.status === 204) {
                setAdmins(prev => prev.filter(a => a.id !== adminId));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEdit = async (admin: Admin) => {
        const newFirstName = prompt("Enter new First Name:", admin.first_name);
        if (newFirstName === null) return;
        const newLastName = prompt("Enter new Last Name:", admin.last_name);
        if (newLastName === null) return;

        try {
            const res = await apiClient.put(`/api/v1/super-admin/tenants/${collegeId}/admins/${admin.id}`, {
                first_name: newFirstName,
                last_name: newLastName
            });
            if (res.ok) {
                fetchAdmins();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] p-4 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/super-admin/colleges/list" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                                <span className="material-icons-outlined text-sm">arrow_back</span>
                                <span className="text-[10px]  ">Back to List</span>
                            </Link>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter  leading-none">
                            Admin <span className="text-blue-600">Personnel</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold   opacity-70 mt-1">Manage College Administration Staff</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Form */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                            <h2 className="text-sm font-black   mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-blue-500">person_add</span>
                                Add New Admin
                            </h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400   ml-1">First Name</label>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={firstName} onChange={e => setFirstName(e.target.value)} required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400   ml-1">Last Name</label>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={lastName} onChange={e => setLastName(e.target.value)} required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400   ml-1">Email / Username</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={email} onChange={e => setEmail(e.target.value)} required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400   ml-1">Secure Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={password} onChange={e => setPassword(e.target.value)} required
                                    />
                                </div>
                                <button
                                    disabled={isCreating}
                                    className="w-full mt-4 bg-slate-900 dark:bg-blue-600 text-white p-5 rounded-3xl text-xs font-black   hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? 'Provisioning...' : 'Add Administrator'}
                                    <span className="material-icons-outlined text-sm">shield</span>
                                </button>
                            </form>
                        </div>
                    </aside>

                    {/* Admin List */}
                    <main className="lg:col-span-2 space-y-4">
                        <h2 className="text-sm font-black   text-slate-400">Current Administrative Staff</h2>
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-400  tracking-[0.3em] font-black animate-pulse">Syncing Staff Records...</div>
                        ) : admins.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 rounded-[3rem] text-center">
                                <p className="text-slate-400 text-sm font-medium">No secondary administrators identified for this college.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {admins.map(admin => (
                                    <div key={admin.id} className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-4 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                            <span className="material-icons-outlined text-2xl text-slate-400">person</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-black  tracking-tight truncate">{admin.first_name} {admin.last_name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold truncate">{admin.email}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black   rounded-full">
                                                Active_{admin.role}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(admin)} className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                                                <span className="material-icons-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(admin.id)} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all">
                                                <span className="material-icons-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
