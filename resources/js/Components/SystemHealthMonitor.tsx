import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, Wifi, WifiOff, Zap } from 'lucide-react';
import { useState } from 'react';

import SyncQueueInspector from '@/Components/SyncQueueInspector';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { useSyncStatus } from '@/Hooks/useSyncStatus';

interface Props {
    /** Compact for headers; security uses slightly larger touch target. */
    size?: 'sm' | 'md';
    className?: string;
    /** Hide when fully healthy with no pending work (less chrome for admin). */
    hideWhenHealthy?: boolean;
}

type HealthTone = 'emerald' | 'blue' | 'amber' | 'slate';

interface HealthView {
    tone: HealthTone;
    label: string;
    icon: typeof Wifi;
    spin?: boolean;
}

function resolveHealth(
    quality: ReturnType<typeof useNetworkQuality>['quality'],
    isSyncing: boolean,
    pendingCount: number,
    failedCount: number,
    conflictCount: number,
): HealthView {
    if (quality === 'offline') {
        return {
            tone: 'slate',
            label: pendingCount > 0 ? `Offline — ${pendingCount} pending` : 'Offline',
            icon: WifiOff,
        };
    }

    if (quality === 'poor') {
        return {
            tone: 'amber',
            label: 'Limited connectivity',
            icon: Zap,
        };
    }

    if (failedCount > 0 || conflictCount > 0) {
        const total = failedCount + conflictCount;

        return {
            tone: 'amber',
            label: `${total} action${total === 1 ? '' : 's'} failed`,
            icon: AlertTriangle,
        };
    }

    if (isSyncing || pendingCount > 0) {
        return {
            tone: 'blue',
            label: isSyncing
                ? `Syncing ${pendingCount || ''}…`.replace('  ', ' ')
                : `${pendingCount} pending`,
            icon: Loader2,
            spin: true,
        };
    }

    return {
        tone: 'emerald',
        label: 'System healthy',
        icon: Wifi,
    };
}

const toneClasses: Record<HealthTone, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10',
};

/**
 * Compact system health indicator — opens SyncQueueInspector on click.
 */
export default function SystemHealthMonitor({ size = 'sm', className = '', hideWhenHealthy = false }: Props) {
    const { quality } = useNetworkQuality();
    const { pendingCount, failedCount, conflictCount, isSyncing } = useSyncStatus();
    const [inspectorOpen, setInspectorOpen] = useState(false);

    const health = resolveHealth(quality, isSyncing, pendingCount, failedCount, conflictCount);
    const Icon = health.spin ? Loader2 : health.icon;
    const isHealthy = health.tone === 'emerald';

    if (hideWhenHealthy && isHealthy) {
        return (
            <>
                <SyncQueueInspector isOpen={inspectorOpen} onClose={() => setInspectorOpen(false)} />
            </>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-full ring-1 transition active:scale-[0.98] ${toneClasses[health.tone]} ${
                    size === 'md' ? 'px-3 py-1.5 text-[12px] font-semibold' : 'px-2.5 py-1 text-[11px] font-semibold'
                } ${className}`}
                aria-label={`System health: ${health.label}. Open sync queue.`}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={health.label}
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        className="inline-flex items-center gap-1.5"
                    >
                        <Icon className={`${size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} ${health.spin ? 'animate-spin' : ''}`} />
                        <span className="max-w-[10rem] truncate sm:max-w-none">{health.label}</span>
                    </motion.span>
                </AnimatePresence>
            </button>

            <SyncQueueInspector isOpen={inspectorOpen} onClose={() => setInspectorOpen(false)} />
        </>
    );
}
