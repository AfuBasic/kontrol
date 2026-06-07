export type * from './auth';
export type * from './estate-board';
export type * from './access-code';
export type * from './security';

import type { Auth } from './auth';

export type EstatePlan = {
    name: string;
    status: string;
    features: string[];
    limits: {
        max_residents: number | null;
        max_security: number | null;
        max_admins: number | null;
        max_household_members: number | null;
    };
};

export type SharedData = {
    name: string;
    auth: Auth;
    estate_plan: EstatePlan | null;
    flash: {
        success?: string;
        error?: string;
        validation_result?: unknown;
        sos_success?: { id: string; time: string; has_emergency_contacts: boolean };
    };
    errors: Record<string, string>;
    unreadCount?: number;
    billing_enabled?: boolean;
    has_overdue_invoice?: boolean;
    access_code_durations: Array<{ minutes: number; label: string }>;
    access_code_constraints: { min: number; max: number };
    app_url: string;
    is_local?: boolean;
};
