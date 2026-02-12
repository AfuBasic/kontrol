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
 * Detects if the device is running iOS
 */
export function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detects if the device is running Android
 */
export function isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
}

/**
 * Opens a URL in the device's external browser when in PWA mode,
 * or navigates normally when in a regular browser.
 *
 * For iOS PWAs, we use a programmatic anchor click which more reliably
 * opens the external Safari browser.
 *
 * For Android, window.open with _system target helps open Chrome.
 */
export function openInExternalBrowser(url: string, isStandalone: boolean): void {
    if (isStandalone) {
        // Create and click a temporary anchor element
        // This is more reliable than window.open for PWAs, especially on iOS
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';

        // For iOS, we need the anchor in the DOM briefly
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    } else {
        // In regular browser, just navigate
        window.location.href = url;
    }
}
