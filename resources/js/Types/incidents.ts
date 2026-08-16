export type IncidentStatus = 'pending' | 'acknowledged' | 'resolving' | 'solved' | 'closed';

export type IncidentCategory =
    | 'electricity'
    | 'water_plumbing'
    | 'road_infrastructure'
    | 'security'
    | 'sanitation_waste'
    | 'noise_disturbance'
    | 'lighting'
    | 'common_areas'
    | 'internet_cable'
    | 'other';

export type Incident = {
    id: number;
    ulid: string;
    hashid: string;
    title: string;
    body: string;
    category: IncidentCategory;
    status: IncidentStatus;
    reporter: {
        id: number;
        name: string;
        email: string;
    };
    assignee?: {
        id: number;
        name: string;
        email: string;
    } | null;
    upvotes_count: number;
    comments_count: number;
    attachment_url: string | null;
    attachment_type: 'image' | 'video' | null;
    is_upvoted?: boolean;
    can_close?: boolean;
    location?: string | null;
    is_private: boolean;
    created_at: string;
    updated_at: string;
    acknowledged_at?: string | null;
    resolving_at?: string | null;
    solved_at?: string | null;
    closed_at?: string | null;
    zone?: {
        id: number;
        name: string;
    } | null;
};

export type IncidentComment = {
    id: number;
    incident_id: number;
    body: string;
    is_official: boolean;
    parent_id: number | null;
    author: {
        id: number;
        name: string;
        email: string;
    };
    replies?: IncidentComment[];
    created_at: string;
    updated_at: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};
