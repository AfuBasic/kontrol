import { useEffect, useState } from 'react';

/**
 * Detects if the app is running in standalone/PWA mode.
 *
 * This is useful for handling OAuth flows that need to open in
 * the device's external browser rather than the PWA webview.
 */
export function useIsStandalone() {
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check various indicators of standalone/PWA mode
        const standalone =
            // Standard PWA check
            window.matchMedia('(display-mode: standalone)').matches ||
            // iOS Safari "Add to Home Screen"
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
            // Android TWA
            document.referrer.includes('android-app://');

        setIsStandalone(standalone);
    }, []);

    return isStandalone;
}

/**
 * Opens a URL in the device's external browser when in PWA mode,
 * or navigates normally when in a regular browser.
 *
 * This is particularly useful for OAuth flows that may not work
 * correctly within PWA webviews.
 */
export function openInExternalBrowser(url: string, isStandalone: boolean): void {
    if (isStandalone) {
        // In PWA mode, open in external browser
        // Using _blank with specific features forces external browser on most platforms
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        // In regular browser, just navigate
        window.location.href = url;
    }
}
