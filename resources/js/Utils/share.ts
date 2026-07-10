import { Clipboard } from '@capacitor/clipboard';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import axios from 'axios';
import { toPng } from 'html-to-image';
import type { AccessCode } from '@/types/access-code';
import { KONTROL_LOGO_BASE64 } from '@/Utils/logo';

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

    const formattedFrom = accessCode.starts_at
        ? new Date(accessCode.starts_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
          }) +
          ', ' +
          new Date(accessCode.starts_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    const formattedTo = accessCode.expires_at
        ? new Date(accessCode.expires_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
          }) +
          ', ' +
          new Date(accessCode.expires_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    // Compose location: "Plot 7, Block 8, Akinola Street, Adelade Estate"
    const locationParts = [
        accessCode.resident_address ?? null,
        accessCode.estate_name ?? null,
    ].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : null;

    let text = '';
    if (accessCode.type === 'event') {
        text = `✨ You have been invited to: ${accessCode.visitor_name || 'an Event'}! ✨
📍 Venue: ${accessCode.estate_name || 'the Estate'}

Please use this pass for entry.
🎫 Access Code: ${accessCode.code}
📅 Valid From: ${formattedFrom || 'Start of event'}`;
    } else {
        text = `Hello,
Your access code is: ${accessCode.code}`;

        if (location) {
            text += `\n\nLocation: ${location}.`;
        }

        if (formattedFrom) {
            text += `\nFrom: ${formattedFrom}`;
        }

        if (formattedTo) {
            text += `\nTo: ${formattedTo}`;
        }

        text += `\n\nTo start enjoying Kontrol in your community too, please visit https://usekontrol.com\n\nService delivered by Kontrol.`;
    }

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
        console.error('Native Share failed or was cancelled', error);
        return { success: false };
    }

    // Fallback: Clipboard copy (only runs if native sharing is not supported)
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
