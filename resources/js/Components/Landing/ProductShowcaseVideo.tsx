import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface CompositionProps {
    screenshotUrl: string;
}

const ProductShowcaseComposition: React.FC<CompositionProps> = ({ screenshotUrl }) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // 1. Slow, cinematic zoom-in (from scale 0.95 to 1.05 over 150 frames)
    const scale = interpolate(frame, [0, 150], [0.95, 1.05], {
        extrapolateRight: 'clamp',
    });

    // 2. Slow 3D camera drift/pan simulation
    const translateX = interpolate(frame, [0, 150], [0, -10]);
    const translateY = interpolate(frame, [0, 150], [0, 5]);

    // 3. Scanner laser sweep position (0 to height)
    const laserY = interpolate(frame, [0, 150], [-10, height + 10]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#020617', overflow: 'hidden' }}>
            {/* Dashboard screenshot asset layer with transformation matrix */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                }}
            >
                <img
                    src={screenshotUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                    alt="Kontrol Dashboard"
                />
            </div>

            {/* Programmatic vector tracking lasers & scanner sweep */}
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            >
                {/* Horizontal sweep laser */}
                <line
                    x1="0"
                    y1={laserY}
                    x2={width}
                    y2={laserY}
                    stroke="#4F46E5"
                    strokeWidth="3"
                    opacity="0.8"
                    style={{
                        filter: 'drop-shadow(0px 0px 8px rgba(79, 70, 229, 0.9))',
                    }}
                />

                {/* Tracking hot-spots */}
                <circle cx={width * 0.18} cy={height * 0.32} r={interpolate(frame, [20, 40, 60], [2, 10, 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} fill="none" stroke="#FF7E67" strokeWidth="1.5" opacity={interpolate(frame, [20, 60], [1, 0], { extrapolateLeft: 'clamp' })} />
                <circle cx={width * 0.18} cy={height * 0.32} r="3.5" fill="#FF7E67" />

                <circle cx={width * 0.72} cy={height * 0.25} r={interpolate(frame, [50, 70, 90], [2, 10, 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} fill="none" stroke="#FF7E67" strokeWidth="1.5" opacity={interpolate(frame, [50, 90], [1, 0], { extrapolateLeft: 'clamp' })} />
                <circle cx={width * 0.72} cy={height * 0.25} r="3.5" fill="#FF7E67" />

                <circle cx={width * 0.45} cy={height * 0.68} r={interpolate(frame, [90, 110, 130], [2, 10, 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} fill="none" stroke="#4F46E5" strokeWidth="1.5" opacity={interpolate(frame, [90, 130], [1, 0], { extrapolateLeft: 'clamp' })} />
                <circle cx={width * 0.45} cy={height * 0.68} r="3.5" fill="#4F46E5" />
            </svg>
        </AbsoluteFill>
    );
};

export default function ProductShowcaseVideo() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="relative w-full aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-indigo-500/10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                    <span className="text-xs font-bold text-slate-500 tracking-widest uppercase font-mono">LOADING OPERATIONS GRIDS...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-indigo-500/10">
            <Player
                component={ProductShowcaseComposition}
                inputProps={{
                    screenshotUrl: '/images/landing/hero.png',
                }}
                durationInFrames={150}
                fps={30}
                compositionWidth={1200}
                compositionHeight={750}
                style={{
                    width: '100%',
                    height: '100%',
                }}
                controls={false}
                loop
                autoPlay
            />

            {/* Control Panel HUD */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-2xl px-4 py-2 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">REMOTION COMPOSITOR INTEGRATED</span>
                </div>
            </div>
        </div>
    );
}
