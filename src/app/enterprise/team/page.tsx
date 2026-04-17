"use client";

import { useEffect, useState, Suspense } from "react";
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

function TeamManagementContent() {
    const { role: userRole, canAccess } = useAuth();
    const [activeTab, setActiveTab] = useState<"members" | "roles">("members");
    const [members, setMembers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "members") {
                const [memRes, roleRes] = await Promise.all([
                    apiClient.get("/api/v1/enterprise/team/members"),
                    apiClient.get("/api/v1/enterprise/team/roles")
                ]);
                if (memRes.ok) setMembers(await memRes.json());
                if (roleRes.ok) setRoles(await roleRes.json());
            } else {
                const [roleRes, permRes] = await Promise.all([
                    apiClient.get("/api/v1/enterprise/team/roles"),
                    apiClient.get("/api/v1/platform/permissions")
                ]);
                if (roleRes.ok) setRoles(await roleRes.json());
                if (permRes.ok) setPermissions(await permRes.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

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
        } catch (e) {
            console.error(e);
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
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700 relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">groups</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Team Management</h1>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest italic">Manage organization personnel and access</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1">
                        <button 
                            onClick={() => setActiveTab("members")}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === "members" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            Members
                        </button>
                        {canAccess("team:moderate") && (
                            <button 
                                onClick={() => setActiveTab("roles")}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === "roles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                Roles
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={fetchData}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {activeTab === "members" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Members List */}
                    <div className={canAccess("team:moderate") ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Members</h2>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full">{members.length} team members</span>
                        </div>
                        
                        <div className={`grid gap-6 ${canAccess("team:moderate") ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                            <AnimatePresence mode="popLayout">
                                {members.map((member, i) => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={member.id} 
                                        className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group flex flex-col justify-between min-h-[160px]"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all border border-slate-100 group-hover:border-indigo-600 shadow-inner shrink-0">
                                                <UserCircle className="w-6 h-6 stroke-[1.5]" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                    {member.first_name} {member.last_name}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors truncate">{member.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50 mt-auto">
                                            {member.roles?.map((r: any) => (
                                                <span key={r.id} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-100/30">
                                                    {r.name}
                                                </span>
                                            ))}
                                            {(!member.roles || member.roles.length === 0) && (
                                                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100">
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
                    {canAccess("team:moderate") && (
                        <div className="lg:col-span-5">
                            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 sticky top-8">
                                <div className="space-y-2 mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <UserPlus className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Invite Member</h3>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">Add a new collaborator to the organization</p>
                                </div>
                                
                                <form onSubmit={handleAddMember} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 ml-1">First Name</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all font-semibold"
                                                placeholder="John"
                                                value={memberFirstName} onChange={e => setMemberFirstName(e.target.value)} required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Last Name</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all font-semibold"
                                                placeholder="Doe"
                                                value={memberLastName} onChange={e => setMemberLastName(e.target.value)} required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
                                        <div className="relative">
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                                placeholder="john@example.com"
                                                type="email"
                                                value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required
                                            />
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Temporary Password</label>
                                        <div className="relative">
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                                placeholder="••••••••"
                                                type="password"
                                                value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required
                                            />
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-900">Assign Roles</label>
                                        <div className="flex flex-wrap gap-2">
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
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedRoleIds.includes(role.id) ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"}`}
                                                >
                                                    {role.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 text-white h-14 rounded-xl text-sm font-bold mt-6 hover:bg-slate-900 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 overflow-hidden group"
                                    >
                                        {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                        {isLoading ? "Processing..." : "Invite Member"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Roles List */}
                    <div className={canAccess("team:moderate") ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Control</h2>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full">{roles.length} available roles</span>
                        </div>

                        <div className={`grid gap-6 ${canAccess("team:moderate") ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                            {roles.map(role => (
                                <div key={role.id} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 ${role.is_system ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <Shield className="w-7 h-7 stroke-[1.5]" />
                                        </div>
                                        {role.is_system ? (
                                            <span className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                                                <Lock className="w-4 h-4" />
                                            </span>
                                        ) : (
                                            canAccess("team:moderate") && (
                                                <button className="p-2 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{role.name}</h3>
                                    <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed line-clamp-2 h-10">{role.description || "Standard organizational access control permissions."}</p>
                                    
                                    <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50 mt-auto">
                                        {role.permissions?.slice(0, 3).map((p: any) => (
                                            <span key={p.id} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                                                {p.module}
                                            </span>
                                        ))}
                                        {role.permissions?.length > 3 && (
                                            <span className="text-xs font-bold text-indigo-400 ml-1 self-center">+{role.permissions.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Role Form */}
                    {canAccess("team:moderate") && (
                        <div className="lg:col-span-5">
                            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 sticky top-8">
                                <div className="space-y-2 mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <ShieldPlus className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Create Custom Role</h3>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">Define custom access policies and permissions</p>
                                </div>
                                
                                <form onSubmit={handleCreateRole} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Role Name</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                                            placeholder="e.g. Marketing Manager"
                                            value={roleName} onChange={e => setRoleName(e.target.value)} required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Description</label>
                                        <textarea 
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-600 transition-all min-h-[100px] shadow-inner"
                                            placeholder="Clearly define what this role can access..."
                                            value={roleDescription} onChange={e => setRoleDescription(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-900">Select Permissions</label>
                                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
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
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-[11px] font-bold transition-all ${selectedPermissionIds.includes(perm.id) ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${selectedPermissionIds.includes(perm.id) ? "bg-indigo-400" : "bg-slate-200"}`} />
                                                        <span className="uppercase tracking-wider">{perm.module}</span>
                                                    </div>
                                                    <span className="opacity-40 uppercase">{perm.action}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 text-white h-14 rounded-xl text-sm font-bold hover:bg-slate-900 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-4 group"
                                    >
                                        {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />}
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
