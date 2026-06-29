"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import {
    Search,
    Building2,
    Users,
    FileEdit,
    Trash2,
} from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, jetbrainsMono } from "@/components/ds";

const FRONTEND_DOMAIN = process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "app.croar.in";

interface College {
    id: string;
    name: string;
    slug: string;
    db_name: string;
    admin_email: string;
    admin_profile_image?: string;
    is_active: boolean;
}

export default function DeployedNodesList() {
    const [colleges, setColleges] = useState<College[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/v1/super-admin/tenants");
            if (res.ok) {
                setColleges(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to decommission this node? This action cannot be undone.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok || res.status === 204) {
                fetchColleges();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleStatus = async (college: College) => {
        try {
            await apiClient.put(`/api/v1/super-admin/tenants/${college.id}`, { is_active: !college.is_active });
            fetchColleges();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredColleges = colleges.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
            c.name?.toLowerCase().includes(q) ||
            c.slug?.toLowerCase().includes(q) ||
            c.db_name?.toLowerCase().includes(q) ||
            c.admin_email?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Tenants Inventory"
                subtitle="Every tenant instance on the platform"
                icon="dns"
                help={<><p>Every tenant instance on the platform.</p><p>Open one to manage its admins, divisions and users.</p></>}
                actions={
                    <Link href="/super-admin/colleges">
                        <Button icon="add">Provision Tenant</Button>
                    </Link>
                }
            />

            {/* Toolbar: search */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, slug, database or admin email…"
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>
                <Badge tone="neutral" className="self-start md:self-auto px-3 py-1.5">
                    {colleges.length} tenants
                </Badge>
            </div>

            {/* Tenant list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredColleges.length === 0 ? (
                    colleges.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="dns"
                            title="No tenants provisioned yet"
                            description="Spin up your first tenant organization and its admin to get started."
                            action={
                                <Link href="/super-admin/colleges">
                                    <Button icon="add">Provision Tenant</Button>
                                </Link>
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title="No tenants match your search"
                            description="Try a different name, slug or email."
                            action={
                                <Button variant="secondary" onClick={() => setSearchQuery("")}>
                                    Clear search
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.2fr_1.6fr_1.2fr_0.9fr_140px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Organization</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Slug / URL</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Database</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredColleges.map((c: College) => (
                                <div
                                    key={c.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.2fr_1.6fr_1.2fr_0.9fr_140px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Organization */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0 overflow-hidden font-bold text-[13px]">
                                            {c.admin_profile_image ? (
                                                <img src={c.admin_profile_image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                c.name?.charAt(0).toUpperCase() || <Building2 className="w-[17px] h-[17px]" />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <Link href={`/super-admin/colleges?edit=${c.id}`} className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">
                                                {c.name}
                                            </Link>
                                            {/* mobile-only meta */}
                                            <div className="flex items-center gap-2.5 mt-0.5 text-[12px] text-[#8A929E] md:hidden">
                                                <span className={`truncate ${jetbrainsMono.className}`}>{c.slug}.{FRONTEND_DOMAIN}</span>
                                            </div>
                                            <span className="hidden md:block text-[11px] text-[#C7CCD4] mt-0.5">{c.admin_email}</span>
                                        </div>
                                    </div>

                                    {/* Slug / URL (desktop) */}
                                    <div className="hidden md:flex items-center min-w-0">
                                        <span className={`px-2 py-0.5 rounded-[6px] bg-[#F4F5F7] border border-[#E1E4E8] text-[11px] text-[#6B6F76] truncate ${jetbrainsMono.className}`}>
                                            {c.slug}.{FRONTEND_DOMAIN}
                                        </span>
                                    </div>

                                    {/* Database (desktop) */}
                                    <div className={`hidden md:block text-[12px] text-[#8A929E] truncate ${jetbrainsMono.className}`}>
                                        {c.db_name}
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">
                                        <button onClick={() => toggleStatus(c)} title="Toggle status" className="cursor-pointer">
                                            {c.is_active ? (
                                                <Badge tone="success" dot>Active</Badge>
                                            ) : (
                                                <Badge tone="neutral" dot>Offline</Badge>
                                            )}
                                        </button>
                                    </div>

                                    {/* Status (mobile) + actions */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <button onClick={() => toggleStatus(c)} className="md:hidden mr-1 cursor-pointer" title="Toggle status">
                                            {c.is_active ? (
                                                <Badge tone="success" dot>Active</Badge>
                                            ) : (
                                                <Badge tone="neutral" dot>Offline</Badge>
                                            )}
                                        </button>

                                        <Link href={`/super-admin/colleges?edit=${c.id}`} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors" title="Edit Configuration">
                                            <FileEdit className="w-4 h-4" />
                                        </Link>
                                        <Link href={`/super-admin/colleges/${c.id}/admins`} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors" title="Manage Admins">
                                            <Users className="w-4 h-4" />
                                        </Link>
                                        <Link href={`/super-admin/colleges/${c.id}/divisions`} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors" title="Manage Divisions">
                                            <Building2 className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(c.id)} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
