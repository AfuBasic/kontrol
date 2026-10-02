import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (url: string, init: RequestInit) => Promise<Response> | Response;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** A fetch that answers pings instantly and hands every other request to the test. */
function stubFetch(handler: Handler) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: RequestInit = {}) => {
            if (String(url).startsWith('/up')) {
                return new Response(null, { status: 200 });
            }
            calls.push({ url: String(url), init });

            return handler(String(url), init);
        }),
    );

    return calls;
}

/** A request that never gets an answer, but ends honestly when the caller gives up on it. */
const hangs: Handler = (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });

async function freshEngine() {
    vi.resetModules();
    const { SyncEngine } = await import('../SyncEngine');
    await SyncEngine.clearAll();

    return SyncEngine;
}

const stateOf = async (engine: Awaited<ReturnType<typeof freshEngine>>) => (await engine.getState()).operations;

describe('SyncEngine', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('stamps every send with the operation id so the server can recognise a replay', async () => {
        const calls = stubFetch(() => json({ success: true }));
        const engine = await freshEngine();

        const id = await engine.enqueue({ type: 'visitor_pass', endpoint: '/resident/visitors', payload: { visitor_name: 'Ada' } });

        await vi.waitFor(() => expect(calls).toHaveLength(1));
        expect(new Headers(calls[0].init.headers).get('X-Idempotency-Key')).toBe(id);
        engine.stop();
    });

    it('sends the same stamp again when it retries', async () => {
        let attempt = 0;
        const calls = stubFetch(() => (++attempt === 1 ? Promise.reject(new TypeError('Failed to fetch')) : json({ success: true })));
        const engine = await freshEngine();

        const id = await engine.enqueue({ type: 'visitor_pass', endpoint: '/resident/visitors', payload: {} });
        await vi.waitFor(async () => expect((await stateOf(engine))[0]?.retryCount).toBe(1));

        await engine.retryOperation(id);

        expect(calls).toHaveLength(2);
        expect(calls.map((c) => new Headers(c.init.headers).get('X-Idempotency-Key'))).toEqual([id, id]);
        engine.stop();
    });

    it('gives up on a request that gets no answer for twenty seconds and keeps the action for a retry', async () => {
        // Shrink the twenty-second limit to nothing so the test does not have to wait for it.
        const realSetTimeout = globalThis.setTimeout;
        vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: TimerHandler, delay?: number, ...args: unknown[]) =>
            realSetTimeout(handler as () => void, delay === 20_000 ? 0 : delay, ...args)) as typeof setTimeout);

        stubFetch(hangs);
        const engine = await freshEngine();

        await engine.enqueue({ type: 'visitor_pass', endpoint: '/resident/visitors', payload: {} });

        await vi.waitFor(async () => {
            const [op] = await stateOf(engine);
            expect(op.lastErrorCode).toBe('REQUEST_TIMEOUT');
            expect(op.status).toBe('pending');
            expect(op.retryCount).toBe(1);
        });
        engine.stop();
    });

    it('does not let one hung request hold up the actions queued behind it', async () => {
        const realSetTimeout = globalThis.setTimeout;
        vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: TimerHandler, delay?: number, ...args: unknown[]) =>
            realSetTimeout(handler as () => void, delay === 20_000 ? 0 : delay, ...args)) as typeof setTimeout);

        const calls = stubFetch((url, init) => (url === '/first' ? hangs(url, init) : json({ success: true })));
        const engine = await freshEngine();

        await engine.enqueue({ type: 'visitor_pass', endpoint: '/first', payload: {} });
        await engine.enqueue({ type: 'visitor_pass', endpoint: '/second', payload: {} });

        await vi.waitFor(() => expect(calls.map((c) => c.url)).toContain('/second'));
        engine.stop();
    });

    it('does not resend an action that is still waiting out its retry delay when a new one arrives', async () => {
        const calls = stubFetch((url) => (url === '/flaky' ? Promise.reject(new TypeError('Failed to fetch')) : json({ success: true })));
        const engine = await freshEngine();

        await engine.enqueue({ type: 'visitor_pass', endpoint: '/flaky', payload: {} });
        await vi.waitFor(async () => expect((await stateOf(engine)).find((o) => o.endpoint === '/flaky')?.retryCount).toBe(1));

        await engine.enqueue({ type: 'visitor_pass', endpoint: '/fresh', payload: {} });
        await vi.waitFor(() => expect(calls.map((c) => c.url)).toContain('/fresh'));

        // /flaky failed moments ago and has a thirty-second wait: the new action must not cut that short.
        expect(calls.filter((c) => c.url === '/flaky')).toHaveLength(1);
        engine.stop();
    });

    it('treats a server that says "already received" as done', async () => {
        stubFetch(() => json({ success: true, duplicate: true, message: 'Already received.' }));
        const engine = await freshEngine();

        const id = await engine.enqueue({ type: 'visitor_pass', endpoint: '/resident/visitors', payload: {} });

        await vi.waitFor(async () => {
            const ops = await stateOf(engine);
            const op = ops.find((o) => o.id === id);
            // Synced operations are dropped shortly after; either way it must not be pending or failed.
            expect(op === undefined || op.status === 'synced').toBe(true);
        });
        engine.stop();
    });

    it('retries when the server asks it to come back (a first attempt is still running)', async () => {
        stubFetch(() => json({ success: false, retryable: true, error: 'The first attempt is still being processed.' }, 503));
        const engine = await freshEngine();

        await engine.enqueue({ type: 'visitor_pass', endpoint: '/resident/visitors', payload: {} });

        await vi.waitFor(async () => {
            const [op] = await stateOf(engine);
            expect(op.status).toBe('pending');
            expect(op.retryCount).toBe(1);
        });
        engine.stop();
    });
});
