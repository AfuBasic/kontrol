import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Reply = { ok: boolean; status?: number; ms?: number } | 'network-failure';

/** Fake the server: each ping to /up gets the next scripted reply and "takes" the stated time. */
function scriptServer(replies: Reply[]) {
    let clock = 0;
    let call = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);

    vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
            const reply = replies[Math.min(call++, replies.length - 1)];
            if (reply === 'network-failure') {
                throw new TypeError('Failed to fetch');
            }
            clock += reply.ms ?? 50;

            return { ok: reply.ok, status: reply.status ?? (reply.ok ? 200 : 500) };
        }),
    );
}

async function freshMonitor() {
    vi.resetModules();

    return (await import('../NetworkMonitor')).NetworkMonitor;
}

describe('NetworkMonitor', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('calls a fast server a healthy connection', async () => {
        scriptServer([{ ok: true, ms: 40 }]);
        const monitor = await freshMonitor();

        const snapshot = await monitor.checkNow();

        expect(snapshot.isOnline).toBe(true);
        expect(['excellent', 'good']).toContain(snapshot.quality);
    });

    it('calls a server that answers in four seconds a poor connection, not an offline one', async () => {
        scriptServer([{ ok: true, ms: 4_000 }]);
        const monitor = await freshMonitor();

        const snapshot = await monitor.checkNow();

        expect(snapshot.quality).toBe('poor');
        expect(snapshot.isOnline).toBe(true);
    });

    it('trusts how the server actually behaves over a browser that claims a fast network', async () => {
        // The browser says 4g, but this server takes four seconds to answer a tiny request.
        Object.defineProperty(navigator, 'connection', { value: { effectiveType: '4g', rtt: 50 }, configurable: true });
        scriptServer([{ ok: true, ms: 4_000 }]);
        const monitor = await freshMonitor();

        const snapshot = await monitor.checkNow();

        expect(snapshot.quality).toBe('poor');
        expect(snapshot.isOnline).toBe(true);
        Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true });
    });

    it('waits up to eight seconds for the server before counting a miss', async () => {
        scriptServer([{ ok: true, ms: 40 }]);
        const delays: number[] = [];
        const realSetTimeout = globalThis.setTimeout;
        vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
            delays.push(Number(delay));

            return realSetTimeout(handler as () => void, delay, ...args);
        }) as typeof setTimeout);
        const monitor = await freshMonitor();

        await monitor.checkNow();

        expect(delays).toContain(8_000);
        expect(delays).not.toContain(2_500);
    });

    it('does not announce offline after a single missed answer', async () => {
        scriptServer(['network-failure']);
        const monitor = await freshMonitor();

        const snapshot = await monitor.checkNow();

        expect(snapshot.isOnline).toBe(true);
    });

    it('announces offline once the server has been unreachable twice in a row', async () => {
        scriptServer(['network-failure', 'network-failure']);
        const monitor = await freshMonitor();

        await monitor.checkNow();
        const snapshot = await monitor.checkNow();

        expect(snapshot.quality).toBe('offline');
        expect(snapshot.isOnline).toBe(false);
    });

    it('recovers as soon as the server answers again', async () => {
        scriptServer(['network-failure', 'network-failure', { ok: true, ms: 60 }]);
        const monitor = await freshMonitor();

        await monitor.checkNow();
        await monitor.checkNow();
        const snapshot = await monitor.checkNow();

        expect(snapshot.isOnline).toBe(true);
        expect(snapshot.quality).not.toBe('offline');
    });

    it('reports offline immediately when the browser itself says there is no network', async () => {
        scriptServer([{ ok: true }]);
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        const monitor = await freshMonitor();

        const snapshot = await monitor.checkNow();

        expect(snapshot.quality).toBe('offline');
    });

    it('still treats a login redirect or a 404 as "the server is there"', async () => {
        scriptServer([{ ok: false, status: 401, ms: 40 }]);
        const monitor = await freshMonitor();

        expect(await monitor.isServerReachable(2_000, '/security/verify/sync')).toBe(true);
    });
});
