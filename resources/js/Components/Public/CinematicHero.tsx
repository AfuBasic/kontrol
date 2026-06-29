import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Smartphone,
    FileText,
    MessageSquare,
    PhoneCall,
    DollarSign,
    QrCode,
    Bell,
    CreditCard,
    Layers,
    Activity,
    Play,
    Pause,
    RotateCcw,
} from 'lucide-react';
import DesktopFrame from '@/Components/Mockups/DesktopFrame';
import IphoneFrame from '@/Components/Mockups/IphoneFrame';
import InteractiveTilt from '@/Components/Public/InteractiveTilt';

interface Node {
    id: string;
    label: string;
    x: number;
    y: number;
    icon: any;
}

const NODES: Node[] = [
    { id: 'gate', label: 'Main Gate', x: 15, y: 45, icon: ShieldCheck },
    { id: 'security', label: 'Patrol Security', x: 38, y: 22, icon: Activity },
    { id: 'homes', label: 'Residents', x: 78, y: 28, icon: Smartphone },
    { id: 'finance', label: 'Estate Treasury', x: 45, y: 75, icon: DollarSign },
    { id: 'comms', label: 'Admin Office', x: 80, y: 70, icon: Layers },
];

const PATHS = [
    { from: 'gate', to: 'security', d: 'M 15 45 Q 26.5 33.5, 38 22' },
    { from: 'security', to: 'homes', d: 'M 38 22 Q 58 20, 78 28' },
    { from: 'gate', to: 'finance', d: 'M 15 45 Q 30 60, 45 75' },
    { from: 'finance', to: 'homes', d: 'M 45 75 Q 61.5 51.5, 78 28' },
    { from: 'homes', to: 'comms', d: 'M 78 28 Q 79 49, 80 70' },
];

