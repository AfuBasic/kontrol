import type { GroupKey } from './types';

/** One colour per kind of client, the same on every chart and list so it can be learned once. */
export const GROUP_COLOUR: Record<GroupKey, string> = {
    android_app: '#34d399',
    ios_app: '#60a5fa',
    installed_web: '#a78bfa',
    phone_browser: '#fbbf24',
    desktop_browser: '#94a3b8',
    other: '#64748b',
};

export const GROUP_LABEL: Record<GroupKey, string> = {
    android_app: 'Android app',
    ios_app: 'iOS app',
    installed_web: 'Installed web app',
    phone_browser: 'Phone browser',
    desktop_browser: 'Desktop browser',
    other: 'Other',
};

export const GROUP_ORDER: GroupKey[] = ['android_app', 'ios_app', 'installed_web', 'phone_browser', 'desktop_browser', 'other'];

/** "up 12% on the 30 days before", "down 3%", or "same" — a trend in a few words. */
export function changeSentence(now: number, before: number, period: string): string {
    if (before === 0) return now === 0 ? 'Nothing yet' : `${period} before: nobody recorded`;
    if (now === before) return `Same as the ${period} before`;
    const percent = Math.round((Math.abs(now - before) / before) * 100);

    return `${now > before ? 'Up' : 'Down'} ${percent}% on the ${period} before`;
}
