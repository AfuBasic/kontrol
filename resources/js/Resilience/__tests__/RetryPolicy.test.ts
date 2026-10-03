import { describe, expect, it } from 'vitest';

import { computeBackoffMs, getRetryPolicy, hasExhaustedRetries, isExpired, RETRY_POLICIES } from '../RetryPolicy';

describe('retry backoff', () => {
    it('waits longer after each failure, up to a ceiling', () => {
        const policy = RETRY_POLICIES.security_log; // 5s, doubling, capped at 5 minutes

        expect(computeBackoffMs(policy, 0)).toBe(5_000);
        expect(computeBackoffMs(policy, 1)).toBe(10_000);
        expect(computeBackoffMs(policy, 2)).toBe(20_000);
        expect(computeBackoffMs(policy, 20)).toBe(5 * 60_000);
    });

    it('keeps a fixed wait for fixed policies', () => {
        const policy = RETRY_POLICIES.analytics_fetch;

        expect(computeBackoffMs(policy, 0)).toBe(3_000);
        expect(computeBackoffMs(policy, 5)).toBe(3_000);
    });
});

describe('giving up', () => {
    it('never gives up on gate logs, which must not be lost', () => {
        expect(hasExhaustedRetries(RETRY_POLICIES.security_log, 500)).toBe(false);
        expect(hasExhaustedRetries(RETRY_POLICIES.quick_entry_log, 500)).toBe(false);
    });

    it('stops after the allowed number of attempts for everything else', () => {
        expect(hasExhaustedRetries(RETRY_POLICIES.visitor_pass, 9)).toBe(false);
        expect(hasExhaustedRetries(RETRY_POLICIES.visitor_pass, 10)).toBe(true);
    });

    it('never queues a payment to be retried on its own', () => {
        const payment = RETRY_POLICIES.payment;

        expect(payment.autoRetry).toBe(false);
        expect(hasExhaustedRetries(payment, 0)).toBe(true);
        expect(computeBackoffMs(payment, 0)).toBe(0);
    });

    it('falls back to the visitor pass rules for an unknown kind of operation', () => {
        expect(getRetryPolicy('something_new').key).toBe('visitor_pass');
    });
});

describe('expiry', () => {
    const now = Date.parse('2026-10-10T12:00:00Z');

    it('drops a visitor pass queued more than a day ago', () => {
        expect(isExpired('2026-10-09T11:00:00Z', RETRY_POLICIES.visitor_pass, now)).toBe(true);
        expect(isExpired('2026-10-10T08:00:00Z', RETRY_POLICIES.visitor_pass, now)).toBe(false);
    });

    it('keeps gate logs for a week', () => {
        expect(isExpired('2026-10-04T12:30:00Z', RETRY_POLICIES.security_log, now)).toBe(false);
        expect(isExpired('2026-10-02T12:00:00Z', RETRY_POLICIES.security_log, now)).toBe(true);
    });
});
