<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->when($request->string('type')->toString() === 'unread', fn ($query) => $query->whereNull('read_at'))
            ->when($request->string('type')->toString() === 'read', fn ($query) => $query->whereNotNull('read_at'))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where('data', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (DatabaseNotification $notification) => $this->transform($notification));

        return Inertia::render('Partner/Notifications/Index', [
            'notifications' => $notifications,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'type' => $request->string('type')->toString() ?: 'all',
            ],
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $model = $request->user()->notifications()->findOrFail($notification);
        $model->markAsRead();

        return back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    /**
     * @return array{
     *     id: string,
     *     title: string,
     *     body: string,
     *     href: string|null,
     *     read_at: string|null,
     *     created_at_human: string,
     *     type: string
     * }
     */
    public static function transform(DatabaseNotification $notification): array
    {
        /** @var array<string, mixed> $data */
        $data = is_array($notification->data) ? $notification->data : [];

        $title = (string) ($data['title'] ?? $data['subject'] ?? class_basename($notification->type));
        $body = (string) ($data['body'] ?? $data['message'] ?? $data['description'] ?? 'You have a new update.');
        $href = isset($data['url']) ? (string) $data['url'] : (isset($data['href']) ? (string) $data['href'] : null);

        if ($href === null) {
            $href = self::inferHref($data, $notification->type);
        }

        return [
            'id' => $notification->id,
            'title' => $title,
            'body' => $body,
            'href' => $href,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at_human' => self::formatCreatedAt($notification->created_at),
            'type' => class_basename($notification->type),
        ];
    }

    /**
     * Human-friendly local timestamp for partner notification UI.
     * Examples: "Just now", "1:30 PM", "Yesterday 4:05 PM", "Jul 9, 1:30 PM"
     */
    public static function formatCreatedAt(?CarbonInterface $createdAt): string
    {
        if ($createdAt === null) {
            return '';
        }

        $at = $createdAt->timezone(config('app.timezone'));

        if ($at->gt(now()->subMinute())) {
            return 'Just now';
        }

        if ($at->isToday()) {
            return $at->format('g:i A');
        }

        if ($at->isYesterday()) {
            return 'Yesterday '.$at->format('g:i A');
        }

        if ($at->isCurrentYear()) {
            return $at->format('M j, g:i A');
        }

        return $at->format('M j, Y g:i A');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function inferHref(array $data, string $type): string
    {
        $type = strtolower($type);

        if (str_contains($type, 'earning') || str_contains($type, 'commission') || str_contains($type, 'settlement')) {
            return '/partner/earnings';
        }

        if (str_contains($type, 'partnerrequest') || str_contains($type, 'estate') || isset($data['partner_request_id'])) {
            return '/partner/partner-requests';
        }

        return '/partner/notifications';
    }
}
