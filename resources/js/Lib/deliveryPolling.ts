/**
 * Rules for watching a group's emails go out, kept apart from React so they can be tested on their own.
 */

export type DeliveryStatus = 'pending' | 'queued' | 'sent' | 'failed';

export interface DeliveryUpdate {
    id: number;
    delivery_status: DeliveryStatus;
    delivery_error: string | null;
    delivered_label: string;
}

interface DeliveryFields {
    id: number;
    delivery_status: DeliveryStatus;
    delivery_error: string | null;
    delivered_label: string;
}

/** Look again this often while passes are actively going out. */
export const POLL_FAST_MS = 2_500;

/** After several looks with nothing new, ease off. */
export const POLL_SLOW_MS = 8_000;

/** The longest wait between looks when the connection keeps failing. */
export const POLL_MAX_BACKOFF_MS = 30_000;

/** Stop watching after this long. Emails normally go out in seconds; this means something is stuck. */
export const GIVE_UP_AFTER_MS = 10 * 60_000;

/** How many unchanged looks in a row before easing off. */
export const QUIET_POLLS_BEFORE_SLOW = 5;

/** Only passes that are on their way need watching. Waiting ones are waiting for a person, not for time. */
export function isSending(recipients: Array<{ delivery_status: DeliveryStatus }>): boolean {
    return recipients.some((recipient) => recipient.delivery_status === 'queued');
}

export function nextDelay({ quietPolls, failures }: { quietPolls: number; failures: number }): number {
    if (failures > 0) {
        return Math.min(POLL_MAX_BACKOFF_MS, POLL_FAST_MS * 2 ** failures);
    }

    return quietPolls >= QUIET_POLLS_BEFORE_SLOW ? POLL_SLOW_MS : POLL_FAST_MS;
}

/** Apply fresh delivery facts to the people already on screen. Returns the same array when nothing changed. */
export function mergeUpdates<T extends DeliveryFields>(recipients: T[], updates: DeliveryUpdate[]): T[] {
    if (updates.length === 0) {
        return recipients;
    }

    const byId = new Map(updates.map((update) => [update.id, update]));
    let changed = false;

    const merged = recipients.map((recipient) => {
        const update = byId.get(recipient.id);

        if (
            !update ||
            (update.delivery_status === recipient.delivery_status &&
                update.delivery_error === recipient.delivery_error &&
                update.delivered_label === recipient.delivered_label)
        ) {
            return recipient;
        }

        changed = true;

        return {
            ...recipient,
            delivery_status: update.delivery_status,
            delivery_error: update.delivery_error,
            delivered_label: update.delivered_label,
        };
    });

    return changed ? merged : recipients;
}

/** A compact fingerprint, so two looks can be compared to see whether anything moved. */
export function signature(updates: DeliveryUpdate[]): string {
    return updates
        .map((update) => `${update.id}:${update.delivery_status}`)
        .sort()
        .join('|');
}

export function summarize(recipients: Array<{ delivery_status: DeliveryStatus }>) {
    const count = (status: DeliveryStatus) => recipients.filter((recipient) => recipient.delivery_status === status).length;

    return {
        total: recipients.length,
        sent: count('sent'),
        failed: count('failed'),
        sending: count('queued'),
        waiting: count('pending'),
    };
}
