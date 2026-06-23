import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { router } from '@inertiajs/react';
import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';

interface Props {
    children: React.ReactNode;
    onRefresh?: () => void;
    className?: string;
}

const PULL_THRESHOLD = 160;

export default function PullToRefresh({ children, onRefresh, className }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const springY = useSpring(y, { stiffness: 400, damping: 40 });

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isRefreshing) return;

        // Only allow pull if we are at the top of the scroll
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (scrollTop > 0) return;

        const startY = e.touches[0].pageY;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].pageY;
            const diff = currentY - startY;

            // If the user scrolls down natively or scroll position is not top, abort pull-to-refresh
            if (diff <= 0 || (window.scrollY || document.documentElement.scrollTop) > 0) {
                return;
            }

            // Apply resistance
            const resistance = 0.4;
            const cappedDiff = Math.min(diff * resistance, PULL_THRESHOLD + 20);
            y.set(cappedDiff);
            setPullProgress(Math.min(cappedDiff / PULL_THRESHOLD, 1));

            // Trigger haptic feedback when threshold is hit
            if (cappedDiff >= PULL_THRESHOLD && pullProgress < 1) {
                if (Capacitor.isNativePlatform()) {
                    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                }
            }
        };

        const handleTouchEnd = () => {
            const finalY = y.get();
            if (finalY >= PULL_THRESHOLD) {
                triggerRefresh();
            } else {
                y.set(0);
                setPullProgress(0);
            }
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
    };

    const triggerRefresh = () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        y.set(PULL_THRESHOLD / 2); // Stay at mid-point while loading

        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        }

        if (onRefresh) {
            onRefresh();
        } else {
            router.reload({
                onFinish: () => {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        y.set(0);
                        setPullProgress(0);
                    }, 500);
                },
            });
        }
    };

    return (
        <div ref={containerRef} className={`relative min-h-full ${className || ''}`} onTouchStart={handleTouchStart}>
            {/* Refresh Indicator */}
            <div
                className="pointer-events-none absolute top-0 right-0 left-0 z-50 flex items-center justify-center overflow-hidden"
                style={{ height: PULL_THRESHOLD }}
            >
                <motion.div
                    style={{
                        y: useTransform(springY, [0, PULL_THRESHOLD], [-40, 0]),
                        opacity: useTransform(springY, [0, PULL_THRESHOLD / 2], [0, 1]),
                        scale: useTransform(springY, [0, PULL_THRESHOLD], [0.8, 1]),
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-100"
                >
                    {isRefreshing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    ) : (
                        <div className="relative h-5 w-5">
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-slate-200"
                                style={{
                                    borderTopColor: 'rgb(79 70 229)',
                                    rotate: pullProgress * 360,
                                }}
                            />
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Content Container */}
            <motion.div style={pullProgress > 0 || isRefreshing ? { y: springY } : undefined}>{children}</motion.div>
        </div>
    );
}
