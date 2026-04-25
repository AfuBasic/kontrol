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
    };
    billing_enabled?: boolean;
    has_overdue_invoice?: boolean;
    app_url: string;
    [key: string]: unknown;
};
