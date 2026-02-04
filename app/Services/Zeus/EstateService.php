<?php

namespace App\Services\Zeus;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EstateService
{
    /**
     * @return array{total: int, active: int, inactive: int}
     */
    public function getStats(): array
    {
        return [
            'total' => Estate::query()->count(),
            'active' => Estate::query()->where('status', 'active')->count(),
            'inactive' => Estate::query()->where('status', 'inactive')->count(),
        ];
    }

    /**
     * @return LengthAwarePaginator<Estate>
     */
    public function getPaginatedEstates(?string $search = null, ?string $status = null, int $perPage = 10): LengthAwarePaginator
    {
        $query = Estate::query()
            ->select(['id', 'name', 'email', 'address', 'status', 'created_at'])
            ->when($search, function ($q, $search) {
                $q->where(function ($subQ) use ($search) {
                    $subQ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->when($status, fn ($q, $status) => $q->where('status', $status));

        return $query
            ->with(['users' => function ($q) {
                // Eager load users who have the 'admin' role.
                // We don't rely on the global scope here because it might filter out roles from other teams.
                $q->whereHas('roles', function ($q) {
                    $q->where('name', 'admin');
                });
            }])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(function (Estate $estate) {
                // Check if any user is an accepted admin for this specific estate.
                // We manually check model_has_roles to bypass Spatie's global team scope.
                $estate->admin_accepted = $estate->hasAcceptedAdmin();
                unset($estate->users);

                return $estate;
            })
            ->withQueryString();
    }
}
