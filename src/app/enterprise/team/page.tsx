"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    RefreshCcw,
    UserPlus,
    ShieldCheck,
    Lock,
    Trash2,
    Shield,
    ShieldPlus,
    UserCircle,
    X
} from "lucide-react";
import { Button, StatCard, StatGrid, Badge, Card, Input, Textarea, Select, Field, PageHelp } from "@/components/ds";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface Permission {
    id: string;
    module: string;
    action: string;
}

interface Role {
    id: string;
    name: string;
    description?: string;
    is_system?: boolean;
    permissions?: Permission[];
}

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roles?: Role[];
}

function TeamManagementContent() {
    const { canAccess } = useAuth();
    const { t: tr } = useI18n();
    const [activeTab, setActiveTab] = useState<"members" | "roles">("members");
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

    // Modal UI states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    // Member Form State
    const [memberEmail, setMemberEmail] = useState("");
    const [memberPassword, setMemberPassword] = useState("");
    const [memberFirstName, setMemberFirstName] = useState("");
    const [memberLastName, setMemberLastName] = useState("");
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    // Member management (reassign roles / remove)
    const [reassignTarget, setReassignTarget] = useState<Member | null>(null);
    const [reassignRoleIds, setReassignRoleIds] = useState<string[]>([]);
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
    const [isSavingMember, setIsSavingMember] = useState(false);

    // Role Form State
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [memRes, roleRes, permRes] = await Promise.all([
                apiClient.get("/api/v1/enterprise/team/members"),
                apiClient.get("/api/v1/enterprise/team/roles"),
                apiClient.get("/api/v1/enterprise/team/permissions")
            ]);
            
            if (memRes.ok) setMembers(await memRes.json() as Member[]);
            if (roleRes.ok) setRoles(await roleRes.json() as Role[]);
            if (permRes.ok) setPermissions(await permRes.json() as Permission[]);
        } catch (error) {
            console.error("Failed to fetch team data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await apiClient.post("/api/v1/enterprise/team/members", {
                email: memberEmail,
                password: memberPassword,
                first_name: memberFirstName,
                last_name: memberLastName,
                role_ids: selectedRoleIds
            });
            if (res.ok) {
                setMemberEmail("");
                setMemberPassword("");
                setMemberFirstName("");
                setMemberLastName("");
                setSelectedRoleIds([]);
                setShowInviteModal(false);
                fetchData();
            }
        } catch (error) {
            console.error("Failed to add member:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await apiClient.post("/api/v1/enterprise/team/roles", {
                name: roleName,
                description: roleDescription,
                permission_ids: selectedPermissionIds
            });
            if (res.ok) {
                setRoleName("");
                setRoleDescription("");
                setSelectedPermissionIds([]);
                setShowRoleModal(false);
                fetchData();
            }
        } catch (error) {
            console.error("Failed to create role:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/team/roles/${id}`);
            if (res.ok) fetchData();
        } catch (e) {
            console.error("Failed to delete role", e);
        }
    };

    const openReassign = (member: Member) => {
        setReassignTarget(member);
        setReassignRoleIds(member.roles?.map(r => r.id) || []);
    };

    const toggleReassignRole = (id: string) => {
        setReassignRoleIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const handleSaveReassign = async () => {
        if (!reassignTarget) return;
        setIsSavingMember(true);
        try {
            const res = await apiClient.put(`/api/v1/enterprise/team/members/${reassignTarget.id}/roles`, {
                role_ids: reassignRoleIds,
            });
            if (res.ok) {
                setReassignTarget(null);
                fetchData();
            }
        } catch (e) {
            console.error("Failed to reassign roles", e);
        } finally {
            setIsSavingMember(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        setIsSavingMember(true);
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/team/members/${memberToRemove.id}`);
            if (res.ok) {
                setMemberToRemove(null);
                fetchData();
            }
        } catch (e) {
            console.error("Failed to remove member", e);
        } finally {
            setIsSavingMember(false);
        }
    };

    const filteredMembers = members.filter(m => {
        const fullName = `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email;
        const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRoleFilter === "ALL" || m.roles?.some((r: Role) => r.name === selectedRoleFilter);
        return matchesSearch && matchesRole;
    });

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("general.teamManagement")}</h1>
                        <PageHelp title={tr("team.teamManagementHelpTitle")}>
                            <p>{tr("team.controlWhoSignsIn")}</p>
                            <p><strong>{tr("general.members")}</strong> are the people with access. <strong>{tr("general.roles")}</strong> bundle permissions — assign a role to grant the right level of access.</p>
                            <p>{tr("team.inviteMemberThenRoles")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("general.orgPersonnel")}</p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                    {/* Invite/Create Button */}
                    {activeTab === "members"
                        ? canAccess("employees:moderate") && (
                            <Button size="sm" icon="person_add" onClick={() => setShowInviteModal(true)}>
                                {tr("general.inviteMember")}
                            </Button>
                        )
                        : canAccess("employees:moderate") && (
                            <Button size="sm" icon="add_moderator" onClick={() => setShowRoleModal(true)}>
                                {tr("general.createRole")}
                            </Button>
                        )}

                    <div className="flex bg-[#E0E0E0] rounded-[4px] p-0.5 border border-[#E0E0E0]">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`h-8 px-4 rounded-[4px] text-[13px] font-semibold transition-all ${activeTab === "members" ? "bg-white text-[#212121] shadow-sm" : "text-[#616161] hover:text-[#424242]"}`}
                        >
                            {tr("general.members")}
                        </button>
                        {canAccess("employees:moderate") && (
                            <button
                                onClick={() => setActiveTab("roles")}
                                className={`h-8 px-4 rounded-[4px] text-[13px] font-semibold transition-all ${activeTab === "roles" ? "bg-white text-[#212121] shadow-sm" : "text-[#616161] hover:text-[#424242]"}`}
                            >
                                {tr("general.roles")}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Stat Cards */}
            <StatGrid>
                <StatCard label={tr("general.totalMembers")} value={members.length} icon="group" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.25)" />
                <StatCard label={tr("general.activeRoles")} value={roles.length} icon="verified_user" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={tr("general.systemRoles")} value={roles.filter(r => r.is_system).length} icon="lock" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
                <StatCard label={tr("general.globalPermissions")} value={permissions.length || "—"} icon="security" gradient="linear-gradient(135deg,#FFB300,#EF6C00)" glow="rgba(239,108,0,0.25)" />
            </StatGrid>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 w-full">
                    <Input
                        icon="search"
                        type="text"
                        placeholder={tr("general.searchMembersPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:flex-none">
                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-[19px] pointer-events-none">filter_list</span>
                        <Select
                            className="h-11 pl-10 pr-8 text-[13px] font-semibold text-[#424242] w-full md:w-auto md:min-w-[160px]"
                            value={selectedRoleFilter}
                            onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        >
                            <option value="ALL">{tr("general.allRoles")}</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchData}
                        aria-label={tr("team.refresh")}
                        className="w-11 h-11 px-0 shrink-0"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {activeTab === "members" ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[16px] font-bold text-[#212121] tracking-tight">{tr("general.activeMembers")}</h2>
                        <Badge tone="neutral">{tr("general.teamMembersCount", { count: filteredMembers.length })}</Badge>
                    </div>

                    {filteredMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[4px] border border-dashed border-[#E0E0E0] shadow-sm">
                            <div className="relative mb-5">
                                <div className="absolute -inset-3 rounded-full bg-[#1976D2]/10 blur-xl" />
                                <div className="relative w-14 h-14 rounded-[4px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 8px 24px rgba(25,118,210,0.3)" }}>
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-[16px] font-bold text-[#212121] mb-1">{tr("general.noMembersFound")}</h3>
                            <p className="text-[#757575] text-[13px] max-w-xs mx-auto mb-5">{tr("general.adjustSearchRole")}</p>
                            <Button size="sm" onClick={() => { setSearchQuery(""); setSelectedRoleFilter("ALL"); }}>
                                {tr("general.resetFilters")}
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[4px] border border-[#E0E0E0] bg-white shadow-sm">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("general.memberName")}</th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("general.emailAddress")}</th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("general.assignedRoles")}</th>
                                        {canAccess("employees:moderate") && (
                                            <th className="px-6 py-3.5 text-right text-[11px] font-bold text-[#757575] uppercase tracking-[0.06em]">{tr("general.actions")}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE]">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-[#FAFAFA]/60 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center font-extrabold border border-[#BBDEFB]/60 shadow-sm text-[12px] uppercase">
                                                        {member.first_name || member.last_name ? (
                                                            ((member.first_name?.[0] || "") + (member.last_name?.[0] || "")).toUpperCase()
                                                        ) : (
                                                            <UserCircle className="w-5 h-5 stroke-[1.5]" />
                                                        )}
                                                    </div>
                                                    <span className="text-[13.5px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors">{member.first_name} {member.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] text-[#616161] font-medium">{member.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {member.roles?.map((r: Role) => (
                                                        <Badge key={r.id} tone="indigo">{r.name}</Badge>
                                                    ))}
                                                    {(!member.roles || member.roles.length === 0) && (
                                                        <Badge tone="neutral">{tr("general.unassigned")}</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            {canAccess("employees:moderate") && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openReassign(member)}
                                                            title={tr("general.reassignRoles")}
                                                            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#757575] hover:text-[#1976D2] hover:bg-[#E3F2FD] border border-transparent hover:border-[#BBDEFB]/60 transition-all"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setMemberToRemove(member)}
                                                            title={tr("general.removeMember")}
                                                            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#757575] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[16px] font-bold text-[#212121] tracking-tight">{tr("general.accessControl")}</h2>
                        <Badge tone="neutral">{tr("general.availableRolesCount", { count: roles.length })}</Badge>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {roles.map(role => (
                            <Card key={role.id} interactive className="flex flex-col justify-between min-h-[165px]">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center border ${role.is_system ? 'bg-[#212121] text-white border-[#212121]' : 'bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]/80'}`}>
                                            <Shield className="w-4 h-4 stroke-[1.5]" />
                                        </div>
                                        {role.is_system ? (
                                            <span className="p-1.5 bg-[#E0E0E0] text-[#757575] rounded-[3px] border border-[#E0E0E0]">
                                                <Lock className="w-3 h-3" />
                                            </span>
                                        ) : (
                                            canAccess("employees:moderate") && (
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="p-1.5 bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] hover:bg-[#E53935] hover:text-white hover:border-[#E53935] transition-all rounded-[3px]"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <h3 className="text-[14px] font-bold text-[#212121] mb-1">{role.name}</h3>
                                    <p className="text-[12.5px] text-[#757575] leading-normal line-clamp-2 h-9 mb-4">{role.description || tr("general.standardRoleDesc")}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#E0E0E0]">
                                    {role.permissions?.slice(0, 3).map((p: Permission) => (
                                        <Badge key={p.id} tone="neutral" className="rounded-[3px] px-2 py-0.5 text-[10px]">
                                            {p.module}
                                        </Badge>
                                    ))}
                                    {(role.permissions?.length ?? 0) > 3 && (
                                        <span className="text-[10px] font-bold text-[#1976D2] ml-0.5 self-center">{tr("general.morePermissions", { count: (role.permissions?.length ?? 0) - 3 })}</span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Member Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white border border-[#E0E0E0] rounded-[4px] p-6 max-w-md w-full shadow-xl space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#E3F2FD] text-[#1976D2] rounded-[4px]">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("general.inviteMember")}</h3>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-7 h-7 rounded-[3px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label={tr("general.firstName")} htmlFor="modal-member-first-name">
                                        <Input
                                            id="modal-member-first-name"
                                            placeholder={tr("general.firstNamePlaceholder")}
                                            value={memberFirstName} onChange={e => setMemberFirstName(e.target.value)} required
                                        />
                                    </Field>
                                    <Field label={tr("general.lastName")} htmlFor="modal-member-last-name">
                                        <Input
                                            id="modal-member-last-name"
                                            placeholder={tr("general.lastNamePlaceholder")}
                                            value={memberLastName} onChange={e => setMemberLastName(e.target.value)} required
                                        />
                                    </Field>
                                </div>

                                <Field label={tr("general.emailAddress")} htmlFor="modal-member-email">
                                    <Input
                                        id="modal-member-email"
                                        icon="mail"
                                        placeholder={tr("general.emailPlaceholder")}
                                        type="email"
                                        value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required
                                    />
                                </Field>

                                <Field label={tr("general.temporaryPassword")} htmlFor="modal-member-password">
                                    <Input
                                        id="modal-member-password"
                                        icon="lock"
                                        placeholder="••••••••"
                                        type="password"
                                        value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required
                                    />
                                </Field>

                                <div className="space-y-3">
                                    <label id="modal-assign-roles-label" htmlFor="modal-assign-roles-group" className="text-[12.5px] font-semibold text-[#424242]">{tr("general.assignRolesLabel")}</label>
                                    <div id="modal-assign-roles-group" role="group" aria-labelledby="modal-assign-roles-label" className="flex flex-wrap gap-1.5">
                                        {roles.map(role => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => {
                                                    if (selectedRoleIds.includes(role.id)) {
                                                        setSelectedRoleIds(selectedRoleIds.filter(id => id !== role.id));
                                                    } else {
                                                        setSelectedRoleIds([...selectedRoleIds, role.id]);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold transition-all border ${selectedRoleIds.includes(role.id) ? "bg-[#212121] border-[#212121] text-white shadow-sm" : "bg-white border-[#E0E0E0] text-[#757575] hover:border-[#9E9E9E]"}`}
                                            >
                                                {role.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button type="submit" fullWidth disabled={isLoading} className="mt-4">
                                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {isLoading ? tr("general.inviting") : tr("general.inviteMember")}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Role Modal */}
            <AnimatePresence>
                {showRoleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white border border-[#E0E0E0] rounded-[4px] p-6 max-w-lg w-full shadow-xl space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#E3F2FD] text-[#1976D2] rounded-[4px]">
                                        <ShieldPlus className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#212121]">{tr("general.createCustomRole")}</h3>
                                </div>
                                <button 
                                    onClick={() => setShowRoleModal(false)}
                                    className="w-7 h-7 rounded-[3px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4">
                                <Field label={tr("general.roleName")} htmlFor="modal-role-name">
                                    <Input
                                        id="modal-role-name"
                                        placeholder={tr("general.roleNameExample")}
                                        value={roleName} onChange={e => setRoleName(e.target.value)} required
                                    />
                                </Field>
                                <Field label={tr("general.description")} htmlFor="modal-role-description">
                                    <Textarea
                                        id="modal-role-description"
                                        className="min-h-[90px]"
                                        placeholder={tr("general.roleAccessPlaceholder")}
                                        value={roleDescription} onChange={e => setRoleDescription(e.target.value)}
                                    />
                                </Field>

                                <div className="space-y-3">
                                    <label id="modal-select-permissions-label" htmlFor="modal-select-permissions-group" className="text-[12.5px] font-semibold text-[#424242]">{tr("general.selectPermissions")}</label>
                                    <div id="modal-select-permissions-group" role="group" aria-labelledby="modal-select-permissions-label" className="bg-[#F5F6F8]/50 rounded-[4px] border border-[#E0E0E0] p-3 max-h-[200px] overflow-y-auto custom-scrollbar space-y-1.5">
                                        {permissions.map(perm => (
                                            <button 
                                                key={perm.id}
                                                type="button"
                                                onClick={() => {
                                                    if (selectedPermissionIds.includes(perm.id)) {
                                                        setSelectedPermissionIds(selectedPermissionIds.filter(id => id !== perm.id));
                                                    } else {
                                                        setSelectedPermissionIds([...selectedPermissionIds, perm.id]);
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-[4px] border text-[11px] font-bold transition-all ${selectedPermissionIds.includes(perm.id) ? "bg-[#212121] border-[#212121] text-white shadow-md" : "bg-white border-[#E0E0E0] text-[#757575] hover:border-[#9E9E9E]"}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedPermissionIds.includes(perm.id) ? "bg-[#1976D2]" : "bg-slate-300"}`} />
                                                    <span>{perm.module}</span>
                                                </div>
                                                <span className="opacity-60">{perm.action}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button type="submit" fullWidth disabled={isLoading} className="mt-4">
                                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {isLoading ? tr("general.saving") : tr("general.createRole")}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reassign roles modal */}
            <AnimatePresence>
                {reassignTarget && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#212121]/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            className="w-full max-w-md bg-white rounded-[4px] shadow-[0_14px_34px_rgba(0,0,0,0.16)] border border-[#E0E0E0] overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-[#E0E0E0] flex items-center justify-between">
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-[#212121]">{tr("general.reassignRoles")}</h3>
                                    <p className="text-[12.5px] text-[#757575] font-medium mt-0.5">{`${reassignTarget.first_name || ""} ${reassignTarget.last_name || ""}`.trim() || reassignTarget.email}</p>
                                </div>
                                <button onClick={() => setReassignTarget(null)} className="p-1.5 hover:bg-[#F5F6F8] text-[#9E9E9E] hover:text-[#4F4F4F] rounded-lg transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 max-h-[360px] overflow-y-auto space-y-2 custom-scrollbar">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => toggleReassignRole(role.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-[4px] border text-left transition-all ${reassignRoleIds.includes(role.id) ? 'bg-[#212121] border-[#212121] text-white' : 'bg-white border-[#E0E0E0] text-[#424242] hover:border-[#9E9E9E]'}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold truncate">{role.name}</p>
                                            <p className={`text-[11px] truncate ${reassignRoleIds.includes(role.id) ? 'text-white/60' : 'text-[#757575]'}`}>{role.description || tr("general.orgAccessRole")}</p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full shrink-0 ml-3 ${reassignRoleIds.includes(role.id) ? 'bg-[#1976D2] ring-4 ring-[#1976D2]/30' : 'bg-[#E0E0E0]'}`} />
                                    </button>
                                ))}
                                {roles.length === 0 && (
                                    <p className="text-[12.5px] text-[#757575] text-center py-6">{tr("general.noRolesAvailable")}</p>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-[#E0E0E0] flex justify-end gap-3 bg-[#FAFAFA]/50">
                                <Button variant="secondary" onClick={() => setReassignTarget(null)}>{tr("general.cancel")}</Button>
                                <Button onClick={handleSaveReassign} disabled={isSavingMember}>
                                    {isSavingMember ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {tr("general.saveRoles")}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={handleRemoveMember}
                title={tr("general.removeMemberTitle")}
                message={tr("general.removeMemberMessage", { name: `${memberToRemove?.first_name || ""} ${memberToRemove?.last_name || ""}`.trim() || memberToRemove?.email || tr("general.thisMember") })}
                confirmLabel={tr("general.removeMember")}
                cancelLabel={tr("general.cancel")}
                isDestructive={true}
            />
        </div>
    );
}

function TeamFallback() {
    const { t: tr } = useI18n();
    return <div className="p-8">{tr("general.loadingPortal")}</div>;
}

export default function TeamManagementPage() {
    return (
        <Suspense fallback={<TeamFallback />}>
            <TeamManagementContent />
        </Suspense>
    );
}
