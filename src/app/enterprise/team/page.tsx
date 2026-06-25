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
    X,
    Mail,
    Key,
    UserCircle
} from "lucide-react";
import { jetbrainsMono } from "@/components/ds";

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

    // Member Form State
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [memberPassword, setMemberPassword] = useState("");
    const [memberFirstName, setMemberFirstName] = useState("");
    const [memberLastName, setMemberLastName] = useState("");
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    // Role Form State
    const [isAddingRole, setIsAddingRole] = useState(false);
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
                setIsAddingMember(false);
                setMemberEmail("");
                setMemberPassword("");
                setMemberFirstName("");
                setMemberLastName("");
                setSelectedRoleIds([]);
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
                setIsAddingRole(false);
                setRoleName("");
                setRoleDescription("");
                setSelectedPermissionIds([]);
                fetchData();
            }
        } catch (error) {
            console.error("Failed to create role:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#ECEBFB] flex items-center justify-center shrink-0 border border-[#DAD7F6]/80">
                        <span className="material-symbols-rounded text-[18px] text-[#5B53E0]">groups</span>
                    </div>
                    <div>
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Team Management</h1>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Organization personnel &amp; access</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: "Total Members", value: members.length, Icon: Users, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
                    { label: "Active Roles", value: roles.length, Icon: ShieldCheck, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                    { label: "System Roles", value: roles.filter(r => r.is_system).length, Icon: Lock, grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                    { label: "Global Permissions", value: permissions.length || "—", Icon: Shield, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="relative bg-white border border-[#E8EAED] rounded-[14px] p-5 overflow-hidden flex flex-col justify-between min-h-[110px]"
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{s.label}</span>
                                <div className={`text-[26px] font-semibold tracking-[-1px] text-[#15171C] mt-1.5 ${jetbrainsMono.className}`}>{s.value}</div>
                            </div>
                            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                <s.Icon className="w-4.5 h-4.5" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors text-[20px]">search</span>
                    <input 
                        type="text"
                        placeholder="Search members by name or email..."
                        className="w-full h-10 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all text-[13.5px] text-[#15171C] placeholder:text-[#9AA3AF]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#E1E4E8] px-3 h-10 rounded-[10px] shadow-sm">
                    <span className="material-symbols-rounded text-[#9AA3AF] text-[20px]">filter_list</span>
                    <select 
                        className="bg-transparent text-[12px] font-bold text-[#374151] outline-none pr-2 cursor-pointer"
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={fetchData}
                    className="w-9 h-9 bg-white border border-[#E1E4E8] rounded-[10px] text-[#6B6F76] hover:text-[#374151] hover:bg-[#F4F5F7] transition-all flex items-center justify-center shadow-sm"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {activeTab === "members" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Members List */}
                    <div className={canAccess("employees:moderate") ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">Active Members</h2>
                            <span className="text-[12px] font-semibold text-[#8A929E] bg-[#E8EAED]/50 px-3 py-1 rounded-full">{members.length} team members</span>
                        </div>
                        
                        <div className={`grid gap-4 ${canAccess("employees:moderate") ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                            <AnimatePresence mode="popLayout">
                                {members.filter(m => {
                                    const matchesSearch = (m.first_name + " " + m.last_name + m.email).toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesRole = selectedRoleFilter === "ALL" || m.roles?.some((r: Role) => r.name === selectedRoleFilter);
                                    return matchesSearch && matchesRole;
                                }).map((member, i) => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        key={member.id} 
                                        className="bg-white border border-[#E8EAED] rounded-[14px] p-5 shadow-sm hover:border-[#5B53E0]/40 transition-all flex flex-col justify-between min-h-[145px]"
                                    >
                                        <div className="flex items-center gap-3.5 mb-3">
                                            <div className="w-11 h-11 rounded-[10px] bg-[#F4F5F7] text-[#8A929E] flex items-center justify-center font-bold text-[18px] border border-[#E8EAED] shrink-0">
                                                <UserCircle className="w-5.5 h-5.5 stroke-[1.5]" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="text-[14.5px] font-bold text-[#15171C] truncate">
                                                    {member.first_name} {member.last_name}
                                                </h3>
                                                <p className="text-[12.5px] text-[#8A929E] leading-none truncate mt-0.5">{member.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 pt-3.5 border-t border-[#F4F5F7] mt-auto">
                                            {member.roles?.map((r: Role) => (
                                                <span key={r.id} className="px-2.5 py-0.5 bg-[#ECEBFB] text-[#5B53E0] rounded-[8px] text-[10px] font-bold border border-[#DAD7F6]/60">
                                                    {r.name}
                                                </span>
                                            ))}
                                            {(!member.roles || member.roles.length === 0) && (
                                                <span className="px-2.5 py-0.5 bg-[#F4F5F7] text-[#8A929E] rounded-[8px] text-[10px] font-bold border border-[#E8EAED]">
                                                    Unassigned
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Add Member Form */}
                    {canAccess("employees:moderate") && (
                        <div className="lg:col-span-5">
                            <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8EAED] shadow-sm sticky top-6 space-y-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-[#ECEBFB] text-[#5B53E0] rounded-[8px]">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[15px] font-bold text-[#15171C]">Invite Member</h3>
                                    </div>
                                    <p className="text-[12.5px] text-[#8A929E]">Add a new collaborator to the organization</p>
                                </div>
                                
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label htmlFor="member-first-name" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">First Name</label>
                                            <input
                                                id="member-first-name"
                                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                placeholder="John"
                                                value={memberFirstName} onChange={e => setMemberFirstName(e.target.value)} required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="member-last-name" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Last Name</label>
                                            <input
                                                id="member-last-name"
                                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                placeholder="Doe"
                                                value={memberLastName} onChange={e => setMemberLastName(e.target.value)} required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label htmlFor="member-email" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Email Address</label>
                                        <div className="relative">
                                            <input
                                                id="member-email"
                                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                placeholder="john@example.com"
                                                type="email"
                                                value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required
                                            />
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="member-password" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Temporary Password</label>
                                        <div className="relative">
                                            <input
                                                id="member-password"
                                                className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                                placeholder="••••••••"
                                                type="password"
                                                value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required
                                            />
                                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label id="assign-roles-label" htmlFor="assign-roles-group" className="text-[12px] font-bold text-[#15171C]">Assign Roles</label>
                                        <div id="assign-roles-group" role="group" aria-labelledby="assign-roles-label" className="flex flex-wrap gap-1.5">
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

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#5B53E0] text-white h-10 rounded-[10px] text-[13px] font-semibold hover:bg-[#4A43C9] transition-all shadow-[0_4px_12px_rgba(91,83,224,0.28)] flex items-center justify-center gap-2 mt-4 disabled:opacity-40"
                                    >
                                        {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        {isLoading ? "Inviting..." : "Invite Member"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Roles List */}
                    <div className={canAccess("employees:moderate") ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[16px] font-bold text-[#15171C] tracking-tight">Access Control</h2>
                            <span className="text-[12px] font-semibold text-[#8A929E] bg-[#E8EAED]/50 px-3 py-1 rounded-full">{roles.length} available roles</span>
                        </div>

                        <div className={`grid gap-4 ${canAccess("employees:moderate") ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                            {roles.map(role => (
                                <div key={role.id} className="bg-white p-5 rounded-[14px] border border-[#E8EAED] shadow-sm hover:border-[#5B53E0]/40 transition-all flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center border border-[#E8EAED] ${role.is_system ? 'bg-[#15171C] text-white' : 'bg-[#ECEBFB] text-[#5B53E0]'}`}>
                                            <Shield className="w-5.5 h-5.5 stroke-[1.5]" />
                                        </div>
                                        {role.is_system ? (
                                            <span className="p-2 bg-[#F4F5F7] text-[#8A929E] rounded-[8px] border border-[#E8EAED]">
                                                <Lock className="w-3.5 h-3.5" />
                                            </span>
                                        ) : (
                                            canAccess("employees:moderate") && (
                                                <button className="p-2 bg-rose-50 border border-rose-100/50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all rounded-[8px]">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <h3 className="text-[15px] font-bold text-[#15171C] mb-1.5">{role.name}</h3>
                                    <p className="text-[12.5px] text-[#8A929E] leading-relaxed line-clamp-2 h-10 mb-6">{role.description || "Standard organizational access control permissions."}</p>
                                    
                                    <div className="flex flex-wrap gap-1.5 pt-5 border-t border-[#F4F5F7] mt-auto">
                                        {role.permissions?.slice(0, 3).map((p: Permission) => (
                                            <span key={p.id} className="px-2 py-0.5 bg-[#F4F5F7] text-[#8A929E] rounded-[6px] text-[10px] font-semibold border border-[#E8EAED]">
                                                {p.module}
                                            </span>
                                        ))}
                                        {(role.permissions?.length ?? 0) > 3 && (
                                            <span className="text-[11px] font-bold text-[#5B53E0] ml-1 self-center">+{(role.permissions?.length ?? 0) - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Role Form */}
                    {canAccess("employees:moderate") && (
                        <div className="lg:col-span-5">
                            <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8EAED] shadow-sm sticky top-6 space-y-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-[#ECEBFB] text-[#5B53E0] rounded-[8px]">
                                            <ShieldPlus className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[15px] font-bold text-[#15171C]">Create Custom Role</h3>
                                    </div>
                                    <p className="text-[12.5px] text-[#8A929E]">Define custom access policies and permissions</p>
                                </div>
                                
                                <form onSubmit={handleCreateRole} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="role-name" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Role Name</label>
                                        <input
                                            id="role-name"
                                            className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] px-3.5 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                            placeholder="e.g. Marketing Manager"
                                            value={roleName} onChange={e => setRoleName(e.target.value)} required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="role-description" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Description</label>
                                        <textarea
                                            id="role-description"
                                            className="w-full bg-white border border-[#E1E4E8] rounded-[10px] p-3 text-[13.5px] text-[#374151] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all min-h-[90px]"
                                            placeholder="Clearly define what this role can access..."
                                            value={roleDescription} onChange={e => setRoleDescription(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label id="select-permissions-label" htmlFor="select-permissions-group" className="text-[12px] font-bold text-[#15171C]">Select Permissions</label>
                                        <div id="select-permissions-group" role="group" aria-labelledby="select-permissions-label" className="bg-[#F4F5F7]/50 rounded-[10px] border border-[#E8EAED] p-3 max-h-[250px] overflow-y-auto custom-scrollbar space-y-1.5">
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
                                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedPermissionIds.includes(perm.id) ? "bg-indigo-400" : "bg-slate-300"}`} />
                                                        <span>{perm.module}</span>
                                                    </div>
                                                    <span className="opacity-60">{perm.action}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#5B53E0] text-white h-10 rounded-[10px] text-[13px] font-semibold hover:bg-[#4A43C9] transition-all shadow-[0_4px_12px_rgba(91,83,224,0.28)] flex items-center justify-center gap-2 mt-4 disabled:opacity-40"
                                    >
                                        {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        {isLoading ? "Saving..." : "Create Role"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
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
