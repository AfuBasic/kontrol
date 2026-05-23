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
            )}
        </AnimatePresence>
    );
}
