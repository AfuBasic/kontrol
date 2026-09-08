<?php

use App\Actions\Organization\ConfirmArrivalAction;
use App\Actions\Organization\IssueOrganizationCredentialAction;
use App\Actions\Organization\RenewOrganizationCredentialAction;
use App\Actions\Security\RecordQuickEntryAction;
use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Jobs\RenewExpiringOrganizationCredentials;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Models\OrganizationMembership;
use App\Models\OrganizationPublicWindow;
use App\Models\User;
use App\Services\Organization\AccessMemberService;
use App\Services\Organization\ArrivalService;
use App\Services\OrganizationContextService;
use Carbon\CarbonImmutable;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Session;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'St. Jude Academy',
        'type' => 'school',
        'access_policy' => 'managed',
        'arrival_confirmation_required' => true,
        'confirmation_window_minutes' => 15,
        'confirmation_escalation' => 'alert_only',
        'quick_entry_enabled' => true,
        'is_active' => true,
    ]);

    $this->orgAdmin = User::factory()->create();
    $this->membership = OrganizationMembership::create([
        'user_id' => $this->orgAdmin->id,
        'organization_id' => $this->org->id,
        'role' => 'admin',
        'is_active' => true,
    ]);
});

test('organization context service resolves active organization and membership', function () {
    $service = app(OrganizationContextService::class);

    $this->actingAs($this->orgAdmin);
    Session::put(OrganizationContextService::SESSION_KEY, $this->org->id);

    $resolvedOrg = $service->getOrganization();
    $resolvedMembership = $service->getMembership();

    expect($resolvedOrg->id)->toBe($this->org->id)
        ->and($resolvedMembership->id)->toBe($this->membership->id)
        ->and($resolvedMembership->isAdmin())->toBeTrue()
        ->and($service->hasAccessTo($this->org->id, $this->orgAdmin))->toBeTrue();
});

test('organization context service falls back to first active membership if session key not set', function () {
    $service = app(OrganizationContextService::class);

    $this->actingAs($this->orgAdmin);
    Session::forget(OrganizationContextService::SESSION_KEY);

    $resolvedOrg = $service->getOrganization();
    expect($resolvedOrg->id)->toBe($this->org->id)
        ->and(Session::get(OrganizationContextService::SESSION_KEY))->toBe($this->org->id);
});

test('access member service can create member and automatically issue credentials', function () {
    $service = app(AccessMemberService::class);

    $member = $service->createMember(
        organization: $this->org,
        createdBy: $this->orgAdmin,
        data: [
            'name' => 'John Doe',
            'identifier' => 'STU-001',
            'category' => 'student',
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addYear()->toDateString(),
        ],
        issueCredential: true
    );

    expect($member->id)->toBeGreaterThan(0)
        ->and($member->status)->toBe('active')
        ->and($member->isValidNow())->toBeTrue()
        ->and($member->activeAccessCode)->not->toBeNull()
        ->and($member->activeAccessCode->type)->toBe('organization')
        ->and($member->activeAccessCode->status)->toBe(AccessCodeStatus::Active)
        ->and($member->activeAccessCode->organization_id)->toBe($this->org->id);
});

test('issuing a new credential supersedes the previous active credential', function () {
    $service = app(AccessMemberService::class);
    $issueAction = app(IssueOrganizationCredentialAction::class);

    $member = $service->createMember(
        organization: $this->org,
        createdBy: $this->orgAdmin,
        data: ['name' => 'Jane Smith', 'category' => 'staff'],
        issueCredential: true
    );

    $firstCode = $member->activeAccessCode;

    $secondCode = $issueAction->execute(
        member: $member,
        issuedBy: $this->orgAdmin
    );

    $firstCode->refresh();
    $member->unsetRelation('activeAccessCode');

    expect($firstCode->status)->toBe(AccessCodeStatus::Superseded)
        ->and($firstCode->revoked_at)->not->toBeNull()
        ->and($secondCode->status)->toBe(AccessCodeStatus::Active)
        ->and($member->activeAccessCode->id)->toBe($secondCode->id);
});

