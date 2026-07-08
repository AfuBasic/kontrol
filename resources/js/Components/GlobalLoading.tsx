import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { isBackgroundVisit, isPartialVisit } from '@/Lib/inertia';
import type { InertiaVisitEvent } from '@/Lib/inertia';

export default function GlobalLoading() {
    const [loading, setLoading] = useState(false);
    const activeRouteChangesRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /**
     * Track which visit objects we started showing the loader for.
     * We check this set on `finish` instead of re-running the full
     * isRouteChangeVisit() check, because by the time `finish` fires
     * window.location has already updated to the destination URL, making
     * the pathname-equality guard always return false (same path = no change).
     */
    const pendingVisitsRef = useRef<WeakSet<object>>(new WeakSet());

    useEffect(() => {
        const clearPendingTimeout = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const start = (event: InertiaVisitEvent) => {
            const visit = event.detail.visit;

            // Ignore background (prefetch/silent) and partial (only/except/deferred) visits
            if (isBackgroundVisit(event) || isPartialVisit(visit)) {
                return;
            }

            if (visit.showProgress === false || visit.preserveUrl) {
                return;
            }

            const method = (visit.method ?? 'get').toLowerCase();
            if (method !== 'get') {
                return;
            }

            // Mark this visit object so finish() knows to decrement
            pendingVisitsRef.current.add(visit as object);
            activeRouteChangesRef.current += 1;

            if (activeRouteChangesRef.current !== 1) {
                return;
            }

            clearPendingTimeout();
            timeoutRef.current = setTimeout(() => {
                setLoading(true);
            }, 150);
        };

        const end = (event: InertiaVisitEvent) => {
            const visit = event.detail.visit;

            // Only decrement if we started tracking this visit on `start`
            if (!pendingVisitsRef.current.has(visit as object)) {
                return;
            }

            pendingVisitsRef.current.delete(visit as object);
            activeRouteChangesRef.current = Math.max(0, activeRouteChangesRef.current - 1);

            if (activeRouteChangesRef.current > 0) {
                return;
            }

            clearPendingTimeout();
            setLoading(false);
        };

        const handleError = () => {
            if (activeRouteChangesRef.current === 0) {
                return;
            }

            activeRouteChangesRef.current = 0;
            pendingVisitsRef.current = new WeakSet();
            clearPendingTimeout();
            setLoading(false);
        };

        const startListener = router.on('start', start);
        const finishListener = router.on('finish', end);
        const errorListener = router.on('error', handleError);

        return () => {
            clearPendingTimeout();
            activeRouteChangesRef.current = 0;
            pendingVisitsRef.current = new WeakSet();
            startListener();
            finishListener();
            errorListener();
        };
    }, []);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md"
                >
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/20"></div>
                        <Loader2 className="relative h-12 w-12 animate-spin text-primary-500" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}