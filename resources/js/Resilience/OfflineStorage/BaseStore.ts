/**
 * Shared IndexedDB primitives used by domain stores and the SyncEngine queue.
 */

export type IdValue = string | number;

export interface StoreConfig {
    dbName: string;
    version: number;
    stores: Array<{
        name: string;
        keyPath: string;
        autoIncrement?: boolean;
        indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
    }>;
}

const openConnections = new Map<string, Promise<IDBDatabase>>();

export function openDatabase(config: StoreConfig): Promise<IDBDatabase> {
    const cacheKey = `${config.dbName}@${config.version}`;
    const existing = openConnections.get(cacheKey);

    if (existing) {
        return existing;
    }

    const promise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(config.dbName, config.version);

        request.onblocked = () => {
            reject(new Error(`IndexedDB blocked: ${config.dbName}`));
        };

        request.onupgradeneeded = () => {
            const db = request.result;

            for (const store of config.stores) {
                let objectStore: IDBObjectStore;

                if (!db.objectStoreNames.contains(store.name)) {
                    objectStore = db.createObjectStore(store.name, {
                        keyPath: store.keyPath,
                        autoIncrement: store.autoIncrement ?? false,
                    });
                } else {
                    objectStore = request.transaction!.objectStore(store.name);
                }

                for (const index of store.indexes ?? []) {
                    if (!objectStore.indexNames.contains(index.name)) {
                        objectStore.createIndex(index.name, index.keyPath, {
                            unique: index.unique ?? false,
                        });
                    }
                }
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            openConnections.delete(cacheKey);
            reject(request.error);
        };
    });

    openConnections.set(cacheKey, promise);

    return promise;
}

function runTransaction<T>(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    executor: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction([storeName], mode);
        const store = transaction.objectStore(storeName);
        let request: IDBRequest<T> | undefined;

        try {
            const result = executor(store);
            if (result) {
                request = result;
                request.onsuccess = () => resolve(request!.result);
                request.onerror = () => reject(request!.error);
            }
        } catch (error) {
            reject(error);

            return;
        }

        if (!request) {
            transaction.oncomplete = () => resolve(undefined as T);
        }

        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
    });
}

export async function put<T extends object>(config: StoreConfig, storeName: string, value: T): Promise<T> {
    const db = await openDatabase(config);
    await runTransaction(db, storeName, 'readwrite', (store) => {
        store.put(value);
    });

    return value;
}

/** Insert with auto-generated key (for autoIncrement stores). */
export async function add<T extends object>(config: StoreConfig, storeName: string, value: T): Promise<IdValue> {
    const db = await openDatabase(config);

    return new Promise<IdValue>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(value);

        request.onsuccess = () => resolve(request.result as IdValue);
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
    });
}

export async function putMany<T extends object>(config: StoreConfig, storeName: string, values: T[]): Promise<void> {
    const db = await openDatabase(config);

    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        for (const value of values) {
            store.put(value);
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function get<T>(config: StoreConfig, storeName: string, key: IdValue): Promise<T | null> {
    const db = await openDatabase(config);
    const result = await runTransaction<T | undefined>(db, storeName, 'readonly', (store) => store.get(key));

    return result ?? null;
}

export async function getAll<T>(config: StoreConfig, storeName: string): Promise<T[]> {
    const db = await openDatabase(config);
    const result = await runTransaction<T[]>(db, storeName, 'readonly', (store) => store.getAll());

    return result ?? [];
}

export async function remove(config: StoreConfig, storeName: string, key: IdValue): Promise<void> {
    const db = await openDatabase(config);
    await runTransaction(db, storeName, 'readwrite', (store) => {
        store.delete(key);
    });
}

export async function clear(config: StoreConfig, storeName: string): Promise<void> {
    const db = await openDatabase(config);
    await runTransaction(db, storeName, 'readwrite', (store) => {
        store.clear();
    });
}

export async function count(config: StoreConfig, storeName: string): Promise<number> {
    const db = await openDatabase(config);
    const result = await runTransaction<number>(db, storeName, 'readonly', (store) => store.count());

    return result ?? 0;
}

export async function replaceAll<T extends object>(config: StoreConfig, storeName: string, values: T[]): Promise<void> {
    const db = await openDatabase(config);

    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();

        for (const value of values) {
            store.put(value);
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export function createId(prefix = 'op'): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
