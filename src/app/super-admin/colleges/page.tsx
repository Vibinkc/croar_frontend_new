"use client";

import { useEffect, useState, Suspense } from "react";
import { apiClient } from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SuperAdminCollegesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [colleges, setColleges] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [dbName, setDbName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminProfileImage, setAdminProfileImage] = useState("");
    const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState<any | null>(null);

    // Fetch colleges just to find the one to edit if ID is present
    // Optimization: In a real app we might fetching a single item by ID, but list is small.
    useEffect(() => {
        fetchColleges();
    }, []);

    // Watch for editId changes
    useEffect(() => {
        if (editId) {
            fetchCollegeDetail(editId as string);
        } else {
            resetForm();
        }
    }, [editId]);

    // Auto-generate DB name from slug
    useEffect(() => {
        if (!selectedCollege && slug) {
            // Simple sanitization: lowercase, replace non-alphanumeric with underscore
            const sanitized = slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
            setDbName(`talixo_${sanitized}`);
        }
    }, [slug, selectedCollege]);

    const fetchCollegeDetail = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok) {
                const college = await res.json();
                loadCollege(college);
            } else {
                console.error("Failed to fetch college details");
                router.replace('/super-admin/colleges');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchColleges = async () => {
        try {
            const res = await apiClient.get("/api/v1/super-admin/tenants");
            if (res.ok) {
                setColleges(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Reset form to Create Mode
    const resetForm = () => {
        setSelectedCollege(null);
        setName("");
        setSlug("");
        setDbName("");
        setAdminEmail("");
        setAdminPassword("");
        setAdminProfileImage("");
        setUploadMode('url');
        setSelectedFile(null);
        // Clear query param if present
        if (searchParams.get('edit')) {
            router.replace('/super-admin/colleges', { scroll: false });
        }
    };

    // Load college into form for Edit Mode
    const loadCollege = (college: any) => {
        setSelectedCollege(college);
        setName(college.name || "");
        setSlug(college.slug || "");
        setDbName(college.db_name || "");
        setAdminEmail(college.admin_email || "");
        setAdminPassword("");
        setAdminProfileImage(college.admin_profile_image || "");
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let finalImageUrl = adminProfileImage;

            if (uploadMode === 'file' && selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                try {
                    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/v1/common/upload`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        finalImageUrl = uploadData.url;
                    } else {
                        throw new Error("Image upload failed");
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                    alert("Failed to upload image. Please try again or use a URL.");
                    setIsLoading(false);
                    return;
                }
            }

            if (selectedCollege) {
                // UPDATE logic
                await apiClient.put(`/api/v1/super-admin/tenants/${selectedCollege.id}`, {
                    name,
                    slug,
                    admin_email: adminEmail,
                    ...(adminPassword ? { admin_password: adminPassword } : {}),
                    admin_profile_image: finalImageUrl,
                });
            } else {
                // CREATE logic
                await apiClient.post("/api/v1/super-admin/tenants", {
                    name,
                    slug,
                    db_name: dbName,
                    admin_email: adminEmail,
                    admin_password: adminPassword,
                    admin_profile_image: finalImageUrl,
                    is_active: true
                });
            }

            // After success, maybe redirect to list? Or just clear?
            // User flow: If editing, stay or go back. If creating, clear form.
            if (selectedCollege) {
                alert("Updated successfully");
                router.push('/super-admin/colleges/list'); // Redirect to list after edit
            } else {
                alert("Deployed successfully");
                // Clear form but stay here to add more?
                resetForm();
            }
            await fetchColleges();

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to decommission this node? this will just delete it from listing, database remains.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok || res.status === 204) {
                router.push('/super-admin/colleges/list');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleStatus = async (college: any) => {
        try {
            await apiClient.put(`/api/v1/super-admin/tenants/${college.id}`, { is_active: !college.is_active });
            // Refresh local state if current
            if (selectedCollege && selectedCollege.id === college.id) {
                loadCollege({ ...college, is_active: !college.is_active });
            }
            fetchColleges();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-center sm:text-left">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {selectedCollege ? `Manage Tenant` : "Tenant Provisioning Console"}
                </h1>
                <Link href="/super-admin/colleges/list" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
                    <span className="material-symbols-rounded text-lg">list_alt</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">View Inventory</span>
                </Link>
            </div>

            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    {selectedCollege && (
                        <div className="absolute top-0 right-0 p-6 flex gap-2">
                            <Link href={`/super-admin/colleges/${selectedCollege.id}/admins`} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors" title="Manage Admins">
                                <span className="material-icons-outlined text-base">manage_accounts</span>
                            </Link>
                            <Link href={`/super-admin/colleges/${selectedCollege.id}/divisions`} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors" title="Manage Divisions">
                                <span className="material-icons-outlined text-base">account_balance</span>
                            </Link>
                            <button onClick={() => toggleStatus(selectedCollege)} className={`p-1.5 rounded-lg transition-colors ${selectedCollege.is_active ? 'bg-emerald-50 text-emerald-500 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'}`} title="Toggle Status">
                                <span className="material-icons-outlined text-base">{selectedCollege.is_active ? 'toggle_on' : 'toggle_off'}</span>
                            </button>
                            <button onClick={() => handleDelete(selectedCollege.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors" title="Delete">
                                <span className="material-icons-outlined text-base">delete</span>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedCollege ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-900 shadow-slate-200'}`}>
                            <span className="material-icons-outlined text-xl">{selectedCollege ? 'settings_applications' : 'add_business'}</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">{selectedCollege ? 'Configuration' : 'Initialize New Tenant'}</h2>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {selectedCollege ? `Update settings for ${selectedCollege.slug}` : 'Deploy a new dedicated environment to the cluster.'}
                            </p>
                        </div>
                    </div>

                        <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Organization Name</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="e.g. Stanford University"
                                        value={name} onChange={e => setName(e.target.value)} required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Url Slug</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="e.g. stanford"
                                        value={slug} onChange={e => setSlug(e.target.value)} required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Database Instance Name</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300 font-mono"
                                    placeholder="e.g. talixo_stanford"
                                    value={dbName} onChange={e => setDbName(e.target.value)} required
                                    disabled={!!selectedCollege} // Disable DB name edit usually? User can decide.
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Admin Email</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="admin@college.com"
                                        type="email"
                                        value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Admin Password {selectedCollege && '(Leave blank to keep)'}</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="••••••••"
                                        type="password"
                                        value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required={!selectedCollege}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Admin Profile Image</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="https://example.com/avatar.jpg"
                                        type="url"
                                        value={adminProfileImage} onChange={e => setAdminProfileImage(e.target.value)}
                                    />
                                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {adminProfileImage ? (
                                            <img src={adminProfileImage} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-icons-outlined text-slate-300">image</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                    <button
                        disabled={isLoading}
                        className={`w-full mt-2 text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-3 group ${selectedCollege ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                    >
                        {isLoading ? 'Processing...' : (selectedCollege ? 'Save Changes' : 'Initialize Deployment')}
                        <span className="material-icons-rounded text-sm group-hover:translate-x-1 transition-transform">{selectedCollege ? 'save' : 'rocket_launch'}</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
    );
}

export default function SuperAdminColleges() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Console...</p>
                </div>
            </div>
        }>
            <SuperAdminCollegesContent />
        </Suspense>
    );
}
