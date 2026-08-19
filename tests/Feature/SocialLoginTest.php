<?php

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Role;

test('google login with non-existent user redirects back with clear error feedback', function () {
    $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
    $abstractUser->shouldReceive('getEmail')->andReturn('nonexistent.user@example.com');
    $abstractUser->shouldReceive('getId')->andReturn('google-123456');

    Socialite::shouldReceive('driver->user')->andReturn($abstractUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/login');
    $response->assertSessionHas('error', 'No account found for nonexistent.user@example.com. Google sign up is not permitted. Please contact your estate administrator to get onboarded.');
});

test('google login with existing user triggers authentication or trusted device flow', function () {
    $estate = Estate::factory()->create();
    setPermissionsTeamId($estate->id);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'email' => 'resident.existing@example.com',
        'email_verified_at' => now(),
    ]);
    $user->estates()->attach($estate->id, ['status' => 'accepted']);
    $user->assignRole('resident');

    AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => Role::where('name', 'resident')->first()->id,
        'scope_type' => 'estate',
        'is_active' => true,
    ]);

    $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
    $abstractUser->shouldReceive('getEmail')->andReturn('resident.existing@example.com');
    $abstractUser->shouldReceive('getId')->andReturn('google-987654');

    Socialite::shouldReceive('driver->user')->andReturn($abstractUser);

    $response = $this->get('/auth/google/callback');

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('resident.dashboard'));
});
