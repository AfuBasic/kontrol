<?php

namespace App\Actions\Auth;

use App\Actions\Security\RecordSecurityEvent;
use App\Enums\DeviceAuthorizationStatus;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\DeviceAuthorizationRequest;
use App\Notifications\Security\SignInBlockedNotification;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DenyDeviceAuthorization
{
    public function __construct(private RecordSecurityEvent $recordSecurityEvent) {}

    public function execute(DeviceAuthorizationRequest $authorization): DeviceAuthorizationRequest
    {
        return DB::transaction(function () use ($authorization): DeviceAuthorizationRequest {
            $locked = DeviceAuthorizationRequest::query()
                ->whereKey($authorization->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->isDenied()) {
                throw new RuntimeException('denied');
            }

            if ($locked->isConsumed() || $locked->status === DeviceAuthorizationStatus::Approved) {
                throw new RuntimeException('completed');
            }

            if ($locked->isExpired()) {
                $locked->forceFill([
                    'status' => DeviceAuthorizationStatus::Expired,
                ])->save();

                throw new RuntimeException('expired');
            }

            if (! $locked->isPending()) {
                throw new RuntimeException('invalid');
            }

            $locked->forceFill([
                'status' => DeviceAuthorizationStatus::Denied,
                'denied_at' => now(),
            ])->save();

            $event = $locked->securityEvent;

            if ($event) {
                $this->recordSecurityEvent->append(
                    $event,
                    SecurityEventType::DeviceDenied->value,
                    'Account owner denied the sign-in request.',
                    eventType: SecurityEventType::DeviceDenied,
                    severity: SecurityEventSeverity::High,
                    status: SecurityEventStatus::Denied,
                    resolution: 'Denied by account owner.',
                );
            }

            $locked->user->notify(new SignInBlockedNotification($locked));

            return $locked->refresh();
        });
    }
}
