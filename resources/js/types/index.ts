export type * from './auth';
export type * from './estate-board';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    [key: string]: unknown;
};
