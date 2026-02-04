<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

use App\Services\EstateContextService;

class SecurityService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}
    /**
     * Get paginated security personnel for the current estate.
     *
     * @return LengthAwarePaginator<User>
     */
    public function getPaginatedSecurity(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $estate = $this->estateContext->getEstate();

        return User::query()
            ->forEstate($estate->id)
            ->withRole('security', $estate->id)
            ->with(['profile', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
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
                    $query->whereNull('suspended_at')
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('status', 'accepted'));
                } elseif ($status === 'pending') {
                    $query->whereNull('suspended_at')
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('status', 'pending'));
                }
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get a single security personnel by ID with profile.
     */
    public function getSecurity(int $id): ?User
    {
        $estate = $this->estateContext->getEstate();

        return User::query()
            ->forEstate($estate->id)
            ->withRole('security', $estate->id)
            ->with('profile')
            ->find($id);
    }
}
