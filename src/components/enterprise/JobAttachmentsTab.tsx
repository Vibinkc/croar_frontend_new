"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, EmptyState, cn, Icon } from "@/components/ds";

interface JobAttachment {
    id: string;
    filename: string;
    url: string;
    content_type?: string | null;
    size_bytes?: number | null;
    uploader_name?: string | null;
    created_at: string;
}

const formatSize = (bytes?: number | null) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Material Symbols glyph + tone for a file, by extension. */
const fileLook = (filename: string, contentType?: string | null): { icon: string; cls: string } => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const type = contentType || "";
    if (ext === "pdf" || type.includes("pdf")) return { icon: "picture_as_pdf", cls: "bg-[#FFEBEE] text-[#C62828]" };
    if (["doc", "docx", "rtf", "odt"].includes(ext)) return { icon: "description", cls: "bg-[#E3F2FD] text-[#1565C0]" };
    if (["xls", "xlsx", "csv"].includes(ext)) return { icon: "table", cls: "bg-[#E8F5E9] text-[#2E7D32]" };
    if (["ppt", "pptx"].includes(ext)) return { icon: "slideshow", cls: "bg-[#FFF3E0] text-[#EF6C00]" };
    if (type.startsWith("image/")) return { icon: "image", cls: "bg-[#E8F5E9] text-[#2E7D32]" };
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { icon: "folder_zip", cls: "bg-[#EEEEEE] text-[#4F4F4F]" };
    return { icon: "draft", cls: "bg-[#EEEEEE] text-[#4F4F4F]" };
};

const MAX_BYTES = 20 * 1024 * 1024;

export default function JobAttachmentsTab({
    jobId,
    onCountChange,
}: {
    jobId: string;
    onCountChange?: (n: number) => void;
}) {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const [items, setItems] = useState<JobAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/attachments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: JobAttachment[] = await res.json();
                setItems(data);
                onCountChange?.(data.length);
            }
        } catch {
            setError(tr("jobFiles.loadFailed"));
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, token, tr]);

    useEffect(() => {
        void load();
    }, [load]);

    const upload = async (file: File) => {
        setError("");
        // Check the size here as well as on the server so an oversized file fails instantly
        // instead of after a long upload that the server then rejects.
        if (file.size > MAX_BYTES) {
            setError(tr("jobFiles.tooLarge"));
            return;
        }
        setIsUploading(true);
        try {
            const body = new FormData();
            body.append("file", file);
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/attachments`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body,
            });
            if (!res.ok) {
                const detail = await res.json().catch(() => null);
                throw new Error(detail?.detail || String(res.status));
            }
            await load();
        } catch (e) {
            setError(e instanceof Error && e.message ? e.message : tr("jobFiles.uploadFailed"));
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const remove = async (item: JobAttachment) => {
        if (!window.confirm(tr("jobFiles.confirmDelete", { name: item.filename }))) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/${jobId}/attachments/${item.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(String(res.status));
            await load();
        } catch {
            setError(tr("jobFiles.deleteFailed"));
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card padding="sm">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) void upload(file);
                    }}
                    disabled={isUploading}
                    className={cn(
                        "w-full rounded-[4px] border-2 border-dashed px-6 py-10 text-center transition-colors",
                        isDragging
                            ? "border-[#1976D2] bg-[#F5F4FE]"
                            : "border-[#DDE0E5] bg-[#FAFAFA] hover:border-[#1976D2]/50 hover:bg-[#FAFAFA]",
                        isUploading && "opacity-60 cursor-wait"
                    )}
                >
                    <Icon name={isUploading ? "progress_activity" : "cloud_upload"} className="text-[32px] text-[#1976D2]" />
                    <p className="text-[13px] font-bold text-[#212121] mt-2">
                        {isUploading ? tr("jobFiles.uploading") : tr("jobFiles.dropHere")}
                    </p>
                    <p className="text-[11.5px] text-[#757575] mt-1">{tr("jobFiles.dropHint")}</p>
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) void upload(file);
                    }}
                />
            </Card>

            {error && (
                <div className="rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[12.5px] text-[#C62828]">
                    {error}
                </div>
            )}

            {isLoading ? (
                <Card padding="sm">
                    <p className="py-10 text-center text-[13px] text-[#757575]">{tr("jobFiles.loading")}</p>
                </Card>
            ) : items.length === 0 ? (
                <Card padding="none">
                    <EmptyState
                        icon="attach_file"
                        title={tr("jobFiles.emptyTitle")}
                        description={tr("jobFiles.emptyDesc")}
                        action={
                            <Button onClick={() => inputRef.current?.click()}>
                                <i className="mdi mdi-upload text-[18px]" />
                                {tr("jobFiles.uploadFile")}
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <Card padding="none" className="overflow-hidden">
                    <ul className="divide-y divide-[#EEEEEE]">
                        {items.map(item => {
                            const look = fileLook(item.filename, item.content_type);
                            return (
                                <li key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                                    <span
                                        className={cn(
                                            "w-10 h-10 shrink-0 rounded-[4px] flex items-center justify-center",
                                            look.cls
                                        )}
                                    >
                                        <Icon name={look.icon} className="text-[20px]" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold text-[#212121] truncate">{item.filename}</p>
                                        <p className="text-[11.5px] text-[#757575]">
                                            {[
                                                formatSize(item.size_bytes),
                                                item.uploader_name,
                                                new Date(item.created_at).toLocaleDateString(),
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                    </div>
                                    <a
                                        href={`${BACKEND_URL}${item.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={tr("jobFiles.open")}
                                        aria-label={tr("jobFiles.open")}
                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#1976D2] hover:bg-[#FAFAFA] transition-colors"
                                    >
                                        <i className="mdi mdi-open-in-new text-[18px]" />
                                    </a>
                                    <button
                                        onClick={() => remove(item)}
                                        title={tr("common.delete")}
                                        aria-label={tr("common.delete")}
                                        className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#757575] hover:text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                    >
                                        <i className="mdi mdi-delete text-[18px]" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}
        </div>
    );
}
