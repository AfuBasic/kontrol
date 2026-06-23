<?php

use App\Actions\Security\RecordCheckInAction;
use App\Actions\Security\ValidateAccessCodeAction;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;

beforeEach(function () {
    $this->estate = Estate::factory()->create();
    $this->user = User::factory()->create();
    $this->user->estates()->attach($this->estate, ['status' => 'accepted']);

    EstateSettings::updateOrCreate(
        ['estate_id' => $this->estate->id],
        ['access_code_grace_period_minutes' => 0]
    );

    $this->validateAction = app(ValidateAccessCodeAction::class);
    $this->recordAction = app(RecordCheckInAction::class);
});

it('denies access if scheduled for the future', function () {
    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->user->id,
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addHour(),
        'code' => 'FUTURE',
    ]);

    $result = $this->validateAction->execute('FUTURE', $this->estate->id);

    expect($result['valid'])->toBeFalse()
        ->and($result['status'])->toBe('scheduled')
        ->and($result['message'])->toBe('Pass is scheduled for a future date/time');
});

it('grants access when starts_at has passed and is active', function () {
    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->user->id,
        'status' => AccessCodeStatus::Active,
        'starts_at' => now()->subHour(),
        'expires_at' => now()->addHour(),
        'code' => 'ACTIVE',
    ]);

    $result = $this->validateAction->execute('ACTIVE', $this->estate->id);

    expect($result['valid'])->toBeTrue()
        ->and($result['status'])->toBe('granted');
});

it('denies access if guest limit is reached for event passes', function () {
    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->user->id,
        'type' => 'event',
        'guest_limit' => 2,
        'status' => AccessCodeStatus::Active,
        'code' => 'EVENT',
    ]);

    // Check in 1st guest
    $this->recordAction->execute('EVENT', $this->estate->id, $this->user, []);

    // Check in 2nd guest
    $this->recordAction->execute('EVENT', $this->estate->id, $this->user, []);

    // 3rd guest validation should fail
    $result = $this->validateAction->execute('EVENT', $this->estate->id);

    expect($result['valid'])->toBeFalse()
        ->and($result['status'])->toBe('limit_reached')
        ->and($result['message'])->toBe('Event pass guest limit reached');

    // Code status should be Used now
    expect($code->fresh()->status)->toBe(AccessCodeStatus::Used);
});

it('allows multiple check-ins for event passes until limit is met', function () {
    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->user->id,
        'type' => 'event',
        'guest_limit' => 2,
        'status' => AccessCodeStatus::Active,
        'code' => 'EVENT_MULTI',
    ]);

    // 1st check-in
    $log1 = $this->recordAction->execute('EVENT_MULTI', $this->estate->id, $this->user, []);
    expect($log1)->not->toBeNull()
        ->and($code->fresh()->status)->toBe(AccessCodeStatus::Active);

    // 2nd check-in
    $log2 = $this->recordAction->execute('EVENT_MULTI', $this->estate->id, $this->user, []);
    expect($log2)->not->toBeNull()
        ->and($code->fresh()->status)->toBe(AccessCodeStatus::Used);
});

it('denies access if recurring schedule does not match current time', function () {
    // Schedule for weekends only
    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->user->id,
        'type' => 'long_lived',
        'status' => AccessCodeStatus::Active,
        'schedule_type' => 'recurring',
        'schedule_data' => [
            'days' => [0, 6], // Sunday, Saturday
            'start_time' => '09:00',
            'end_time' => '17:00',
        ],
        'code' => 'RECURRING',
    ]);

    // Mock time to a Monday
    Carbon\Carbon::setTestNow('2023-10-09 10:00:00'); // Monday

    $result = $this->validateAction->execute('RECURRING', $this->estate->id);

    expect($result['valid'])->toBeFalse()
        ->and($result['status'])->toBe('outside_schedule');

    Carbon\Carbon::setTestNow();
});
