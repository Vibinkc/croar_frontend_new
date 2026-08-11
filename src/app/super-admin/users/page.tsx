"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import {
    Search,
    Filter,
    ChevronDown,
    RefreshCcw,
    Building2,
    UserCheck,
    UserX,
    Trash2,
} from "lucide-react";
import {
    PageHeader,
    StatCard,
    StatGrid,
    Badge,
    Button,
    EmptyState,
    jetbrainsMono,
} from "@/components/ds";

interface UserRecord {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
    company_id: string;
}

export default function GlobalUsersPage() {
    const { token } = useAuth();
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const toggleUserStatus = async (userId: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/users/${userId}/toggle-status`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            } else {
                alert(t("superAdmin.failedUpdateAccount"));
            }
        } catch (e) {
            console.error("Failed to toggle status", e);
            alert(t("superAdmin.connErrorUpdating"));
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm(t("superAdmin.deleteUserConfirm"))) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/super-admin/system/users/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            } else {
                const err = await res.json().catch(() => null);
                alert(err?.detail || t("superAdmin.failedDeleteUser"));
            }
        } catch (e) {
            console.error("Failed to delete user", e);
            alert(t("superAdmin.connErrorDeleting"));
        }
    };

    const filteredUsers = users.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            (u.email || "").toLowerCase().includes(q) ||
            (u.first_name || "").toLowerCase().includes(q) ||
            (u.last_name || "").toLowerCase().includes(q);
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && u.is_active) ||
            (statusFilter === "disabled" && !u.is_active);
        return matchesSearch && matchesStatus;
    });

    const activeCount = users.filter(u => u.is_active).length;
    const disabledCount = users.filter(u => !u.is_active).length;
    const orgCount = new Set(users.map(u => u.company_id).filter(Boolean)).size;

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <PageHeader
                title={t("superAdmin.globalUsersTitle")}
                subtitle={t("superAdmin.monitoringAccounts", { count: users.length })}
                help={<><p>{t("superAdmin.globalUsersHelp1")}</p><p>{t("superAdmin.globalUsersHelp2")}</p></>}
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchUsers}>
                        <RefreshCcw className="w-3.5 h-3.5" /> {t("superAdmin.refresh")}
                    </Button>
                }
            />

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={t("superAdmin.statTotalUsers")} value={users.length} icon="group" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label={t("superAdmin.active")} value={activeCount} icon="verified_user" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label={t("superAdmin.disabled")} value={disabledCount} icon="person_off" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
                <StatCard label={t("superAdmin.organizations")} value={orgCount} icon="domain" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("superAdmin.searchNameEmailPlaceholder")}
                        className="w-full h-10 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-4 text-[14px] text-[#15171C] placeholder:text-[#9AA3AF] outline-none focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[170px]`}
                        >
                            <option value="all">{t("superAdmin.allAccounts")}</option>
                            <option value="active">{t("superAdmin.activeOnly")}</option>
                            <option value="disabled">{t("superAdmin.disabled")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Users list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    users.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="group"
                            title={t("superAdmin.noUsersYet")}
                            description={t("superAdmin.noUsersDescGlobal")}
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title={t("superAdmin.noUsersMatchFilters")}
                            description={t("superAdmin.noUsersMatchFiltersDesc")}
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                    }}
                                >
                                    {t("superAdmin.resetFilters")}
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_0.9fr_1fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.colUserProfile")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.colOrgId")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.colJoinedDate")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{t("superAdmin.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_0.9fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* User Profile */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-extrabold text-[12px] uppercase shrink-0">
                                            {((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || "U"}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span className="block text-[11px] text-[#8A929E] truncate">{user.email}</span>
                                            {/* mobile-only meta */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px] text-[#8A929E] md:hidden">
                                                <span className={jetbrainsMono.className}>{user.company_id?.split('-')[0]}…</span>
                                                <span>· {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Organization ID (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 min-w-0">
                                        <Building2 className="w-4 h-4 text-[#9AA3AF] shrink-0" />
                                        <span className={`text-[12px] text-[#374151] bg-[#F1F2F5] px-2 py-0.5 rounded-[8px] truncate ${jetbrainsMono.className}`}>
                                            {user.company_id?.split('-')[0]}…
                                        </span>
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">
                                        {user.is_active ? (
                                            <Badge tone="success" dot>{t("superAdmin.active")}</Badge>
                                        ) : (
                                            <Badge tone="danger" dot>{t("superAdmin.disabled")}</Badge>
                                        )}
                                    </div>

                                    {/* Joined Date (desktop) */}
                                    <div className={`hidden md:block text-[13px] text-[#374151] ${jetbrainsMono.className}`}>
                                        {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>

                                    {/* Status (mobile) + actions */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">
                                            {user.is_active ? (
                                                <Badge tone="success" dot>{t("superAdmin.active")}</Badge>
                                            ) : (
                                                <Badge tone="danger" dot>{t("superAdmin.disabled")}</Badge>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => toggleUserStatus(user.id)}
                                            title={user.is_active ? t("superAdmin.deactivateUser") : t("superAdmin.activateUser")}
                                            className={`w-9 h-9 flex items-center justify-center rounded-[9px] transition-colors ${
                                                user.is_active
                                                    ? "text-[#9AA3AF] hover:bg-[#FEF3E2] hover:text-[#D97706]"
                                                    : "text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0]"
                                            }`}
                                        >
                                            {user.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            title={t("superAdmin.deletePermanently")}
                                            className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
