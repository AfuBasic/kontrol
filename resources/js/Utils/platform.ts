/**
 * Client-side platform detection utilities.
 */

export function isInstalledPwa(): boolean {
    if (typeof window === 'undefined') return false;

    const isStandaloneWindow = window.matchMedia('(display-mode: standalone)').matches;
    const isStandaloneNavigator = (navigator as any).standalone === true;
    const isTwa = document.referrer.includes('android-app://');

    return isStandaloneWindow || isStandaloneNavigator || isTwa;
}

export function getOperatingSystem(): 'ios' | 'android' | 'mac' | 'windows' | 'linux' | 'other' {
    if (typeof window === 'undefined') return 'other';

    const ua = navigator.userAgent.toLowerCase();

    if (/ipad|iphone|ipod/.test(ua) && !('MSStream' in window)) {
        return 'ios';
    }

    if (/android/.test(ua)) {
        return 'android';
    }

    if (/macintosh|mac os x/.test(ua)) {
        return 'mac';
    }

    if (/windows/.test(ua)) {
        return 'windows';
    }

    if (/linux/.test(ua)) {
        return 'linux';
    }

    return 'other';
}

export function getBrowserName(): 'chrome' | 'samsung' | 'edge' | 'firefox' | 'safari' | 'other' {
    if (typeof window === 'undefined') return 'other';

    const ua = navigator.userAgent.toLowerCase();

    if (/samsungbrowser/.test(ua)) {
        return 'samsung';
    }

    if (/edg\/|edge/.test(ua)) {
        return 'edge';
    }

    if (/firefox|fxios/.test(ua)) {
        return 'firefox';
    }

    if (/chrome|crios/.test(ua)) {
        return 'chrome';
    }

    if (/safari/.test(ua) && !/chrome/.test(ua)) {
        return 'safari';
    }

    return 'other';
}

export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const os = getOperatingSystem();
    return os === 'ios' || os === 'android';
}
