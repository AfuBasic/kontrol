import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function read(key: string): boolean {
    try {
        return window.localStorage.getItem(key) !== 'off';
    } catch {
        return true;
    }
}

type Options = {
    /** Where the on/off choice is remembered in this browser. */
    storageKey: string;
    /** The page props to ask for on each refresh; the rest of the page is left alone. */
    only: string[];
    intervalMs?: number;
};

/**
 * Keeps a page's figures fresh by re-asking for just some of its props every few seconds. A refresh is skipped while
 * the tab is hidden or the previous one is still running, so a slow server is never piled on, and one happens the
 * moment the tab comes back into view.
 */
export default function useLiveReload({ storageKey, only, intervalMs = 5000 }: Options) {
    const [live, setLive] = useState(() => read(storageKey));
    const inFlight = useRef(false);
    const wanted = only.join(',');

    useEffect(() => {
        if (!live) return;

        function refresh() {
            if (document.hidden || inFlight.current) return;
            inFlight.current = true;
            router.reload({
                only: wanted.split(','),
                onFinish: () => {
                    inFlight.current = false;
                },
            });
        }

        const timer = window.setInterval(refresh, intervalMs);
        document.addEventListener('visibilitychange', refresh);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [live, wanted, intervalMs]);

    function toggle() {
        const next = !live;
        setLive(next);
        try {
            window.localStorage.setItem(storageKey, next ? 'on' : 'off');
        } catch {
            // Remembering the choice is a convenience only.
        }
    }

    return { live, toggle };
}
