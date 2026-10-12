<?php

namespace App\Support;

/**
 * The queues this app uses, and the one rule for choosing between them: what is slow must never sit in
 * front of what a person is waiting on.
 *
 * Every name here needs a worker in nixpacks.toml; a job sent to a queue nobody reads waits forever.
 * A class sets its own queue (in its constructor, or `$queue` on a listener) so the choice cannot be
 * forgotten at a dispatch site. Anything left on DEFAULT is quick housekeeping.
 */
final class Queues
{
    /** Someone is waiting on it right now: sign-in codes, SOS, gate alerts, live broadcasts. */
    public const CRITICAL = 'critical';

    /** Money: checking payments against Paystack, charging invoices. */
    public const PAYMENTS = 'payments';

    /** Outbound email, which waits on the mail provider. */
    public const MAIL = 'mail';

    /** Long or bulky work: bulk invites and PDFs, photo uploads, nightly sweeps, fan-outs. */
    public const HEAVY = 'heavy';

    /** Quick housekeeping nobody is watching. */
    public const DEFAULT = 'default';

    /** @var list<string> */
    public const ALL = [self::CRITICAL, self::PAYMENTS, self::MAIL, self::HEAVY, self::DEFAULT];
}