export default function CinematicHero() {
    const [scene, setScene] = useState<number>(0); // 0: Disconnected, 1: Pulse, 2: Morphing, 3: Connected
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const intervalRef = useRef<any>(null);

    // Auto-advance scenes
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setScene((prev) => (prev + 1) % 4);
            }, 6000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying]);

    const handleSceneSelect = (index: number) => {
        setIsPlaying(false); // Pause autoplay on manual selection
        setScene(index);
    };

    return (
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-8">
            {/* Cinematic Canvas Container */}
            <div className="shadow-3xl relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/50 backdrop-blur-md md:h-[600px]">
                {/* Background Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] transition-opacity duration-1000"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1.5px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Ambient glow fields */}
                <div className="pointer-events-none absolute -top-1/4 left-1/4 h-[300px] w-[400px] rounded-full bg-blue-600/10 blur-[80px]" />
                <div className="pointer-events-none absolute right-1/4 -bottom-1/4 h-[300px] w-[400px] rounded-full bg-indigo-600/10 blur-[80px]" />

                {/* SCENES 0, 1, 2: SVG Schematic Map Layer */}
                {scene < 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Circuit Connections */}
                            {PATHS.map((path, idx) => {
                                const isPulseScene = scene === 1;
                                const isMorphScene = scene === 2;
                                return (
                                    <g key={idx}>
                                        {/* Underlay / Inactive line */}
                                        <path
                                            d={path.d}
                                            fill="none"
                                            stroke={scene === 0 ? 'rgba(148, 163, 184, 0.12)' : 'rgba(59, 130, 246, 0.15)'}
                                            strokeWidth="0.4"
                                            className="transition-colors duration-1000"
                                        />

                                        {/* Pulse Sweep Line */}
                                        {isPulseScene && (
                                            <motion.path
                                                d={path.d}
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="0.6"
                                                strokeDasharray="4 20"
                                                animate={{ strokeDashoffset: [40, 0] }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 3,
                                                    ease: 'linear',
                                                    delay: idx * 0.45,
                                                }}
                                            />
                                        )}

                                        {/* Morph Node Glow Line */}
                                        {isMorphScene && (
                                            <motion.path
                                                d={path.d}
                                                fill="none"
                                                stroke="url(#blue-cyan-gradient)"
                                                strokeWidth="0.5"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, ease: 'easeInOut' }}
                                            />
                                        )}
                                    </g>
                                );
                            })}

                            {/* Color Gradient definitions */}
                            <defs>
                                <linearGradient id="blue-cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Interactive schematic Nodes */}
                        {NODES.map((node) => {
                            const Icon = node.icon;
                            return (
                                <motion.div
                                    key={node.id}
                                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                                    layout
                                >
                                    {/* Pulse ring when transforming */}
                                    {scene > 0 && (
                                        <div className="absolute h-14 w-14 animate-ping rounded-full border border-blue-500/30 bg-blue-500/5 opacity-60" />
                                    )}

                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-700 ${
                                            scene === 0
                                                ? 'border-slate-800 bg-slate-900/60 text-slate-400'
                                                : 'border-blue-500/30 bg-blue-950/40 text-blue-400 shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)]'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-700 ${
                                            scene === 0 ? 'text-slate-500' : 'text-slate-300'
                                        }`}
                                    >
                                        {node.label}
                                    </span>
                                </motion.div>
                            );
                        })}

                        {/* Scattered Manual Workflows (Scene 0) -> Morphed Digital (Scene 2) */}

                        {/* 1. Gate Logbook -> QR Code */}
                        <div className="absolute top-[48%] left-[28%] -translate-x-1/2">
                            <AnimatePresence mode="wait">
                                {scene === 0 ? (
                                    <motion.div
                                        key="logbook"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg backdrop-blur-sm"
                                    >
                                        <FileText className="h-5 w-5 animate-pulse text-amber-500" />
                                        <span className="text-[10px] font-semibold text-slate-400">Paper Guest Book</span>
                                    </motion.div>
                                ) : scene === 2 ? (
                                    <motion.div
                                        key="qrcode"
                                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        className="flex flex-col items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-950/80 p-3 shadow-lg backdrop-blur-sm"
                                    >
                                        <QrCode className="h-5 w-5 animate-bounce text-blue-400" />
                                        <span className="text-[10px] font-bold text-blue-400">QR Visitor Pass</span>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {/* 2. WhatsApp Chaotic Bubbles -> System Push Notification */}
                        <div className="absolute top-[68%] left-[64%] -translate-x-1/2">
                            <AnimatePresence mode="wait">
                                {scene === 0 ? (
                                    <motion.div
                                        key="whatsapp"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 shadow-lg backdrop-blur-sm"
                                    >
                                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                                        <span className="text-[9px] font-semibold text-slate-400">Chaotic WhatsApp Groups</span>
                                    </motion.div>
                                ) : scene === 2 ? (
                                    <motion.div
                                        key="notification"
                                        initial={{ scale: 0.6, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/80 p-2.5 shadow-lg backdrop-blur-sm"
                                    >
                                        <Bell className="h-4 w-4 text-blue-400" />
                                        <span className="text-[9px] font-bold text-blue-400">Unified Announcement</span>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {/* 3. Phone Ringing gate call -> Resident Alert Notification */}
                        <div className="absolute top-[18%] left-[58%] -translate-x-1/2">
                            <AnimatePresence mode="wait">
                                {scene === 0 ? (
                                    <motion.div
                                        key="phonecall"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 shadow-lg backdrop-blur-sm"
                                    >
                                        <PhoneCall className="h-4 w-4 animate-bounce text-red-400" />
                                        <span className="text-[9px] font-semibold text-slate-400">Manual Intercom Calls</span>
                                    </motion.div>
                                ) : scene === 2 ? (
                                    <motion.div
                                        key="alert"
                                        initial={{ scale: 0.6, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/80 p-2.5 shadow-lg backdrop-blur-sm"
                                    >
                                        <Smartphone className="h-4 w-4 text-blue-400" />
                                        <span className="text-[9px] font-bold text-blue-400">Gate Arrival Alert</span>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {/* 4. Cash Stack -> Digital collections Wallet */}
                        <div className="absolute top-[68%] left-[32%] -translate-x-1/2">
                            <AnimatePresence mode="wait">
                                {scene === 0 ? (
                                    <motion.div
                                        key="cash"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 shadow-lg backdrop-blur-sm"
                                    >
                                        <DollarSign className="h-4 w-4 text-amber-500" />
                                        <span className="text-[9px] font-semibold text-slate-400">Manual Cash Collections</span>
                                    </motion.div>
                                ) : scene === 2 ? (
                                    <motion.div
                                        key="digitalwallet"
                                        initial={{ scale: 0.6, rotateX: 45, opacity: 0 }}
                                        animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                                        className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/80 p-2.5 shadow-lg backdrop-blur-sm"
                                    >
                                        <CreditCard className="h-4 w-4 text-blue-400" />
                                        <span className="text-[9px] font-bold text-blue-400">Automated E-Receipt</span>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* SCENE 3: THE FULLY CONNECTED OPERATING SYSTEM */}
                {scene === 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 flex h-full w-full max-w-[1000px] flex-col items-center justify-center px-4"
                    >
                        {/* Interactive Tilt Desktop Dashboard Container */}
                        <div className="w-full max-w-[850px] -translate-y-4">
                            <InteractiveTilt maxRotation={4}>
                                <DesktopFrame
                                    src="/assets/images/screenshots/large-desktop.png"
                                    alt="Kontrol Operations Center"
                                    className="w-full drop-shadow-2xl"
                                />
                            </InteractiveTilt>
                        </div>

                        {/* Overlapping mobile iPhone mockup */}
                        <div className="absolute right-8 bottom-6 z-20 w-[180px] sm:w-[220px]">
                            <InteractiveTilt maxRotation={8}>
                                <IphoneFrame
                                    src="/assets/images/screenshots/frictionless-access.png"
                                    alt="Kontrol Mobile Application"
                                    className="rounded-[3rem] ring-1 ring-white/10 drop-shadow-2xl"
                                />
                            </InteractiveTilt>
                        </div>

                        {/* Connection indicators showing integrations */}
                        <div className="absolute top-1/2 left-8 z-20 flex -translate-y-1/2 flex-col gap-3">
                            <div className="flex items-center gap-3 rounded-full border border-blue-500/20 bg-blue-950/70 px-4 py-2 text-xs font-bold text-blue-400 backdrop-blur-md">
                                <QrCode className="h-4 w-4" /> Guest Access Verified
                            </div>
                            <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-950/70 px-4 py-2 text-xs font-bold text-emerald-400 backdrop-blur-md">
                                <CreditCard className="h-4 w-4" /> Payment Confirmed
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Premium Navigation Controls / Tour Indicator */}
            <div className="relative mt-8 flex w-full flex-col items-center justify-between gap-4 px-4 sm:flex-row">
                {/* Play/Pause controls */}
                <div className="flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-900/60 px-4 py-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-slate-800"
                        aria-label={isPlaying ? 'Pause Autoplay' : 'Play Autoplay'}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={() => {
                            setScene(0);
                            setIsPlaying(false);
                        }}
                        className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-slate-800"
                        aria-label="Restart Timeline"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                    <span className="border-l border-slate-800 pl-2 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                        {isPlaying ? 'Cinematic Flow Active' : 'Flow Paused'}
                    </span>
                </div>

                {/* Interactive Scene Switcher Dots */}
                <div className="flex items-center gap-2">
                    {[
                        { label: 'Disconnected', desc: 'Isolated systems' },
                        { label: 'The Pulse', desc: 'Kontrol wakes up' },
                        { label: 'Transformation', desc: 'Workflows morph' },
                        { label: 'Operating System', desc: 'Fully Connected' },
                    ].map((step, idx) => (
                        <button key={idx} onClick={() => handleSceneSelect(idx)} className="group relative flex flex-col items-center">
                            {/* Dot */}
                            <div
                                className="relative flex h-9 items-center justify-center overflow-hidden rounded-full border bg-slate-950/40 px-4 text-xs font-semibold transition-all duration-300"
                                style={{
                                    borderColor: scene === idx ? '#3b82f6' : 'rgba(30, 41, 59, 0.8)',
                                    color: scene === idx ? '#fff' : 'rgba(148, 163, 184, 0.6)',
                                }}
                            >
                                {/* Background glow */}
                                {scene === idx && (
                                    <motion.div
                                        layoutId="activeStepGlow"
                                        className="absolute inset-0 -z-10 bg-blue-600/10"
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    />
                                )}
                                {step.label}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
