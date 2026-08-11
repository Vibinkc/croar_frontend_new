"use client";

import { useState, useEffect, Suspense } from "react";
import { apiClient } from "@/utils/api";
import { Button, Card, Input, Textarea, Field, Badge, StatCard, StatGrid, PageHeader, EmptyState } from "@/components/ds";
import { useI18n } from "@/context/I18nContext";

interface Permission {
    id: string;
    resource: string;
    action: string;
    module: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    role_rank: number;
    is_system: boolean;
    permissions: Permission[];
}

function RolesContent() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [permSearch, setPermSearch] = useState("");
    const { t } = useI18n();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [rank, setRank] = useState(10);
    const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                apiClient.get("/api/v1/super-admin/roles"),
                apiClient.get("/api/v1/super-admin/permissions")
            ]);

            if (rolesRes.ok) { const r = await rolesRes.json(); setRoles(Array.isArray(r) ? r : []); }
            if (permsRes.ok) { const p = await permsRes.json(); setPermissions(Array.isArray(p) ? p : []); }
        } catch (e) {
            console.error("Failed to fetch RBAC data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setSelectedRole(null);
        setName("");
        setDescription("");
        setRank(10);
        setSelectedPermIds([]);
        setIsEditing(true);
    };

    const handleOpenEdit = (role: Role) => {
        setSelectedRole(role);
        setName(role.name);
        setDescription(role.description || "");
        setRank(role.role_rank);
        setSelectedPermIds(role.permissions.map((p) => p.id));
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                name,
                description,
                role_rank: rank,
                permission_ids: selectedPermIds
            };

            const res = selectedRole
                ? await apiClient.put(`/api/v1/super-admin/roles/${selectedRole.id}`, payload)
                : await apiClient.post("/api/v1/super-admin/roles", payload);

            if (res.ok) {
                setIsEditing(false);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || t("superAdmin.failedSaveRole")}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("superAdmin.deleteRoleConfirm"))) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/roles/${id}`);
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const togglePermission = (id: string) => {
        setSelectedPermIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    // Group permissions by module for better UI
    const filteredPermissions = permissions.filter(p =>
        p.resource.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.module.toLowerCase().includes(permSearch.toLowerCase())
    );

    const groupedPermissions = filteredPermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {});

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title={t("superAdmin.globalRolesTitle")}
                subtitle={t("superAdmin.globalRolesSubtitle")}
                icon="admin_panel_settings"
                help={<><p>{t("superAdmin.globalRolesHelp1")}</p><p>{t("superAdmin.globalRolesHelp2")}</p></>}
                actions={
                    <Button size="sm" icon="add_moderator" onClick={handleOpenCreate}>
                        {t("superAdmin.createRole")}
                    </Button>
                }
            />

            <StatGrid>
                <StatCard label={t("superAdmin.statTotalRoles")} value={roles.length} icon="verified_user" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.25)" />
                <StatCard label={t("superAdmin.statSystemRoles")} value={roles.filter(r => r.is_system).length} icon="lock" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label={t("superAdmin.statCustomRoles")} value={roles.filter(r => !r.is_system).length} icon="shield" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label={t("superAdmin.statGlobalPermissions")} value={permissions.length || "—"} icon="security" gradient="linear-gradient(135deg,#FBBF24,#D97706)" glow="rgba(217,119,6,0.25)" />
            </StatGrid>

            <div className="flex items-center justify-between px-1">
                <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">{t("superAdmin.accessControl")}</h2>
                <Badge tone="neutral">{t("superAdmin.availableRoles", { count: roles.length })}</Badge>
            </div>

            {isLoading && roles.length === 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#E8EAED] rounded-[14px] p-5 md:p-6 min-h-[180px] animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-9 h-9 rounded-[10px] bg-[#F1F2F5]" />
                                <div className="w-10 h-8 rounded-[8px] bg-[#F1F2F5]" />
                            </div>
                            <div className="h-4 w-2/3 rounded bg-[#F1F2F5] mb-2" />
                            <div className="h-3 w-full rounded bg-[#F1F2F5] mb-1.5" />
                            <div className="h-3 w-4/5 rounded bg-[#F1F2F5]" />
                        </div>
                    ))}
                </div>
            ) : roles.length === 0 ? (
                <Card padding="none">
                    <EmptyState
                        icon="shield"
                        title={t("superAdmin.noRolesYet")}
                        description={t("superAdmin.noRolesDesc")}
                        action={
                            <Button size="sm" icon="add_moderator" onClick={handleOpenCreate}>
                                {t("superAdmin.createRole")}
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <Card key={role.id} interactive className="flex flex-col justify-between min-h-[180px] animate-in fade-in duration-500">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center border ${role.is_system ? 'bg-[#15171C] text-white border-[#15171C]' : 'bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]/80'}`}>
                                        <span className="material-symbols-rounded text-[20px]">shield</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-semibold text-[#8A929E] uppercase tracking-[0.06em]">{t("superAdmin.rank")}</div>
                                        <div className="text-[20px] font-extrabold text-[#15171C] tracking-tight leading-none">{String(role.role_rank).padStart(2, "0")}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="text-[14px] font-bold text-[#15171C] truncate">{role.name}</h3>
                                    {role.is_system && <Badge tone="neutral" className="shrink-0 rounded-[6px] px-2 py-0.5 text-[10px]">{t("superAdmin.system")}</Badge>}
                                </div>
                                <p className="text-[12.5px] text-[#8A929E] leading-normal line-clamp-2 h-9 mb-4">
                                    {role.description || t("superAdmin.roleDefaultDesc")}
                                </p>

                                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#E8EAED]">
                                    {role.permissions.slice(0, 3).map((p) => (
                                        <Badge key={p.id} tone="neutral" className="rounded-[6px] px-2 py-0.5 text-[10px]">
                                            {p.resource}
                                        </Badge>
                                    ))}
                                    {role.permissions.length > 3 && (
                                        <span className="text-[10px] font-bold text-[#5B53E0] ml-0.5 self-center">{t("superAdmin.nMore", { count: role.permissions.length - 3 })}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 mt-4 border-t border-[#E8EAED]">
                                <Button variant="secondary" size="sm" icon={role.is_system ? "visibility" : "edit_note"} className="flex-1" onClick={() => handleOpenEdit(role)}>
                                    {role.is_system ? t("superAdmin.view") : t("superAdmin.configure")}
                                </Button>
                                {!role.is_system && (
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        aria-label={t("superAdmin.deleteRole")}
                                        className="w-9 h-9 flex items-center justify-center bg-[#FDECEC] border border-[#F7D7D7] text-[#C0383C] rounded-[10px] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all shrink-0"
                                    >
                                        <span className="material-symbols-rounded text-[19px]">delete</span>
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Role Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="none" className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                    <span className="material-symbols-rounded text-[20px]">admin_panel_settings</span>
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">{selectedRole ? t("superAdmin.editRole") : t("superAdmin.createRole")}</h3>
                                    <p className="text-[12.5px] text-[#8A929E]">{t("superAdmin.configureAuthPerms")}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditing(false)}
                                aria-label={t("superAdmin.close")}
                                className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-rounded text-[19px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label={t("superAdmin.roleIdentity")} htmlFor="role-identity" required>
                                        <Input
                                            id="role-identity"
                                            placeholder="e.g. REGIONAL_MANAGER"
                                            value={name} onChange={e => setName(e.target.value.toUpperCase())} required
                                            disabled={selectedRole?.is_system}
                                        />
                                    </Field>
                                    <Field label={t("superAdmin.rankPriority")} htmlFor="role-rank" hint={t("superAdmin.rankPriorityHint")} required>
                                        <Input
                                            id="role-rank"
                                            type="number"
                                            value={rank} onChange={e => setRank(Number.parseInt(e.target.value) || 0)} required
                                            disabled={selectedRole?.is_system}
                                        />
                                    </Field>
                                </div>

                                {selectedRole?.is_system && (
                                    <div className="flex items-start gap-2.5 rounded-[10px] border border-[#E8EAED] bg-[#F7F8FA] px-3.5 py-2.5">
                                        <span className="material-symbols-rounded text-[18px] text-[#8A929E] mt-0.5">lock</span>
                                        <p className="text-[12px] text-[#6B7280] leading-relaxed">
                                            {t("superAdmin.systemRoleNoticeStart")} <span className="font-semibold text-[#374151]">{t("superAdmin.systemRole")}</span>{t("superAdmin.systemRoleNoticeEnd")}
                                        </p>
                                    </div>
                                )}

                                <Field label={t("superAdmin.capabilitiesSummary")} htmlFor="role-description">
                                    <Textarea
                                        id="role-description"
                                        className="min-h-[90px]"
                                        placeholder={t("superAdmin.describeRolePlaceholder")}
                                        value={description} onChange={e => setDescription(e.target.value)}
                                        disabled={selectedRole?.is_system}
                                    />
                                </Field>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label id="assigned-permissions-label" htmlFor="assigned-permissions-group" className="text-[12.5px] font-semibold text-[#374151]">{t("superAdmin.assignedPermissions")}</label>
                                        <Badge tone="indigo">{t("superAdmin.nActive", { count: selectedPermIds.length })}</Badge>
                                    </div>

                                    <Input
                                        icon="search"
                                        type="text"
                                        placeholder={t("superAdmin.filterCapabilities")}
                                        value={permSearch}
                                        onChange={(e) => setPermSearch(e.target.value)}
                                    />

                                    <div id="assigned-permissions-group" role="group" aria-labelledby="assigned-permissions-label" className="bg-[#F4F5F7]/50 rounded-[10px] border border-[#E8EAED] p-3 max-h-[280px] overflow-y-auto custom-scrollbar space-y-4">
                                        {Object.keys(groupedPermissions).map(module => (
                                            <div key={module} className="space-y-1.5">
                                                <h4 className="text-[10px] font-bold text-[#8A929E] uppercase tracking-[0.06em] border-b border-[#E8EAED] pb-1">{t("superAdmin.moduleLabel", { module })}</h4>
                                                <div className="space-y-1.5">
                                                    {groupedPermissions[module].map((perm) => (
                                                        <button
                                                            key={perm.id}
                                                            type="button"
                                                            onClick={() => togglePermission(perm.id)}
                                                            disabled={selectedRole?.is_system}
                                                            className={`w-full flex items-center justify-between p-2.5 rounded-[8px] border text-[11px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70 ${selectedPermIds.includes(perm.id) ? "bg-[#15171C] border-[#15171C] text-white shadow-md" : "bg-white border-[#E1E4E8] text-[#8A929E] hover:border-[#9AA3AF]"}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedPermIds.includes(perm.id) ? "bg-[#5B53E0]" : "bg-slate-300"}`} />
                                                                <span>{perm.resource}</span>
                                                            </div>
                                                            <span className="opacity-60">{perm.action}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 p-6 border-t border-[#E8EAED]">
                                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                                    {selectedRole?.is_system ? t("superAdmin.close") : t("superAdmin.cancel")}
                                </Button>
                                {!selectedRole?.is_system && (
                                    <Button type="submit" disabled={isLoading} icon="verified_user" className="flex-1">
                                        {isLoading ? t("superAdmin.savingDots") : (selectedRole ? t("superAdmin.updateRole") : t("superAdmin.createRole"))}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function RolesPage() {
    return (
        <Suspense fallback={
            <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full">
                <div className="h-12 rounded-[14px] bg-[#F1F2F5] animate-pulse" />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#E8EAED] rounded-[14px] p-6 min-h-[180px] animate-pulse" />
                    ))}
                </div>
            </div>
        }>
            <RolesContent />
        </Suspense>
    );
}
