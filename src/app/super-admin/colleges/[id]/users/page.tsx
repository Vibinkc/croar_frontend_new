"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { useRouter, useParams } from "next/navigation";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
}

export default function CollegeUserManagement() {
    const { id } = useParams();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New User State
    const [newUser, setNewUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "STUDENT"
    });

    useEffect(() => {
        fetchUsers();
    }, [id]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${id}/users`);
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiClient.post(`/api/v1/super-admin/tenants/${id}/users`, newUser);
            if (res.ok) {
                setShowModal(false);
                fetchUsers();
                setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "STUDENT" });
            } else {
                alert("Failed to create user");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}/users/${userId}`);
            if (res.ok) {
                fetchUsers();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <span className="material-icons-outlined text-slate-500">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">User Management</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connect ID: {id}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Add User
                    </button>
                </header>

                {isLoading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div></div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-6">
                                            <div className="font-bold text-slate-700">{u.first_name} {u.last_name}</div>
                                        </td>
                                        <td className="p-6 text-sm font-medium text-slate-500">{u.email}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' :
                                                u.role === 'SUPER_ADMIN' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <button onClick={() => handleDelete(u.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                                <span className="material-icons-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="p-12 text-center text-slate-400 font-medium text-sm italic">No users found for this college.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-3xl p-8 animate-in zoom-in-95">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-6">Create User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="First Name" className="p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} required />
                                <input placeholder="Last Name" className="p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} required />
                            </div>
                            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            <select className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="STUDENT">Student</option>
                                <option value="ADMIN">Admin</option>
                                <option value="FACULTY">Faculty</option>
                            </select>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px]">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
