import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Table, MessageSquare, ShieldCheck, Bell, CreditCard } from 'lucide-react';

interface Props {
    onComplete: () => void;
    skipToKontrol?: boolean;
}

export default function BrandPreloader({ onComplete, skipToKontrol = false }: Props) {
    const [step, setStep] = useState<number>(skipToKontrol ? 3 : 0);

    useEffect(() => {
        if (skipToKontrol) {
            // Immediately start on Kontrol/final scene and exit after 2s
            const t = setTimeout(() => onComplete(), 2000);
            return () => clearTimeout(t);
        }

        // Step progression timers
        const t1 = setTimeout(() => setStep(1), 2000); // 2.0s of Paper
        const t2 = setTimeout(() => setStep(2), 4000); // 2.0s of Spreadsheet
        const t3 = setTimeout(() => setStep(3), 6000); // 2.0s of WhatsApp
        const t4 = setTimeout(() => setStep(4), 8000); // 2.0s of Kontrol/Final
        const t5 = setTimeout(() => onComplete(), 10000); // Lift curtain after 10.0s total

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
        };
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
                        scale: step === 3 ? [1, 1.3, 1.1] : 1,
                        opacity: step === 3 ? [0.05, 0.15, 0.1] : 0.05,
                    }}
                    transition={{ duration: 2 }}
                    className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 blur-[120px]"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
                <AnimatePresence mode="wait">
                    {/* CHAPTER ONE: PAPER RECORDS */}
                    {step === 0 && (
                        <motion.div
                            key="paper"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col items-center"
                        >
                            <span className="mb-6 inline-block rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                1996
                            </span>

                            {/* Handcrafted drawing of notebook */}
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-xl">
                                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
                                    <FileText className="h-10 w-10 text-slate-300" />
                                </motion.div>
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="absolute top-[55%] left-1/2 h-[1px] w-6 -translate-x-1/2 bg-slate-400"
                                />
                            </div>

                            <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-white">Paper Records</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-400">Every estate started somewhere.</p>
                        </motion.div>
                    )}

                    {/* CHAPTER TWO: SPREADSHEETS */}
                    {step === 1 && (
                        <motion.div
                            key="spreadsheet"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex w-full flex-col items-center"
                        >
                            <span className="mb-6 inline-block rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                2005
                            </span>

                            {/* Stylized Spreadsheet */}
                            <div className="flex h-20 w-32 flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-3 shadow-xl">
                                <div className="grid grid-cols-3 gap-1">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0.2, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: i * 0.1, duration: 0.4 }}
                                            className="h-2 rounded bg-slate-700/60"
                                        />
                                    ))}
                                </div>
                                <div className="mt-1 grid grid-cols-4 gap-1">
                                    {[...Array(8)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0.2, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                                            className="h-2 rounded bg-slate-600/40"
                                        />
                                    ))}
                                </div>
                            </div>

                            <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-white">Spreadsheets</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-400">Growing estates needed better organisation.</p>
                        </motion.div>
                    )}

                    {/* CHAPTER THREE: WHATSAPP GROUPS */}
                    {step === 2 && (
                        <motion.div
                            key="whatsapp"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex w-full flex-col items-center"
                        >
                            <span className="mb-6 inline-block animate-pulse rounded-full border border-emerald-900/50 bg-emerald-950/45 px-3 py-1 text-xs font-bold tracking-widest text-emerald-400 uppercase">
                                2015
                            </span>

                            {/* Overlapping Whatsapp bubbles */}
                            <div className="relative h-24 w-full max-w-[280px]">
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, x: -20 }}
                                    animate={{ scale: 1, opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute top-0 left-2 max-w-[180px] rounded-2xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-left text-xs"
                                >
                                    Visitor is here at gate
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, x: 20 }}
                                    animate={{ scale: 1, opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4, duration: 0.4 }}
                                    className="absolute top-8 right-2 max-w-[180px] rounded-2xl border border-emerald-800 bg-emerald-950 px-3 py-1.5 text-left text-xs"
                                >
                                    Who approved this visitor?
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.4 }}
                                    className="absolute top-16 left-6 max-w-[180px] rounded-2xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-left text-xs"
                                >
                                    Has payment been confirmed?
                                </motion.div>
                            </div>

                            <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-white">WhatsApp Groups</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-400">Communication improved. Management didn't.</p>
                        </motion.div>
                    )}

                    {/* CHAPTER FOUR: KONTROL */}
                    {step >= 3 && (
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
                                {step === 3 && (
                                    <>
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
                                    </>
                                )}
                            </div>

                            <h2 className="mt-8 text-3xl font-extrabold tracking-widest text-white uppercase">Kontrol</h2>
                            <p className="mt-2 text-sm font-bold tracking-wider text-blue-400">The Operating System for Modern Estates.</p>


                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
