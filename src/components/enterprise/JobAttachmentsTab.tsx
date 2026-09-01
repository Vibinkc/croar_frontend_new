"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, EmptyState, cn } from "@/components/ds";

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
    if (ext === "pdf" || type.includes("pdf")) return { icon: "picture_as_pdf", cls: "bg-[#FDECEC] text-[#C0383C]" };
    if (["doc", "docx", "rtf", "odt"].includes(ext)) return { icon: "description", cls: "bg-[#E7ECFB] text-[#3559C7]" };
    if (["xls", "xlsx", "csv"].includes(ext)) return { icon: "table", cls: "bg-[#E6F4EA] text-[#15803D]" };
    if (["ppt", "pptx"].includes(ext)) return { icon: "slideshow", cls: "bg-[#FEF3E2] text-[#D97706]" };
    if (type.startsWith("image/")) return { icon: "image", cls: "bg-[#E3F4EF] text-[#0E8A6E]" };
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { icon: "folder_zip", cls: "bg-[#F1F2F5] text-[#4B5563]" };
    return { icon: "draft", cls: "bg-[#F1F2F5] text-[#4B5563]" };
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
                        "w-full rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-colors",
                        isDragging
                            ? "border-[#5B53E0] bg-[#F5F4FE]"
                            : "border-[#DDE0E5] bg-[#FAFBFC] hover:border-[#5B53E0]/50 hover:bg-[#F7F8FA]",
                        isUploading && "opacity-60 cursor-wait"
                    )}
                >
                    <span className="material-symbols-rounded text-[32px] text-[#5B53E0]">
                        {isUploading ? "progress_activity" : "cloud_upload"}
                    </span>
                    <p className="text-[13px] font-bold text-[#15171C] mt-2">
                        {isUploading ? tr("jobFiles.uploading") : tr("jobFiles.dropHere")}
                    </p>
                    <p className="text-[11.5px] text-[#8A929E] mt-1">{tr("jobFiles.dropHint")}</p>
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
                <div className="rounded-[12px] border border-[#F5C6C7] bg-[#FDECEC] px-4 py-3 text-[12.5px] text-[#C0383C]">
                    {error}
                </div>
            )}

            {isLoading ? (
                <Card padding="sm">
                    <p className="py-10 text-center text-[13px] text-[#8A929E]">{tr("jobFiles.loading")}</p>
                </Card>
            ) : items.length === 0 ? (
                <Card padding="none">
                    <EmptyState
                        icon="attach_file"
                        title={tr("jobFiles.emptyTitle")}
                        description={tr("jobFiles.emptyDesc")}
                        action={
                            <Button onClick={() => inputRef.current?.click()}>
                                <span className="material-symbols-rounded text-[18px]">upload</span>
                                {tr("jobFiles.uploadFile")}
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <Card padding="none" className="overflow-hidden">
                    <ul className="divide-y divide-[#F0F0F1]">
                        {items.map(item => {
                            const look = fileLook(item.filename, item.content_type);
                            return (
                                <li key={item.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                                    <span
                                        className={cn(
                                            "w-10 h-10 shrink-0 rounded-[10px] flex items-center justify-center",
                                            look.cls
                                        )}
                                    >
                                        <span className="material-symbols-rounded text-[20px]">{look.icon}</span>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold text-[#15171C] truncate">{item.filename}</p>
                                        <p className="text-[11.5px] text-[#8A929E]">
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
                                        className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#8A929E] hover:text-[#5B53E0] hover:bg-[#F7F8FA] transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-[18px]">open_in_new</span>
                                    </a>
                                    <button
                                        onClick={() => remove(item)}
                                        title={tr("common.delete")}
                                        aria-label={tr("common.delete")}
                                        className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#8A929E] hover:text-[#C0383C] hover:bg-[#FDECEC] transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-[18px]">delete</span>
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
