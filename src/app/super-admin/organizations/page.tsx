"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/api";


interface Organization {
    id: string;
    name: string;
    email: string;
    website: string;
    is_active: boolean;
}

function OrganizationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/v1/super-admin/tenants");
            if (res.ok) {
                const data = await res.json();
                setOrganizations(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch organizations", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await apiClient.post("/api/v1/super-admin/tenants", {
                org_data: {
                    name,
                    email,
                    website,
                    is_active: true
                },
                admin_email: adminEmail,
                admin_password: adminPassword
            });

            if (res.ok) {
                alert("Organization created successfully.");
                setName("");
                setEmail("");
                setWebsite("");
                setAdminEmail("");
                setAdminPassword("");
                setIsCreating(false);
                fetchOrganizations();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || "Failed to create organization"}`);
            }
        } catch (e) {
            console.error(e);
            alert("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xs font-black text-slate-400  tracking-[0.2em]">Platform Organizations</h1>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black   hover:bg-slate-800 transition-all shadow-lg"
                >
                    {isCreating ? "View Inventory" : "Register Organization"}
                </button>
            </div>

                {isCreating ? (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                    <span className="material-icons-outlined text-2xl">corporate_fare</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black  tracking-tight text-slate-900">New Organization</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Spin up a new dedicated environment and admin account.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateOrganization} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400   ml-1 mb-1.5 block text-left">Company Name</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
                                            placeholder="Acme Corp"
                                            value={name} onChange={e => setName(e.target.value)} required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400   ml-1 mb-1.5 block text-left">Contact Email</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
                                            placeholder="contact@acme.com"
                                            type="email"
                                            value={email} onChange={e => setEmail(e.target.value)} required
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400   ml-1 mb-1.5 block text-left">Website</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
                                        placeholder="https://acme.corp"
                                        type="url"
                                        value={website} onChange={e => setWebsite(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-900  tracking-[0.2em] mb-4">Organization Admin Account</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400   ml-1 mb-1.5 block text-left">Admin Email</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
                                                placeholder="admin@acme.com"
                                                type="email"
                                                value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400   ml-1 mb-1.5 block text-left">Temp Password</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
                                                placeholder="••••••••"
                                                type="password"
                                                value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={isLoading}
                                    className="w-full text-white p-4 rounded-xl text-xs font-black   bg-slate-900 hover:bg-slate-800 shadow-xl transition-all"
                                >
                                    {isLoading ? "Creating..." : "Create Organization"}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {organizations.map((org: Organization) => (
                                <div key={org.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                            <span className="material-icons-outlined">corporate_fare</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-black   ${org.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {org.is_active ? 'Active' : 'Suspended'}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 line-clamp-1">{org.name}</h3>
                                    <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-1">{org.website || "No website"}</p>
                                    
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">U</div>
                                            ))}
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">+5</div>
                                        </div>
                                        <button className="text-indigo-600 text-xs font-black   hover:underline">
                                            Manage Node
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}

export default function OrganizationsPage() {
    return (
        <Suspense fallback={<div>Loading Organizations...</div>}>
            <OrganizationsContent />
        </Suspense>
    );
}
