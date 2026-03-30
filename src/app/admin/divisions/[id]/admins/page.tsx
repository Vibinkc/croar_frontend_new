"use client";

import { useEffect, useState, use, useRef } from "react";
import { apiClient } from "@/utils/api";

interface DivisionAdmin {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
    is_active: boolean;
    member_id?: string | null;
}

export default function DivisionAdminsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: divisionId } = use(params);
    const [admins, setAdmins] = useState<DivisionAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [memberId, setMemberId] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, [divisionId]);

    const fetchAdmins = async () => {
        try {
            const res = await apiClient.get(`/api/v1/hierarchy/divisions/${divisionId}/admins`);
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        try {
            const res = await apiClient.post(`/api/v1/hierarchy/divisions/${divisionId}/admins`, {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                role: "ADMIN",
                division_id: parseInt(divisionId),
                member_id: memberId
            });

            if (res.ok) {
                setShowCreateModal(false);
                // Reset form
                setFirstName("");
                setLastName("");
                setEmail("");
                setPassword("");
                setMemberId("");
                fetchAdmins();
            } else {
                const data = await res.json();
                alert(data.detail || "Failed to create admin");
            }
        } catch (e) {
            console.error(e);
            alert("Error creating admin");
        }
    };

    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Using direct fetch for multipart/form-data
            // Note: In this project, token is usually in a cookie named "auth_"
            const Cookies = (await import("js-cookie")).default;
            const token = Cookies.get("auth_");

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/hierarchy/divisions/${divisionId}/admins/bulk`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token || ""}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Successfully created ${data.created} admins. ${data.errors.length} errors.`);
                if (data.errors.length > 0) {
                    console.error("Bulk upload errors:", data.errors);
                }
                fetchAdmins();
            } else {
                const errorData = await res.json();
                alert(errorData.detail || "Bulk upload failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error during bulk upload");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (loading) return <div className="p-8">Loading admins...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">DIVISION ADMINS</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Credentials for this Division</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleBulkUpload}
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-white border border-slate-200 text-slate-400 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
                    >
                        <span className="material-icons-outlined text-base">upload_file</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? "Uploading..." : "Bulk Upload"}</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md"
                    >
                        <span className="material-icons-outlined text-base">add</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Create Admin</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {admins.map((admin) => (
                    <div key={admin.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-slate-200">
                                {admin.first_name[0]}
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${admin.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {admin.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-base font-black text-slate-900 tracking-tight">{admin.first_name} {admin.last_name}</h3>
                            <p className="text-xs font-bold text-slate-400">{admin.email}</p>
                            {admin.member_id && (
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {admin.member_id}</p>
                            )}

                            <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2">
                                <button className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Create Division Admin</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Registration ID / Staff ID</label>
                                <input
                                    type="text"
                                    value={memberId}
                                    onChange={(e) => setMemberId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                                    placeholder="e.g. AD-2024-001"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateAdmin}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                                >
                                    Create Admin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
