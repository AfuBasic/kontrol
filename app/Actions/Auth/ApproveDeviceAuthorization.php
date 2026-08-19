<?php

namespace App\Actions\Auth;

use App\Actions\Security\RecordSecurityEvent;
use App\Enums\DeviceAuthorizationStatus;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\DeviceAuthorizationRequest;
use App\Notifications\Security\DeviceAuthorizedNotification;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ApproveDeviceAuthorization
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
                'status' => DeviceAuthorizationStatus::Approved,
                'approved_at' => now(),
            ])->save();

            $event = $locked->securityEvent;

            if ($event) {
                $this->recordSecurityEvent->append(
                    $event,
                    SecurityEventType::DeviceAuthorized->value,
                    'Account owner authorized device.',
                    eventType: SecurityEventType::DeviceAuthorized,
                    severity: SecurityEventSeverity::Info,
                    status: SecurityEventStatus::Resolved,
                    resolution: 'Authorized by account owner.',
                );
            }

            $locked->user->notify(new DeviceAuthorizedNotification($locked));

            return $locked->refresh();
        });
    }
}
