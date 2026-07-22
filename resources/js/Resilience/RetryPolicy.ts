export type BackoffStrategy = 'exponential' | 'fixed' | 'none';

export interface RetryPolicy {
    /** Unique key for this policy (e.g. security_log, visitor_pass). */
    key: string;
    strategy: BackoffStrategy;
    /** Max attempts after the first failure. null = retry indefinitely. */
    maxRetries: number | null;
    /** Initial delay in milliseconds. */
    initialDelayMs: number;
    /** Cap for exponential backoff in milliseconds. */
    maxDelayMs: number;
    /** Whether the engine should auto-retry on reconnect / schedule. */
    autoRetry: boolean;
    /** TTL from enqueue time; expired ops are dropped. null = never expire. */
    ttlMs: number | null;
}

export const RETRY_POLICIES = {
    security_log: {
        key: 'security_log',
        strategy: 'exponential',
        maxRetries: null,
        initialDelayMs: 5_000,
        maxDelayMs: 5 * 60_000,
        autoRetry: true,
        ttlMs: 7 * 24 * 60 * 60_000,
    },
    visitor_pass: {
        key: 'visitor_pass',
        strategy: 'exponential',
        maxRetries: 10,
        initialDelayMs: 30_000,
        maxDelayMs: 10 * 60_000,
        autoRetry: true,
        ttlMs: 24 * 60 * 60_000,
    },
    incident_report: {
        key: 'incident_report',
        strategy: 'exponential',
        maxRetries: 20,
        initialDelayMs: 30_000,
        maxDelayMs: 15 * 60_000,
        autoRetry: true,
        ttlMs: 7 * 24 * 60 * 60_000,
    },
    analytics_fetch: {
        key: 'analytics_fetch',
        strategy: 'fixed',
        maxRetries: 2,
        initialDelayMs: 3_000,
        maxDelayMs: 3_000,
        autoRetry: true,
        ttlMs: 60 * 60_000,
    },
    payment: {
        key: 'payment',
        strategy: 'none',
        maxRetries: 0,
        initialDelayMs: 0,
        maxDelayMs: 0,
        autoRetry: false,
        ttlMs: null,
    },
} as const satisfies Record<string, RetryPolicy>;

export type RetryPolicyKey = keyof typeof RETRY_POLICIES;

export function getRetryPolicy(key: RetryPolicyKey | string): RetryPolicy {
    if (key in RETRY_POLICIES) {
        return RETRY_POLICIES[key as RetryPolicyKey];
    }

    return RETRY_POLICIES.visitor_pass;
}

/**
 * Compute delay before the next retry attempt (0-based attempt after first failure).
 */
export function computeBackoffMs(policy: RetryPolicy, retryCount: number): number {
    if (policy.strategy === 'none' || policy.maxRetries === 0) {
        return 0;
    }

    if (policy.strategy === 'fixed') {
        return policy.initialDelayMs;
    }

    const delay = policy.initialDelayMs * Math.pow(2, Math.max(0, retryCount));

    return Math.min(delay, policy.maxDelayMs);
}

export function hasExhaustedRetries(policy: RetryPolicy, retryCount: number): boolean {
    if (policy.strategy === 'none') {
        return true;
    }

    if (policy.maxRetries === null) {
        return false;
    }

    return retryCount >= policy.maxRetries;
}

export function isExpired(createdAt: string, policy: RetryPolicy, now = Date.now()): boolean {
    if (policy.ttlMs === null) {
        return false;
    }

    const created = Date.parse(createdAt);

    if (Number.isNaN(created)) {
        return false;
    }

    return now - created > policy.ttlMs;
}
