"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface EmployeeFormProps {
    employeeId?: string;
    candidateId?: string;
}

export default function EmployeeForm({ employeeId, candidateId }: EmployeeFormProps) {
    const router = useRouter();
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState("job");
    const [isLoading, setIsLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");
    
    const [formData, setFormData] = useState<any>({
        employee_id: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        mobile: "",
        phone_number: "",
        designation: "",
        status: "Active",
        employment_type: "",
        hire_date: "",
        original_hire_date: "",
        probation_end_date: "",
        source: "Direct Sourcing",
        notice_period: 0,
        about_yourself: "",
        pan_card_number: "",
        aadhar_card_number: "",
        passport_number: "",
        date_of_birth: "",
        gender: "",
        marital_status: "",
        blood_group: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        company_id: "",
        department_id: "",
        reporting_to_id: "",
        dependents: [],
        educational_details: [],
        emergency_contacts: [],
        social_profiles: {},
        payment_information: [],
        roles_responsibilities: "",
        skills: [],
        documents: []
    });

    useEffect(() => {
        fetchInitialData();
        if (employeeId) {
            fetchEmployeeData();
        } else if (candidateId) {
            prefillFromCandidate();
        }
    }, [employeeId, candidateId]);

    const fetchInitialData = async () => {
        try {
            const [deptRes, compRes] = await Promise.all([
                apiClient.get("/api/v1/enterprise/employees/departments"),
                apiClient.get("/api/v1/enterprise/company/")
            ]);
            if (deptRes.ok) setDepartments(await deptRes.json());
            if (compRes.ok) setCompanies(await compRes.json());
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchEmployeeData = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/enterprise/employees/${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                // Sanitize null values to empty strings/arrays for controlled components
                const sanitized = Object.keys(data).reduce((acc: any, key) => {
                    if (data[key] === null) {
                        acc[key] = Array.isArray(formData[key]) ? [] : "";
                    } else {
                        acc[key] = data[key];
                    }
                    return acc;
                }, {});
                setFormData((prev: any) => ({ ...prev, ...sanitized }));
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const prefillFromCandidate = async () => {
        setIsLoading(true);
        try {
            // We can use the convert-candidate endpoint to get a preview or just pre-fill manually
            // But if we use convert-candidate, it creates the record. 
            // Better to have a "preview-convert" endpoint or just fetch candidate + onboarding data.
            // For now, let's call the actual convert and then redirect to edit? 
            // Or fetch data. Let's fetch data for pre-fill.
            const [candRes, onbRes] = await Promise.all([
                apiClient.get(`/api/v1/enterprise/candidates/${candidateId}`),
                apiClient.get(`/api/v1/enterprise/onboarding/?candidate_id=${candidateId}`)
            ]);
            
            if (candRes.ok) {
                const cand = await candRes.json();
                const onbList = onbRes.ok ? await onbRes.json() : [];
                const onb = onbList[0] || {};
                
                const job_info = onb.job_info || {};
                const personal_info = onb.personal_info || {};
                const form_data = onb.form_data || {};
                
                setFormData((prev: any) => ({
                    ...prev,
                    first_name: personal_info.first_name || cand.full_name?.split(" ")[0] || "",
                    last_name: personal_info.last_name || cand.full_name?.split(" ").slice(1).join(" ") || "",
                    email: cand.email || "",
                    mobile: cand.phone || "",
                    designation: job_info.designation || onb.job_title || "",
                    source: cand.source_platform || "Recruitment",
                    skills: cand.skills || [],
                    company_id: onb.application?.job_requirement?.company_id || "",
                    // Add more pre-fill logic as needed
                }));
            }
        } catch (error) {
            console.error("Error prefilling candidate:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const url = employeeId 
                ? `/api/v1/enterprise/employees/${employeeId}`
                : `/api/v1/enterprise/employees/`;
            const method = employeeId ? "PATCH" : "POST";
            
            const res = await apiClient.request(url, {
                method,
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                router.push("/enterprise/employees");
            } else {
                const err = await res.json();
                let errMsg = "Failed to save employee";
                if (err.detail) {
                    if (Array.isArray(err.detail)) {
                        errMsg = err.detail.map((e: any) => `${e.loc?.slice(-1)[0] || 'Field'}: ${e.msg}`).join('\n');
                    } else {
                        errMsg = err.detail;
                    }
                }
                alert(errMsg);
            }
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDepartment = async () => {
        if (!newDeptName || !formData.company_id) {
            alert("Please select a company and enter a department name");
            return;
        }
        try {
            const res = await apiClient.request("/api/v1/enterprise/employees/departments", {
                method: "POST",
                body: JSON.stringify({
                    name: newDeptName,
                    company_id: formData.company_id
                })
            });
            if (res.ok) {
                const newDept = await res.json();
                setDepartments(prev => [...prev, newDept]);
                setFormData((prev: any) => ({ ...prev, department_id: newDept.id }));
                setIsDeptModalOpen(false);
                setNewDeptName("");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create department");
            }
        } catch (error) {
            console.error("Error adding department:", error);
        }
    };

    const tabs = [
        { id: "job", label: "Job Information", icon: "work" },
        { id: "personal", label: "Personal Information", icon: "person" },
        { id: "contact", label: "Contact Info", icon: "location_on" },
        { id: "documents", label: "Documents & Others", icon: "folder" },
    ];

    if (isLoading && !formData.first_name) {
        return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Loading form...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{employeeId ? "Edit Employee" : "Add New Employee"}</h1>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Fill in all the details to {employeeId ? "update" : "create"} the employee record.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#7C3AED] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#6D28D9] shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : employeeId ? "Update Employee" : "Create Employee"}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? "bg-white text-[#7C3AED] shadow-sm" 
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        <span className="material-symbols-rounded text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-10">
                {activeTab === "job" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID*</label>
                                <input name="employee_id" value={formData.employee_id} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" placeholder="EMP-1001" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                                <input name="designation" value={formData.designation} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" placeholder="Software Engineer" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employment Type</label>
                                <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all">
                                    <option value="">Select</option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Intern">Intern</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company*</label>
                                <select name="company_id" value={formData.company_id} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all">
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsDeptModalOpen(true)}
                                        className="text-[9px] font-black text-[#7C3AED] uppercase tracking-tighter hover:underline"
                                    >
                                        + Add New
                                    </button>
                                </div>
                                <select name="department_id" value={formData.department_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all">
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hire Date</label>
                                <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Probation End Date</label>
                                <input type="date" name="probation_end_date" value={formData.probation_end_date} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Period (Days)</label>
                                <input type="number" name="notice_period" value={formData.notice_period} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About Yourself</label>
                            <textarea name="about_yourself" value={formData.about_yourself} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all min-h-[100px]" placeholder="Brief professional summary..." />
                        </div>
                    </div>
                )}

                {activeTab === "personal" && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name*</label>
                                <input name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                                <input name="middle_name" value={formData.middle_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name*</label>
                                <input name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email*</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                                <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marital Status</label>
                                <select name="marital_status" value={formData.marital_status} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all">
                                    <option value="">Select</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Card Number</label>
                                <input name="pan_card_number" value={formData.pan_card_number} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhar Card Number</label>
                                <input name="aadhar_card_number" value={formData.aadhar_card_number} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Passport Number</label>
                                <input name="passport_number" value={formData.passport_number} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                        </div>
                     </div>
                )}

                {activeTab === "contact" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Line 1</label>
                            <input name="address_line_1" value={formData.address_line_1} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Line 2</label>
                            <input name="address_line_2" value={formData.address_line_2} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                                <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                <input name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input name="pincode" value={formData.pincode} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "documents" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Roles & Responsibilities</label>
                            <textarea name="roles_responsibilities" value={formData.roles_responsibilities} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all min-h-[120px]" placeholder="List key roles and responsibilities..." />
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">Skills</h3>
                                <p className="text-[10px] text-slate-500 font-semibold italic">Employee skills will be managed here. (Currently viewing as text list)</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills.map((skill: string, idx: number) => (
                                        <span key={idx} className="bg-indigo-50 text-[#7C3AED] px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-100 uppercase tracking-tight">{skill}</span>
                                    ))}
                                    {formData.skills.length === 0 && <span className="text-xs text-slate-400">No skills added.</span>}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">Documents</h3>
                                <p className="text-[10px] text-slate-500 font-semibold italic md:pr-4 leading-relaxed">Onboarding documents and related details are managed entirely through the Candidate Onboarding Portal. Records here are read-only references synced securely from their onboarding session.</p>
                                <div className="space-y-2">
                                    {formData.documents.map((doc: any, idx: number) => (
                                        <a key={idx} href={doc.file_path} target="_blank" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-sm border border-slate-200 transition-all">
                                            <span className="text-[11px] font-bold text-slate-600">{doc.name}</span>
                                            <span className="material-symbols-rounded text-lg text-slate-400">download</span>
                                        </a>
                                    ))}
                                    {formData.documents.length === 0 && <span className="text-xs text-slate-400">No documents found.</span>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[32px] p-8 space-y-4 border border-slate-100">
                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Other Records</h3>
                             <p className="text-[10px] text-slate-500 font-semibold">Dependents, Education, Emergency Contacts, and Payment Info are currently stored as encrypted JSON data.</p>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                 <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dependents</p>
                                     <p className="text-sm font-black text-[#7C3AED]">{formData.dependents.length}</p>
                                 </div>
                                 <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Education</p>
                                     <p className="text-sm font-black text-[#7C3AED]">{formData.educational_details.length}</p>
                                 </div>
                                 <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency</p>
                                     <p className="text-sm font-black text-[#7C3AED]">{formData.emergency_contacts.length}</p>
                                 </div>
                                 <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment info</p>
                                     <p className="text-sm font-black text-emerald-600">{formData.payment_information.length > 0 ? "Linked" : "Missing"}</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Department Modal */}
            {isDeptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Department</h3>
                            <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-rounded text-2xl">close</span>
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Name</label>
                                <input 
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
                                    placeholder="e.g. Engineering, Marketing..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsDeptModalOpen(false)}
                                    className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleAddDepartment}
                                    className="flex-1 bg-[#7C3AED] text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#6D28D9] shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                >
                                    Save Dept
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
