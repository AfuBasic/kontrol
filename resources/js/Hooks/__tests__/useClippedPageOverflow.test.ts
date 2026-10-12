import { describe, expect, it } from 'vitest';
import { acquirePageClip } from '../useClippedPageOverflow';

const element = (overflowX = '') => ({ style: { overflowX } }) as unknown as HTMLElement;

describe('acquirePageClip', () => {
    it('clips sideways overflow while held and puts the original values back afterwards', () => {
        const html = element('hidden');
        const body = element('');

        const release = acquirePageClip(html, body);
        expect(html.style.overflowX).toBe('clip');
        expect(body.style.overflowX).toBe('clip');

        release();
        expect(html.style.overflowX).toBe('hidden');
        expect(body.style.overflowX).toBe('');
    });

    it('keeps clipping while an outgoing and an incoming layout overlap, and restores only when the last leaves', () => {
        const html = element('hidden');
        const body = element('hidden');

        const outgoing = acquirePageClip(html, body);
        const incoming = acquirePageClip(html, body); // the next page mounts before the old one finishes leaving

        outgoing();
        expect(html.style.overflowX).toBe('clip');
        expect(body.style.overflowX).toBe('clip');

        incoming();
        expect(html.style.overflowX).toBe('hidden');
        expect(body.style.overflowX).toBe('hidden');
    });

    it('is harmless to release twice', () => {
        const html = element('hidden');
        const body = element('hidden');

        const first = acquirePageClip(html, body);
        const second = acquirePageClip(html, body);

        first();
        first(); // a second release of the same hold must not count as the other holder leaving
        expect(html.style.overflowX).toBe('clip');

        second();
        expect(html.style.overflowX).toBe('hidden');
    });
});
