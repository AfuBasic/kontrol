<?php

namespace App\Support;

/**
 * Turns the raw error stored for a failed pass delivery into a sentence a group creator can act on.
 * The raw error stays stored (and goes to Kontrol support); nothing technical reaches the creator.
 */
final class BulkInviteDeliveryFailure
{
    public const GENERIC = "We couldn't deliver this pass. Please try again, and contact support if it keeps failing.";

    /**
     * Order matters: the first matching rule wins, so internal faults are checked before address problems.
     *
     * @var array<int, array{0: string, 1: string}>
     */
    private const RULES = [
        // Our own faults: never show file paths, class names or SQL.
        ['/undefined (variable|array key|index|property|offset)|call to |class ".*" not found|argument #|trying to |sqlstate|\.php|vendor\/|stack trace|view:|exception/i',
            'Something went wrong on our side while preparing this pass. Our team has been told. Please try again in a little while.'],
        ['/pdf|attachment|dompdf|snappy|chrom(e|ium)/i',
            "We couldn't prepare the pass document. Please try sending it again."],
        ['/mailbox (is )?full|over quota|quota exceeded|\b552\b/i',
            'Their inbox is full, so the pass bounced. Try again later, or use a different address.'],
        ['/mailbox unavailable|user unknown|no such user|unknown user|does not exist|invalid (e-?mail )?address|recipient (address )?rejected|unroutable|domain (not found|name not found)|nxdomain|\b55[013]\b|address rejected/i',
            "This email address couldn't be reached. Please check the spelling and try again."],
        ['/spam|blocked|blacklist|denied|policy|dmarc|spf|\b554\b|rejected/i',
            'Their email provider blocked the message. Ask them to check their spam folder, or use a different address.'],
        ['/timed? ?out|connection (refused|reset|failed|could not)|could not connect|temporar|try again later|\b4(21|50|51|52)\b|network|curl|dns|unreachable/i',
            "We couldn't reach the email service just now. Please try sending again in a few minutes."],
        ['/maximum delivery retries/i',
            "We tried several times but couldn't deliver this pass. Please try again."],
    ];

    public static function friendly(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        foreach (self::RULES as [$pattern, $message]) {
            if (preg_match($pattern, $raw) === 1) {
                return $message;
            }
        }

        return self::GENERIC;
    }
}
