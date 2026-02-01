<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $permissions = [];
        $roles = [];

        if ($user) {
            // Set team context for permission check
            $estate = $user->estates()->wherePivot('status', 'accepted')->first();
            if ($estate) {
                setPermissionsTeamId($estate->id);
            }

            $permissions = $user->getAllPermissions()->map(fn ($p) => ['name' => $p->name])->values()->all();
            $roles = $user->getRoleNames()->toArray();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'permissions' => $permissions,
                    'roles' => $roles,
                    'current_estate_id' => $estate?->id,
                    'unread_notifications_count' => $user->unreadNotifications()->count(),
                    'notifications' => $user->unreadNotifications()->latest()->take(5)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'data' => $n->data,
                        'created_at_human' => $n->created_at->diffForHumans(),
                    ]),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
