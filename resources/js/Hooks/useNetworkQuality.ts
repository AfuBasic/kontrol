import { useCallback, useEffect, useState } from 'react';

import { NetworkMonitor, type NetworkQuality, type NetworkSnapshot } from '@/Resilience/NetworkMonitor';

export interface UseNetworkQualityResult {
    quality: NetworkQuality;
    isOnline: boolean;
    rtt: number | null;
    effectiveType: string | null;
    checkedAt: string;
    /** Force an immediate reachability + RTT check. */
    refresh: (timeoutMs?: number) => Promise<NetworkSnapshot>;
    /** Server reachability helper (security offline scan). */
    isServerReachable: (timeoutMs?: number, path?: string) => Promise<boolean>;
}

/**
 * Reactive network quality (excellent | good | poor | offline).
 * Replaces inline checkServerReachable + navigator.onLine checks.
 */
export function useNetworkQuality(): UseNetworkQualityResult {
    const [snapshot, setSnapshot] = useState<NetworkSnapshot>(() => NetworkMonitor.getSnapshot());

    useEffect(() => {
        return NetworkMonitor.subscribe(setSnapshot);
    }, []);

    const refresh = useCallback((timeoutMs?: number) => NetworkMonitor.checkNow(timeoutMs), []);
    const isServerReachable = useCallback(
        (timeoutMs?: number, path?: string) => NetworkMonitor.isServerReachable(timeoutMs, path),
        []
    );

    return {
        quality: snapshot.quality,
        isOnline: snapshot.isOnline,
        rtt: snapshot.rtt,
        effectiveType: snapshot.effectiveType,
        checkedAt: snapshot.checkedAt,
        refresh,
        isServerReachable,
    };
}

export default useNetworkQuality;
