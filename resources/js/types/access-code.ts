export type AccessCodeStatus = 'active' | 'used' | 'expired' | 'revoked';

export type AccessCode = {
    id: number;
    code: string;
    type: 'single_use' | 'long_lived';
    visitor_name: string | null;
    visitor_phone: string | null;
    purpose: string | null;
    status: AccessCodeStatus;
    expires_at: string;
    used_at: string | null;
    revoked_at: string | null;
    created_at: string;
    time_remaining: string;
};

export type DurationOption = {
    minutes: number;
    label: string;
};

export type HomeStats = {
    active_codes: number;
    codes_today: number;
    visitors_today: number;
};

export type ActivityItem = {
    type: 'created' | 'used' | 'expired' | 'revoked';
    message: string;
    time: string;
    time_full: string;
    code?: string;
    visitor?: string;
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
};

export type CursorPaginatedUsageLogs = {
    data: UsageLog[];
    next_cursor: string | null;
    next_page_url: string | null;
    per_page: number;
};
