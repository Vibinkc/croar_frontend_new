"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Filter,
    ChevronDown,
    Edit3,
    KeyRound,
    Trash2,
    Badge as BadgeIcon,
    X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Button, StatCard, StatGrid, Badge, Input, PageHelp, EmptyState, jetbrainsMono } from "@/components/ds";

interface Department {
    id: string;
    name: string;
}

interface Employee {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    designation: string;
    status: string;
    hire_date: string;
    department?: Department;
}

export default function EmployeesPage() {
    const { token, canAccess } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
    // Employee workspace login creation
    const [accountEmp, setAccountEmp] = useState<Employee | null>(null);
    const [accountPassword, setAccountPassword] = useState("");
    const [accountBusy, setAccountBusy] = useState(false);
    const [accountMsg, setAccountMsg] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/v1/enterprise/employees/");
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!employeeToDelete) return;
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/employees/${employeeToDelete}`);
            if (res.ok) fetchEmployees();
            else alert("Failed to delete employee");
        } catch (e) {
            console.error(e);
        } finally {
            setIsConfirmModalOpen(false);
            setEmployeeToDelete(null);
        }
    };

    const handleCreateAccount = async () => {
        if (!accountEmp) return;
        setAccountBusy(true);
        setAccountMsg(null);
        try {
            const res = await apiClient.post(
                `/api/v1/enterprise/employees/${accountEmp.id}/account`,
                { password: accountPassword }
            );
            if (res.ok) {
                setAccountMsg({
                    ok: true,
                    text: `Login created. ${accountEmp.email} can now sign in at the login page and will land on their own workspace.`,
                });
                setAccountPassword("");
            } else {
                const e = await res.json().catch(() => ({}));
                setAccountMsg({ ok: false, text: e.detail || "Failed to create login." });
            }
        } catch {
            setAccountMsg({ ok: false, text: "Network error. Please try again." });
        } finally {
            setAccountBusy(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = (emp.first_name + " " + emp.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
                             emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             emp.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const newHires = employees.filter(e => e.hire_date && new Date(e.hire_date) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length;
    const activeCount = employees.filter(e => e.status === 'Active').length;
    const departmentCount = new Set(employees.filter(e => e.department).map(e => e.department?.id)).size;

    const selectCls =
        "appearance-none bg-white border border-[#E1E4E8] rounded-[10px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#374151] outline-none cursor-pointer hover:bg-[#F7F7F8] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20 transition-all";

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F4F5F7]/95 backdrop-blur-sm border-b border-[#E8EAED] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Employee Directory</h1>
                        <PageHelp title="Employee Directory">
                            <p>Your single source of truth for everyone in the organisation.</p>
                            <p><strong>Add employees</strong> (or convert hired candidates), assign them to <strong>departments</strong>, and open a record to manage details and documents.</p>
                            <p>Use search and the status filter to find people fast.</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#8A929E] mt-0.5">Manage your workforce, departments &amp; records</p>
                </div>
                <div className="flex items-center gap-2.5 sm:shrink-0">
                    {canAccess("employees:create") && (
                        <Link href="/enterprise/employees/add">
                            <Button size="sm" icon="add">Add Employee</Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label="Total Employees" value={employees.length} icon="group" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
                <StatCard label="Active Workforce" value={activeCount} icon="verified_user" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
                <StatCard label="Departments" value={departmentCount} icon="domain" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
                <StatCard label="New Hires" value={newHires} icon="person_add" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9AA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, ID, or email..."
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
                            <option value="all">All Workforce</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Employee list */}
            <div className="bg-white rounded-[14px] border border-[#E8EAED] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-16 bg-[#F4F5F7] rounded-[12px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    employees.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="badge"
                            title="Add your first employee"
                            description="Your directory is empty. Add people manually, or convert hired candidates from the Onboarding Hub."
                            action={
                                canAccess("employees:create") ? (
                                    <Link href="/enterprise/employees/add">
                                        <Button icon="add">Add Employee</Button>
                                    </Link>
                                ) : undefined
                            }
                            secondary={
                                <Link href="/enterprise/onboarding">
                                    <Button variant="secondary" icon="badge">Onboarding Hub</Button>
                                </Link>
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title="No employees match your filters"
                            description="Try a different search term or status, or reset your filters to see everyone."
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                    }}
                                >
                                    Reset filters
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_1.1fr_1fr_0.9fr_130px] gap-4 px-5 py-3 bg-[#F7F8FA] border-b border-[#E8EAED]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Employee</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Designation</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Department</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Hire Date</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E]">Status</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A929E] text-right">Actions</span>
                        </div>

                        <div className="divide-y divide-[#F0F0F1]">
                            {filteredEmployees.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.2fr_1.1fr_1fr_0.9fr_130px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#F7F7F8] transition-colors group"
                                >
                                    {/* Employee */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] flex items-center justify-center font-extrabold text-[12px] uppercase shrink-0">
                                            {((emp.first_name?.[0] || "") + (emp.last_name?.[0] || "")).toUpperCase() || <BadgeIcon className="w-4 h-4" />}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#15171C] group-hover:text-[#5B53E0] transition-colors truncate">
                                                {emp.first_name} {emp.last_name}
                                            </span>
                                            <span className="block text-[11px] text-[#8A929E] truncate">
                                                <span className={jetbrainsMono.className}>{emp.employee_id}</span> · {emp.email}
                                            </span>
                                            {/* mobile-only meta */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px] text-[#8A929E] md:hidden">
                                                <span>{emp.designation || "N/A"}</span>
                                                {emp.department?.name && <span>· {emp.department.name}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Designation (desktop) */}
                                    <div className="hidden md:block text-[13px] text-[#374151] truncate">
                                        {emp.designation || "N/A"}
                                    </div>

                                    {/* Department (desktop) */}
                                    <div className="hidden md:block text-[13px] text-[#374151] truncate">
                                        {emp.department?.name || "N/A"}
                                    </div>

                                    {/* Hire Date (desktop) */}
                                    <div className={`hidden md:block text-[13px] text-[#374151] ${jetbrainsMono.className}`}>
                                        {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : "N/A"}
                                    </div>

                                    {/* Status (desktop) */}
                                    <div className="hidden md:flex items-center">
                                        <Badge tone={emp.status === 'Active' ? 'success' : 'neutral'} dot>{emp.status}</Badge>
                                    </div>

                                    {/* Status (mobile) + actions */}
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="md:hidden mr-1">
                                            <Badge tone={emp.status === 'Active' ? 'success' : 'neutral'} dot>{emp.status}</Badge>
                                        </div>

                                        {canAccess("employees:update") && (
                                            <Link
                                                href={`/enterprise/employees/${emp.id}`}
                                                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                                title="Edit Employee"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {canAccess("employees:moderate") && (
                                            <button
                                                onClick={() => {
                                                    setAccountEmp(emp);
                                                    setAccountPassword("");
                                                    setAccountMsg(null);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                                title="Create Workspace Login"
                                            >
                                                <KeyRound className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canAccess("employees:delete") && (
                                            <button
                                                onClick={() => {
                                                    setEmployeeToDelete(emp.id);
                                                    setIsConfirmModalOpen(true);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                                title="Delete Employee"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Employee?"
                message="Are you sure you want to delete this employee? This action is permanent and all associated records will be removed."
                confirmLabel="Yes, Delete"
                cancelLabel="No"
                isDestructive={true}
            />

            {accountEmp && (
                <div
                    role="button"
                    tabIndex={-1}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#15171C]/40 p-4 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setAccountEmp(null); }}
                    onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setAccountEmp(null); }}
                >
                    <div className="w-full max-w-md rounded-[14px] border border-[#E8EAED] bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#ECEBFB] text-[#5B53E0] shrink-0">
                                    <KeyRound className="w-[18px] h-[18px]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[15px] font-bold text-[#15171C]">Create Workspace Login</h2>
                                    <p className="truncate text-[12.5px] text-[#8A929E]">
                                        {accountEmp.first_name} {accountEmp.last_name} · {accountEmp.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAccountEmp(null)}
                                className="w-7 h-7 rounded-[6px] hover:bg-[#F4F5F7] text-[#8A929E] hover:text-[#374151] flex items-center justify-center transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="mb-3 text-[12.5px] text-[#8A929E] leading-relaxed">
                            The employee signs in with <b className="text-[#374151]">{accountEmp.email}</b> and this password, and lands on
                            their own workspace (timesheets, payslips, leave) — not the admin area.
                        </p>
                        <Input
                            type="text"
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            placeholder="Temporary password (min 6 characters)"
                        />
                        {accountMsg && (
                            <p className={`mt-3 text-[13px] ${accountMsg.ok ? "text-[#15803D]" : "text-[#C0383C]"}`}>
                                {accountMsg.text}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setAccountEmp(null)}>
                                Close
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleCreateAccount}
                                disabled={accountBusy || accountPassword.length < 6}
                            >
                                {accountBusy ? "Creating…" : "Create Login"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
