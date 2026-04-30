import { SparklesIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
    children: React.ReactNode;
}

export default function PullToRefresh({ children }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const y = useMotionValue(0);
    const pullThreshold = 60;

    // Transform drag distance to opacity and rotation
    const opacity = useTransform(y, [0, pullThreshold], [0, 1]);
    const rotate = useTransform(y, [0, pullThreshold], [0, 360]);

    useEffect(() => {
        const unsubscribeY = y.on('change', (latest) => {
            if (latest >= pullThreshold && !isRefreshing) {
                handleRefresh();
            }
        });

        return () => unsubscribeY();
    }, [isRefreshing]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            router.reload({
                onFinish: () => {
                    setIsRefreshing(false);
                    animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
                    setIsPulling(false);
                },
            });
        }, 800);
    };

    return (
        <div className="relative overflow-visible">
            {/* Branded Pulse Indicator */}
            <motion.div
                style={{ y, opacity }}
                className="absolute top-0 right-0 left-0 z-50 flex justify-center pt-4 pointer-events-none"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-slate-200">
                    <motion.div style={{ rotate }}>
                        <SparklesIcon className="h-5 w-5 text-[#1F6FDB]" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Content Container */}
            <motion.div
                onPan={(e, info) => {
                    if (isRefreshing) return;

                    // Only start pulling if we're at the top and moving DOWN
                    if (!isPulling) {
                        if (window.scrollY <= 0 && info.offset.y > 5) {
                            setIsPulling(true);
                        } else {
                            return;
                        }
                    }

                    if (info.offset.y > 0) {
                        const newY = info.offset.y * 0.5;
                        y.set(newY);
                    } else {
                        y.set(0);
                    }
                }}
                onPanEnd={(e, info) => {
                    const currentY = y.get();
                    if (isPulling && currentY >= pullThreshold && !isRefreshing) {
                        handleRefresh();
                    } else {
                        animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
                        setIsPulling(false);
                    }
                }}
                style={{ y, touchAction: isPulling ? 'none' : 'auto' }}
                className="relative z-10"
            >
                {children}
            </motion.div>
        </div>
    );
}
