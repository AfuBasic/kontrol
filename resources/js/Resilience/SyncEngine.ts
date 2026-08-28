import { isConflictStatus, resolveConflict, ConflictStrategy } from './ConflictResolver';
import { NetworkMonitor, type NetworkQuality } from './NetworkMonitor';
import { clear, createId, get, getAll, put, remove, type StoreConfig } from './OfflineStorage/BaseStore';
import { ResidentStore } from './OfflineStorage/ResidentStore';
import { computeBackoffMs, getRetryPolicy, hasExhaustedRetries, isExpired, type RetryPolicy, type RetryPolicyKey } from './RetryPolicy';
import { SyncStatus, type HttpMethod, type OperationType } from './SyncStatus';

export interface QueuedOperation {
    id: string;
    type: OperationType;
    endpoint: string;
    method: HttpMethod;
    payload: Record<string, unknown>;
    retryPolicyKey: string;
    conflictStrategy: ConflictStrategy;
    createdAt: string;
    status: SyncStatus;
    retryCount: number;
    lastAttemptAt: string | null;
    expiresAt: string | null;
    lastError?: string | null;
    lastErrorCode?: string | null;
}

export interface EnqueueInput {
    type: OperationType;
    endpoint: string;
    method?: HttpMethod;
    payload: Record<string, unknown>;
    retryPolicyKey?: RetryPolicyKey | string;
    conflictStrategy?: ConflictStrategy;
    id?: string;
}

export interface SyncResult {
    operationId: string;
    status: SyncStatus;
    httpStatus?: number;
    error?: string;
    response?: unknown;
}

export interface SyncState {
    pendingCount: number;
    failedCount: number;
    conflictCount: number;
    lastSyncAt: string | null;
    isSyncing: boolean;
    networkQuality: NetworkQuality;
    operations: QueuedOperation[];
}

type Listener = (state: SyncState) => void;

const QUEUE_STORE = 'operations';

const queueConfig: StoreConfig = {
    dbName: 'kontrol-sync',
    version: 1,
    stores: [
        {
            name: QUEUE_STORE,
            keyPath: 'id',
            indexes: [
                { name: 'status', keyPath: 'status' },
                { name: 'type', keyPath: 'type' },
            ],
        },
    ],
};

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
}

function getCsrfHeaders(): Record<string, string> {
    const xsrf = readCookie('XSRF-TOKEN');
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
    }

    return headers;
}

function policyFor(op: QueuedOperation): RetryPolicy {
    return getRetryPolicy(op.retryPolicyKey);
}

/**
 * Unified offline write sync engine - singleton.
 * Queues domain operations, retries with per-type policies, replays on reconnect.
 */
class SyncEngineImpl {
    private listeners = new Set<Listener>();
    private isSyncing = false;
    private lastSyncAt: string | null = null;
    private networkQuality: NetworkQuality = NetworkMonitor.getSnapshot().quality;
    private started = false;
    private unsubNetwork: (() => void) | null = null;
    private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private hydrated = false;

    async start(): Promise<void> {
        if (this.started || typeof window === 'undefined') {
            return;
        }

        this.started = true;
        await this.hydrate();

        this.unsubNetwork = NetworkMonitor.subscribe((snapshot) => {
            const wasOffline = this.networkQuality === 'offline';
            this.networkQuality = snapshot.quality;
            void this.emit();

            if (wasOffline && snapshot.isOnline) {
                void this.replayQueue();
            }
        });

        if (this.networkQuality !== 'offline') {
            void this.replayQueue();
        }
    }

    stop(): void {
        this.unsubNetwork?.();
        this.unsubNetwork = null;
        this.started = false;
        this.retryTimers.forEach((timer) => clearTimeout(timer));
        this.retryTimers.clear();
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        void this.start().then(() => this.emit());

        return () => {
            this.listeners.delete(listener);
        };
    }

    async getState(): Promise<SyncState> {
        await this.hydrate();
        const operations = await this.loadOperations();

        return this.buildState(operations);
    }

    getStateSync(): SyncState {
        return {
            pendingCount: 0,
            failedCount: 0,
            conflictCount: 0,
            lastSyncAt: this.lastSyncAt,
            isSyncing: this.isSyncing,
            networkQuality: this.networkQuality,
            operations: [],
        };
    }

    async enqueue(input: EnqueueInput): Promise<string> {
        await this.start();

        const policy = getRetryPolicy(input.retryPolicyKey ?? input.type);
        const now = new Date().toISOString();
        const id = input.id ?? createId(input.type);

        const operation: QueuedOperation = {
            id,
            type: input.type,
            endpoint: input.endpoint,
            method: input.method ?? 'POST',
            payload: input.payload,
            retryPolicyKey: policy.key,
            conflictStrategy: input.conflictStrategy ?? ConflictStrategy.ServerWins,
            createdAt: now,
            status: SyncStatus.Pending,
            retryCount: 0,
            lastAttemptAt: null,
            expiresAt: policy.ttlMs ? new Date(Date.now() + policy.ttlMs).toISOString() : null,
            lastError: null,
            lastErrorCode: null,
        };

        await put(queueConfig, QUEUE_STORE, operation);
        await this.emit();

        if (this.networkQuality !== 'offline' && policy.autoRetry) {
            void this.replayQueue();
        }

        return id;
    }

