import type { AccessCode } from '@/types/access-code';

export function shareAccessCode(accessCode: AccessCode) {
    if (navigator.share) {
        navigator
            .share({
                title: 'Access Code',
                text:
                    accessCode.type === 'long_lived'
                        ? `Here is a long-term access code: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. This code does not expire.`
                        : `Here is a one-time access code: ${accessCode.code}${accessCode.visitor_name ? ` (for ${accessCode.visitor_name})` : ''}. Valid for: ${accessCode.time_remaining}.`,
            })
            .catch((error) => console.log('Error sharing', error));
    } else {
        console.log('Web Share API not supported in this browser');
    }
}
