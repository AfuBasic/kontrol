export type Permission = {
    name: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    permissions?: Permission[];
    roles?: string[];
    created_at: string;
    updated_at: string;
    notifications?: {
        id: string;
        data: Record<string, unknown>;
        created_at_human: string;
    }[];
    unread_notifications_count?: number;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};
