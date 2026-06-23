"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient, BACKEND_URL } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen">
            {/* Header */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0 shadow-sm shadow-[#7C3AED]/5">
                            <span className="material-symbols-rounded text-[#7C3AED] text-2xl">badge</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Employee Directory</h1>
                            <p className="text-slate-500 text-[13px] font-medium mt-1">
                                Manage your workforce, departments, and employee records in one place.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {canAccess("employees:create") && (
                            <Link
                                href="/enterprise/employees/add"
                                className="flex items-center gap-2 px-5 h-11 bg-[#7C3AED] text-white rounded-lg text-xs font-black hover:bg-[#6d28d9] transition-all shadow-lg shadow-[#7C3AED]/20 active:scale-95"
                            >
                                <span className="material-symbols-rounded text-lg">add</span>
                                {"ADD EMPLOYEE"}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Employees", value: employees.length, icon: "groups", color: "indigo" },
                        { label: "Active Workforce", value: employees.filter(e => e.status === 'Active').length, icon: "verified", color: "emerald" },
                        { label: "Departments", value: new Set(employees.filter(e => e.department).map(e => e.department?.id)).size, icon: "domain", color: "amber" },
                        { label: "New Hires", value: employees.filter(e => e.hire_date && new Date(e.hire_date) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length, icon: "person_add", color: "purple" }
                    ].map((stat, i) => (
                        <div key={i} className="group bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#7C3AED]/20 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                                    stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                    stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                    'bg-purple-50 text-purple-600'
                                }`}>
                                    <span className="material-symbols-rounded text-xl">{stat.icon}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 mb-0.5 tracking-tight">{stat.value}</p>
                            <p className="text-[11px] font-bold text-slate-400 capitalize">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interaction Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-[#7C3AED]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, ID, or email..."
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm min-w-[200px]">
                    <span className="material-symbols-rounded text-slate-400 ml-2 text-lg">filter_list</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] font-black text-slate-700 focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                    >
                        <option value="all">All Workforce</option>
                        <option value="Active">Active Only</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[calc(100vh-12rem)] overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4 flex-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-slate-50 h-16 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <span className="material-symbols-rounded text-3xl text-slate-300">badge</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No Employees Found</h3>
                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                            Add your first employee or convert an onboarded candidate.
                        </p>
                        <Link href="/enterprise/onboarding" className="px-4 py-2 bg-indigo-50 text-[#7C3AED] font-bold text-xs rounded-xl hover:bg-slate-200 transition-all">Go to Onboarding Hub</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500  ">Employee</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500  ">Designation</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500  ">Department</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500  ">Hire Date</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500  ">Status</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500   text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-3 py-1.5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 leading-tight">{emp.first_name} {emp.last_name}</span>
                                                <span className="text-[9px] font-semibold text-slate-500">{emp.employee_id} • {emp.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className="text-xs font-semibold text-slate-600">{emp.designation || "N/A"}</span>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className="text-xs font-semibold text-slate-600">{emp.department?.name || "N/A"}</span>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className="text-xs font-semibold text-slate-600">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : "N/A"}</span>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border  tracking-wide ${
                                                emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                <span className={`w-1 h-1 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canAccess("employees:update") && (
                                                    <Link
                                                        href={`/enterprise/employees/${emp.id}`}
                                                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 border border-transparent hover:border-[#7C3AED]/10 flex items-center justify-center transition-all"
                                                        title="Edit Employee"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">edit</span>
                                                    </Link>
                                                )}
                                                {canAccess("employees:moderate") && (
                                                    <button
                                                        onClick={() => {
                                                            setAccountEmp(emp);
                                                            setAccountPassword("");
                                                            setAccountMsg(null);
                                                        }}
                                                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 border border-transparent hover:border-[#7C3AED]/10 flex items-center justify-center transition-all"
                                                        title="Create Workspace Login"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">key</span>
                                                    </button>
                                                )}
                                                {canAccess("employees:delete") && (
                                                    <button
                                                        onClick={() => {
                                                            setEmployeeToDelete(emp.id);
                                                            setIsConfirmModalOpen(true);
                                                        }}
                                                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center transition-all"
                                                        title="Delete Employee"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6 backdrop-blur-sm"
                    onClick={() => setAccountEmp(null)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                                <span className="material-symbols-rounded">key</span>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-black text-slate-900">Create Workspace Login</h2>
                                <p className="truncate text-sm text-slate-500">
                                    {accountEmp.first_name} {accountEmp.last_name} · {accountEmp.email}
                                </p>
                            </div>
                        </div>
                        <p className="mb-3 text-xs text-slate-500">
                            The employee signs in with <b>{accountEmp.email}</b> and this password, and lands on
                            their own workspace (timesheets, payslips, leave) — not the admin area.
                        </p>
                        <input
                            type="text"
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            placeholder="Temporary password (min 6 characters)"
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-indigo-500/20"
                        />
                        {accountMsg && (
                            <p className={`mt-3 text-sm ${accountMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>
                                {accountMsg.text}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setAccountEmp(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCreateAccount}
                                disabled={accountBusy || accountPassword.length < 6}
                                className="rounded-xl bg-[#7C3AED] px-5 py-2 text-sm font-bold text-white hover:bg-[#6d28d9] disabled:opacity-50"
                            >
                                {accountBusy ? "Creating…" : "Create Login"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
