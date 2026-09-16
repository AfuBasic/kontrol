<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    /**
     * Display notifications for the organization user.
     */
    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();
        $user = $request->user();

        // Scope notifications: either tied to this organization, this estate, or user level notifications
        $notifications = $user->notifications()
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

        $unreadCount = $user->unreadNotifications()->count();

        return Inertia::render('Organization/Notifications', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'type' => $organization->type,
                'estate_name' => $organization->estate?->name ?? 'Estate',
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id, Request $request): RedirectResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }

        return back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request): RedirectResponse
    {
        $request->user()->notifications()->delete();

        return back();
    }
}
