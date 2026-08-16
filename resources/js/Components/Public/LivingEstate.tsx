import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Home as HomeIcon, Landmark, Star, Bell, ShieldAlert, Award, Activity } from 'lucide-react';

interface Props {
    scrollProgress: number; // 0 (Hero) to 1 (Bottom feature)
    isActiveState?: boolean; // If true, the whole estate is activated (powered by Kontrol)
}

export default function LivingEstate({ scrollProgress, isActiveState = false }: Props) {
    const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
    const [isPowered, setIsPowered] = useState(isActiveState);

    // Sync power state with scroll or explicit override
    useEffect(() => {
        if (isActiveState || scrollProgress > 0.1) {
            setIsPowered(true);
        } else {
            setIsPowered(false);
        }
    }, [scrollProgress, isActiveState]);

    // Determine camera transformation based on scroll progress
    // Panning & Zoom targets:
    // Scroll 0 (Hero): Center view, scale 0.95
    // Scroll 0.2 (Gate): Focus Gate (left: 15%, top: 55%), scale 1.6
    // Scroll 0.4 (Security): Focus Security (left: 28%, top: 45%), scale 1.7
    // Scroll 0.6 (Resident App): Focus Houses (left: 45%, top: 30%), scale 1.6
    // Scroll 0.8 (Office): Focus Estate Office (left: 35%, top: 45%), scale 1.7
    // Scroll 1.0 (Community): Focus Community Hall (left: 75%, top: 50%), scale 1.5

    const getCameraTransform = () => {
        let x = 0;
        let y = 0;
        let scale = 0.95;
        const rotateX = 60;
        const rotateZ = -45;

        if (scrollProgress <= 0.15) {
            // Initial Hero State
            const t = scrollProgress / 0.15;
            x = t * 15;
            y = t * -5;
            scale = 0.95 + t * 0.45;
        } else if (scrollProgress <= 0.35) {
            // Gate Focus
            const t = (scrollProgress - 0.15) / 0.2;
            x = 15 + t * 8;
            y = -5 + t * 5;
            scale = 1.4 + t * 0.2;
        } else if (scrollProgress <= 0.55) {
            // Security Focus
            const t = (scrollProgress - 0.35) / 0.2;
            x = 23 + t * 12;
            y = t * 15;
            scale = 1.6 + t * 0.1;
        } else if (scrollProgress <= 0.75) {
            // Resident Focus
            const t = (scrollProgress - 0.55) / 0.2;
            x = 35 - t * 8;
            y = 15 - t * 5;
            scale = 1.7 - t * 0.15;
        } else if (scrollProgress <= 0.95) {
            // Office Focus
            const t = (scrollProgress - 0.75) / 0.2;
            x = 27 + t * 25;
            y = 10 + t * 10;
            scale = 1.55 - t * 0.1;
        } else {
            // Final overview
            const t = (scrollProgress - 0.95) / 0.05;
            x = 52 - t * 25;
            y = 20 - t * 15;
            scale = 1.45 - t * 0.5;
        }

        return `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) translate3d(${x}%, ${y}%, 0px) scale(${scale})`;
    };

    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            {/* Viewport container with perspective */}
            <div
                className="ease-out-expo relative h-[700px] w-[800px] transition-transform duration-1000"
                style={{
                    perspective: '1500px',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* 3D Board Projection */}
                <div
                    className="absolute inset-0 origin-center rounded-[3rem] border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-sm transition-all duration-1000"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: getCameraTransform(),
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
                        backgroundSize: '30px 30px',
                    }}
                >
                    {/* The Green Park and Landscape areas */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '18%',
                            top: '20%',
                            width: '20%',
                            height: '25%',
                            transform: 'translateZ(1px)',
                        }}
                        className={`rounded-2xl border border-white/5 transition-colors duration-1000 ${
                            isPowered ? 'border-emerald-500/10 bg-emerald-950/25' : 'bg-slate-950/20'
                        }`}
                    >
                        {/* Miniature trees */}
                        <div className="absolute top-2 left-2 flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-6 w-3 rounded-full border border-emerald-500/20 bg-emerald-700/60 shadow-md"
                                    style={{ transform: 'rotateX(-90deg) origin-bottom' }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Road Network Ground SVG */}
                    <svg
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{ transform: 'translateZ(2px)' }}
                    >
                        {/* Main Avenue */}
                        <path
                            d="M 15 55 L 75 55"
                            fill="none"
                            stroke={isPowered ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.02)'}
                            strokeWidth="2.5"
                            className="transition-colors duration-1000"
                        />
                        {/* loop street */}
                        <path
                            d="M 45 30 L 45 70 L 65 70 L 65 30 Z"
                            fill="none"
                            stroke={isPowered ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)'}
                            strokeWidth="1.8"
                            className="transition-colors duration-1000"
                        />

                        {/* Glowing pulse indicator sweep */}
                        {isPowered && (
                            <motion.path
                                d="M 15 55 L 75 55"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                                strokeDasharray="3 15"
                                animate={{ strokeDashoffset: [30, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                            />
                        )}
                    </svg>

                    {/* 3D BUILDING MODELS */}

                    {/* 1. Main Gate Entrance */}
                    <IsometricBuilding
                        x={10}
                        y={50}
                        w={30}
                        l={40}
                        h={25}
                        isActive={isPowered}
                        label="GATE"
                        isHovered={hoveredBuilding === 'gate'}
                        onMouseEnter={() => setHoveredBuilding('gate')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />

                    {/* 2. Security Cabin */}
                    <IsometricBuilding
                        x={25}
                        y={43}
                        w={20}
                        l={20}
                        h={30}
                        isActive={isPowered}
                        label="GUARD"
                        isHovered={hoveredBuilding === 'security'}
                        onMouseEnter={() => setHoveredBuilding('security')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />

                    {/* 3. Estate Office */}
                    <IsometricBuilding
                        x={32}
                        y={28}
                        w={35}
                        l={40}
                        h={45}
                        isActive={isPowered}
                        label="OFFICE"
                        isHovered={hoveredBuilding === 'office'}
                        onMouseEnter={() => setHoveredBuilding('office')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />

                    {/* 4. Resident Houses */}
                    <IsometricBuilding
                        x={42}
                        y={20}
                        w={25}
                        l={25}
                        h={28}
                        isActive={isPowered}
                        label="H1"
                        isHovered={hoveredBuilding === 'h1'}
                        onMouseEnter={() => setHoveredBuilding('h1')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />
                    <IsometricBuilding
                        x={42}
                        y={72}
                        w={25}
                        l={25}
                        h={28}
                        isActive={isPowered}
                        label="H2"
                        isHovered={hoveredBuilding === 'h2'}
                        onMouseEnter={() => setHoveredBuilding('h2')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />
                    <IsometricBuilding
                        x={62}
                        y={20}
                        w={25}
                        l={25}
                        h={28}
                        isActive={isPowered}
                        label="H3"
                        isHovered={hoveredBuilding === 'h3'}
                        onMouseEnter={() => setHoveredBuilding('h3')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />
                    <IsometricBuilding
                        x={62}
                        y={72}
                        w={25}
                        l={25}
                        h={28}
                        isActive={isPowered}
                        label="H4"
                        isHovered={hoveredBuilding === 'h4'}
                        onMouseEnter={() => setHoveredBuilding('h4')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />

                    {/* 5. Community Hall */}
                    <IsometricBuilding
                        x={75}
                        y={45}
                        w={45}
                        l={50}
                        h={35}
                        isActive={isPowered}
                        label="HALL"
                        isHovered={hoveredBuilding === 'hall'}
                        onMouseEnter={() => setHoveredBuilding('hall')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                    />

                    {/* Interactive workflow indicators floating above elements */}
                    <AnimatePresence>
                        {isPowered && hoveredBuilding === 'gate' && (
                            <div
                                style={{ position: 'absolute', left: '10%', top: '35%', transform: 'translateZ(60px)' }}
                                className="pointer-events-none z-50"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/35 bg-blue-950/90 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap text-blue-400 shadow-xl backdrop-blur-sm"
                                >
                                    <Shield className="h-3 w-3" /> Gate Terminal Active
                                </motion.div>
                            </div>
                        )}

                        {isPowered && hoveredBuilding === 'security' && (
                            <div
                                style={{ position: 'absolute', left: '22%', top: '28%', transform: 'translateZ(65px)' }}
                                className="pointer-events-none z-50"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/35 bg-blue-950/90 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap text-blue-400 shadow-xl backdrop-blur-sm"
                                >
                                    <Activity className="h-3 w-3 text-emerald-400" /> Scanning QR Access Code
                                </motion.div>
                            </div>
                        )}

                        {isPowered && hoveredBuilding === 'office' && (
                            <div
                                style={{ position: 'absolute', left: '30%', top: '15%', transform: 'translateZ(80px)' }}
                                className="pointer-events-none z-50"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/35 bg-blue-950/90 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap text-blue-400 shadow-xl backdrop-blur-sm"
                                >
                                    <Landmark className="h-3 w-3 text-cyan-400" /> Administrative Treasury
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Low-poly Isometric Building construct component in CSS 3D
function IsometricBuilding({ x, y, z = 0, w, l, h, isActive, label, isHovered, onMouseEnter, onMouseLeave }: any) {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: w,
                height: l,
                transform: `translateZ(${z}px)`,
                transformStyle: 'preserve-3d',
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="group cursor-pointer"
        >
            {/* Ambient Shadow plane */}
            <div className="absolute inset-0 -translate-z-[1px] rounded-lg bg-black/35 blur-[3px] transition-transform duration-500 group-hover:scale-110" />

            {/* Front Face Wall */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: w,
                    height: h,
                    transform: 'rotateX(-90deg) origin-bottom',
                    transformStyle: 'preserve-3d',
                }}
                className={`flex flex-col justify-around border border-white/5 p-1.5 transition-colors duration-[1.2s] ${
                    isActive ? 'border-blue-500/10 bg-slate-800/90' : 'border-white/5 bg-slate-900/90'
                }`}
            >
                {/* Micro illuminated window indicators */}
                <div className="grid h-6 grid-cols-3 gap-0.5">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-sm transition-all duration-[1.5s] ${
                                isActive ? 'bg-amber-400 opacity-90 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-950 opacity-40'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Right Face Wall */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: h,
                    height: l,
                    transform: 'rotateY(90deg) origin-top-right',
                    transformStyle: 'preserve-3d',
                }}
                className={`flex items-end justify-center border border-white/5 p-1 transition-colors duration-[1.2s] ${
                    isActive ? 'bg-slate-750/90 border-blue-500/10' : 'bg-slate-850/90 border-white/5'
                }`}
            >
                {/* Entry door representation */}
                <div className="h-6 w-4 rounded-t-sm border border-slate-800 bg-slate-950" />
            </div>

            {/* Roof Top Face */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    transform: `translateZ(${h}px)`,
                    transformStyle: 'preserve-3d',
                }}
                className={`flex flex-col items-center justify-center border text-[7px] font-bold tracking-widest text-slate-500 transition-all duration-700 ${
                    isHovered
                        ? 'border-blue-400 bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                        : isActive
                          ? 'border-white/10 bg-slate-700'
                          : 'border-white/5 bg-slate-800'
                }`}
            >
                <span>{label}</span>

                {/* Glow dot if active */}
                {isActive && (
                    <span className="absolute right-1 bottom-1 h-1 w-1 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                )}
            </div>
        </div>
    );
}
