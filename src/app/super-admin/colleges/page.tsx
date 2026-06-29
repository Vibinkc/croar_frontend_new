"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/api";
import {
    Building2,
    Power,
    Users,
    Trash2,
    Save,
    Rocket,
    ImageIcon,
} from "lucide-react";
import { Button, Card, CardHeader, Input, Field, PageHeader, jetbrainsMono } from "@/components/ds";


interface College {
    id: string;
    name: string;
    slug: string;
    db_name: string;
    admin_email: string;
    admin_profile_image?: string;
    is_active: boolean;
}

function SuperAdminCollegesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [colleges, setColleges] = useState<College[]>([]);
    const [name, setName] = useState<string>("");
    const [slug, setSlug] = useState<string>("");
    const [dbName, setDbName] = useState<string>("");
    const [adminEmail, setAdminEmail] = useState<string>("");
    const [adminPassword, setAdminPassword] = useState<string>("");
    const [adminProfileImage, setAdminProfileImage] = useState<string>("");
    const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

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
    const loadCollege = (college: College) => {
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

    const toggleStatus = async (college: College) => {
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
        <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
            <PageHeader
                title={selectedCollege ? "Manage Tenant" : "Provision Tenant"}
                subtitle={selectedCollege ? `Update settings for ${selectedCollege.slug}` : "Deploy a new dedicated environment"}
                icon={selectedCollege ? "settings" : "add_business"}
                help={<><p>Spin up a new tenant organization and its first admin.</p><p>Fill in the details and create it.</p></>}
                actions={
                    <Link href="/super-admin/colleges/list">
                        <Button variant="secondary" icon="list_alt">View Inventory</Button>
                    </Link>
                }
            />

            <Card padding="lg" className="max-w-3xl mx-auto w-full">
                <CardHeader
                    title={selectedCollege ? "Configuration" : "Initialize New Tenant"}
                    subtitle={selectedCollege ? `Update settings for ${selectedCollege.slug}` : "Deploy a new dedicated environment to the cluster."}
                    action={
                        selectedCollege ? (
                            <div className="flex items-center gap-1.5">
                                <Link
                                    href={`/super-admin/colleges/${selectedCollege.id}/admins`}
                                    className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                    title="Manage Admins"
                                >
                                    <Users className="w-4 h-4" />
                                </Link>
                                <Link
                                    href={`/super-admin/colleges/${selectedCollege.id}/divisions`}
                                    className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#ECEBFB] hover:text-[#5B53E0] transition-colors"
                                    title="Manage Divisions"
                                >
                                    <Building2 className="w-4 h-4" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => toggleStatus(selectedCollege)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-[9px] transition-colors ${selectedCollege.is_active ? 'text-[#15803D] hover:bg-[#E6F4EA]' : 'text-[#9AA3AF] hover:bg-[#F1F2F5]'}`}
                                    title="Toggle Status"
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(selectedCollege.id)}
                                    className="w-9 h-9 flex items-center justify-center rounded-[9px] text-[#9AA3AF] hover:bg-[#FDECEC] hover:text-[#C0383C] transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : undefined
                    }
                />

                <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Organization Name" htmlFor="college-name" required>
                            <Input
                                id="college-name"
                                placeholder="e.g. Stanford University"
                                value={name} onChange={e => setName(e.target.value)} required
                            />
                        </Field>
                        <Field label="URL Slug" htmlFor="college-slug" required>
                            <Input
                                id="college-slug"
                                placeholder="e.g. stanford"
                                value={slug} onChange={e => setSlug(e.target.value)} required
                            />
                        </Field>
                    </div>

                    <Field label="Database Instance Name" htmlFor="college-db-name" required>
                        <Input
                            id="college-db-name"
                            className={jetbrainsMono.className}
                            placeholder="e.g. talixo_stanford"
                            value={dbName} onChange={e => setDbName(e.target.value)} required
                            disabled={!!selectedCollege}
                        />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Admin Email" htmlFor="college-admin-email" required>
                            <Input
                                id="college-admin-email"
                                icon="mail"
                                placeholder="admin@college.com"
                                type="email"
                                value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required
                            />
                        </Field>
                        <Field label={`Admin Password${selectedCollege ? ' (Leave blank to keep)' : ''}`}>
                            <Input
                                icon="lock"
                                placeholder="••••••••"
                                type="password"
                                value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required={!selectedCollege}
                            />
                        </Field>
                    </div>

                    <Field label="Admin Profile Image" htmlFor="college-admin-profile-image">
                        <div className="flex gap-2.5">
                            <Input
                                id="college-admin-profile-image"
                                className="flex-1"
                                placeholder="https://example.com/avatar.jpg"
                                type="url"
                                value={adminProfileImage} onChange={e => setAdminProfileImage(e.target.value)}
                            />
                            <div className="w-11 h-11 rounded-[10px] bg-[#F4F5F7] border border-[#E1E4E8] flex items-center justify-center overflow-hidden shrink-0">
                                {adminProfileImage ? (
                                    <img src={adminProfileImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-4 h-4 text-[#9AA3AF]" />
                                )}
                            </div>
                        </div>
                    </Field>

                    <Button
                        type="submit"
                        fullWidth
                        disabled={isLoading}
                        className="mt-2"
                    >
                        {selectedCollege ? <Save className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                        {isLoading ? 'Processing...' : (selectedCollege ? 'Save Changes' : 'Initialize Deployment')}
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default function SuperAdminColleges() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-[#F4F5F7]">
                <div className="text-center">
                    <div className="w-12 h-12 border-[3px] border-[#5B53E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#8A929E] font-semibold text-[13px]">Loading console…</p>
                </div>
            </div>
        }>
            <SuperAdminCollegesContent />
        </Suspense>
    );
}
