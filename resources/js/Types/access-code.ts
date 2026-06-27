export type AccessCodeStatus = 'active' | 'used' | 'expired' | 'revoked';
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
    guest_limit: number | null;
    used_at: string | null;
    revoked_at: string | null;
    created_at: string;
    time_remaining: string;
    estate_name?: string;
    host_name?: string;
    notes?: string | null;
    uses_count?: number;
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

export type ResidentHomeProps = {
    stats: HomeStats;
    activeCodes: AccessCode[];
    recentActivity: ActivityItem[];
    estateName: string;
};

export type VisitorsPageProps = {
    activeCodes: AccessCode[];
    historyCodes: AccessCode[];
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
