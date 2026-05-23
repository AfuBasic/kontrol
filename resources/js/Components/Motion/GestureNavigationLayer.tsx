import type { MotionValue } from 'framer-motion';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useMotion } from './MotionProvider';

interface GestureNavigationLayerProps {
    children: React.ReactNode;
    onSwipeBackComplete: () => void;
    onSwipeProgress?: (progress: number) => void;
    x: MotionValue<number>;
}

export default function GestureNavigationLayer({ children, onSwipeBackComplete, onSwipeProgress, x }: GestureNavigationLayerProps) {
    const { haptics } = useMotion();
    const [isSwiping, setIsSwiping] = useState(false);
    const startXRef = useRef<number | null>(null);
    const [screenWidth, setScreenWidth] = useState(375);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setScreenWidth(window.innerWidth);
            const handleResize = () => setScreenWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // We only trigger swipe back if the touch starts near the left edge of the screen
    const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch && touch.clientX < 28) {
            setIsSwiping(true);
            startXRef.current = touch.clientX;
            x.set(0);
            haptics.light(); // Subtle start feedback
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isSwiping || startXRef.current === null) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startXRef.current;
        if (deltaX > 0) {
            x.set(deltaX);
            const progress = Math.min(deltaX / screenWidth, 1);
            if (onSwipeProgress) {
                onSwipeProgress(progress);
            }
        }
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;
        setIsSwiping(false);
        const currentX = x.get();
        startXRef.current = null;

        // If swiped more than 30% of screen width, trigger back navigation
        if (currentX > screenWidth * 0.3) {
            haptics.medium();
            onSwipeBackComplete();
        } else {
            // Cancel swipe back and bounce page back to 0
            x.set(0);
            if (onSwipeProgress) {
                onSwipeProgress(0);
            }
        }
    };

    useEffect(() => {
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isSwiping, screenWidth]);

    return (
        <motion.div style={{ x }} className="absolute inset-0 h-full w-full touch-none bg-white">
            {children}
        </motion.div>
    );
}
