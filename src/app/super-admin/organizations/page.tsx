"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import { Search, Building2, Users, Trash2, Filter, ChevronDown, X, FileEdit, Network } from "lucide-react";
import { PageHeader, StatGrid, StatCard, Card, Field, Input, Select, Button, Badge, EmptyState, jetbrainsMono } from "@/components/ds";

const FRONTEND_DOMAIN = process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "app.croar.in";

interface Organization {
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    location?: string | null;
    is_consultancy?: boolean;
    is_active?: boolean;
    parent_id?: string | null;
}

function OrganizationsContent() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

    // Create form
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [newIsConsultancy, setNewIsConsultancy] = useState(false);
    const [newParentId, setNewParentId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form (org config: name / industry / location / consultancy / parent)
    const [editing, setEditing] = useState<Organization | null>(null);
    const [editName, setEditName] = useState("");
    const [editIndustry, setEditIndustry] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editIsConsultancy, setEditIsConsultancy] = useState(false);
    const [editParentId, setEditParentId] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

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
        setSaving(true);
        try {
            const res = await apiClient.post("/api/v1/super-admin/tenants", {
                org_data: {
                    name,
                    email,
                    website,
                    is_active: true,
                    is_consultancy: newIsConsultancy,
                    // A consultancy is top-level; a client org may sit under one.
                    parent_id: newIsConsultancy ? null : newParentId || null,
                },
                admin_email: adminEmail,
                admin_password: adminPassword,
            });
            if (res.ok) {
                setName("");
                setEmail("");
                setWebsite("");
                setAdminEmail("");
                setAdminPassword("");
                setNewIsConsultancy(false);
                setNewParentId("");
                setIsCreating(false);
                fetchOrganizations();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Error: ${err.detail || "Failed to create organization"}`);
            }
        } catch (e) {
            console.error(e);
            alert("An unexpected error occurred.");
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (o: Organization) => {
        setEditing(o);
        setEditName(o.name || "");
        setEditIndustry(o.industry || "");
        setEditLocation(o.location || "");
        setEditIsConsultancy(!!o.is_consultancy);
        setEditParentId(o.parent_id || "");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setSavingEdit(true);
        try {
            const res = await apiClient.put(`/api/v1/super-admin/tenants/${editing.id}`, {
                name: editName,
                industry: editIndustry || null,
                location: editLocation || null,
                is_consultancy: editIsConsultancy,
                parent_id: editIsConsultancy ? null : editParentId || null,
            });
            if (res.ok) {
                setEditing(null);
                fetchOrganizations();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Error: ${err.detail || "Failed to update organization"}`);
            }
        } catch (e) {
            console.error(e);
            alert("An unexpected error occurred.");
        } finally {
            setSavingEdit(false);
        }
    };

    const toggleStatus = async (o: Organization) => {
        // Activate/deactivate. A deactivated organisation's users are blocked at
        // login (and, for a consultancy, its sub-organisations too).
        try {
            const res = await apiClient.put(`/api/v1/super-admin/tenants/${o.id}`, {
                is_active: !(o.is_active ?? true),
            });
            if (res.ok) fetchOrganizations();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Decommission this organization? It will be removed from the platform inventory.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok || res.status === 204) fetchOrganizations();
        } catch (e) {
            console.error(e);
        }
    };

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    const filtered = organizations.filter((o) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            o.name?.toLowerCase().includes(q) ||
            o.slug?.toLowerCase().includes(q) ||
            (o.industry || "").toLowerCase().includes(q) ||
            (o.location || "").toLowerCase().includes(q);
        const active = o.is_active ?? true;
        const matchesStatus =
            statusFilter === "ALL" || (statusFilter === "ACTIVE" && active) || (statusFilter === "SUSPENDED" && !active);
        return matchesSearch && matchesStatus;
    });

    // Consultancy relationships
    const consultancies = organizations.filter((o) => o.is_consultancy);
    const clientCount = (consultancyId: string) => organizations.filter((o) => o.parent_id === consultancyId).length;
    const parentName = (o: Organization) => organizations.find((c) => c.id === o.parent_id)?.name;

    const stats = {
        total: organizations.length,
        active: organizations.filter((o) => o.is_active ?? true).length,
        consultancies: consultancies.length,
        suspended: organizations.filter((o) => !(o.is_active ?? true)).length,
    };

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Organizations"
                subtitle="Every organization provisioned on the platform"
                icon="apartment"
                help={<><p>Every organization on the platform.</p><p>Provision a new one, or open one to manage its admins and users.</p></>}
                actions={<Button icon="add" onClick={() => setIsCreating(true)}>New Organization</Button>}
            />

            {/* Metrics */}
            <StatGrid>
                <StatCard label="Total Organizations" value={stats.total} icon="apartment" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label="Consultancies" value={stats.consultancies} icon="hub" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label="Active" value={stats.active} icon="check_circle" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Deactivated" value={stats.suspended} icon="block" gradient="linear-gradient(135deg,#F6736B,#D03A3A)" glow="rgba(208,58,58,0.25)" />
            </StatGrid>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, slug, industry or location…"
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>
                <div className="relative flex-1 md:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "SUSPENDED")} className={`${selectCls} w-full md:min-w-[170px]`}>
                        <option value="ALL">Any status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Deactivated</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    organizations.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="apartment"
                            title="Provision your first organization"
                            description="Spin up a new organization and admin account to onboard a company onto the platform."
                            action={<Button icon="add" onClick={() => setIsCreating(true)}>New Organization</Button>}
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title="No organizations match your filters"
                            description="Try a different search or status."
                            action={<Button variant="secondary" onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}>Clear filters</Button>}
                        />
                    )
                ) : (
                    <>
                        <div className="hidden md:grid grid-cols-[2.2fr_1.6fr_1.2fr_0.9fr_140px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Organization</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Slug / URL</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Industry</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filtered.map((o) => (
                                <div
                                    key={o.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.2fr_1.6fr_1.2fr_0.9fr_140px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Organization */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0 font-bold text-[13px]">
                                            {o.name?.charAt(0).toUpperCase() || <Building2 className="w-[17px] h-[17px]" />}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-[14px] font-bold text-[#15171C] truncate">{o.name}</span>
                                                {o.is_consultancy && (
                                                    <span className="shrink-0 inline-flex items-center gap-1 rounded-[6px] bg-[#ECEBFB] text-[#5B53E0] px-1.5 py-0.5 text-[10px] font-bold">
                                                        <Network className="w-3 h-3" /> Consultancy
                                                    </span>
                                                )}
                                            </span>
                                            {(() => {
                                                const bits: string[] = [];
                                                if (o.location) bits.push(o.location);
                                                if (o.is_consultancy) {
                                                    const n = clientCount(o.id);
                                                    bits.push(`${n} client${n === 1 ? "" : "s"}`);
                                                } else if (o.parent_id) {
                                                    bits.push(`Client of ${parentName(o) || "—"}`);
                                                }
                                                return bits.length ? (
                                                    <span className="hidden md:block text-[11px] text-[#C7CCD4] mt-0.5 truncate">{bits.join(" · ")}</span>
                                                ) : null;
                                            })()}
                                            <div className="flex items-center gap-2.5 mt-0.5 text-[12px] text-[#8A929E] md:hidden">
                                                <span className={`truncate ${jetbrainsMono.className}`}>{o.slug}.{FRONTEND_DOMAIN}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slug / URL */}
                                    <div className="hidden md:flex items-center min-w-0">
                                        <span className={`px-2 py-0.5 rounded-[6px] bg-[#F4F5F7] border border-[#E1E4E8] text-[11px] text-[#6B6F76] truncate ${jetbrainsMono.className}`}>
                                            {o.slug}.{FRONTEND_DOMAIN}
                                        </span>
                                    </div>

                                    {/* Industry */}
                                    <div className="hidden md:block text-[12.5px] text-[#6B6F76] truncate">{o.industry || "—"}</div>

                                    {/* Status */}
                                    <div className="hidden md:flex items-center">
                                        <button onClick={() => toggleStatus(o)} title="Activate / deactivate organization" className="cursor-pointer">
                                            {(o.is_active ?? true) ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral" dot>Disabled</Badge>}
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <button onClick={() => toggleStatus(o)} className="md:hidden mr-1 cursor-pointer" title="Activate / deactivate organization">
                                            {(o.is_active ?? true) ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral" dot>Disabled</Badge>}
                                        </button>
                                        <button onClick={() => openEdit(o)} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors" title="Edit organization">
                                            <FileEdit className="w-4 h-4" />
                                        </button>
                                        <Link href={`/super-admin/organizations/${o.id}/admins`} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors" title="Manage Admins">
                                            <Users className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(o.id)} className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Create Organization modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                    <Card padding="none" className="w-full max-w-2xl my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[#E8EAED]">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-[18px] font-extrabold tracking-[-0.4px] text-[#15171C]">New Organization</h2>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Spin up a new organization and admin account.</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsCreating(false)} aria-label="Close" className="w-9 h-9 rounded-[10px] text-[#8A929E] hover:bg-[#F1F2F5] hover:text-[#374151] transition-colors flex items-center justify-center shrink-0">
                                <X className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrganization} className="px-6 py-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Company Name" htmlFor="org-company-name" required>
                                    <Input id="org-company-name" placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} required />
                                </Field>
                                <Field label="Contact Email" htmlFor="org-contact-email" required>
                                    <Input id="org-contact-email" placeholder="contact@acme.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </Field>
                            </div>
                            <Field label="Website" htmlFor="org-website">
                                <Input id="org-website" placeholder="https://acme.corp" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
                            </Field>

                            {/* Account type */}
                            <div className="pt-5 border-t border-[#F0F0F1] space-y-4">
                                <h3 className="text-[13px] font-bold text-[#15171C]">Account Type</h3>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newIsConsultancy}
                                        onChange={(e) => { setNewIsConsultancy(e.target.checked); if (e.target.checked) setNewParentId(""); }}
                                        className="mt-0.5 h-4 w-4 accent-[#5B53E0]"
                                    />
                                    <span>
                                        <span className="block text-[13.5px] font-bold text-[#15171C]">This is a consultancy</span>
                                        <span className="block text-[12px] text-[#8A929E] mt-0.5">A consultancy manages hiring for multiple client organizations from a single dashboard.</span>
                                    </span>
                                </label>
                                {!newIsConsultancy && consultancies.length > 0 && (
                                    <Field label="Belongs to consultancy (optional)" htmlFor="org-parent" hint="Link this org to a consultancy so they can manage its hiring.">
                                        <Select id="org-parent" value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
                                            <option value="">— Independent organization —</option>
                                            {consultancies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </Select>
                                    </Field>
                                )}
                            </div>

                            <div className="pt-5 border-t border-[#F0F0F1]">
                                <h3 className="text-[13px] font-bold text-[#15171C] mb-4">Organization Admin Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Admin Email" htmlFor="org-admin-email" required>
                                        <Input id="org-admin-email" placeholder="admin@acme.com" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                                    </Field>
                                    <Field label="Temp Password" htmlFor="org-admin-password" required>
                                        <Input id="org-admin-password" placeholder="••••••••" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                                    </Field>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button type="submit" icon="add" disabled={saving}>{saving ? "Creating…" : "Create Organization"}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Edit Organization modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
                    <Card padding="none" className="w-full max-w-xl my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[#E8EAED]">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <FileEdit className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-[18px] font-extrabold tracking-[-0.4px] text-[#15171C] truncate">Edit {editing.name}</h2>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Update profile and consultancy relationship.</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="w-9 h-9 rounded-[10px] text-[#8A929E] hover:bg-[#F1F2F5] hover:text-[#374151] transition-colors flex items-center justify-center shrink-0">
                                <X className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="px-6 py-6 space-y-5">
                            <Field label="Organization Name" htmlFor="edit-name" required>
                                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                            </Field>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Industry" htmlFor="edit-industry">
                                    <Input id="edit-industry" placeholder="e.g. Technology" value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
                                </Field>
                                <Field label="Location" htmlFor="edit-location">
                                    <Input id="edit-location" placeholder="e.g. London" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                                </Field>
                            </div>

                            <div className="pt-5 border-t border-[#F0F0F1] space-y-4">
                                <h3 className="text-[13px] font-bold text-[#15171C]">Account Type</h3>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editIsConsultancy}
                                        onChange={(e) => { setEditIsConsultancy(e.target.checked); if (e.target.checked) setEditParentId(""); }}
                                        className="mt-0.5 h-4 w-4 accent-[#5B53E0]"
                                    />
                                    <span>
                                        <span className="block text-[13.5px] font-bold text-[#15171C]">This is a consultancy</span>
                                        <span className="block text-[12px] text-[#8A929E] mt-0.5">Manages hiring for its client organizations from one dashboard.</span>
                                    </span>
                                </label>
                                {!editIsConsultancy && (
                                    <Field label="Belongs to consultancy (optional)" htmlFor="edit-parent">
                                        <Select id="edit-parent" value={editParentId} onChange={(e) => setEditParentId(e.target.value)}>
                                            <option value="">— Independent organization —</option>
                                            {consultancies.filter((c) => c.id !== editing.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </Select>
                                    </Field>
                                )}
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                                <Button type="submit" icon="save" disabled={savingEdit}>{savingEdit ? "Saving…" : "Save Changes"}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function OrganizationsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-[13px] text-[#8A929E]">Loading organizations…</div>}>
            <OrganizationsContent />
        </Suspense>
    );
}
