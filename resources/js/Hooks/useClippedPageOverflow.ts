import { useEffect } from 'react';

/**
 * The global stylesheet gives both <html> and <body> `overflow-x: hidden`. When both do, the browser turns <body> into
 * its own scroll box, and `position: sticky` sticks to the nearest scroll box, which here never scrolls (the window
 * does). So a sticky element, like the Zeus sidebar, silently stops sticking.
 *
 * `overflow-x: clip` still stops sideways scrolling but creates no scroll box. This applies it while a page that needs
 * sticky elements is on screen, and puts the original value back afterwards. It is not done globally because many
 * other pages carry `sticky` classes that have never actually stuck, and they should not change by surprise.
 *
 * Two layouts overlap for a moment during a page transition, so users are counted and the original value comes back
 * only when the last one leaves.
 */
let holders = 0;
let restore: (() => void) | null = null;

export function acquirePageClip(html: HTMLElement, body: HTMLElement): () => void {
    holders += 1;

    if (holders === 1) {
        const before = { html: html.style.overflowX, body: body.style.overflowX };
        html.style.overflowX = 'clip';
        body.style.overflowX = 'clip';
        restore = () => {
            html.style.overflowX = before.html;
            body.style.overflowX = before.body;
        };
    }

    let released = false;
    return () => {
        if (released) return;
        released = true;
        holders -= 1;

        if (holders === 0) {
            restore?.();
            restore = null;
        }
    };
}

export default function useClippedPageOverflow(): void {
    useEffect(() => acquirePageClip(document.documentElement, document.body), []);
}
