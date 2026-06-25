"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShieldHalf, 
    Settings2, 
    X, 
    Lock, 
    ShieldCheck, 
    RefreshCcw,
    LayoutGrid,
    Shield
} from "lucide-react";
import { jetbrainsMono } from "@/components/ds";

interface Permission {
    id: string;
    module: string;
    resource: string;
    action: string;
}

interface Role {
    id: string;
    name: string;
    description?: string;
    is_system?: boolean;
    permissions: Permission[];
}

function EnterpriseRolesContent() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [permSearch, setPermSearch] = useState("");
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    
    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
    const [roleSearch, setRoleSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                apiClient.get("/api/v1/enterprise/team/roles"),
                apiClient.get("/api/v1/enterprise/team/permissions")
            ]);
            
            if (rolesRes.ok) {
                const rolesData = await rolesRes.json();
                setRoles(rolesData);
            }
            if (permsRes.ok) {
                const permsData = await permsRes.json();
                setPermissions(permsData);
            }
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
        setSelectedPermIds([]);
        setIsEditing(true);
    };

    const handleOpenEdit = (role: Role) => {
        setSelectedRole(role);
        setName(role.name);
        setDescription(role.description || "");
        setSelectedPermIds(role.permissions.map((p: Permission) => p.id));
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                name,
                description,
                permission_ids: selectedPermIds
            };

            const res = selectedRole 
                ? await apiClient.put(`/api/v1/enterprise/team/roles/${selectedRole.id}`, payload)
                : await apiClient.post("/api/v1/enterprise/team/roles", payload);

            if (res.ok) {
                setIsEditing(false);
                fetchData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/team/roles/${id}`);
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

    const filteredPermissions = permissions.filter(p => 
        (p.resource?.toLowerCase() || "").includes(permSearch.toLowerCase()) || 
        (p.module?.toLowerCase() || "").includes(permSearch.toLowerCase())
    );

    const groupedPermissions = filteredPermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {});

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#ECEBFB] flex items-center justify-center shrink-0 border border-[#DAD7F6]/80">
                        <span className="material-symbols-rounded text-[18px] text-[#5B53E0]">security</span>
                    </div>
                    <div>
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Roles & Permissions</h1>
                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">Define access policies and roles</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {!isEditing && (
                        <button 
                            onClick={handleOpenCreate}
                            className="h-8 px-4 bg-[#5B53E0] hover:bg-[#4A43C9] text-white rounded-[10px] text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <span className="material-symbols-rounded text-[16px]">add</span>
                            Create Role
                        </button>
                    )}
                    <button 
                        onClick={fetchData}
                        className="w-8 h-8 bg-white border border-[#E1E4E8] rounded-[10px] text-[#6B6F76] hover:text-[#374151] hover:bg-[#F4F5F7] transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {!isEditing && (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {[
                            { label: "Total Roles", value: roles.length, Icon: Shield, grad: "linear-gradient(135deg,#8B7DFF,#5B53E0)", glow: "rgba(91,83,224,0.25)" },
                            { label: "System Roles", value: roles.filter(r => r.is_system).length, Icon: Lock, grad: "linear-gradient(135deg,#6E8BEA,#3559C7)", glow: "rgba(53,89,199,0.25)" },
                            { label: "Total Permissions", value: permissions.length, Icon: ShieldCheck, grad: "linear-gradient(135deg,#34D399,#0E8A6E)", glow: "rgba(14,138,110,0.25)" },
                            { label: "Security Health", value: "100%", Icon: ShieldHalf, grad: "linear-gradient(135deg,#FBBF24,#D97706)", glow: "rgba(217,119,6,0.25)" },
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
                                placeholder="Search roles by name or description..."
                                className="w-full h-10 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all text-[13.5px] text-[#15171C] placeholder:text-[#9AA3AF]"
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-[#E1E4E8] px-3 h-10 rounded-[10px] shadow-sm">
                            <span className="material-symbols-rounded text-[#9AA3AF] text-[20px]">filter_list</span>
                            <select 
                                className="bg-transparent text-[12px] font-bold text-[#374151] outline-none pr-2 cursor-pointer"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="ALL">All Policies</option>
                                <option value="SYSTEM">System Roles</option>
                                <option value="CUSTOM">Custom Roles</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-6xl mx-auto pb-20"
                    >
                        <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-[#E8EAED] shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center border border-[#DAD7F6]/80 shrink-0">
                                        <span className="material-symbols-rounded text-[22px] text-[#5B53E0]">security</span>
                                    </div>
                                    <div>
                                        <h2 className="text-[17px] font-bold text-[#15171C] tracking-tight leading-tight">{selectedRole ? "Configure Role" : "Create New Role"}</h2>
                                        <p className="text-[12.5px] text-[#8A929E] mt-0.5">{selectedRole ? "Modify existing access permissions" : "Set up a new organizational access profile"}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E4E8] text-[#6B6F76] hover:bg-[#F4F5F7] hover:text-[#374151] transition-all flex items-center justify-center shadow-sm">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 space-y-5">
                                    <div className="space-y-1.5 group">
                                        <label htmlFor="role-name" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Role Name</label>
                                        <input
                                            id="role-name"
                                            className="w-full h-10 bg-white border border-[#E1E4E8] px-3.5 rounded-[10px] text-[14px] text-[#15171C] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all"
                                            placeholder="e.g. Finance Lead"
                                            value={name} onChange={e => setName(e.target.value)} required
                                            disabled={selectedRole?.is_system}
                                        />
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label htmlFor="role-description" className="text-[11.5px] font-bold text-[#8A929E] ml-0.5">Role Description</label>
                                        <textarea
                                            id="role-description"
                                            className="w-full bg-white border border-[#E1E4E8] p-3.5 rounded-[10px] text-[13.5px] text-[#374151] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all resize-none min-h-[120px] leading-relaxed"
                                            placeholder="What can this role do?"
                                            value={description} onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-[#5B53E0] text-white h-10 rounded-[10px] text-[13px] font-semibold hover:bg-[#4A43C9] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                            {isLoading ? "Saving..." : (selectedRole ? "Update Permissions" : "Create Role")}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-8 space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-[#5B53E0] rounded-full" />
                                            <h3 className="text-[15px] font-bold text-[#15171C] tracking-tight">Permissions & Actions</h3>
                                        </div>
                                        <span className="text-[11.5px] font-bold text-[#5B53E0] bg-[#ECEBFB] px-3 py-1 rounded-full border border-[#DAD7F6]/60">{selectedPermIds.length} actions selected</span>
                                    </div>
                                    
                                    <div className="relative group">
                                        <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] group-focus-within:text-[#5B53E0] transition-colors text-[20px]">search</span>
                                        <input 
                                            type="text"
                                            placeholder="Search by module or resource..."
                                            className="w-full h-10 pl-11 pr-4 bg-white border border-[#E1E4E8] rounded-[10px] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15 transition-all text-[13.5px] text-[#15171C] placeholder:text-[#9AA3AF]"
                                            value={permSearch}
                                            onChange={(e) => setPermSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="bg-[#F4F5F7]/50 rounded-[10px] border border-[#E8EAED] p-4 max-h-[450px] overflow-y-auto custom-scrollbar space-y-6">
                                        {Object.keys(groupedPermissions).map(module => (
                                            <div key={module} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <LayoutGrid className="w-3.5 h-3.5 text-[#8A929E]" />
                                                    <h4 className="text-[11.5px] font-bold text-[#8A929E] uppercase tracking-wider">{module} Module</h4>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                    {groupedPermissions[module].map((perm: Permission) => (
                                                        <button
                                                            key={perm.id}
                                                            type="button"
                                                            onClick={() => togglePermission(perm.id)}
                                                            className={`p-3.5 rounded-[10px] border text-left transition-all flex items-center justify-between group/node ${selectedPermIds.includes(perm.id) ? 'bg-[#15171C] border-[#15171C] text-white shadow-sm' : 'bg-white text-[#374151] border-[#E1E4E8] hover:border-[#9AA3AF]'}`}
                                                        >
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{perm.resource}</p>
                                                                <p className="text-[12.5px] font-bold capitalize">{perm.action}</p>
                                                            </div>
                                                            <div className={`w-2 h-2 rounded-full transition-all shrink-0 ml-2 ${selectedPermIds.includes(perm.id) ? 'bg-[#5B53E0] ring-4 ring-[#5B53E0]/20' : 'bg-[#E1E4E8] group-hover/node:bg-[#DAD7F6]'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-[14px] border border-[#E8EAED] shadow-sm overflow-hidden"
                    >
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F4F5F7] border-b border-[#E8EAED]">
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">Role Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">Permissions</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#8A929E] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EAED]">
                                {roles.filter(role => {
                                    const matchesSearch = (role.name + (role.description || "")).toLowerCase().includes(roleSearch.toLowerCase());
                                    const matchesType = typeFilter === "ALL" || (typeFilter === "SYSTEM" ? role.is_system : !role.is_system);
                                    return matchesSearch && matchesType;
                                }).map((role) => (
                                    <motion.tr 
                                        key={role.id}
                                        className="hover:bg-[#F4F5F7]/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center border ${role.is_system ? 'bg-[#15171C] border-[#15171C] text-white' : 'bg-[#ECEBFB] border-[#DAD7F6]/80 text-[#5B53E0]'}`}>
                                                    <Shield className="w-4.5 h-4.5 stroke-[1.5]" />
                                                </div>
                                                <div>
                                                    <p className="text-[13.5px] font-bold text-[#15171C]">{role.name}</p>
                                                    <p className={`text-[10px] text-[#8A929E] mt-0.5 ${jetbrainsMono.className}`}>ID: {role.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[13px] text-[#6B6F76] line-clamp-1 max-w-xs">{role.description || "Standard policy."}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 bg-[#E8EAED]/60 text-[#6B6F76] rounded-[6px] text-[10px] font-bold border border-[#E8EAED] ${jetbrainsMono.className}`}>
                                                {role.permissions?.length || 0} Actions
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {role.is_system ? (
                                                <span className="px-2 py-0.5 bg-[#15171C] text-white rounded-[6px] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit border border-[#15171C]">
                                                    <Lock className="w-2.5 h-2.5" />
                                                    System
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-[#ECEBFB] text-[#5B53E0] border border-[#DAD7F6]/60 rounded-[6px] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                                    <Settings2 className="w-2.5 h-2.5" />
                                                    Custom
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => handleOpenEdit(role)}
                                                    className="w-8 h-8 flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:bg-[#ECEBFB] rounded-[8px] border border-transparent hover:border-[#DAD7F6]/60 transition-all"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                {!role.is_system && (
                                                    <button 
                                                        onClick={() => handleDelete(role.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-[#8A929E] hover:text-rose-500 hover:bg-rose-50 rounded-[8px] border border-transparent hover:border-rose-100 transition-all"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function EnterpriseRolesPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading Security Panel...</div>}>
            <EnterpriseRolesContent />
        </Suspense>
    );
}

