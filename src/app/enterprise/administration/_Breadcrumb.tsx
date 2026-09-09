"use client";

/**
 * The Administration breadcrumb — Administration › Section › Item.
 *
 * Manatal's admin screens all carry one, and it is the thing that makes the area feel like a
 * place rather than a menu: you can always see how deep you are and step back one level without
 * hunting for a link.
 *
 * Every part except the last is a link. The last is the page you are on, so it is plain text —
 * a breadcrumb whose final crumb navigates to itself teaches people not to trust the others.
 */

import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { Icon } from "@/components/ds";

export interface Crumb {
    /** Shown as-is. Section and item names come from the API, so they are already localised. */
    label: string;
    /** Omit on the final crumb — the page you are already on. */
    href?: string;
}

export default function AdminBreadcrumb({ trail }: { trail: Crumb[] }) {
    const { t } = useI18n();
    const all: Crumb[] = [{ label: t("admin.title"), href: "/enterprise/administration" }, ...trail];

    return (
        <nav aria-label={t("admin.breadcrumb")} className="flex items-center gap-1.5 flex-wrap text-[12.5px] mb-3">
            {all.map((c, i) => {
                const last = i === all.length - 1;
                return (
                    <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                        {i > 0 && <Icon name="chevron-right" className="text-[15px] text-[#BDBDBD]" />}
                        {c.href && !last ? (
                            <Link href={c.href} className="text-[#1976D2] hover:underline">{c.label}</Link>
                        ) : (
                            <span className="text-[#616161]">{c.label}</span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
