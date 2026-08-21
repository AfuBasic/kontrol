<?php

namespace App\Actions\Zeus;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Enums\CommissionStatus;
use App\Enums\PartnerStatus;
use App\Events\Zeus\EstateCreated;
use App\Models\AdministrativeAssignment;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\Partner;
use App\Models\Plan;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use App\Services\Billing\InitializeTrialService;
use App\Services\Commission\PartnerAttributionService;
use Carbon\CarbonImmutable;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CreateEstateAction
{
    public function __construct(
        private InitializeTrialService $initializeTrialService,
        private PartnerAttributionService $attributionService,
    ) {}

    /**
     * @param  array{name: string, admin_name?: string|null, email: string, address?: string|null, plan_id?: int|null, charge_type?: string, free_trial_enabled?: bool, free_trial_days?: int}  $data
     */
    public function execute(array $data): Estate
    {
        return DB::transaction(function () use ($data) {
            $plan = isset($data['plan_id']) ? Plan::find($data['plan_id']) : null;

            // 1. Create the estate
            $estate = Estate::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'address' => $data['address'] ?? null,
                'status' => 'inactive',
            ]);

            // 2. Create the primary administrator with their own name (no password)
            $user = User::create([
                'name' => $data['admin_name'] ?? $data['name'],
                'email' => $data['email'],
                'password' => null,
            ]);

            // 3. Insert pivot record with pending status
            $estate->users()->attach($user->id, ['status' => 'pending']);

            // 4. Assign admin role scoped to this estate
            app(ContextManager::class)->setSystemContext($estate->id);
            $adminRole = Role::firstOrCreate(['name' => 'admin', 'estate_id' => $estate->id, 'guard_name' => 'web']);

            // Sync all permissions to the new estate-specific admin role
            $allPermissions = PermissionSeeder::getAllPermissionNames();
            $existingCount = Permission::whereIn('name', $allPermissions)->where('guard_name', 'web')->count();
            if ($existingCount < count($allPermissions)) {
                (new PermissionSeeder)->run();
            }
            $adminRole->syncPermissions($allPermissions);

            $user->assignRole($adminRole);

            // 4.1. Write to AdministrativeAssignment as the source of truth for ContextManager
            AdministrativeAssignment::create([
                'user_id' => $user->id,
                'estate_id' => $estate->id,
                'role_id' => $adminRole->id,
                'scope_type' => AssignmentScope::Estate,
                'is_active' => true,
                'is_primary' => true,
            ]);

            // Create pending invitation record for the primary admin user
            Invitation::withoutGlobalScope(ZoneScope::class)->updateOrCreate(
                ['estate_id' => $estate->id, 'email' => strtolower(trim($data['email']))],
                [
                    'relationship_type' => null,
                    'role_id' => $adminRole->id,
                    'scope_type' => AssignmentScope::Estate->value,
                    'zone_id' => null,
                    'token' => Str::random(64),
                    'status' => 'pending',
                    'expires_at' => now()->addDays(7),
                    'accepted_at' => null,
                    'cancelled_at' => null,
                    'created_by' => auth()->id(),
                ]
            );

            // 5. Create the subscription
            if ($plan) {
                $estate->subscriptionRecord()->create([
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'billing_interval' => $plan->billing_interval,
                ]);
            }

            // 6. Create estate settings with operational policies, billing model and free trial configuration
            $settingsData = array_merge([
                'charge_type' => $data['charge_type'] ?? 'residents',
                'free_trial_enabled' => $data['free_trial_enabled'] ?? true,
                'free_trial_days' => $data['free_trial_days'] ?? 30,
                'access_codes_enabled' => true,
                'access_code_min_lifespan_minutes' => 15,
                'access_code_max_lifespan_minutes' => 1440,
                'access_code_single_use' => true,
                'require_vehicle_information' => false,
                'allow_residents_to_extend_visitor_passes' => true,
                'visitor_checkout_enabled' => true,
                'incident_categories' => [
                    'Theft',
                    'Noise Complaint',
                    'Vandalism',
                    'Unauthorized Entry',
                    'Property Damage',
                    'Medical Emergency',
                ],
                'default_incident_severity' => 'Low',
                'require_photo_evidence_for_incidents' => false,
                'require_resolution_notes_for_incidents' => false,
                'allow_residents_to_report_incidents' => true,
                'notify_admins_immediately_for_critical_incidents' => true,
                'allow_partial_payments' => true,
                'minimum_partial_payment_amount' => 100000,
                'minimum_partial_payment_percentage' => 10,
                'collection_reminder_frequency' => 'weekly',
                'collection_maximum_reminder_attempts' => 3,
                'send_reminder_before_due_date_days' => 1,
            ], $data['settings'] ?? []);

            $estate->settings()->create($settingsData);

            // 7. Initialize trial period based on settings
            $this->initializeTrialService->initializeForEstate($estate);

            // 8. Apply partner attribution when estate has a partner
            if (! empty($data['has_partner']) && ! empty($data['partner_id'])) {
                $partner = Partner::findOrFail($data['partner_id']);
                $commissionPlan = CommissionPlan::cloneFromPartner($partner);
                $startsAt = isset($data['commission_starts_at'])
                    ? CarbonImmutable::parse($data['commission_starts_at'])
                    : now()->startOfDay();
                // Prefer explicit Zeus override; otherwise leave open - tenure is per-resident post-trial.
                $endsAt = isset($data['commission_ends_at'])
                    ? CarbonImmutable::parse($data['commission_ends_at'])
                    : null;

                $estate->update([
                    'partner_id' => $partner->id,
                    'partner_source' => $data['partner_source'] ?? 'zeus_manual',
                    'commission_plan_id' => $commissionPlan->id,
                    'commission_starts_at' => $startsAt,
                    'commission_ends_at' => $endsAt,
                    'partner_date' => now()->toDateString(),
                    'partner_status' => PartnerStatus::EstateCreated,
                    'commission_status' => CommissionStatus::Active,
                    'partner_notes' => $data['partner_notes'] ?? null,
                ]);
            }

            // 9. Dispatch event for side effects (invitation email)
            event(new EstateCreated($estate, $user));

            Cache::forget("estate_features:{$estate->id}");
            $estate->clearMemoizedFeatures();

            return $estate;
        });
    }
}
