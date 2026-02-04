import { router } from '@inertiajs/react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface Props {
    children: React.ReactNode;
    onRefresh?: () => Promise<void> | void;
}

export default function PullToRefresh({ children, onRefresh }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, 100], [0, 360]);
    const opacity = useTransform(y, [0, 50], [0, 1]);
    const scale = useTransform(y, [0, 80], [0.5, 1]);

    // Threshold to trigger refresh
    const REFRESH_THRESHOLD = 80;

    async function handleRefresh() {
        setIsRefreshing(true);
        try {
            if (onRefresh) {
                await onRefresh();
            } else {
                // Default to Inertia reload
                await new Promise<void>((resolve) => {
                    router.reload({
                        onFinish: () => resolve(),
                    });
                });
            }
        } finally {
            // Min wait to show animation
            setTimeout(() => {
                setIsRefreshing(false);
                y.set(0);
            }, 500);
        }
    }

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let startY = 0;
        let isDragging = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isDragging = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // Only allow dragging down if at top
            if (diff > 0 && window.scrollY <= 0) {
                // Add resistance
                const damped = Math.min(diff * 0.4, 150);
                y.set(damped);

                // Prevent default pull-to-refresh of browser
                if (e.cancelable) e.preventDefault();
            } else {
                isDragging = false;
                y.set(0);
            }
        };

        const handleTouchEnd = () => {
            isDragging = false;
            const currentY = y.get();

            if (currentY > REFRESH_THRESHOLD) {
                handleRefresh();
            } else {
                animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [y, isRefreshing]);

    return (
        <div ref={containerRef} className="relative min-h-screen">
            {/* Refresh Indicator */}
            <motion.div style={{ y, opacity, scale }} className="fixed -top-10 left-0 z-50 flex w-full justify-center pt-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
                    <motion.div style={{ rotate }} animate={isRefreshing ? { rotate: 360 } : {}}>
                        <Loader2 className={`h-6 w-6 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Content with offset */}
            <motion.div style={{ y }} animate={isRefreshing ? { y: REFRESH_THRESHOLD } : {}} className="min-h-screen">
                {children}
            </motion.div>
        </div>
    );
}
