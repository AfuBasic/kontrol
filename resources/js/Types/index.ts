export type * from './auth';
export type * from './estate-board';
export type * from './access-code';
export type * from './security';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    flash: {
        success?: string;
        error?: string;
        validation_result?: unknown;
        sos_success?: { id: string; time: string; has_emergency_contacts: boolean };
    };
    billing_enabled?: boolean;
    has_overdue_invoice?: boolean;
    access_code_durations: Array<{ minutes: number; label: string }>;
    access_code_constraints: { min: number; max: number };
    app_url: string;
    [key: string]: unknown;
};
