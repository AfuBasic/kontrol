import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';

function copyWithTextArea(text: string): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.style.fontSize = '12pt';

    document.body.appendChild(textArea);
    
    // Select without invoking native mobile keyboard
    textArea.select();
    textArea.setSelectionRange(0, 99999);

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
        try {
            await Clipboard.write({ string: text });
            return true;
        } catch {
            // Fall back to web clipboard
        }
    }

    if (typeof navigator !== 'undefined' && typeof window !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return copyWithTextArea(text);
        }
    }

    return copyWithTextArea(text);
}
