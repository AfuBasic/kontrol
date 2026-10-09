<?php

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Models\Zone;
use App\Services\Security\CheckpointClaimService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);

    EstateSettings::forEstate($this->estate->id)->update([
        'access_codes_enabled' => true,
        'zone_locked_passes' => true,
        'entry_points' => ['Gate A', 'Gate B', 'Main Gate', 'Side Door'],
        'entry_point_zones' => ['Gate A' => $this->zoneA->id, 'Gate B' => $this->zoneB->id, 'Main Gate' => 'all'],
    ]);

    $this->member = function (string $role, ?Zone $zone = null): User {
        $user = User::factory()->create();
        setPermissionsTeamId($this->estate->id);
        $user->assignRole($role);
        $user->estates()->attach($this->estate->id, ['status' => 'accepted', 'zone_id' => $zone?->id]);

        return $user;
    };

    $this->passFor = fn (User $resident, string $code = 'ZONE1234'): AccessCode => AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => $code,
        'type' => 'single_use',
        'visitor_name' => 'Zed Visitor',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
    ]);

    // Sign a guard on to a gate exactly as production does: take the lock, and carry the claim in their session.
    $this->signOn = function (User $guard, string $gate): void {
        app(CheckpointClaimService::class)->claim($this->estate->id, $guard, $gate);
    };
    $this->signOff = fn (User $guard) => app(CheckpointClaimService::class)->release($this->estate->id, $guard);

    $this->asGuard = fn (User $guard, ?string $gate) => $this->actingAs($guard)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->withSession($gate ? ['active_checkpoint' => $gate] : []);

    $this->scan = fn (User $guard, ?string $gate, string $code = 'ZONE1234') => ($this->asGuard)($guard, $gate)
        ->postJson(route('security.verify.validate'), ['code' => $code, 'source' => 'scanned']);
});

// ---------- The rule: a pass works at gates that serve its zone ----------

it('admits a pass at a gate that serves the pass zone', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate A');

    ($this->scan)($guard, 'Gate A')->assertJsonPath('validation_result.valid', true);
});

it('refuses a pass at a gate that serves a different zone, without admitting anyone', function () {
    $pass = ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->scan)($guard, 'Gate B')
        ->assertJsonPath('success', false)
        ->assertJsonPath('validation_result.valid', false)
        ->assertJsonPath('validation_result.status', 'wrong_zone');

    expect(AccessLog::where('access_code_id', $pass->id)->count())->toBe(0)
        ->and($pass->fresh()->status)->toBe(AccessCodeStatus::Active);
});

it('does not reveal who the visitor or host is when it refuses', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->scan)($guard, 'Gate B')
        ->assertJsonPath('validation_result.visitor_name', null)
        ->assertJsonPath('validation_result.host_name', null);
});

it('puts the same guard in a different zone when they move to another gate', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');

    // Today: Gate B, a different zone from the pass.
    ($this->signOn)($guard, 'Gate B');
    ($this->scan)($guard, 'Gate B')->assertJsonPath('validation_result.status', 'wrong_zone');

    // Tomorrow: Gate A. Nothing else about the guard changed.
    ($this->signOff)($guard);
    ($this->signOn)($guard, 'Gate A');
    ($this->scan)($guard, 'Gate A')->assertJsonPath('validation_result.valid', true);
});

it('lets a gate set to all zones admit any pass', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA), 'AAAA1111');
    ($this->passFor)(($this->member)('resident', $this->zoneB), 'BBBB2222');
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Main Gate');

    ($this->scan)($guard, 'Main Gate', 'AAAA1111')->assertJsonPath('validation_result.valid', true);
    ($this->scan)($guard, 'Main Gate', 'BBBB2222')->assertJsonPath('validation_result.valid', true);
});

// ---------- Lenient where a zone is unknown ----------

it('does not lock out a guard who is not signed on to a gate', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));

    ($this->scan)(($this->member)('security'), null)->assertJsonPath('validation_result.valid', true);
});

it('does not lock out a gate with no zone chosen', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Side Door');

    ($this->scan)($guard, 'Side Door')->assertJsonPath('validation_result.valid', true);
});

