import { SyncStatus } from './SyncStatus';

/**
 * How to resolve a conflict when the server rejects a queued write.
 * V1 defaults to ServerWins for all operations.
 */
export enum ConflictStrategy {
    ServerWins = 'server_wins',
    ClientWins = 'client_wins',
    Notify = 'notify',
}

export interface ConflictResolution {
    status: SyncStatus.Conflict | SyncStatus.Failed | SyncStatus.Pending;
    discardLocal: boolean;
    notifyUser: boolean;
    message: string;
}

/**
 * Resolve a conflict given HTTP status / strategy.
 * ServerWins (default): discard optimistic local state and mark Conflict.
 */
export function resolveConflict(
    strategy: ConflictStrategy = ConflictStrategy.ServerWins,
    context?: { operationType?: string },
): ConflictResolution {
    const label = context?.operationType?.replace(/_/g, ' ') ?? 'change';

    switch (strategy) {
        case ConflictStrategy.ClientWins:
            return {
                status: SyncStatus.Pending,
                discardLocal: false,
                notifyUser: true,
                message: `Your offline ${label} conflicted with the server. Retrying with your version.`,
            };

        case ConflictStrategy.Notify:
            return {
                status: SyncStatus.Conflict,
                discardLocal: false,
                notifyUser: true,
                message: `Your offline ${label} conflicts with the server. Review and resolve manually.`,
            };

        case ConflictStrategy.ServerWins:
        default:
            return {
                status: SyncStatus.Conflict,
                discardLocal: true,
                notifyUser: true,
                message: `This ${label} was modified while you were offline. Your offline version was not saved.`,
            };
    }
}

export function isConflictStatus(httpStatus: number): boolean {
    return httpStatus === 409;
}
