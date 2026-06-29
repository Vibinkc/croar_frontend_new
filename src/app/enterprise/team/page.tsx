"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
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

    const filteredMembers = members.filter(m => {
        const fullName = `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email;
        const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRoleFilter === "ALL" || m.roles?.some((r: Role) => r.name === selectedRoleFilter);
        return matchesSearch && matchesRole;
    });

    return (
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Team Management</h1>
                        <PageHelp title="Team Management">
                            <p>Control who can sign in to Croar and what they can do.</p>
                            <p><strong>Members</strong> are the people with access. <strong>Roles</strong> bundle permissions — assign a role to grant the right level of access.</p>
                            <p>Invite a member, then give them one or more roles.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Organization personnel &amp; access</p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                    {/* Invite/Create Button */}
                    {activeTab === "members"
                        ? canAccess("employees:moderate") && (
                            <Button size="sm" icon="person_add" onClick={() => setShowInviteModal(true)}>
                                Invite Member
                            </Button>
                        )
                        : canAccess("employees:moderate") && (
                            <Button size="sm" icon="add_moderator" onClick={() => setShowRoleModal(true)}>
                                Create Role
                            </Button>
                        )}

                    <div className="flex bg-[#E8EAED] rounded-[10px] p-0.5 border border-[#E8EAED]">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`h-8 px-4 rounded-[8px] text-[13px] font-semibold transition-all ${activeTab === "members" ? "bg-white text-[#15171C] shadow-sm" : "text-[#6B6F76] hover:text-[#374151]"}`}
                        >
                            Members
                        </button>
                        {canAccess("employees:moderate") && (
                            <button
                                onClick={() => setActiveTab("roles")}
                                className={`h-8 px-4 rounded-[8px] text-[13px] font-semibold transition-all ${activeTab === "roles" ? "bg-white text-[#15171C] shadow-sm" : "text-[#6B6F76] hover:text-[#374151]"}`}
                            >
                                Roles
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Stat Cards */}
            <StatGrid>
                <StatCard label="Total Members" value={members.length} icon="group" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.25)" />
                <StatCard label="Active Roles" value={roles.length} icon="verified_user" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="System Roles" value={roles.filter(r => r.is_system).length} icon="lock" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
                <StatCard label="Global Permissions" value={permissions.length || "—"} icon="security" gradient="linear-gradient(135deg,#FBBF24,#D97706)" glow="rgba(217,119,6,0.25)" />
            </StatGrid>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Input
                    icon="search"
                    type="text"
                    placeholder="Search members by name or email..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:flex-none">
                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-[19px] pointer-events-none">filter_list</span>
                        <Select
                            className="h-11 pl-10 pr-8 text-[13px] font-semibold text-[#374151] w-full md:w-auto md:min-w-[160px]"
                            value={selectedRoleFilter}
                            onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchData}
                        aria-label="Refresh"
                        className="w-11 h-11 px-0 shrink-0"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {activeTab === "members" ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">Active Members</h2>
                        <Badge tone="neutral">{filteredMembers.length} team members</Badge>
                    </div>

                    {filteredMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[14px] border border-dashed border-[#E8EAED] shadow-sm">
                            <div className="relative mb-5">
                                <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/10 blur-xl" />
                                <div className="relative w-14 h-14 rounded-[16px] flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)", boxShadow: "0 8px 24px rgba(91,83,224,0.3)" }}>
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-[16px] font-bold text-[#15171C] mb-1">No members found</h3>
                            <p className="text-[#8A929E] text-[13px] max-w-xs mx-auto mb-5">Try adjusting your search query or role filter.</p>
                            <Button size="sm" onClick={() => { setSearchQuery(""); setSelectedRoleFilter("ALL"); }}>
                                Reset Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[14px] border border-[#E8EAED] bg-white shadow-sm">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#F7F8FA] border-b border-[#E8EAED]">
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Member Name</th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Email Address</th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-[#8A929E] uppercase tracking-[0.06em]">Assigned Roles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F0F1]">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-[#F7F8FA]/60 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-extrabold border border-[#DAD7F6]/60 shadow-sm text-[12px] uppercase">
                                                        {member.first_name || member.last_name ? (
                                                            ((member.first_name?.[0] || "") + (member.last_name?.[0] || "")).toUpperCase()
                                                        ) : (
                                                            <UserCircle className="w-5 h-5 stroke-[1.5]" />
                                                        )}
                                                    </div>
                                                    <span className="text-[13.5px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors">{member.first_name} {member.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] text-[#6B6F76] font-medium">{member.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {member.roles?.map((r: Role) => (
                                                        <Badge key={r.id} tone="indigo">{r.name}</Badge>
                                                    ))}
                                                    {(!member.roles || member.roles.length === 0) && (
                                                        <Badge tone="neutral">Unassigned</Badge>
                                                    )}
                                                </div>
                                            </td>
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
                        <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">Access Control</h2>
                        <Badge tone="neutral">{roles.length} available roles</Badge>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {roles.map(role => (
                            <Card key={role.id} interactive className="flex flex-col justify-between min-h-[165px]">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center border ${role.is_system ? 'bg-[#15171C] text-white border-[#15171C]' : 'bg-[#ECEBFB] text-[#5B53E0] border-[#DAD7F6]/80'}`}>
                                            <Shield className="w-4 h-4 stroke-[1.5]" />
                                        </div>
                                        {role.is_system ? (
                                            <span className="p-1.5 bg-[#E8EAED] text-[#8A929E] rounded-[6px] border border-[#E8EAED]">
                                                <Lock className="w-3 h-3" />
                                            </span>
                                        ) : (
                                            canAccess("employees:moderate") && (
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="p-1.5 bg-[#FDECEC] border border-[#F7D7D7] text-[#C0383C] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all rounded-[6px]"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <h3 className="text-[14px] font-bold text-[#15171C] mb-1">{role.name}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] leading-normal line-clamp-2 h-9 mb-4">{role.description || "Standard organizational access control permissions."}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#E8EAED]">
                                    {role.permissions?.slice(0, 3).map((p: Permission) => (
                                        <Badge key={p.id} tone="neutral" className="rounded-[6px] px-2 py-0.5 text-[10px]">
                                            {p.module}
                                        </Badge>
                                    ))}
                                    {(role.permissions?.length ?? 0) > 3 && (
                                        <span className="text-[10px] font-bold text-[#5B53E0] ml-0.5 self-center">+{(role.permissions?.length ?? 0) - 3} more</span>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white border border-[#E8EAED] rounded-[14px] p-6 max-w-md w-full shadow-xl space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#ECEBFB] text-[#5B53E0] rounded-[8px]">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">Invite Member</h3>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="First Name" htmlFor="modal-member-first-name">
                                        <Input
                                            id="modal-member-first-name"
                                            placeholder="John"
                                            value={memberFirstName} onChange={e => setMemberFirstName(e.target.value)} required
                                        />
                                    </Field>
                                    <Field label="Last Name" htmlFor="modal-member-last-name">
                                        <Input
                                            id="modal-member-last-name"
                                            placeholder="Doe"
                                            value={memberLastName} onChange={e => setMemberLastName(e.target.value)} required
                                        />
                                    </Field>
                                </div>

                                <Field label="Email Address" htmlFor="modal-member-email">
                                    <Input
                                        id="modal-member-email"
                                        icon="mail"
                                        placeholder="john@example.com"
                                        type="email"
                                        value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required
                                    />
                                </Field>

                                <Field label="Temporary Password" htmlFor="modal-member-password">
                                    <Input
                                        id="modal-member-password"
                                        icon="lock"
                                        placeholder="••••••••"
                                        type="password"
                                        value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required
                                    />
                                </Field>

                                <div className="space-y-3">
                                    <label id="modal-assign-roles-label" htmlFor="modal-assign-roles-group" className="text-[12.5px] font-semibold text-[#374151]">Assign Roles</label>
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
                                                className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all border ${selectedRoleIds.includes(role.id) ? "bg-[#15171C] border-[#15171C] text-white shadow-sm" : "bg-white border-[#E1E4E8] text-[#8A929E] hover:border-[#9AA3AF]"}`}
                                            >
                                                {role.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button type="submit" fullWidth disabled={isLoading} className="mt-4">
                                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {isLoading ? "Inviting..." : "Invite Member"}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Role Modal */}
            <AnimatePresence>
                {showRoleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white border border-[#E8EAED] rounded-[14px] p-6 max-w-lg w-full shadow-xl space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#ECEBFB] text-[#5B53E0] rounded-[8px]">
                                        <ShieldPlus className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[15px] font-bold text-[#15171C]">Create Custom Role</h3>
                                </div>
                                <button 
                                    onClick={() => setShowRoleModal(false)}
                                    className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4">
                                <Field label="Role Name" htmlFor="modal-role-name">
                                    <Input
                                        id="modal-role-name"
                                        placeholder="e.g. Marketing Manager"
                                        value={roleName} onChange={e => setRoleName(e.target.value)} required
                                    />
                                </Field>
                                <Field label="Description" htmlFor="modal-role-description">
                                    <Textarea
                                        id="modal-role-description"
                                        className="min-h-[90px]"
                                        placeholder="Clearly define what this role can access..."
                                        value={roleDescription} onChange={e => setRoleDescription(e.target.value)}
                                    />
                                </Field>

                                <div className="space-y-3">
                                    <label id="modal-select-permissions-label" htmlFor="modal-select-permissions-group" className="text-[12.5px] font-semibold text-[#374151]">Select Permissions</label>
                                    <div id="modal-select-permissions-group" role="group" aria-labelledby="modal-select-permissions-label" className="bg-[#F4F5F7]/50 rounded-[10px] border border-[#E8EAED] p-3 max-h-[200px] overflow-y-auto custom-scrollbar space-y-1.5">
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
                                                className={`w-full flex items-center justify-between p-2.5 rounded-[8px] border text-[11px] font-bold transition-all ${selectedPermissionIds.includes(perm.id) ? "bg-[#15171C] border-[#15171C] text-white shadow-md" : "bg-white border-[#E1E4E8] text-[#8A929E] hover:border-[#9AA3AF]"}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedPermissionIds.includes(perm.id) ? "bg-[#5B53E0]" : "bg-slate-300"}`} />
                                                    <span>{perm.module}</span>
                                                </div>
                                                <span className="opacity-60">{perm.action}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button type="submit" fullWidth disabled={isLoading} className="mt-4">
                                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {isLoading ? "Saving..." : "Create Role"}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TeamManagementPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading Portal...</div>}>
            <TeamManagementContent />
        </Suspense>
    );
}
