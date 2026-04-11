<?php

namespace App\Actions\Zeus;

use App\Events\Zeus\EstateCreated;
use App\Models\Estate;
use App\Models\Plan;
use App\Models\User;
use App\Services\Billing\InitializeTrialService;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateEstateAction
{
    public function __construct(
        private InitializeTrialService $initializeTrialService,
    ) {}

    /**
     * @param  array{name: string, email: string, address?: string|null, plan_id: int, charge_type?: string, free_trial_enabled?: bool, free_trial_days?: int}  $data
     */
    public function execute(array $data): Estate
    {
        return DB::transaction(function () use ($data) {
            $plan = Plan::findOrFail($data['plan_id']);

            // 1. Create the estate
            $estate = Estate::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'address' => $data['address'] ?? null,
                'status' => 'inactive',
            ]);

            // 2. Create user with estate email (no password)
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => null,
            ]);

            // 3. Insert pivot record with pending status
            $estate->users()->attach($user->id, ['status' => 'pending']);

            // 4. Assign admin role scoped to this estate
            setPermissionsTeamId($estate->id);
            Role::firstOrCreate(['name' => 'admin', 'estate_id' => $estate->id, 'guard_name' => 'web']);
            $user->assignRole('admin');

            // 5. Create the subscription
            $estate->subscriptionRecord()->create([
                'plan_id' => $plan->id,
                'status' => 'active',
                'billing_interval' => $plan->billing_interval,
            ]);

            // 6. Create estate settings with billing model and free trial configuration
            $settingsData = [
                'charge_type' => $data['charge_type'] ?? 'estate',
                'free_trial_enabled' => $data['free_trial_enabled'] ?? true,
                'free_trial_days' => $data['free_trial_days'] ?? 30,
            ];
            $estate->settings()->create($settingsData);

            // 7. Initialize trial period based on settings
            $this->initializeTrialService->initializeForEstate($estate);

            // 8. Dispatch event for side effects (invitation email)
            event(new EstateCreated($estate, $user));

            return $estate;
        });
    }
}
