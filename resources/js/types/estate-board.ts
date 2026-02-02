export type PostStatus = 'draft' | 'published';

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
    hashid: string;
    title: string | null;
    body: string;
    status: PostStatus;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author: PostAuthor;
    media: PostMedia[];
    comments_count: number;
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
