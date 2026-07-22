import { useNetworkQuality } from './useNetworkQuality';

/**
 * Simple online/offline boolean derived from NetworkMonitor.
 * Prefer useNetworkQuality when poor-connection behavior matters.
 */
export function useOnlineStatus(): { isOnline: boolean } {
    const { isOnline } = useNetworkQuality();

    return { isOnline };
}

export default useOnlineStatus;
