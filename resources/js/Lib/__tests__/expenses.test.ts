import { describe, expect, it } from 'vitest';
import {
    cleanAmountInput,
    currentMonth,
    dateParts,
    formatBytes,
    groupByMonth,
    koboToInput,
    monthLabel,
    pickReceipts,
    shiftMonth,
    today,
} from '../expenses';

const file = (name: string, type: string, sizeBytes = 1000) => new File([new Uint8Array(sizeBytes)], name, { type });

describe('amount input', () => {
    it('turns kobo into a plain naira string without a pointless .00', () => {
        expect(koboToInput(1250050)).toBe('12500.50');
        expect(koboToInput(1250000)).toBe('12500');
        expect(koboToInput(5)).toBe('0.05');
    });

    it('keeps digits and one dot, at most two decimals', () => {
        expect(cleanAmountInput('12,500.555')).toBe('12500.55');
        expect(cleanAmountInput('abc')).toBe('');
        expect(cleanAmountInput('1.2.3')).toBe('1.23');
        expect(cleanAmountInput('₦ 99')).toBe('99');
    });
});

describe('months', () => {
    it('labels a month', () => {
        expect(monthLabel('2026-10')).toBe('October 2026');
    });

    it('moves across year ends in both directions', () => {
        expect(shiftMonth('2026-12', 1)).toBe('2027-01');
        expect(shiftMonth('2026-01', -1)).toBe('2025-12');
        expect(shiftMonth('2026-10', 0)).toBe('2026-10');
    });

    it('reads the current month and day', () => {
        const now = new Date(2026, 9, 4);
        expect(currentMonth(now)).toBe('2026-10');
        expect(today(now)).toBe('2026-10-04');
    });

    it('splits a date for the row chip', () => {
        expect(dateParts('2026-10-04')).toEqual({ day: '04', weekday: 'Sun' });
    });
});

describe('groupByMonth', () => {
    it('groups in order and totals each month in kobo', () => {
        const groups = groupByMonth([
            { id: 1, incurred_on: '2026-10-09', amount: 100 },
            { id: 2, incurred_on: '2026-10-01', amount: 250 },
            { id: 3, incurred_on: '2026-09-30', amount: 40 },
        ]);

        expect(groups.map((g) => [g.month, g.label, g.total, g.items.length])).toEqual([
            ['2026-10', 'October 2026', 350, 2],
            ['2026-09', 'September 2026', 40, 1],
        ]);
    });

    it('returns nothing for nothing', () => {
        expect(groupByMonth([])).toEqual([]);
    });
});

describe('pickReceipts', () => {
    it('accepts jpg, png, webp and pdf', () => {
        const { accepted, problems } = pickReceipts(
            [],
            [file('a.jpg', 'image/jpeg'), file('b.png', 'image/png'), file('c.webp', 'image/webp'), file('d.pdf', 'application/pdf')],
            5,
            10,
        );
        expect(accepted).toHaveLength(4);
        expect(problems).toEqual([]);
    });

    it('explains files that are the wrong type or too big', () => {
        const { accepted, problems } = pickReceipts(
            [],
            [file('x.exe', 'application/octet-stream'), file('big.pdf', 'application/pdf', 11 * 1024 * 1024)],
            5,
            10,
        );
        expect(accepted).toEqual([]);
        expect(problems).toEqual(['x.exe is not a JPG, PNG, WEBP or PDF file.', 'big.pdf is larger than 10 MB.']);
    });

    it('stops at the limit counting what is already picked', () => {
        const existing = [file('1.pdf', 'application/pdf'), file('2.pdf', 'application/pdf')];
        const { accepted, problems } = pickReceipts(existing, [file('3.pdf', 'application/pdf'), file('4.pdf', 'application/pdf')], 3, 10);
        expect(accepted).toHaveLength(1);
        expect(problems).toEqual(['Only 3 receipts can be attached at a time.']);
    });
});

describe('formatBytes', () => {
    it('reads naturally', () => {
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(2048)).toBe('2 KB');
        expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    });
});
