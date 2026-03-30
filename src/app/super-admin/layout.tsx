"use client";

import SuperAdminSidebar from "@/components/super-admin/Sidebar";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname?.startsWith("/super-admin/login");

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-white">
            <SuperAdminSidebar />
            {children}
        </div>
    );
}
