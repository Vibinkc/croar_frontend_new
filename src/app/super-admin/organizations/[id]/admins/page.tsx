"use client";

import { useEffect, useState, use } from "react";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import { PageHeader, Card, Field, Input, Button, Badge } from "@/components/ds";
import { EmptyState } from "@/components/ds";
import { useI18n } from "@/context/I18nContext";

interface Admin {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
    is_active: boolean;
}

export default function ManageOrganizationAdmins({ params }: { params: Promise<{ id: string }> }) {
    const { id: orgId } = use(params);
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { t } = useI18n();

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        fetchAdmins();
    }, [orgId]);

    const fetchAdmins = async () => {
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${orgId}/admins`);
            if (res.ok) {
                setAdmins(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await apiClient.post(`/api/v1/super-admin/tenants/${orgId}/admins`, {
                first_name: firstName,
                last_name: lastName,
                email,
                password,
            });
            if (res.ok) {
                await fetchAdmins();
                setFirstName("");
                setLastName("");
                setEmail("");
                setPassword("");
                setShowModal(false);
            } else {
                const err = await res.json();
                alert(err.detail || t("superAdmin.failedCreateAdmin"));
            }
        } catch (e) {
            console.error(e);
            alert(t("superAdmin.errorOccurred"));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (adminId: number) => {
        if (!confirm(t("superAdmin.removeAdminConfirm"))) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${orgId}/admins/${adminId}`);
            if (res.ok || res.status === 204) {
                setAdmins((prev) => prev.filter((a) => a.id !== adminId));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEdit = async (admin: Admin) => {
        const newFirstName = prompt(t("superAdmin.enterNewFirstName"), admin.first_name);
        if (newFirstName === null) return;
        const newLastName = prompt(t("superAdmin.enterNewLastName"), admin.last_name);
        if (newLastName === null) return;

        try {
            const res = await apiClient.put(`/api/v1/super-admin/tenants/${orgId}/admins/${admin.id}`, {
                first_name: newFirstName,
                last_name: newLastName,
            });
            if (res.ok) {
                fetchAdmins();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const initials = (admin: Admin) =>
        ((admin.first_name?.[0] || "") + (admin.last_name?.[0] || "")).toUpperCase() || "?";

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title={t("superAdmin.orgAdminsTitle")}
                subtitle={t("superAdmin.orgAdminsSubtitle")}
                onBack={() => router.push("/super-admin/organizations")}
                help={
                    <>
                        <p>{t("superAdmin.orgAdminsHelp1")}</p>
                        <p>{t("superAdmin.orgAdminsHelp2")}</p>
                    </>
                }
                actions={
                    <Button icon="person_add" onClick={() => setShowModal(true)}>
                        {t("superAdmin.addAdmin")}
                    </Button>
                }
            />

            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : admins.length === 0 ? (
                    <EmptyState
                        tone="brand"
                        icon="admin_panel_settings"
                        title={t("superAdmin.noAdminsYet")}
                        description={t("superAdmin.noAdminsDesc")}
                        action={
                            <Button icon="person_add" onClick={() => setShowModal(true)}>
                                {t("superAdmin.addAdmin")}
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <div className="hidden md:grid grid-cols-[2.4fr_2fr_1fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.colAdmin")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.email")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">{t("superAdmin.role")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">{t("superAdmin.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {admins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_2fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-bold text-[12px] shrink-0">
                                            {initials(admin)}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#15171C] truncate">
                                                {admin.first_name} {admin.last_name}
                                            </span>
                                            <span className="block text-[12px] text-[#8A929E] truncate md:hidden">{admin.email}</span>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex items-center text-[13px] text-[#374151] min-w-0">
                                        <span className="truncate">{admin.email}</span>
                                    </div>

                                    <div className="hidden md:flex items-center">
                                        <Badge tone={admin.is_active ? "success" : "neutral"} dot>{admin.role}</Badge>
                                    </div>

                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">
                                            <Badge tone={admin.is_active ? "success" : "neutral"} dot>{admin.role}</Badge>
                                        </div>
                                        <button
                                            onClick={() => handleEdit(admin)}
                                            className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                            title={t("superAdmin.editAdmin")}
                                        >
                                            <span className="material-icons-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                            title={t("superAdmin.removeAdmin")}
                                        >
                                            <span className="material-icons-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="lg" className="max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                    <span className="material-icons-outlined text-[18px]">person_add</span>
                                </span>
                                <h3 className="text-[15px] font-bold text-[#15171C]">{t("superAdmin.addNewAdmin")}</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                            >
                                <span className="material-icons-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label={t("superAdmin.firstName")} htmlFor="admin-first-name">
                                    <Input id="admin-first-name" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                </Field>
                                <Field label={t("superAdmin.lastName")} htmlFor="admin-last-name">
                                    <Input id="admin-last-name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                </Field>
                            </div>
                            <Field label={t("superAdmin.emailUsername")} htmlFor="admin-email">
                                <Input id="admin-email" icon="mail" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </Field>
                            <Field label={t("superAdmin.securePassword")} htmlFor="admin-password">
                                <Input id="admin-password" icon="lock" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </Field>
                            <Button type="submit" fullWidth disabled={isCreating} icon="shield" className="mt-2">
                                {isCreating ? t("superAdmin.provisioning") : t("superAdmin.addAdministrator")}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
