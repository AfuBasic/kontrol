<?php

namespace App\Http\Controllers\Admin;

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
        $roles = $this->roleService->getManageableRoles();

        return Inertia::render('admin/users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created admin in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $estateId = $this->userService->getCurrentEstateId();
        $estate = $this->userService->getCurrentEstate();

        // Validate request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                // Detailed uniqueness check could be added here if needed to avoid duplicates across system
                // But for now, we'll handle existing users in logic below
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        DB::transaction(function () use ($validated, $estateId, $estate) {
            // Check if user already exists
            $user = User::where('email', $validated['email'])->first();

            if (! $user) {
                // Create new user
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => null, // Password will be set on invite acceptance
                ]);
            }

            // Assign to Estate
            if (! $user->estates()->where('estates.id', $estateId)->exists()) {
                $user->estates()->attach($estateId, ['status' => 'pending']);
            }

            // Assign Admin Role scoped to this estate
            setPermissionsTeamId($estateId);
            
            // Check if user has any role for this estate, if not assign the selected one
            // Or should we sync? For a new invite, we assign.
            if (! $user->hasRole($validated['role'])) {
                $user->assignRole($validated['role']);
            }

            // Send Invitation Email
            // Only send if password is not set (i.e. they are pending invite)
            if ($user->password === null) {
                Mail::to($user->email)->send(new AdminInvitationMail($user, $estate));
            }
        });

        return redirect()->route('users.index')
            ->with('success', 'Admin invited successfully.');
    }

    /**
     * Show the form for editing the specified admin.
     */
    public function edit(User $admin): Response
    {
        $estateId = $this->userService->getCurrentEstateId();
        $roles = $this->roleService->getManageableRoles();
        
        // Load roles for the user in the context of this estate
        setPermissionsTeamId($estateId);
        $currentRole = $admin->roles->first()?->name;

        return Inertia::render('admin/users/Edit', [
            'user' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $currentRole,
            ],
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified admin in storage.
     */
    public function update(Request $request, User $admin): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($admin->id),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $admin->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $estateId = $this->userService->getCurrentEstateId();
        setPermissionsTeamId($estateId);

        if (isset($validated['role'])) {
            $admin->syncRoles([$validated['role']]);
        }

        return back()->with('success', 'Admin updated successfully.');
    }

    /**
     * Remove the specified admin from storage (or detach from estate).
     */
    public function destroy(User $admin): RedirectResponse
    {
        $estateId = $this->userService->getCurrentEstateId();

        // Prevent deleting yourself
        if ($admin->id === Auth::id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        DB::transaction(function () use ($admin, $estateId) {
            // Detach role for this estate
            setPermissionsTeamId($estateId);
            if ($admin->hasRole('admin')) {
                $admin->removeRole('admin');
            }

            // Detach from estate key membership
            $admin->estates()->detach($estateId);

            // If user has no other estates and no password (invite pending), maybe delete entirely?
            // For now, let's keep it safe and just detach.
            // But if they are purely a new invite for this estate, might be cleaner to delete.
            if ($admin->estates()->count() === 0 && $admin->password === null) {
                $admin->delete();
            }
        });

        return redirect()->route('users.index')
            ->with('success', 'Admin removed successfully.');
    }
}
