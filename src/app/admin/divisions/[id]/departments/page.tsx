"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiClient } from "@/utils/api";

interface Department {
    id: number;
    name: string;
    slug: string;
    division_id: number;
}

export default function DepartmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: divisionId } = use(params);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");
    const [showQuickSetup, setShowQuickSetup] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<"arts_science" | "medical" | "engineering" | null>(null);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [isCreatingBulk, setIsCreatingBulk] = useState(false);

    // Department Templates
    const ARTS_SCIENCE_DEPARTMENTS = [
        "B.A English", "B.A Tamil", "B.A Economics", "B.A History", "B.A Sociology",
        "B.A Political Science", "B.Com", "B.Com Accounting & Finance",
        "B.Com Corporate Secretaryship", "BBA", "B.Sc Mathematics", "B.Sc Physics",
        "B.Sc Chemistry", "B.Sc Computer Science", "B.Sc Information Technology",
        "B.Sc Statistics", "B.Sc Biotechnology", "B.Sc Microbiology", "BCA", "BSW"
    ];

    const MEDICAL_DEPARTMENTS = [
        "MBBS", "BDS", "BAMS", "BHMS", "BUMS", "BNYS", "B.Sc Nursing", "GNM Nursing",
        "B.Pharm", "D.Pharm", "Pharm.D", "BPT (Physiotherapy)", "BOT (Occupational Therapy)",
        "BMLT", "B.Sc Radiology & Imaging Technology", "B.Sc Anesthesia Technology",
        "B.Sc Operation Theatre Technology", "B.Sc Cardiac Care Technology",
        "B.Sc Dialysis Technology", "B.Sc Medical Lab Technology"
    ];

    const ENGINEERING_DEPARTMENTS = [
        "Civil Engineering", "Mechanical Engineering", "Electrical and Electronics Engineering",
        "Electronics and Communication Engineering", "Computer Science Engineering",
        "Information Technology", "Artificial Intelligence and Data Science",
        "Artificial Intelligence and Machine Learning", "Mechatronics Engineering",
        "Automobile Engineering", "Chemical Engineering", "Biomedical Engineering",
        "Biotechnology", "Aeronautical Engineering", "Aerospace Engineering",
        "Environmental Engineering", "Instrumentation Engineering", "Production Engineering",
        "Industrial Engineering", "Marine Engineering"
    ];


    useEffect(() => {
        fetchDepartments();
    }, [divisionId]);

    const fetchDepartments = async () => {
        try {
            const res = await apiClient.get(`/api/v1/hierarchy/departments?division_id=${divisionId}`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async () => {
        if (!newDeptName) return;
        try {
            const res = await apiClient.post("/api/v1/hierarchy/departments", {
                name: newDeptName,
                slug: newDeptName.toLowerCase().replace(/ /g, "-"),
                division_id: parseInt(divisionId)
            });
            if (res.ok) {
                setNewDeptName("");
                setShowCreateModal(false);
                fetchDepartments();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectTemplate = (template: "arts_science" | "medical" | "engineering") => {
        setSelectedTemplate(template);
        let depts: string[] = [];
        if (template === "arts_science") depts = ARTS_SCIENCE_DEPARTMENTS;
        else if (template === "medical") depts = MEDICAL_DEPARTMENTS;
        else if (template === "engineering") depts = ENGINEERING_DEPARTMENTS;
        setSelectedDepartments(depts); // Select all by default
    };

    const toggleDepartment = (deptName: string) => {
        setSelectedDepartments(prev =>
            prev.includes(deptName)
                ? prev.filter(d => d !== deptName)
                : [...prev, deptName]
        );
    };

    const handleBulkCreate = async () => {
        if (selectedDepartments.length === 0) return;

        setIsCreatingBulk(true);
        try {
            const departmentsPayload = selectedDepartments.map(name => ({
                name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                division_id: parseInt(divisionId)
            }));

            const res = await apiClient.post("/api/v1/hierarchy/departments/bulk", departmentsPayload);
            if (res.ok) {
                setShowQuickSetup(false);
                setSelectedTemplate(null);
                setSelectedDepartments([]);
                fetchDepartments();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to create departments");
        } finally {
            setIsCreatingBulk(false);
        }
    };


    if (loading) return <div className="p-8">Loading departments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">DEPARTMENTS</h1>
                    <p className="text-[10px] font-bold text-slate-400   mt-1">Manage Departments under this Division</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowQuickSetup(true)}
                        className="bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md"
                    >
                        <span className="material-icons-outlined text-base">bolt</span>
                        <span className="text-[10px] font-black  ">Quick Setup</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md"
                    >
                        <span className="material-icons-outlined text-base">add</span>
                        <span className="text-[10px] font-black  ">Add Department</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {departments.map((dept) => (
                    <div key={dept.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-700 font-bold text-base border border-slate-200/50">
                                {dept.name[0]}
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-base font-black text-slate-900  tracking-tight">{dept.name}</h3>
                            <div className="mt-3 flex flex-col gap-2">
                                <Link
                                    href={`/admin/staff/create?department_id=${dept.id}`}
                                    className="text-center bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-black   transition-colors"
                                >
                                    Assign HOD
                                </Link>
                                <Link
                                    href={`/admin/staff?department_id=${dept.id}`}
                                    className="text-center bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black   hover:bg-slate-50 transition-colors"
                                >
                                    View Staff
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-900  tracking-tight mb-6">Create Department</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400  tracking-[0.2em] mb-2">Department Name</label>
                                <input
                                    type="text"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    placeholder="e.g. Computer Science"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-black   text-slate-400 hover:bg-slate-50 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateDepartment}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black   hover:bg-slate-800 transition-all shadow-lg"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showQuickSetup && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black text-slate-900  tracking-tight mb-2">Quick Setup</h2>
                        <p className="text-xs font-bold text-slate-400   mb-6">Bulk create departments for your college type</p>

                        {!selectedTemplate ? (
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-slate-600 mb-4">Select your college type:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSelectTemplate("arts_science")}
                                        className="p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                🎓
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-black text-slate-900  tracking-tight">Arts & Science</h3>
                                                <p className="text-xs font-bold text-slate-400   mt-1">20 Departments</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleSelectTemplate("medical")}
                                        className="p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                🏥
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-black text-slate-900  tracking-tight">Medical</h3>
                                                <p className="text-xs font-bold text-slate-400   mt-1">22 Departments</p>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleSelectTemplate("engineering")}
                                        className="p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                ⚙️
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-black text-slate-900  tracking-tight">Engineering</h3>
                                                <p className="text-xs font-bold text-slate-400   mt-1">20 Departments</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => setShowQuickSetup(false)}
                                        className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black   text-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900  tracking-tight">
                                            {selectedTemplate === "arts_science" ? "Arts & Science" : selectedTemplate === "medical" ? "Medical" : "Engineering"} Departments
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400   mt-1">
                                            {selectedDepartments.length} selected
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedTemplate(null);
                                            setSelectedDepartments([]);
                                        }}
                                        className="text-xs font-black   text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-2">
                                    {(selectedTemplate === "arts_science" ? ARTS_SCIENCE_DEPARTMENTS : selectedTemplate === "medical" ? MEDICAL_DEPARTMENTS : ENGINEERING_DEPARTMENTS).map((dept) => (
                                        <label
                                            key={dept}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedDepartments.includes(dept)
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDepartments.includes(dept)}
                                                onChange={() => toggleDepartment(dept)}
                                                className="w-5 h-5 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                                            />
                                            <span className="text-sm font-bold text-slate-900">{dept}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            setShowQuickSetup(false);
                                            setSelectedTemplate(null);
                                            setSelectedDepartments([]);
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-black   text-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBulkCreate}
                                        disabled={selectedDepartments.length === 0 || isCreatingBulk}
                                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black   hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreatingBulk ? "Creating..." : `Create ${selectedDepartments.length} Departments`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
