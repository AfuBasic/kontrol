import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function RouteProgressBar() {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        const start = () => {
            setProgress(0);
            setVisible(true);
            
            // Artificial progress simulation
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return 90;
                    return prev + (100 - prev) * 0.1;
                });
            }, 200);
        };

        const end = () => {
            if (interval) clearInterval(interval);
            setProgress(100);
            
            // Small delay before hiding to show 100% completion
            setTimeout(() => {
                setVisible(false);
                setTimeout(() => setProgress(0), 400); // Reset for next time
            }, 400);
        };

        const startListener = router.on('start', start);
        const finishListener = router.on('finish', end);
        const errorListener = router.on('error', end);

        return () => {
            if (interval) clearInterval(interval);
            startListener();
            finishListener();
            errorListener();
        };
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Top progress bar */}
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
                                ease: "easeOut"
                            }}
                        />
                        
                        {/* Glow effect */}
                        <div 
                            className="absolute top-0 right-0 h-full w-8 bg-indigo-400 blur-sm"
                            style={{ transform: `translateX(${100 - progress}%)` }}
                        />
                    </motion.div>

                    {/* Premium glassmorphic loading overlay */}
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
                            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase animate-pulse">Loading</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
