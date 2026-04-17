"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";

function RolesContent() {
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
            
            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (permsRes.ok) setPermissions(await permsRes.json());
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

    const handleOpenEdit = (role: any) => {
        setSelectedRole(role);
        setName(role.name);
        setDescription(role.description || "");
        setRank(role.role_rank);
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
                alert(`Error: ${err.detail || "Failed to save role"}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the role globally.")) return;
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

    const groupedPermissions = filteredPermissions.reduce((acc: any, perm: any) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {});

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Global RBAC Control</h1>
                {!isEditing && (
                    <button 
                        onClick={handleOpenCreate}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-sm">security</span>
                        Define New Role
                    </button>
                )}
            </div>
                {isEditing ? (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100/50">
                                        <span className="material-icons-outlined text-2xl">admin_panel_settings</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">{selectedRole ? "Refine Role" : "Draft System Role"}</h2>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Configuring System Authority Level</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                                    <span className="material-icons-outlined text-base">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Role Identity</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all"
                                                placeholder="e.g. REGIONAL_MANAGER"
                                                value={name} onChange={e => setName(e.target.value.toUpperCase())} required
                                                disabled={selectedRole?.is_system}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rank Priority (Lower = higher auth)</label>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all"
                                                type="number"
                                                value={rank} onChange={e => setRank(parseInt(e.target.value))} required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Capabilities Summary</label>
                                            <textarea
                                                className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all resize-none min-h-[120px]"
                                                placeholder="Describe what this role manages..."
                                                value={description} onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-1">
                                                Assigned Permissions
                                                <span className="text-indigo-600 font-black ml-3">{selectedPermIds.length} Active</span>
                                            </label>
                                        </div>
                                        
                                        <div className="relative mb-4">
                                            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                            <input 
                                                type="text"
                                                placeholder="Filter capabilities..."
                                                className="w-full bg-slate-100 border-none p-4 pl-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                                value={permSearch}
                                                onChange={(e) => setPermSearch(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-8">
                                            {Object.keys(groupedPermissions).map(module => (
                                                <div key={module} className="space-y-3">
                                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">{module} Module</h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {groupedPermissions[module].map((perm: any) => (
                                                            <div 
                                                                key={perm.id}
                                                                onClick={() => togglePermission(perm.id)}
                                                                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-between ${selectedPermIds.includes(perm.id) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                <span>{perm.resource} : {perm.action}</span>
                                                                {selectedPermIds.includes(perm.id) && <span className="material-icons-outlined text-xs">check_circle</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-10 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-900 text-white p-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all"
                                    >
                                        {isLoading ? "Synchronizing..." : (selectedRole ? "Update Role Clearance" : "Authorize New System Role")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-6 pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role) => (
                                <div key={role.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden animate-in fade-in duration-500">
                                    {role.is_system && (
                                        <div className="absolute top-0 right-0 px-6 py-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                                            System Default
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${role.is_system ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                            <span className="material-icons-outlined text-2xl">shield</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank Level</div>
                                            <div className="text-2xl font-black text-slate-900 tracking-tighter">0{role.role_rank}</div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-2 truncate">
                                        {role.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mb-8 min-h-[32px] line-clamp-2">
                                        {role.description || "System authority level for administrative operations."}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 mb-8">
                                        {role.permissions.slice(0, 4).map((p: any) => (
                                            <span key={p.id} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest border border-slate-100">
                                                {p.resource}
                                            </span>
                                        ))}
                                        {role.permissions.length > 4 && (
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                                                +{role.permissions.length - 4} More
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-6 border-t border-slate-50">
                                        <button 
                                            onClick={() => handleOpenEdit(role)}
                                            className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons-outlined text-sm">edit_note</span>
                                            Configure
                                        </button>
                                        {!role.is_system && (
                                            <button 
                                                onClick={() => handleDelete(role.id)}
                                                className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                            >
                                                <span className="material-icons-outlined text-lg">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}

export default function RolesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-b-4 border-slate-900 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Encrypting Authority Map...</p>
                </div>
            </div>
        }>
            <RolesContent />
        </Suspense>
    );
}
