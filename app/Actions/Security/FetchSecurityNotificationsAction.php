<?php

namespace App\Actions\Security;

use App\Models\User;
use App\Notifications\Resident\CollectionReminderNotification;
use App\Notifications\Resident\CouponIssuedNotification;
use App\Notifications\Resident\InvoicePaidNotification;
use App\Notifications\Resident\NewCollectionNotification;
use App\Notifications\Resident\NewInvoiceNotification;
use App\Notifications\Resident\PaymentFailedNotification;
use App\Notifications\Resident\SosResponderNotification;
use App\Notifications\ResidentApproved;
use App\Notifications\ResidentInvitedNotification;
use App\Notifications\ResidentRejected;
use App\Notifications\ResidentSubscriptionExpiredNotification;
use App\Notifications\ResidentSubscriptionExpiringNotification;
use App\Notifications\ResidentTrialEndingNotification;
use App\Notifications\VisitorArrivedNotification;
use App\Notifications\VisitorCheckedOutNotification;
use App\Services\Notifications\NotificationContextService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

class FetchSecurityNotificationsAction
{
    public const RESIDENT_NOTIFICATION_TYPES = [
        VisitorCheckedOutNotification::class,
        VisitorArrivedNotification::class,
        ResidentApproved::class,
        ResidentRejected::class,
        ResidentInvitedNotification::class,
        ResidentSubscriptionExpiringNotification::class,
        ResidentSubscriptionExpiredNotification::class,
        ResidentTrialEndingNotification::class,
        NewCollectionNotification::class,
        CollectionReminderNotification::class,
        NewInvoiceNotification::class,
        InvoicePaidNotification::class,
        PaymentFailedNotification::class,
        CouponIssuedNotification::class,
        SosResponderNotification::class,
        'App\Notifications\VisitorCheckedOutNotification',
        'App\Notifications\VisitorArrivedNotification',
        'App\Notifications\VisitorAccessGrantedNotification',
        'App\Notifications\HouseholdMemberInvitedNotification',
        'App\Notifications\ResidentSubscriptionNotification',
    ];

    public function __construct(
        private NotificationContextService $notificationContext,
    ) {}

    /**
     * Fetch paginated notifications for a security user.
     *
     * @return LengthAwarePaginator<DatabaseNotification>
     */
    public function execute(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $this->notificationContext
            ->scopeToCurrentContext($user->notifications())
            ->whereNotIn('type', self::RESIDENT_NOTIFICATION_TYPES)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get unread notification count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return $this->notificationContext
            ->scopeToCurrentContext($user->unreadNotifications())
            ->whereNotIn('type', self::RESIDENT_NOTIFICATION_TYPES)
            ->count();
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(User $user, string $notificationId): bool
    {
        $notification = $this->notificationContext->findForCurrentContext($user, $notificationId);

        $notification->markAsRead();

        return true;
    }

    public function markAllAsRead(User $user): void
    {
        $this->notificationContext->markAllAsReadForCurrentContext($user);
    }

    /**
     * Clear all notifications for a user.
     */
    public function clearAll(User $user): void
    {
        $this->notificationContext->clearForCurrentContext($user);
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
