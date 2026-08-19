<?php

namespace App\Actions\Security;

use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\DeviceAuthorizationRequest;
use App\Models\SecurityEvent;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Support\DeviceMetadata;
use Illuminate\Support\Carbon;

class RecordSecurityEvent
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function open(
        User $user,
        SecurityEventType $type,
        SecurityEventSeverity $severity,
        SecurityEventStatus $status,
        string $label,
        ?DeviceMetadata $metadata = null,
        ?DeviceAuthorizationRequest $authorization = null,
        ?TrustedDevice $device = null,
        array $extra = [],
    ): SecurityEvent {
        $detectedAt = Carbon::now();

        return SecurityEvent::query()->create([
            'user_id' => $user->id,
            'trusted_device_id' => $device?->id,
            'device_authorization_request_id' => $authorization?->id,
            'type' => $type,
            'severity' => $severity,
            'status' => $status,
            'display_name' => $metadata?->displayName ?? $device?->display_name,
            'approximate_location' => $metadata?->approximateLocation ?? $device?->approximate_location,
            'request_ip' => $metadata?->ipAddress,
            'detected_at' => $detectedAt,
            'timeline' => [
                [
                    'at' => $detectedAt->toIso8601String(),
                    'type' => $type->value,
                    'label' => $label,
                    'metadata' => [],
                ],
            ],
            'metadata' => $extra,
        ]);
    }

    public function append(
        SecurityEvent $event,
        string $type,
        string $label,
        ?SecurityEventType $eventType = null,
        ?SecurityEventSeverity $severity = null,
        ?SecurityEventStatus $status = null,
        ?string $resolution = null,
        ?TrustedDevice $device = null,
    ): SecurityEvent {
        $event->appendTimeline($type, $label);

        $updates = [];

        if ($eventType !== null) {
            $updates['type'] = $eventType;
        }

        if ($severity !== null) {
            $updates['severity'] = $severity;
        }

        if ($status !== null) {
            $updates['status'] = $status;
        }

        if ($resolution !== null) {
            $updates['resolution'] = $resolution;
            $updates['resolved_at'] = now();
        }

        if ($device !== null) {
            $updates['trusted_device_id'] = $device->id;
        }

        if ($updates !== []) {
            $event->forceFill($updates)->save();
        }

        return $event->refresh();
    }
}
