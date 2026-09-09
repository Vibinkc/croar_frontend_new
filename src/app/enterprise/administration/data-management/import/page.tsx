"use client";

/**
 * Data Import — CSV candidates, in two steps.
 *
 * Nothing is written by choosing a file. The upload produces a preview of what WOULD happen —
 * how many are new, how many already exist, which rows are malformed and why — and only the
 * second click writes. A bulk import that half-succeeds and reports a number is the worst
 * outcome available: you cannot tell what landed without reading the whole table afterwards.
 *
 * The preview is also where the ignored columns are named. An export from another ATS carries
 * forty columns; silently dropping thirty-four of them is how people discover, a week later,
 * that the notes never arrived.
 */

import React, { useRef, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, Icon, PageHeader, cn } from "@/components/ds";

interface CleanRow {
    full_name: string;
    email: string | null;
    phone: string | null;
    skills: string[];
    source_platform: string;
    total_experience: number | null;
}
interface SampleRow { row: number; data: CleanRow }
interface InvalidRow { row: number; reason: string; data: CleanRow }
interface Preview {
    filename: string;
    headers: string[];
    recognised_columns: string[];
    ignored_columns: string[];
    total_rows: number;
    will_create: number;
    will_update: number;
    invalid: number;
    sample_create: SampleRow[];
    sample_update: SampleRow[];
    invalid_rows: InvalidRow[];
    rows: CleanRow[];
    truncated: boolean;
}

const TEMPLATE =
    "full_name,email,phone,skills,source_platform,total_experience\n" +
    'Ada Lovelace,ada@example.com,+44 20 7946 0000,"Python;Analysis",Referral,7\n';

