<?php

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('security guard can sync active code hashes from server', function () {
    // 1. Setup role and estate
    Role::create(['name' => 'security']);
    $estate = Estate::factory()->create();
    $guard = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($estate->id, ['status' => 'accepted']);

    // 2. Create active access codes
    $resident = User::factory()->create();
    $code1 = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'code' => 'XYZ123',
        'type' => 'single_use',
        'source' => AccessCodeSource::Web,
        'visitor_name' => 'John Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
        'has_vehicle' => false,
    ]);

    // 3. Act
    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->get(route('security.verify.sync'));

    // 4. Assert JSON output containing hash
    $response->assertOk();
    $response->assertJsonPath('success', true);
    $response->assertJsonFragment([
        'hash' => hash('sha256', 'XYZ123'),
        'visitor_name' => 'John Guest',
    ]);
});

test('security guard can sync offline check-in logs back to server', function () {
    // 1. Setup role and estate
    Role::create(['name' => 'security']);
    $estate = Estate::factory()->create();
    $guard = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($estate->id, ['status' => 'accepted']);

    // 2. Create active code on server
    $resident = User::factory()->create();
    $code = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'code' => 'ABC987',
        'type' => 'single_use',
        'source' => AccessCodeSource::Web,
        'visitor_name' => 'Valid Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
        'has_vehicle' => false,
    ]);

    // 3. Sync logs (one valid, one override)
    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->postJson(route('security.verify.sync-logs'), [
            'logs' => [
                [
                    'code' => 'ABC987',
                    'decision' => 'admit',
                    'vehicle_make' => 'Toyota',
                    'vehicle_model' => 'Camry',
                    'vehicle_plate_number' => 'LAG123',
                    'created_at' => now()->subMinutes(10)->toIso8601String(),
                ],
                [
                    'code' => 'UNKNOWN123',
                    'decision' => 'admit',
                    'vehicle_make' => null,
                    'vehicle_model' => null,
                    'vehicle_plate_number' => null,
                    'created_at' => now()->subMinutes(5)->toIso8601String(),
                ],
            ],
        ]);

    // 4. Assert Response
    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'synced_count' => 2,
    ]);

    // 5. Assert Database check-in recorded for valid code
    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $estate->id,
        'access_code_id' => $code->id,
        'vehicle_make' => 'Toyota',
        'vehicle_plate_number' => 'LAG123',
    ]);

    // 6. Assert Manual Override Audit log recorded for unknown code
    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $estate->id,
        'access_code_id' => null,
    ]);

    // Verify metadata contains override audit flag
    $log = AccessLog::whereNull('access_code_id')->first();
    expect($log->meta['offline_override'])->toBeTrue();
    expect($log->meta['offline_code'])->toBe('UNKNOWN123');
});

test('security sync data returns standardized success shape', function () {
    Role::create(['name' => 'security']);
    $estate = Estate::factory()->create();
    $guard = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->getJson(route('security.verify.sync'));

    $response->assertOk();
    $response->assertJsonStructure([
        'success',
        'synced_count',
        'codes',
        'timestamp',
    ]);
    $response->assertJsonPath('success', true);
});

test('security sync logs validates input shape', function () {
    Role::create(['name' => 'security']);
    $estate = Estate::factory()->create();
    $guard = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->postJson(route('security.verify.sync-logs'), [
            'logs' => [
                [
                    'code' => 'ABC123',
                    // missing decision + created_at
                ],
            ],
        ]);

    $response->assertUnprocessable();
});

test('security sync logs records reject decisions without access log', function () {
    Role::create(['name' => 'security']);
    $estate = Estate::factory()->create();
    $guard = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($estate->id, ['status' => 'accepted']);

    $before = AccessLog::query()->count();

    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->postJson(route('security.verify.sync-logs'), [
            'logs' => [
                [
                    'code' => 'REJ001',
                    'decision' => 'reject',
                    'created_at' => now()->subMinute()->toIso8601String(),
                ],
            ],
        ]);

    $response->assertOk();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('synced_count', 1);
    $response->assertJsonPath('failed_count', 0);

    expect(AccessLog::query()->count())->toBe($before);
});