it('stops restricting a gate whose zone was deleted', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');
    $this->zoneB->delete();

    ($this->scan)($guard, 'Gate B')->assertJsonPath('validation_result.valid', true);
});

it('does not lock out a pass from a resident without a zone', function () {
    ($this->passFor)(($this->member)('resident'));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->scan)($guard, 'Gate B')->assertJsonPath('validation_result.valid', true);
});

it('does nothing differently when the switch is off', function () {
    EstateSettings::forEstate($this->estate->id)->update(['zone_locked_passes' => false]);
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->scan)($guard, 'Gate B')->assertJsonPath('validation_result.valid', true);
});

it('ignores the guard membership zone, which no longer decides anything', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security', $this->zoneB);
    ($this->signOn)($guard, 'Gate A');

    ($this->scan)($guard, 'Gate A')->assertJsonPath('validation_result.valid', true);
});

it('follows the resident when they move to another zone', function () {
    $resident = ($this->member)('resident', $this->zoneA);
    ($this->passFor)($resident);
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    $resident->estates()->updateExistingPivot($this->estate->id, ['zone_id' => $this->zoneB->id]);

    ($this->scan)($guard, 'Gate B')->assertJsonPath('validation_result.valid', true);
});

it('only applies to the estate that turned it on', function () {
    $other = Estate::factory()->create();
    EstateSettings::forEstate($other->id)->update(['zone_locked_passes' => false]);

    expect(app(App\Services\Security\ZonePassGuard::class)->isEnabled($other->id))->toBeFalse()
        ->and(app(App\Services\Security\ZonePassGuard::class)->isEnabled($this->estate->id))->toBeTrue();
});

// ---------- No way around it ----------

it('refuses a wrong-zone admit sent straight to the decision endpoint', function () {
    $pass = ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->asGuard)($guard, 'Gate B')
        ->postJson(route('security.verify.decision'), ['decision' => 'admit', 'code' => 'ZONE1234'])
        ->assertStatus(422);

    expect(AccessLog::where('access_code_id', $pass->id)->count())->toBe(0);
});

it('keeps wrong-zone passes out of the offline cache of the gate the guard is on', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA), 'AAAA1111');
    ($this->passFor)(($this->member)('resident', $this->zoneB), 'BBBB2222');
    ($this->passFor)(($this->member)('resident'), 'CCCC3333');
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate A');

    $codes = ($this->asGuard)($guard, 'Gate A')
        ->getJson(route('security.verify.sync'))
        ->assertOk()
        ->json('codes');

    expect($codes)->toHaveCount(2)
        ->and(collect($codes)->pluck('hash')->all())->not->toContain(hash('sha256', 'BBBB2222'));
});

it('records, flags and does not retry a wrong-zone admit found when offline logs are replayed', function () {
    $pass = ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->asGuard)($guard, 'Gate B')
        ->withHeaders(['Idempotency-Key' => 'zone-test-1'])
        ->postJson(route('security.verify.sync-logs'), ['logs' => [
            ['code' => 'ZONE1234', 'decision' => 'admit', 'created_at' => now()->toIso8601String()],
        ]])
        ->assertOk()
        ->assertJsonPath('failed_count', 0);

    $log = AccessLog::where('access_code_id', $pass->id)->first();

    expect($log)->not->toBeNull()
        ->and($log->meta['sync_status'])->toBe('wrong_zone')
        ->and($log->meta['offline_override'])->toBeTrue()
        ->and($pass->fresh()->status)->toBe(AccessCodeStatus::Active);
});

// ---------- A trail for the admin ----------

it('records who scanned a wrong-zone pass, at which gate, and where it belonged', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security');
    ($this->signOn)($guard, 'Gate B');

    ($this->scan)($guard, 'Gate B');

    $entry = Activity::query()->where('description', 'Security guard scanned a pass from another zone')->first();

    expect($entry)->not->toBeNull()
        ->and($entry->causer_id)->toBe($guard->id)
        ->and($entry->getExtraProperty('gate'))->toBe('Gate B')
        ->and($entry->getExtraProperty('guard_zone_id'))->toBe($this->zoneB->id)
        ->and($entry->getExtraProperty('pass_zone_id'))->toBe($this->zoneA->id);
});
