import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import axios from 'axios';
import type { AccessCode } from '@/types/access-code';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Robust sharing utility that prioritizes native mobile sharing via Capacitor,
 * fetching the QR Code and attaching it as a file, falling back to Web Share API
 * and finally Clipboard copy.
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

    // Generate the same QR code image url as in PassCard
    const qrUrl = `kontrol://pass/${accessCode.pass_uuid}?token=${(accessCode as any).qr_token || ''}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&color=0a3d91&bgcolor=ffffff&qzone=1`;

    let qrFile: File | null = null;
    let nativeFileUri: string | null = null;

    try {
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();

        if (Capacitor.isNativePlatform()) {
            const base64Data = await blobToBase64(blob);
            const fileName = `kontrol_pass_${accessCode.pass_uuid || accessCode.id}.png`;
            
            // Write temporary file
            await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache,
            });

            // Get URI for sharing
            const uriResult = await Filesystem.getUri({
                directory: Directory.Cache,
                path: fileName,
            });
            nativeFileUri = uriResult.uri;
        } else {
            qrFile = new File([blob], 'visitor-pass-qr.png', { type: 'image/png' });
        }
    } catch (e) {
        console.error('Failed to prepare QR code image for sharing', e);
    }

    // 1. Try Native Capacitor Share if on native platform
    if (Capacitor.isNativePlatform()) {
        try {
            const canShare = await Share.canShare();
            if (canShare.value) {
                await Share.share({
                    title: title,
                    text: text,
                    dialogTitle: 'Share Visitor Pass',
                    files: nativeFileUri ? [nativeFileUri] : [],
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
            const shareData: ShareData = {
                title: title,
                text: text,
            };
            if (qrFile && navigator.canShare && navigator.canShare({ files: [qrFile] })) {
                shareData.files = [qrFile];
            }
            await navigator.share(shareData);
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
