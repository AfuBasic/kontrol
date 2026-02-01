<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class UserService
{
    /**
     * Get paginated users for the current estate, excluding reserved roles.
     *
     * @return LengthAwarePaginator<User>
     */
    public function getPaginatedUsers(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        $estateId = $this->getCurrentEstateId();

        return User::forEstate($estateId)
            ->whereDoesntHave('roles', function ($query) use ($estateId) {
                $query->whereIn('name', RoleSeeder::RESERVED_ROLES)
                    ->where('model_has_roles.estate_id', $estateId);
            })
            ->with(['estates' => function ($query) use ($estateId) {
                $query->where('estates.id', $estateId);
            }])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get the current user's active estate.
     */
    public function getCurrentEstate(): Estate
    {
        $user = Auth::user();

        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->firstOrFail();
    }

    /**
     * Get the current estate ID.
     */
    public function getCurrentEstateId(): int
    {
        return $this->getCurrentEstate()->id;
    }
}
