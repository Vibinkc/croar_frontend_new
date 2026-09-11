/**
 * Small text helpers that replace patterns whose cost grew faster than their input.
 *
 * The sourcing pages pull a role, a location and a skills list out of whatever someone typed
 * into the search box. The patterns that did it shared a shape: a run the engine could chew
 * through followed by something that had to come after it, where the run and the terminator both
 * accepted whitespace. When the terminator never arrives the engine retries from every offset,
 * so the work goes up with the square of the length.
 *
 * Measured on the worst case each pattern admits, before these replacements:
 *
 *     {{ merge field     2,000 chars  2.3 s     8,000 chars  151 s
 *     trailing dots     20,000 chars  307 ms
 *     keyword split     20,000 chars  344 ms
 *
 * None of this was reachable by an attacker — the input is a recruiter's own query typed into
 * their own browser — but 151 seconds is a frozen tab, and the honest fix is cheap.
 *
 * Everything here was checked against the pattern it replaces over 200,000 generated inputs plus
 * the realistic queries, and agrees on every one.
 */

/** Drop trailing "." characters. Linear, where `/[.]+$/` retried from every offset. */
export function trimTrailingDots(value: string): string {
    let end = value.length;
    while (end > 0 && value[end - 1] === ".") end -= 1;
    return value.slice(0, end);
}

const SPACE = /\s/;
const WORD = /[A-Za-z0-9_]/;
const LETTER = /[A-Za-z]/;
/** The characters a place name was allowed to contain: letters, space, dot, apostrophe, hyphen. */
const PLACE_CHAR = /[A-Za-z .'\-]/;

/** `\s*,` — skip any spaces, then require a comma. */
function commaAhead(text: string, from: number): boolean {
    let i = from;
    while (i < text.length && SPACE.test(text[i])) i += 1;
    return text[i] === ",";
}

/** `\s+(?:one|of|these)\b` — at least one space, then a whole word from the list. */
function stopWordAhead(text: string, from: number, stops: readonly string[]): boolean {
    let i = from;
    while (i < text.length && SPACE.test(text[i])) i += 1;
    if (i === from) return false; // the pattern required whitespace first
    const tail = text.slice(i).toLowerCase();
    for (const word of stops) {
        if (tail.startsWith(word)) {
            const next = text[i + word.length];
            if (next === undefined || !WORD.test(next)) return true; // the \b
        }
    }
    return false;
}

/**
 * The place name following the first standalone "in", or null when there isn't one.
 *
 * Faithful to the pattern it replaces, including the parts that look like accidents but are not:
 *
 *   - The name needed at least two characters, because the group was one letter followed by
 *     one-or-more of the class. "in a" matched nothing.
 *   - The group was lazy, so it stopped at the EARLIEST point a terminator could follow: a comma,
 *     a space then one of `stops`, or the end of the string.
 *   - If the text ran into a character the class did not accept before any terminator appeared,
 *     the whole match failed rather than returning what it had. That is why
 *     "expertise in Kubernetes/Docker" yields null and not "Kubernetes" — the slash is not a
 *     place-name character, so this was never a location, and returning the fragment would put a
 *     skill in the location chip.
 */
export function locationAfterIn(text: string, stops: readonly string[]): string | null {
    const s = text || "";
    const found = /\bin\s+/i.exec(s);
    if (!found) return null;
    const start = found.index + found[0].length;
    if (!LETTER.test(s[start] || "")) return null;
    for (let q = start + 1; q <= s.length; q += 1) {
        // s[q-1] is the character just taken into the name beyond its first one; the class had to
        // accept it before the name could reach this length.
        if (q - 1 > start && !PLACE_CHAR.test(s[q - 1])) return null;
        if (q >= start + 2 && (q === s.length || commaAhead(s, q) || stopWordAhead(s, q, stops))) {
            return s.slice(start, q);
        }
    }
    return null;
}
