<?php

use App\Actions\Auth\AuthenticateUser;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Validation\ValidationException;

it('tells suspended users their account is suspended, not that it is unactivated', function () {
    $user = User::factory()->create([
        'email' => 'suspended.user@example.com',
        'email_verified_at' => now(),
        'suspended_at' => now(),
    ]);

    // Even without estate membership, suspension must win over "not activated".
    expect(fn () => app(AuthenticateUser::class)->validate($user->email))
        ->toThrow(ValidationException::class);

    try {
        app(AuthenticateUser::class)->validate($user->email);
    } catch (ValidationException $exception) {
        $message = $exception->errors()['email'][0] ?? '';

        expect($message)->toContain('suspended')
            ->and($message)->not->toContain('not yet activated');
    }
});

it('tells suspended users with estate membership that they are suspended', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create([
        'email' => 'suspended.member@example.com',
        'email_verified_at' => now(),
        'suspended_at' => now(),
    ]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);

    try {
        app(AuthenticateUser::class)->validate($user->email);
        $this->fail('Expected ValidationException was not thrown.');
    } catch (ValidationException $exception) {
        expect($exception->errors()['email'][0])->toBe('Your account has been suspended. Please contact support.');
    }
});

it('blocks partner members when partner status is suspended even if suspended_at is null', function () {
    $partner = Partner::factory()->create(['status' => 'suspended']);
    $user = User::factory()->create([
        'email' => 'partner.suspended@example.com',
        'email_verified_at' => now(),
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
        'suspended_at' => null,
    ]);

    try {
        app(AuthenticateUser::class)->validate($user->email);
        $this->fail('Expected ValidationException was not thrown.');
    } catch (ValidationException $exception) {
        $message = $exception->errors()['email'][0] ?? '';

        expect($message)->toContain('suspended')
            ->and($message)->not->toContain('not yet activated');
    }
});

it('allows active partner members without estate membership to pass login validation', function () {
    $partner = Partner::factory()->create(['status' => 'active']);
    $user = User::factory()->create([
        'email' => 'partner.active@example.com',
        'email_verified_at' => now(),
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
        'suspended_at' => null,
    ]);

    $validated = app(AuthenticateUser::class)->validate($user->email);

    expect($validated->is($user))->toBeTrue();
});

it('syncs users.suspended_at when a partner is suspended from zeus', function () {
    $sessionKey = config('zeus.session_key');

    $partner = Partner::factory()->create(['status' => 'active']);
    $member = $partner->members()->first() ?? User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
        'email_verified_at' => now(),
        'suspended_at' => null,
    ]);

    if ($member->partner_id !== $partner->id) {
        $member->update(['partner_id' => $partner->id, 'user_type' => 'affiliate']);
    }

    expect($member->fresh()->suspended_at)->toBeNull();

    $this->withSession([$sessionKey => true])
        ->put(route('zeus.partners.update', $partner), [
            'name' => $partner->name,
            'email' => $member->email,
            'phone' => $member->profile?->phone ?? '+2348012345678',
            'commission_type' => 'percentage',
            'commission_rate' => '10.00',
            'commission_length' => '',
            'status' => 'suspended',
        ])
        ->assertRedirect(route('zeus.partners.index'))
        ->assertSessionHasNoErrors();

    expect($partner->fresh()->status)->toBe('suspended')
        ->and($member->fresh()->suspended_at)->not->toBeNull();

    try {
        app(AuthenticateUser::class)->validate($member->email);
        $this->fail('Expected ValidationException was not thrown.');
    } catch (ValidationException $exception) {
        expect($exception->errors()['email'][0])->toContain('suspended');
    }
});
