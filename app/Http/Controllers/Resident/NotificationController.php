<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Services\Notifications\NotificationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationContextService $notificationContext,
    ) {}

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(string $id, Request $request): RedirectResponse
    {
        $notification = $this->notificationContext->findForCurrentContext($request->user(), $id);
        $notification->markAsRead();

        return back();
    }

    /**
     * Mark all notifications as read for the resident.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $this->notificationContext->markAllAsReadForCurrentContext($request->user());

        return back();
    }

    /**
     * Clear all notifications for the resident.
     */
    public function clearAll(Request $request): RedirectResponse
    {
        $this->notificationContext->clearForCurrentContext($request->user());

        return back();
    }
}
