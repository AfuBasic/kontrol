import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, interpolateColors } from 'remotion';

export const CinematicEstate: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1. Cinematic Lighting Progression (Cool morning twilight -> Warm golden sunrise -> Cool twilight for seamless loop)
    // Twilight: #1e293b & #0f172a | Golden Day: #fef3c7 & #fcd34d
    const skyColor1 = interpolateColors(frame, [0, 60, 180, 280, 340, 360], ['#0f172a', '#0f172a', '#e2e8f0', '#fef3c7', '#0f172a', '#0f172a']);
    const skyColor2 = interpolateColors(frame, [0, 60, 180, 280, 340, 360], ['#1e293b', '#1e293b', '#cbd5e1', '#fde68a', '#1e293b', '#1e293b']);
    const skyBackground = `linear-gradient(135deg, ${skyColor1}, ${skyColor2})`;

    // Board shadow warmth cycles with lighting
    const shadowColor = interpolateColors(frame, [0, 180, 280, 360], ['rgba(0, 0, 0, 0.5)', 'rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.3)', 'rgba(0, 0, 0, 0.5)']);

    // Board background (Muted slate -> glowing warm stone -> Muted slate)
    const boardBg = interpolateColors(frame, [0, 60, 180, 280, 340, 360], ['#0f172a', '#0f172a', '#f1f5f9', '#fffbeb', '#0f172a', '#0f172a']);
    const boardBorder = interpolateColors(frame, [0, 180, 280, 360], ['rgba(255, 255, 255, 0.05)', 'rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.2)', 'rgba(255, 255, 255, 0.05)']);

    // 2. Slow gliding camera movement (Apple/Pixar product showcase style)
    const cameraTranslateX = interpolate(frame, [0, 180, 360], [-5, 0, -5]);
    const cameraTranslateY = interpolate(frame, [0, 180, 360], [-15, -10, -15]);
    const cameraRotateX = interpolate(frame, [0, 180, 360], [55, 50, 55]);
    const cameraRotateZ = interpolate(frame, [0, 180, 360], [-35, -30, -35]);
    const cameraScale = interpolate(frame, [0, 180, 360], [1.1, 1.15, 1.1]);

    // 3. Organic energy flow (Subtle blue pulse running down the road entrance)
    const pulseOffset = interpolate(frame, [110, 260], [120, -20], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const pulseOpacity = interpolate(frame, [110, 120, 240, 260], [0, 0.8, 0.8, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // 4. Detailed transformation sequence
    // A vehicle approaches the gate between frames 40 - 120
    const carX = interpolate(frame, [40, 100, 140, 280, 340], [-10, 20, 20, 75, 110], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const carY = interpolate(frame, [40, 100, 140, 280, 340], [50, 50, 50, 35, 30], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    // Car rotation along the road bend
    const carRotateZ = interpolate(frame, [40, 100, 140, 220, 280], [0, 0, 0, -15, -20], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // Security Scanner Light Sweeping (Frames 100 - 125)
    const scannerZ = interpolate(frame, [100, 120], [0, 15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const scannerOpacity = interpolate(frame, [98, 102, 122, 125], [0, 0.7, 0.7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Gate opens after scanning validation (Frames 125 - 150)
    const gateOpenAngle = interpolate(frame, [125, 145, 300, 330], [0, -90, -90, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // Sequential Warm House Lighting & Porch activations as the energy flows
    const house1Active = interpolate(frame, [150, 180, 320, 340], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house2Active = interpolate(frame, [170, 200, 320, 340], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const house3Active = interpolate(frame, [195, 225, 320, 340], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Gentle wind speed (for tree animations)
    const windAngle = Math.sin(frame / 20) * 3;

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
            {/* The 3D viewport containing the close-up estate scene */}
            <div
                style={{
                    width: 1000,
                    height: 900,
                    perspective: 1400,
                    transformStyle: 'preserve-3d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '90%',
                        height: '90%',
                        background: boardBg,
                        borderRadius: 32,
                        border: `1px solid ${boardBorder}`,
                        boxShadow: `0 35px 70px -10px ${shadowColor}`,
                        transform: `rotateX(${cameraRotateX}deg) rotateZ(${cameraRotateZ}deg) translate3d(${cameraTranslateX}%, ${cameraTranslateY}%, 0px) scale(${cameraScale})`,
                        transformStyle: 'preserve-3d',
                        position: 'relative',
                    }}
                >
                    {/* Landscaping - Green lawns & organic shapes */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '5%',
                            top: '5%',
                            width: '45%',
                            height: '80%',
                            background: interpolateColors(frame, [0, 180, 280, 360], ['rgba(16, 185, 129, 0.03)', 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.03)']),
                            borderRadius: '40px 100px 80px 40px',
                            border: `1px dashed ${interpolateColors(frame, [0, 180, 280, 360], ['rgba(16, 185, 129, 0.05)', 'rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)'])}`,
                            transform: 'translateZ(1px)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            right: '5%',
                            top: '10%',
                            width: '35%',
                            height: '50%',
                            background: interpolateColors(frame, [0, 180, 280, 360], ['rgba(16, 185, 129, 0.02)', 'rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.02)']),
                            borderRadius: '120px 40px 100px 60px',
                            border: `1px dashed ${interpolateColors(frame, [0, 180, 280, 360], ['rgba(16, 185, 129, 0.04)', 'rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.04)'])}`,
                            transform: 'translateZ(1px)',
                        }}
                    />

                    {/* The Curved Entry Road */}
                    <svg
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: 'translateZ(2px)',
                        }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        {/* Elegant road path curving up into the neighborhood */}
                        <path
                            d="M -10 50 Q 30 50 50 40 T 110 30"
                            fill="none"
                            stroke={interpolateColors(frame, [0, 180, 280, 360], ['#1e293b', '#e2e8f0', '#e2e8f0', '#1e293b'])}
                            strokeWidth="9"
                            strokeLinecap="round"
                        />
                        <path
                            d="M -10 50 Q 30 50 50 40 T 110 30"
                            fill="none"
                            stroke={interpolateColors(frame, [0, 180, 280, 360], ['rgba(255,255,255,0.05)', '#94a3b8', '#94a3b8', 'rgba(255,255,255,0.05)'])}
                            strokeWidth="0.5"
                            strokeDasharray="2 3"
                        />

                        {/* Subtle blue energy pulse flowing along the road */}
                        <path
                            d="M -10 50 Q 30 50 50 40 T 110 30"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="9"
                            strokeDasharray="15 80"
                            strokeDashoffset={pulseOffset}
                            style={{ opacity: pulseOpacity }}
                        />
                    </svg>

                    {/* Trees (Layered, minimalist luxury landscaping) */}
                    <Tree x={8} y={32} wind={windAngle} height={40} leafColor="#15803d" barkColor="#78350f" />
                    <Tree x={22} y={15} wind={windAngle * 0.9} height={50} leafColor="#166534" barkColor="#78350f" />
                    <Tree x={12} y={18} wind={windAngle * 1.1} height={35} leafColor="#22c55e" barkColor="#78350f" />
                    <Tree x={44} y={12} wind={windAngle} height={42} leafColor="#15803d" barkColor="#78350f" />
                    <Tree x={76} y={15} wind={windAngle * 0.8} height={48} leafColor="#166534" barkColor="#78350f" />
                    <Tree x={68} y={72} wind={windAngle * 1.2} height={38} leafColor="#22c55e" barkColor="#78350f" />

                    {/* Entrance Security Gatehouse */}
                    <GateHouse x={32} y={38} isActive={frame > 100 && frame < 330} />

                    {/* Modern Sleek Gate Arm */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '31%',
                            top: '52%',
                            width: 32,
                            height: 3,
                            background: interpolateColors(frame, [0, 110, 130, 360], ['#475569', '#475569', '#3b82f6', '#475569']),
                            boxShadow: frame > 110 && frame < 320 ? '0 0 10px rgba(59, 130, 246, 0.8)' : 'none',
                            transform: `translateZ(10px) rotateY(${gateOpenAngle}deg)`,
                            transformOrigin: 'left center',
                        }}
                    />

                    {/* Holographic scanning validation beam */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '26%',
                            top: '46%',
                            width: 25,
                            height: 35,
                            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.4), transparent)',
                            transform: `translateZ(${scannerZ}px) rotateY(45deg)`,
                            opacity: scannerOpacity,
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Luxury Modern Villas (Close-up, detailed architecture) */}
                    <LuxuryVilla x={55} y={15} scale={0.9} isActive={house1Active} />
                    <LuxuryVilla x={78} y={12} scale={0.8} isActive={house2Active} />
                    <LuxuryVilla x={85} y={50} scale={0.95} isActive={house3Active} />

                    {/* Vehicle (Approaching & driving down the curved road) */}
                    <Vehicle x={carX} y={carY} rotZ={carRotateZ} />

                    {/* Ambient Residents walking (Subtle organic community life) */}
                    <Person x={70} y={28} frame={frame} active={frame > 180 && frame < 330} />
                    <Person x={73} y={30} frame={frame} active={frame > 180 && frame < 330} isDog={true} />
                </div>
            </div>
        </div>
    );
};

// 3D Tree Helper
const Tree: React.FC<{ x: number; y: number; wind: number; height: number; leafColor: string; barkColor: string }> = ({
    x,
    y,
    wind,
    height,
    leafColor,
    barkColor,
}) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 30,
                height: 30,
                transform: `translateZ(0px)`,
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Trunk */}
            <div
                style={{
                    position: 'absolute',
                    left: '13px',
                    width: 4,
                    height: height * 0.4,
                    background: barkColor,
                    transform: 'rotateX(-90deg) origin-bottom',
                    bottom: 0,
                }}
            />
            {/* Layered luxury canopy */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 30,
                    height: 30,
                    background: leafColor,
                    borderRadius: '50% 50% 40% 40%',
                    transform: `translateZ(${height * 0.4}px) rotateY(${wind}deg) rotateX(${wind * 0.5}deg)`,
                    transformStyle: 'preserve-3d',
                    boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.15), 0 10px 15px rgba(0,0,0,0.1)',
                }}
            />
        </div>
    );
};

// Sleek Gatehouse
const GateHouse: React.FC<{ x: number; y: number; isActive: boolean }> = ({ x, y, isActive }) => {
    const wallColor = isActive ? '#f8fafc' : '#334155';
    const glassColor = isActive ? 'rgba(96, 165, 250, 0.4)' : 'rgba(15, 23, 42, 0.6)';
    const windowGlow = isActive ? 'rgba(251, 191, 36, 0.85)' : '#475569';

    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 25,
                height: 25,
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Shadow */}
            <div
                style={{
                    position: 'absolute',
                    inset: -2,
                    background: 'rgba(0,0,0,0.15)',
                    filter: 'blur(3px)',
                    transform: 'translateZ(-1px)',
                }}
            />
            {/* Main Structure */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 25,
                    height: 22,
                    transform: 'rotateX(-90deg) origin-bottom',
                    background: wallColor,
                    border: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Glowing window */}
                <div
                    style={{
                        width: 14,
                        height: 8,
                        background: windowGlow,
                        borderRadius: 1,
                        boxShadow: isActive ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none',
                    }}
                />
            </div>
            {/* Roof Canopy (Cantilevered glass/steel) */}
            <div
                style={{
                    position: 'absolute',
                    inset: -4,
                    transform: 'translateZ(22px)',
                    background: glassColor,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
            />
        </div>
    );
};

// Luxury Minimalist Villa (Two-tiered overlapping volumes)
const LuxuryVilla: React.FC<{ x: number; y: number; scale: number; isActive: number }> = ({ x, y, scale, isActive }) => {
    const wallColor = isActive > 0.5 ? '#ffffff' : '#475569';
    const accentWallColor = isActive > 0.5 ? '#78350f' : '#334155'; // Wooden textures
    const windowBg = isActive > 0.5 ? '#fbbf24' : '#1e293b';

    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 48 * scale,
                height: 48 * scale,
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Shadow */}
            <div
                style={{
                    position: 'absolute',
                    inset: -5,
                    background: 'rgba(0,0,0,0.12)',
                    filter: 'blur(6px)',
                    transform: 'translateZ(-1px)',
                }}
            />

            {/* Base Block (First Floor) */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: 48 * scale,
                    height: 25 * scale,
                    transform: 'rotateX(-90deg) origin-bottom',
                    background: wallColor,
                    border: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: 2,
                }}
            >
                {/* Large glass wall window grids */}
                <div style={{ display: 'flex', gap: 2 * scale }}>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: 8 * scale,
                                height: 14 * scale,
                                background: windowBg,
                                borderRadius: 1,
                                boxShadow: isActive > 0.5 ? '0 0 12px rgba(251, 191, 36, 0.7)' : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Upper Block (Second Floor - cantilevered/shifted design) */}
            <div
                style={{
                    position: 'absolute',
                    left: 5 * scale,
                    bottom: 0,
                    width: 38 * scale,
                    height: 20 * scale,
                    transform: `translateZ(${25 * scale}px) rotateX(-90deg) origin-bottom`,
                    background: accentWallColor,
                    border: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: 25 * scale,
                        height: 8 * scale,
                        background: windowBg,
                        borderRadius: 1,
                        boxShadow: isActive > 0.5 ? '0 0 10px rgba(251, 191, 36, 0.7)' : 'none',
                    }}
                />
            </div>

            {/* Flat Roof */}
            <div
                style={{
                    position: 'absolute',
                    left: 4 * scale,
                    top: 4 * scale,
                    width: 40 * scale,
                    height: 40 * scale,
                    transform: `translateZ(${45 * scale}px)`,
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            />
        </div>
    );
};

// Sleek Vehicle
const Vehicle: React.FC<{ x: number; y: number; rotZ: number }> = ({ x, y, rotZ }) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 20,
                height: 10,
                transform: `translateZ(3px) rotateZ(${rotZ}deg)`,
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Wheels shadow */}
            <div
                style={{
                    position: 'absolute',
                    inset: 1,
                    background: 'rgba(0,0,0,0.25)',
                    filter: 'blur(2px)',
                    transform: 'translateZ(-2px)',
                }}
            />
            {/* Chassis */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#e2e8f0', // Luxury silver-white car
                    borderRadius: '4px 6px 6px 4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                }}
            >
                {/* Windshield */}
                <div
                    style={{
                        position: 'absolute',
                        right: 3,
                        top: 2,
                        width: 5,
                        height: 6,
                        background: '#1e293b',
                        borderRadius: 1,
                    }}
                />
            </div>
        </div>
    );
};

// Resident / Dog walking
const Person: React.FC<{ x: number; y: number; frame: number; active: boolean; isDog?: boolean }> = ({
    x,
    y,
    frame,
    active,
    isDog = false,
}) => {
    if (!active) return null;

    // Gentle back-and-forth walking motion
    const movement = Math.sin(frame / 20) * 8;

    return (
        <div
            style={{
                position: 'absolute',
                left: `calc(${x}% + ${movement}px)`,
                top: `${y}%`,
                width: isDog ? 4 : 3,
                height: isDog ? 3 : 3,
                background: isDog ? '#78350f' : '#0f172a',
                borderRadius: isDog ? '1px' : '50%',
                transform: 'translateZ(4px)',
                boxShadow: '0 3px 4px rgba(0,0,0,0.2)',
            }}
        />
    );
};
