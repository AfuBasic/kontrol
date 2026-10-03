import { describe, expect, it } from 'vitest';

import {
    type DeliveryStatus,
    type DeliveryUpdate,
    isSending,
    mergeUpdates,
    nextDelay,
    POLL_FAST_MS,
    POLL_MAX_BACKOFF_MS,
    POLL_SLOW_MS,
    QUIET_POLLS_BEFORE_SLOW,
    signature,
    summarize,
} from '../deliveryPolling';

const person = (id: number, delivery_status: DeliveryStatus, extra: Partial<{ delivery_error: string | null; delivered_label: string }> = {}) => ({
    id,
    email: `p${id}@example.com`,
    delivery_status,
    delivery_error: null as string | null,
    delivered_label: '',
    ...extra,
});

const update = (id: number, delivery_status: DeliveryStatus, delivered_label = ''): DeliveryUpdate => ({
    id,
    delivery_status,
    delivery_error: null,
    delivered_label,
});

describe('when to watch', () => {
    it('only watches while something is on its way', () => {
        expect(isSending([person(1, 'queued'), person(2, 'sent')])).toBe(true);
        expect(isSending([person(1, 'sent'), person(2, 'sent')])).toBe(false);
    });

    it('does not watch passes that are waiting for a person to press send', () => {
        expect(isSending([person(1, 'pending'), person(2, 'pending')])).toBe(false);
    });

    it('does not keep watching failures, which need a person too', () => {
        expect(isSending([person(1, 'failed')])).toBe(false);
    });
});

describe('how often to look', () => {
    it('looks quickly at first, then eases off when nothing is moving', () => {
        expect(nextDelay({ quietPolls: 0, failures: 0 })).toBe(POLL_FAST_MS);
        expect(nextDelay({ quietPolls: QUIET_POLLS_BEFORE_SLOW - 1, failures: 0 })).toBe(POLL_FAST_MS);
        expect(nextDelay({ quietPolls: QUIET_POLLS_BEFORE_SLOW, failures: 0 })).toBe(POLL_SLOW_MS);
    });

    it('backs off further each time the connection fails, up to a ceiling', () => {
        const waits = [1, 2, 3, 4, 10].map((failures) => nextDelay({ quietPolls: 0, failures }));

        expect(waits[0]).toBe(POLL_FAST_MS * 2);
        expect(waits[1]).toBeGreaterThan(waits[0]);
        expect(waits[2]).toBeGreaterThan(waits[1]);
        expect(waits[4]).toBe(POLL_MAX_BACKOFF_MS);
        expect(Math.max(...waits)).toBeLessThanOrEqual(POLL_MAX_BACKOFF_MS);
    });

    it('takes failures more seriously than a quiet spell', () => {
        expect(nextDelay({ quietPolls: 50, failures: 1 })).toBe(POLL_FAST_MS * 2);
    });
});

describe('applying fresh results to the people on screen', () => {
    it('updates only the people whose delivery changed', () => {
        const before = [person(1, 'queued'), person(2, 'queued'), person(3, 'sent', { delivered_label: '3 Oct' })];
        const after = mergeUpdates(before, [update(1, 'sent', '3 Oct'), update(2, 'queued'), update(3, 'sent', '3 Oct')]);

        expect(after[0]).toMatchObject({ delivery_status: 'sent', delivered_label: '3 Oct' });
        expect(after[1]).toBe(before[1]);
        expect(after[2]).toBe(before[2]);
    });

    it('hands back the very same list when nothing changed, so the screen does not redraw', () => {
        const before = [person(1, 'sent', { delivered_label: '3 Oct' }), person(2, 'queued')];

        expect(mergeUpdates(before, [update(1, 'sent', '3 Oct'), update(2, 'queued')])).toBe(before);
        expect(mergeUpdates(before, [])).toBe(before);
    });

    it('keeps everything else about a person untouched', () => {
        const [merged] = mergeUpdates([person(1, 'queued')], [update(1, 'failed')]);

        expect(merged).toMatchObject({ id: 1, email: 'p1@example.com', delivery_status: 'failed' });
    });

    it('ignores results for people who are no longer in the group', () => {
        const before = [person(1, 'queued')];

        expect(mergeUpdates(before, [update(99, 'sent')])).toBe(before);
    });

    it('carries a delivery error through', () => {
        const [merged] = mergeUpdates(
            [person(1, 'queued')],
            [{ id: 1, delivery_status: 'failed', delivery_error: 'Mailbox unavailable', delivered_label: '' }],
        );

        expect(merged.delivery_error).toBe('Mailbox unavailable');
    });
});

describe('noticing whether anything moved', () => {
    it('gives the same fingerprint for the same state in any order', () => {
        expect(signature([update(1, 'sent'), update(2, 'queued')])).toBe(signature([update(2, 'queued'), update(1, 'sent')]));
    });

    it('gives a different fingerprint once someone moves on', () => {
        expect(signature([update(1, 'queued')])).not.toBe(signature([update(1, 'sent')]));
    });
});

describe('the headline numbers', () => {
    it('counts each kind of delivery', () => {
        expect(summarize([person(1, 'sent'), person(2, 'sent'), person(3, 'queued'), person(4, 'pending'), person(5, 'failed')])).toEqual({
            total: 5,
            sent: 2,
            sending: 1,
            waiting: 1,
            failed: 1,
        });
    });
});
