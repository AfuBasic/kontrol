import { describe, expect, it } from 'vitest';
import { resolveVerificationDecision } from '../verificationDecision';

describe('resolveVerificationDecision', () => {
    it('tells a guard a wrong-zone pass belongs to another zone, not that it is unknown', () => {
        const decision = resolveVerificationDecision({
            valid: false,
            status: 'wrong_zone',
            message: 'This pass belongs to a different zone. Send the visitor to the correct gate.',
            visitor_name: null,
            host_name: null,
        });

        expect(decision.statusLabel).toBe('WRONG ZONE');
        expect(decision.tone).toBe('warning');
        expect(decision.statusSubtitle).toContain('different zone');
        expect(decision.actionType).toBe('scan_next');
    });

    it('does not reveal the visitor or host for a wrong-zone pass', () => {
        const decision = resolveVerificationDecision({ valid: false, status: 'wrong_zone', visitor_name: 'Zed', host_name: 'Ada' });

        expect(decision.showIdentity).toBe(false);
        expect(decision.visitorName).toBeNull();
        expect(decision.hostName).toBeNull();
    });

    it('still reports a genuinely unknown code as not recognized', () => {
        const decision = resolveVerificationDecision({ valid: false, status: 'not_found', visitor_name: null });

        expect(decision.statusLabel).toBe('PASS NOT RECOGNIZED');
    });
});
