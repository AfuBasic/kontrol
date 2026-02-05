import { router } from '@inertiajs/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

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

    const handleRefresh = useCallback(async () => {
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
    }, [onRefresh, y]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let startY = 0;
        let isDragging = false;
        let initialScrollTop = 0;

        // Check if page is at top - more permissive check for mobile
        const getScrollTop = () => {
            return Math.max(0, window.scrollY || document.documentElement.scrollTop || document.body.scrollTop);
        };

        const isAtTop = () => {
            return getScrollTop() <= 5; // Allow small tolerance for mobile bounce
        };

        const handleTouchStart = (e: TouchEvent) => {
            // Don't start if already refreshing
            if (isRefreshing) return;

            initialScrollTop = getScrollTop();

            if (isAtTop()) {
                startY = e.touches[0].clientY;
                isDragging = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // Only allow dragging down if at top and pulling down
            if (diff > 0 && isAtTop()) {
                // Add resistance
                const damped = Math.min(diff * 0.4, 150);
                y.set(damped);

                // Prevent default pull-to-refresh of browser
                if (e.cancelable) e.preventDefault();
            } else if (diff < -10 || getScrollTop() > initialScrollTop + 10) {
                // User is scrolling up or page has scrolled down, cancel the drag
                isDragging = false;
                animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
            }
        };

        const handleTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            const currentY = y.get();

            if (currentY > REFRESH_THRESHOLD && !isRefreshing) {
                handleRefresh();
            } else {
                animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
            }
        };

        // Use document-level listeners for more reliable capture
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [y, isRefreshing, handleRefresh]);

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
