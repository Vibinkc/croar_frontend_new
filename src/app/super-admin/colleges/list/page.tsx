"use client";

// Legacy route — the tenant inventory is now "Organizations".
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCollegesListRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/super-admin/organizations");
    }, [router]);
    return null;
}
