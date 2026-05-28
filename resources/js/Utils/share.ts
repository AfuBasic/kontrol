import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import axios from 'axios';
import type { AccessCode } from '@/types/access-code';

/**
 * Robust sharing utility that prioritizes native mobile sharing via Capacitor,
 * falling back to Web Share API and finally Clipboard copy.
 */
export async function shareAccessCode(accessCode: AccessCode & { pass_uuid?: string; estate_name?: string }) {
    // Record sharing event in background
    axios.post(`/resident/visitors/${accessCode.id}/share`).catch(() => {});

    const passUrl = `${window.location.origin}/pass/${accessCode.pass_uuid}`;
    const formattedExpiry = accessCode.expires_at
        ? new Date(accessCode.expires_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Never Expires';

    const text = `You've been granted visitor access to ${accessCode.estate_name || 'the Estate'}.

Access Code: ${accessCode.code}
Valid Until: ${formattedExpiry}

Present your digital visitor pass at the gate for fast verification:
${passUrl}`;

    const title = 'Visitor Access Pass';

    // 1. Try Native Capacitor Share if on native platform
    if (Capacitor.isNativePlatform()) {
        try {
            const canShare = await Share.canShare();
            if (canShare.value) {
                await Share.share({
                    title: title,
                    text: text,
                    dialogTitle: 'Share Visitor Pass',
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
