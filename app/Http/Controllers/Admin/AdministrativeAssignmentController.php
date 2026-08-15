<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Actions\Admin\DeactivateAdministrativeAssignmentAction;
use App\Actions\Admin\DeleteAdministrativeAssignmentAction;
use App\Actions\Admin\UpdateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdministrativeAssignmentRequest;
use App\Http\Requests\Admin\UpdateAdministrativeAssignmentRequest;
use App\Models\AdministrativeAssignment;
use App\Models\User;
use App\Models\Zone;
use App\Services\Admin\AdministrativeAssignmentService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdministrativeAssignmentController extends Controller
{
    public function __construct(
        protected AdministrativeAssignmentService $assignmentService,
        protected EstateContextService $estateContext
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AdministrativeAssignment::class);

        $filters = $request->only(['search', 'status', 'scope_type']);

        $assignments = $this->assignmentService
            ->getPaginatedAssignments(15, $filters)
            ->through(fn (AdministrativeAssignment $assignment) => $this->transformAssignment($assignment));

        return Inertia::render('Admin/Assignments/Index', [
            'assignments' => $assignments,
            'filters' => $filters,
            'has_assignable_roles' => $this->assignmentService->getAssignableRoles()->isNotEmpty(),
            'has_assignable_users' => $this->assignmentService->getAssignableUsers()->isNotEmpty(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', AdministrativeAssignment::class);

        return Inertia::render('Admin/Assignments/Create', [
            'users' => $this->assignmentService->getAssignableUsers(),
            'roles' => $this->assignmentService->getAssignableRoles(),
            'zones' => $this->assignmentService->getAssignableZones(),
        ]);
    }

    public function store(
        StoreAdministrativeAssignmentRequest $request,
        CreateAdministrativeAssignmentAction $action
    ): RedirectResponse {
        $this->authorize('create', AdministrativeAssignment::class);

        $estate = $this->estateContext->getEstate();
        $validated = $request->validated();

        $user = User::findOrFail($validated['user_id']);
        $roleIds = $validated['role_ids'];

        foreach ($roleIds as $roleId) {
            $exists = AdministrativeAssignment::where('user_id', $user->id)
                ->where('estate_id', $estate->id)
                ->where('role_id', $roleId)
                ->exists();

            if (! $exists) {
                $action->execute(
                    user: $user,
                    estate: $estate,
                    role: Role::findOrFail($roleId),
                    scopeType: AssignmentScope::from($validated['scope_type']),
                    zone: isset($validated['zone_id']) ? Zone::find($validated['zone_id']) : null,
                    isPrimary: (bool) ($validated['is_primary'] ?? false),
                    isActive: (bool) ($validated['is_active'] ?? true),
                );
            }
        }

        return redirect()
            ->route('admin.assignments.index')
            ->with('success', 'Assignments created successfully.');
    }

    public function edit(AdministrativeAssignment $assignment): Response
    {
        $this->authorize('update', $assignment);
        $this->ensureAssignmentInCurrentEstate($assignment);

        $assignment->load(['user', 'role', 'zone']);

        $userRoleIds = AdministrativeAssignment::where('user_id', $assignment->user_id)
            ->where('estate_id', $assignment->estate_id)
            ->where('is_primary', false)
            ->pluck('role_id')
            ->map(fn($id) => (string)$id)
            ->toArray();

        return Inertia::render('Admin/Assignments/Edit', [
            'assignment' => $this->transformAssignment($assignment),
            'user_role_ids' => $userRoleIds,
            'roles' => $this->assignmentService->getAssignableRoles(),
            'zones' => $this->assignmentService->getAssignableZones(),
        ]);
    }

    public function update(
        UpdateAdministrativeAssignmentRequest $request,
        AdministrativeAssignment $assignment,
        UpdateAdministrativeAssignmentAction $action,
        CreateAdministrativeAssignmentAction $createAction
    ): RedirectResponse {
        $this->authorize('update', $assignment);
        $this->ensureAssignmentInCurrentEstate($assignment);

        $estate = $this->estateContext->getEstate();
        $validated = $request->validated();
        $roleIds = $validated['role_ids'];

        // 1. Delete assignments for roles that are no longer selected
        $assignmentsToDelete = AdministrativeAssignment::where('user_id', $assignment->user_id)
            ->where('estate_id', $estate->id)
            ->where('is_primary', false)
            ->whereNotIn('role_id', $roleIds)
            ->get();

        $deleteAction = app(DeleteAdministrativeAssignmentAction::class);
        foreach ($assignmentsToDelete as $delAssignment) {
            $deleteAction->execute($delAssignment);
        }

        // 2. Add or update assignments for selected roles
        foreach ($roleIds as $roleId) {
            $existing = AdministrativeAssignment::where('user_id', $assignment->user_id)
                ->where('estate_id', $estate->id)
                ->where('role_id', $roleId)
                ->first();

            if ($existing) {
                $action->execute($existing, [
                    'scope_type' => $validated['scope_type'],
                    'zone_id' => $validated['zone_id'] ?? null,
                    'is_active' => (bool) ($validated['is_active'] ?? true),
                ]);
            } else {
                $createAction->execute(
                    user: $assignment->user,
                    estate: $estate,
                    role: Role::findOrFail($roleId),
                    scopeType: AssignmentScope::from($validated['scope_type']),
                    zone: isset($validated['zone_id']) ? Zone::find($validated['zone_id']) : null,
                    isPrimary: false,
                    isActive: (bool) ($validated['is_active'] ?? true),
                );
            }
        }

        return redirect()
            ->route('admin.assignments.index')
            ->with('success', 'Assignments updated successfully.');
    }

    public function deactivate(
        AdministrativeAssignment $assignment,
        DeactivateAdministrativeAssignmentAction $action
    ): RedirectResponse {
        $this->authorize('deactivate', $assignment);
        $this->ensureAssignmentInCurrentEstate($assignment);

        $action->execute($assignment);

        return back()->with('success', 'Assignment deactivated successfully.');
    }

    public function activate(
        AdministrativeAssignment $assignment,
        UpdateAdministrativeAssignmentAction $action
    ): RedirectResponse {
        $this->authorize('update', $assignment);
        $this->ensureAssignmentInCurrentEstate($assignment);

        $action->execute($assignment, ['is_active' => true]);

        return back()->with('success', 'Assignment activated successfully.');
    }

    public function destroy(
        AdministrativeAssignment $assignment,
        DeleteAdministrativeAssignmentAction $action
    ): RedirectResponse {
        $this->authorize('delete', $assignment);
        $this->ensureAssignmentInCurrentEstate($assignment);

        $action->execute($assignment);

        return redirect()
            ->route('admin.assignments.index')
            ->with('success', 'Assignment deleted successfully.');
    }

    /**
     * Hard guard: never trust route IDs across estates.
     */
    private function ensureAssignmentInCurrentEstate(AdministrativeAssignment $assignment): void
    {
        if ((int) $assignment->estate_id !== (int) $this->estateContext->getEstateId()) {
            abort(404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transformAssignment(AdministrativeAssignment $assignment): array
    {
        return [
            'id' => $assignment->id,
            'user' => [
                'id' => $assignment->user?->id,
                'ulid' => $assignment->user?->ulid,
                'name' => $assignment->user?->name,
                'email' => $assignment->user?->email,
            ],
            'role' => [
                'id' => $assignment->role?->id,
                'name' => $assignment->role?->name,
            ],
            'scope_type' => $assignment->scope_type?->value ?? $assignment->scope_type,
            'zone' => $assignment->zone ? [
                'id' => $assignment->zone->id,
                'name' => $assignment->zone->name,
            ] : null,
            'is_primary' => $assignment->is_primary,
            'is_active' => $assignment->is_active,
            'created_at' => $assignment->created_at?->format('M d, Y'),
            'updated_at' => $assignment->updated_at?->format('M d, Y'),
        ];
    }
}
