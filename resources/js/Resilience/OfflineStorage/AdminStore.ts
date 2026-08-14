import { get, put, type StoreConfig } from './BaseStore';
import type { StaleCacheEntry } from './ResidentStore';

const STALE_STORE = 'stale_cache';

const config: StoreConfig = {
    dbName: 'kontrol-admin',
    version: 1,
    stores: [{ name: STALE_STORE, keyPath: 'key' }],
};

/**
 * Admin offline store - reserved for stale read caches (Phase 3+).
 */
export const AdminStore = {
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
};
