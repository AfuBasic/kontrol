import { describe, expect, it } from 'vitest';
import { shouldSendMetaCsrfToken } from '../csrf';

describe('shouldSendMetaCsrfToken', () => {
    it('does not send the meta token when the fresh XSRF cookie exists, so a stale meta tag cannot cause a 419', () => {
        expect(shouldSendMetaCsrfToken('theme=dark; XSRF-TOKEN=abc123; other=1', 'stale-meta-token')).toBe(false);
    });

    it('also recognises the cookie when it is the first or only one', () => {
        expect(shouldSendMetaCsrfToken('XSRF-TOKEN=abc123', 'meta')).toBe(false);
        expect(shouldSendMetaCsrfToken(' XSRF-TOKEN=abc123', 'meta')).toBe(false);
    });

    it('falls back to the meta token when there is no XSRF cookie', () => {
        expect(shouldSendMetaCsrfToken('theme=dark; other=1', 'meta-token')).toBe(true);
        expect(shouldSendMetaCsrfToken('', 'meta-token')).toBe(true);
    });

    it('does not mistake a cookie that merely contains the name for the XSRF cookie', () => {
        expect(shouldSendMetaCsrfToken('NOT-XSRF-TOKEN=1', 'meta-token')).toBe(true);
    });

    it('sends nothing when there is no meta token at all', () => {
        expect(shouldSendMetaCsrfToken('', null)).toBe(false);
        expect(shouldSendMetaCsrfToken('', undefined)).toBe(false);
        expect(shouldSendMetaCsrfToken('', '')).toBe(false);
    });
});
