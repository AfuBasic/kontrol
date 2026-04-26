import type { AccessCode } from '@/types/access-code';

export async function shareAccessCode(accessCode: AccessCode) {
    const text =
        accessCode.type === 'long_lived'
            ? `Here is a long-term access code: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. This code does not expire.`
            : `Here is a one-time access code: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. Valid for: ${accessCode.time_remaining}.`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Access Code',
                text: text,
            });
            return { success: true, method: 'share' };
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing', error);
            }
        }
    }

    // Fallback: Copy to clipboard
    try {
        await navigator.clipboard.writeText(text);
        return { success: true, method: 'copy' };
    } catch (err) {
        console.error('Failed to copy share text', err);
        return { success: false };
    }
}
