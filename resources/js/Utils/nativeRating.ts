import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export const STORE_URLS = {
    ios: 'https://apps.apple.com/ng/app/access-kontrol/id6772562083?action=write-review',
    android: 'https://play.google.com/store/apps/details?id=com.kontrol.hq&hl=en',
    web: 'https://usekontrol.com/download-app',
} as const;

/**
 * Open the native App Store or Play Store rating screen for Kontrol.
 * Uses Capacitor Browser or direct window open depending on the environment.
 */
export async function openNativeStoreReview(): Promise<void> {
    const platform = Capacitor.getPlatform();

    let targetUrl: string = STORE_URLS.web;

    if (platform === 'ios') {
        targetUrl = STORE_URLS.ios;
    } else if (platform === 'android') {
        targetUrl = STORE_URLS.android;
    } else if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (/ipad|iphone|ipod|macintosh/.test(ua) && !('MSStream' in window)) {
            targetUrl = STORE_URLS.ios;
        } else if (/android/.test(ua)) {
            targetUrl = STORE_URLS.android;
        }
    }

    if (Capacitor.isNativePlatform()) {
        try {
            await Browser.open({ url: targetUrl });
            return;
        } catch {
            // Fallback to window.open if Browser plugin fails
        }
    }

    if (typeof window !== 'undefined') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
}
