<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\Permission\Models\Role;

class ResidentService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Get paginated residents for the current estate.
     *
     * @return LengthAwarePaginator<User>
     */
    public function getPaginatedResidents(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $estate = $this->estateContext->getEstate();

        $residentRoles = Role::whereIn('name', ['resident', 'household_member'])
            ->whereNull('estate_id')
            ->pluck('id');

        return User::query()
            ->forEstate($estate->id)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['resident', 'household_member']);
            })
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'property_owner');
            })
            ->with([
                'roles',
                'profile.property',
                'estates' => fn ($q) => $q->where('estates.id', $estate->id)->withPivot('zone_id'),
                'administrativeAssignments' => fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles),
            ])
            ->withCount('householdMembers')
            ->when($filters['zone'] ?? null, function ($query, $zoneId) use ($estate) {
                $query->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.zone_id', $zoneId));
            })
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', function ($pq) use ($search) {
                            $pq->where('phone', 'like', "%{$search}%")
                                ->orWhere('unit_number', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) use ($estate, $residentRoles) {
                if ($status === 'active') {
                    $query->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', true))
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'));
                } elseif ($status === 'inactive') {
                    $query->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', false));
                } elseif ($status === 'invited') {
                    $query->whereNull('password')
                        ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', true))
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                } elseif ($status === 'pending_activation') {
                    $query->whereNotNull('password')
                        ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', true))
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                } elseif ($status === 'pending') {
                    $query->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                }
            })
            ->when($filters['role'] ?? null, function ($query, $role) use ($estate) {
                if ($role === 'property_owner') {
                    $query->withRole('property_owner', $estate->id);
                } elseif ($role === 'tenant') {
                    $query->withRole('resident', $estate->id)
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->whereNotNull('estate_users_membership.property_owner_id'));
                } elseif ($role === 'resident') {
                    $query->withRole('resident', $estate->id)
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->whereNull('estate_users_membership.property_owner_id'));
                }
            })
            ->when($filters['property'] ?? null, function ($query, $property) {
                if ($property === 'assigned') {
                    $query->whereHas('profile', fn ($q) => $q->whereNotNull('property_id'));
                } elseif ($property === 'unassigned') {
                    $query->whereHas('profile', fn ($q) => $q->whereNull('property_id'));
                }
            })
            ->when($filters['sort'] ?? null, function ($query, $sort) use ($estate) {
                if ($sort === 'name') {
                    $query->orderBy('name', 'asc');
                } elseif ($sort === 'date_joined') {
                    $query->select('users.*')
                        ->join('estate_users_membership as em_sort', function ($join) use ($estate) {
                            $join->on('users.id', '=', 'em_sort.user_id')
                                ->where('em_sort.estate_id', '=', $estate->id);
                        })
                        ->orderBy('em_sort.created_at', 'desc');
                } elseif ($sort === 'recently_active') {
                    $query->orderBy('updated_at', 'desc');
                } elseif ($sort === 'unit_number') {
                    $query->join('user_profiles', 'user_profiles.user_id', '=', 'users.id')
                        ->orderBy('user_profiles.unit_number', 'asc')
                        ->select('users.*');
                }
            }, function ($query) use ($estate) {
                $query->select('users.*')
                    ->join('estate_users_membership as em_sort', function ($join) use ($estate) {
                        $join->on('users.id', '=', 'em_sort.user_id')
                            ->where('em_sort.estate_id', '=', $estate->id);
                    })
                    ->orderBy('em_sort.created_at', 'desc');
            })
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get a single resident by ID with profile.
     */
    public function getResident(int $id): ?User
    {
        $estate = $this->estateContext->getEstate();

        return User::query()
            ->forEstate($estate->id)
            ->withRole('resident', $estate->id)
            ->with('profile')
            ->find($id);
    }
}
