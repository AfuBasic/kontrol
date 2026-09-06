<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\ImpersonationSession;
use App\Models\User;
use App\Services\Zeus\ImpersonationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('guests cannot submit feedback', function () {
    $response = $this->postJson(route('account.feedback.store'), [
        'category' => 'praise',
        'message' => 'Great product!',
    ]);

    $response->assertUnauthorized();
});

test('authenticated user can submit feedback with valid data', function () {
    $user = User::factory()->create();
    $estate = Estate::factory()->create();

    $response = $this->actingAs($user)
        ->withSession(['active_resident_estate_id' => $estate->id])
        ->postJson(route('account.feedback.store'), [
            'category' => 'improvement',
            'message' => 'The gate pass generation could be 1-step faster.',
            'source' => 'support_page',
            'platform' => 'ios',
            'app_version' => '1.2.0',
            'route_or_screen' => '/account/support',
        ]);

    $response->assertCreated()
        ->assertJson([
            'message' => 'Thank you for your feedback.',
            'feedback' => [
                'category' => 'improvement',
            ],
        ]);

    $this->assertDatabaseHas('feedback', [
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'category' => 'improvement',
        'message' => 'The gate pass generation could be 1-step faster.',
        'status' => 'new',
        'platform' => 'ios',
        'app_version' => '1.2.0',
        'route_or_screen' => '/account/support',
        'role_context' => 'resident',
        'support_mode' => false,
    ]);
});

test('feedback requires valid category and message', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('account.feedback.store'), [
        'category' => 'invalid-category',
        'message' => 'hi', // too short (min 3)
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['category', 'message']);
});

test('feedback preserves support mode flag and impersonation context', function () {
    $sessionKey = config('zeus.session_key');
    $estate = Estate::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();

    EstateMembership::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'status' => 'accepted',
    ]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $zeusAdmin = User::factory()->create();

    $impersonationSession = ImpersonationSession::create([
        'provider_identifier' => 'zeus',
        'effective_user_id' => $user->id,
        'estate_id' => $estate->id,
        'session_id' => 'test-session-id',
        'started_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->withSession([
            $sessionKey => true,
            ImpersonationService::SESSION_ID_KEY => $impersonationSession->id,
            ImpersonationService::ESTATE_ID_KEY => $estate->id,
            ImpersonationService::USER_ID_KEY => $user->id,
            'active_context_assignment_id' => $assignment->id,
            'zeus_admin_id' => $zeusAdmin->id,
            'active_resident_estate_id' => $estate->id,
        ])
        ->postJson(route('account.feedback.store'), [
            'category' => 'problem',
            'message' => 'Testing issue while in support mode.',
        ]);

    $response->assertCreated();

    $this->assertDatabaseHas('feedback', [
        'user_id' => $user->id,
        'support_mode' => true,
        'impersonator_id' => $zeusAdmin->id,
        'category' => 'problem',
    ]);
});