    async replayQueue(): Promise<SyncResult[]> {
        if (this.isSyncing) {
            return [];
        }

        await this.hydrate();

        if (this.networkQuality === 'offline') {
            return [];
        }

        this.isSyncing = true;
        await this.emit();

        const results: SyncResult[] = [];

        try {
            const operations = await this.loadOperations();
            const actionable = operations.filter(
                (op) => op.status === SyncStatus.Pending || op.status === SyncStatus.Failed || op.status === SyncStatus.Syncing,
            );

            for (const op of actionable) {
                const policy = policyFor(op);

                if (isExpired(op.createdAt, policy) || (op.expiresAt && Date.parse(op.expiresAt) < Date.now())) {
                    await remove(queueConfig, QUEUE_STORE, op.id);
                    results.push({ operationId: op.id, status: SyncStatus.Failed, error: 'Operation expired' });
                    continue;
                }

                if (op.status === SyncStatus.Failed && !policy.autoRetry) {
                    continue;
                }

                if (op.status === SyncStatus.Failed && hasExhaustedRetries(policy, op.retryCount)) {
                    continue;
                }

                const result = await this.execute(op);
                results.push(result);
            }

            this.lastSyncAt = new Date().toISOString();
        } finally {
            this.isSyncing = false;
            await this.emit();
        }

        return results;
    }

    async retryOperation(operationId: string): Promise<SyncResult> {
        await this.hydrate();
        const op = await get<QueuedOperation>(queueConfig, QUEUE_STORE, operationId);

        if (!op) {
            return { operationId, status: SyncStatus.Failed, error: 'Operation not found' };
        }

        op.status = SyncStatus.Pending;
        op.lastError = null;
        op.lastErrorCode = null;
        await put(queueConfig, QUEUE_STORE, op);
        await this.emit();

        return this.execute(op);
    }

    async discardOperation(operationId: string): Promise<void> {
        await remove(queueConfig, QUEUE_STORE, operationId);
        const timer = this.retryTimers.get(operationId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(operationId);
        }
        await this.emit();
    }

    async clearSynced(): Promise<void> {
        const operations = await this.loadOperations();
        await Promise.all(operations.filter((op) => op.status === SyncStatus.Synced).map((op) => remove(queueConfig, QUEUE_STORE, op.id)));
        await this.emit();
    }

    async clearAll(): Promise<void> {
        await clear(queueConfig, QUEUE_STORE);
        await this.emit();
    }

