import type { SyncStatus } from '../SyncStatus';
import { clear, get, getAll, put, remove, type StoreConfig } from './BaseStore';

const PASSES_STORE = 'pending_passes';
const INCIDENTS_STORE = 'pending_incidents';
const STALE_STORE = 'stale_cache';

const config: StoreConfig = {
    dbName: 'kontrol-resident',
    version: 1,
    stores: [
        { name: PASSES_STORE, keyPath: 'id' },
        { name: INCIDENTS_STORE, keyPath: 'id' },
        { name: STALE_STORE, keyPath: 'key' },
    ],
};

export interface PendingPass {
    id: string;
    payload: Record<string, unknown>;
    status: SyncStatus;
    createdAt: string;
    error?: string | null;
    /** Optimistic display fields */
    visitor_name?: string;
    purpose?: string;
    type?: string;
    expires_at?: string | null;
}

export interface PendingIncident {
    id: string;
    payload: Record<string, unknown>;
    status: SyncStatus;
    createdAt: string;
    error?: string | null;
    title?: string;
    category?: string;
}

export interface StaleCacheEntry<T = unknown> {
    key: string;
    data: T;
    updatedAt: string;
}

/**
 * Resident offline store - queued writes + stale-while-revalidate cache.
 */
export const ResidentStore = {
    async putPendingPass(pass: PendingPass): Promise<PendingPass> {
        return put(config, PASSES_STORE, pass);
    },

    async getPendingPasses(): Promise<PendingPass[]> {
        return getAll<PendingPass>(config, PASSES_STORE);
    },

    async getPendingPass(id: string): Promise<PendingPass | null> {
        return get<PendingPass>(config, PASSES_STORE, id);
    },

    async removePendingPass(id: string): Promise<void> {
        await remove(config, PASSES_STORE, id);
    },

    async clearPendingPasses(): Promise<void> {
        await clear(config, PASSES_STORE);
    },

    async putPendingIncident(incident: PendingIncident): Promise<PendingIncident> {
        return put(config, INCIDENTS_STORE, incident);
    },

    async getPendingIncidents(): Promise<PendingIncident[]> {
        return getAll<PendingIncident>(config, INCIDENTS_STORE);
    },

    async getPendingIncident(id: string): Promise<PendingIncident | null> {
        return get<PendingIncident>(config, INCIDENTS_STORE, id);
    },

    async removePendingIncident(id: string): Promise<void> {
        await remove(config, INCIDENTS_STORE, id);
    },

    async clearPendingIncidents(): Promise<void> {
        await clear(config, INCIDENTS_STORE);
    },

    async setStaleCache<T>(key: string, data: T): Promise<void> {
        const entry: StaleCacheEntry<T> = {
            key,
            data,
            updatedAt: new Date().toISOString(),
        };
        await put(config, STALE_STORE, entry);
    },

    async getStaleCache<T>(key: string): Promise<StaleCacheEntry<T> | null> {
        return get<StaleCacheEntry<T>>(config, STALE_STORE, key);
    },

    async removeStaleCache(key: string): Promise<void> {
        await remove(config, STALE_STORE, key);
    },
};
