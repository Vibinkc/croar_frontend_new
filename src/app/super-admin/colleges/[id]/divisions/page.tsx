"use client";

import { useEffect, useState, use } from "react";
import { apiClient } from "@/utils/api";
import Link from "next/link";

interface College {
    id: string;
    name: string;
    slug: string;
    db_name: string;
    admin_email: string;
    admin_profile_image?: string;
    is_active: boolean;
}

interface Division {
    id: number;
    name: string;
    slug: string;
}

export default function SuperAdminDivisions({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [college, setCollege] = useState<College | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCollege();
        fetchDivisions();
    }, [id]);

    const fetchCollege = async () => {
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok) setCollege(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchDivisions = async () => {
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${id}/divisions`);
            if (res.ok) setDivisions(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleAddDivision = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await apiClient.post(`/api/v1/super-admin/tenants/${id}/divisions`, {
                name,
                slug
            });
            if (res.ok) {
                setName("");
                setSlug("");
                fetchDivisions();
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b border-slate-200 pb-8">
                    <div>
                        <h1 className="text-3xl font-black  tracking-tight">
                            {college?.name || 'Loading...'} <span className="text-blue-600">Divisions</span>
                        </h1>
                        <Link href="/super-admin/colleges/list" className="text-slate-400 text-xs font-bold   hover:text-slate-900 transition-colors">
                            &larr; Back to List
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <aside className="md:col-span-1">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5">
                            <h2 className="text-xs font-black   mb-6 border-b border-slate-50 pb-4">Add Division</h2>
                            <form onSubmit={handleAddDivision} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400  ">Name</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Arts & Science"
                                        value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/ /g, '-')); }} required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400  ">Slug</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. arts-science"
                                        value={slug} onChange={e => setSlug(e.target.value)} required
                                    />
                                </div>
                                <button
                                    disabled={isLoading}
                                    className="w-full bg-slate-900 text-white p-4 rounded-2xl text-xs font-black   shadow-lg"
                                >
                                    {isLoading ? 'Adding...' : 'Add Division'}
                                </button>
                            </form>
                        </div>
                    </aside>

                    <main className="md:col-span-2 space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400  ">Division Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400  ">Slug</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {divisions.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900  tracking-tight">{d.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-400">{d.slug}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {/* Add delete/edit if needed */}
                                            </td>
                                        </tr>
                                    ))}
                                    {divisions.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-xs font-bold  ">No divisions found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
