import axios from 'axios';
import { Capacitor } from '@capacitor/core';

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

// Request interceptor to attach meta CSRF token as fallback if available
window.axios.interceptors.request.use((config) => {
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken && !config.headers['X-CSRF-TOKEN']) {
        config.headers['X-CSRF-TOKEN'] = metaToken;
    }
    return config;
});
