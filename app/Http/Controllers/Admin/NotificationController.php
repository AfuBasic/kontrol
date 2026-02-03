<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display a listing of the notifications.
     */
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
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

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id, Request $request)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
