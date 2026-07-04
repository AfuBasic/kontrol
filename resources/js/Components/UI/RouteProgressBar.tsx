import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import { isRouteChangeVisit } from '@/Lib/inertia';

export default function RouteProgressBar() {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const activeRouteChangesRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const clearProgressInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const startProgress = () => {
            clearProgressInterval();
            setProgress(0);
            setVisible(true);

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        return 90;
                    }

                    return prev + (100 - prev) * 0.1;
                });
            }, 200);
        };

        const finishProgress = () => {
            clearProgressInterval();
            setProgress(100);

            setTimeout(() => {
                setVisible(false);
                setTimeout(() => setProgress(0), 400);
            }, 400);
        };

        const start = (event: Parameters<typeof isRouteChangeVisit>[0]) => {
            if (!isRouteChangeVisit(event)) {
                return;
            }

            activeRouteChangesRef.current += 1;

            if (activeRouteChangesRef.current === 1) {
                startProgress();
            }
        };

        const end = (event: Parameters<typeof isRouteChangeVisit>[0]) => {
            if (!isRouteChangeVisit(event)) {
                return;
            }

            activeRouteChangesRef.current = Math.max(0, activeRouteChangesRef.current - 1);

            if (activeRouteChangesRef.current === 0) {
                finishProgress();
            }
        };

        const handleError = () => {
            if (activeRouteChangesRef.current === 0) {
                return;
            }

            activeRouteChangesRef.current = 0;
            finishProgress();
        };

        const startListener = router.on('start', start);
        const finishListener = router.on('finish', end);
        const errorListener = router.on('error', handleError);

        return () => {
            clearProgressInterval();
            activeRouteChangesRef.current = 0;
            startListener();
            finishListener();
            errorListener();
        };
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-slate-100"
                    >
                        <motion.div
                            className="h-full bg-indigo-600"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{
                                duration: progress === 100 ? 0.3 : 0.6,
                                ease: 'easeOut',
                            }}
                        />

                        <div
                            className="absolute top-0 right-0 h-full w-8 bg-indigo-400 blur-sm"
                            style={{ transform: `translateX(${100 - progress}%)` }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/15 backdrop-blur-[2px]"
                    >
                        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/95 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.15)] ring-1 ring-black/5 backdrop-blur-md">
                            <div className="relative">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase animate-pulse">
                                Loading
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}