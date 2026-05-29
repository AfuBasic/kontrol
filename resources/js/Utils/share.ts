import { Clipboard } from '@capacitor/clipboard';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import axios from 'axios';
import { toPng } from 'html-to-image';
import type { AccessCode } from '@/types/access-code';

// Embedded Kontrol logo as base64 — avoids any runtime fetch or import issues
const KONTROL_LOGO_BASE64 =
    'data:image/png;base64,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';

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
            // Pre-composite the Kontrol logo onto the QR image so html-to-image
            // captures it correctly (overlay divs are unreliable in foreignObject SVG export)
            const qrImg = cardElement.querySelector('img[alt="Access QR Code"]') as HTMLImageElement | null;
            let originalQrSrc: string | null = null;

            if (qrImg && qrImg.src.startsWith('http')) {
                try {
                    originalQrSrc = qrImg.src;
                    const response = await fetch(originalQrSrc);
                    const blob = await response.blob();
                    const qrDataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    const size = 350; // Match the QR API size for high quality
                    const logoSize = 72;
                    const logoOffset = (size - logoSize) / 2;
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d')!;

                    await new Promise<void>((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0, size, size);
                            resolve();
                        };
                        img.onerror = reject;
                        img.src = qrDataUrl;
                    });

                    await new Promise<void>((resolve, reject) => {
                        const logoImg = new Image();
                        logoImg.onload = () => {
                            ctx.drawImage(logoImg, logoOffset, logoOffset, logoSize, logoSize);
                            resolve();
                        };
                        logoImg.onerror = reject;
                        logoImg.src = KONTROL_LOGO_BASE64;
                    });

                    qrImg.src = canvas.toDataURL('image/png');
                    // Allow a tick for the img to re-render with the new src
                    await new Promise((r) => setTimeout(r, 80));
                } catch (e) {
                    console.warn('Pre-compositing logo onto QR failed, exporting without logo', e);
                }
            }

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

            // Restore original QR src so the live UI is unaffected
            if (qrImg && originalQrSrc) {
                qrImg.src = originalQrSrc;
            }
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
