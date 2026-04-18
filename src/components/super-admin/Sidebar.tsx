"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminSidebar() {
    const pathname = usePathname();
    const { logout, user, role } = useAuth();

    const navGroups = [
        {
            title: "Platform Mgmt",
            items: [
                { label: "Overview", icon: "grid_view", path: "/super-admin" },
                { label: "Tenants Inventory", icon: "corporate_fare", path: "/super-admin/colleges/list" },
                { label: "Provision Tenant", icon: "add_business", path: "/super-admin/colleges" },
            ]
        },
        {
            title: "System Config",
            items: [
                { label: "Global Roles", icon: "security", path: "/super-admin/roles" },
                { label: "Organizations", icon: "business", path: "/super-admin/organizations" },
            ]
        }
    ];

    const navLinkClass = (path: string) => {
        const isActive = pathname === path || (path !== "/super-admin" && pathname.startsWith(path));
        return `group flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive
            ? "bg-[#7C3AED]/10 text-[#7C3AED]"
            : "text-slate-500 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]"
            }`;
    };

    return (
        <aside className="w-52 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300">
            <div className="p-4 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                {/* Logo Section */}
                <div className="p-4 flex items-center justify-between shrink-0 mb-4 border-b border-slate-50">
                    <Link href="/super-admin" className="flex items-center gap-2 tracking-tighter">
                        <span className="text-2xl font-black bg-gradient-to-r from-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent">Croar.ai</span>
                    </Link>
                </div>

                {/* Navigation Groups */}
                <nav className="space-y-4 px-1">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <p className="text-[11px] font-bold text-slate-400 mb-2 px-3">{group.title}</p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <Link key={item.path} href={item.path} className={navLinkClass(item.path)}>
                                        <span className="material-symbols-rounded text-xl">{item.icon}</span>
                                        <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Sidebar Footer User Info */}
            <div className="p-3 border-t border-slate-50 shrink-0">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                        {user ? user.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{user || "root@croar.ai"}</p>
                        <p className="text-[10px] font-medium text-slate-400">{role ? role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Super Admin'}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all duration-200 group"
                >
                    <span className="material-symbols-rounded text-slate-500 text-[20px]">logout</span>
                    <span className="text-[10px] font-bold">Logout</span>
                </button>
            </div>
        </aside>
    );
}
