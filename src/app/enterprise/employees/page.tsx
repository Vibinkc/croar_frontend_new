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
    const { token } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

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

    const filteredEmployees = employees.filter(emp => 
        (emp.first_name + " " + emp.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 pt-2 animate-in fade-in duration-500">
            {/* Command Bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 overflow-x-auto no-scrollbar">
                <div className="relative group min-w-[200px] flex-1">
                    <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#7C3AED] transition-colors">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search employees..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/5 focus:bg-white focus:border-[#7C3AED] transition-all"
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0"></div>

                <Link
                    href="/enterprise/employees/add"
                    className="bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#6D28D9] shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap flex-shrink-0"
                >
                    <span className="material-symbols-rounded text-lg">add</span>
                    Add Employee
                </Link>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[calc(100vh-12rem)] overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4 flex-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-slate-50 h-16 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <span className="material-symbols-rounded text-3xl text-slate-300">badge</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No Employees Found</h3>
                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                            Add your first employee or convert an onboarded candidate.
                        </p>
                        <Link href="/enterprise/onboarding" className="px-4 py-2 bg-indigo-50 text-[#7C3AED] font-bold text-xs rounded-lg hover:bg-slate-200 transition-all">Go to Onboarding Hub</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designation</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hire Date</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
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
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${
                                                emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                <span className={`w-1 h-1 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/enterprise/employees/${emp.id}`}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 border border-transparent hover:border-[#7C3AED]/10 flex items-center justify-center transition-all"
                                                    title="Edit Employee"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setEmployeeToDelete(emp.id);
                                                        setIsConfirmModalOpen(true);
                                                    }}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center transition-all"
                                                    title="Delete Employee"
                                                >
                                                    <span className="material-symbols-rounded text-lg">delete</span>
                                                </button>
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
        </div>
    );
}
