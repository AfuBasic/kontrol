import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, interpolateColors } from 'remotion';
import { ShieldCheck } from 'lucide-react';

export const CinematicEstate: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1. Lighting progression (morning -> golden afternoon -> loop transition) via hex colors
    const skyColor1 = interpolateColors(frame, [0, 60, 180, 270, 300], ['#0f172a', '#1e1b4b', '#1e3a8a', '#172554', '#0f172a']);
    const skyColor2 = interpolateColors(frame, [0, 60, 180, 270, 300], ['#1e293b', '#111827', '#0f172a', '#020617', '#1e293b']);
    const skyBackground = `linear-gradient(135deg, ${skyColor1}, ${skyColor2})`;

    const shadowColor = interpolateColors(frame, [0, 180, 270, 300], ['#000000', '#3b82f6', '#6366f1', '#000000']);
    const boardShadow = `${shadowColor}50`; // add opacity

    // 2. Camera slow floating motion & drift
    const cameraTranslateX = interpolate(frame, [0, 150, 300], [0, 4, 0]);
    const cameraTranslateY = interpolate(frame, [0, 150, 300], [-10, -5, -10]);
    const cameraRotateX = interpolate(frame, [0, 150, 300], [60, 58, 60]);
    const cameraRotateZ = interpolate(frame, [0, 150, 300], [-45, -42, -45]);
    const cameraScale = interpolate(frame, [0, 150, 300], [1.0, 1.05, 1.0]);

    // 3. Brand Pulse triggers
    const logoOpacity = interpolate(frame, [40, 60, 80, 95], [0, 1, 1, 0]);
    const logoScale = spring({
        frame: frame - 40,
        fps,
        config: { damping: 12 },
    });

    // Pulse traveling along roads
    const pulseOffset = interpolate(frame, [60, 160], [100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // 4. Activations & Waking Up states
    const gateOpenProgress = interpolate(frame, [80, 110], [0, -90], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // Streetlights glow
    const streetlightOpacity = interpolate(frame, [100, 140], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // Houses illumination sequencing
    const house1Glow = interpolate(frame, [110, 140], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house2Glow = interpolate(frame, [130, 160], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house3Glow = interpolate(frame, [155, 185], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house4Glow = interpolate(frame, [180, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Cars moving
    const carProgressX = interpolate(frame, [90, 220], [15, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const carProgressY = interpolate(frame, [90, 220], [55, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Announcements ripple wave
    const waveScale = interpolate(frame, [180, 240], [0.1, 2.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const waveOpacity = interpolate(frame, [180, 220, 240], [0, 0.4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Payments ledgers
    const ledgerPulseX = interpolate(frame, [140, 200], [35, 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: skyBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            {/* The 3D projected board */}
            <div
                style={{
                    width: 900,
                    height: 800,
                    perspective: 1200,
                    transformStyle: 'preserve-3d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: 40,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: `0 25px 50px -12px ${boardShadow}`,
                        transform: `rotateX(${cameraRotateX}deg) rotateZ(${cameraRotateZ}deg) translate3d(${cameraTranslateX}%, ${cameraTranslateY}%, 0px) scale(${cameraScale})`,
                        transformStyle: 'preserve-3d',
                        position: 'relative',
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                >
                    {/* SVG Circuits / Roads ground overlay */}
                    <svg
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: 'translateZ(1px)',
                        }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        {/* Main Road path */}
                        <path d="M 15 55 L 75 55" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="3.2" />
                        {/* Loop network */}
                        <path d="M 45 30 L 45 70 L 65 70 L 65 30 Z" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="2.0" />

                        {/* Animated Glowing Pulse */}
                        <path
                            d="M 15 55 L 75 55"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3.2"
                            strokeDasharray="8 30"
                            strokeDashoffset={pulseOffset}
                        />
                    </svg>

                    {/* Landscape Green Spaces */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '18%',
                            top: '20%',
                            width: '20%',
                            height: '25%',
                            transform: 'translateZ(2px)',
                            borderRadius: '16px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.1)',
                        }}
                    />

                    {/* 3D BUILDINGS */}

                    {/* Main Gate */}
                    <IsometricHouse x={10} y={50} w={32} l={42} h={26} label="GATE" pulse={frame} isActive={frame > 80} />

                    {/* Gate barrier arm (physically rotates open) */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '17%',
                            top: '55%',
                            width: 25,
                            height: 4,
                            background: '#ef4444',
                            borderRadius: 2,
                            transform: `translateZ(12px) rotateY(${gateOpenProgress}deg)`,
                            transformOrigin: 'left center',
                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                        }}
                    />

                    {/* Guard Cabin */}
                    <IsometricHouse x={26} y={42} w={20} l={20} h={32} label="GUARD" pulse={frame} isActive={frame > 90} />

                    {/* Estate Office */}
                    <IsometricHouse x={32} y={26} w={38} l={42} h={46} label="OFFICE" pulse={frame} isActive={frame > 140} />

                    {/* Residential Homes (glowing sequentially) */}
                    <IsometricHouse x={42} y={18} w={26} l={26} h={30} label="H1" pulse={frame} isActive={house1Glow > 0.5} />
                    <IsometricHouse x={42} y={72} w={26} l={26} h={30} label="H2" pulse={frame} isActive={house2Glow > 0.5} />
                    <IsometricHouse x={62} y={18} w={26} l={26} h={30} label="H3" pulse={frame} isActive={house3Glow > 0.5} />
                    <IsometricHouse x={62} y={72} w={26} l={26} h={30} label="H4" pulse={frame} isActive={house4Glow > 0.5} />

                    {/* Community Hall */}
                    <IsometricHouse x={76} y={44} w={48} l={52} h={38} label="HALL" pulse={frame} isActive={frame > 175} />

                    {/* Active Announcement ripple waves floating above Community Hall */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '84%',
                            top: '52%',
                            transform: `translateZ(45px) scale(${waveScale})`,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            border: '1px solid rgba(59, 130, 246, 0.6)',
                            background: 'rgba(59, 130, 246, 0.05)',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                            opacity: waveOpacity,
                            pointerEvents: 'none',
                            transformOrigin: 'center center',
                        }}
                    />

                    {/* Little moving car */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${carProgressX}%`,
                            top: `${carProgressY}%`,
                            width: 14,
                            height: 8,
                            background: '#3b82f6',
                            borderRadius: 3,
                            transform: 'translateZ(2px)',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                    />

                    {/* Active Financial ledger pulse */}
                    {frame > 140 && frame < 200 && (
                        <div
                            style={{
                                position: 'absolute',
                                left: `${ledgerPulseX}%`,
                                top: '48%',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#10b981',
                                boxShadow: '0 0 12px #10b981',
                                transform: 'translateZ(10px)',
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Cinematic Overlay: Soft Logo reveal during the Kontrol Moment */}
            <div
                style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${logoScale})`,
                    opacity: logoOpacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        padding: '24px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '28px',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <ShieldCheck size={48} color="#3b82f6" />
                </div>
            </div>
        </div>
    );
};

// 3D House helper element inside the Remotion composition
const IsometricHouse: React.FC<{
    x: number;
    y: number;
    w: number;
    l: number;
    h: number;
    label: string;
    pulse: number;
    isActive: boolean;
}> = ({ x, y, w, l, h, label, pulse, isActive }) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: w,
                height: l,
                transform: 'translateZ(0px)',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Shadow face */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    filter: 'blur(3px)',
                    borderRadius: 8,
                    transform: 'translateZ(-1px)',
                }}
            />

            {/* Front Wall */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: w,
                    height: h,
                    transform: 'rotateX(-90deg) origin-bottom',
                    background: isActive ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    padding: 4,
                }}
            >
                {/* Windows glow */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                height: 5,
                                borderRadius: 1,
                                background: isActive ? '#fbbf24' : '#1e293b',
                                boxShadow: isActive ? '0 0 8px #fbbf24' : 'none',
                                transition: 'all 1.0s ease-in-out',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Side Wall */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: h,
                    height: l,
                    transform: 'rotateY(90deg) origin-top-right',
                    background: isActive ? 'rgba(15, 23, 42, 0.95)' : 'rgba(2, 6, 23, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                }}
            />

            {/* Roof Top Face */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    transform: `translateZ(${h}px)`,
                    background: isActive ? 'rgba(51, 65, 85, 0.95)' : 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: 8,
                    fontWeight: 'bold',
                    letterSpacing: 1,
                }}
            >
                {label}
            </div>
        </div>
    );
};
