export type VisitorRecord = {
    id: number;
    code: string | null;
    visitor: {
        name: string;
        phone: string | null;
        type: string | null;
    };
    host: {
        id?: number | null;
        name: string;
        unit: string | null;
        address?: string | null;
    };
    purpose: string | null;
    issued_at: string | null;
    issued_at_iso: string | null;
    issued_by: string;
    verified_at: string;
    verified_at_iso: string;
    verified_at_human: string;
    verified_at_time: string;
    verifier_name: string;
    checked_out_at: string | null;
    checked_out_at_iso: string | null;
    checked_out_at_human: string | null;
    checked_out_at_time: string | null;
    checkout_verifier_name: string | null;
    duration_minutes: number | null;
    is_overstayed: boolean;
    code_expires_at: string | null;
    gate: string;
    entry_point?: string | null;
    exit_point?: string | null;
    vehicle: {
        make: string;
        model: string;
        plate: string;
    } | null;
};

export type ActivityEventType = 'check_in' | 'check_out';

export type ActivityEvent = {
    id: string;
    type: ActivityEventType;
    occurredAt: string;
    timeLabel: string;
    record: VisitorRecord;
};

export type SortField = 'verified_at' | 'visitor' | 'host' | 'duration' | 'checked_out_at' | 'status';

export type SortDirection = 'asc' | 'desc';

export type ActivityView = 'activity' | 'table';

export type VisitorFilters = {
    search?: string;
    date?: string;
    vehicle_plate?: string;
    host_id?: string | number;
    status?: string;
    gate?: string;
    verifier_id?: string | number;
    sort?: SortField | string;
    direction?: SortDirection | string;
    view?: ActivityView | string;
};

export function hasActiveVisitorFilters(filters: VisitorFilters): boolean {
    return Boolean(filters.search || filters.date || filters.vehicle_plate || filters.host_id || filters.status || filters.verifier_id);
}

/**
 * Format elapsed stay duration in a guest-book style (e.g. "12m", "1h 05m").
 * For visitors still on the property, dynamically computes elapsed time from verified_at_iso if provided.
 */
export function formatStayDuration(
    minutes: number | null | undefined,
    record?: { verified_at_iso?: string | null; checked_out_at?: string | null; verified_at?: string | null },
): string {
    let totalMinutes = minutes;

    // If visitor is currently on property and we have verified_at timestamp, calculate live elapsed minutes
    if (record && !record.checked_out_at && (record.verified_at_iso || record.verified_at)) {
        const verifiedIso = record.verified_at_iso || record.verified_at;
        const verifiedTime = new Date(verifiedIso!).getTime();
        if (!Number.isNaN(verifiedTime)) {
            const diffMs = Date.now() - verifiedTime;
            if (diffMs >= 0) {
                totalMinutes = Math.floor(diffMs / 60000);
            }
        }
    }

    if (totalMinutes == null || Number.isNaN(totalMinutes)) {
        return '-';
    }

    const total = Math.max(0, Math.floor(totalMinutes));
    if (total === 0) {
        return '<1m';
    }
    if (total < 60) {
        return `${total}m`;
    }

    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours < 24) {
        return mins > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

/**
 * Expand access logs into chronological check-in / check-out timeline events.
 */
export function buildActivityEvents(records: VisitorRecord[], checkoutEnabled: boolean): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    for (const record of records) {
        events.push({
            id: `${record.id}-in`,
            type: 'check_in',
            occurredAt: record.verified_at_iso,
            timeLabel: record.verified_at_time,
            record,
        });

        if (checkoutEnabled && record.checked_out_at_iso && record.checked_out_at_time) {
            events.push({
                id: `${record.id}-out`,
                type: 'check_out',
                occurredAt: record.checked_out_at_iso,
                timeLabel: record.checked_out_at_time,
                record,
            });
        }
    }

    return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

/**
 * Group events under human day labels: Today / Yesterday / calendar date.
 */
export function groupEventsByDay(events: ActivityEvent[]): Array<{ label: string; events: ActivityEvent[] }> {
    const groups = new Map<string, ActivityEvent[]>();
    const order: string[] = [];

    for (const event of events) {
        const label = dayGroupLabel(event.occurredAt);
        if (!groups.has(label)) {
            groups.set(label, []);
            order.push(label);
        }
        groups.get(label)!.push(event);
    }

    return order.map((label) => ({
        label,
        events: groups.get(label)!,
    }));
}

function dayGroupLabel(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    }
    if (diffDays === 1) {
        return 'Yesterday';
    }

    // Full weekday + long month for chapter weight (e.g. "Monday, July 21")
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    }

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}
