"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShieldHalf, 
    Plus, 
    Settings2, 
    Search, 
    X, 
    Trash2, 
    Lock, 
    ShieldCheck, 
    ChevronRight,
    RefreshCcw,
    Zap,
    LayoutGrid,
    Shield
} from "lucide-react";

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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-2 shadow-lg shadow-slate-200/20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 bg-violet-50 text-[#7C3AED] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-rounded">security</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Roles & Permissions</h1>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mt-0.5">Define access policies and roles</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isEditing && (
                        <button 
                            onClick={handleOpenCreate}
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add</span>
                            {"Create Role"}
                        </button>
                    )}
                    <button 
                        onClick={fetchData}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {!isEditing && (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#7C3AED]">Total Roles</span>
                                <div className="w-12 h-12 rounded-xl bg-violet-50 text-[#7C3AED] flex items-center justify-center transition-all group-hover:scale-110">
                                    <Shield className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                                {roles.length}
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">System Roles</span>
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center transition-all group-hover:scale-110">
                                    <Lock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                                {roles.filter(r => r.is_system).length}
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-500">Total Permissions</span>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center transition-all group-hover:scale-110">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                                {permissions.length}
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[140px]"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-amber-500">Security Health</span>
                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center transition-all group-hover:scale-110">
                                    <ShieldHalf className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-4xl font-black text-slate-900 mt-auto leading-none">
                                100%
                            </div>
                        </motion.div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1 group">
                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors">search</span>
                            <input 
                                type="text"
                                placeholder="Search roles by name or description..."
                                className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-xl outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50 transition-all font-medium text-sm"
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                            <span className="material-symbols-rounded text-slate-400 pl-2">filter_list</span>
                            <select 
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none pr-4 cursor-pointer"
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
                        <div className="bg-white p-10 rounded-xl border border-slate-200/60 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                        <Settings2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{selectedRole ? "Configure Role" : "Create New Role"}</h2>
                                        <p className="text-sm text-slate-400 font-medium mt-2">{selectedRole ? "Modify existing access permissions" : "Set up a new organizational access profile"}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="space-y-2 group">
                                        <label htmlFor="role-name" className="text-xs font-bold text-slate-500 group-focus-within:text-indigo-600 transition-colors ml-1">Role Name</label>
                                        <input
                                            id="role-name"
                                            className="w-full h-14 bg-slate-50 border border-slate-100 px-6 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                                            placeholder="e.g. Finance Lead"
                                            value={name} onChange={e => setName(e.target.value)} required
                                            disabled={selectedRole?.is_system}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label htmlFor="role-description" className="text-xs font-bold text-slate-500 group-focus-within:text-indigo-600 transition-colors ml-1">Role Description</label>
                                        <textarea
                                            id="role-description"
                                            className="w-full bg-slate-50 border border-slate-100 p-6 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all resize-none min-h-[160px] shadow-inner leading-relaxed"
                                            placeholder="What can this role do?"
                                            value={description} onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-8">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 text-white h-16 rounded-xl font-bold text-sm tracking-wide hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 group overflow-hidden"
                                        >
                                            {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                                            {isLoading ? "Saving..." : (selectedRole ? "Update Permissions" : "Create Role")}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-8 space-y-8">
                                    <div className="flex justify-between items-center px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Permissions & Actions</h3>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100/50">{selectedPermIds.length} actions selected</span>
                                    </div>
                                    
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                                        <input 
                                            type="text"
                                            placeholder="Search by module or resource..."
                                            className="w-full h-14 bg-slate-50 border border-slate-100 pl-14 pr-6 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                                            value={permSearch}
                                            onChange={(e) => setPermSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-xl border border-slate-200/50 p-6 max-h-[600px] overflow-y-auto custom-scrollbar space-y-10">
                                        {Object.keys(groupedPermissions).map(module => (
                                            <div key={module} className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                                                    <h4 className="text-xs font-bold text-slate-400  ">{module} Module</h4>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {groupedPermissions[module].map((perm: Permission) => (
                                                        <div
                                                            key={perm.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => togglePermission(perm.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    togglePermission(perm.id);
                                                                }
                                                            }}
                                                            className={`p-5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group/node ${selectedPermIds.includes(perm.id) ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                                        >
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold   opacity-50">{perm.resource}</p>
                                                                <p className="text-xs font-bold capitalize">{perm.action}</p>
                                                            </div>
                                                            <div className={`w-2 h-2 rounded-full transition-all ${selectedPermIds.includes(perm.id) ? 'bg-indigo-400 ring-4 ring-indigo-400/20' : 'bg-slate-200 group-hover/node:bg-slate-300'}`} />
                                                        </div>
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
                        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
                    >
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role Name</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Permissions</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.filter(role => {
                                    const matchesSearch = (role.name + (role.description || "")).toLowerCase().includes(roleSearch.toLowerCase());
                                    const matchesType = typeFilter === "ALL" || (typeFilter === "SYSTEM" ? role.is_system : !role.is_system);
                                    return matchesSearch && matchesType;
                                }).map((role) => (
                                    <motion.tr 
                                        key={role.id}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${role.is_system ? 'bg-slate-900 border-slate-900 text-white' : 'bg-violet-50 border-violet-100 text-[#7C3AED]'}`}>
                                                    <Shield className="w-5 h-5 stroke-[1.5]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{role.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Policy ID: {role.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm text-slate-500 font-medium line-clamp-1 max-w-xs">{role.description || "Standard policy."}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                                                    {role.permissions?.length || 0} Actions
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {role.is_system ? (
                                                <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                                                    <Lock className="w-3 h-3" />
                                                    System
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-violet-50 text-[#7C3AED] border border-violet-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                                                    <Settings2 className="w-3 h-3" />
                                                    Custom
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenEdit(role)}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#7C3AED] hover:bg-violet-50 rounded-xl transition-all"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                {!role.is_system && (
                                                    <button 
                                                        onClick={() => handleDelete(role.id)}
                                                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
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
