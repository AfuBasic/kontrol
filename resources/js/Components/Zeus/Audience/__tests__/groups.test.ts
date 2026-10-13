import { describe, expect, it } from 'vitest';
import { changeSentence, GROUP_COLOUR, GROUP_LABEL, GROUP_ORDER } from '../groups';

describe('changeSentence', () => {
    it('says up or down as a share of the period before', () => {
        expect(changeSentence(150, 100, '30 days')).toBe('Up 50% on the 30 days before');
        expect(changeSentence(75, 100, '7 days')).toBe('Down 25% on the 7 days before');
    });

    it('says same when nothing changed', () => {
        expect(changeSentence(40, 40, '7 days')).toBe('Same as the 7 days before');
    });

    it('does not divide by zero when nobody was recorded before', () => {
        expect(changeSentence(12, 0, '30 days')).toBe('30 days before: nobody recorded');
        expect(changeSentence(0, 0, '30 days')).toBe('Nothing yet');
    });
});

describe('client groups', () => {
    it('gives every kind of client a colour and a name, in one fixed order', () => {
        expect(GROUP_ORDER).toHaveLength(6);
        for (const key of GROUP_ORDER) {
            expect(GROUP_COLOUR[key]).toMatch(/^#[0-9a-f]{6}$/);
            expect(GROUP_LABEL[key].length).toBeGreaterThan(0);
        }
        expect(new Set(GROUP_ORDER.map((key) => GROUP_COLOUR[key])).size).toBe(6);
    });
});
