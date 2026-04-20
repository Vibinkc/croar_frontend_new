import Link from "next/link";

interface College {
    id: string;
    name: string;
    slug: string;
    db_name: string;
    admin_email: string;
    admin_profile_image?: string;
    is_active: boolean;
}

export default function DeployedNodesList() {
    const [colleges, setColleges] = useState<College[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/v1/super-admin/tenants");
            if (res.ok) {
                setColleges(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to decommission this node? This action cannot be undone.")) return;
        try {
            const res = await apiClient.delete(`/api/v1/super-admin/tenants/${id}`);
            if (res.ok || res.status === 204) {
                fetchColleges();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleStatus = async (college: College) => {
        try {
            await apiClient.put(`/api/v1/super-admin/tenants/${college.id}`, { is_active: !college.is_active });
            fetchColleges();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xs font-black text-slate-400  tracking-[0.2em]">Platform Inventory</h1>
                <Link href="/super-admin/colleges" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
                    <span className="material-symbols-rounded text-lg">add_box</span>
                    <span className="text-[10px] font-black  ">Provision Tenant</span>
                </Link>
            </div>
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
                                    <span className="material-icons-outlined text-lg">view_list</span>
                                </div>
                                <h2 className="text-xs font-black   text-slate-900">Active Deployments ({colleges.length})</h2>
                            </div>
                            <Link href="/super-admin/colleges" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black   hover:bg-slate-800 transition-colors flex items-center gap-2">
                                <span className="material-icons-outlined text-sm">add</span>
                                New Node
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-black   text-slate-400">Organization Name</th>
                                        <th className="px-5 py-3 text-[10px] font-black   text-slate-400">Slug / URL</th>
                                        <th className="px-5 py-3 text-[10px] font-black   text-slate-400">Database</th>
                                        <th className="px-5 py-3 text-[10px] font-black   text-slate-400">Status</th>
                                        <th className="px-5 py-3 text-[10px] font-black   text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {colleges.map((c: College) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        {c.admin_profile_image ? (
                                                            <img src={c.admin_profile_image} className="w-full h-full object-cover rounded-lg" alt="" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-500">{c.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500">
                                                    {c.slug}.{FRONTEND_DOMAIN}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-[10px] font-mono text-slate-400">{c.db_name}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => toggleStatus(c)}
                                                    className={`px-2 py-0.5 rounded-full text-[8px] font-black   border transition-all cursor-pointer ${c.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 dashed hover:bg-slate-100'}`}
                                                >
                                                    {c.is_active ? 'Active' : 'Offline'}
                                                </button>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/super-admin/colleges?edit=${c.id}`} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Edit Configuration">
                                                        <span className="material-icons-outlined text-lg">edit</span>
                                                    </Link>
                                                    <Link href={`/super-admin/colleges/${c.id}/admins`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Manage Admins">
                                                        <span className="material-icons-outlined text-lg">manage_accounts</span>
                                                    </Link>
                                                    <Link href={`/super-admin/colleges/${c.id}/divisions`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Manage Divisions">
                                                        <span className="material-icons-outlined text-lg">account_balance</span>
                                                    </Link>
                                                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                                                        <span className="material-icons-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {colleges.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold  ">
                                                No tenants provisioned yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
        </div>
    );
}
