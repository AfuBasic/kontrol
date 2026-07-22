import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { useSyncStatus } from '@/Hooks/useSyncStatus';

interface Props {
    /** Larger copy for security guards on duty. */
    variant?: 'default' | 'security';
    className?: string;
}

/**
 * Global offline strip — slides in when quality is offline, out on reconnect.
 */
export default function OfflineBanner({ variant = 'default', className = '' }: Props) {
    const { quality, isOnline } = useNetworkQuality();
    const { pendingCount } = useSyncStatus();

    const show = quality === 'offline' || !isOnline;
    const isSecurity = variant === 'security';

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={`overflow-hidden ${className}`}
                    role="status"
                    aria-live="polite"
                >
                    <div
                        className={`flex items-center justify-center gap-2 bg-slate-800 px-4 text-white ${
                            isSecurity ? 'py-3 text-sm font-semibold' : 'py-2 text-xs font-medium'
                        }`}
                    >
                        <WifiOff className={isSecurity ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
                        <span>
                            {isSecurity ? 'Offline mode' : "You're offline"}
                            {pendingCount > 0
                                ? ` — ${pendingCount} action${pendingCount === 1 ? '' : 's'} pending sync`
                                : isSecurity
                                  ? ' — scanning from cache'
                                  : ''}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
