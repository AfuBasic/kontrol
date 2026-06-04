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

        request.onblocked = () => {
            reject(new Error('IndexedDB blocked by another open connection'));
        };

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

function sha256Pure(ascii: string): string {
    const lengthProperty = 'length';
    let i, j;
    let result = '';

    const words: number[] = [];
    const asciiLength = ascii.length * 8;

    const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
        0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
        0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
        0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
        0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    const rightRotate = (value: number, amount: number) => {
        return (value >>> amount) | (value << (32 - amount));
    };

    for (i = 0; i < ascii[lengthProperty]; i++) {
        const charCode = ascii.charCodeAt(i);
        words[i >> 2] |= (charCode & 0xff) << (24 - (i % 4) * 8);
    }

    words[asciiLength >> 5] |= 0x80 << (24 - (asciiLength % 32));
    words[(((asciiLength + 64) >> 9) << 4) + 15] = asciiLength;

    for (i = 0; i < words[lengthProperty]; i += 16) {
        const w: number[] = [];
        for (j = 0; j < 64; j++) {
            if (j < 16) {
                w[j] = words[i + j] | 0;
            } else {
                const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
                const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
                w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
            }
        }

        let a = hash[0];
        let b = hash[1];
        let c = hash[2];
        let d = hash[3];
        let e = hash[4];
        let f = hash[5];
        let g = hash[6];
        let h = hash[7];

        for (j = 0; j < 64; j++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }

        hash[0] = (hash[0] + a) | 0;
        hash[1] = (hash[1] + b) | 0;
        hash[2] = (hash[2] + c) | 0;
        hash[3] = (hash[3] + d) | 0;
        hash[4] = (hash[4] + e) | 0;
        hash[5] = (hash[5] + f) | 0;
        hash[6] = (hash[6] + g) | 0;
        hash[7] = (hash[7] + h) | 0;
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j >= 0; j--) {
            const byte = (hash[i] >> (j * 8)) & 0xff;
            result += byte.toString(16).padStart(2, '0');
        }
    }

    return result;
}

/**
 * Computes the SHA-256 hash of a string on the client side
 */
export async function sha256(message: string): Promise<string> {
    const sanitized = message.trim().toUpperCase();
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
        try {
            const msgBuffer = new TextEncoder().encode(sanitized);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('SubtleCrypto failed, falling back to JS implementation', e);
        }
    }
    return sha256Pure(sanitized);
}
