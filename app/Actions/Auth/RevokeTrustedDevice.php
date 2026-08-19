<?php

namespace App\Actions\Auth;

use App\Actions\Security\RecordSecurityEvent;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Notifications\Security\TrustedDeviceRevokedNotification;
use App\Support\DeviceMetadata;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RevokeTrustedDevice
{
    public function __construct(private RecordSecurityEvent $recordSecurityEvent) {}

    public function execute(User $user, TrustedDevice $device): void
    {
        if ($device->user_id !== $user->id) {
            return;
        }

        if ($device->revoked_at !== null) {
            return;
        }

        DB::transaction(function () use ($user, $device): void {
            $locked = TrustedDevice::query()
                ->whereKey($device->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->revoked_at !== null) {
                return;
            }

            $locked->forceFill([
                'revoked_at' => now(),
            ])->save();

            $this->invalidateDeviceSession($locked);

            $metadata = new DeviceMetadata(
                displayName: $locked->display_name ?? 'Unknown device',
                deviceType: $locked->device_type ?? 'web',
                platform: $locked->platform ?? 'other',
                browser: $locked->browser ?? 'Browser',
                ipAddress: $locked->ip_address,
                approximateLocation: $locked->approximate_location,
                isNativeApp: in_array($locked->device_type, ['android', 'ios'], true),
            );

            $this->recordSecurityEvent->open(
                user: $user,
                type: SecurityEventType::TrustedDeviceRevoked,
                severity: SecurityEventSeverity::Info,
                status: SecurityEventStatus::Resolved,
                label: 'A trusted device was removed.',
                metadata: $metadata,
                device: $locked,
                extra: [],
            );
        });

        $user->notify(new TrustedDeviceRevokedNotification($device->fresh() ?? $device));
    }

    private function invalidateDeviceSession(TrustedDevice $device): void
    {
        $table = config('session.table', 'sessions');

        if (! Schema::hasTable($table) || $device->last_session_id === null) {
            return;
        }

        DB::table($table)
            ->where('id', $device->last_session_id)
            ->where('user_id', $device->user_id)
            ->delete();
    }
}
