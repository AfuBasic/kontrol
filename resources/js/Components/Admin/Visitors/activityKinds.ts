import { ArrowDownRight, ArrowUpRight, Car, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ActivityEventType, VisitorRecord } from './types';

/**
 * Distinct visual identity for each activity kind.
 * Colors stay within Kontrol theme tokens only.
 */
export type ActivityKind = 'verified' | 'checked_in' | 'checked_out' | 'vehicle_entry';

export type ActivityKindConfig = {
    kind: ActivityKind;
    label: string;
    Icon: LucideIcon;
    /** Text accent */
    textClass: string;
    /** Soft chip background */
    chipClass: string;
    /** Spine node ring */
    nodeClass: string;
    /** Filled node center */
    nodeDotClass: string;
};

export const ACTIVITY_KINDS: Record<ActivityKind, ActivityKindConfig> = {
    verified: {
        kind: 'verified',
        label: 'Verified',
        Icon: ShieldCheck,
        textClass: 'text-primary-700',
        chipClass: 'border-primary-200 bg-primary-50 text-primary-700',
        nodeClass: 'border-primary-500',
        nodeDotClass: 'bg-primary-500',
    },
    checked_in: {
        kind: 'checked_in',
        label: 'Checked in',
        Icon: ArrowDownRight,
        textClass: 'text-primary-700',
        chipClass: 'border-primary-200 bg-primary-50 text-primary-700',
        nodeClass: 'border-primary-500',
        nodeDotClass: 'bg-primary-500',
    },
    checked_out: {
        kind: 'checked_out',
        label: 'Checked out',
        Icon: ArrowUpRight,
        textClass: 'text-gray-600',
        chipClass: 'border-gray-200 bg-gray-100 text-gray-600',
        nodeClass: 'border-gray-400',
        nodeDotClass: 'bg-gray-400',
    },
    vehicle_entry: {
        kind: 'vehicle_entry',
        label: 'Vehicle entry',
        Icon: Car,
        textClass: 'text-primary-700',
        chipClass: 'border-primary-200 bg-primary-50 text-primary-700',
        nodeClass: 'border-primary-500',
        nodeDotClass: 'bg-primary-500',
    },
};

/**
 * Resolve display kind from event type + record context.
 * Future kinds (denied, expired, extended) can plug in here when data exists.
 */
export function resolveActivityKind(eventType: ActivityEventType, record: VisitorRecord, checkoutEnabled: boolean): ActivityKind {
    if (eventType === 'check_out') {
        return 'checked_out';
    }

    if (record.vehicle?.plate) {
        return 'vehicle_entry';
    }

    return checkoutEnabled ? 'checked_in' : 'verified';
}

export function activityKindFromEventType(type: ActivityEventType): ActivityKind {
    return type === 'check_out' ? 'checked_out' : 'checked_in';
}
