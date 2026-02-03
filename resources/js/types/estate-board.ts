export type PostStatus = 'draft' | 'published';

export type PostAudience = 'all' | 'residents' | 'security';

export type PostMedia = {
    id: number;
    url: string;
    mime_type: string;
    width: number | null;
    height: number | null;
    sort_order: number;
};

export type PostAuthor = {
    id: number;
    name: string;
    email: string;
};

export type EstateBoardPost = {
    id: number;
    hashid: any;
    title: string | null;
    body: string;
    status: PostStatus;
    audience: PostAudience;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author: PostAuthor;
    media: PostMedia[];
    comments_count: number;
    media_count?: number;
};

export type CommentAuthor = {
    id: number;
    name: string;
    email: string;
};

export type EstateBoardComment = {
    id: number;
    body: string;
    created_at: string;
    author: CommentAuthor;
    replies?: EstateBoardComment[];
    replies_count?: number;
    parent_id: number | null;
    can_delete?: boolean;
};

export type CursorPaginatedPosts = {
    data: EstateBoardPost[];
    next_cursor: string | null;
    prev_cursor: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    per_page: number;
};

export type CursorPaginatedComments = {
    data: EstateBoardComment[];
    next_cursor: string | null;
    prev_cursor: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    per_page: number;
};

// Dashboard Types
export type DashboardStats = {
    residents: {
        total: number;
        active: number;
        trend: number;
        new_this_month: number;
    };
    security: {
        total: number;
        active: number;
    };
    posts: {
        total: number;
        published: number;
        draft: number;
        trend: number;
        new_this_month: number;
    };
    comments: {
        total: number;
    };
    estate: {
        name: string;
        address: string | null;
    };
};

export type ChartDataPoint = {
    date: string;
    day: string;
    posts: number;
    comments: number;
};

export type RecentActivity = {
    id: number;
    description: string;
    causer: {
        name: string;
        email: string;
    } | null;
    subject_type: string;
    created_at: string;
    created_at_full: string;
};

export type RecentPost = {
    id: number;
    hashid: string;
    title: string | null;
    body: string;
    author: {
        name: string;
    };
    comments_count: number;
    media_count: number;
    has_media: boolean;
    published_at: string;
    audience: PostAudience;
};

export type TodayStats = {
    new_posts: number;
    new_comments: number;
    new_residents: number;
};
