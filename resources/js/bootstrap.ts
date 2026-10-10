import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { shouldSendMetaCsrfToken } from '@/Lib/csrf';

declare global {
    interface Window {
        axios: typeof axios;
    }
}

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

if (Capacitor.isNativePlatform()) {
    window.axios.defaults.headers.common['X-Capacitor-App'] = 'true';
}

// Attach the meta CSRF token only as a fallback: when the XSRF cookie exists it is always current,
// while the meta tag goes stale after a sign-in, sign-out or OTP step reached by client-side navigation.
window.axios.interceptors.request.use((config) => {
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (shouldSendMetaCsrfToken(document.cookie, metaToken) && !config.headers['X-CSRF-TOKEN']) {
        config.headers['X-CSRF-TOKEN'] = metaToken as string;
    }
    return config;
});
