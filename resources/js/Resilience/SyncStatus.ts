/**
 * Lifecycle status for every offline-capable write operation.
 * Shared across Security scan logs, resident visitor passes, incidents, etc.
 */
export enum SyncStatus {
    Pending = 'pending',
    Syncing = 'syncing',
    Synced = 'synced',
    Failed = 'failed',
    Conflict = 'conflict',
}

export type OperationType = 'visitor_pass' | 'incident_report' | 'security_log' | (string & {});

export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