    private async execute(op: QueuedOperation): Promise<SyncResult> {
        const policy = policyFor(op);

        op.status = SyncStatus.Syncing;
        op.lastAttemptAt = new Date().toISOString();
        await put(queueConfig, QUEUE_STORE, op);
        await this.emit();

        try {
            const response = await fetch(op.endpoint, {
                method: op.method,
                headers: getCsrfHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify(op.payload),
            });

            let body: unknown = null;
            const contentType = response.headers.get('content-type') ?? '';

            if (contentType.includes('application/json')) {
                body = await response.json().catch(() => null);
            }

            const bodyRecord = body as { success?: boolean; error?: string; code?: string; retryable?: boolean } | null;
            // Some endpoints return 2xx with { success: false } (e.g. partial sync failures).
            const logicalSuccess = response.ok && bodyRecord?.success !== false;

            if (logicalSuccess) {
                op.status = SyncStatus.Synced;
                op.lastError = null;
                op.lastErrorCode = null;
                await put(queueConfig, QUEUE_STORE, op);

                if (op.type === 'visitor_pass') {
                    void ResidentStore.removePendingPass(op.id);
                } else if (op.type === 'incident') {
                    void ResidentStore.removePendingIncident(op.id);
                }

                // Drop successfully synced ops after a short retention window.
                setTimeout(() => {
                    void remove(queueConfig, QUEUE_STORE, op.id).then(() => this.emit());
                }, 3_000);

                await this.emit();

                return { operationId: op.id, status: SyncStatus.Synced, httpStatus: response.status, response: body };
            }

            if (response.ok && bodyRecord?.success === false) {
                const message = bodyRecord.error ?? 'Sync rejected by server';
                const retryable = bodyRecord.retryable !== false;

                op.retryCount += 1;
                op.lastError = message;
                op.lastErrorCode = bodyRecord.code ?? 'SYNC_REJECTED';

                if (!retryable || hasExhaustedRetries(policy, op.retryCount) || !policy.autoRetry) {
                    op.status = SyncStatus.Failed;
                    await put(queueConfig, QUEUE_STORE, op);
                    await this.emit();

                    return {
                        operationId: op.id,
                        status: SyncStatus.Failed,
                        httpStatus: response.status,
                        error: message,
                        response: body,
                    };
                }

                op.status = SyncStatus.Pending;
                await put(queueConfig, QUEUE_STORE, op);
                this.scheduleRetry(op, policy);
                await this.emit();

                return {
                    operationId: op.id,
                    status: SyncStatus.Pending,
                    httpStatus: response.status,
                    error: message,
                    response: body,
                };
            }

            if (isConflictStatus(response.status)) {
                const resolution = resolveConflict(op.conflictStrategy, { operationType: op.type });
                op.status = resolution.status;
                op.lastError = resolution.message;
                op.lastErrorCode = 'CONFLICT';
                await put(queueConfig, QUEUE_STORE, op);
                await this.emit();

                if (typeof window !== 'undefined' && resolution.notifyUser) {
                    window.dispatchEvent(
                        new CustomEvent('kontrol:sync-conflict', {
                            detail: { operationId: op.id, message: resolution.message, type: op.type },
                        }),
                    );
                }

                return {
                    operationId: op.id,
                    status: resolution.status,
                    httpStatus: response.status,
                    error: resolution.message,
                    response: body,
                };
            }

            const errorBody = body as { error?: string; code?: string; retryable?: boolean; message?: string } | null;
            const message = errorBody?.error ?? errorBody?.message ?? `HTTP ${response.status}`;
            const retryable = errorBody?.retryable !== false && response.status >= 500;

            op.retryCount += 1;
            op.lastError = message;
            op.lastErrorCode = errorBody?.code ?? `HTTP_${response.status}`;

            if (!retryable || hasExhaustedRetries(policy, op.retryCount) || !policy.autoRetry) {
                op.status = SyncStatus.Failed;
                await put(queueConfig, QUEUE_STORE, op);
                await this.emit();

                return {
                    operationId: op.id,
                    status: SyncStatus.Failed,
                    httpStatus: response.status,
                    error: message,
                    response: body,
                };
            }

            op.status = SyncStatus.Pending;
            await put(queueConfig, QUEUE_STORE, op);
            this.scheduleRetry(op, policy);
            await this.emit();

            return {
                operationId: op.id,
                status: SyncStatus.Pending,
                httpStatus: response.status,
                error: message,
                response: body,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Network error';
            op.retryCount += 1;
            op.lastError = message;
            op.lastErrorCode = 'NETWORK_ERROR';

            if (hasExhaustedRetries(policy, op.retryCount) || !policy.autoRetry) {
                op.status = SyncStatus.Failed;
                await put(queueConfig, QUEUE_STORE, op);
                await this.emit();

                return { operationId: op.id, status: SyncStatus.Failed, error: message };
            }

            op.status = SyncStatus.Pending;
            await put(queueConfig, QUEUE_STORE, op);
            this.scheduleRetry(op, policy);
            await this.emit();

            return { operationId: op.id, status: SyncStatus.Pending, error: message };
        }
    }

    private scheduleRetry(op: QueuedOperation, policy: RetryPolicy): void {
        if (this.retryTimers.has(op.id)) {
            clearTimeout(this.retryTimers.get(op.id));
        }

        const delay = computeBackoffMs(policy, Math.max(0, op.retryCount - 1));
        const timer = setTimeout(() => {
            this.retryTimers.delete(op.id);
            if (this.networkQuality !== 'offline') {
                void this.retryOperation(op.id);
            }
        }, delay);

        this.retryTimers.set(op.id, timer);
    }

    private async loadOperations(): Promise<QueuedOperation[]> {
        try {
            const ops = await getAll<QueuedOperation>(queueConfig, QUEUE_STORE);
            if (!Array.isArray(ops)) {
                return [];
            }

            return [...ops].sort((a, b) => Date.parse(a?.createdAt || '0') - Date.parse(b?.createdAt || '0'));
        } catch {
            return [];
        }
    }

    private buildState(operations: QueuedOperation[]): SyncState {
        const pendingCount = operations.filter((op) => op.status === SyncStatus.Pending || op.status === SyncStatus.Syncing).length;
        const failedCount = operations.filter((op) => op.status === SyncStatus.Failed).length;
        const conflictCount = operations.filter((op) => op.status === SyncStatus.Conflict).length;

        return {
            pendingCount,
            failedCount,
            conflictCount,
            lastSyncAt: this.lastSyncAt,
            isSyncing: this.isSyncing,
            networkQuality: this.networkQuality,
            operations,
        };
    }

    private async hydrate(): Promise<void> {
        if (this.hydrated || typeof indexedDB === 'undefined') {
            this.hydrated = true;

            return;
        }

        try {
            await this.loadOperations();
        } catch {
            // IndexedDB unavailable (private mode / SSR) - continue in-memory empty.
        }

        this.hydrated = true;
    }

    private async emit(): Promise<void> {
        const operations = await this.loadOperations();
        const state = this.buildState(operations);
        this.listeners.forEach((listener) => listener(state));
    }
}

export const SyncEngine = new SyncEngineImpl();
