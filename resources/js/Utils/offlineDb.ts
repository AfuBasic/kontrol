export interface CachedCode {
    hash: string;
    visitor_name: string;
    host_name: string;
    expires_at: string;
    has_vehicle: boolean;
    purpose?: string;
}

export interface OfflineLog {
    id?: number;
    code: string;
    decision: 'admit' | 'reject';
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_plate_number?: string;
    created_at: string;
}

const DB_NAME = 'kontrol_offline';
const DB_VERSION = 1;
const CODES_STORE = 'active_codes';
const LOGS_STORE = 'pending_logs';

function getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(CODES_STORE)) {
                db.createObjectStore(CODES_STORE, { keyPath: 'hash' });
            }
            if (!db.objectStoreNames.contains(LOGS_STORE)) {
                db.createObjectStore(LOGS_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export const offlineDb = {
    /**
     * Replaces the entire list of cached codes with the new list
     */
    async saveActiveCodes(codes: CachedCode[]): Promise<void> {
        const db = await getDb();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([CODES_STORE], 'readwrite');
            const store = transaction.objectStore(CODES_STORE);

            // Clear existing
            const clearReq = store.clear();

            clearReq.onsuccess = () => {
                // Bulk insert
                for (const code of codes) {
                    store.put(code);
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    /**
     * Find a code by its SHA-256 hash
     */
    async findActiveCode(hash: string): Promise<CachedCode | null> {
        const db = await getDb();
        return new Promise<CachedCode | null>((resolve, reject) => {
            const transaction = db.transaction([CODES_STORE], 'readonly');
            const store = transaction.objectStore(CODES_STORE);
            const request = store.get(hash);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Queues an offline check-in log to be synced later
     */
    async queueOfflineLog(log: OfflineLog): Promise<void> {
        const db = await getDb();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([LOGS_STORE], 'readwrite');
            const store = transaction.objectStore(LOGS_STORE);
            const request = store.add(log);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Retrieve all pending offline logs
     */
    async getPendingLogs(): Promise<OfflineLog[]> {
        const db = await getDb();
        return new Promise<OfflineLog[]>((resolve, reject) => {
            const transaction = db.transaction([LOGS_STORE], 'readonly');
            const store = transaction.objectStore(LOGS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clear all pending logs that have been successfully synced
     */
    async clearPendingLogs(): Promise<void> {
        const db = await getDb();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([LOGS_STORE], 'readwrite');
            const store = transaction.objectStore(LOGS_STORE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
};

/**
 * Computes the SHA-256 hash of a string on the client side
 */
export async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message.trim().toUpperCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
