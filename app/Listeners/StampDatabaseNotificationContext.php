<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\Notifications\NotificationContextService;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Events\NotificationSent;

class StampDatabaseNotificationContext
{
    public function __construct(
        private NotificationContextService $notificationContext,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database') {
            return;
        }

        if (! $event->response instanceof DatabaseNotification) {
            return;
        }

        if (! $event->notifiable instanceof User) {
            return;
        }

        $event->response->forceFill(
            $this->notificationContext->attributesFor(
                $event->notification,
                $event->notifiable,
                $event->response
            )
        )->save();
    }
}
