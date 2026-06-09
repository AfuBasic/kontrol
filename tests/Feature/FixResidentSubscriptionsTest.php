<?php

use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('it fixes missing resident subscriptions and clears sessions', function () {
    // 1. Setup roles
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    // 2. Create estate using resident billing
    $estate = Estate::factory()->create();
    $plan = Plan::factory()->create();
    EstateSubscription::factory()->create([
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
    ]);
    $estate->settings()->create([
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 7,
    ]);

    // 3. Create resident with missing subscription
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole($residentRole);
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    // Mock active session in DB for this resident
    DB::table('sessions')->insert([
        'id' => 'session_id_123',
        'user_id' => $resident->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Symfony',
        'payload' => 'payload_data',
        'last_activity' => time(),
    ]);

    // 4. Create another resident who has a subscription but with NULL plan_id
    $residentWithNullPlan = User::factory()->create();
    $residentWithNullPlan->assignRole($residentRole);
    $estate->users()->attach($residentWithNullPlan->id, ['status' => 'accepted']);

    $subWithNullPlan = ResidentSubscription::create([
        'user_id' => $residentWithNullPlan->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(7),
        'current_period_start' => now(),
        'current_period_end' => now()->addDays(7),
    ]);

    DB::table('sessions')->insert([
        'id' => 'session_id_456',
        'user_id' => $residentWithNullPlan->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Symfony',
        'payload' => 'payload_data',
        'last_activity' => time(),
    ]);

    // 5. Create a third resident who ALREADY has a complete subscription (with plan_id)
    $residentWithCompleteSub = User::factory()->create();
    $residentWithCompleteSub->assignRole($residentRole);
    $estate->users()->attach($residentWithCompleteSub->id, ['status' => 'accepted']);

    ResidentSubscription::create([
        'user_id' => $residentWithCompleteSub->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(7),
        'current_period_start' => now(),
        'current_period_end' => now()->addDays(7),
    ]);

    DB::table('sessions')->insert([
        'id' => 'session_id_789',
        'user_id' => $residentWithCompleteSub->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Symfony',
        'payload' => 'payload_data',
        'last_activity' => time(),
    ]);

    // Assert initial state
    expect(ResidentSubscription::where('user_id', $resident->id)->exists())->toBeFalse();
    expect(DB::table('sessions')->where('user_id', $resident->id)->exists())->toBeTrue();
    expect(DB::table('sessions')->where('user_id', $residentWithNullPlan->id)->exists())->toBeTrue();
    expect(DB::table('sessions')->where('user_id', $residentWithCompleteSub->id)->exists())->toBeTrue();

    // 6. Run the command
    $this->artisan('kontrol:fix-resident-subscriptions')
        ->assertExitCode(0);

    // 7. Assertions
    // Missing subscription should be created
    expect(ResidentSubscription::where('user_id', $resident->id)->exists())->toBeTrue();
    $sub = ResidentSubscription::where('user_id', $resident->id)->first();
    expect($sub->status)->toBe('trial');
    expect($sub->estate_id)->toBe($estate->id);
    expect($sub->plan_id)->toBe($plan->id);

    // Session for resident with missing sub should be deleted
    expect(DB::table('sessions')->where('user_id', $resident->id)->exists())->toBeFalse();

    // Resident with null plan subscription should have their plan_id populated
    $subWithNullPlan->refresh();
    expect($subWithNullPlan->plan_id)->toBe($plan->id);
    // Session for resident with null plan subscription should be deleted
    expect(DB::table('sessions')->where('user_id', $residentWithNullPlan->id)->exists())->toBeFalse();

    // Resident with complete subscription should not be affected (session remains)
    expect(DB::table('sessions')->where('user_id', $residentWithCompleteSub->id)->exists())->toBeTrue();
});
