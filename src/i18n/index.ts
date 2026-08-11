import { Locale, DEFAULT_LOCALE } from "./config";
import en from "./messages/en.json";
import ko from "./messages/ko.json";
import ja from "./messages/ja.json";

type Messages = Record<string, unknown>;

const MESSAGES: Record<Locale, Messages> = { en, ko, ja };

function lookup(msgs: Messages | undefined, key: string): unknown {
    if (!msgs) return undefined;
    return key.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
        return undefined;
    }, msgs);
}

/**
 * Resolve a dot-path key (e.g. "sequences.title") for a locale, with {var}
 * interpolation. Falls back to English, then to the raw key if nothing is found —
 * so a missing translation degrades gracefully instead of blanking the UI.
 */
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
    let val = lookup(MESSAGES[locale], key);
    if (typeof val !== "string") val = lookup(MESSAGES[DEFAULT_LOCALE], key);
    if (typeof val !== "string") return key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            val = (val as string).replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
    }
    return val as string;
}

export { MESSAGES };
