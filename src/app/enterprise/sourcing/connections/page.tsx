"use client";

/**
 * The sourcing integrations moved into the single Integrations screen.
 *
 * Kept as a redirect rather than deleted: this path is in the sidebar's own history list and
 * very likely in someone's bookmarks, and a 404 is a worse answer than a hop.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConnectionsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/enterprise/integrations");
    }, [router]);
    return null;
}
