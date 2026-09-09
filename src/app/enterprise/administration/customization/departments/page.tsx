"use client";

/**
 * Customization → Departments.
 *
 * Two things, and the first is the one Manatal leads with: what this account calls the concept.
 * The same field means "client" to an agency and "department" to an in-house team, and reading
 * the wrong word on every screen makes the product feel like it was built for somebody else.
 *
 * The page is also honest about a split in Croar that is not resolved: a job carries a
 * department as free text, while the departments table is the HR side's and is what employees
 * point at. Custom fields here attach to that table. Saying so on the page is better than
 * letting someone add a field and wonder why it never appears on a job.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Button, Icon, PageHeader, cn } from "@/components/ds";
import { CustomFields } from "../_CustomFields";

interface Naming { singular: string; plural: string; presets: { singular: string; plural: string }[] }

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

export default function DepartmentsPage() {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [naming, setNaming] = useState<Naming | null>(null);
    const [singular, setSingular] = useState("");
    const [plural, setPlural] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/naming`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const d: Naming = await res.json();
            setNaming(d);
            setSingular(d.singular);
            setPlural(d.plural);
        }
    }, [token]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/naming`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ singular: singular.trim(), plural: plural.trim() }),
            });
            if (res.ok) { setSaved(true); window.setTimeout(() => setSaved(false), 2500); }
        } finally { setSaving(false); }
    };

    const dirty = !!naming && (singular.trim() !== naming.singular || plural.trim() !== naming.plural);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader title={t("custom.departmentsTitle")} subtitle={t("custom.departmentsSubtitle")} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[900px] flex flex-col gap-4">
                    <section className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#E0E0E0]">
                            <h2 className="text-[15px] font-medium text-[#212121]">{t("custom.namingTitle")}</h2>
                            <p className="text-[12.5px] text-[#757575] mt-0.5 leading-relaxed">{t("custom.namingHint")}</p>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-3">
                            <div className="flex flex-wrap gap-1.5">
                                {(naming?.presets || []).map((p) => (
                                    <button
                                        key={p.singular}
                                        type="button"
                                        onClick={() => { setSingular(p.singular); setPlural(p.plural); }}
                                        className={cn(
                                            "h-8 px-3 rounded-[4px] border text-[12.5px] transition-colors",
                                            singular === p.singular
                                                ? "border-[#1976D2] bg-[#E3F2FD] text-[#1976D2]"
                                                : "border-[#E0E0E0] text-[#616161] hover:border-[#1976D2]"
                                        )}
                                    >
                                        {p.plural}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-w-[420px]">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[12px] text-[#616161]">{t("custom.singular")}</span>
                                    <input className={CONTROL} value={singular} maxLength={40}
                                           onChange={(e) => setSingular(e.target.value)} />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-[12px] text-[#616161]">{t("custom.plural")}</span>
                                    <input className={CONTROL} value={plural} maxLength={40}
                                           onChange={(e) => setPlural(e.target.value)} />
                                </label>
                            </div>
                            <p className="text-[12.5px] text-[#616161]">
                                {t("custom.namingPreview", { singular: singular || "—", plural: plural || "—" })}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button size="sm" icon="check" disabled={saving || !dirty || !singular.trim() || !plural.trim()}
                                        onClick={() => void save()}>
                                    {saving ? t("custom.saving") : t("custom.save")}
                                </Button>
                                {saved && (
                                    <span className="text-[12.5px] text-[#2E7D32] flex items-center gap-1">
                                        <Icon name="check-circle" className="text-[15px]" />
                                        {t("custom.savedShort")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    <CustomFields entity="department" />

                    <p className="text-[11.5px] text-[#757575] leading-relaxed">{t("custom.departmentsNote")}</p>
                </div>
            </div>
        </div>
    );
}
