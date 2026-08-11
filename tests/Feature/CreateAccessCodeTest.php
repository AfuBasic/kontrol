<?php

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);
});

test('resident can generate a visitor pass successfully', function () {
    $estate = Estate::factory()->create();

    EstateSettings::updateOrCreate(
        ['estate_id' => $estate->id],
        [
            'access_code_min_lifespan_minutes' => 10,
            'access_code_max_lifespan_minutes' => 1440,
            'charge_type' => 'residents',
        ]
    );

    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    // Ensure the plan has the access-code-generation feature enabled
    $plan = Plan::first();
    $feature = Feature::where('slug', 'access-code-generation')->first();
    $plan->features()->syncWithoutDetaching([
        $feature->id => ['is_enabled' => true],
    ]);

    ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_end' => now()->addMonth(),
    ]);

    $response = $this->actingAs($resident)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.store'), [
            'type' => 'single_use',
            'visitor_name' => 'John Doe',
            'visitor_phone' => '1234567890',
            'purpose' => 'Guest',
            'has_vehicle' => false,
            'duration_minutes' => 60,
        ]);

    $response->assertSessionHasNoErrors();

    $accessCode = AccessCode::first();
    expect($accessCode)->not->toBeNull();
    expect($accessCode->visitor_name)->toBe('John Doe');
    expect($accessCode->status)->toBe(AccessCodeStatus::Active);

    $response->assertRedirect(route('resident.visitors.show', $accessCode));
});
