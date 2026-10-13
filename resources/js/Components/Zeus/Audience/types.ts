export type Range = '7d' | '30d' | '90d';

export type GroupKey = 'android_app' | 'ios_app' | 'installed_web' | 'phone_browser' | 'desktop_browser' | 'other';

export type Summary = {
    /** Null when sessions are not kept in the database, so there is nothing to count. */
    online_now: number | null;
    today: number;
    yesterday: number;
    week: number;
    previous_week: number;
    month: number;
    stickiness: number | null;
    in_range: number;
    previous_range: number;
    app_users: number;
    app_share: number | null;
    total_users: number;
    new_users: number;
};

export type PlatformRow = { key: GroupKey; label: string; users: number };

export type DayPoint = { day: string; total: number } & Record<GroupKey, number>;

export type VersionGroup = {
    os: string;
    label: string;
    users: number;
    latest: string | null;
    on_latest: number;
    unknown: number;
    versions: Array<{ version: string; users: number; is_latest: boolean }>;
};

export type RoleRow = { role: string; users: number };

export type EstateRow = {
    id: number;
    name: string;
    members: number;
    active: number;
    rate: number;
    app_users: number;
    app_share: number | null;
};

export type OnlineRow = {
    user_id: number;
    name: string;
    estate: string | null;
    client: GroupKey | null;
    app_version: string | null;
    last_active_at: string;
    last_active_human: string;
};

export type Overview = {
    range: Range;
    generated_at: string;
    summary: Summary;
    health: { level: 'ok' | 'attention' | 'down'; message: string };
    tracking_since: string | null;
    platforms: PlatformRow[];
    series: DayPoint[];
    versions: VersionGroup[];
    roles: RoleRow[];
    estates: { busiest: EstateRow[]; quietest: EstateRow[] };
    online: OnlineRow[] | null;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
