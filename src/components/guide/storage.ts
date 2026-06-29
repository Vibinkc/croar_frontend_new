"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe localStorage state. Returns the initial value on the server and on the
 * first client render, then hydrates from localStorage in an effect (so it never
 * causes a hydration mismatch). The third tuple item reports when hydration is done.
 */
export function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(key);
            if (raw != null) setValue(JSON.parse(raw) as T);
        } catch {
            /* ignore corrupt/unavailable storage */
        }
        setHydrated(true);
        // key is stable per call-site; we intentionally read it once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const set = useCallback(
        (next: T | ((prev: T) => T)) => {
            setValue((prev) => {
                const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
                try {
                    window.localStorage.setItem(key, JSON.stringify(resolved));
                } catch {
                    /* ignore */
                }
                return resolved;
            });
        },
        [key]
    );

    return [value, set, hydrated] as const;
}
