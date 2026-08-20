/**
 * Client-Side Error Reporting Service
 *
 * Captures uncaught runtime errors and unhandled promise rejections,
 * deduplicates them on the client, and safely reports to /api/v1/client-errors.
 */

const REPORT_ENDPOINT = '/api/v1/client-errors';
const MAX_REPORTS_PER_ERROR = 3;
const reportedFingerprints = new Map<string, number>();

function getFingerprint(message: string, file?: string, line?: number): string {
    return `${message}:${file || ''}:${line || 0}`;
}

export function reportClientError(errorData: {
    message: string;
    stack?: string;
    file?: string;
    line?: number;
    exception_class?: string;
}) {
    try {
        const fp = getFingerprint(errorData.message, errorData.file, errorData.line);
        const count = reportedFingerprints.get(fp) || 0;

        if (count >= MAX_REPORTS_PER_ERROR) {
            return;
        }

        reportedFingerprints.set(fp, count + 1);

        const payload = {
            message: errorData.message,
            stack: errorData.stack || null,
            file: errorData.file || window.location.pathname,
            line: errorData.line || null,
            url: window.location.href,
            user_agent: navigator.userAgent,
            exception_class: errorData.exception_class || 'FrontendError',
        };

        const body = JSON.stringify(payload);

        // Prefer sendBeacon if available, otherwise fetch
        if (typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon(REPORT_ENDPOINT, blob);
        } else {
            fetch(REPORT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body,
                keepalive: true,
            }).catch(() => {});
        }
    } catch {
        // Silently bypass
    }
}

export function initErrorReporter() {
    if (typeof window === 'undefined') return;

    window.onerror = (message, source, lineno, colno, error) => {
        reportClientError({
            message: typeof message === 'string' ? message : (error?.message || 'Script error'),
            stack: error?.stack,
            file: typeof source === 'string' ? source : undefined,
            line: lineno,
            exception_class: error?.name || 'UncaughtError',
        });
    };

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : (typeof reason === 'string' ? reason : 'Unhandled Promise Rejection');
        const stack = reason instanceof Error ? reason.stack : undefined;
        const name = reason instanceof Error ? reason.name : 'UnhandledPromiseRejection';

        reportClientError({
            message,
            stack,
            file: window.location.pathname,
            exception_class: name,
        });
    });
}
