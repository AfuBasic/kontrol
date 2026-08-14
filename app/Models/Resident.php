<?php

namespace App\Models;

use App\Auth\ContextManager;
use Illuminate\Database\Eloquent\Builder;

class Resident extends User
{
    /**
     * Define the table associated with the model.
     */
    protected $table = 'users';

    /**
     * Ensure polymorphic relations (like Spatie Roles) use the base User class.
     */
    public function getMorphClass()
    {
        return User::class;
    }

    /**
     * Boot the Resident model, applying global scopes for residency and zone isolation.
     */
    protected static function booted(): void
    {
        // 1. Only include users who are residents/household members
        static::addGlobalScope('resident_role', function (Builder $builder) {
            $builder->whereHas('roles', function ($q) {
                $q->whereIn('name', ['resident', 'household_member']);
            })
                ->whereDoesntHave('roles', function ($q) {
                    $q->where('name', 'property_owner');
                });
        });

        // 2. Zone scoping requires joining the estate_users_membership table
        // because the users table does not have estate_id or zone_id.
        static::addGlobalScope('resident_zone_isolation', function (Builder $builder) {
            $context = app(ContextManager::class)->current();

            if (! $context) {
                // Fail closed
                $builder->whereRaw('1 = 0');

                return;
            }

            $builder->whereHas('estates', function ($q) use ($context) {
                $q->where('estates.id', $context->estateId);

                if ($context->zoneId !== null) {
                    $q->where('estate_users_membership.zone_id', $context->zoneId);
                }
            });
        });
    }

    /**
     * An explicit, intentional bypass of the zone isolation scope.
     */
    public static function withoutZoneIsolation(): Builder
    {
        return static::withoutGlobalScope('resident_zone_isolation');
    }
}
