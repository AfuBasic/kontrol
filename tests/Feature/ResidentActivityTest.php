<?php

use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('resident activity feed returns cursor paginated activities and supports searching', function () {
    // 1. Setup role and users
    Role::create(['name' => 'resident']);
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    // Seed features and plans
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    // Create estate subscription
    $plan = Plan::first();
    EstateSubscription::create([
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    // Log the user in to populate Auth context
    $this->actingAs($user);

    // 2. Create access codes
    $code1 = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => '123456',
        'type' => 'single_use',
        'visitor_name' => 'Alice Green',
        'purpose' => 'Meeting',
        'status' => 'active',
        'expires_at' => now()->addHour(),
    ]);

    $code2 = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => '987654',
        'type' => 'single_use',
        'visitor_name' => 'Bob Smith',
        'purpose' => 'Delivery',
        'status' => 'active',
        'expires_at' => now()->addHour(),
    ]);

    // Log a user login activity that should be excluded
    activity()
        ->performedOn($user)
        ->causedBy($user)
        ->log('logged in');

    // 3. Test default paginated activities listing
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.activity'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Activity')
        ->has('activities.data', 2)
        ->where('activities.data.0.code', fn ($val) => in_array($val, ['123456', '987654']))
        ->where('activities.data.1.code', fn ($val) => in_array($val, ['123456', '987654']))
    );

    // 5. Test searching visitor name
    $responseSearch = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.activity', ['search' => 'Alice']));

    $responseSearch->assertOk();
    $responseSearch->assertInertia(fn ($page) => $page
        ->component('Resident/Activity')
        ->has('activities.data', 1)
        ->where('activities.data.0.code', '123456')
        ->where('filters.search', 'Alice')
    );

    // 6. Test searching code
    $responseSearchCode = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.activity', ['search' => '987654']));

    $responseSearchCode->assertOk();
    $responseSearchCode->assertInertia(fn ($page) => $page
        ->component('Resident/Activity')
        ->has('activities.data', 1)
        ->where('activities.data.0.code', '987654')
        ->where('filters.search', '987654')
    );
});
