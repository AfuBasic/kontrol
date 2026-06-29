import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';
import { useRef, useState, useEffect } from 'react';

interface Props {
    children: ReactNode;
    className?: string;
    range?: number; // How far the effect triggers
    strength?: number; // Magnetic strength multiplier
}

export default function MagneticButton({ children, className = '', range = 50, strength = 0.35 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150, mass: 0.15 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: MouseEvent) => {
        if (isReducedMotion || !ref.current) return;

        const { clientX, clientY } = e;
        const rect = ref.current.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;

        // Calculate distance from center
        const distance = Math.hypot(distanceX, distanceY);

        if (distance < range) {
            // Pull the button towards cursor proportional to distance
            x.set(distanceX * strength);
            y.set(distanceY * strength);
        } else {
            // Snap back
            x.set(0);
            y.set(0);
        }
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    if (isReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative">
            <motion.div style={{ x: springX, y: springY }} className={className}>
                {children}
            </motion.div>
        </div>
    );
}
