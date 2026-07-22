import { useCallback, useEffect, useState } from 'react';

import { SyncEngine, type SyncState } from '@/Resilience/SyncEngine';

const emptyState: SyncState = {
    pendingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    lastSyncAt: null,
    isSyncing: false,
    networkQuality: 'good',
    operations: [],
};

/**
 * Subscribe to SyncEngine state for UI (health monitor, queue inspector).
 */
export function useSyncStatus() {
    const [state, setState] = useState<SyncState>(emptyState);

    useEffect(() => {
        return SyncEngine.subscribe(setState);
    }, []);

    const syncNow = useCallback(async () => {
        return SyncEngine.replayQueue();
    }, []);

    const retryOperation = useCallback(async (operationId: string) => {
        return SyncEngine.retryOperation(operationId);
    }, []);

    const discardOperation = useCallback(async (operationId: string) => {
        return SyncEngine.discardOperation(operationId);
    }, []);

    return {
        ...state,
        syncNow,
        retryOperation,
        discardOperation,
    };
}

export default useSyncStatus;
