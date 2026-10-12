import { describe, expect, it } from 'vitest';
import { formatAge, formatBucket, formatDuration, formatWaiting, STATUS_STYLE } from '../jobs';

describe('formatDuration', () => {
    it('reads naturally from milliseconds to minutes', () => {
        expect(formatDuration(null)).toBe('—');
        expect(formatDuration(0)).toBe('0 ms');
        expect(formatDuration(850)).toBe('850 ms');
        expect(formatDuration(1000)).toBe('1 s');
        expect(formatDuration(4200)).toBe('4.2 s');
        expect(formatDuration(60_000)).toBe('1 min');
        expect(formatDuration(125_000)).toBe('2 min 5 s');
    });
});

describe('formatWaiting', () => {
    it('says what is waiting and for how long, with correct plurals', () => {
        expect(formatWaiting(null)).toBe('Nothing waiting');
        expect(formatWaiting(1)).toBe('1 second');
        expect(formatWaiting(12)).toBe('12 seconds');
        expect(formatWaiting(60)).toBe('1 minute');
        expect(formatWaiting(600)).toBe('10 minutes');
        expect(formatWaiting(7200)).toBe('2 hours');
        expect(formatWaiting(172_800)).toBe('2 days');
    });
});

describe('STATUS_STYLE', () => {
    it('has a label for every status the server can send', () => {
        expect(Object.keys(STATUS_STYLE).sort()).toEqual(['failed', 'lost', 'retrying', 'running', 'succeeded']);
        expect(STATUS_STYLE.lost.label).toBe('Stopped midway');
    });
});

describe('formatAge', () => {
    it('says how old the live figures are', () => {
        expect(formatAge(0)).toBe('just now');
        expect(formatAge(4)).toBe('just now');
        expect(formatAge(12.7)).toBe('12 s ago');
        expect(formatAge(59)).toBe('59 s ago');
        expect(formatAge(60)).toBe('1 min ago');
        expect(formatAge(185)).toBe('3 min ago');
    });
});

describe('formatBucket', () => {
    it('labels the hour and day views with a clock time and the week view with a weekday', () => {
        const at = '2026-10-12T14:05:00+00:00';

        expect(formatBucket(at, '1h')).toMatch(/^\d{2}:\d{2}$/);
        expect(formatBucket(at, '24h')).toMatch(/^\d{2}:\d{2}$/);
        expect(formatBucket(at, '7d')).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    });
});
