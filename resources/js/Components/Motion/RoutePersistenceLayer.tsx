import { usePage } from '@inertiajs/react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';
import GestureNavigationLayer from './GestureNavigationLayer';
import { useMotion } from './MotionProvider';
import type { MotionConfig } from './MotionProvider';

interface StackItem {
    url: string;
    key: string;
    element: React.ReactNode;
    isExiting?: boolean;
}

function checkIsTabSwitch(fromUrl: string, toUrl: string): boolean {
    const getTabRoot = (path: string) => {
        const parts = path.split('?')[0].split('/');
        // Assuming path is like /resident/visitors or /resident/visitors/show/1
        if (parts[1] === 'resident' && parts[2]) {
            return `/resident/${parts[2]}`;
        }
        return path;
    };

    const fromRoot = getTabRoot(fromUrl);
    const toRoot = getTabRoot(toUrl);

    return fromRoot !== toRoot;
}

interface StackPageItemProps {
    item: StackItem;
    index: number;
    stackLength: number;
    transitionType: 'push' | 'pop' | 'tab' | 'none';
    swipeX: MotionValue<number>;
    screenWidth: number;
    springs: MotionConfig['springs'];
    handleAnimationComplete: (itemKey: string) => void;
    handleSwipeBackComplete: () => void;
}

function StackPageItem({
    item,
    index,
    stackLength,
    transitionType,
    swipeX,
    screenWidth,
    springs,
    handleAnimationComplete,
    handleSwipeBackComplete,
}: StackPageItemProps) {
    const isTop = index === stackLength - 1;
    const isSecond = index === stackLength - 2;
    const isExiting = item.isExiting;

    // Call transforms unconditionally at the top level of StackPageItem
    const progress = useTransform(swipeX, [0, screenWidth], [0, 1]);
    const scale = useTransform(progress, [0, 1], [0.96, 1]);
    const xParallax = useTransform(progress, [0, 1], [-(screenWidth * 0.15), 0]);
    const opacity = useTransform(progress, [0, 1], [0.4, 0]);

    if (transitionType === 'tab') {
        return (
            <motion.div
                key={item.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute inset-0 h-full w-full"
            >
                {item.element}
            </motion.div>
        );
    }

    if (!isTop && !isSecond) {
        return null;
    }

    if (isExiting) {
        return (
            <motion.div
                key={item.key}
                initial={{ x: 0 }}
                animate={{ x: screenWidth }}
                onAnimationComplete={() => handleAnimationComplete(item.key)}
                transition={springs.smooth}
                className="absolute inset-0 z-50 h-full w-full shadow-2xl"
            >
                {item.element}
            </motion.div>
        );
    }

    if (isSecond) {
        return (
            <motion.div key={item.key} style={{ scale, x: xParallax }} className="absolute inset-0 z-10 h-full w-full">
                {item.element}
                <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0 bg-black" />
            </motion.div>
        );
    }

    if (isTop) {
        const isNewPush = transitionType === 'push';
        const canSwipeBack = stackLength > 1;

        const childContent = canSwipeBack ? (
            <GestureNavigationLayer x={swipeX} onSwipeBackComplete={handleSwipeBackComplete}>
                {item.element}
            </GestureNavigationLayer>
        ) : (
            item.element
        );

        return (
            <motion.div
                key={item.key}
                initial={isNewPush ? { x: screenWidth } : { x: 0 }}
                animate={{ x: 0 }}
                transition={springs.smooth}
                className="absolute inset-0 z-20 h-full w-full shadow-2xl"
            >
                {childContent}
            </motion.div>
        );
    }

    return null;
}

export default function RoutePersistenceLayer({ children }: { children: React.ReactNode }) {
    const { url } = usePage();
    const { springs } = useMotion();
    const [stack, setStack] = useState<StackItem[]>([]);
    const [transitionType, setTransitionType] = useState<'push' | 'pop' | 'tab' | 'none'>('none');

    // Shared motion value for real-time gesture tracking
    const swipeX = useMotionValue(0);
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

    // Track previous URL to compare
    const prevUrlRef = useRef<string>(url);

    useEffect(() => {
        const prevUrl = prevUrlRef.current;
        prevUrlRef.current = url;

        if (stack.length === 0) {
            setStack([{ url, key: url, element: children }]);
            return;
        }

        const isTab = checkIsTabSwitch(prevUrl, url);

        if (isTab) {
            setTransitionType('tab');
            // Reset stack to just the new tab page
            setStack([{ url, key: url, element: children }]);
            swipeX.set(0);
        } else {
            // Check if navigating back (URL already exists in stack)
            const existingIndex = stack.findIndex((item) => item.url === url);

            if (existingIndex !== -1 && existingIndex < stack.length - 1) {
                // POP transition (Backwards)
                setTransitionType('pop');

                // Mark all pages above existingIndex as exiting
                setStack((prev) => prev.map((item, idx) => (idx > existingIndex ? { ...item, isExiting: true } : item)));
            } else {
                // PUSH transition (Forwards)
                setTransitionType('push');
                setStack((prev) => [
                    ...prev.filter((item) => !item.isExiting), // Prune any stuck exiting items
                    { url, key: url, element: children },
                ]);
                swipeX.set(0);
            }
        }
    }, [url, children]);

    const handleAnimationComplete = (itemKey: string) => {
        // Once the exiting page finishes animating out, remove it from the stack
        setStack((prev) => prev.filter((item) => item.key !== itemKey || !item.isExiting));
    };

    const handleSwipeBackComplete = () => {
        // Complete the swipe animation to the end of screen
        swipeX.set(screenWidth);
        // Delay history pop slightly for fluid visual snap completion
        setTimeout(() => {
            window.history.back();
        }, 150);
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
            {stack.map((item, index) => (
                <StackPageItem
                    key={item.key}
                    item={item}
                    index={index}
                    stackLength={stack.length}
                    transitionType={transitionType}
                    swipeX={swipeX}
                    screenWidth={screenWidth}
                    springs={springs}
                    handleAnimationComplete={handleAnimationComplete}
                    handleSwipeBackComplete={handleSwipeBackComplete}
                />
            ))}
        </div>
    );
}
