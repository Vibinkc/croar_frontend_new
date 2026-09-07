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
} from "@/components/icons";
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
        "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

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
                <StatCard label={t("superAdmin.statTotalUsers")} value={users.length} icon="group" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
                <StatCard label={t("superAdmin.active")} value={activeCount} icon="verified_user" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={t("superAdmin.disabled")} value={disabledCount} icon="person_off" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
                <StatCard label={t("superAdmin.organizations")} value={orgCount} icon="domain" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("superAdmin.searchNameEmailPlaceholder")}
                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-4 text-[14px] text-[#212121] placeholder:text-[#9E9E9E] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectCls} w-full md:min-w-[170px]`}
                        >
                            <option value="all">{t("superAdmin.allAccounts")}</option>
                            <option value="active">{t("superAdmin.activeOnly")}</option>
                            <option value="disabled">{t("superAdmin.disabled")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Users list */}
            <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
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
                        <div className="hidden md:grid grid-cols-[2.4fr_1.4fr_0.9fr_1fr_120px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.colUserProfile")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.colOrgId")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.colJoinedDate")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{t("superAdmin.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.4fr_0.9fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                                >
                                    {/* User Profile */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center font-extrabold text-[12px] uppercase shrink-0">
                                            {((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || "U"}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span className="block text-[11px] text-[#757575] truncate">{user.email}</span>
                                            {/* mobile-only meta */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px] text-[#757575] md:hidden">
                                                <span className={jetbrainsMono.className}>{user.company_id?.split('-')[0]}…</span>
                                                <span>· {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Organization ID (desktop) */}
                                    <div className="hidden md:flex items-center gap-1.5 min-w-0">
                                        <Building2 className="w-4 h-4 text-[#9E9E9E] shrink-0" />
                                        <span className={`text-[12px] text-[#424242] bg-[#EEEEEE] px-2 py-0.5 rounded-[4px] truncate ${jetbrainsMono.className}`}>
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
                                    <div className={`hidden md:block text-[13px] text-[#424242] ${jetbrainsMono.className}`}>
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
                                            className={`w-9 h-9 flex items-center justify-center rounded-[4px] transition-colors ${
                                                user.is_active
                                                    ? "text-[#9E9E9E] hover:bg-[#FFF3E0] hover:text-[#EF6C00]"
                                                    : "text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2]"
                                            }`}
                                        >
                                            {user.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            title={t("superAdmin.deletePermanently")}
                                            className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors"
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