export default function ImportPage() {
    const { t } = useI18n();
    const { token } = useAuth();

    const [preview, setPreview] = useState<Preview | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
    const [updateExisting, setUpdateExisting] = useState(true);
    const [consent, setConsent] = useState<"" | "granted">("");
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setPreview(null);
        setResult(null);
        setError("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const upload = async (file: File) => {
        setBusy(true); setError(""); setResult(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/data-management/import/preview`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("import.previewFailed")); return; }
            setPreview(body);
        } catch {
            setError(t("import.previewFailed"));
        } finally {
            setBusy(false);
        }
    };

    const commit = async () => {
        if (!preview) return;
        setBusy(true); setError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/data-management/import/commit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    rows: preview.rows,
                    update_existing: updateExisting,
                    consent_status: consent || null,
                }),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) { setError(body?.detail || t("import.commitFailed")); return; }
            setResult(body);
            setPreview(null);
        } catch {
            setError(t("import.commitFailed"));
        } finally {
            setBusy(false);
        }
    };

    const downloadTemplate = () => {
        const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "croar-candidates-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-6">
                <PageHeader
                    title={t("import.title")}
                    subtitle={t("import.subtitle")}
                    actions={<Button size="sm" variant="secondary" icon="download" onClick={downloadTemplate}>{t("import.template")}</Button>}
                />
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
                <div className="max-w-[880px] flex flex-col gap-4">
                    {error && (
                        <div className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] rounded-[4px] px-4 py-3 text-[13px] flex items-start gap-2">
                            <Icon name="alert-circle" className="text-[18px] mt-px shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {result && (
                        <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Icon name="check-circle" className="text-[20px] text-[#2E7D32]" />
                                <h3 className="text-[15px] font-medium text-[#212121]">{t("import.done")}</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {([["created", result.created], ["updated", result.updated], ["skipped", result.skipped]] as const).map(([k, v]) => (
                                    <div key={k} className="border border-[#E0E0E0] rounded-[4px] p-3">
                                        <span className="block text-[22px] font-medium tabular-nums text-[#212121] leading-none">{v}</span>
                                        <span className="block text-[11.5px] text-[#757575] mt-1">{t(`import.${k}`)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button size="sm" onClick={reset}>{t("import.another")}</Button>
                                <Button size="sm" variant="secondary" onClick={() => { window.location.href = "/enterprise/candidates"; }}>
                                    {t("import.viewCandidates")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {!preview && !result && (
                        <>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragging(false);
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) void upload(f);
                                }}
                                className={cn(
                                    "bg-white border-2 border-dashed rounded-[4px] px-6 py-12 text-center transition-colors",
                                    dragging ? "border-[#1976D2] bg-[#E3F2FD]" : "border-[#E0E0E0]"
                                )}
                            >
                                <Icon name="file-upload-outline" className="text-[40px] text-[#9E9E9E]" />
                                <h3 className="text-[15px] font-medium text-[#212121] mt-2">{t("import.drop")}</h3>
                                <p className="text-[13px] text-[#757575] mt-1">{t("import.dropHint")}</p>
                                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                                       onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
                                <Button size="sm" className="mt-4" icon="folder-open" disabled={busy}
                                        onClick={() => fileRef.current?.click()}>
                                    {busy ? t("import.reading") : t("import.choose")}
                                </Button>
                            </div>

                            <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-5">
                                <h3 className="text-[14px] font-medium text-[#212121] mb-2">{t("import.columnsTitle")}</h3>
                                <p className="text-[13px] text-[#757575] leading-relaxed mb-3">{t("import.columnsHint")}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {["full_name", "email", "phone", "skills", "source_platform", "total_experience"].map((c) => (
                                        <code key={c} className="px-2 py-1 rounded-[3px] bg-[#F5F6F8] border border-[#E0E0E0] text-[12px] text-[#37474F]">{c}</code>
                                    ))}
                                </div>
                                <p className="text-[12px] text-[#757575] mt-3">{t("import.onlyName")}</p>
                            </div>
                        </>
                    )}

                    {preview && (
                        <>
                            <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon name="file-delimited-outline" className="text-[20px] text-[#1976D2]" />
                                    <span className="text-[14px] font-medium text-[#212121] truncate">{preview.filename}</span>
                                    <span className="text-[12.5px] text-[#757575] ml-auto tabular-nums shrink-0">
                                        {t("import.nRows", { count: preview.total_rows })}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <Tile value={preview.will_create} label={t("import.willCreate")} tone="ok" />
                                    <Tile value={preview.will_update} label={t("import.willUpdate")} tone="info" />
                                    <Tile value={preview.invalid} label={t("import.invalid")} tone={preview.invalid ? "bad" : "plain"} />
                                </div>

                                {preview.ignored_columns.length > 0 && (
                                    <div className="mt-4 bg-[#FFF3E0] border border-[#FFE0B2] rounded-[4px] px-3.5 py-3">
                                        <p className="text-[12.5px] text-[#E65100] leading-relaxed">
                                            {t("import.ignored", { columns: preview.ignored_columns.join(", ") })}
                                        </p>
                                    </div>
                                )}
                                {preview.truncated && (
                                    <p className="mt-3 text-[12.5px] text-[#E65100]">{t("import.truncated")}</p>
                                )}
                            </div>

                            {preview.invalid_rows.length > 0 && (
                                <Panel title={t("import.skippedTitle")} note={t("import.skippedNote")}>
                                    <table className="w-full border-collapse">
                                        <tbody className="divide-y divide-[#EEEEEE]">
                                            {preview.invalid_rows.map((r) => (
                                                <tr key={r.row}>
                                                    <td className="py-2 px-3 text-[12.5px] text-[#757575] tabular-nums w-16">#{r.row}</td>
                                                    <td className="py-2 px-3 text-[13px] text-[#212121]">{r.data.full_name || r.data.email || "—"}</td>
                                                    <td className="py-2 px-3 text-right"><Badge tone="danger">{r.reason}</Badge></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Panel>
                            )}

                            {preview.sample_create.length > 0 && (
                                <Panel title={t("import.newTitle")} note={t("import.showingN", { count: preview.sample_create.length, total: preview.will_create })}>
                                    <RowTable rows={preview.sample_create} t={t} />
                                </Panel>
                            )}
                            {preview.sample_update.length > 0 && (
                                <Panel title={t("import.existingTitle")} note={t("import.existingNote")}>
                                    <RowTable rows={preview.sample_update} t={t} />
                                </Panel>
                            )}

                            <div className="bg-white border border-[#E0E0E0] rounded-[4px] p-5 flex flex-col gap-3">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input type="checkbox" className="mt-0.5 accent-[#1976D2]" checked={updateExisting}
                                           onChange={(e) => setUpdateExisting(e.target.checked)} />
                                    <span>
                                        <span className="block text-[13.5px] text-[#212121]">{t("import.updateExisting")}</span>
                                        <span className="block text-[12px] text-[#757575]">{t("import.updateExistingHint")}</span>
                                    </span>
                                </label>
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input type="checkbox" className="mt-0.5 accent-[#1976D2]" checked={consent === "granted"}
                                           onChange={(e) => setConsent(e.target.checked ? "granted" : "")} />
                                    <span>
                                        <span className="block text-[13.5px] text-[#212121]">{t("import.consentGranted")}</span>
                                        <span className="block text-[12px] text-[#757575]">{t("import.consentHint")}</span>
                                    </span>
                                </label>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>{t("import.cancel")}</Button>
                                    <Button size="sm" icon="database-import" disabled={busy || preview.rows.length === 0} onClick={() => void commit()}>
                                        {busy ? t("import.importing") : t("import.confirm", { count: preview.rows.length })}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Tile({ value, label, tone }: { value: number; label: string; tone: "ok" | "info" | "bad" | "plain" }) {
    const color =
        tone === "ok" ? "text-[#2E7D32]"
            : tone === "info" ? "text-[#1976D2]"
                : tone === "bad" ? "text-[#C62828]"
                    : "text-[#616161]";
    return (
        <div className="border border-[#E0E0E0] rounded-[4px] p-3">
            <span className={cn("block text-[22px] font-medium tabular-nums leading-none", color)}>{value}</span>
            <span className="block text-[11.5px] text-[#757575] mt-1">{label}</span>
        </div>
    );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E0E0E0]">
                <h3 className="text-[14px] font-medium text-[#212121]">{title}</h3>
                {note && <p className="text-[12px] text-[#757575] mt-0.5">{note}</p>}
            </div>
            <div className="overflow-x-auto">{children}</div>
        </div>
    );
}

function RowTable({ rows, t }: { rows: SampleRow[]; t: (k: string) => string }) {
    return (
        <table className="w-full border-collapse min-w-[560px]">
            <thead className="bg-[#F5F6F8] border-b border-[#E0E0E0]">
                <tr>
                    {[t("import.colName"), t("import.colEmail"), t("import.colPhone"), t("import.colSkills")].map((h) => (
                        <th key={h} className="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-[#757575] font-medium">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
                {rows.map((r) => (
                    <tr key={r.row}>
                        <td className="py-2 px-3 text-[13px] text-[#212121]">{r.data.full_name}</td>
                        <td className="py-2 px-3 text-[12.5px] text-[#616161]">{r.data.email || "—"}</td>
                        <td className="py-2 px-3 text-[12.5px] text-[#616161]">{r.data.phone || "—"}</td>
                        <td className="py-2 px-3 text-[12.5px] text-[#616161] truncate max-w-[220px]">{r.data.skills.join(", ") || "—"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
