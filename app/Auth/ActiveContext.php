<?php

namespace App\Auth;

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ActiveContext
{
    public function __construct(
        public readonly int $userId,
        public readonly int $estateId,
        public readonly int $assignmentId,
        public readonly int $roleId,
        public readonly ?int $zoneId = null
    ) {}

    public function isEstateScoped(): bool
    {
        return $this->zoneId === null;
    }

    public function isZoneScoped(): bool
    {
        return $this->zoneId !== null;
    }

    /**
     * Determine if a model falls within the authorized scope of the active context.
     */
    public function canAccess(Model $model): bool
    {
        // Enforce estate boundary first if model has estate_id
        if (isset($model->estate_id) && $model->estate_id !== $this->estateId) {
            return false;
        }

        // 1. User models (Residents, Property Owners, Security, Admins)
        if ($model instanceof User) {
            $membership = DB::table('estate_users_membership')
                ->where('user_id', $model->id)
                ->where('estate_id', $this->estateId)
                ->first();

            if (! $membership) {
                return false;
            }

            return ! $this->isZoneScoped() || $membership->zone_id === $this->zoneId;
        }

        // 2. CollectionAssignment
        if ($model instanceof CollectionAssignment) {
            if ($model->property_id) {
                $property = Property::withoutZoneIsolation()->find($model->property_id);

                return $property && $property->estate_id === $this->estateId && (! $this->isZoneScoped() || $property->zone_id === $this->zoneId);
            }

            $membership = DB::table('estate_users_membership')
                ->where('user_id', $model->user_id)
                ->where('estate_id', $this->estateId)
                ->first();

            return $membership && (! $this->isZoneScoped() || $membership->zone_id === $this->zoneId);
        }

        // 3. Payment
        if ($model instanceof Payment) {
            if ($model->collection_assignment_id) {
                $assignment = CollectionAssignment::find($model->collection_assignment_id);

                return $assignment && $this->canAccess($assignment);
            }

            return false;
        }

        // 4. Collection — zone targeting via pivot table
        if ($model instanceof Collection) {
            if (! $this->isZoneScoped()) {
                return true;
            }

            // Zone-scoped: allow access only if collection targets this zone or is estate-wide
            if ($model->applies_to === 'zone') {
                return $model->zones()->where('zones.id', $this->zoneId)->exists();
            }

            // Estate-wide or per-target collections are accessible to zone admins
            return true;
        }

        // 5. Models with direct zone_id column
        $attributes = $model->getAttributes();
        if (array_key_exists('zone_id', $attributes)) {
            return ! $this->isZoneScoped() || $model->zone_id === $this->zoneId;
        }

        return true;
    }

    /**
     * Get the list of authorized zone IDs for the active context.
     *
     * @return array<int>
     */
    public function authorizedZoneIds(): array
    {
        return $this->zoneId !== null ? [$this->zoneId] : [];
    }
}
