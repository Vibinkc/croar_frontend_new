"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, Card, Field, Input, Select, Button, Badge, EmptyState, type BadgeProps } from "@/components/ds";
import { useI18n } from "@/context/I18nContext";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
}

export default function OrganizationUserManagement() {
    const { id } = useParams();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { t } = useI18n();

    const [newUser, setNewUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "MEMBER",
    });

    useEffect(() => {
        fetchUsers();
    }, [id]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${id}/users`);
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiClient.post(`/api/v1/super-admin/tenants/${id}/users`, newUser);
            if (res.ok) {
                setShowModal(false);
                fetchUsers();
                setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "MEMBER" });
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || t("superAdmin.failedCreateUser"));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm(t("superAdmin.removeUserConfirm"))) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}/users/${userId}`);
            if (res.ok) {
                fetchUsers();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const roleTone = (role: string): BadgeProps["tone"] =>
        role === "ADMIN" ? "indigo" : role === "SUPER_ADMIN" ? "danger" : "teal";

    const initials = (u: User) =>
        ((u.first_name?.[0] || "") + (u.last_name?.[0] || "")).toUpperCase() || "?";

    const filteredUsers = users.filter((u) => {
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        const q = searchQuery.toLowerCase();
        return fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title={t("superAdmin.orgUsersTitle")}
                subtitle={t("superAdmin.orgUsersSubtitle")}
                onBack={() => router.push("/super-admin/organizations")}
                help={
                    <>
                        <p>{t("superAdmin.orgUsersHelp1")}</p>
                        <p>{t("superAdmin.orgUsersHelp2")}</p>
                    </>
                }
                actions={
                    <Button icon="person_add" onClick={() => setShowModal(true)}>
                        {t("superAdmin.addUser")}
                    </Button>
                }
            />

            <Input
                icon="search"
                type="text"
                placeholder={t("superAdmin.searchUsersPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    users.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="group"
                            title={t("superAdmin.noUsersYet")}
                            description={t("superAdmin.addFirstUserDesc")}
                            action={
                                <Button icon="person_add" onClick={() => setShowModal(true)}>
                                    {t("superAdmin.addUser")}
                                </Button>
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title={t("superAdmin.noUsersMatchSearch")}
                            description={t("superAdmin.tryDiffNameEmail")}
                            action={
                                <Button variant="secondary" onClick={() => setSearchQuery("")}>
                                    {t("superAdmin.clearSearch")}
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        <div className="hidden md:grid grid-cols-[2.4fr_2fr_1fr_120px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.name")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.email")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{t("superAdmin.role")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{t("superAdmin.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredUsers.map((u) => (
                                <div
                                    key={u.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_2fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center font-bold text-[12px] shrink-0">
                                            {initials(u)}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#212121] truncate">
                                                {u.first_name} {u.last_name}
                                            </span>
                                            <span className="block text-[12px] text-[#757575] truncate md:hidden">{u.email}</span>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex items-center text-[13px] text-[#424242] min-w-0">
                                        <span className="truncate">{u.email}</span>
                                    </div>

                                    <div className="hidden md:flex items-center">
                                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                                    </div>

                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">
                                            <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors"
                                            title={t("superAdmin.removeUser")}
                                        >
                                            <i className="mdi mdi-delete text-[18px]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212121]/40 backdrop-blur-sm">
                    <Card padding="lg" className="max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center">
                                    <i className="mdi mdi-account-plus text-[18px]" />
                                </span>
                                <h3 className="text-[15px] font-bold text-[#212121]">{t("superAdmin.createUser")}</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-[3px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors"
                            >
                                <i className="mdi mdi-close text-[18px]" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label={t("superAdmin.firstName")} htmlFor="user-first-name">
                                    <Input id="user-first-name" placeholder="John" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} required />
                                </Field>
                                <Field label={t("superAdmin.lastName")} htmlFor="user-last-name">
                                    <Input id="user-last-name" placeholder="Doe" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} required />
                                </Field>
                            </div>
                            <Field label={t("superAdmin.email")} htmlFor="user-email">
                                <Input id="user-email" icon="mail" type="email" placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                            </Field>
                            <Field label={t("superAdmin.password")} htmlFor="user-password">
                                <Input id="user-password" icon="lock" type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                            </Field>
                            <Field label={t("superAdmin.role")} htmlFor="user-role">
                                <Select id="user-role" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="MEMBER">{t("superAdmin.roleMember")}</option>
                                    <option value="ADMIN">{t("superAdmin.roleAdmin")}</option>
                                    <option value="MANAGER">{t("superAdmin.roleManager")}</option>
                                </Select>
                            </Field>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>{t("superAdmin.cancel")}</Button>
                                <Button type="submit" fullWidth>{t("superAdmin.create")}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
