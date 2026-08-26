import React from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Ban,
    Calendar,
    Car,
    CheckCircle2,
    Clock,
    DoorOpen,
    HelpCircle,
    Info,
    LogOut,
    MapPin,
    Pause,
    Play,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    User,
    WifiOff,
} from 'lucide-react';

export type ValidationResult = {
    valid: boolean;
    status: string;
    message?: string | null;
    visitor_name?: string | null;
    host_name?: string | null;
    purpose?: string | null;
    expires_at?: string | null;
    starts_at?: string | null;
    code_type?: string | null;
    has_vehicle?: boolean;
    access_log_id?: number | null;
    guest_limit?: number | null;
    uses_count?: number;
    action?: string | null;
    verified_at?: string | null;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    entry_point?: string | null;
    exit_point?: string | null;
    duration_minutes?: number | null;
    offline?: boolean;
};

export type SemanticTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export type FactItem = {
    label: string;
    value: string;
    highlight?: boolean;
};

export type ResolvedDecision = {
    tone: SemanticTone;
    statusLabel: string;
    statusSubtitle: string;
    Icon: React.ComponentType<{ className?: string }>;
    showIdentity: boolean;
    visitorName: string | null;
    hostName: string | null;
    purpose: string | null;
    facts: FactItem[];
    primaryActionLabel: string;
    secondaryActionLabel?: string | null;
    actionType: 'admit' | 'checkout_confirm' | 'scan_next' | 'retry' | 'bypass';
    allowAutoReturn: boolean;
    badgeLabel?: string | null;
};

export function formatDateTimeSafe(iso: string | null | undefined): string | null {
    if (!iso) return null;
    try {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return null;
    }
}

export function formatTimeOnly(iso: string | null | undefined): string | null {
    if (!iso) return null;
    try {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return null;
    }
}

export function formatStayDurationSafe(minutes: number | null | undefined): string | null {
    if (minutes == null || Number.isNaN(minutes)) return null;
    const total = Math.max(0, Math.floor(minutes));
    if (total === 0) return 'Less than a minute';
    if (total < 60) return `${total} min${total === 1 ? '' : 's'}`;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (mins === 0) return `${hours} hr${hours === 1 ? '' : 's'}`;
    return `${hours}h ${mins}m`;
}

export function getPassTypeLabel(type: string | null | undefined): string {
    switch (type) {
        case 'single_use':
            return 'One-Time Pass';
        case 'long_lived':
            return 'Recurring Pass';
        case 'event':
            return 'Event Pass';
        default:
            return 'Visitor Pass';
    }
}

/**
 * Single source of truth for resolving verification result presentation.
 */
