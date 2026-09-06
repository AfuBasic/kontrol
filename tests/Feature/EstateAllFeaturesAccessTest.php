<?php

use App\Enums\AssignmentScope;
use App\Http\Middleware\CheckEstateFeature;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Feature;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    Cache::flush();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->seed(FeatureSeeder::class);
});

test('all estates have access to all active platform features without any subscription plan', function () {
    $estate = Estate::factory()->create();

    expect($estate->subscriptionRecord)->toBeNull();

    $activeFeatures = Feature::where('is_active', true)->pluck('slug')->toArray();
    expect($activeFeatures)->not->toBeEmpty();

    expect($estate->getActiveFeatureSlugs())->toEqualCanonicalizing($activeFeatures);

    expect($estate->hasFeature('resident-directory'))->toBeTrue()
        ->and($estate->hasFeature('payment-collection'))->toBeTrue()
        ->and($estate->hasFeature('estate-board'))->toBeTrue()
        ->and($estate->hasFeature('security-personnel-management'))->toBeTrue()
        ->and($estate->hasFeature('user-access-control'))->toBeTrue()
        ->and($estate->hasFeature('activity-logs'))->toBeTrue();
});

test('check estate feature middleware allows admin access across features without subscription plan', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
    AdministrativeAssignment::create([
        'user_id' => $admin->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    setPermissionsTeamId($estate->id);
    $this->actingAs($admin);

    $middleware = new CheckEstateFeature;
    $request = Request::create('/admin/residents', 'GET');
    $request->setUserResolver(fn () => $admin);

    $response = $middleware->handle($request, function ($req) {
        return new Response('ok', 200);
    }, 'resident-directory');

    expect($response->getStatusCode())->toBe(200);
});
