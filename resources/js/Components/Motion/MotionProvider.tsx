import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import React, { createContext, useContext, useMemo } from 'react';

export type TransitionType = 'push' | 'pop' | 'tab' | 'none';

export interface MotionConfig {
    // Spring physics constants
    springs: {
        stiff: { type: 'spring'; stiffness: number; damping: number; mass: number };
        smooth: { type: 'spring'; stiffness: number; damping: number; mass: number };
        bouncy: { type: 'spring'; stiffness: number; damping: number; mass: number };
    };
    // Duration timings (fallback when spring is not used)
    timings: {
        fast: number;
        route: number;
        tab: number;
    };
    // Haptic feedback helpers
    haptics: {
        light: () => void;
        medium: () => void;
        heavy: () => void;
        success: () => void;
        error: () => void;
    };
}

const MotionContext = createContext<MotionConfig | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
    const value = useMemo<MotionConfig>(() => {
        const triggerHaptic = (action: () => Promise<void>) => {
            if (Capacitor.isNativePlatform()) {
                action().catch((err) => console.warn('Haptics failed:', err));
            }
        };

        return {
            springs: {
                stiff: { type: 'spring', stiffness: 400, damping: 35, mass: 1 },
                smooth: { type: 'spring', stiffness: 320, damping: 32, mass: 1 }, // Perfect iOS feel
                bouncy: { type: 'spring', stiffness: 300, damping: 20, mass: 1 },
            },
            timings: {
                fast: 0.18,
                route: 0.38,
                tab: 0.15,
            },
            haptics: {
                light: () => triggerHaptic(() => Haptics.impact({ style: ImpactStyle.Light })),
                medium: () => triggerHaptic(() => Haptics.impact({ style: ImpactStyle.Medium })),
                heavy: () => triggerHaptic(() => Haptics.impact({ style: ImpactStyle.Heavy })),
                success: () => triggerHaptic(() => Haptics.notification({ type: NotificationType.Success })),
                error: () => triggerHaptic(() => Haptics.notification({ type: NotificationType.Error })),
            },
        };
    }, []);

    return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
    const context = useContext(MotionContext);
    if (!context) {
        throw new Error('useMotion must be used within a MotionProvider');
    }
    return context;
}
