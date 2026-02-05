<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\FetchSecurityNotificationsAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        protected FetchSecurityNotificationsAction $fetchNotificationsAction,
    ) {}

    public function index(): Response
    {
        $user = Auth::user();
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

    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $user = Auth::user();
        $this->fetchNotificationsAction->markAsRead($user, $notification);

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        $user = Auth::user();
        $this->fetchNotificationsAction->markAllAsRead($user);

        return back();
    }
}
