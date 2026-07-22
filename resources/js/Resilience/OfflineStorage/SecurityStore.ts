import {
    add,
    clear,
    count,
    get,
    getAll,
    remove,
    replaceAll,
    type StoreConfig,
} from './BaseStore';
import type { CachedCode, OfflineLog } from './types';

export type { CachedCode, OfflineLog };
export { sha256 } from '@/Resilience/sha256';

const CODES_STORE = 'active_codes';
const LOGS_STORE = 'pending_logs';

const config: StoreConfig = {
    dbName: 'kontrol-security',
    version: 1,
    stores: [
        { name: CODES_STORE, keyPath: 'hash' },
        { name: LOGS_STORE, keyPath: 'id', autoIncrement: true },
    ],
};

/**
 * Security offline store — hashed pass cache + pending scan logs.
 * Replaces Utils/offlineDb for the security domain.
 */
export const SecurityStore = {
    async saveActiveCodes(codes: CachedCode[]): Promise<void> {
        await replaceAll(config, CODES_STORE, codes);
    },

    async findActiveCode(hash: string): Promise<CachedCode | null> {
        return get<CachedCode>(config, CODES_STORE, hash);
    },

    async getActiveCodes(): Promise<CachedCode[]> {
        return getAll<CachedCode>(config, CODES_STORE);
    },

    async countActiveCodes(): Promise<number> {
        return count(config, CODES_STORE);
    },

    async queueOfflineLog(log: OfflineLog): Promise<void> {
        await add(config, LOGS_STORE, log);
    },

    async getPendingLogs(): Promise<OfflineLog[]> {
        return getAll<OfflineLog>(config, LOGS_STORE);
    },

    async clearPendingLogs(): Promise<void> {
        await clear(config, LOGS_STORE);
    },

    async removePendingLog(id: number): Promise<void> {
        await remove(config, LOGS_STORE, id);
    },

    async countPendingLogs(): Promise<number> {
        return count(config, LOGS_STORE);
    },
};