test('renew credential action successfully supersedes old credential and issues new one', function () {
    $service = app(AccessMemberService::class);
    $renewAction = app(RenewOrganizationCredentialAction::class);

    $member = $service->createMember(
        organization: $this->org,
        createdBy: $this->orgAdmin,
        data: ['name' => 'Alice Staff', 'category' => 'staff'],
        issueCredential: true
    );

    $oldCode = $member->activeAccessCode;

    $renewedCode = $renewAction->execute(
        credential: $oldCode,
        renewedBy: $this->orgAdmin,
        reason: 'Staff annual renewal'
    );

    $oldCode->refresh();

    expect($oldCode->status)->toBe(AccessCodeStatus::Superseded)
        ->and($renewedCode->status)->toBe(AccessCodeStatus::Active)
        ->and($renewedCode->organization_member_id)->toBe($member->id);
});

test('suspending a member revokes their active credentials', function () {
    $service = app(AccessMemberService::class);

    $member = $service->createMember(
        organization: $this->org,
        createdBy: $this->orgAdmin,
        data: ['name' => 'Suspended Student', 'category' => 'student'],
        issueCredential: true
    );

    $credential = $member->activeAccessCode;

    $service->suspendMember($member);

    $member->refresh();
    $credential->refresh();

    expect($member->status)->toBe('suspended')
        ->and($member->isValidNow())->toBeFalse()
        ->and($credential->status)->toBe(AccessCodeStatus::Revoked);
});

test('public window correctly evaluates isOpenAt', function () {
    $sunday = CarbonImmutable::parse('2026-09-06 10:00:00'); // Day 0 = Sunday
    $monday = CarbonImmutable::parse('2026-09-07 10:00:00'); // Day 1 = Monday

    $window = OrganizationPublicWindow::create([
        'organization_id' => $this->org->id,
        'name' => 'Sunday Service',
        'day_of_week' => 0,
        'start_time' => '08:00:00',
        'end_time' => '13:00:00',
        'is_active' => true,
    ]);

    expect($window->isOpenAt($sunday))->toBeTrue()
        ->and($window->isOpenAt($monday))->toBeFalse()
        ->and($window->isOpenAt(CarbonImmutable::parse('2026-09-06 15:00:00')))->toBeFalse();
});

test('organization isWithinPublicWindow evaluates all active windows', function () {
    $this->org->update(['access_policy' => 'public_window']);

    OrganizationPublicWindow::create([
        'organization_id' => $this->org->id,
        'name' => 'Sunday Service',
        'day_of_week' => 0,
        'start_time' => '08:00:00',
        'end_time' => '12:00:00',
        'is_active' => true,
    ]);

    $sundayMorning = CarbonImmutable::parse('2026-09-06 09:30:00');
    $sundayEvening = CarbonImmutable::parse('2026-09-06 18:00:00');

    expect($this->org->isWithinPublicWindow($sundayMorning))->toBeTrue()
        ->and($this->org->isWithinPublicWindow($sundayEvening))->toBeFalse();
});

test('record quick entry records organization_id and admission_basis', function () {
    $guard = User::factory()->create();
    $action = app(RecordQuickEntryAction::class);

    $log = $action->execute(
        estateId: $this->estate->id,
        verifiedBy: $guard,
        data: [
            'tag' => 'TAG1',
            'organization_id' => $this->org->id,
            'visitor_name' => 'Delivery Driver',
        ]
    );

    expect($log->organization_id)->toBe($this->org->id)
        ->and($log->meta['admission_basis'])->toBe('quick_entry')
        ->and($log->confirmed_at)->toBeNull()
        ->and($log->confirmationState(15))->toBe('PENDING');
});

test('confirm arrival action marks log as confirmed and is idempotent', function () {
    $guard = User::factory()->create();
    $quickEntry = app(RecordQuickEntryAction::class);
    $confirmAction = app(ConfirmArrivalAction::class);

    $log = $quickEntry->execute(
        estateId: $this->estate->id,
        verifiedBy: $guard,
        data: [
            'tag' => 'TAG2',
            'organization_id' => $this->org->id,
            'visitor_name' => 'Parent Visitor',
        ]
    );

    expect($log->confirmationState(15))->toBe('PENDING');

    $confirmedLog = $confirmAction->execute($log, $this->orgAdmin);

    expect($confirmedLog->confirmed_at)->not->toBeNull()
        ->and($confirmedLog->confirmed_by)->toBe($this->orgAdmin->id)
        ->and($confirmedLog->confirmationState(15))->toBe('CONFIRMED');

    // Calling again returns cleanly (idempotent)
    $confirmedAgain = $confirmAction->execute($confirmedLog, $this->orgAdmin);
    expect($confirmedAgain->confirmed_at)->toEqual($confirmedLog->confirmed_at);
});

