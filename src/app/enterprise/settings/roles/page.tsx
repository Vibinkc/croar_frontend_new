"use client";

import { useEffect, useState, Suspense } from "react";
import { useI18n } from "@/context/I18nContext";
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
import { jetbrainsMono, PageHelp } from "@/components/ds";

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
    const { t: tr } = useI18n();
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
    const [initialSnapshot, setInitialSnapshot] = useState("");

    const snapshotOf = (n: string, d: string, perms: string[]) =>
        JSON.stringify({ n, d, perms: [...perms].sort() });

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
        setInitialSnapshot(snapshotOf("", "", []));
        setIsEditing(true);
    };

    const handleOpenEdit = (role: Role) => {
        const permIds = role.permissions.map((p: Permission) => p.id);
        setSelectedRole(role);
        setName(role.name);
        setDescription(role.description || "");
        setSelectedPermIds(permIds);
        setInitialSnapshot(snapshotOf(role.name, role.description || "", permIds));
        setIsEditing(true);
    };

    const isDirty = snapshotOf(name, description, selectedPermIds) !== initialSnapshot;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        // Nothing changed on an existing role — don't re-save.
        if (selectedRole && !isDirty) return;
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
        <div className="px-4 sm:px-5 pb-20 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("general.rolesPermissions")}</h1>
                        <PageHelp title={tr("general.rolesPermissions")}>
                            <p>{tr("general.helpRoles")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("general.defineAccess")}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {!isEditing && (
                        <button 
                            onClick={handleOpenCreate}
                            className="h-8 px-4 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <span className="material-symbols-rounded text-[16px]">add</span>
                            {tr("general.createRole")}
                        </button>
                    )}
                    <button 
                        onClick={fetchData}
                        className="w-8 h-8 bg-white border border-[#E0E0E0] rounded-[4px] text-[#616161] hover:text-[#424242] hover:bg-[#F5F6F8] transition-all flex items-center justify-center shadow-sm"
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
                            { label: tr("general.totalRoles"), value: roles.length, Icon: Shield, grad: "linear-gradient(135deg,#42A5F5,#1976D2)", glow: "rgba(25,118,210,0.25)", tip: tr("general.totalRolesTip") },
                            { label: tr("general.builtinRoles"), value: roles.filter(r => r.is_system).length, Icon: Lock, grad: "linear-gradient(135deg,#42A5F5,#1565C0)", glow: "rgba(21,101,192,0.25)", tip: tr("general.builtinRolesTip") },
                            { label: tr("general.customRoles"), value: roles.filter(r => !r.is_system).length, Icon: ShieldCheck, grad: "linear-gradient(135deg,#66BB6A,#2E7D32)", glow: "rgba(46,125,50,0.25)", tip: tr("general.customRolesTip") },
                            { label: tr("general.permissionTypes"), value: permissions.length, Icon: ShieldHalf, grad: "linear-gradient(135deg,#FFB300,#EF6C00)", glow: "rgba(239,108,0,0.25)", tip: tr("general.permissionTypesTip") },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="relative bg-white border border-[#E0E0E0] rounded-[4px] p-5 overflow-hidden flex flex-col justify-between min-h-[110px]"
                            >
                                <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.grad }} />
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] cursor-help" title={s.tip}>{s.label}</span>
                                        <div className={`text-[26px] font-semibold tracking-[-1px] text-[#212121] mt-1.5 ${jetbrainsMono.className}`}>{s.value}</div>
                                    </div>
                                    <span className="w-9 h-9 rounded-[4px] flex items-center justify-center text-white shrink-0" style={{ background: s.grad, boxShadow: `0 6px 14px ${s.glow}` }}>
                                        <s.Icon className="w-4.5 h-4.5" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1 group">
                            <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors text-[20px]">search</span>
                            <input 
                                type="text"
                                placeholder={tr("general.searchRolesPlaceholder")}
                                className="w-full h-10 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all text-[13.5px] text-[#212121] placeholder:text-[#9E9E9E]"
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-[#E0E0E0] px-3 h-10 rounded-[4px] shadow-sm">
                            <span className="material-symbols-rounded text-[#9E9E9E] text-[20px]">filter_list</span>
                            <select 
                                className="bg-transparent text-[12px] font-bold text-[#424242] outline-none pr-2 cursor-pointer"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="ALL">{tr("general.allPolicies")}</option>
                                <option value="SYSTEM">{tr("general.systemRoles")}</option>
                                <option value="CUSTOM">{tr("general.customRoles")}</option>
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
                        <div className="bg-white p-6 sm:p-8 rounded-[4px] border border-[#E0E0E0] shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/80 shrink-0">
                                        <span className="material-symbols-rounded text-[22px] text-[#1976D2]">security</span>
                                    </div>
                                    <div>
                                        <h2 className="text-[17px] font-bold text-[#212121] tracking-tight leading-tight">{selectedRole ? tr("general.configureRole") : tr("general.createNewRole")}</h2>
                                        <p className="text-[12.5px] text-[#757575] mt-0.5">{selectedRole ? tr("general.modifyPermissions") : tr("general.setupAccessProfile")}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="w-9 h-9 rounded-[4px] bg-white border border-[#E0E0E0] text-[#616161] hover:bg-[#F5F6F8] hover:text-[#424242] transition-all flex items-center justify-center shadow-sm">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-3 flex flex-col justify-between">
                                    <div className="space-y-4 flex-1 flex flex-col mb-4">
                                        <div className="space-y-1.5 group">
                                            <label htmlFor="role-name" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("general.roleName")}</label>
                                            <input
                                                id="role-name"
                                                className="w-full h-10 bg-white border border-[#E0E0E0] px-3.5 rounded-[4px] text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all"
                                                placeholder={tr("general.roleNamePlaceholder")}
                                                value={name} onChange={e => setName(e.target.value)} required
                                                disabled={selectedRole?.is_system}
                                            />
                                        </div>
                                        <div className="space-y-1.5 group flex-1 flex flex-col">
                                            <label htmlFor="role-description" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("general.roleDescription")}</label>
                                            <textarea
                                                id="role-description"
                                                className="w-full bg-white border border-[#E0E0E0] p-3.5 rounded-[4px] text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none flex-1 min-h-[120px] leading-relaxed"
                                                placeholder={tr("general.roleDescPlaceholder")}
                                                value={description} onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading || !!selectedRole?.is_system || (!!selectedRole && !isDirty)}
                                            title={
                                                selectedRole?.is_system
                                                    ? tr("general.systemRolesReadOnly")
                                                    : selectedRole && !isDirty
                                                        ? tr("general.noChangesYet")
                                                        : undefined
                                            }
                                            className="w-full bg-[#1976D2] text-white h-10 rounded-[4px] text-[13px] font-semibold hover:bg-[#1565C0] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1976D2]"
                                        >
                                            {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                            {isLoading ? tr("general.saving") : selectedRole?.is_system ? tr("general.readOnly") : selectedRole ? tr("general.updatePermissions") : tr("general.createRole")}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-9 space-y-5">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-[#1976D2] rounded-full" />
                                            <h3 className="text-[15px] font-bold text-[#212121] tracking-tight">{tr("general.permissionsActions")}</h3>
                                        </div>
                                        <span className="text-[11.5px] font-bold text-[#1976D2] bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#BBDEFB]/60">{tr("general.actionsSelected", { count: selectedPermIds.length })}</span>
                                    </div>

                                    {selectedRole?.is_system && (
                                        <div className="flex items-center gap-2 rounded-[4px] border border-[#E0E0E0] bg-[#F5F6F8] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#616161]">
                                            <Lock className="w-3.5 h-3.5 shrink-0" />
                                            {tr("general.systemRoleReadOnlyNote")}
                                        </div>
                                    )}
                                    
                                    <div className="relative group">
                                        <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] group-focus-within:text-[#1976D2] transition-colors text-[20px]">search</span>
                                        <input 
                                            type="text"
                                            placeholder={tr("general.searchModuleResource")}
                                            className="w-full h-10 pl-11 pr-4 bg-white border border-[#E0E0E0] rounded-[4px] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all text-[13.5px] text-[#212121] placeholder:text-[#9E9E9E]"
                                            value={permSearch}
                                            onChange={(e) => setPermSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="bg-[#F5F6F8]/50 rounded-[4px] border border-[#E0E0E0] p-4 max-h-[520px] overflow-y-auto custom-scrollbar space-y-6">
                                        {Object.keys(groupedPermissions).map(module => (
                                            <div key={module} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 shrink-0">
                                                        <LayoutGrid className="w-3.5 h-3.5" />
                                                    </span>
                                                    <h4 className="text-[11.5px] font-bold text-[#212121] uppercase tracking-wider">{tr("general.moduleSuffix", { module })}</h4>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                                    {groupedPermissions[module].map((perm: Permission) => (
                                                        <button
                                                            key={perm.id}
                                                            type="button"
                                                            disabled={selectedRole?.is_system}
                                                            onClick={() => togglePermission(perm.id)}
                                                            className={`p-3.5 rounded-[4px] border text-left transition-all flex items-center justify-between group/node disabled:opacity-60 disabled:cursor-not-allowed ${selectedPermIds.includes(perm.id) ? 'bg-[#212121] border-[#212121] text-white shadow-sm' : 'bg-white text-[#424242] border-[#E0E0E0] hover:border-[#9E9E9E]'}`}
                                                        >
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{perm.resource}</p>
                                                                <p className="text-[12.5px] font-bold capitalize">{perm.action}</p>
                                                            </div>
                                                            <div className={`w-2 h-2 rounded-full transition-all shrink-0 ml-2 ${selectedPermIds.includes(perm.id) ? 'bg-[#1976D2] ring-4 ring-[#1976D2]/20' : 'bg-[#E0E0E0] group-hover/node:bg-[#BBDEFB]'}`} />
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
                        className="bg-white rounded-[4px] border border-[#E0E0E0] shadow-sm overflow-hidden"
                    >
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F5F6F8] border-b border-[#E0E0E0]">
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-wider">{tr("general.roleName")}</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-wider">{tr("general.description")}</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-wider">{tr("general.permissions")}</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-wider">{tr("general.type")}</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#757575] uppercase tracking-wider text-right">{tr("general.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0E0E0]">
                                {roles.filter(role => {
                                    const matchesSearch = (role.name + (role.description || "")).toLowerCase().includes(roleSearch.toLowerCase());
                                    const matchesType = typeFilter === "ALL" || (typeFilter === "SYSTEM" ? role.is_system : !role.is_system);
                                    return matchesSearch && matchesType;
                                }).map((role) => (
                                    <motion.tr 
                                        key={role.id}
                                        className="hover:bg-[#F5F6F8]/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center border ${role.is_system ? 'bg-[#212121] border-[#212121] text-white' : 'bg-[#E3F2FD] border-[#BBDEFB]/80 text-[#1976D2]'}`}>
                                                    <Shield className="w-4.5 h-4.5 stroke-[1.5]" />
                                                </div>
                                                <div>
                                                    <p className="text-[13.5px] font-bold text-[#212121]">{role.name}</p>
                                                    <p className={`text-[10px] text-[#757575] mt-0.5 ${jetbrainsMono.className}`}>ID: {role.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[13px] text-[#616161] line-clamp-1 max-w-xs">{role.description || tr("general.standardPolicy")}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 bg-[#E0E0E0]/60 text-[#616161] rounded-[3px] text-[10px] font-bold border border-[#E0E0E0] ${jetbrainsMono.className}`}>
                                                {role.permissions?.length || 0} Actions
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {role.is_system ? (
                                                <span className="px-2 py-0.5 bg-[#212121] text-white rounded-[3px] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit border border-[#212121]">
                                                    <Lock className="w-2.5 h-2.5" />
                                                    {tr("general.system")}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-[#E3F2FD] text-[#1976D2] border border-[#BBDEFB]/60 rounded-[3px] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                                    <Settings2 className="w-2.5 h-2.5" />
                                                    {tr("general.custom")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => handleOpenEdit(role)}
                                                    className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:bg-[#E3F2FD] rounded-[4px] border border-transparent hover:border-[#BBDEFB]/60 transition-all"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                {!role.is_system && (
                                                    <button 
                                                        onClick={() => handleDelete(role.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-[#757575] hover:text-rose-500 hover:bg-rose-50 rounded-[4px] border border-transparent hover:border-rose-100 transition-all"
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

function RolesFallback() {
    const { t: tr } = useI18n();
    return <div className="p-8">{tr("general.loadingSecurityPanel")}</div>;
}

export default function EnterpriseRolesPage() {
    return (
        <Suspense fallback={<RolesFallback />}>
            <EnterpriseRolesContent />
        </Suspense>
    );
}

