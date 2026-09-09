"use client";

/**
 * Customization → Dashboard widgets.
 *
 * Manatal's version is two columns of drag handles with a per-widget menu. This keeps the two
 * columns and the hidden shelf, but moves things with buttons rather than a drag library:
 * widgets get rearranged once and then never again, the buttons are reachable from a keyboard,
 * and the whole interaction is a few lines of state instead of a dependency.
 *
 * Every widget is always somewhere — left, right or hidden. The API refuses a layout where one
 * is missing or in two places, because either would render as a silent disappearance or a
 * duplicate and the person who did it would have no way to tell which.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Button, Icon, PageHeader, cn } from "@/components/ds";

type Col = "left" | "right" | "hidden";
type Layout = Record<Col, string[]>;

const WIDGET_ICON: Record<string, string> = {
    pipeline: "view-column-outline",
    recent_activity: "history",
    my_jobs: "briefcase-outline",
    hiring_funnel: "filter-variant",
    upcoming_interviews: "calendar-clock",
    sourcing_credits: "wallet",
    top_performers: "trophy-outline",
    offers_out: "email-fast-outline",
};

export default function DashboardWidgetsPage() {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [layout, setLayout] = useState<Layout | null>(null);
    const [isDefault, setIsDefault] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/dashboard-widgets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const d = await res.json();
                setLayout(d.layout);
                setIsDefault(d.is_default);
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const move = (col: Col, i: number, delta: number) => {
        if (!layout) return;
        const next = { ...layout, [col]: [...layout[col]] };
        const target = i + delta;
        if (target < 0 || target >= next[col].length) return;
        [next[col][i], next[col][target]] = [next[col][target], next[col][i]];
        setLayout(next);
    };

    const send = (col: Col, widget: string, to: Col) => {
        if (!layout) return;
        const next: Layout = {
            left: layout.left.filter((w) => w !== widget),
            right: layout.right.filter((w) => w !== widget),
            hidden: layout.hidden.filter((w) => w !== widget),
        };
        next[to] = [...next[to], widget];
        setLayout(next);
    };

    const save = async () => {
        if (!layout) return;
        setSaving(true); setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/dashboard-widgets`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(layout),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("custom.saveFailed")); return; }
            setIsDefault(false);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2500);
        } finally { setSaving(false); }
    };

    const reset = async () => {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/dashboard-widgets/reset`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setLayout(d.layout); setIsDefault(true); }
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={t("custom.widgetsTitle")}
                    subtitle={t("custom.widgetsSubtitle")}
                    actions={
                        <span className="flex items-center gap-2">
                            {!isDefault && (
                                <Button size="sm" variant="secondary" icon="restore" onClick={() => void reset()}>
                                    {t("custom.resetDefault")}
                                </Button>
                            )}
                            <Button size="sm" icon="check" disabled={saving || !layout} onClick={() => void save()}>
                                {saving ? t("custom.saving") : t("custom.save")}
                            </Button>
                        </span>
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <div className="max-w-[900px] flex flex-col gap-4">
                    {error && (
                        <p className="text-[12.5px] text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2] rounded-[4px] px-3 py-2">
                            {error}
                        </p>
                    )}
                    {saved && (
                        <p className="text-[12.5px] text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] rounded-[4px] px-3 py-2">
                            {t("custom.widgetsSaved")}
                        </p>
                    )}

                    {loading || !layout ? (
                        <div className="flex justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                {(["left", "right"] as Col[]).map((col) => (
                                    <Column key={col} col={col} widgets={layout[col]} t={t} onMove={move} onSend={send} />
                                ))}
                            </div>
                            <Column col="hidden" widgets={layout.hidden} t={t} onMove={move} onSend={send} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Column({ col, widgets, t, onMove, onSend }: {
    col: Col; widgets: string[];
    t: (k: string, v?: Record<string, string | number>) => string;
    onMove: (col: Col, i: number, delta: number) => void;
    onSend: (col: Col, widget: string, to: Col) => void;
}) {
    const targets: Col[] = (["left", "right", "hidden"] as Col[]).filter((c) => c !== col);
    return (
        <section className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
            <h3 className="px-4 py-2.5 bg-[#F5F6F8] border-b border-[#E0E0E0] text-[11px] uppercase tracking-wide text-[#757575] font-medium">
                {t(`custom.col_${col}`)}
            </h3>
            {widgets.length === 0 ? (
                <p className="px-4 py-6 text-[12.5px] text-[#9E9E9E] text-center">{t("custom.colEmpty")}</p>
            ) : (
                <ul className="divide-y divide-[#EEEEEE]">
                    {widgets.map((w, i) => (
                        <li key={w} className="flex items-center gap-2.5 px-4 py-2.5">
                            <Icon name={WIDGET_ICON[w] || "view-dashboard-outline"}
                                  className={cn("text-[19px] shrink-0", col === "hidden" ? "text-[#BDBDBD]" : "text-[#1976D2]")} />
                            <span className={cn("text-[13.5px] min-w-0 flex-1", col === "hidden" ? "text-[#9E9E9E]" : "text-[#212121]")}>
                                {t(`custom.widget_${w}`)}
                            </span>
                            <span className="flex items-center gap-0.5 shrink-0">
                                {col !== "hidden" && (
                                    <>
                                        <Btn icon="arrow-up" label={t("custom.moveUp")} disabled={i === 0} onClick={() => onMove(col, i, -1)} />
                                        <Btn icon="arrow-down" label={t("custom.moveDown")} disabled={i === widgets.length - 1} onClick={() => onMove(col, i, 1)} />
                                    </>
                                )}
                                {targets.map((to) => (
                                    <Btn
                                        key={to}
                                        icon={to === "hidden" ? "eye-off-outline" : to === "left" ? "arrow-left" : "arrow-right"}
                                        label={t(`custom.sendTo_${to}`)}
                                        onClick={() => onSend(col, w, to)}
                                    />
                                ))}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function Btn({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#1976D2] hover:bg-[#E3F2FD] transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
            <Icon name={icon} className="text-[17px]" />
        </button>
    );
}
