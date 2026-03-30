"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function CreateStaffPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { role, departmentName, departmentId, batch: creatorBatch } = useAuth();

    const [mode, setMode] = useState<"single" | "bulk">("single");

    // Single creation states
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [deptId, setDeptId] = useState(searchParams.get("department_id") || "");
    const [error, setError] = useState("");
    const [departments, setDepartments] = useState<any[]>([]);
    const [batch, setBatch] = useState("");
    const [memberId, setMemberId] = useState("");

    // Bulk upload states
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    useEffect(() => {
        // Set default target role based on current role
        if (role === "ADMIN") setTargetRole("SUB_ADMIN");
        else if (role === "SUB_ADMIN") setTargetRole("STAFF");
        else if (role === "STAFF") setTargetRole("STUDENT");

        // Fetch departments for Principal
        if (role === "ADMIN") {
            apiClient.get("/api/v1/hierarchy/departments").then(res => res.json()).then(setDepartments);
        } else if (departmentId) {
            setDeptId(departmentId.toString());
        }

        if (creatorBatch) {
            setBatch(creatorBatch);
        }
    }, [role, departmentId, creatorBatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const payload = {
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                role: targetRole,
                department_id: deptId ? parseInt(deptId) : null,
                batch: batch || null,
                member_id: memberId || null
            };

            const res = await apiClient.post(`/api/v1/hierarchy/users`, payload);

            if (res.ok) {
                if (targetRole === "STUDENT") router.push("/admin/students");
                else router.push("/admin/staff");
            } else {
                const errorData = await res.json();
                setError(errorData.detail || "Failed to create user");
            }
        } catch (err) {
            setError("Network error or server unreachable");
        }
    };

    const handleBulkUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadResult(null);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/bulk-upload`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            if (res.ok) {
                const result = await res.json();
                setUploadResult(result);
                setFile(null);
            } else {
                const errorData = await res.json();
                setError(errorData.detail || "Failed to upload file");
            }
        } catch (err) {
            setError("Network error or server unreachable");
        } finally {
            setUploading(false);
        }
    };

    const getRoleLabel = () => {
        if (targetRole === "SUB_ADMIN") return "HOD";
        return targetRole?.replace("_", " ");
    };

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    Create {getRoleLabel()} Account
                </h2>

                {/* Mode Toggle */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setMode("single")}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === "single"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        Single
                    </button>
                    <button
                        onClick={() => setMode("bulk")}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === "bulk"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        Bulk Upload
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                    <span className="material-icons-outlined text-lg">error</span>
                    {error}
                </div>
            )}

            {mode === "single" ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Department</label>
                        {role === "ADMIN" ? (
                            <select
                                value={deptId}
                                onChange={(e) => setDeptId(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold appearance-none bg-white"
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900">
                                {departmentName || "Pre-assigned based on your department"}
                            </div>
                        )}
                    </div>

                    {targetRole !== "SUB_ADMIN" && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Batch / Year</label>
                            <input
                                type="text"
                                value={batch}
                                onChange={(e) => setBatch(e.target.value)}
                                disabled={!!creatorBatch}
                                placeholder="e.g. 2023-2027"
                                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold ${creatorBatch ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
                            />
                            {creatorBatch && (
                                <p className="mt-1 text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Locked to your assigned batch</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Member ID / Registration ID</label>
                        <input
                            type="text"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            placeholder="e.g. EMP-101 or REG-2024-001"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Initial Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5">
                            Create {getRoleLabel()}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Bulk Upload Instructions</h3>
                        <ul className="space-y-2 text-xs text-slate-600 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="material-icons-outlined text-sm text-slate-400 mt-0.5">check_circle</span>
                                <span>Upload an Excel (.xlsx, .xls) or CSV file</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons-outlined text-sm text-slate-400 mt-0.5">check_circle</span>
                                <span>Required columns: <strong>email, first_name, last_name</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons-outlined text-sm text-slate-400 mt-0.5">check_circle</span>
                                <span>Optional columns: <strong>password, member_id, batch</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons-outlined text-sm text-slate-400 mt-0.5">check_circle</span>
                                <span>Default password: <strong>ChangeMe123!</strong> (if not provided)</span>
                            </li>
                        </ul>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="bulk-upload-file"
                        />
                        <label
                            htmlFor="bulk-upload-file"
                            className="cursor-pointer flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                                <span className="material-icons-outlined text-3xl text-slate-400">upload_file</span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    {file ? file.name : "Choose File"}
                                </p>
                                <p className="text-xs text-slate-400 font-bold mt-1">
                                    Excel (.xlsx, .xls) or CSV
                                </p>
                            </div>
                        </label>
                    </div>

                    {file && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleBulkUpload}
                                disabled={uploading}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <span className="material-icons-outlined text-sm animate-spin">refresh</span>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-sm">cloud_upload</span>
                                        Upload & Create
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {uploadResult && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-icons-outlined text-green-600">check_circle</span>
                                <h3 className="text-sm font-black text-green-900 uppercase tracking-tight">Upload Complete</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-slate-500 font-bold">Created</p>
                                    <p className="text-2xl font-black text-green-600">{uploadResult.created_count}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-bold">Errors</p>
                                    <p className="text-2xl font-black text-red-600">{uploadResult.error_count}</p>
                                </div>
                            </div>
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-green-200">
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Errors:</p>
                                    <ul className="space-y-1 text-xs text-red-600 font-medium max-h-40 overflow-y-auto">
                                        {uploadResult.errors.map((err: string, idx: number) => (
                                            <li key={idx}>• {err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
