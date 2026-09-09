"use client";

/**
 * The Administration shell — supplies the breadcrumb to every screen underneath.
 *
 * This is a layout rather than a line in each page for a concrete reason: the first attempt put
 * the crumb inside each page's `return`, and on pages with a loading early-return it landed in
 * the skeleton branch, so it appeared for half a second and then vanished. A layout wraps every
 * route by construction — it cannot miss one, cannot pick the wrong branch, and a new admin
 * page added next year gets its breadcrumb without anyone remembering to add it.
 *
 * The trail is derived from the URL. The labels live here, next to the routes they name, so a
 * page cannot render a crumb that disagrees with where it actually sits.
 */

import { usePathname } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import AdminBreadcrumb, { type Crumb } from "./_Breadcrumb";

/** Section id → its label, matching the backend's section map. */
const SECTIONS: Record<string, string> = {
    "account-and-users": "Account & Users",
    "data-management": "Data Management",
    integrations: "Integrations",
    subscription: "Credits & Usage",
    credits: "Credits & Usage",
    "career-page": "Career Page",
    "job-boards": "Job Boards",
    resumes: "Resumes",
    customization: "Customization",
    features: "Features",
    support: "Support",
};

/** Leaf segment → its label. */
const LEAVES: Record<string, string> = {
    account: "Account",
    users: "Users",
    roles: "Roles & Permissions",
    partners: "Partner companies",
    tools: "Integrations",
    wallet: "Credits",
    templates: "Templates",
    portals: "Job Portals",
    // Title-casing the segment would render these "Gdpr" and "Import", which is not what either
    // page is called anywhere else in the product.
    gdpr: "GDPR Tracking",
    import: "Data Import",
};

/**
 * Screens that hang off a section but live at the top level of /administration, because they
 * are tools rather than settings. Their crumb still shows the section they belong to, so
 * stepping back lands where the user came from rather than at the hub.
 */
const TOOLS: Record<string, { section: string; label: string }> = {
    logs: { section: "data-management", label: "Logs" },
    archive: { section: "data-management", label: "Archive Data" },
    duplicates: { section: "features", label: "Duplicate detection" },
};

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { t } = useI18n();

    const parts = pathname.replace(/^\/enterprise\/administration\/?/, "").split("/").filter(Boolean);

    const trail: Crumb[] = [];
    if (parts.length) {
        const [first, ...rest] = parts;
        const tool = TOOLS[first];
        if (tool) {
            trail.push({ label: SECTIONS[tool.section] || tool.section, href: `/enterprise/administration/${tool.section}` });
            trail.push({ label: tool.label });
        } else {
            trail.push({ label: SECTIONS[first] || first, href: `/enterprise/administration/${first}` });
            // Deeper segments: the leaf, plus any sub-route below it (templates/email-templates).
            // Unknown segments are title-cased rather than dropped, so a new page still shows a
            // crumb — a wrong-looking label is easier to notice and fix than a missing one.
            rest.forEach((seg, i) => {
                const label = LEAVES[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                const isLast = i === rest.length - 1;
                trail.push(isLast ? { label } : { label, href: `/enterprise/administration/${first}/${rest.slice(0, i + 1).join("/")}` });
            });
        }
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* The hub itself is the root crumb, so it does not need one above it. */}
            {trail.length > 0 && (
                <div className="px-6 pt-4 shrink-0">
                    <AdminBreadcrumb trail={trail} />
                </div>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </div>
    );
}
