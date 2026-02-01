<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateUserAction;
use App\Actions\Admin\UpdateUserAction;
use App\Events\Admin\UserCreated;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Controllers\Controller;
use App\Mail\Admin\AdminInvitationMail;
use App\Models\User;
use App\Services\Admin\RoleService;
use App\Services\Admin\UserService;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(
        protected RoleService $roleService,
        protected UserService $userService
    ) {}

    /**
     * Display a listing of the admins.
     */
    public function index(Request $request): Response
    {
        $this->authorize('users.view');

        $estateId = $this->userService->getCurrentEstateId();

        $users = $this->userService->getPaginatedUsers(10, $request->only(['search']))
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->estates->first()->pivot->status ?? 'unknown',
                'created_at' => $user->created_at->format('M d, Y'),
                'roles' => $user->roles->where('pivot.estate_id', $estateId)->pluck('name'),
            ]);

        return Inertia::render('admin/users/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new admin.
     */
    public function create(): Response
    {
        $this->authorize('users.create');

        $roles = $this->roleService->getManageableRoles();

        return Inertia::render('admin/users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created admin in storage.
     */
    /**
     * Store a newly created admin in storage.
     */
    public function store(StoreUserRequest $request, CreateUserAction $action): RedirectResponse
    {
        $this->authorize('users.create');

        $estate = $this->userService->getCurrentEstate();

        $action->execute($request->validated(), $estate);

        return redirect()->route('users.index')
            ->with('success', 'Admin invited successfully.');
    }

    /**
     * Show the form for editing the specified admin.
     */
    public function edit(User $user): Response
    {
        $this->authorize('users.edit');

        $estateId = $this->userService->getCurrentEstateId();
        $roles = $this->roleService->getManageableRoles();
        
        // Load roles for the user in the context of this estate
        setPermissionsTeamId($estateId);
        $currentRole = $user->roles->first()?->name;

        return Inertia::render('admin/users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $currentRole,
            ],
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified admin in storage.
     */
    public function update(Request $request, User $user, UpdateUserAction $action): RedirectResponse
    {
        $this->authorize('users.edit');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $action->execute($user, $validated);

        return back()->with('success', 'Admin updated successfully.');
    }

    /**
     * Remove the specified admin from storage (or detach from estate).
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('users.delete');

        $estateId = $this->userService->getCurrentEstateId();

        // Prevent deleting yourself
        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        DB::transaction(function () use ($user, $estateId) {
            // Detach all roles for this estate
            setPermissionsTeamId($estateId);
            $user->syncRoles([]);

            // Detach from estate key membership
            $user->estates()->detach($estateId);

            // If user has no other estates and no password (invite pending), maybe delete entirely?
            // For now, let's keep it safe and just detach.
            // But if they are purely a new invite for this estate, might be cleaner to delete.
            if ($user->estates()->count() === 0 && $user->password === null) {
                $user->delete();
            }
        });

        return redirect()->route('users.index')
            ->with('success', 'Admin removed successfully.');
    }

    /**
     * Reset the password and resend invitation for the specified admin.
     */
    public function resetPassword(User $user): RedirectResponse
    {
        $this->authorize('users.edit');

        $estate = $this->userService->getCurrentEstate();

        // 1. Reset password
        $user->update(['password' => null]);

        // 2. Set status to pending for the current estate
        $user->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // 3. Resend invitation email
        event(new UserCreated($user, $estate));

        return back()->with('success', 'Admin password reset and invitation resent.');
    }
}
