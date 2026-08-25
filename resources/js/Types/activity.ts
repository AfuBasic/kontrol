export type ActivitySemanticTone = 'normal' | 'important' | 'warning' | 'financial';

export interface ActivityActor {
    id: number | null;
    name: string;
    initials: string;
}

export interface ActivitySubject {
    id: number | null;
    type: string | null;
    name: string | null;
}

export interface ActivityItem {
    id: number;
    headline: string;
    supporting_context: string | null;
    module: string;
    module_label: string;
    icon_type: string;
    semantic_tone: ActivitySemanticTone;
    actor: ActivityActor | null;
    subject: ActivitySubject | null;
    timestamp: string;
    relative_time: string;
    destination_url: string | null;
    is_system: boolean;
    is_important: boolean;
}

export interface ActivityPageMeta {
    today_count: number;
    last_activity_at: string;
}

export interface ActivityPageFilters {
    search: string | null;
    module: string | null;
}

export interface ActivityCursorPagination {
    data: ActivityItem[];
    next_page_url: string | null;
    prev_page_url?: string | null;
    next_cursor?: string | null;
    prev_cursor?: string | null;
}

export interface ActivityLogIndexProps {
    activities: ActivityCursorPagination;
    filters: ActivityPageFilters;
    meta: ActivityPageMeta;
}