export function resolveVerificationDecision(result: ValidationResult): ResolvedDecision {
    const valid = result.valid;
    const isCheckoutPending = result.action === 'checkout_pending';
    const isOffline = Boolean(result.offline && valid);

    // 1. Offline Unverified
    if (result.status === 'offline_not_found') {
        return {
            tone: 'warning',
            statusLabel: 'UNVERIFIED (OFFLINE)',
            statusSubtitle: 'Code was not found in the encrypted local offline cache.',
            Icon: WifiOff,
            showIdentity: false,
            visitorName: null,
            hostName: null,
            purpose: null,
            facts: [],
            primaryActionLabel: 'Admit via Security Bypass',
            secondaryActionLabel: 'Verify Another Pass',
            actionType: 'bypass',
            allowAutoReturn: false,
            badgeLabel: 'Offline Warning',
        };
    }

    // 2. Checkout Recorded (Successful post-checkout decision)
    if (result.status === 'checked_out_success') {
        const facts: FactItem[] = [];
        const checkedIn = formatDateTimeSafe(result.checked_in_at);
        const checkedOut = formatDateTimeSafe(result.checked_out_at);
        const duration = formatStayDurationSafe(result.duration_minutes);

        if (checkedIn) {
            facts.push({ label: 'Entry', value: result.entry_point ? `${checkedIn} · ${result.entry_point}` : checkedIn });
        }
        if (checkedOut) {
            facts.push({ label: 'Checkout', value: result.exit_point ? `${checkedOut} · ${result.exit_point}` : checkedOut });
        }
        if (duration) {
            facts.push({ label: 'Visit Duration', value: duration, highlight: true });
        }

        return {
            tone: 'info',
            statusLabel: 'CHECKOUT RECORDED',
            statusSubtitle: 'The visitor has been checked out successfully.',
            Icon: CheckCircle2,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: true,
        };
    }

    // 3. Visitor Currently Inside (Checkout Confirmation Pending)
    if (isCheckoutPending) {
        const facts: FactItem[] = [];
        const checkedIn = formatDateTimeSafe(result.checked_in_at);
        if (checkedIn) {
            facts.push({ label: 'Checked In', value: checkedIn });
        }
        if (result.entry_point) {
            facts.push({ label: 'Entry Gate', value: result.entry_point });
        }
        if (result.code_type) {
            facts.push({ label: 'Pass Type', value: getPassTypeLabel(result.code_type) });
        }

        return {
            tone: 'info',
            statusLabel: 'ALREADY CHECKED IN',
            statusSubtitle: 'Visitor is currently registered inside the estate.',
            Icon: LogOut,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Confirm Check-Out',
            secondaryActionLabel: 'Cancel',
            actionType: 'checkout_confirm',
            allowAutoReturn: false,
            badgeLabel: 'Visitor On Property',
        };
    }

    // 4. Pass Not Recognized (404 / Invalid Code)
    if (result.status === 'not_found' || (!valid && !result.visitor_name && result.status !== 'disabled')) {
        return {
            tone: 'error',
            statusLabel: 'PASS NOT RECOGNIZED',
            statusSubtitle: "We couldn't find an active visitor pass matching this code.",
            Icon: ShieldX,
            showIdentity: false,
            visitorName: null,
            hostName: null,
            purpose: null,
            facts: [],
            primaryActionLabel: 'Verify Another Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 5. Pass Already Used (Terminal single-use pass)
    if (result.status === 'already_used') {
        const facts: FactItem[] = [];
        facts.push({ label: 'Pass Type', value: 'One-Time Pass' });
        if (result.uses_count && result.uses_count > 0) {
            facts.push({ label: 'Total Uses', value: `${result.uses_count} time(s)` });
        }

        return {
            tone: 'error',
            statusLabel: 'PASS ALREADY USED',
            statusSubtitle: 'This single-use access pass was previously consumed and cannot be reused.',
            Icon: Ban,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 6. Not Valid Yet / Scheduled in Future
    if (result.status === 'scheduled') {
        const facts: FactItem[] = [];
        const startsAt = formatDateTimeSafe(result.starts_at);
        if (startsAt) {
            facts.push({ label: 'Valid Starting From', value: startsAt, highlight: true });
        }
        if (result.expires_at) {
            const expires = formatDateTimeSafe(result.expires_at);
            if (expires) facts.push({ label: 'Valid Until', value: expires });
        }
        facts.push({ label: 'Pass Type', value: getPassTypeLabel(result.code_type) });

        return {
            tone: 'warning',
            statusLabel: 'NOT VALID YET',
            statusSubtitle: 'This visitor pass is scheduled for a future time window.',
            Icon: Clock,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
            badgeLabel: 'Future Schedule',
        };
    }

    // 7. Outside Permitted Recurring Schedule
    if (result.status === 'outside_schedule') {
        const facts: FactItem[] = [];
        facts.push({ label: 'Pass Type', value: getPassTypeLabel(result.code_type) });
        if (result.purpose) {
            facts.push({ label: 'Designation', value: result.purpose });
        }

        return {
            tone: 'warning',
            statusLabel: 'OUTSIDE PERMITTED HOURS',
            statusSubtitle: 'This recurring pass is not authorized for entry at this time based on its schedule.',
            Icon: Clock,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 8. Pass Expired
    if (result.status === 'expired') {
        const facts: FactItem[] = [];
        const expiredOn = formatDateTimeSafe(result.expires_at);
        if (expiredOn) {
            facts.push({ label: 'Expired At', value: expiredOn, highlight: true });
        }
        facts.push({ label: 'Pass Type', value: getPassTypeLabel(result.code_type) });

        return {
            tone: 'error',
            statusLabel: 'PASS EXPIRED',
            statusSubtitle: 'This visitor pass has passed its validity window and grace period.',
            Icon: Clock,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 9. Pass Revoked
    if (result.status === 'revoked') {
        const facts: FactItem[] = [];
        facts.push({ label: 'Pass Type', value: getPassTypeLabel(result.code_type) });

        return {
            tone: 'error',
            statusLabel: 'PASS REVOKED',
            statusSubtitle: 'This access pass was cancelled by the host resident or estate administration.',
            Icon: ShieldAlert,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 10. Event Guest Limit Reached
    if (result.status === 'limit_reached') {
        const facts: FactItem[] = [];
        facts.push({ label: 'Event Guest Limit', value: `${result.guest_limit ?? 'N/A'} attendees` });
        facts.push({ label: 'Admissions Recorded', value: `${result.uses_count ?? 0}` });

        return {
            tone: 'error',
            statusLabel: 'EVENT CAPACITY REACHED',
            statusSubtitle: 'Maximum allowed attendee check-ins have already been recorded for this event pass.',
            Icon: ShieldX,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Event Pass',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 11. Checkout Gate Mismatch
    if (result.status === 'checkout_mismatch') {
        const facts: FactItem[] = [];
        if (result.entry_point) {
            facts.push({ label: 'Original Entry Gate', value: result.entry_point, highlight: true });
        }

        return {
            tone: 'warning',
            statusLabel: 'CHECKOUT GATE MISMATCH',
            statusSubtitle: result.message || 'Visitor must check out at the exact gate through which they entered.',
            Icon: AlertTriangle,
            showIdentity: true,
            visitorName: result.visitor_name?.trim() || 'Visitor',
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts,
            primaryActionLabel: 'Return to Scanner',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 12. Visitor Access Disabled by Estate Policy
    if (result.status === 'disabled') {
        return {
            tone: 'error',
            statusLabel: 'VISITOR ACCESS DISABLED',
            statusSubtitle: 'Visitor pass verification is currently disabled by estate management policy.',
            Icon: ShieldX,
            showIdentity: false,
            visitorName: null,
            hostName: null,
            purpose: null,
            facts: [],
            primaryActionLabel: 'Scan Next Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 13. Generic Access Denied / Inactive
    if (!valid) {
        return {
            tone: 'error',
            statusLabel: 'ACCESS DENIED',
            statusSubtitle: result.message || 'The pass is inactive or could not be authorized.',
            Icon: ShieldX,
            showIdentity: Boolean(result.visitor_name),
            visitorName: result.visitor_name?.trim() || null,
            hostName: result.host_name?.trim() || null,
            purpose: result.purpose?.trim() || null,
            facts: [],
            primaryActionLabel: 'Verify Another Pass',
            actionType: 'scan_next',
            allowAutoReturn: false,
        };
    }

    // 14. Standard Valid Admission (Entry Recorded / Access Granted)
    const validFacts: FactItem[] = [];
    validFacts.push({ label: 'Pass Type', value: getPassTypeLabel(result.code_type) });

    if (result.expires_at) {
        const validUntil = formatDateTimeSafe(result.expires_at);
        if (validUntil) {
            validFacts.push({ label: 'Valid Until', value: validUntil });
        }
    } else {
        validFacts.push({ label: 'Validity', value: 'No expiry' });
    }

    if (result.entry_point) {
        validFacts.push({ label: 'Gate', value: result.entry_point });
    }

    if (result.code_type === 'event' && result.guest_limit) {
        validFacts.push({ label: 'Attendance', value: `${(result.uses_count ?? 0) + 1} / ${result.guest_limit}` });
    }

    return {
        tone: isOffline ? 'warning' : 'success',
        statusLabel: isOffline ? 'ENTRY RECORDED (OFFLINE)' : 'ENTRY RECORDED',
        statusSubtitle: isOffline
            ? 'Pass verified locally via offline cache. Will sync automatically.'
            : 'Pass verified and visitor admission recorded successfully.',
        Icon: ShieldCheck,
        showIdentity: true,
        visitorName: result.visitor_name?.trim() || (result.code_type === 'event' ? 'Event Guest' : 'Visitor'),
        hostName: result.host_name?.trim() || null,
        purpose: result.purpose?.trim() || null,
        facts: validFacts,
        primaryActionLabel: result.has_vehicle ? 'Confirm Vehicle & Admit' : 'Scan Next Pass',
        actionType: result.has_vehicle ? 'admit' : 'scan_next',
        allowAutoReturn: !result.has_vehicle,
        badgeLabel: isOffline ? 'Offline Sync Pending' : undefined,
    };
}
