<?php

use App\Actions\Invitation\AcceptInvitationAction;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

test('it redirects to setup after admin accepts invitation', function () {
    $estate = Estate::factory()->create(['status' => 'pending']);
    $role = Role::firstOrCreate(['name' => 'admin']);

    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $invitation = Invitation::create([
        'estate_id' => $estate->id,
        'email' => $user->email,
        'role_id' => $role->id,
        'status' => 'pending',
        'token' => Str::random(32),
        'expires_at' => now()->addDays(7),
        'scope_type' => 'estate',
    ]);

    $this->actingAs($user)
        ->post(route('invitation.store', ['token' => $invitation->token]))
        ->assertRedirect(route('admin.setup'));

    $invitation->refresh();
    expect($invitation->status)->toBe('accepted');

    $estate->refresh();
    expect($estate->status)->toBe('active')
        ->and($estate->activation_date)->not->toBeNull();
});
