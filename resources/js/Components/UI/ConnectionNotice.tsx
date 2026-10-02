import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, RefreshCw, WifiOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { isBackgroundVisit, isPartialVisit } from '@/Lib/inertia';
import type { InertiaVisitEvent } from '@/Lib/inertia';

type NoticeKind = 'slow' | 'failed' | 'busy';

interface LastVisit {
    url: string;
    method: string;
    data: Record<string, unknown>;
    preserveScroll: boolean;
    preserveState: boolean;
}

/** How long a page may load before we say so. Quiet before this, honest after. */
const SLOW_AFTER_MS = 8_000;

/** Gateway-style answers that mean "the server is struggling", not "your request was wrong". */
const BUSY_STATUSES = [408, 502, 503, 504];

/**
 * Tells people what is happening when the network or server is struggling, instead of leaving a stalled
 * progress bar or a raw error page.
 *
 * Retry is offered only for page loads (GET). A failed save is never retried for you: the first attempt
 * may have reached the server, and sending it again could do the thing twice.
 */
export default function ConnectionNotice() {
    const [notice, setNotice] = useState<{ kind: NoticeKind; canRetry: boolean } | null>(null);
    const { isOnline } = useNetworkQuality();
    const lastVisit = useRef<LastVisit | null>(null);
    const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearSlowTimer = () => {
            if (slowTimer.current) {
                clearTimeout(slowTimer.current);
                slowTimer.current = null;
            }
        };

        const offStart = router.on('start', (event) => {
            const visit = event.detail.visit as unknown as InertiaVisitEvent['detail']['visit'] & {
                data?: Record<string, unknown>;
                preserveScroll?: boolean;
                preserveState?: boolean;
            };

            // Polling, prefetching and partial reloads are not something the person is waiting on.
            if (isBackgroundVisit(event as unknown as InertiaVisitEvent) || isPartialVisit(visit)) {
                return;
            }

            lastVisit.current = {
                url: visit.url instanceof URL ? visit.url.href : String(visit.url ?? window.location.href),
                method: String(visit.method ?? 'get').toLowerCase(),
                data: visit.data ?? {},
                preserveScroll: Boolean(visit.preserveScroll),
                preserveState: Boolean(visit.preserveState),
            };

            setNotice(null);
            clearSlowTimer();
            slowTimer.current = setTimeout(() => setNotice({ kind: 'slow', canRetry: false }), SLOW_AFTER_MS);
        });

        const offFinish = router.on('finish', () => {
            clearSlowTimer();
            // A slow-loading hint goes away on its own; a failure stays until dismissed or retried.
            setNotice((current) => (current?.kind === 'slow' ? null : current));
        });

        const isRead = () => (lastVisit.current?.method ?? 'get') === 'get';

        const offException = router.on('exception', (event) => {
            clearSlowTimer();
            event.preventDefault();
            console.warn('Visit failed before the server answered:', event.detail.exception);
            setNotice({ kind: 'failed', canRetry: isRead() });
        });

        const offInvalid = router.on('invalid', (event) => {
            if (!BUSY_STATUSES.includes(event.detail.response.status)) {
                return;
            }

            clearSlowTimer();
            event.preventDefault();
            setNotice({ kind: 'busy', canRetry: isRead() });
        });

        return () => {
            clearSlowTimer();
            offStart();
            offFinish();
            offException();
            offInvalid();
        };
    }, []);

    const retry = () => {
        const visit = lastVisit.current;
        setNotice(null);

        if (!visit) {
            window.location.reload();

            return;
        }

        router.visit(visit.url, { method: 'get', preserveScroll: visit.preserveScroll, preserveState: visit.preserveState });
    };

    const message = (() => {
        if (!notice) return '';
        if (notice.kind === 'slow') return 'Still loading. Your connection looks slow.';
        if (!notice.canRetry) return "We couldn't confirm that went through. Please check before trying again.";
        if (notice.kind === 'busy') return 'Kontrol is busy right now. Try again in a moment.';

        return isOnline ? "Couldn't reach Kontrol. Check your connection." : "You're offline. This page needs a connection.";
    })();

    return (
        <AnimatePresence>
            {notice && (
                <motion.div
                    key={notice.kind}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    role={notice.kind === 'slow' ? 'status' : 'alert'}
                    aria-live={notice.kind === 'slow' ? 'polite' : 'assertive'}
                    className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[90] flex justify-center px-4"
                >
                    <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
                        {notice.kind === 'slow' ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-300" />
                        ) : (
                            <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
                        )}
                        <p className="min-w-0 flex-1 text-[13px] leading-snug font-semibold">{message}</p>
                        {notice.canRetry && (
                            <button type="button" onClick={retry} className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-sky-300 active:opacity-70">
                                <RefreshCw className="h-3.5 w-3.5" /> Retry
                            </button>
                        )}
                        {notice.kind !== 'slow' && (
                            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="shrink-0 text-slate-400 active:opacity-70">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
