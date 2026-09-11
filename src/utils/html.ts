/**
 * Plain text out of rich text, without the quadratic regex.
 *
 * The pattern this replaces, `/<[^>]*>/g`, is polynomial rather than linear. For input holding
 * many "<" with no closing ">", the engine restarts its scan from every "<", so one long run
 * costs O(n^2) steps. The inputs here are first-party — a rich-text job description someone
 * typed, an AI reply — so this was never an attack surface, but the cost is real on a long
 * paste and walking the string once is no harder to read.
 *
 * It is faithful to the regexes it replaces, not merely close:
 *
 *   - `[^>]*` is greedy but cannot cross a ">", so it always stops at the FIRST ">" after the
 *     "<". `indexOf(">", lt + 1)` finds exactly that character.
 *   - An unclosed "<" has no match, so the rest of the string survives verbatim. Same here.
 *   - `requireContent` mirrors `/<[^>]+>/` instead of `/<[^>]*>/`: with it set, the empty tag
 *     "<>" is not a tag and is left in place.
 */
export function stripTags(input: string | null | undefined, replacement = "", requireContent = false): string {
    const s = input ?? "";
    let out = "";
    let i = 0;
    while (i < s.length) {
        const lt = s.indexOf("<", i);
        if (lt === -1) {
            out += s.slice(i);
            break;
        }
        const gt = s.indexOf(">", lt + 1);
        if (gt === -1) {
            // Nothing closes this "<", so neither pattern matches from here on. The tail is
            // literal text, exactly as the regex left it.
            out += s.slice(i);
            break;
        }
        if (requireContent && gt === lt + 1) {
            // "<>" — `[^>]+` needs at least one character, so this is not a tag. Keep the "<"
            // and resume just after it, which is where the regex engine would try next.
            out += s.slice(i, lt + 1);
            i = lt + 1;
            continue;
        }
        out += s.slice(i, lt) + replacement;
        i = gt + 1;
    }
    return out;
}

/**
 * The handful of HTML entities the rich-text editor emits, turned back into spaces.
 *
 * Kept beside stripTags because every caller ran the two together, and the pair is what
 * actually means "give me something I can search or measure".
 */
export function stripTagsAndEntities(
    input: string | null | undefined,
    replacement = " ",
    requireContent = false,
): string {
    return stripTags(input, replacement, requireContent)
        .replace(/&nbsp;|&amp;|&lt;|&gt;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
