<?php

use App\Enums\AssignmentScope;
use App\Models\Activity;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\ImpersonationSession;
use App\Models\User;
use App\Presenters\ActivityPresenter;
use App\Services\Zeus\ImpersonationService;
use Spatie\Permission\Models\Role;

test('performing actions in support mode attributes activity to Kontrol Support while assisting admin', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create(['name' => 'Paradise Gardens']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create(['name' => 'Emmanuel Acho', 'email' => 'emmanuel@example.com']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $impersonationSession = ImpersonationSession::create([
        'provider_identifier' => 'zeus',
        'effective_user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'session_id' => 'test-support-session',
        'started_at' => now(),
    ]);

    // Activate Support Mode session in test environment
    session([
        $sessionKey => true,
        ImpersonationService::SESSION_ID_KEY => $impersonationSession->id,
        ImpersonationService::ESTATE_ID_KEY => $estate->id,
        ImpersonationService::USER_ID_KEY => $adminUser->id,
        'active_context_assignment_id' => $assignment->id,
    ]);

    // Perform an activity creation (simulating an estate operation)
    activity('announcements')
        ->causedBy($adminUser)
        ->performedOn($estate)
        ->log('created board post: Annual General Meeting');

    $activity = Activity::query()->latest('id')->first();
    expect($activity)->not->toBeNull();

    // 1. Internal audit database verification
    expect($activity->properties['impersonation'] ?? false)->toBeTrue();
    expect($activity->properties['impersonation_session_id'] ?? null)->toBe($impersonationSession->id);
    expect($activity->properties['provider_identifier'] ?? null)->toBe('zeus');
    expect($activity->properties['effective_user_id'] ?? null)->toBe($adminUser->id);
    expect($activity->properties['effective_actor_name'] ?? null)->toBe('Emmanuel Acho');

    // 2. Customer-facing presentation verification
    $presented = ActivityPresenter::present($activity);
    expect($presented['actor']['name'])->toBe('Kontrol Support');
    expect($presented['actor']['initials'])->toBe('KS');
    expect($presented['headline'])->toBe('Kontrol Support published an announcement while assisting Emmanuel Acho');
});

test('normal estate admin actions maintain normal attribution without support metadata', function () {
    $estate = Estate::factory()->create(['name' => 'Paradise Gardens']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create(['name' => 'Emmanuel Acho', 'email' => 'emmanuel@example.com']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    // Ensure session is cleared for normal test
    session()->flush();

    // Create an activity normally (NOT in support mode)
    activity('announcements')
        ->causedBy($adminUser)
        ->performedOn($estate)
        ->log('created board post: Maintenance Schedule');

    $activity = Activity::query()->latest('id')->first();
    expect($activity)->not->toBeNull();

    // 1. Internal audit: no impersonation metadata
    expect($activity->properties['impersonation'] ?? false)->toBeFalse();

    // 2. Customer-facing presentation: shows Admin's own name without "while assisting"
    $presented = ActivityPresenter::present($activity);
    expect($presented['actor']['name'])->toBe('Emmanuel Acho');
    expect($presented['headline'])->toBe('Emmanuel Acho published an announcement');
    expect($presented['headline'])->not->toContain('Kontrol Support');
    expect($presented['headline'])->not->toContain('while assisting');
});

test('multiple domain actions preserve support attribution across different modules', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create(['name' => 'Paradise Gardens']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $adminUser = User::factory()->create(['name' => 'Emmanuel Acho', 'email' => 'emmanuel@example.com']);
    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $adminUser->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $impersonationSession = ImpersonationSession::create([
        'provider_identifier' => 'zeus',
        'effective_user_id' => $adminUser->id,
        'estate_id' => $estate->id,
        'session_id' => 'test-multi-module',
        'started_at' => now(),
    ]);

    session([
        $sessionKey => true,
        ImpersonationService::SESSION_ID_KEY => $impersonationSession->id,
        ImpersonationService::ESTATE_ID_KEY => $estate->id,
        ImpersonationService::USER_ID_KEY => $adminUser->id,
        'active_context_assignment_id' => $assignment->id,
    ]);

    // 1. Estate Settings
    activity('system')
        ->causedBy($adminUser)
        ->performedOn($estate)
        ->log('updated estate settings');
    $activity1 = Activity::query()->latest('id')->first();
    $presented1 = ActivityPresenter::present($activity1);
    expect($presented1['headline'])->toBe('Kontrol Support updated estate settings while assisting Emmanuel Acho');

    // 2. Incident Update
    activity('incidents')
        ->causedBy($adminUser)
        ->performedOn($estate)
        ->log('updated incident status to: resolved');
    $activity2 = Activity::query()->latest('id')->first();
    $presented2 = ActivityPresenter::present($activity2);
    expect($presented2['headline'])->toBe('Kontrol Support updated incident status to resolved while assisting Emmanuel Acho');

    // 3. Visitor Checkout
    activity('access')
        ->causedBy($adminUser)
        ->performedOn($estate)
        ->withProperties(['visitor_name' => 'John Doe'])
        ->log('Visitor checked out');
    $activity3 = Activity::query()->latest('id')->first();
    $presented3 = ActivityPresenter::present($activity3);
    expect($presented3['headline'])->toBe('Kontrol Support recorded checkout for John Doe while assisting Emmanuel Acho');
});