test('confirmation state returns OVERDUE when time exceeds confirmation window', function () {
    $guard = User::factory()->create();
    $quickEntry = app(RecordQuickEntryAction::class);

    $verifiedAt = CarbonImmutable::now()->subMinutes(30);

    $log = $quickEntry->execute(
        estateId: $this->estate->id,
        verifiedBy: $guard,
        data: [
            'tag' => 'TAG3',
            'organization_id' => $this->org->id,
            'visitor_name' => 'Late Visitor',
            'verified_at' => $verifiedAt,
        ]
    );

    expect($log->confirmationState(15))->toBe('OVERDUE');
});

test('arrival service metrics aggregate active entries and confirmation states', function () {
    $guard = User::factory()->create();
    $quickEntry = app(RecordQuickEntryAction::class);
    $arrivalService = app(ArrivalService::class);

    // Entry 1: Recent, pending
    $quickEntry->execute(
        estateId: $this->estate->id,
        verifiedBy: $guard,
        data: ['tag' => 'T001', 'organization_id' => $this->org->id, 'visitor_name' => 'Guest 1']
    );

    // Entry 2: Old, overdue
    $quickEntry->execute(
        estateId: $this->estate->id,
        verifiedBy: $guard,
        data: [
            'tag' => 'T002',
            'organization_id' => $this->org->id,
            'visitor_name' => 'Guest 2',
            'verified_at' => now()->subMinutes(40),
        ]
    );

    $metrics = $arrivalService->getMetrics($this->org);

    expect($metrics['currently_inside'])->toBe(2)
        ->and($metrics['pending_confirmation'])->toBe(1)
        ->and($metrics['overdue_confirmation'])->toBe(1)
        ->and($metrics['confirmed'])->toBe(0);
});

test('renew expiring credentials job auto-renews credentials expiring within 7 days', function () {
    $member = OrganizationAccessMember::factory()->create([
        'organization_id' => $this->org->id,
        'status' => 'active',
        'valid_until' => now()->addYear(),
        'created_by' => $this->orgAdmin->id,
    ]);

    $expiringCredential = AccessCode::create([
        'estate_id' => $this->estate->id,
        'organization_id' => $this->org->id,
        'organization_member_id' => $member->id,
        'user_id' => $this->orgAdmin->id,
        'code' => 'EXP123',
        'type' => 'organization',
        'source' => AccessCodeSource::Web,
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addDays(3),
    ]);

    $job = new RenewExpiringOrganizationCredentials;
    $job->handle(app(RenewOrganizationCredentialAction::class));

    $expiringCredential->refresh();

    expect($expiringCredential->status)->toBe(AccessCodeStatus::Superseded);

    $newCredential = AccessCode::where('organization_member_id', $member->id)
        ->where('status', AccessCodeStatus::Active)
        ->first();

    expect($newCredential)->not->toBeNull()
        ->and($newCredential->id)->not->toBe($expiringCredential->id)
        ->and($newCredential->expires_at->isAfter(now()->addMonths(5)))->toBeTrue();
});

test('organization portal routes render successfully for authorized organization admin', function () {
    $this->actingAs($this->orgAdmin);
    Session::put(OrganizationContextService::SESSION_KEY, $this->org->id);

    $this->get(route('org.dashboard'))->assertOk();
    $this->get(route('org.access-list.index'))->assertOk();
    $this->get(route('org.credentials.index'))->assertOk();
    $this->get(route('org.arrivals.index'))->assertOk();
    $this->get(route('org.public-windows.index'))->assertOk();
    $this->get(route('org.settings.index'))->assertOk();
});

test('organization admin can confirm arrival via portal HTTP endpoint', function () {
    $guard = User::factory()->create();
    $quickEntry = app(RecordQuickEntryAction::class);

    $log = $quickEntry->execute(
        estateId: $this->estate->id,
        verifiedBy: $guard,
        data: [
            'tag' => 'TAG-HTTP-1',
            'organization_id' => $this->org->id,
            'visitor_name' => 'Endpoint Visitor',
        ]
    );

    $this->actingAs($this->orgAdmin);
    Session::put(OrganizationContextService::SESSION_KEY, $this->org->id);

    $response = $this->post(route('org.arrivals.confirm', $log));
    $response->assertRedirect()
        ->assertSessionHas('success');

    $log->refresh();
    expect($log->confirmed_at)->not->toBeNull()
        ->and($log->confirmed_by)->toBe($this->orgAdmin->id)
        ->and($log->confirmationState(15))->toBe('CONFIRMED');
});
