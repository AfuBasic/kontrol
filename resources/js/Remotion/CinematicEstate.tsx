import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, interpolateColors } from 'remotion';
import { ShieldCheck } from 'lucide-react';

export const CinematicEstate: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1. Lighting progression (morning -> golden afternoon -> morning)
    // Morning: Cool, muted. Active: Warm, golden.
    const skyColor1 = interpolateColors(frame, [0, 60, 200, 260, 300], ['#e2e8f0', '#e2e8f0', '#fef3c7', '#fef3c7', '#e2e8f0']);
    const skyColor2 = interpolateColors(frame, [0, 60, 200, 260, 300], ['#94a3b8', '#94a3b8', '#fde68a', '#fde68a', '#94a3b8']);
    const skyBackground = `linear-gradient(135deg, ${skyColor1}, ${skyColor2})`;

    const shadowColor = interpolateColors(frame, [0, 60, 200, 260, 300], ['#cbd5e1', '#cbd5e1', '#fbbf24', '#fbbf24', '#cbd5e1']);
    const boardShadow = `${shadowColor}`;

    const boardBg = interpolateColors(frame, [0, 60, 200, 260, 300], ['rgba(241, 245, 249, 0.8)', 'rgba(241, 245, 249, 0.8)', 'rgba(255, 251, 235, 0.9)', 'rgba(255, 251, 235, 0.9)', 'rgba(241, 245, 249, 0.8)']);
    
    // 2. Camera slow floating motion & drift
    const cameraTranslateX = interpolate(frame, [0, 150, 300], [0, 3, 0]);
    const cameraTranslateY = interpolate(frame, [0, 150, 300], [-5, 0, -5]);
    const cameraRotateX = interpolate(frame, [0, 150, 300], [60, 58, 60]);
    const cameraRotateZ = interpolate(frame, [0, 150, 300], [-45, -42, -45]);
    const cameraScale = interpolate(frame, [0, 150, 300], [1.0, 1.05, 1.0]);

    // 3. Brand Pulse triggers
    const logoOpacity = interpolate(frame, [20, 40, 70, 90], [0, 1, 1, 0]);
    const logoScale = spring({
        frame: frame - 20,
        fps,
        config: { damping: 12 },
    });

    // Pulse traveling along roads
    const pulseOffset = interpolate(frame, [50, 120], [100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // 4. Activations & Waking Up states
    const gateOpenProgress = interpolate(frame, [70, 90, 270, 290], [0, -90, -90, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    
    // Security scanner light
    const scannerX = interpolate(frame, [80, 100], [-10, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const scannerOpacity = interpolate(frame, [75, 80, 100, 105], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Streetlights glow
    const streetlightOpacity = interpolate(frame, [100, 140, 260, 300], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Houses illumination sequencing
    const house1Glow = interpolate(frame, [110, 140, 260, 290], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house2Glow = interpolate(frame, [120, 150, 260, 290], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house3Glow = interpolate(frame, [130, 160, 260, 290], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house4Glow = interpolate(frame, [140, 170, 260, 290], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Cars moving (One enters, one parks, one exits)
    const car1X = interpolate(frame, [80, 200], [5, 45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const car2Y = interpolate(frame, [130, 250], [80, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Announcements ripple wave (Community Hall)
    const waveScale = interpolate(frame, [160, 220], [0.1, 3.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const waveOpacity = interpolate(frame, [160, 190, 220], [0, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Payments ledgers (Estate Office)
    const ledgerPulseX = interpolate(frame, [170, 230], [35, 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const ledgerOpacity = interpolate(frame, [170, 190, 210, 230], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    
    // Incident Highlight (One building briefly highlights blue)
    const incidentHighlight = interpolate(frame, [190, 200, 220, 230], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
                        background: boardBg,
                        borderRadius: 40,
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: `0 30px 60px -15px ${boardShadow}`,
                        transform: `rotateX(${cameraRotateX}deg) rotateZ(${cameraRotateZ}deg) translate3d(${cameraTranslateX}%, ${cameraTranslateY}%, 0px) scale(${cameraScale})`,
                        transformStyle: 'preserve-3d',
                        position: 'relative',
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
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
                        <path d="M 15 55 L 75 55" fill="none" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="3.5" />
                        {/* Loop network */}
                        <path d="M 45 30 L 45 70 L 65 70 L 65 30 Z" fill="none" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="2.5" />

                        {/* Animated Glowing Pulse */}
                        <path
                            d="M 15 55 L 75 55"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3.5"
                            strokeDasharray="8 30"
                            strokeDashoffset={pulseOffset}
                            style={{ opacity: streetlightOpacity > 0 ? 1 : 0 }}
                        />
                    </svg>

                    {/* Trees (Gentle wind movement) */}
                    <Tree x={20} y={25} frame={frame} />
                    <Tree x={22} y={30} frame={frame} offset={10} />
                    <Tree x={70} y={20} frame={frame} offset={30} />
                    <Tree x={75} y={25} frame={frame} offset={45} />
                    <Tree x={30} y={65} frame={frame} offset={60} />
                    <Tree x={35} y={75} frame={frame} offset={80} />

                    {/* 3D BUILDINGS */}
                    {/* Main Gate */}
                    <IsometricHouse x={10} y={50} w={32} l={42} h={26} label="GATE" isActive={frame > 70 && frame < 290} />

                    {/* Gate barrier arm (physically rotates open) */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '17%',
                            top: '55%',
                            width: 25,
                            height: 4,
                            background: '#3b82f6',
                            borderRadius: 2,
                            transform: `translateZ(12px) rotateY(${gateOpenProgress}deg)`,
                            transformOrigin: 'left center',
                            boxShadow: gateOpenProgress < 0 ? '0 0 8px rgba(59, 130, 246, 0.6)' : 'none',
                        }}
                    />

                    {/* Security Scanner Light */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `17%`,
                            top: '53%',
                            width: 2,
                            height: 10,
                            background: '#60a5fa',
                            boxShadow: '0 0 8px #60a5fa',
                            transform: `translateZ(15px) translateX(${scannerX}px)`,
                            opacity: scannerOpacity,
                        }}
                    />

                    {/* Guard Cabin */}
                    <IsometricHouse x={26} y={42} w={20} l={20} h={32} label="GUARD" isActive={frame > 80 && frame < 290} />

                    {/* Estate Office */}
                    <IsometricHouse x={32} y={26} w={38} l={42} h={46} label="OFFICE" isActive={frame > 110 && frame < 290} />

                    {/* Residential Homes (glowing sequentially) */}
                    <IsometricHouse x={42} y={18} w={26} l={26} h={30} label="" isActive={house1Glow > 0.5} />
                    <IsometricHouse x={42} y={72} w={26} l={26} h={30} label="" isActive={house2Glow > 0.5} incidentGlow={incidentHighlight} />
                    <IsometricHouse x={62} y={18} w={26} l={26} h={30} label="" isActive={house3Glow > 0.5} />
                    <IsometricHouse x={62} y={72} w={26} l={26} h={30} label="" isActive={house4Glow > 0.5} />

                    {/* Community Hall */}
                    <IsometricHouse x={76} y={44} w={48} l={52} h={38} label="HALL" isActive={frame > 150 && frame < 290} />

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

                    {/* Cars Moving */}
                    {/* Car 1: Enters */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${car1X}%`,
                            top: `56%`,
                            width: 14,
                            height: 8,
                            background: '#cbd5e1',
                            borderRadius: 3,
                            transform: 'translateZ(3px)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                    />
                    {/* Car 2: Moves along side road */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `46%`,
                            top: `${car2Y}%`,
                            width: 8,
                            height: 14,
                            background: '#94a3b8',
                            borderRadius: 3,
                            transform: 'translateZ(3px)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                    />

                    {/* Active Financial ledger pulse */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${ledgerPulseX}%`,
                            top: '35%',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#10b981',
                            boxShadow: '0 0 12px #10b981',
                            transform: 'translateZ(10px)',
                            opacity: ledgerOpacity,
                        }}
                    />

                    {/* Tiny People (Subtle Community Life) */}
                    {frame > 150 && frame < 290 && (
                        <>
                            <Person x={50} y={40} frame={frame} offset={0} />
                            <Person x={52} y={42} frame={frame} offset={20} />
                            <Person x={80} y={65} frame={frame} offset={40} />
                        </>
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
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '28px',
                        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
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
    isActive: boolean;
    incidentGlow?: number;
}> = ({ x, y, w, l, h, label, isActive, incidentGlow = 0 }) => {
    
    const wallColor = isActive ? '#f8fafc' : '#f1f5f9';
    const roofColor = isActive ? '#e2e8f0' : '#cbd5e1';
    const sideWallColor = isActive ? '#f1f5f9' : '#e2e8f0';
    
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
                    background: 'rgba(0, 0, 0, 0.1)',
                    filter: 'blur(4px)',
                    borderRadius: 8,
                    transform: 'translateZ(-1px)',
                }}
            />

            {/* Incident Highlight Glow */}
            {incidentGlow > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: -10,
                        background: `rgba(59, 130, 246, ${incidentGlow * 0.4})`,
                        filter: 'blur(12px)',
                        borderRadius: 20,
                        transform: 'translateZ(1px)',
                    }}
                />
            )}

            {/* Front Wall */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: w,
                    height: h,
                    transform: 'rotateX(-90deg) origin-bottom',
                    background: wallColor,
                    border: '1px solid rgba(0, 0, 0, 0.05)',
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
                                background: isActive ? '#fbbf24' : '#94a3b8',
                                boxShadow: isActive ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none',
                                transition: 'all 1.0s ease-in-out',
                            }}
                        />
                    ))}
                </div>
                {/* Porch light for homes */}
                {isActive && label === "" && (
                    <div style={{ width: 4, height: 4, borderRadius: 2, background: '#fbbf24', boxShadow: '0 0 6px #fbbf24', alignSelf: 'center', marginTop: 2 }} />
                )}
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
                    background: sideWallColor,
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
            />

            {/* Roof Top Face */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    transform: `translateZ(${h}px)`,
                    background: roofColor,
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(0, 0, 0, 0.4)',
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

// Tree Component
const Tree: React.FC<{ x: number; y: number; frame: number; offset?: number }> = ({ x, y, frame, offset = 0 }) => {
    // Gentle wind movement using sine wave
    const wind = Math.sin((frame + offset) / 15) * 5;
    
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 12,
                height: 12,
                background: '#4ade80',
                borderRadius: '50%',
                transform: `translateZ(10px) rotateY(${wind}deg) rotateX(${wind}deg)`,
                transformStyle: 'preserve-3d',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), inset 0 -2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #22c55e'
            }}
        >
            <div style={{
                position: 'absolute',
                left: '40%',
                top: '100%',
                width: 4,
                height: 10,
                background: '#78350f',
                transform: 'translateZ(-5px) rotateX(-90deg) origin-top',
            }} />
        </div>
    );
}

// Person Component
const Person: React.FC<{ x: number; y: number; frame: number; offset?: number }> = ({ x, y, frame, offset = 0 }) => {
    // Tiny walking movement
    const walkX = Math.sin((frame + offset) / 20) * 2;
    const walkY = Math.cos((frame + offset) / 20) * 2;
    
    return (
        <div
            style={{
                position: 'absolute',
                left: `calc(${x}% + ${walkX}px)`,
                top: `calc(${y}% + ${walkY}px)`,
                width: 4,
                height: 4,
                background: '#64748b',
                borderRadius: '50%',
                transform: `translateZ(4px)`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
        />
    );
}
