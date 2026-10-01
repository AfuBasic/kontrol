import { usePage } from '@inertiajs/react';
import { useState, useCallback } from 'react';

/**
 * Returns a gated action wrapper for org write actions.
 * When the user's subscription is inactive, the gate sheet is shown instead
 * of executing the action.
 *
 * Usage:
 *   const { gated, gateSheetOpen, closeGateSheet } = useSubscriptionGate();
 *   <button onClick={gated(() => setShowForm(true))}>Add person</button>
 *   <SubscriptionGateSheet open={gateSheetOpen} onClose={closeGateSheet} />
 */
export function useSubscriptionGate() {
    const page = usePage();
    const subscription = (page.props as any).auth?.user?.resident_subscription;
    const isActive = subscription?.is_active === true;

    const [gateSheetOpen, setGateSheetOpen] = useState(false);

    const gated = useCallback(
        (action: () => void) =>
            () => {
                if (!isActive) {
                    setGateSheetOpen(true);
                    return;
                }
                action();
            },
        [isActive],
    );

    const closeGateSheet = useCallback(() => setGateSheetOpen(false), []);

    return { gated, gateSheetOpen, closeGateSheet, isActive };
}
