import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function GlobalLoading() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const start = () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                setLoading(true);
            }, 150);
        };

        const end = () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            setLoading(false);
        };

        const startListener = router.on('start', start);
        const finishListener = router.on('finish', end);
        const errorListener = router.on('error', end);

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
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
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 p-6 backdrop-blur-sm"
                >
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary-100 opacity-20"></div>
                        <Loader2 className="relative h-12 w-12 animate-spin text-primary-600" />
                    </div>
                    <p className="mt-4 text-sm font-semibold tracking-tight text-slate-600">Loading...</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
