<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\ZeusNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString() ?: 'all';
        $search = $request->string('search')->toString();

        $notifications = ZeusNotification::query()
            ->when($type === 'unread', fn ($query) => $query->unread())
            ->when($type === 'read', fn ($query) => $query->whereNotNull('read_at'))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('body', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ZeusNotification $notification) => $this->transform($notification));

        return Inertia::render('Zeus/Notifications/Index', [
            'notifications' => $notifications,
            'filters' => [
                'search' => $search,
                'type' => $type,
            ],
            'unreadCount' => ZeusNotification::query()->unread()->count(),
        ]);
    }

    public function markAsRead(ZeusNotification $notification): RedirectResponse
    {
        $notification->markAsRead();

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        ZeusNotification::query()
            ->unread()
            ->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(ZeusNotification $notification): RedirectResponse
    {
        $notification->delete();

        return back()->with('success', 'Notification removed.');
    }

    public function clearAll(): RedirectResponse
    {
        ZeusNotification::query()->delete();

        return back()->with('success', 'All notifications cleared.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(ZeusNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'body' => $notification->body,
            'action_url' => $notification->action_url,
            'data' => $notification->data,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
            'created_at_human' => $notification->created_at?->diffForHumans(),
            'is_unread' => $notification->isUnread(),
        ];
    }
}
