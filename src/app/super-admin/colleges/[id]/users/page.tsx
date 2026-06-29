"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, Card, Field, Input, Select, Button, Badge, EmptyState, type BadgeProps } from "@/components/ds";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
}

export default function CollegeUserManagement() {
    const { id } = useParams();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // New User State
    const [newUser, setNewUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "STUDENT"
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
                setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "STUDENT" });
            } else {
                alert("Failed to create user");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm("Are you sure?")) return;
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

    const filteredUsers = users.filter(u => {
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        const q = searchQuery.toLowerCase();
        return fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title="Tenant Users"
                subtitle={`Tenant ID: ${id}`}
                onBack={() => router.back()}
                help={
                    <>
                        <p>The users within this tenant.</p>
                        <p>Search and manage their accounts.</p>
                    </>
                }
                actions={
                    <Button icon="person_add" onClick={() => setShowModal(true)}>
                        Add User
                    </Button>
                }
            />

            {/* Search */}
            <Input
                icon="search"
                type="text"
                placeholder="Search users by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    users.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="group"
                            title="No users yet"
                            description="Add the first user to this tenant to give them access."
                            action={
                                <Button icon="person_add" onClick={() => setShowModal(true)}>
                                    Add User
                                </Button>
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title="No users match your search"
                            description="Try a different name or email."
                            action={
                                <Button variant="secondary" onClick={() => setSearchQuery("")}>
                                    Clear search
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        <div className="hidden md:grid grid-cols-[2.4fr_2fr_1fr_120px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Name</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Email</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Role</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_2fr_1fr_120px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-bold text-[12px] shrink-0">
                                            {initials(u)}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#15171C] truncate">
                                                {u.first_name} {u.last_name}
                                            </span>
                                            <span className="block text-[12px] text-[#8A929E] truncate md:hidden">{u.email}</span>
                                        </div>
                                    </div>

                                    {/* Email (desktop) */}
                                    <div className="hidden md:flex items-center text-[13px] text-[#374151] min-w-0">
                                        <span className="truncate">{u.email}</span>
                                    </div>

                                    {/* Role */}
                                    <div className="hidden md:flex items-center">
                                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">
                                            <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                            title="Remove user"
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

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm">
                    <Card padding="lg" className="max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center">
                                    <span className="material-icons-outlined text-[18px]">person_add</span>
                                </span>
                                <h3 className="text-[15px] font-bold text-[#15171C]">Create User</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors"
                            >
                                <span className="material-icons-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First Name" htmlFor="user-first-name">
                                    <Input id="user-first-name" placeholder="John" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} required />
                                </Field>
                                <Field label="Last Name" htmlFor="user-last-name">
                                    <Input id="user-last-name" placeholder="Doe" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} required />
                                </Field>
                            </div>
                            <Field label="Email" htmlFor="user-email">
                                <Input id="user-email" icon="mail" type="email" placeholder="john@example.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            </Field>
                            <Field label="Password" htmlFor="user-password">
                                <Input id="user-password" icon="lock" type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            </Field>
                            <Field label="Role" htmlFor="user-role">
                                <Select id="user-role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="STUDENT">Student</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="FACULTY">Faculty</option>
                                </Select>
                            </Field>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" fullWidth>Create</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
