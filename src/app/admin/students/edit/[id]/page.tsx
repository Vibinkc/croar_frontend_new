"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("STUDENT");
    const [password, setPassword] = useState("");
    const [batch, setBatch] = useState("");
    const [memberId, setMemberId] = useState("");
    const { batch: creatorBatch } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await apiClient.get(`/api/v1/users/users/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setEmail(data.email);
                    setFirstName(data.first_name);
                    setLastName(data.last_name);
                    setRole(data.role);
                    setBatch(data.batch || "");
                    setMemberId(data.member_id || "");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            email,
            first_name: firstName,
            last_name: lastName,
            role,
            password: password || undefined,
            batch: batch || null,
            member_id: memberId || null
        };

        try {
            const res = await apiClient.put(`/api/v1/users/users/${id}`, payload);

            if (res.ok) {
                router.push("/admin/students");
            } else {
                alert("Failed to update operative");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating operative");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Retrieving Operative Credentials...</div>;

    return (
        <div className="bg-white shadow sm:rounded-3xl p-8 max-w-2xl mx-auto border border-slate-100 mt-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <span className="material-icons-outlined text-2xl">manage_accounts</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sync Operative Profile</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matrix ID: USR_{id.padStart(4, '0')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed opacity-60"
                    />
                    <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Email cannot be modified after account creation</p>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Access Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                    >
                        <option value="STUDENT">Student (Operative)</option>
                        <option value="ADMIN">Administrator</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Member ID / Registration ID</label>
                    <input
                        type="text"
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        placeholder="e.g. STU-2024-001"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Batch / Year</label>
                    <input
                        type="text"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        disabled={!!creatorBatch}
                        placeholder="e.g. 2023-2027"
                        className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all ${creatorBatch ? 'bg-slate-100 cursor-not-allowed text-slate-500 opacity-60' : ''}`}
                    />
                    {creatorBatch && (
                        <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider italic">Locked to your assigned batch</p>
                    )}
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Update Password (Leave blank to keep current)</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                    />
                </div>

                <div className="flex justify-end pt-4 gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                        Abort
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                        {saving ? "Deploying..." : "Sync Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
