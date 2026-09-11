"use client";

import { useCallback } from "react";

/**
 * Focus an element when it appears — exactly what the `autoFocus` attribute did.
 *
 * The attribute is worth replacing rather than simply deleting. On a page that loads with a
 * focused field, `autoFocus` yanks a screen reader out of its reading position and scrolls the
 * viewport before the user has asked for anything, which is why the accessibility rule objects
 * to it. But in a dialog the user just opened by clicking "New group", focusing the first field
 * is the right behaviour, and removing it would make every one of these forms worse.
 *
 * This is a **callback ref**, not a ref object plus a mount effect, and the difference is the
 * whole point. Nearly every caller renders its input conditionally — `{creating && <input/>}`,
 * `{editing ? <input/> : …}` — inside a component that mounted long before. A mount effect runs
 * once, while the input does not exist, sees a null ref, and never fires again, so the field
 * would silently stop being focused. A callback ref runs when the node itself attaches, which
 * is the same moment React applies `autoFocus`.
 *
 * `useCallback` keeps the identity stable across renders, so React does not detach and
 * reattach the ref (and refocus the field) on every keystroke.
 *
 * Usage:
 *
 *     const nameRef = useAutoFocus<HTMLInputElement>();
 *     <input ref={nameRef} />
 */
export function useAutoFocus<T extends HTMLElement>(enabled = true) {
    return useCallback(
        (node: T | null) => {
            // Called with the node on attach and with null on detach; only the former matters.
            if (node && enabled) node.focus();
        },
        [enabled],
    );
}

export default useAutoFocus;
