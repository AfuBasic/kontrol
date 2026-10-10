/**
 * Whether to attach the page's `<meta name="csrf-token">` value as `X-CSRF-TOKEN`.
 *
 * That meta tag is only written on a full page load. Inertia navigations after a sign-in, sign-out or OTP step
 * keep the old tag while the session (and its token) has been replaced, and Laravel checks `X-CSRF-TOKEN`
 * before the always-current `XSRF-TOKEN` cookie, so a stale tag turns the next POST into a 419.
 *
 * So the cookie wins whenever it exists, and the meta tag is only a fallback for when the cookie is unavailable.
 */
export function shouldSendMetaCsrfToken(cookies: string, metaToken: string | null | undefined): boolean {
    if (!metaToken) {
        return false;
    }

    return !cookies.split(';').some((cookie) => cookie.trim().startsWith('XSRF-TOKEN='));
}
