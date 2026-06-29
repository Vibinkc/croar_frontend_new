"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import {
    Building2,
    Search,
    Filter,
    ChevronDown,
    X,
    Globe as GlobeIcon,
    ArrowRight,
} from "lucide-react";
import {
    PageHeader,
    StatGrid,
    StatCard,
    Card,
    Field,
    Input,
    Button,
    Badge,
    EmptyState,
    jetbrainsMono,
} from "@/components/ds";


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

    // Presentation-only toolbar state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

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

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    const filteredOrganizations = organizations.filter((org) => {
        const matchesSearch =
            org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && org.is_active) ||
            (statusFilter === "SUSPENDED" && !org.is_active);
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: organizations.length,
        active: organizations.filter((o) => o.is_active).length,
        suspended: organizations.filter((o) => !o.is_active).length,
    };

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Organizations"
                subtitle="Every organization provisioned on the platform"
                icon="apartment"
                help={
                    <>
                        <p>Every organization on the platform.</p>
                        <p>Provision a new one, or open one to manage it.</p>
                    </>
                }
                actions={
                    <Button icon="add" onClick={() => setIsCreating(true)}>
                        New Organization
                    </Button>
                }
            />

            {/* Metrics */}
            <StatGrid className="lg:grid-cols-3">
                <StatCard
                    label="Total Organizations"
                    value={stats.total}
                    icon="apartment"
                    gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)"
                    glow="rgba(91,83,224,0.28)"
                />
                <StatCard
                    label="Active"
                    value={stats.active}
                    icon="check_circle"
                    gradient="linear-gradient(135deg,#34D399,#0E8A6E)"
                    glow="rgba(14,138,110,0.25)"
                />
                <StatCard
                    label="Suspended"
                    value={stats.suspended}
                    icon="block"
                    gradient="linear-gradient(135deg,#F6736B,#D03A3A)"
                    glow="rgba(208,58,58,0.25)"
                />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, website or email…"
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>

                <div className="relative flex-1 md:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "SUSPENDED")}
                        className={`${selectCls} w-full md:min-w-[170px]`}
                    >
                        <option value="ALL">Any status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                </div>
            </div>

            {/* Organizations list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredOrganizations.length === 0 ? (
                    organizations.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="apartment"
                            title="Provision your first organization"
                            description="Spin up a new dedicated environment and admin account to onboard a company onto the platform."
                            action={
                                <Button icon="add" onClick={() => setIsCreating(true)}>
                                    New Organization
                                </Button>
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title="No organizations match your filters"
                            description="Try adjusting your search terms or status filter."
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("ALL");
                                    }}
                                >
                                    Clear filters
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.6fr_1fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Organization</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Website</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredOrganizations.map((org: Organization) => (
                                <div
                                    key={org.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.6fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Organization */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                            <Building2 className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#15171C] truncate">
                                                {org.name}
                                            </span>
                                            <span className="block text-[12px] text-[#8A929E] truncate md:hidden">
                                                {org.website || "No website"}
                                            </span>
                                            <span className="hidden md:block text-[11px] text-[#C7CCD4] mt-0.5">
                                                {org.email || `#${org.id.substring(0, 8)}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Website (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 text-[13px] text-[#374151] min-w-0">
                                        <GlobeIcon className="w-4 h-4 text-[#9AA3AF] shrink-0" />
                                        <span className="truncate">{org.website || "No website"}</span>
                                    </div>

                                    {/* Status */}
                                    <div className="hidden md:flex items-center">
                                        {org.is_active ? (
                                            <Badge tone="success" dot>Active</Badge>
                                        ) : (
                                            <Badge tone="danger" dot>Suspended</Badge>
                                        )}
                                    </div>

                                    {/* Status (mobile) + actions */}
                                    <div className="flex items-center gap-2 justify-end">
                                        <div className="md:hidden">
                                            {org.is_active ? (
                                                <Badge tone="success" dot>Active</Badge>
                                            ) : (
                                                <Badge tone="danger" dot>Suspended</Badge>
                                            )}
                                        </div>
                                        <button
                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[13px] font-semibold text-[#5B53E0] hover:bg-[#ECEBFB] transition-colors"
                                            title="Manage organization"
                                        >
                                            Manage
                                            <ArrowRight className="w-3.5 h-3.5" />
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
                        {/* Modal header */}
                        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[#E8EAED]">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-[11px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-[18px] font-extrabold tracking-[-0.4px] text-[#15171C]">New Organization</h2>
                                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Spin up a new dedicated environment and admin account.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                aria-label="Close"
                                className="w-9 h-9 rounded-[10px] text-[#8A929E] hover:bg-[#F1F2F5] hover:text-[#374151] transition-colors flex items-center justify-center shrink-0"
                            >
                                <X className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrganization} className="px-6 py-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Company Name" htmlFor="org-company-name" required>
                                    <Input
                                        id="org-company-name"
                                        placeholder="Acme Corp"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Contact Email" htmlFor="org-contact-email" required>
                                    <Input
                                        id="org-contact-email"
                                        placeholder="contact@acme.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Field>
                            </div>

                            <Field label="Website" htmlFor="org-website">
                                <Input
                                    id="org-website"
                                    placeholder="https://acme.corp"
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </Field>

                            <div className="pt-5 border-t border-[#F0F0F1]">
                                <h3 className="text-[13px] font-bold text-[#15171C] mb-4">Organization Admin Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Admin Email" htmlFor="org-admin-email" required>
                                        <Input
                                            id="org-admin-email"
                                            placeholder="admin@acme.com"
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            required
                                        />
                                    </Field>
                                    <Field label="Temp Password" htmlFor="org-admin-password" required>
                                        <Input
                                            id="org-admin-password"
                                            placeholder="••••••••"
                                            type="password"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            required
                                        />
                                    </Field>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" icon="add" disabled={isLoading}>
                                    {isLoading ? "Creating…" : "Create Organization"}
                                </Button>
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
        <Suspense fallback={<div>Loading Organizations...</div>}>
            <OrganizationsContent />
        </Suspense>
    );
}
