<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Notifications\NotificationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationContextService $notificationContext,
    ) {}

    /**
     * Display a listing of the notifications.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $this->notificationContext->markAllAsReadForCurrentContext($user);

        $notifications = $this->notificationContext
            ->scopeToCurrentContext($user->notifications())
            ->when($request->search, function ($query, $search) {
                $query->where('data', 'like', "%{$search}%");
            })
            ->when($request->type === 'unread', function ($query) {
                $query->whereNull('read_at');
            })
            ->when($request->type === 'read', function ($query) {
                $query->whereNotNull('read_at');
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Notifications/Index', [
            'notifications' => $notifications,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id, Request $request): RedirectResponse
    {
        $notification = $this->notificationContext->findForCurrentContext($request->user(), $id);
        $notification->markAsRead();

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $this->notificationContext->markAllAsReadForCurrentContext($request->user());

        return back();
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request): RedirectResponse
    {
        $this->notificationContext->clearForCurrentContext($request->user());

        return back();
    }
}
