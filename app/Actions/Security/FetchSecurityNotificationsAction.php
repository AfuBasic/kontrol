<?php

namespace App\Actions\Security;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

class FetchSecurityNotificationsAction
{
    /**
     * Fetch paginated notifications for a security user.
     *
     * @return LengthAwarePaginator<DatabaseNotification>
     */
    public function execute(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $user->notifications()
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get unread notification count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(User $user, string $notificationId): bool
    {
        $notification = $user->notifications()->find($notificationId);

        if (! $notification) {
            return false;
        }

        $notification->markAsRead();

        return true;
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(User $user): void
    {
        $user->unreadNotifications->markAsRead();
    }

    /**
     * Format notifications for the frontend.
     *
     * @param  LengthAwarePaginator<DatabaseNotification>  $notifications
     * @return array{
     *     data: array<int, array{
     *         id: string,
     *         type: string,
     *         title: string,
     *         message: string,
     *         icon: string,
     *         read: bool,
     *         created_at: string,
     *         created_at_human: string
     *     }>,
     *     pagination: array{
     *         current_page: int,
     *         last_page: int,
     *         per_page: int,
     *         total: int
     *     }
     * }
     */
    public function formatForFrontend(LengthAwarePaginator $notifications): array
    {
        return [
            'data' => collect($notifications->items())->map(fn (DatabaseNotification $notification) => [
                'id' => $notification->id,
                'type' => $this->getNotificationType($notification),
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'icon' => $this->getNotificationIcon($notification),
                'read' => $notification->read_at !== null,
                'created_at' => $notification->created_at->toIso8601String(),
                'created_at_human' => $notification->created_at->diffForHumans(),
            ])->all(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ];
    }

    private function getNotificationType(DatabaseNotification $notification): string
    {
        $type = class_basename($notification->type);

        return match ($type) {
            'AccessCodeValidated' => 'validation',
            'AccessCodeDenied' => 'denied',
            'VisitorArrived' => 'visitor',
            'SecurityAlert' => 'alert',
            'SystemNotice' => 'system',
            default => 'info',
        };
    }

    private function getNotificationIcon(DatabaseNotification $notification): string
    {
        $type = $this->getNotificationType($notification);

        return match ($type) {
            'validation' => 'check-circle',
            'denied' => 'x-circle',
            'visitor' => 'user',
            'alert' => 'alert-triangle',
            'system' => 'info',
            default => 'bell',
        };
    }
}
