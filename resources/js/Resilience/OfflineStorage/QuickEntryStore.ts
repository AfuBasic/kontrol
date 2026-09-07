import { add, clear, count, getAll, remove, type StoreConfig } from './BaseStore';

export interface ReservedTag {
    tag: string;
    allocation_id: number;
    created_at: string;
}

export interface OfflineQuickEntryLog {
    id?: number;
    tag: string;
    organization_id: number;
    visitor_name?: string | null;
    vehicle_plate_number?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    allocation_id?: number | null;
    verified_at: string;
}

const TAGS_STORE = 'tag_pool';
const PENDING_LOGS_STORE = 'quick_entry_pending_logs';

const config: StoreConfig = {
    dbName: 'kontrol-quick-entry',
    version: 1,
    stores: [
        { name: TAGS_STORE, keyPath: 'tag' },
        { name: PENDING_LOGS_STORE, keyPath: 'id', autoIncrement: true },
    ],
};

export const QuickEntryStore = {
    async addTags(tags: ReservedTag[]): Promise<void> {
        for (const item of tags) {
            try {
                await add(config, TAGS_STORE, item);
            } catch {
                // Ignore duplicates if already reserved
            }
        }
    },

    async getNextTag(): Promise<ReservedTag | null> {
        const allTags = await getAll<ReservedTag>(config, TAGS_STORE);
        if (!allTags || allTags.length === 0) {
            return null;
        }
        const next = allTags[0];
        await remove(config, TAGS_STORE, next.tag);
        return next;
    },

    async countRemainingTags(): Promise<number> {
        return count(config, TAGS_STORE);
    },

    async clearTags(): Promise<void> {
        await clear(config, TAGS_STORE);
    },

    async queueOfflineLog(log: OfflineQuickEntryLog): Promise<void> {
        await add(config, PENDING_LOGS_STORE, log);
    },

    async getPendingLogs(): Promise<OfflineQuickEntryLog[]> {
        return getAll<OfflineQuickEntryLog>(config, PENDING_LOGS_STORE);
    },

    async removePendingLog(id: number): Promise<void> {
        await remove(config, PENDING_LOGS_STORE, id);
    },

    async clearPendingLogs(): Promise<void> {
        await clear(config, PENDING_LOGS_STORE);
    },

    async countPendingLogs(): Promise<number> {
        return count(config, PENDING_LOGS_STORE);
    },
};
