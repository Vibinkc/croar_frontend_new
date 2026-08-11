"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { CroarMark } from "@/components/ds";

export default function SuperAdminSidebar() {
    const pathname = usePathname();
    const { logout, user, role } = useAuth();
    const { t } = useI18n();

    const navGroups = [
        {
            title: t("superAdmin.platformMgmt"),
            items: [
                { label: t("superAdmin.overview"), icon: "grid_view", path: "/super-admin" },
                { label: t("superAdmin.organizations"), icon: "corporate_fare", path: "/super-admin/organizations" },
            ],
        },
        {
            title: t("superAdmin.userIntelligence"),
            items: [
                { label: t("superAdmin.globalUsers"), icon: "groups", path: "/super-admin/users" },
                { label: t("superAdmin.auditLogs"), icon: "receipt_long", path: "/super-admin/logs" },
            ],
        },
        {
            title: t("superAdmin.systemConfig"),
            items: [
                { label: t("superAdmin.globalRoles"), icon: "security", path: "/super-admin/roles" },
                { label: t("superAdmin.platformSettings"), icon: "settings_suggest", path: "/super-admin/settings" },
            ],
        },
    ];

    const isActive = (path: string) =>
        pathname === path || (path !== "/super-admin" && pathname.startsWith(path));

    return (
        <aside
            className="w-[236px] flex flex-col h-screen sticky top-0 shrink-0 border-r border-[#1C1F26]"
            style={{ background: "#090A0C" }}
        >
            <div className="p-3 flex-1 overflow-y-auto no-scrollbar flex flex-col">
                {/* Logo */}
                <div className="px-2 pt-2.5 pb-4 flex items-center justify-between shrink-0 mb-3 border-b border-[#1C1F26]">
                    <Link href="/super-admin" className="flex items-center gap-2.5">
                        <CroarMark size={32} />
                        <span className="flex flex-col leading-none">
                            <span className="text-[17px] font-extrabold tracking-[-0.3px] text-white">Croar</span>
                            <span className="text-[9.5px] text-[#4F5564] font-semibold uppercase mt-0.5 tracking-wider">{t("superAdmin.platform")}</span>
                        </span>
                    </Link>
                </div>

                {/* Navigation Groups */}
                <nav className="space-y-4 px-1">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <p className="text-[10.5px] font-bold tracking-widest uppercase text-[#5C6370] mb-2 px-3">{group.title}</p>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`group flex items-center gap-3 px-3.5 py-2 rounded-[10px] text-[12.5px] transition-all duration-150 ${
                                                active
                                                    ? "bg-[#5B53E0]/15 border border-[#5B53E0]/30 text-[#8B7DFF] font-semibold"
                                                    : "text-[#BAC1CC] hover:bg-white/[0.04] hover:text-white border border-transparent font-medium"
                                            }`}
                                        >
                                            <span className={`material-symbols-rounded text-[18px] ${active ? "text-[#8B7DFF]" : "text-[#656D7A] group-hover:text-white transition-colors"}`}>{item.icon}</span>
                                            <span className="whitespace-nowrap">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Sidebar Footer — user + logout */}
            <div className="p-3 border-t border-[#1C1F26] shrink-0">
                <div className="flex items-center gap-2.5 mb-3 px-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[#5B53E0] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_2px_8px_rgba(91,83,224,0.3)]">
                        {user ? user.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#C7CCD4] truncate">{user || "root@croar.ai"}</p>
                        <p className="text-[10px] font-medium text-[#525969]">
                            {role ? role.replace("_", " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) : t("superAdmin.superAdmin")}
                        </p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[#8A929E] hover:bg-white/[0.04] hover:text-rose-400 rounded-[10px] transition-colors duration-150 group"
                >
                    <span className="material-symbols-rounded text-[18px] text-[#525969] group-hover:text-rose-400">logout</span>
                    <span className="text-[12.5px] font-medium">{t("superAdmin.logout")}</span>
                </button>
            </div>
        </aside>
    );
}
