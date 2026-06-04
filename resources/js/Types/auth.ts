export type Permission = {
    name: string;
};

export type ResidentSubscription = {
    status: 'trial' | 'active' | 'past_due';
    trial_ends_at: string | null;
    current_period_end: string | null;
    is_active: boolean;
    is_grace_period: boolean;
    plan_name: string;
    billing_interval: string;
    parent_resident_name?: string | null;
    is_household_member?: boolean;
};

export type UserProfile = {
    id?: number;
    user_id?: number;
    property_owner_id?: number | null;
    property_id?: number | null;
    phone?: string | null;
    address?: string | null;
    unit_number?: string | null;
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
    current_estate_id?: number;
    property_owner_id?: number | null;
    notifications?: {
        id: string;
        data: Record<string, unknown>;
        created_at_human: string;
    }[];
    unread_notifications_count?: number;
    resident_subscription?: ResidentSubscription | null;
    profile?: UserProfile | null;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};
