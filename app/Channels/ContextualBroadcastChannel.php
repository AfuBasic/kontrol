<?php

namespace App\Channels;

use App\Services\Notifications\NotificationContextService;
use Illuminate\Notifications\Channels\BroadcastChannel;
use Illuminate\Notifications\Notification;

class ContextualBroadcastChannel extends BroadcastChannel
{
    protected function getData($notifiable, Notification $notification)
    {
        $data = parent::getData($notifiable, $notification);

        if (is_array($data)) {
            $contextService = app(NotificationContextService::class);
            $context = $contextService->attributesFor($notification, $notifiable, null);

            $data = array_merge($data, $context);
        }

        return $data;
    }
}
