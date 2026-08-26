<?php

use App\Actions\Security\RecordCheckInAction;
use App\Actions\Security\RecordCheckOutAction;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use App\Services\Visitor\ActiveVisitService;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    setPermissionsTeamId($this->estate->id);

    $this->settings = EstateSettings::forEstate($this->estate->id);
    $this->settings->update([
        'visitor_checkout_enabled' => true,
        'entry_point_checkout_enforced' => false,
        'entry_points' => ['Main Gate', 'North Gate', 'South Gate'],
    ]);

    $this->resident = User::factory()->create();
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->otherResident = User::factory()->create();
    $this->otherResident->assignRole('resident');
    $this->otherResident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->guard = User::factory()->create();
    $this->guard->assignRole('security');
    $this->guard->estates()->attach($this->estate->id, ['status' => 'accepted']);
});

test('active visit service correctly determines active vs inactive visits', function () {
    $service = app(ActiveVisitService::class);

    // 1. Scheduled/Unused pass - NOT active
    $scheduledPass = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'code' => 'SCHED123',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'visitor_name' => 'Scheduled Guest',
    ]);

    expect($service->countResidentActiveVisits($this->estate->id, $this->resident->id))->toBe(0);

    // 2. Checked in pass - IS active
    $pass = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'code' => 'ACTV123',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'visitor_name' => 'John Active Guest',
    ]);

    $log = app(RecordCheckInAction::class)->execute(
        code: $pass->code,
        estateId: $this->estate->id,
        verifiedBy: $this->guard,
        entryPoint: 'Main Gate'
    );

    expect($service->countResidentActiveVisits($this->estate->id, $this->resident->id))->toBe(1);
    expect($service->countEstateActiveVisits($this->estate->id))->toBe(1);

    $activeList = $service->getResidentActiveVisits($this->estate->id, $this->resident->id);
    expect($activeList)->toHaveCount(1);
    expect($activeList->first()['visitor']['name'])->toBe('John Active Guest');

    // 3. Checked out visit - NOT active
    app(RecordCheckOutAction::class)->execute(
        code: $pass->code,
        estateId: $this->estate->id,
        verifiedBy: $this->guard
    );

    expect($service->countResidentActiveVisits($this->estate->id, $this->resident->id))->toBe(0);
    expect($service->countEstateActiveVisits($this->estate->id))->toBe(0);
});

test('resident cannot see other residents active visitors', function () {
    $service = app(ActiveVisitService::class);

    $pass1 = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'code' => 'R1GUEST',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'visitor_name' => 'Resident 1 Guest',
    ]);
    app(RecordCheckInAction::class)->execute(
        code: $pass1->code,
        estateId: $this->estate->id,
        verifiedBy: $this->guard
    );

    $pass2 = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->otherResident->id,
        'code' => 'R2GUEST',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'visitor_name' => 'Resident 2 Guest',
    ]);
    app(RecordCheckInAction::class)->execute(
        code: $pass2->code,
        estateId: $this->estate->id,
        verifiedBy: $this->guard
    );

    // Total estate active = 2
    expect($service->countEstateActiveVisits($this->estate->id))->toBe(2);

    // Resident 1 only sees their 1 visitor
    $r1Visits = $service->getResidentActiveVisits($this->estate->id, $this->resident->id);
    expect($r1Visits)->toHaveCount(1);
    expect($r1Visits->first()['visitor']['name'])->toBe('Resident 1 Guest');

    // Resident 2 only sees their 1 visitor
    $r2Visits = $service->getResidentActiveVisits($this->estate->id, $this->otherResident->id);
    expect($r2Visits)->toHaveCount(1);
    expect($r2Visits->first()['visitor']['name'])->toBe('Resident 2 Guest');
});

test('active visit remains active even if pass expires while visitor is inside', function () {
    $service = app(ActiveVisitService::class);

    $pass = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'code' => 'EXP123',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'visitor_name' => 'Expired While Inside Guest',
        'expires_at' => Carbon::now()->subMinutes(30), // Expired while inside
    ]);

    $log = AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $pass->id,
        'verified_by' => $this->guard->id,
        'verified_at' => Carbon::now()->subHours(2),
        'checked_out_at' => null,
        'entry_point' => 'Main Gate',
    ]);

    $activeList = $service->getResidentActiveVisits($this->estate->id, $this->resident->id);
    expect($activeList)->toHaveCount(1);
    expect($activeList->first()['is_overstayed'])->toBeTrue();
});

test('feature gating: checkout disabled returns empty and 0 count across all roles', function () {
    $this->settings->update(['visitor_checkout_enabled' => false]);
    $service = app(ActiveVisitService::class);

    $pass = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'code' => 'DIS123',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $pass->id,
        'verified_by' => $this->guard->id,
        'verified_at' => Carbon::now()->subHour(),
        'checked_out_at' => null,
    ]);

    expect($service->isCheckoutMonitoringEnabled($this->estate->id))->toBeFalse();
    expect($service->countResidentActiveVisits($this->estate->id, $this->resident->id))->toBe(0);
    expect($service->getResidentActiveVisits($this->estate->id, $this->resident->id))->toHaveCount(0);
    expect($service->countEstateActiveVisits($this->estate->id))->toBe(0);
    expect($service->getSecurityActiveVisits($this->estate->id, $this->guard))->toHaveCount(0);
});

test('security checkout respects entry point checkout constraint when enforced', function () {
    $this->settings->update([
        'visitor_checkout_enabled' => true,
        'entry_point_checkout_enforced' => true,
    ]);

    $pass = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->resident->id,
        'code' => 'GATE123',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
    ]);

    // Check in at North Gate
    app(RecordCheckInAction::class)->execute(
        code: $pass->code,
        estateId: $this->estate->id,
        verifiedBy: $this->guard,
        entryPoint: 'North Gate'
    );

    // Guard claims South Gate
    app(CheckpointClaimService::class)->claim($this->estate->id, $this->guard, 'South Gate');

    // Attempting checkout from South Gate must throw ValidationException
    expect(function () use ($pass) {
        app(RecordCheckOutAction::class)->execute(
            code: $pass->code,
            estateId: $this->estate->id,
            verifiedBy: $this->guard
        );
    })->toThrow(ValidationException::class);

    // Switch guard to North Gate -> checkout succeeds
    app(CheckpointClaimService::class)->claim($this->estate->id, $this->guard, 'North Gate');

    $checkoutLog = app(RecordCheckOutAction::class)->execute(
        code: $pass->code,
        estateId: $this->estate->id,
        verifiedBy: $this->guard
    );

    expect($checkoutLog->checked_out_at)->not->toBeNull();
});
