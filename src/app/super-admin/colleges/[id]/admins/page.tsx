"use client";

// Legacy route → moved under Organizations.
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyAdminsRedirect() {
    const { id } = useParams();
    const router = useRouter();
    useEffect(() => {
        router.replace(`/super-admin/organizations/${id}/admins`);
    }, [id, router]);
    return null;
}
