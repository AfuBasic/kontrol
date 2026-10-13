import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

let appVersion: string | null = null;

/** What the store app tells the server about itself: that it is the app, which system it runs on, and its version. */
export function clientHeaders(platform: string, version: string | null): Record<string, string> {
    const headers: Record<string, string> = { 'X-Capacitor-App': 'true' };

    // The server counts users by these, so only the two real values are sent.
    if (platform === 'ios' || platform === 'android') headers['X-App-Platform'] = platform;
    if (version) headers['X-App-Version'] = version;

    return headers;
}

/** The headers to add to a request: the app's own, or nothing at all in a web browser. */
export function nativeHeaders(): Record<string, string> {
    return Capacitor.isNativePlatform() ? clientHeaders(Capacitor.getPlatform(), appVersion) : {};
}

/** Asks the app for its version, which takes a moment, so requests sent before it arrives simply omit it. */
export async function loadAppVersion(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
        appVersion = (await App.getInfo()).version || null;
    } catch {
        // The version is a nice-to-have; the platform alone is still counted.
    }
}
