import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface Props {
    onComplete: () => void;
    skipToKontrol?: boolean;
}

export default function BrandPreloader({ onComplete, skipToKontrol = false }: Props) {
    useEffect(() => {
        const duration = skipToKontrol ? 1200 : 2000;
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [onComplete, skipToKontrol]);

    return (
        <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white select-none"
        >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-950">
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1.1],
                        opacity: [0.05, 0.15, 0.1],
                    }}
                    transition={{ duration: 2 }}
                    className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 blur-[120px]"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="kontrol"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center"
                    >
                            <span className="mb-6 inline-block rounded-full border border-blue-900 bg-blue-950/70 px-3 py-1 text-xs font-bold tracking-widest text-blue-400 uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                2026
                            </span>

                            {/* Connected glow Kontrol Logo outline */}
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-blue-500/35 bg-blue-600/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                <motion.div
                                    initial={{ scale: 0.4, rotate: -45, opacity: 0 }}
                                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                    transition={{ duration: 0.8, type: 'spring' }}
                                >
                                    <ShieldCheck className="h-12 w-12 text-blue-400" />
                                </motion.div>

                                {/* Animated Orbiting Dots / Integrations */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                                    className="absolute inset-0 scale-150 rounded-full border border-dashed border-blue-500/10"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                                    className="absolute inset-0 scale-[1.8] rounded-full border border-dashed border-indigo-500/10"
                                />
                            </div>

                            <h2 className="mt-8 text-3xl font-extrabold tracking-widest text-white uppercase">Kontrol</h2>
                            <p className="mt-2 text-sm font-bold tracking-wider text-blue-400">The Operating System for Modern Estates.</p>
                        </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
