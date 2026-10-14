import { describe, expect, it, vi } from 'vitest';
import { openCheckout } from '../paystack';

function popup() {
    const resume = vi.fn();
    class Fake {
        resumeTransaction = resume;
    }

    return { Fake, resume };
}

describe('openCheckout', () => {
    it('opens the payment the server started, using only its access code', async () => {
        const { Fake, resume } = popup();

        await openCheckout({ accessCode: 'ac_123', onSuccess: vi.fn(), onClose: vi.fn() }, () => Promise.resolve(Fake));

        expect(resume).toHaveBeenCalledTimes(1);
        expect(resume.mock.calls[0][0]).toBe('ac_123');
    });

    it("hands over Paystack's reference when the payment goes through", async () => {
        const { Fake, resume } = popup();
        const onSuccess = vi.fn();

        await openCheckout({ accessCode: 'ac_123', onSuccess, onClose: vi.fn() }, () => Promise.resolve(Fake));
        resume.mock.calls[0][1].onSuccess({ reference: 'COLL-1' });

        expect(onSuccess).toHaveBeenCalledWith('COLL-1');
    });

    it('passes null when Paystack gives no reference, so the page can use its own', async () => {
        const { Fake, resume } = popup();
        const onSuccess = vi.fn();

        await openCheckout({ accessCode: 'ac_123', onSuccess, onClose: vi.fn() }, () => Promise.resolve(Fake));
        resume.mock.calls[0][1].onSuccess({});

        expect(onSuccess).toHaveBeenCalledWith(null);
    });

    it('reports a closed or failed popup so the pay button can come back', async () => {
        const { Fake, resume } = popup();
        const onClose = vi.fn();

        await openCheckout({ accessCode: 'ac_123', onSuccess: vi.fn(), onClose }, () => Promise.resolve(Fake));
        resume.mock.calls[0][1].onCancel();
        resume.mock.calls[0][1].onError(new Error('x'));

        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("sends the payer to Paystack's own page when the script cannot be loaded", async () => {
        const navigate = vi.fn();

        await openCheckout(
            { accessCode: 'ac_123', authorizationUrl: 'https://checkout.paystack.com/abc', onSuccess: vi.fn(), onClose: vi.fn() },
            () => Promise.reject(new Error('blocked')),
            navigate,
        );

        expect(navigate).toHaveBeenCalledWith('https://checkout.paystack.com/abc');
    });

    it('fails loudly, so the page can show a message, when there is neither a popup nor a page to send them to', async () => {
        await expect(
            openCheckout({ accessCode: 'ac_123', onSuccess: vi.fn(), onClose: vi.fn() }, () => Promise.reject(new Error('blocked')), vi.fn()),
        ).rejects.toThrow('blocked');
    });
});
