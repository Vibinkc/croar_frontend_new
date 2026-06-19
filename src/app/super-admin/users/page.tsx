"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion } from "framer-motion";
import { 
    Users, 
    Search, 
    RefreshCcw, 
    Mail, 
    Calendar, 
    Shield, 
    MoreVertical,
    Building,
    UserCheck,
    UserX,
    Filter
} from "lucide-react";

interface UserRecord {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
    company_id: string;
}

export default function GlobalUsersPage() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const toggleUserStatus = async (userId: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/users/${userId}/toggle-status`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
                setActiveDropdown(null);
            }
        } catch (e) {
            console.error("Failed to toggle status", e);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to permanently delete this user?")) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/users/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
                setActiveDropdown(null);
            }
        } catch (e) {
            console.error("Failed to delete user", e);
        }
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                <div className="h-96 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            className="p-8 space-y-6 animate-in fade-in duration-700"
            onClick={() => setActiveDropdown(null)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    setActiveDropdown(null);
                }
            }}
        >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global Users</h1>
                        <p className="text-slate-500 text-sm font-medium">Monitoring {users.length} self-registered accounts</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={fetchUsers}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <button className="h-12 px-5 bg-slate-900 text-white rounded-xl flex items-center gap-2 font-bold text-xs shadow-xl transition-transform hover:scale-105 active:scale-95">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Organization ID</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Joined Date</th>
                                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map((user, idx) => (
                                <motion.tr 
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-indigo-50/30 transition-colors group"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                                {user.first_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-slate-300" />
                                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                {user.company_id?.split('-')[0]}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {user.is_active ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <UserCheck className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-tight">Active</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                                <UserX className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-tight">Disabled</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar className="w-4 h-4 text-slate-300" />
                                            <span className="text-xs font-semibold">
                                                {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Toggle Status Button */}
                                            <button 
                                                onClick={() => toggleUserStatus(user.id)}
                                                title={user.is_active ? "Deactivate User" : "Activate User"}
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                                                    user.is_active 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white" 
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-indigo-600 hover:text-white"
                                                }`}
                                            >
                                                {user.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                            </button>

                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => deleteUser(user.id)}
                                                title="Delete Permanently"
                                                className="w-9 h-9 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                                            >
                                                <span className="material-symbols-rounded text-sm">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
