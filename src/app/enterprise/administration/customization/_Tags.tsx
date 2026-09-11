"use client";

/**
 * Candidate and job tags.
 *
 * The usage count beside each tag is the point of the screen. Tag lists rot — somebody creates
 * "urgent-q3" once and it sits there forever — and a count is how you tell a tag worth keeping
 * from one to delete. It also makes the delete honest: you can see how many records you are
 * about to strip it from.
 */

import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { Button, Icon, cn } from "@/components/ds";
import { useAutoFocus } from "@/hooks/useAutoFocus";

interface TagRow { id: string; name: string; colour: string; used_by: number }

const CONTROL =
    "h-9 px-3 rounded-[4px] border border-[#E0E0E0] bg-white text-[13px] text-[#212121] outline-none focus:border-[#1976D2]";

export function Tags({ entity }: { entity: "candidate" | "job" }) {
    const { t } = useI18n();
    const { token, isLoading: authLoading } = useAuth();

    const [tags, setTags] = useState<TagRow[]>([]);
    const [colours, setColours] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [colour, setColour] = useState("");
    const [error, setError] = useState("");
    const [editing, setEditing] = useState<TagRow | null>(null);

    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/tags?entity=${entity}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const d = await res.json();
                setTags(d.tags || []);
                setColours(d.colours || []);
                if (!colour && d.colours?.length) setColour(d.colours[0]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, entity, colour]);

    useEffect(() => { if (!authLoading && token) void load(); }, [authLoading, token, load]);

    const add = async () => {
        if (!name.trim()) return;
        setError("");
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/tags?entity=${entity}`, {
            method: "POST", headers: auth, body: JSON.stringify({ name: name.trim(), colour }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) { setError(body?.detail || t("custom.saveFailed")); return; }
        setName("");
        void load();
    };

    const rename = async (tag: TagRow, newName: string, newColour: string) => {
        await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/tags/${tag.id}`, {
            method: "PATCH", headers: auth, body: JSON.stringify({ name: newName.trim(), colour: newColour }),
        });
        setEditing(null);
        void load();
    };

    const remove = async (tag: TagRow) => {
        await fetch(`${BACKEND_URL}/api/v1/enterprise/customization/tags/${tag.id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        void load();
    };

    return (
        <section className="bg-white border border-[#E0E0E0] rounded-[4px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E0E0E0]">
                <h2 className="text-[15px] font-medium text-[#212121]">{t("custom.tagsTitle")}</h2>
                <p className="text-[12.5px] text-[#757575] mt-0.5 leading-relaxed">{t("custom.tagsHint")}</p>
            </div>

            <div className="px-5 py-4 flex items-start gap-2 flex-wrap border-b border-[#EEEEEE]">
                <input className={cn(CONTROL, "w-[200px]")} value={name} maxLength={60}
                       placeholder={t("custom.tagPlaceholder")}
                       onChange={(e) => setName(e.target.value)}
                       onKeyDown={(e) => { if (e.key === "Enter") void add(); }} />
                <span className="flex items-center gap-1.5 h-9">
                    {colours.map((c) => (
                        <button key={c} type="button" onClick={() => setColour(c)} aria-label={c}
                                className={cn("w-5 h-5 rounded-full border-2 transition-transform",
                                    colour === c ? "border-[#212121] scale-110" : "border-transparent")}
                                style={{ background: c }} />
                    ))}
                </span>
                <Button size="sm" icon="plus" disabled={!name.trim()} onClick={() => void add()}>
                    {t("custom.addTag")}
                </Button>
                {error && <p className="w-full text-[12.5px] text-[#C62828]">{error}</p>}
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-[#1976D2]/30 border-t-[#1976D2] rounded-full animate-spin" />
                </div>
            ) : tags.length === 0 ? (
                <p className="px-5 py-8 text-[13px] text-[#757575] text-center">{t("custom.noTags")}</p>
            ) : (
                <ul className="divide-y divide-[#EEEEEE]">
                    {tags.map((tag) => (
                        <li key={tag.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#FAFAFA] transition-colors">
                            {editing?.id === tag.id ? (
                                <EditRow tag={tag} colours={colours} t={t}
                                         onCancel={() => setEditing(null)}
                                         onSave={(n, c) => void rename(tag, n, c)} />
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11.5px] font-medium uppercase tracking-[0.3px] text-white"
                                          style={{ background: tag.colour }}>
                                        {tag.name}
                                    </span>
                                    <span className="text-[12.5px] text-[#757575] tabular-nums">
                                        {/* "on 1 records" reads as a bug even though the number is right. */}
                                        {tag.used_by === 1 ? t("custom.usedByOne") : t("custom.usedBy", { count: tag.used_by })}
                                    </span>
                                    <span className="ml-auto flex items-center gap-0.5">
                                        <button type="button" onClick={() => setEditing(tag)} aria-label={t("custom.edit")}
                                                className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#1976D2] hover:bg-[#E3F2FD]">
                                            <Icon name="pencil" className="text-[18px]" />
                                        </button>
                                        <button type="button" onClick={() => void remove(tag)} aria-label={t("custom.delete")}
                                                className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#9E9E9E] hover:text-[#C62828] hover:bg-[#FFEBEE]">
                                            <Icon name="delete" className="text-[18px]" />
                                        </button>
                                    </span>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function EditRow({ tag, colours, t, onCancel, onSave }: {
    tag: TagRow; colours: string[];
    t: (k: string, v?: Record<string, string | number>) => string;
    onCancel: () => void; onSave: (name: string, colour: string) => void;
}) {
    const [n, setN] = useState(tag.name);
    const [c, setC] = useState(tag.colour);
    const tagNameRef = useAutoFocus<HTMLInputElement>();
    return (
        <>
            <input className={cn(CONTROL, "w-[180px]")} value={n} maxLength={60} ref={tagNameRef}
                   onChange={(e) => setN(e.target.value)} />
            <span className="flex items-center gap-1.5">
                {colours.map((x) => (
                    <button key={x} type="button" onClick={() => setC(x)} aria-label={x}
                            className={cn("w-5 h-5 rounded-full border-2", c === x ? "border-[#212121] scale-110" : "border-transparent")}
                            style={{ background: x }} />
                ))}
            </span>
            <span className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" onClick={onCancel}>{t("custom.cancel")}</Button>
                <Button size="sm" disabled={!n.trim()} onClick={() => onSave(n, c)}>{t("custom.save")}</Button>
            </span>
        </>
    );
}
