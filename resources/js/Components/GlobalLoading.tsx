import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { isRouteChangeVisit } from '@/Lib/inertia';

export default function GlobalLoading() {
    const [loading, setLoading] = useState(false);
    const activeRouteChangesRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearPendingTimeout = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const start = (event: Parameters<typeof isRouteChangeVisit>[0]) => {
            if (!isRouteChangeVisit(event)) {
                return;
            }

            activeRouteChangesRef.current += 1;

            if (activeRouteChangesRef.current !== 1) {
                return;
            }

            clearPendingTimeout();
            timeoutRef.current = setTimeout(() => {
                setLoading(true);
            }, 150);
        };

        const end = (event: Parameters<typeof isRouteChangeVisit>[0]) => {
            if (!isRouteChangeVisit(event)) {
                return;
            }

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
            clearPendingTimeout();
            setLoading(false);
        };

        const startListener = router.on('start', start);
        const finishListener = router.on('finish', end);
        const errorListener = router.on('error', handleError);

        return () => {
            clearPendingTimeout();
            activeRouteChangesRef.current = 0;
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