export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface NetworkSnapshot {
    quality: NetworkQuality;
    isOnline: boolean;
    rtt: number | null;
    effectiveType: string | null;
    checkedAt: string;
}

type Listener = (snapshot: NetworkSnapshot) => void;

interface NetworkInformationLike {
    effectiveType?: string;
    rtt?: number;
    downlink?: number;
    saveData?: boolean;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
}

const DEFAULT_PING_PATH = '/up';
const POLL_INTERVAL_MS = 8_000;

function getConnection(): NetworkInformationLike | null {
    if (typeof navigator === 'undefined') {
        return null;
    }

    const nav = navigator as Navigator & {
        connection?: NetworkInformationLike;
        mozConnection?: NetworkInformationLike;
        webkitConnection?: NetworkInformationLike;
    };

    return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function qualityFromMetrics(rtt: number | null, effectiveType: string | null, online: boolean): NetworkQuality {
    if (!online) {
        return 'offline';
    }

    const type = (effectiveType ?? '').toLowerCase();

    if (type === 'slow-2g' || type === '2g') {
        return 'poor';
    }

    if (type === '3g') {
        return 'good';
    }

    if (type === '4g' || type === '5g') {
        return 'excellent';
    }

    if (rtt !== null) {
        if (rtt < 100) {
            return 'excellent';
        }
        if (rtt <= 500) {
            return 'good';
        }

        return 'poor';
    }

    return 'good';
}

/**
 * Network quality monitor with Network Information API + fetch RTT fallback.
 * Singleton - subscribe via NetworkMonitor.subscribe().
 */
class NetworkMonitorImpl {
    private listeners = new Set<Listener>();
    private snapshot: NetworkSnapshot = {
        quality: typeof navigator !== 'undefined' && navigator.onLine ? 'good' : 'offline',
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        rtt: null,
        effectiveType: null,
        checkedAt: new Date().toISOString(),
    };
    private started = false;
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private measuring = false;
    private pingPath = DEFAULT_PING_PATH;

    getSnapshot(): NetworkSnapshot {
        return this.snapshot;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.snapshot);
        this.start();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.stop();
            }
        };
    }

    setPingPath(path: string): void {
        this.pingPath = path;
    }

    async checkNow(timeoutMs = 2_500): Promise<NetworkSnapshot> {
        await this.measure(timeoutMs);

        return this.snapshot;
    }

    /**
     * Reachability check used by security offline scanning.
     * Returns true when the server responds (any status short of network failure).
     */
    async isServerReachable(timeoutMs = 2_000, path?: string): Promise<boolean> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return false;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const target = path ?? this.pingPath;

        try {
            const response = await fetch(`${target}${target.includes('?') ? '&' : '?'}ping=${Date.now()}`, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store',
                credentials: 'same-origin',
            });

            return response.ok || [401, 403, 404, 405, 419].includes(response.status);
        } catch {
            return false;
        } finally {
            clearTimeout(timer);
        }
    }

    private start(): void {
        if (this.started || typeof window === 'undefined') {
            return;
        }

        this.started = true;

        window.addEventListener('online', this.handleBrowserOnline);
        window.addEventListener('offline', this.handleBrowserOffline);

        const connection = getConnection();
        connection?.addEventListener?.('change', this.handleConnectionChange);

        void this.measure();
        this.pollTimer = setInterval(() => {
            void this.measure();
        }, POLL_INTERVAL_MS);
    }

    private stop(): void {
        if (!this.started || typeof window === 'undefined') {
            return;
        }

        this.started = false;
        window.removeEventListener('online', this.handleBrowserOnline);
        window.removeEventListener('offline', this.handleBrowserOffline);

        const connection = getConnection();
        connection?.removeEventListener?.('change', this.handleConnectionChange);

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    private handleBrowserOnline = (): void => {
        void this.measure();
    };

    private handleBrowserOffline = (): void => {
        this.publish({
            quality: 'offline',
            isOnline: false,
            rtt: null,
            effectiveType: getConnection()?.effectiveType ?? null,
            checkedAt: new Date().toISOString(),
        });
    };

    private handleConnectionChange = (): void => {
        void this.measure();
    };

    private failedPings = 0;

    private async measure(timeoutMs = 2_500): Promise<void> {
        if (this.measuring || typeof window === 'undefined') {
            return;
        }

        this.measuring = true;

        try {
            const connection = getConnection();
            const effectiveType = connection?.effectiveType ?? null;
            let rtt = typeof connection?.rtt === 'number' ? connection.rtt : null;

            if (!navigator.onLine) {
                this.failedPings = 2;
                this.publish({
                    quality: 'offline',
                    isOnline: false,
                    rtt: null,
                    effectiveType,
                    checkedAt: new Date().toISOString(),
                });

                return;
            }

            const reachable = await this.isServerReachable(timeoutMs);

            if (!reachable) {
                this.failedPings++;
                if (this.failedPings >= 2) {
                    this.publish({
                        quality: 'offline',
                        isOnline: false,
                        rtt: null,
                        effectiveType,
                        checkedAt: new Date().toISOString(),
                    });
                }

                return;
            }

            this.failedPings = 0;

            // Fallback RTT when Network Information API is missing (Safari / Firefox).
            if (rtt === null) {
                rtt = await this.measureFetchRtt(timeoutMs);
            }

            const quality = qualityFromMetrics(rtt, effectiveType, true);

            this.publish({
                quality,
                isOnline: true,
                rtt,
                effectiveType,
                checkedAt: new Date().toISOString(),
            });
        } finally {
            this.measuring = false;
        }
    }

    private async measureFetchRtt(timeoutMs: number): Promise<number | null> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const start = performance.now();

        try {
            await fetch(`${this.pingPath}?rtt=${Date.now()}`, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store',
                credentials: 'same-origin',
            });

            return Math.round(performance.now() - start);
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    private publish(snapshot: NetworkSnapshot): void {
        const changed =
            snapshot.quality !== this.snapshot.quality ||
            snapshot.isOnline !== this.snapshot.isOnline ||
            snapshot.rtt !== this.snapshot.rtt;

        this.snapshot = snapshot;

        if (changed) {
            this.listeners.forEach((listener) => listener(snapshot));
        }
    }
}

export const NetworkMonitor = new NetworkMonitorImpl();
