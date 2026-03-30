"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function CreateUserPage() {
    const router = useRouter();
    const { role, batch: creatorBatch } = useAuth();
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("manual"); // 'manual' | 'bulk'
    const [file, setFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [memberId, setMemberId] = useState("");
    const [batch, setBatch] = useState("");

    useEffect(() => {
        if (creatorBatch) {
            setBatch(creatorBatch);
        }
    }, [creatorBatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const payload = {
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                role: "STUDENT",
                member_id: memberId || null,
                batch: batch || null
            };

            const res = await apiClient.post(`/api/v1/users/users`, payload);

            if (res.ok) {
                router.push("/admin/students");
            } else {
                let errorMsg = "Failed to create user";
                try {
                    const errorData = await res.json();
                    if (errorData.detail) {
                        if (Array.isArray(errorData.detail)) {
                            // Handle Pydantic validation errors
                            errorMsg = errorData.detail.map((e: any) => `${e.loc.join('.')} - ${e.msg}`).join(', ');
                        } else {
                            errorMsg = errorData.detail;
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse error response", e);
                }
                setError(errorMsg);
            }
        } catch (err) {
            setError("Network error or server unreachable");
        }
    };

    const handleBulkUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setUploadResult(null);

        if (!file) {
            setError("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/bulk-upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUploadResult(data);
                if (data.error_count > 0) {
                    setError(`Created ${data.created_count} users, but ${data.error_count} failed.`);
                } else {
                    alert(`Successfully created ${data.created_count} users!`);
                    router.push("/admin/students");
                }
            } else {
                const errData = await res.json();
                setError(errData.detail || "Upload failed");
            }

        } catch (err) {
            setError("Upload failed due to network error");
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,email,first_name,last_name,password,member_id,batch\nstudent@example.com,John,Doe,Student123!,STU-2024-001,2024-2028";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white shadow sm:rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Enroll New Student</h2>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'manual' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setActiveTab('manual'); setError(""); setUploadResult(null); }}
                >
                    Manual Entry
                </button>
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'bulk' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setActiveTab('bulk'); setError(""); setUploadResult(null); }}
                >
                    Bulk Upload (CSV)
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-slate-100 border border-slate-300 text-slate-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <span className="material-icons text-sm">error</span>
                    <span className="text-sm font-bold">{error}</span>
                    {uploadResult && uploadResult.errors && (
                        <ul className="text-xs list-disc ml-4 mt-1">
                            {uploadResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                        </ul>
                    )}
                </div>
            )}

            {activeTab === 'manual' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Registration ID / Student ID</label>
                        <input
                            type="text"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            placeholder="e.g. STU-2024-001"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Batch / Year</label>
                        <input
                            type="text"
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                            disabled={!!creatorBatch}
                            placeholder="e.g. 2023-2027"
                            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black ${creatorBatch ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold' : ''}`}
                        />
                        {creatorBatch && (
                            <p className="mt-1 text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Locked to your assigned batch</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Initial Password</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black"
                        />
                        <p className="mt-1 text-sm text-gray-500">Provide this password to the student securely.</p>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                            Create Student Account
                        </button>
                    </div>
                </form >
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-50 border-l-4 border-slate-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="material-icons text-slate-400">info</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-slate-700">
                                    Upload a (.csv) file with the following columns:
                                    <br />
                                    <code className="font-bold">email</code> (required), <code className="font-bold">first_name</code>, <code className="font-bold">last_name</code>, <code className="font-bold">password</code>, <code className="font-bold">member_id</code>, <code className="font-bold">batch</code>
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="mt-2 text-sm font-bold text-slate-600 hover:text-slate-900 underline"
                                >
                                    Download Sample Template
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="material-icons text-gray-400 text-4xl mb-2">cloud_upload</span>
                            <p className="text-gray-600 font-medium">
                                {file ? file.name : "Click to upload"}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">CSV up to 5MB</p>
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleBulkUpload}
                            disabled={!file}
                            className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                                ${!file ? 'bg-gray-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'}`}
                        >
                            Upload & Create Students
                        </button>
                    </div>
                </div>
            )
            }
        </div >
    );
}
