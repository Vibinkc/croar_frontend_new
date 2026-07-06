"use client";

// Legacy route — "Provision Tenant" is now handled from the Organizations page.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCollegesRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/super-admin/organizations");
    }, [router]);
    return null;
}
