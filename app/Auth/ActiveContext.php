<?php

namespace App\Auth;

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
    public function canAccess(\Illuminate\Database\Eloquent\Model $model): bool
    {
        // Enforce estate boundary first if model has estate_id
        if (isset($model->estate_id) && $model->estate_id !== $this->estateId) {
            return false;
        }

        // 1. User models (Residents, Property Owners, Security, Admins)
        if ($model instanceof \App\Models\User) {
            $membership = \Illuminate\Support\Facades\DB::table('estate_users_membership')
                ->where('user_id', $model->id)
                ->where('estate_id', $this->estateId)
                ->first();

            if (! $membership) {
                return false;
            }

            return ! $this->isZoneScoped() || $membership->zone_id === $this->zoneId;
        }

        // 2. CollectionAssignment
        if ($model instanceof \App\Models\CollectionAssignment) {
            if ($model->property_id) {
                $property = \App\Models\Property::withoutZoneIsolation()->find($model->property_id);
                return $property && $property->estate_id === $this->estateId && (! $this->isZoneScoped() || $property->zone_id === $this->zoneId);
            }

            $membership = \Illuminate\Support\Facades\DB::table('estate_users_membership')
                ->where('user_id', $model->user_id)
                ->where('estate_id', $this->estateId)
                ->first();

            return $membership && (! $this->isZoneScoped() || $membership->zone_id === $this->zoneId);
        }

        // 3. Payment
        if ($model instanceof \App\Models\Payment) {
            if ($model->collection_assignment_id) {
                $assignment = \App\Models\CollectionAssignment::find($model->collection_assignment_id);
                return $assignment && $this->canAccess($assignment);
            }
            return false;
        }

        // 4. Models with direct zone_id column
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
