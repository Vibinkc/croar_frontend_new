"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Entry {
    data: unknown;
    ts: number;
}

// Module-level caches persist across client-side navigation (component unmount/remount),
// so revisiting a tab can render its previous data INSTANTLY instead of refetching.
const memCache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const SESSION_PREFIX = "cf:";
const DEFAULT_STALE_MS = 30_000;

function readSession(key: string): Entry | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const raw = window.sessionStorage.getItem(SESSION_PREFIX + key);
        return raw ? (JSON.parse(raw) as Entry) : undefined;
    } catch {
        return undefined;
    }
}

function writeSession(key: string, entry: Entry): void {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(entry));
    } catch {
        /* quota exceeded / storage disabled — the in-memory cache still works */
    }
}

function getCached(key: string): Entry | undefined {
    return memCache.get(key) ?? readSession(key);
}

/** Drop all cached entries (e.g. on logout). */
export function clearFetchCache(): void {
    memCache.clear();
    if (typeof window === "undefined") return;
    try {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
            const k = window.sessionStorage.key(i);
            if (k && k.startsWith(SESSION_PREFIX)) window.sessionStorage.removeItem(k);
        }
    } catch {
        /* ignore */
    }
}

export interface UseCachedFetchOptions {
    /** Bearer token; if provided, an `Authorization` header is added automatically. */
    token?: string | null;
    /** Extra fetch init (merged; its headers are merged with the auth header). */
    init?: RequestInit;
    /** Within this window, cached data is served WITHOUT a background refetch. */
    staleMs?: number;
    /** Set false to skip fetching (e.g. while auth is still loading). */
    enabled?: boolean;
}

export interface UseCachedFetchResult<T> {
    data: T | undefined;
    error: Error | null;
    /** True only on the first load when there is no cached data to show. */
    isLoading: boolean;
    /** True while a background revalidation is in flight. */
    isValidating: boolean;
    /** Force a fresh fetch and update the cache (e.g. after a mutation). */
    mutate: () => Promise<void>;
}

/**
 * Cached data fetcher with stale-while-revalidate semantics.
 *
 * On revisit, previously-fetched data is returned INSTANTLY from the in-memory /
 * sessionStorage cache (no spinner) while a fresh copy is fetched in the background and
 * swapped in. Concurrent requests for the same URL are de-duplicated.
 *
 * Pass `url = null` to skip (e.g. before the auth token is ready).
 */
export function useCachedFetch<T = unknown>(
    url: string | null,
    options: UseCachedFetchOptions = {},
): UseCachedFetchResult<T> {
    const { token, init, staleMs = DEFAULT_STALE_MS, enabled = true } = options;
    const key = url ?? "";

    // Keep the latest init/token without re-triggering the effect on every render.
    const initRef = useRef<RequestInit | undefined>(init);
    const tokenRef = useRef<string | null | undefined>(token);
    initRef.current = init;
    tokenRef.current = token;

    const [data, setData] = useState<T | undefined>(() => getCached(key)?.data as T | undefined);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(() => !getCached(key));
    const [isValidating, setIsValidating] = useState(false);
    const mounted = useRef(true);

    const run = useCallback(
        async (force: boolean): Promise<void> => {
            if (!url || !enabled) {
                if (mounted.current) setIsLoading(false);
                return;
            }

            const cached = getCached(key);
            if (cached) {
                memCache.set(key, cached);
                if (mounted.current) {
                    setData(cached.data as T);
                    setIsLoading(false);
                }
                const fresh = Date.now() - cached.ts < staleMs;
                if (fresh && !force) return; // serve cache, skip the background refetch
            } else if (mounted.current) {
                setIsLoading(true);
            }

            if (mounted.current) setIsValidating(true);

            let promise = inflight.get(key);
            if (!promise) {
                const headers: Record<string, string> = {
                    ...(initRef.current?.headers as Record<string, string> | undefined),
                };
                if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;
                promise = fetch(url, { ...initRef.current, headers }).then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                });
                inflight.set(key, promise);
                void promise.finally(() => inflight.delete(key));
            }

            try {
                const json = await promise;
                const entry: Entry = { data: json, ts: Date.now() };
                memCache.set(key, entry);
                writeSession(key, entry);
                if (mounted.current) {
                    setData(json as T);
                    setError(null);
                }
            } catch (e) {
                if (mounted.current) setError(e as Error);
            } finally {
                if (mounted.current) {
                    setIsLoading(false);
                    setIsValidating(false);
                }
            }
        },
        [url, key, enabled, staleMs],
    );

    useEffect(() => {
        mounted.current = true;
        void run(false);
        return () => {
            mounted.current = false;
        };
    }, [run]);

    const mutate = useCallback(() => run(true), [run]);

    return { data, error, isLoading, isValidating, mutate };
}
