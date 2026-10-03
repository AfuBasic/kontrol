import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import {
    type DeliveryStatus,
    type DeliveryUpdate,
    GIVE_UP_AFTER_MS,
    isSending,
    mergeUpdates,
    nextDelay,
    POLL_SLOW_MS,
    signature,
} from '@/Lib/deliveryPolling';

interface RecipientLike {
    id: number;
    delivery_status: DeliveryStatus;
    delivery_error: string | null;
    delivered_label: string;
}

/**
 * Keeps a group's delivery status live while its emails are going out.
 *
 * It only polls while something is actually queued, and it is considerate about it:
 * - it pauses while the tab is hidden or the phone is offline, and looks again the moment that changes;
 * - it eases off when nothing is moving, and backs off further if the connection keeps failing;
 * - it gives up after ten minutes and reports `stalled`, because emails normally take seconds;
 * - when everything has gone out it refreshes the page data once, so the rest of the screen catches up.
 */
export function useDeliveryProgress<T extends RecipientLike>(groupId: number, serverRecipients: T[]) {
    const [updates, setUpdates] = useState<DeliveryUpdate[]>([]);
    const [stalled, setStalled] = useState(false);
    const { isOnline } = useNetworkQuality();

    const recipients = useMemo(() => mergeUpdates(serverRecipients, updates), [serverRecipients, updates]);
    const sending = isSending(recipients);

    // Fresh data from the server always wins over what we were tracking locally.
    useEffect(() => {
        setUpdates([]);
        setStalled(false);
    }, [serverRecipients]);

    const lastSignature = useRef('');

    useEffect(() => {
        if (!sending || !isOnline) {
            return;
        }

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let quietPolls = 0;
        let failures = 0;
        const startedAt = Date.now();

        const schedule = (delay: number) => {
            if (!cancelled) {
                timer = setTimeout(tick, delay);
            }
        };

        const tick = async () => {
            if (cancelled) return;

            if (document.visibilityState === 'hidden') {
                schedule(POLL_SLOW_MS);

                return;
            }

            if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
                setStalled(true);

                return;
            }

            const controller = new AbortController();
            const abortTimer = setTimeout(() => controller.abort(), 10_000);

            try {
                const response = await fetch(`/org/bulk-invites/${groupId}/delivery-status`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const body: { recipients: DeliveryUpdate[] } = await response.json();
                if (cancelled) return;

                failures = 0;

                const fingerprint = signature(body.recipients);
                quietPolls = fingerprint === lastSignature.current ? quietPolls + 1 : 0;
                lastSignature.current = fingerprint;

                setUpdates(body.recipients);

                if (!isSending(body.recipients)) {
                    // Everything has gone out (or failed). Let the rest of the page catch up, once.
                    router.reload({ only: ['bulkInvite'] });

                    return;
                }
            } catch {
                failures += 1;
            } finally {
                clearTimeout(abortTimer);
            }

            schedule(nextDelay({ quietPolls, failures }));
        };

        const onVisible = () => {
            if (document.visibilityState === 'visible' && timer) {
                clearTimeout(timer);
                void tick();
            }
        };

        document.addEventListener('visibilitychange', onVisible);
        schedule(1_000);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [sending, isOnline, groupId]);

    return { recipients, stalled };
}
