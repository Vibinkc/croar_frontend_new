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
} from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
    const { t: tr } = useI18n();
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
            else alert(tr("postOnboarding.failedDeleteEmployee"));
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
                    text: tr("postOnboarding.loginCreated", { email: accountEmp.email }),
                });
                setAccountPassword("");
            } else {
                const e = await res.json().catch(() => ({}));
                setAccountMsg({ ok: false, text: e.detail || tr("postOnboarding.failedCreateLogin") });
            }
        } catch {
            setAccountMsg({ ok: false, text: tr("postOnboarding.networkError") });
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
        "appearance-none bg-white border border-[#E0E0E0] rounded-[4px] h-10 pl-9 pr-9 text-[13px] font-medium text-[#424242] outline-none cursor-pointer hover:bg-[#FAFAFA] focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all";

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-4 sm:pb-5 md:pb-7 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            {/* Header (sticky) */}
            <header className="sticky top-0 z-20 py-3 bg-[#F5F6F8]/95 backdrop-blur-sm border-b border-[#E0E0E0] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("postOnboarding.employeeDirectory")}</h1>
                        <PageHelp title={tr("postOnboarding.employeeDirectory")}>
                            <p>{tr("postOnboarding.employeesHelp1")}</p>
                            <p><strong>{tr("postOnboarding.addEmployees")}</strong> {tr("postOnboarding.employeesHelp2a")} <strong>{tr("postOnboarding.departmentsInline")}</strong>{tr("postOnboarding.employeesHelp2b")}</p>
                            <p>{tr("postOnboarding.employeesHelp3")}</p>
                        </PageHelp>
                    </div>
                    <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("postOnboarding.employeesSubtitle")}</p>
                </div>
                <div className="flex items-center gap-2.5 sm:shrink-0">
                    {canAccess("employees:create") && (
                        <Link href="/enterprise/employees/add">
                            <Button size="sm" icon="add">{tr("postOnboarding.addEmployee")}</Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Stat cards */}
            <StatGrid>
                <StatCard label={tr("postOnboarding.totalEmployees")} value={employees.length} icon="group" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
                <StatCard label={tr("postOnboarding.activeWorkforce")} value={activeCount} icon="verified_user" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
                <StatCard label={tr("postOnboarding.departments")} value={departmentCount} icon="domain" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
                <StatCard label={tr("postOnboarding.newHires")} value={newHires} icon="person_add" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
            </StatGrid>

            {/* Toolbar: search + filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9E9E9E]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tr("postOnboarding.searchEmployeesPlaceholder")}
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
                            <option value="all">{tr("postOnboarding.allWorkforce")}</option>
                            <option value="Active">{tr("postOnboarding.activeOnly")}</option>
                            <option value="Inactive">{tr("postOnboarding.inactive")}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Employee list */}
            <div className="bg-white rounded-[4px] border border-[#E0E0E0] overflow-hidden min-h-[420px]">
                {isLoading ? (
                    <div className="p-4 space-y-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-16 bg-[#F5F6F8] rounded-[4px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    employees.length === 0 ? (
                        <EmptyState
                            tone="brand"
                            icon="badge"
                            title={tr("postOnboarding.addFirstEmployee")}
                            description={tr("postOnboarding.addFirstEmployeeDesc")}
                            action={
                                canAccess("employees:create") ? (
                                    <Link href="/enterprise/employees/add">
                                        <Button icon="add">{tr("postOnboarding.addEmployee")}</Button>
                                    </Link>
                                ) : undefined
                            }
                            secondary={
                                <Link href="/enterprise/onboarding">
                                    <Button variant="secondary" icon="badge">{tr("onboarding.title")}</Button>
                                </Link>
                            }
                        />
                    ) : (
                        <EmptyState
                            tone="muted"
                            icon="search_off"
                            title={tr("postOnboarding.noEmployeesMatch")}
                            description={tr("postOnboarding.noEmployeesMatchDesc")}
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                    }}
                                >
                                    {tr("postOnboarding.resetFilters")}
                                </Button>
                            }
                        />
                    )
                ) : (
                    <>
                        {/* Column header (desktop) */}
                        <div className="hidden md:grid grid-cols-[2.4fr_1.2fr_1.1fr_1fr_0.9fr_130px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#E0E0E0]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.colEmployee")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.colDesignation")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.colDepartment")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.colHireDate")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575]">{tr("postOnboarding.status")}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#757575] text-right">{tr("postOnboarding.actions")}</span>
                        </div>

                        <div className="divide-y divide-[#EEEEEE]">
                            {filteredEmployees.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2.4fr_1.2fr_1.1fr_1fr_0.9fr_130px] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                                >
                                    {/* Employee */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-9 h-9 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center font-extrabold text-[12px] uppercase shrink-0">
                                            {((emp.first_name?.[0] || "") + (emp.last_name?.[0] || "")).toUpperCase() || <BadgeIcon className="w-4 h-4" />}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#212121] group-hover:text-[#1976D2] transition-colors truncate">
                                                {emp.first_name} {emp.last_name}
                                            </span>
                                            <span className="block text-[11px] text-[#757575] truncate">
                                                <span className={jetbrainsMono.className}>{emp.employee_id}</span> · {emp.email}
                                            </span>
                                            {/* mobile-only meta */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px] text-[#757575] md:hidden">
                                                <span>{emp.designation || tr("postOnboarding.na")}</span>
                                                {emp.department?.name && <span>· {emp.department.name}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Designation (desktop) */}
                                    <div className="hidden md:block text-[13px] text-[#424242] truncate">
                                        {emp.designation || tr("postOnboarding.na")}
                                    </div>

                                    {/* Department (desktop) */}
                                    <div className="hidden md:block text-[13px] text-[#424242] truncate">
                                        {emp.department?.name || tr("postOnboarding.na")}
                                    </div>

                                    {/* Hire Date (desktop) */}
                                    <div className={`hidden md:block text-[13px] text-[#424242] ${jetbrainsMono.className}`}>
                                        {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : tr("postOnboarding.na")}
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
                                                className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2] transition-colors"
                                                title={tr("postOnboarding.editEmployee")}
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
                                                className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#E3F2FD] hover:text-[#1976D2] transition-colors"
                                                title={tr("postOnboarding.createWorkspaceLogin")}
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
                                                className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[#9E9E9E] hover:bg-[#FFEBEE] hover:text-[#C62828] transition-colors"
                                                title={tr("postOnboarding.deleteEmployee")}
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
                title={tr("postOnboarding.deleteEmployeeConfirm")}
                message={tr("postOnboarding.deleteEmployeeMessage")}
                confirmLabel={tr("postOnboarding.yesDelete")}
                cancelLabel={tr("postOnboarding.no")}
                isDestructive={true}
            />

            {accountEmp && (
                <div
                    role="button"
                    tabIndex={-1}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#212121]/40 p-4 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setAccountEmp(null); }}
                    onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setAccountEmp(null); }}
                >
                    <div className="w-full max-w-md rounded-[4px] border border-[#E0E0E0] bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-[#E3F2FD] text-[#1976D2] shrink-0">
                                    <KeyRound className="w-[18px] h-[18px]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[15px] font-bold text-[#212121]">{tr("postOnboarding.createWorkspaceLogin")}</h2>
                                    <p className="truncate text-[12.5px] text-[#757575]">
                                        {accountEmp.first_name} {accountEmp.last_name} · {accountEmp.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAccountEmp(null)}
                                className="w-7 h-7 rounded-[3px] hover:bg-[#F5F6F8] text-[#757575] hover:text-[#424242] flex items-center justify-center transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="mb-3 text-[12.5px] text-[#757575] leading-relaxed">
                            {tr("postOnboarding.signsInWith1")} <b className="text-[#424242]">{accountEmp.email}</b> {tr("postOnboarding.signsInWith2")}
                        </p>
                        <Input
                            type="text"
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            placeholder={tr("postOnboarding.tempPasswordPlaceholder")}
                        />
                        {accountMsg && (
                            <p className={`mt-3 text-[13px] ${accountMsg.ok ? "text-[#2E7D32]" : "text-[#C62828]"}`}>
                                {accountMsg.text}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setAccountEmp(null)}>
                                {tr("common.close")}
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleCreateAccount}
                                disabled={accountBusy || accountPassword.length < 6}
                            >
                                {accountBusy ? tr("postOnboarding.creating") : tr("postOnboarding.createLogin")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
