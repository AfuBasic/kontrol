export type ValidationStatus =
    | 'granted'
    | 'not_found'
    | 'already_used'
    | 'expired'
    | 'revoked'
    | 'inactive';

export type ValidationResult = {
    valid: boolean;
    status: ValidationStatus;
    message: string;
    visitor_name: string | null;
    host_name: string | null;
    purpose: string | null;
    expires_at: string | null;
    code_type: 'single_use' | 'long_lived' | null;
};

export type NotificationType =
    | 'validation'
    | 'denied'
    | 'visitor'
    | 'alert'
    | 'system'
    | 'info';

export type SecurityNotification = {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon: string;
    read: boolean;
    created_at: string;
    created_at_human: string;
};

export type NotificationPagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type SecurityUser = {
    id: number;
    name: string;
    email: string;
};

export type SecurityHomePageProps = {
    estateName: string;
    flash?: {
        validation_result?: ValidationResult;
    };
};

export type SecurityNotificationsPageProps = {
    notifications: SecurityNotification[];
    pagination: NotificationPagination;
    unreadCount: number;
};

export type SecurityProfilePageProps = {
    user: SecurityUser;
    estateName: string;
};
