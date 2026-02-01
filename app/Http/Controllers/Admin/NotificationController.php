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
                // Determine if we are searching data JSON or just notification types?
                // data is JSON, so we can search it if supported by DB or filter collection if small scale.
                // For SQL compatibility with JSON, we'll try a basic `where` on the data column if possible,
                // but standard text search on JSON can be tricky.
                // Let's assume basic search on the 'data' column cast to string or similar for now,
                // OR filter collection since notifications are usually few for one user (pagination happens after).
                // Better: rely on simple filtering for now or search `data->message` if known structure.
                // Given the dynamic nature, we'll search the full boolean text if possible, or just skip complex JSON search for MVP efficiency.
                // Let's implement searching the `data` column as text.
                $query->where('data', 'like', "%{$search}%");
            })
            ->when($request->filter === 'unread', function ($query) {
                $query->whereNull('read_at');
            })
            ->when($request->filter === 'read', function ($query) {
                $query->whereNotNull('read_at');
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'filters' => $request->only(['search', 'filter']),
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
