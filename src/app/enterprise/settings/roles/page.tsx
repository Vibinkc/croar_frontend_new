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

function EnterpriseRolesContent() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [permSearch, setPermSearch] = useState("");
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRole, setSelectedRole] = useState<any | null>(null);
    
    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

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

    const handleOpenEdit = (role: any) => {
        setSelectedRole(role);
        setName(role.name);
        setDescription(role.description || "");
        setSelectedPermIds(role.permissions.map((p: any) => p.id));
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

    const groupedPermissions = filteredPermissions.reduce((acc: any, perm: any) => {
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
                        <p className="text-slate-500 text-[10px] font-medium   ">Define access policies and roles</p>
                    </div>
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleOpenCreate}
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-all font-black text-[9px]   flex items-center gap-2 shadow-xl shadow-indigo-100"
                        >
                            <span className="material-symbols-rounded text-base">add</span>
                            Create Role
                        </button>
                        <button 
                            onClick={fetchData}
                            className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 hover:border-violet-100 transition-all flex items-center justify-center shadow-sm"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                )}
            </div>

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
                                        <label className="text-xs font-bold text-slate-500 group-focus-within:text-indigo-600 transition-colors ml-1">Role Name</label>
                                        <input
                                            className="w-full h-14 bg-slate-50 border border-slate-100 px-6 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                                            placeholder="e.g. Finance Lead"
                                            value={name} onChange={e => setName(e.target.value)} required
                                            disabled={selectedRole?.is_system}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-slate-500 group-focus-within:text-indigo-600 transition-colors ml-1">Role Description</label>
                                        <textarea
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
                                                    {groupedPermissions[module].map((perm: any) => (
                                                        <div 
                                                            key={perm.id}
                                                            onClick={() => togglePermission(perm.id)}
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
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {roles.map((role) => (
                            <motion.div 
                                layout
                                key={role.id} 
                                className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col relative cursor-pointer"
                                onClick={() => handleOpenEdit(role)}
                            >
                                {role.is_system && (
                                    <div className="absolute top-4 right-6 px-3 py-1 bg-slate-900 text-white text-[10px] font-bold   rounded-xl shadow-xl z-20">
                                        System Role
                                    </div>
                                )}
                                
                                <div className="p-6 pb-2 space-y-8 flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-inner border border-slate-100 ${role.is_system ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'}`}>
                                            <Shield className="w-6 h-6 stroke-[1.5]" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold text-slate-900">{role.name}</h3>
                                        <p className="text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed h-10">
                                            {role.description || "Standard organizational access control permissions."}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-all">
                                        <p className="text-[10px] font-bold text-slate-400   mb-1">Top Permissions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {role.permissions.slice(0, 3).map((p: any) => (
                                                <span key={p.id} className="px-2.5 py-1 bg-white text-slate-500 rounded-xl text-[10px] font-bold   border border-slate-100">
                                                    {p.resource}
                                                </span>
                                            ))}
                                            {role.permissions.length > 3 && (
                                                <span className="text-[10px] font-bold text-indigo-400 ml-1 self-center">
                                                    +{role.permissions.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200/50 rounded-b-3xl mt-auto">
                                    <button 
                                        onClick={() => handleOpenEdit(role)}
                                        className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600   flex items-center gap-1.5 transition-all underline underline-offset-4"
                                    >
                                        Edit Policy
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    {!role.is_system && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(role.id);
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
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
