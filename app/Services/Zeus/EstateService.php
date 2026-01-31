<?php

namespace App\Services\Zeus;

use App\Models\Estate;
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
            ->select(['id', 'name', 'email', 'address', 'status', 'created_at']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }
}
