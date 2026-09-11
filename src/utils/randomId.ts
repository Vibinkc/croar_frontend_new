/**
 * Random identifiers for client-side things: React list keys, draft question ids, chat thread
 * handles.
 *
 * None of these ids guard anything, but `Math.random()` is a predictable PRNG and static
 * analysis cannot tell "id for a React key" from "id that protects something" — nor should it
 * have to, since the platform CSPRNG costs nothing at these sizes. So every id here comes from
 * `crypto.getRandomValues()`.
 *
 * `crypto.randomUUID()` is deliberately not the only path: it requires a secure context and is
 * absent on plain-HTTP origins, which is exactly why the call sites used to carry a
 * `Math.random()` fallback. `crypto.getRandomValues()` carries no such restriction, so it
 * serves that same fallback role without the weak generator.
 */

/** Monotonic tail for the last-resort path, so ids stay unique within a page even there. */
let sequence = 0;

/** Fill `bytes` from the platform CSPRNG. Returns false when no Web Crypto is reachable. */
function fillFromCrypto(bytes: Uint8Array): boolean {
    const webcrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    if (webcrypto && typeof webcrypto.getRandomValues === "function") {
        webcrypto.getRandomValues(bytes);
        return true;
    }
    return false;
}

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * A token of `length` characters drawn from [0-9a-z] — the same shape the old
 * `Math.random().toString(36).slice(2)` produced, so call sites keep their id format.
 *
 * The modulo below biases the last six letters very slightly (256 is not a multiple of 36).
 * That is irrelevant for uniqueness at these lengths and these ids are not secrets; rejection
 * sampling would only add a loop nothing here benefits from.
 */
export function randomToken(length = 11): string {
    const bytes = new Uint8Array(length);
    if (!fillFromCrypto(bytes)) {
        // No Web Crypto at all (ancient browser, or a stripped SSR global). Fall back to a
        // timestamp plus a counter rather than a weak PRNG: still unique per call, still
        // unpredictable enough for a DOM key, and not a random-number generator at all.
        sequence += 1;
        const stamp = `${Date.now().toString(36)}${sequence.toString(36)}`;
        // Honour the requested length either way: the uniqueness lives in the tail, so padding
        // the front is harmless and keeps every id the width the caller asked for.
        return stamp.length >= length ? stamp.slice(-length) : stamp.padStart(length, "0");
    }
    let out = "";
    for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
    return out;
}

/**
 * A UUID where the browser offers one, otherwise a `randomToken()`. Mirrors what the call
 * sites previously expressed as `crypto.randomUUID?.() ?? Math.random()...`, minus the throw
 * when `crypto` itself is undefined.
 */
export function randomId(): string {
    const webcrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    if (webcrypto && typeof webcrypto.randomUUID === "function") {
        return webcrypto.randomUUID();
    }
    return randomToken();
}
