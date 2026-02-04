<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

use App\Services\EstateContextService;

class UserService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Get paginated users for the current estate, excluding reserved roles.
     *
     * @return LengthAwarePaginator<User>
     */
    public function getPaginatedUsers(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        $estateId = $this->estateContext->getEstateId();

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
}
