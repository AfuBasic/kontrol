<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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

        return User::query()
            ->forEstate($estate->id)
            ->withRole('resident', $estate->id)
            ->with(['roles', 'profile.propertyOwner', 'profile.property', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) use ($estate) {
                if ($status === 'suspended') {
                    $query->whereNotNull('suspended_at');
                } elseif ($status === 'active') {
                    $query->active()
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'));
                } elseif ($status === 'pending') {
                    $query->whereNull('suspended_at')
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                } elseif ($status === 'property_owner') {
                    $query->withRole('property_owner', $estate->id);
                }
            })
            ->orderBy('name')
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
