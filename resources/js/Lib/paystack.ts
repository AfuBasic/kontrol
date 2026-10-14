const INLINE_V2 = 'https://js.paystack.co/v2/inline.js';

/** What Paystack's v2 checkout hands back when a payment completes. Only the reference is relied on. */
export type PaystackTransaction = { reference?: string };

type PaystackPopup = {
    resumeTransaction: (
        accessCode: string,
        callbacks: { onSuccess?: (transaction: PaystackTransaction) => void; onCancel?: () => void; onError?: (error: unknown) => void },
    ) => unknown;
};

type PaystackConstructor = new () => PaystackPopup;

declare global {
    interface Window {
        PaystackPop?: PaystackConstructor;
    }
}

let loading: Promise<PaystackConstructor> | null = null;

/**
 * Loads Paystack's v2 checkout the first time it is needed. v1, which this app used to load on every page, has no
 * way to open a payment the server has already started (it ignores the access code and asks for an email and amount
 * instead), so a payment started on the server could never be opened with it.
 */
export function loadPaystack(): Promise<PaystackConstructor> {
    if (typeof window.PaystackPop === 'function') return Promise.resolve(window.PaystackPop);
    if (loading) return loading;

    loading = new Promise<PaystackConstructor>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = INLINE_V2;
        script.async = true;
        script.onload = () => (typeof window.PaystackPop === 'function' ? resolve(window.PaystackPop) : reject(new Error('Paystack did not start.')));
        script.onerror = () => reject(new Error('Paystack could not be loaded.'));
        document.head.appendChild(script);
    }).catch((error: Error) => {
        // Let the next attempt try again instead of remembering the failure.
        loading = null;
        throw error;
    });

    return loading;
}

type CheckoutOptions = {
    /** From the server, which already started the payment with the right amount, email and split. */
    accessCode: string;
    /** Where to send the payer if the popup cannot be loaded (an ad blocker, a bad connection). */
    authorizationUrl?: string | null;
    /** Called with Paystack's reference once the payment has gone through. */
    onSuccess: (reference: string | null) => void;
    /** Called when the popup is closed without paying, or could not be opened. */
    onClose: () => void;
};

/**
 * Opens a payment the server has started. If Paystack's script cannot be loaded, sends the payer to Paystack's own
 * page for the same payment instead of leaving them stuck.
 */
export async function openCheckout(
    { accessCode, authorizationUrl, onSuccess, onClose }: CheckoutOptions,
    load: () => Promise<PaystackConstructor> = loadPaystack,
    navigate: (url: string) => void = (url) => window.location.assign(url),
): Promise<void> {
    let Popup: PaystackConstructor;

    try {
        Popup = await load();
    } catch (error) {
        if (authorizationUrl) {
            navigate(authorizationUrl);
            return;
        }
        throw error;
    }

    new Popup().resumeTransaction(accessCode, {
        onSuccess: (transaction) => onSuccess(transaction?.reference ?? null),
        onCancel: onClose,
        onError: () => onClose(),
    });
}
