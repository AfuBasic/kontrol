import { Clipboard } from '@capacitor/clipboard';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import axios from 'axios';
import { toPng } from 'html-to-image';
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
 * Native sharing utility that utilizes Capacitor to either render the entire
 * PassCard HTML element as a PNG image, or fall back to fetching the QR Code,
 * and shares it via the native iOS/Android Share Sheet.
 */
export async function shareAccessCode(accessCode: AccessCode & { pass_uuid?: string; estate_name?: string }, cardElement?: HTMLElement | null) {
    // Record sharing event in background
    axios.post(`/resident/visitors/${accessCode.id}/share`).catch(() => {});

    const formattedExpiry = accessCode.expires_at
        ? new Date(accessCode.expires_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Never Expires';

    const text = `You've been granted visitor access to ${accessCode.estate_name || 'the Estate'}.

Access Code: ${accessCode.code}
Valid Until: ${formattedExpiry}`;

    const title = 'Visitor Access Pass';
    const fileName = `kontrol_pass_${accessCode.pass_uuid || accessCode.id}.png`;
    let nativeFileUri: string | null = null;

    try {
        let base64Data = '';

        if (cardElement) {
            // Render the entire HTML PassCard component to a high-definition PNG
            const dataUrl = await toPng(cardElement, {
                cacheBust: true,
                pixelRatio: 3, // High definition for scanners
                backgroundColor: '#ffffff', // Match the white card background color
                filter: (node) => {
                    if (node.classList && node.classList.contains('share-exclude')) {
                        return false;
                    }
                    return true;
                },
            });
            base64Data = dataUrl.split(',')[1];
        } else {
            // Fallback: Fetch only the QR code image
            const qrUrl = `kontrol://pass/${accessCode.pass_uuid}?token=${(accessCode as any).qr_token || ''}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}&color=0a3d91&bgcolor=ffffff&qzone=1`;
            const response = await fetch(qrImageUrl);
            const blob = await response.blob();
            base64Data = await blobToBase64(blob);
        }

        if (base64Data) {
            // Write temporary file to cache
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
        }
    } catch (e) {
        console.error('Failed to prepare pass card image for sharing', e);
    }

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
        console.error('Native Share failed, falling back to clipboard', error);
    }

    // Fallback: Clipboard copy
    try {
        await Clipboard.write({
            string: text,
        });
        return { success: true, method: 'copy' };
    } catch (err) {
        console.error('Clipboard copy failed:', err);
    }

    return { success: false };
}
