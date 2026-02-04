export type * from './auth';
export type * from './estate-board';
export type * from './access-code';
export type * from './security';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    [key: string]: unknown;
};
