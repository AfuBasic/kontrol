<?php

namespace App\Services\Admin;

use App\Models\AdministrativeAssignment;
use App\Models\User;
use App\Models\Zone;
use App\Services\EstateContextService;
use Database\Seeders\RoleSeeder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

class AdministrativeAssignmentService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Paginated assignments for the authoritative current estate context.
     *
     * @param  array{search?: string|null, status?: string|null, scope_type?: string|null}  $filters
     * @return LengthAwarePaginator<int, AdministrativeAssignment>
     */
    public function getPaginatedAssignments(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $estateId = $this->estateContext->getEstateId();

        return AdministrativeAssignment::query()
            ->forEstate($estateId)
            ->where('is_primary', false)
            ->with(['user', 'role', 'zone'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('role', function ($roleQuery) use ($search) {
                        $roleQuery->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->when(($filters['status'] ?? null) === 'active', fn ($q) => $q->where('is_active', true))
            ->when(($filters['status'] ?? null) === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when($filters['scope_type'] ?? null, fn ($q, $scope) => $q->where('scope_type', $scope))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Estate-scoped Spatie roles available for assignment in the current estate.
     *
     * @return Collection<int, Role>
     */
    public function getAssignableRoles(): Collection
    {
        $estateId = $this->estateContext->getEstateId();

        return Role::query()
            ->where('estate_id', $estateId)
            ->whereNotIn('name', RoleSeeder::RESERVED_ROLES)
            ->orderBy('name')
            ->get(['id', 'name', 'estate_id']);
    }

    /**
     * Accepted estate members available as assignment targets.
     *
     * @return Collection<int, User>
     */
    public function getAssignableUsers(): Collection
    {
        $estateId = $this->estateContext->getEstateId();

        return User::query()
            ->forEstate($estateId)
            ->whereHas('estates', function ($query) use ($estateId) {
                $query->where('estates.id', $estateId)
                    ->where('estate_users_membership.status', 'accepted');
            })
            ->whereDoesntHave('administrativeAssignments', function ($query) use ($estateId) {
                $query->where('estate_id', $estateId)
                    ->where('is_primary', true);
            })
            ->orderBy('name')
            ->get(['id', 'ulid', 'name', 'email']);
    }

    /**
     * Zones belonging to the current estate.
     *
     * @return Collection<int, Zone>
     */
    public function getAssignableZones(): Collection
    {
        $estateId = $this->estateContext->getEstateId();

        return Zone::query()
            ->where('estate_id', $estateId)
            ->orderBy('name')
            ->get(['id', 'name', 'estate_id']);
    }
}
