<?php

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('performs a visitor checkout when settings are enabled', function () {
    $estate = Estate::factory()->create();
    $securityUser = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $securityUser->assignRole('security');
    $securityUser->estates()->attach($estate->id, ['status' => 'accepted']);

    // Enable visitor checkout on settings
    $settings = EstateSettings::forEstate($estate->id);
    $settings->update(['visitor_checkout_enabled' => true]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $accessCode = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'code' => 'TEST1234',
        'type' => 'single_use',
        'visitor_name' => 'John Visitor',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
    ]);

    // 1. Scan/Validate to Check In
    $response1 = $this->actingAs($securityUser)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.validate'), [
            'code' => 'TEST1234',
            'source' => 'scanned',
        ]);

    $response1->assertSuccessful();
    $response1->assertJsonPath('validation_result.valid', true);
    $response1->assertJsonPath('validation_result.action', 'checkin');

    // Assert check-in log created
    $log = AccessLog::where('access_code_id', $accessCode->id)->first();
    expect($log)->not->toBeNull();
    expect($log->checked_out_at)->toBeNull();

    // 2. Scan/Validate again to Check Out
    $response2 = $this->actingAs($securityUser)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.validate'), [
            'code' => 'TEST1234',
            'source' => 'scanned',
        ]);

    $response2->assertSuccessful();
    $response2->assertJsonPath('validation_result.valid', true);
    $response2->assertJsonPath('validation_result.action', 'checkout');
    $response2->assertJsonPath('validation_result.checked_out_at', fn ($val) => ! empty($val));

    // Assert checkout recorded
    $log->refresh();
    expect($log->checked_out_at)->not->toBeNull();
    expect($log->checked_out_by)->toBe($securityUser->id);

    // 3. Scan a third time (Should be denied)
    $response3 = $this->actingAs($securityUser)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.validate'), [
            'code' => 'TEST1234',
            'source' => 'scanned',
        ]);

    $response3->assertSuccessful();
    $response3->assertJsonPath('validation_result.valid', false);
    $response3->assertJsonPath('validation_result.status', 'already_used');
});

it('rejects double scan as already used when checkout is disabled', function () {
    $estate = Estate::factory()->create();
    $securityUser = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $securityUser->assignRole('security');
    $securityUser->estates()->attach($estate->id, ['status' => 'accepted']);

    // Disable visitor checkout
    $settings = EstateSettings::forEstate($estate->id);
    $settings->update(['visitor_checkout_enabled' => false]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $accessCode = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'code' => 'TEST5678',
        'type' => 'single_use',
        'visitor_name' => 'Jane Visitor',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
    ]);

    // 1. Scan/Validate to Check In
    $response1 = $this->actingAs($securityUser)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.validate'), [
            'code' => 'TEST5678',
            'source' => 'scanned',
        ]);

    $response1->assertSuccessful();
    $response1->assertJsonPath('validation_result.valid', true);

    // Assert check-in log created
    $log = AccessLog::where('access_code_id', $accessCode->id)->first();
    expect($log)->not->toBeNull();

    // 2. Scan/Validate again (Should be rejected immediately)
    $response2 = $this->actingAs($securityUser)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.validate'), [
            'code' => 'TEST5678',
            'source' => 'scanned',
        ]);

    $response2->assertSuccessful();
    $response2->assertJsonPath('validation_result.valid', false);
    $response2->assertJsonPath('validation_result.status', 'already_used');
});
