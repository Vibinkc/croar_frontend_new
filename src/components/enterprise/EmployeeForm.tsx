"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient, BACKEND_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, CardHeader, Input, Textarea, Select, Field, Badge, PageHeader, jetbrainsMono } from "@/components/ds";

interface EmployeeFormProps {
    employeeId?: string;
    candidateId?: string;
}

interface Department {
    id: string;
    name: string;
}

interface Company {
    id: string;
    name: string;
}

interface Dependent {
    name: string;
    relationship: string;
    date_of_birth?: string;
}

interface EducationDetail {
    degree: string;
    institution: string;
    year_of_passing: string;
}

interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

interface PaymentInfo {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
}

interface EmployeeFormData {
    employee_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    mobile: string;
    phone_number: string;
    designation: string;
    status: string;
    employment_type: string;
    hire_date: string;
    original_hire_date: string;
    probation_end_date: string;
    source: string;
    notice_period: number;
    about_yourself: string;
    pan_card_number: string;
    aadhar_card_number: string;
    passport_number: string;
    date_of_birth: string;
    gender: string;
    marital_status: string;
    blood_group: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    company_id: string;
    department_id: string;
    reporting_to_id: string;
    dependents: Dependent[];
    educational_details: EducationDetail[];
    emergency_contacts: EmergencyContact[];
    social_profiles: Record<string, string>;
    payment_information: PaymentInfo[];
    roles_responsibilities: string;
    skills: string[];
    documents: { name: string; file_path: string }[];
}

