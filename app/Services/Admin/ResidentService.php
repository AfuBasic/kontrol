<?php

namespace App\Services\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class ResidentService
{
    /**
     * Get paginated residents for the current estate.
     *
     * @return LengthAwarePaginator<User>
     */
    public function getPaginatedResidents(int $perPage = 15): LengthAwarePaginator
    {
        $estate = $this->getCurrentEstate();

        return User::query()
            ->forEstate($estate->id)
            ->withRole('resident', $estate->id)
            ->with(['profile', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->orderBy('name')
            ->paginate($perPage);
    }

    /**
     * Get a single resident by ID with profile.
     */
    public function getResident(int $id): ?User
    {
        $estate = $this->getCurrentEstate();

        return User::query()
            ->forEstate($estate->id)
            ->withRole('resident', $estate->id)
            ->with('profile')
            ->find($id);
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
    public function getCurrentEstateId(): ?int
    {
        return $this->getCurrentEstate()?->id;
    }
}
