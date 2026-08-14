<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Property;
use App\Models\User;
use App\Services\ResidentSubscriptionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class MarkPropertyOwnerAsResidentAction
{
    public function __construct(
        protected ResidentSubscriptionService $subscriptionService
    ) {}

    public function execute(User $propertyOwner, Estate $estate): void
    {
        DB::transaction(function () use ($propertyOwner, $estate) {
            $residentRole = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            $poRole = Role::where('name', 'property_owner')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->first();

            app(ContextManager::class)->setSystemContext($estate->id);

            // 1. Assign resident role
            if (! $propertyOwner->hasRole('resident')) {
                $propertyOwner->assignRole($residentRole);
            }

            // 2. Ensure resident administrative assignment exists & is active
            AdministrativeAssignment::updateOrCreate(
                [
                    'user_id' => $propertyOwner->id,
                    'estate_id' => $estate->id,
                    'role_id' => $residentRole->id,
                ],
                [
                    'scope_type' => AssignmentScope::Estate,
                    'is_primary' => false,
                    'is_active' => true,
                ]
            );

            // 3. Remove property_owner role and assignment
            if ($poRole) {
                if ($propertyOwner->hasRole('property_owner')) {
                    $propertyOwner->removeRole($poRole);
                }
                AdministrativeAssignment::where('user_id', $propertyOwner->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $poRole->id)
                    ->delete();
            }

            // 4. Unassign owned properties in this estate
            Property::where('estate_id', $estate->id)
                ->where('property_owner_id', $propertyOwner->id)
                ->update(['property_owner_id' => null]);

            // 5. Initialize resident subscription
            $this->subscriptionService->createForUser($propertyOwner, $estate);

            // 6. Log the activity
            activity()
                ->performedOn($propertyOwner)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('swapped property owner role to resident for '.$propertyOwner->name);
        });
    }
}
