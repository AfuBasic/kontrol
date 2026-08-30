export type AccessCodeStatus = 'active' | 'scheduled' | 'used' | 'expired' | 'revoked';
export type AccessCodeSource = 'web' | 'telegram';

export type AccessCode = {
    id: number;
    code: string;
    pass_uuid?: string;
    qr_token?: string;
    type: 'single_use' | 'long_lived' | 'event';
    visitor_name: string | null;
    visitor_phone: string | null;
    purpose: string | null;
    status: AccessCodeStatus;
    source: AccessCodeSource;
    expires_at: string;
    starts_at: string | null;
    used_at: string | null;
    revoked_at: string | null;
    guest_limit: number | null;
    created_at: string;
    time_remaining: string;
    estate_name?: string;
    host_name?: string;
    notes?: string | null;
    has_vehicle?: boolean;
    uses_count?: number;
    resident_address?: string | null;

    // ── Visitor Timeline canonical fields ────────────────────────────────────
    // These are the ONLY fields the frontend should use for grouping/sorting.
    // The underlying database columns (starts_at, expires_at, used_at, etc.)
    // are implementation details exposed for display purposes only.

    /** ISO timestamp of the scheduled/expected visit. Always present. */
    effective_visit_at: string;
    /** YYYY-MM-DD derived from effective_visit_at (server timezone). */
    arrival_date: string;
    /** "10:00 AM" - null when no explicit arrival time is set ("Anytime"). */
    arrival_time: string | null;

    /** ISO timestamp of when the visit was completed. Only present on history items. */
    completion_at?: string | null;
    /** YYYY-MM-DD derived from completion_at. */
    completion_date?: string | null;
    /** "3:45 PM" derived from completion_at. */
    is_eligible_for_reminder?: boolean;
    reminder?: VisitorPassReminderData | null;
};

export type VisitorPassReminderData = {
    id: number;
    reminder_offset_minutes: number;
    scheduled_for: string;
    status: 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
    formatted_time?: string;
    formatted_date?: string;
};

export type ReminderOption = {
    minutes: number;
    label: string;
};

export type DurationOption = {
    minutes: number;
    label: string;
};

export type HomeStats = {
    active_codes: number;
    created_today: number;
    visitors_today: number;
    total_expected: number;
};

export type ActivityItem = {
    type: 'created' | 'used' | 'expired' | 'revoked' | 'telegram_linked' | 'telegram_unlinked' | 'logged_in';
    message: string;
    time: string;
    time_full: string;
    code?: string;
    visitor?: string;
    detail?: string | null;
    ip_address?: string | null;
};

/**
 * A single date bucket in the Visitor Timeline.
 *
 * Includes calendar-ready metadata so this structure can power both the
 * Agenda View (current) and Calendar View (future) without recalculation.
 */
export type VisitorTimelineGroup = {
    /** ISO date string: "2026-07-23" */
    date: string;
    /** Human-readable heading: "Today", "Tomorrow", "Friday", "July 30" */
    label: string;
    /** Full weekday name: "Wednesday" */
    weekday: string;
    /** Full month name: "July" */
    month: string;
    /** Four-digit year: 2026 */
    year: number;
    /** Visitor passes scheduled on this date */
    items: AccessCode[];
};

export type ResidentHomeProps = {
    stats: HomeStats;
    activeCodes: AccessCode[];
    recentActivity: ActivityItem[];
    estateName: string;
};

export type VisitorsPageProps = {
    upcomingTimeline: AccessCode[];
    historyTimeline: AccessCode[];
    filters: {
        search_upcoming?: string;
        search_history?: string;
    };
};

export type ActivityPageProps = {
    activities: ActivityItem[];
};

export type CreateCodePageProps = {
    durationOptions: DurationOption[];
};

export type CodeSuccessPageProps = {
    accessCode: AccessCode;
};

export type UsageLog = {
    id: number;
    verified_at: string;
    verifier_name: string;
    checked_out_at?: string | null;
    checkout_verifier_name?: string | null;
};

export type CursorPaginatedUsageLogs = {
    data: UsageLog[];
    next_cursor: string | null;
    next_page_url: string | null;
    per_page: number;
};
