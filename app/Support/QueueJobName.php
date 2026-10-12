<?php

namespace App\Support;

/**
 * Names a queued job from its payload, for the Failed Jobs and Job History pages. The payload is read as data and
 * never unserialized, so nothing in it can run.
 */
final class QueueJobName
{
    private const QUEUED_NOTIFICATION = 'Illuminate\Notifications\SendQueuedNotifications';

    /**
     * Jobs that send something to a person. Running one again sends it again, so retrying them gets a warning.
     *
     * @var array<int, string>
     */
    public const SENDS_MESSAGES = [
        self::QUEUED_NOTIFICATION,
        'Illuminate\Mail\SendQueuedMailable',
        'App\Jobs\DeliverBulkVisitorPassJob',
        'App\Jobs\NotifyBulkInviteDeliveryReportJob',
        'App\Jobs\SendSmsAlert',
    ];

    /**
     * @param  string|array<string, mixed>  $payload  The job's payload, as stored (JSON) or already decoded
     * @return array{display: string, class: string}
     */
    public static function identify(string|array $payload): array
    {
        $data = is_array($payload) ? $payload : (json_decode($payload, true) ?: []);
        $display = (string) ($data['displayName'] ?? 'Unknown job');
        $command = (string) ($data['data']['command'] ?? '');

        // A queued notification is always "SendQueuedNotifications"; the useful name is the notification inside it.
        $inner = $display === self::QUEUED_NOTIFICATION && preg_match('/"notification";O:\d+:"([^"]+)"/', $command, $m) ? $m[1] : null;

        return ['display' => $display, 'class' => $inner ?? $display];
    }

    public static function sendsMessages(string $displayName): bool
    {
        return in_array($displayName, self::SENDS_MESSAGES, true);
    }
}