export default function EmployeeForm({ employeeId, candidateId }: EmployeeFormProps) {
    const router = useRouter();
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState("job");
    const [isLoading, setIsLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");

    const [formData, setFormData] = useState<EmployeeFormData>({
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

    const fetchEmployeeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/enterprise/employees/${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setFormData((prev) => {
                    const sanitized = Object.keys(data).reduce((acc: Record<string, unknown>, key) => {
                        if (data[key] === null) {
                            const defaultVal = Array.isArray(prev[key as keyof EmployeeFormData]) ? [] : "";
                            acc[key] = defaultVal;
                        } else {
                            acc[key] = data[key];
                        }
                        return acc;
                    }, {});
                    return { ...prev, ...sanitized as Partial<EmployeeFormData> };
                });
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        } finally {
            setIsLoading(false);
        }
    }, [employeeId]);

    const prefillFromCandidate = useCallback(async () => {
        setIsLoading(true);
        try {
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

                setFormData((prev) => ({
                    ...prev,
                    first_name: personal_info.first_name || cand.full_name?.split(" ")[0] || "",
                    last_name: personal_info.last_name || cand.full_name?.split(" ").slice(1).join(" ") || "",
                    email: cand.email || "",
                    mobile: cand.phone || "",
                    designation: job_info.designation || onb.job_title || "",
                    source: cand.source_platform || "Recruitment",
                    skills: cand.skills || [],
                    company_id: onb.application?.job_requirement?.company_id || "",
                }));
            }
        } catch (error) {
            console.error("Error prefilling candidate:", error);
        } finally {
            setIsLoading(false);
        }
    }, [candidateId]);

    const fetchInitialData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchInitialData();
        if (employeeId) {
            fetchEmployeeData();
        } else if (candidateId) {
            prefillFromCandidate();
        }
    }, [employeeId, candidateId, fetchInitialData, fetchEmployeeData, prefillFromCandidate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                        errMsg = err.detail.map((e: { loc?: string[]; msg: string }) => `${e.loc?.slice(-1)[0] || 'Field'}: ${e.msg}`).join('\n');
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
                setFormData((prev) => ({ ...prev, department_id: newDept.id }));
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
        return <div className="p-10 text-center text-[13px] font-semibold text-[#8A929E] animate-pulse">Loading form...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-5 md:px-7 space-y-6 animate-in fade-in duration-500">
            <PageHeader
                help={<><p>Enter the person&apos;s details and assign a department.</p><p>Save to add them to your directory. You can create a workspace login for them later from their record.</p></>}
                title={employeeId ? "Edit Employee" : "Add New Employee"}
                subtitle={`Fill in all the details to ${employeeId ? "update" : "create"} the employee record.`}
                onBack={() => router.back()}
                actions={
                    <Button type="submit" disabled={isLoading} icon={isLoading ? undefined : "check"}>
                        {isLoading ? "Saving..." : employeeId ? "Update Employee" : "Create Employee"}
                    </Button>
                }
            />

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 p-1 bg-[#E8EAED] rounded-[10px] w-fit border border-[#E8EAED]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 h-9 px-4 rounded-[8px] text-[13px] font-semibold transition-all ${
                            activeTab === tab.id
                            ? "bg-white text-[#5B53E0] shadow-sm"
                            : "text-[#6B6F76] hover:text-[#374151]"
                        }`}
                    >
                        <span className="material-symbols-rounded text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "job" && (
                <Card padding="lg" className="space-y-6 animate-in fade-in duration-300">
                    <CardHeader title="Job Information" subtitle="Role, company, and employment details." />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Employee ID" htmlFor="emp-employee_id" required>
                            <Input id="emp-employee_id" name="employee_id" value={formData.employee_id} onChange={handleChange} required placeholder="EMP-1001" className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Designation" htmlFor="emp-designation">
                            <Input id="emp-designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Software Engineer" />
                        </Field>
                        <Field label="Employment Type" htmlFor="emp-employment_type">
                            <Select id="emp-employment_type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Company" htmlFor="emp-company_id" required>
                            <Select id="emp-company_id" name="company_id" value={formData.company_id} onChange={handleChange} required>
                                <option value="">Select Company</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </Field>
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="emp-department_id" className="block text-[12.5px] font-semibold text-[#374151]">Department</label>
                                <button
                                    type="button"
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="text-[11px] font-semibold text-[#5B53E0] hover:text-[#4A43C9] hover:underline"
                                >
                                    + Add New
                                </button>
                            </div>
                            <Select id="emp-department_id" name="department_id" value={formData.department_id} onChange={handleChange}>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </Select>
                        </div>
                        <Field label="Status" htmlFor="emp-status">
                            <Select id="emp-status" name="status" value={formData.status} onChange={handleChange}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Terminated">Terminated</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Hire Date" htmlFor="emp-hire_date">
                            <Input id="emp-hire_date" type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Probation End Date" htmlFor="emp-probation_end_date">
                            <Input id="emp-probation_end_date" type="date" name="probation_end_date" value={formData.probation_end_date} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Notice Period (Days)" htmlFor="emp-notice_period">
                            <Input id="emp-notice_period" type="number" name="notice_period" value={formData.notice_period} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                    </div>

                    <Field label="About Yourself" htmlFor="emp-about_yourself">
                        <Textarea id="emp-about_yourself" name="about_yourself" value={formData.about_yourself} onChange={handleChange} placeholder="Brief professional summary..." className="min-h-[100px]" />
                    </Field>
                </Card>
            )}

            {activeTab === "personal" && (
                <Card padding="lg" className="space-y-6 animate-in fade-in duration-300">
                    <CardHeader title="Personal Information" subtitle="Identity and statutory details." />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="First Name" htmlFor="emp-first_name" required>
                            <Input id="emp-first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        </Field>
                        <Field label="Middle Name" htmlFor="emp-middle_name">
                            <Input id="emp-middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                        </Field>
                        <Field label="Last Name" htmlFor="emp-last_name" required>
                            <Input id="emp-last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Email" htmlFor="emp-email" required>
                            <Input id="emp-email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </Field>
                        <Field label="Mobile" htmlFor="emp-mobile">
                            <Input id="emp-mobile" name="mobile" value={formData.mobile} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Phone Number" htmlFor="emp-phone_number">
                            <Input id="emp-phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Date of Birth" htmlFor="emp-date_of_birth">
                            <Input id="emp-date_of_birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Gender" htmlFor="emp-gender">
                            <Select id="emp-gender" name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </Select>
                        </Field>
                        <Field label="Marital Status" htmlFor="emp-marital_status">
                            <Select id="emp-marital_status" name="marital_status" value={formData.marital_status} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="PAN Card Number" htmlFor="emp-pan_card_number">
                            <Input id="emp-pan_card_number" name="pan_card_number" value={formData.pan_card_number} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Aadhar Card Number" htmlFor="emp-aadhar_card_number">
                            <Input id="emp-aadhar_card_number" name="aadhar_card_number" value={formData.aadhar_card_number} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                        <Field label="Passport Number" htmlFor="emp-passport_number">
                            <Input id="emp-passport_number" name="passport_number" value={formData.passport_number} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                    </div>
                </Card>
            )}

            {activeTab === "contact" && (
                <Card padding="lg" className="space-y-6 animate-in fade-in duration-300">
                    <CardHeader title="Contact Information" subtitle="Address and location details." />

                    <Field label="Address Line 1" htmlFor="emp-address_line_1">
                        <Input id="emp-address_line_1" name="address_line_1" value={formData.address_line_1} onChange={handleChange} />
                    </Field>
                    <Field label="Address Line 2" htmlFor="emp-address_line_2">
                        <Input id="emp-address_line_2" name="address_line_2" value={formData.address_line_2} onChange={handleChange} />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <Field label="City" htmlFor="emp-city">
                            <Input id="emp-city" name="city" value={formData.city} onChange={handleChange} />
                        </Field>
                        <Field label="State" htmlFor="emp-state">
                            <Input id="emp-state" name="state" value={formData.state} onChange={handleChange} />
                        </Field>
                        <Field label="Country" htmlFor="emp-country">
                            <Input id="emp-country" name="country" value={formData.country} onChange={handleChange} />
                        </Field>
                        <Field label="Pincode" htmlFor="emp-pincode">
                            <Input id="emp-pincode" name="pincode" value={formData.pincode} onChange={handleChange} className={jetbrainsMono.className} />
                        </Field>
                    </div>
                </Card>
            )}

            {activeTab === "documents" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <Card padding="lg" className="space-y-6">
                        <CardHeader title="Documents & Others" subtitle="Roles, skills, and synced onboarding records." />

                        <Field label="Roles & Responsibilities" htmlFor="emp-roles_responsibilities">
                            <Textarea id="emp-roles_responsibilities" name="roles_responsibilities" value={formData.roles_responsibilities} onChange={handleChange} placeholder="List key roles and responsibilities..." className="min-h-[120px]" />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h3 className="text-[14px] font-bold text-[#15171C]">Skills</h3>
                                <p className="text-[12.5px] text-[#8A929E]">Employee skills will be managed here. (Currently viewing as text list)</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.skills.map((skill: string, idx: number) => (
                                        <Badge key={idx} tone="indigo">{skill}</Badge>
                                    ))}
                                    {formData.skills.length === 0 && <span className="text-[12.5px] text-[#9AA3AF]">No skills added.</span>}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-[14px] font-bold text-[#15171C]">Documents</h3>
                                <p className="text-[12.5px] text-[#8A929E] leading-relaxed">Onboarding documents and related details are managed entirely through the Candidate Onboarding Portal. Records here are read-only references synced securely from their onboarding session.</p>
                                <div className="space-y-2">
                                    {formData.documents.map((doc, idx) => (
                                        <a key={idx} href={doc.file_path} target="_blank" className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-[10px] border border-[#E8EAED] hover:border-[#D4D7DC] hover:bg-white transition-all">
                                            <span className="text-[13px] font-semibold text-[#374151]">{doc.name}</span>
                                            <span className="material-symbols-rounded text-[18px] text-[#9AA3AF]">download</span>
                                        </a>
                                    ))}
                                    {formData.documents.length === 0 && <span className="text-[12.5px] text-[#9AA3AF]">No documents found.</span>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg" className="bg-[#F7F8FA] space-y-4">
                        <div>
                            <h3 className="text-[13px] font-bold text-[#15171C]">Other Records</h3>
                            <p className="text-[12.5px] text-[#8A929E] mt-0.5">Dependents, Education, Emergency Contacts, and Payment Info are currently stored as encrypted JSON data.</p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-4 bg-white rounded-[12px] border border-[#E8EAED] text-center">
                                <p className="text-[11px] font-semibold text-[#8A929E] uppercase tracking-[0.06em] mb-1">Dependents</p>
                                <p className={`text-[18px] font-bold text-[#5B53E0] ${jetbrainsMono.className}`}>{formData.dependents.length}</p>
                            </div>
                            <div className="p-4 bg-white rounded-[12px] border border-[#E8EAED] text-center">
                                <p className="text-[11px] font-semibold text-[#8A929E] uppercase tracking-[0.06em] mb-1">Education</p>
                                <p className={`text-[18px] font-bold text-[#5B53E0] ${jetbrainsMono.className}`}>{formData.educational_details.length}</p>
                            </div>
                            <div className="p-4 bg-white rounded-[12px] border border-[#E8EAED] text-center">
                                <p className="text-[11px] font-semibold text-[#8A929E] uppercase tracking-[0.06em] mb-1">Emergency</p>
                                <p className={`text-[18px] font-bold text-[#5B53E0] ${jetbrainsMono.className}`}>{formData.emergency_contacts.length}</p>
                            </div>
                            <div className="p-4 bg-white rounded-[12px] border border-[#E8EAED] text-center">
                                <p className="text-[11px] font-semibold text-[#8A929E] uppercase tracking-[0.06em] mb-1">Payment info</p>
                                <p className="text-[15px] font-bold text-[#0E8A6E]">{formData.payment_information.length > 0 ? "Linked" : "Missing"}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Department Modal */}
            {isDeptModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#15171C]/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card padding="lg" className="w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            <h3 className="text-[16px] font-bold text-[#15171C]">Add Department</h3>
                            <p className="text-[12.5px] text-[#8A929E] mt-0.5">Create a new department for the selected company.</p>
                        </div>
                        <div className="space-y-5">
                            <Field label="Department Name" htmlFor="emp-new_dept_name">
                                <Input
                                    id="emp-new_dept_name"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    placeholder="e.g. Technical Operations"
                                />
                            </Field>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => setIsDeptModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    fullWidth
                                    onClick={handleAddDepartment}
                                >
                                    Add Department
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </form>
    );
}
