import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AdminStore } from '@/Resilience/OfflineStorage/AdminStore';
import { ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';

type CacheNamespace = 'resident' | 'admin';

interface UseStaleDataOptions<T> {
    /** Cache key, e.g. "resident-home". */
    key: string;
    /** Fresh server-provided data (Inertia prop). */
    serverData: T | null | undefined;
    /** Which IndexedDB namespace to use. */
    namespace?: CacheNamespace;
    /** Inertia prop names to reload in the background. */
    only?: string[];
    /** Skip background reload (e.g. when offline). */
    revalidate?: boolean;
}

interface UseStaleDataResult<T> {
    data: T | null;
    isStale: boolean;
    isRevalidating: boolean;
    cachedAt: string | null;
    revalidate: () => void;
}

async function readCache<T>(namespace: CacheNamespace, key: string) {
    if (namespace === 'admin') {
        return AdminStore.getStaleCache<T>(key);
    }

    return ResidentStore.getStaleCache<T>(key);
}

async function writeCache<T>(namespace: CacheNamespace, key: string, data: T) {
    if (namespace === 'admin') {
        return AdminStore.setStaleCache(key, data);
    }

    return ResidentStore.setStaleCache(key, data);
}

/**
 * Stale-while-revalidate for Inertia pages:
 * 1. Mount: paint last-cached data immediately
 * 2. When serverData arrives, update cache
 * 3. Optionally background-reload named props
 */
export function useStaleData<T>({
    key,
    serverData,
    namespace = 'resident',
    only,
    revalidate = true,
}: UseStaleDataOptions<T>): UseStaleDataResult<T> {
    const [cached, setCached] = useState<T | null>(null);
    const [cachedAt, setCachedAt] = useState<string | null>(null);
    const [isRevalidating, setIsRevalidating] = useState(false);
    const hydrated = useRef(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const entry = await readCache<T>(namespace, key);
                if (!cancelled && entry) {
                    setCached(entry.data);
                    setCachedAt(entry.updatedAt);
                }
            } catch {
                // IndexedDB may be unavailable
            } finally {
                hydrated.current = true;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [key, namespace]);

    useEffect(() => {
        if (serverData === null || serverData === undefined) {
            return;
        }

        setCached(serverData);
        setCachedAt(new Date().toISOString());
        void writeCache(namespace, key, serverData).catch(() => {});
    }, [serverData, key, namespace]);

    const runRevalidate = useCallback(() => {
        if (!revalidate || !only?.length) {
            return;
        }

        setIsRevalidating(true);
        router.reload({
            only,
            onFinish: () => setIsRevalidating(false),
            onError: () => setIsRevalidating(false),
        });
    }, [only, revalidate]);

    useEffect(() => {
        if (!revalidate || !only?.length) {
            return;
        }

        // Background revalidate once after mount when we have only stale cache.
        if (serverData === null || serverData === undefined) {
            runRevalidate();
        }
    }, [revalidate, only, serverData, runRevalidate]);

    const data = serverData !== null && serverData !== undefined ? serverData : cached;
    const isStale = (serverData === null || serverData === undefined) && cached !== null;

    return {
        data,
        isStale,
        isRevalidating,
        cachedAt,
        revalidate: runRevalidate,
    };
}

export default useStaleData;
