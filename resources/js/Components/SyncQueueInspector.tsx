import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import MobileSheet from '@/Components/MobileSheet';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import { SyncStatus, type QueuedOperation } from '@/Resilience';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

function statusLabel(status: SyncStatus): string {
    switch (status) {
        case SyncStatus.Pending:
            return 'Pending';
        case SyncStatus.Syncing:
            return 'Syncing';
        case SyncStatus.Synced:
            return 'Synced';
        case SyncStatus.Failed:
            return 'Failed';
        case SyncStatus.Conflict:
            return 'Conflict';
        default:
            return status;
    }
}

function formatTime(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function typeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function OperationRow({
    op,
    onRetry,
    onDiscard,
    busyId,
}: {
    op: QueuedOperation;
    onRetry: (id: string) => Promise<void>;
    onDiscard: (id: string) => Promise<void>;
    busyId: string | null;
}) {
    const isBusy = busyId === op.id;
    const isFailed = op.status === SyncStatus.Failed || op.status === SyncStatus.Conflict;

    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-slate-800/50">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{typeLabel(op.type)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {statusLabel(op.status)}
                        {op.retryCount > 0 ? ` · ${op.retryCount} retr${op.retryCount === 1 ? 'y' : 'ies'}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatTime(op.createdAt)}
                    </p>
                    {op.lastError && (
                        <p className="mt-2 text-[12px] leading-snug text-amber-700 dark:text-amber-400">{op.lastError}</p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {isFailed && (
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void onRetry(op.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition active:scale-95 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10"
                            aria-label="Retry operation"
                        >
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </button>
                    )}
                    {(isFailed || op.status === SyncStatus.Pending) && (
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void onDiscard(op.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm ring-1 ring-slate-200 transition active:scale-95 disabled:opacity-50 dark:bg-slate-900 dark:ring-white/10"
                            aria-label="Discard operation"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Slide-up inspector for pending / failed sync operations.
 */
export default function SyncQueueInspector({ isOpen, onClose }: Props) {
    const { operations, lastSyncAt, isSyncing, pendingCount, failedCount, conflictCount, syncNow, retryOperation, discardOperation } =
        useSyncStatus();
    const [busyId, setBusyId] = useState<string | null>(null);
    const [syncingAll, setSyncingAll] = useState(false);

    const visible = operations.filter((op) => op.status !== SyncStatus.Synced);
    const pending = visible.filter((op) => op.status === SyncStatus.Pending || op.status === SyncStatus.Syncing);
    const failed = visible.filter((op) => op.status === SyncStatus.Failed || op.status === SyncStatus.Conflict);

    const handleRetry = async (id: string) => {
        setBusyId(id);
        try {
            await retryOperation(id);
        } finally {
            setBusyId(null);
        }
    };

    const handleDiscard = async (id: string) => {
        setBusyId(id);
        try {
            await discardOperation(id);
        } finally {
            setBusyId(null);
        }
    };

    const handleSyncNow = async () => {
        setSyncingAll(true);
        try {
            await syncNow();
        } finally {
            setSyncingAll(false);
        }
    };

    return (
        <MobileSheet isOpen={isOpen} onClose={onClose} title="Sync queue">
            <div className="space-y-5 px-2 pb-4">
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium dark:bg-white/5">
                        {pendingCount} pending
                    </span>
                    {(failedCount > 0 || conflictCount > 0) && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            {failedCount + conflictCount} failed
                        </span>
                    )}
                    <span className="ml-auto text-[11px]">Last sync: {formatTime(lastSyncAt)}</span>
                </div>

                <button
                    type="button"
                    onClick={() => void handleSyncNow()}
                    disabled={syncingAll || isSyncing || visible.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-slate-900"
                >
                    {syncingAll || isSyncing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Syncing…
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Sync now
                        </>
                    )}
                </button>

                {visible.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">All caught up</p>
                        <p className="mt-1 text-[13px] text-slate-500">No pending or failed offline actions.</p>
                    </div>
                ) : (
                    <>
                        {failed.length > 0 && (
                            <section className="space-y-2">
                                <div className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Needs attention
                                </div>
                                {failed.map((op) => (
                                    <OperationRow
                                        key={op.id}
                                        op={op}
                                        onRetry={handleRetry}
                                        onDiscard={handleDiscard}
                                        busyId={busyId}
                                    />
                                ))}
                            </section>
                        )}

                        {pending.length > 0 && (
                            <section className="space-y-2">
                                <div className="text-[12px] font-semibold tracking-wide text-slate-500 uppercase">
                                    Pending
                                </div>
                                {pending.map((op) => (
                                    <OperationRow
                                        key={op.id}
                                        op={op}
                                        onRetry={handleRetry}
                                        onDiscard={handleDiscard}
                                        busyId={busyId}
                                    />
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>
        </MobileSheet>
    );
}
