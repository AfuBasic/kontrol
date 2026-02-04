<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Services\Resident\AccessCodeService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
    ) {}

    public function __invoke(): Response
    {
        $user = Auth::user();

        // Capture count before marking as read so we can show it on the tab
        $unreadCount = $user->unreadNotifications()->count();
        
        // Mark all notifications as read when visiting the feed
        $user->unreadNotifications->markAsRead();

        return Inertia::render('resident/activity', [
            'unreadCount' => $unreadCount,
            'activities' => $this->accessCodeService->getRecentActivity(50),
            'notifications' => $user->notifications()->take(20)->get()->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => class_basename($notification->type),
                    'data' => $notification->data,
                    'read_at' => $notification->read_at ? $notification->read_at->toISOString() : null,
                    'created_at' => $notification->created_at->toISOString(),
                ];
            }),
        ]);
    }
}
