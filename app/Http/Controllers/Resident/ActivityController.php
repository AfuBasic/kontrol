<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Services\Notifications\NotificationContextService;
use App\Services\Resident\AccessCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
        private NotificationContextService $notificationContext,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = Auth::user();

        $unreadCount = $this->notificationContext->unreadCountForCurrentContext($user);

        $search = $request->input('search');

        return Inertia::render('Resident/Activity', [
            'unreadCount' => $unreadCount,
            'activities' => Inertia::scroll(fn () => $this->accessCodeService->getRecentActivityPaginated(10, $search)),
            'filters' => [
                'search' => $search,
            ],
            'notifications' => $this->notificationContext->scopeToCurrentContext($user->notifications())->take(20)->get()->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => class_basename($notification->type),
                    'data' => $notification->data,
                    'read_at' => $notification->read_at ? $notification->read_at->toISOString() : null,
                    'created_at' => $notification->created_at->toISOString(),
                ];
            }),
        ]);
    }
}
