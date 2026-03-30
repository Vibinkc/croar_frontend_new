"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(path + "/");
    };

    return (
        <div className="w-72 bg-slate-50 border-r border-slate-200 text-slate-800 flex flex-col h-full shrink-0">
            <div className="p-6 shrink-0 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <span className="material-icons-outlined text-lg">admin_panel_settings</span>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Super Admin</span>
                </div>
            </div>

            <nav className="mt-6 flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                    <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Management</h3>

                    <Link
                        href="/super-admin/colleges"
                        className={`group flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${pathname === "/super-admin/colleges" ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                        <span className="material-icons-outlined mr-3 text-lg">add_business</span>
                        Deploy Node
                    </Link>

                    <Link
                        href="/super-admin/colleges/list"
                        className={`group flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${isActive("/super-admin/colleges/list") || (pathname.startsWith("/super-admin/colleges/") && pathname !== "/super-admin/colleges" && pathname !== "/super-admin/colleges/list") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                        <span className="material-icons-outlined mr-3 text-lg">view_list</span>
                        Deployed Nodes
                    </Link>

                </div>
            </nav>

            <div className="p-4 border-t border-slate-200 shrink-0">
                <button onClick={() => logout()} className="group flex items-center w-full px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200">
                    <span className="material-icons-outlined mr-3 text-lg">logout</span>
                    Logout
                </button>
            </div>
        </div>
    );
}
