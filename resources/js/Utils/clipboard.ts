function copyWithTextArea(text: string): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.left = '-999999px';
    textArea.style.position = 'fixed';
    textArea.style.top = '-999999px';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
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
