import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';
import { useEffect, useState } from 'react';

interface Props {
    children: ReactNode;
    className?: string;
    maxRotation?: number; // Maximum tilt angle in degrees
}

export default function InteractiveTilt({ children, className = '', maxRotation = 15 }: Props) {
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Motion values for coordinates
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    // Dynamic spring physics
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const rotateX = useSpring(useTransform(y, [0, 1], [maxRotation, -maxRotation]), springConfig);
    const rotateY = useSpring(useTransform(x, [0, 1], [-maxRotation, maxRotation]), springConfig);

    // Subtle highlight/glare coordinates
    const glareX = useSpring(useTransform(x, [0, 1], ['0%', '100%']), springConfig);
    const glareY = useSpring(useTransform(y, [0, 1], ['0%', '100%']), springConfig);

    const glareBackground = useTransform(
        [glareX, glareY],
        ([gx, gy]) => `radial-gradient(circle 250px at ${gx} ${gy}, rgba(255,255,255,0.12), transparent 80%)`,
    );

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (isReducedMotion) return;

        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();

        // Calculate mouse position relative to element bounds (0 to 1)
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        x.set(mouseX);
        y.set(mouseY);
    };

    const handleMouseLeave = () => {
        // Reset to center smoothly
        x.set(0.5);
        y.set(0.5);
    };

    if (isReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
            className={`relative transition-shadow duration-300 ${className}`}
        >
            <div style={{ transform: 'translateZ(0px)' }} className="h-full w-full">
                {children}
            </div>

            {/* Premium Glare Effect overlay */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                style={{
                    background: glareBackground,
                    mixBlendMode: 'overlay',
                }}
            />
        </motion.div>
    );
}
