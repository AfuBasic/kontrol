import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Plus, Users, Clock, ArrowRight, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface Props {
    expectedToday: number;
    lastActivity?: string;
    onAction?: () => void;
    canGenerate?: boolean;
}

function CountUpNumber({ value }: { value: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) {
            setCount(end);
            return;
        }

        const duration = 800; // 0.8 seconds
        const incrementTime = Math.max(Math.floor(duration / (end || 1)), 20);

        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start >= end) {
                clearInterval(timer);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return <>{count}</>;
}

export default function CommandCenter({ expectedToday, lastActivity, onAction, canGenerate = true }: Props) {
    const hasData = expectedToday > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-[38px] bg-slate-950 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]"
        >
            {/* Advanced Layering & Texture */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {/* Mesh Gradients */}
                <div className="absolute -top-[20%] -right-[10%] h-[80%] w-[80%] animate-pulse rounded-full bg-indigo-600/30 blur-[100px]" />
                <div className="absolute -bottom-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-blue-500/20 blur-[80px]" />

                {/* Grain Texture Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                    }}
                />

                {/* Subtle Grid / Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Glass Glow */}
                <div className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="relative z-10">
                <div className="mb-10 flex items-start justify-between">
                    <div className="max-w-[70%]">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Command Center</span>
                        </div>

                        <h2 className="text-3xl leading-[1.1] font-extrabold tracking-tight text-white">
                            {!hasData ? (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    You're <span className="text-white/40 italic">all clear</span> for now
                                </motion.span>
                            ) : (
                                <>
                                    {expectedToday} {expectedToday === 1 ? 'visitor' : 'visitors'} <span className="text-white/40">scheduled</span>
                                </>
                            )}
                        </h2>

                        <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white/30">
                            <Activity className="h-3 w-3" />
                            {lastActivity ? `Last activity: ${lastActivity}` : 'Gate is currently quiet'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 shadow-inner ring-1 ring-white/10 backdrop-blur-md">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className={`mb-10 grid grid-cols-1 ${canGenerate ? 'sm:grid-cols-2' : ''} items-stretch gap-4`}>
                    {/* Expected Today Card with gradient & glowing effect */}
                    <div className="relative flex flex-col justify-center overflow-hidden rounded-[24px] bg-linear-to-br from-indigo-500/10 via-indigo-600/5 to-transparent p-5 ring-1 ring-indigo-500/20 backdrop-blur-md transition-all hover:ring-indigo-500/40">
                        {/* Corner Glow */}
                        <div className="pointer-events-none absolute top-0 right-0 h-16 w-16 rounded-full bg-indigo-500/25 blur-xl" />

                        <p className="mb-1 text-[10px] font-black tracking-widest text-indigo-400/80 uppercase">Expected Today</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight text-white">
                                <CountUpNumber value={expectedToday} />
                            </span>
                            <span className="text-xs font-bold text-indigo-300/60">
                                {expectedToday === 1 ? 'visitor' : 'visitors'}
                            </span>
                        </div>
                    </div>

                    {canGenerate && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={onAction}
                            className="relative flex h-full w-full items-center justify-center gap-3 rounded-[24px] bg-white py-5 text-lg font-black text-slate-950 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.3)] transition-all active:shadow-none"
                        >
                            <Plus className="h-6 w-6" strokeWidth={3} />
                            Generate Access Code
                            {/* Subtle button glow */}
                            <div className="absolute inset-0 -z-10 rounded-[24px] bg-white/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
