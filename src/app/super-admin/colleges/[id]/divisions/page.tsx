"use client";

import { useEffect, useState, use } from "react";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import { PageHeader, Card, Field, Input, Button, EmptyState, jetbrainsMono } from "@/components/ds";

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
    const router = useRouter();
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [college, setCollege] = useState<College | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [showModal, setShowModal] = useState(false);

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
        finally { setIsFetching(false); }
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
                setShowModal(false);
                fetchDivisions();
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Divisions"
                subtitle={college?.name || "Loading…"}
                onBack={() => router.push("/super-admin/colleges/list")}
                help={
                    <>
                        <p>This tenant&apos;s divisions or departments.</p>
                        <p>Add, rename or remove them.</p>
                    </>
                }
                actions={
                    <Button icon="add" onClick={() => setShowModal(true)}>
                        Add Division
                    </Button>
                }
            />

            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isFetching ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : divisions.length === 0 ? (
                    <EmptyState
                        tone="brand"
                        icon="account_tree"
                        title="No divisions yet"
                        description="Create a division or department to organise this tenant&apos;s structure."
                        action={
                            <Button icon="add" onClick={() => setShowModal(true)}>
                                Add Division
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <div className="hidden md:grid grid-cols-[2.4fr_2fr] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Division Name</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Slug</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {divisions.map((d) => (
                                <div
                                    key={d.id}
                                    className="grid grid-cols-1 md:grid-cols-[2.4fr_2fr] gap-x-4 gap-y-1 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <span className="material-icons-outlined text-[18px]">account_tree</span>
                                        </span>
                                        <span className="text-[14px] font-bold text-[#15171C] truncate">{d.name}</span>
                                    </div>
                                    <div className={`text-[12.5px] text-[#8A929E] truncate pl-12 md:pl-0 ${jetbrainsMono.className}`}>
                                        {d.slug}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Add Division Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="lg" className="max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                    <span className="material-icons-outlined text-[18px]">account_tree</span>
                                </span>
                                <h3 className="text-[15px] font-bold text-[#15171C]">Add Division</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                            >
                                <span className="material-icons-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddDivision} className="space-y-4">
                            <Field label="Name" htmlFor="division-name">
                                <Input
                                    id="division-name"
                                    placeholder="e.g. Arts &amp; Science"
                                    value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replaceAll(' ', '-')); }} required
                                />
                            </Field>
                            <Field label="Slug" htmlFor="division-slug">
                                <Input
                                    id="division-slug"
                                    placeholder="e.g. arts-science"
                                    value={slug} onChange={e => setSlug(e.target.value)} required
                                />
                            </Field>
                            <Button type="submit" fullWidth disabled={isLoading} icon="add" className="mt-2">
                                {isLoading ? "Adding..." : "Add Division"}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
