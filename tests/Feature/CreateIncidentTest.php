<?php

use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup roles
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'household_member', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
});

test('resident can view incidents feed and create a new incident', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.store'), [
            'title' => 'Broken street light',
            'body' => 'The street light on Road 2 has been broken for 3 days now.',
            'category' => 'lighting',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('incidents', [
        'title' => 'Broken street light',
        'category' => 'lighting',
        'estate_id' => $estate->id,
        'reporter_id' => $user->id,
        'status' => 'pending',
    ]);
});

test('property owner can report an incident', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('property_owner');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.store'), [
            'title' => 'Water pipe burst',
            'body' => 'Main water pipe burst near property 25 and is flooding the road.',
            'category' => 'water_plumbing',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('incidents', [
        'title' => 'Water pipe burst',
        'category' => 'water_plumbing',
        'reporter_id' => $user->id,
    ]);
});

test('household member cannot report an incident', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('household_member');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.store'), [
            'title' => 'Noise disturbance',
            'body' => 'Loud party next door carrying on past 1 AM on a weekday.',
            'category' => 'noise_disturbance',
        ]);

    $response->assertStatus(403);
});

test('admin cannot report an incident via resident route', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('admin');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.store'), [
            'title' => 'Pothole on Main Gate road',
            'body' => 'Very deep pothole developed right after the security gate.',
            'category' => 'road_infrastructure',
        ]);

    $response->assertRedirect();
});
