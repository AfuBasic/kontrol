<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\FetchSecurityNotificationsAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        protected FetchSecurityNotificationsAction $fetchNotificationsAction,
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $estate = $user->getCurrentEstate();
        $notifications = $this->fetchNotificationsAction->execute($user);
        $formatted = $this->fetchNotificationsAction->formatForFrontend($notifications);

        return Inertia::render('security/notifications', [
            'notifications' => $formatted['data'],
            'pagination' => $formatted['pagination'],
            'unreadCount' => $this->fetchNotificationsAction->getUnreadCount($user),
            'estateName' => $estate->name,
        ]);
    }

    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $user = auth()->user();
        $success = $this->fetchNotificationsAction->markAsRead($user, $notification);

        return response()->json(['success' => $success]);
    }

    public function markAllAsRead(): JsonResponse
    {
        $user = auth()->user();
        $this->fetchNotificationsAction->markAllAsRead($user);

        return response()->json(['success' => true]);
    }
}
