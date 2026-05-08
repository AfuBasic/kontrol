import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import type { AccessCode } from '@/types/access-code';

/**
 * Robust sharing utility that prioritizes native mobile sharing via Capacitor,
 * falling back to Web Share API and finally Clipboard copy.
 */
export async function shareAccessCode(accessCode: AccessCode) {
    const text =
        accessCode.type === 'long_lived'
            ? `Here is a long-term access code: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. This code does not expire.`
            : `Here is a one-time access code: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. Valid for: ${accessCode.time_remaining}.`;

    const title = 'Access Code';

    // 1. Try Native Capacitor Share if on native platform
    if (Capacitor.isNativePlatform()) {
        try {
            const canShare = await Share.canShare();
            if (canShare.value) {
                await Share.share({
                    title: title,
                    text: text,
                    dialogTitle: 'Share Access Code',
                });
                return { success: true, method: 'share' };
            }
        } catch (error) {
            console.error('Capacitor Share failed', error);
        }
    }

    // 2. Try Web Share API (Mobile Browsers)
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
            });
            return { success: true, method: 'share' };
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Web Share failed', error);
            }
        }
    }

    // 3. Fallback: Native Clipboard if on native platform
    if (Capacitor.isNativePlatform()) {
        try {
            await Clipboard.write({
                string: text,
            });
            return { success: true, method: 'copy' };
        } catch (err) {
            console.error('Capacitor Clipboard failed', err);
        }
    }

    // 4. Fallback: Web Clipboard API
    try {
        await navigator.clipboard.writeText(text);
        return { success: true, method: 'copy' };
    } catch (err) {
        // Fall through to legacy method
    }

    // 5. Final Legacy Fallback: Hidden Textarea (for restricted WebViews)
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
            return { success: true, method: 'copy' };
        }
    } catch (err) {
        console.error('All sharing/copy methods failed:', err);
    }

    return { success: false };
}
