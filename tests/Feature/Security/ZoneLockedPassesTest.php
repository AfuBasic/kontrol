<?php

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Models\Zone;
use App\Services\Security\ZonePassGuard;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);

    EstateSettings::forEstate($this->estate->id)->update(['access_codes_enabled' => true, 'zone_locked_passes' => true]);

    $this->member = function (string $role, ?Zone $zone): User {
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

    $this->scan = fn (User $guard, string $code = 'ZONE1234') => $this->actingAs($guard)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.validate'), ['code' => $code, 'source' => 'scanned']);
});

// ---------- The rule ----------

it('admits a pass at a guard in the same zone', function () {
    $resident = ($this->member)('resident', $this->zoneA);
    ($this->passFor)($resident);

    ($this->scan)(($this->member)('security', $this->zoneA))
        ->assertJsonPath('validation_result.valid', true);
});

it('refuses a pass at a guard in a different zone, without admitting anyone', function () {
    $pass = ($this->passFor)(($this->member)('resident', $this->zoneA));

    ($this->scan)(($this->member)('security', $this->zoneB))
        ->assertJsonPath('success', false)
        ->assertJsonPath('validation_result.valid', false)
        ->assertJsonPath('validation_result.status', 'wrong_zone');

    expect(AccessLog::where('access_code_id', $pass->id)->count())->toBe(0)
        ->and($pass->fresh()->status)->toBe(AccessCodeStatus::Active);
});

it('does not reveal who the visitor or host is when it refuses', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));

    ($this->scan)(($this->member)('security', $this->zoneB))
        ->assertJsonPath('validation_result.visitor_name', null)
        ->assertJsonPath('validation_result.host_name', null);
});

it('does nothing differently when the switch is off', function () {
    EstateSettings::forEstate($this->estate->id)->update(['zone_locked_passes' => false]);
    ($this->passFor)(($this->member)('resident', $this->zoneA));

    ($this->scan)(($this->member)('security', $this->zoneB))
        ->assertJsonPath('validation_result.valid', true);
});

it('does not lock out a guard without a zone', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));

    ($this->scan)(($this->member)('security', null))
        ->assertJsonPath('validation_result.valid', true);
});

it('does not lock out a pass from a resident without a zone', function () {
    ($this->passFor)(($this->member)('resident', null));

    ($this->scan)(($this->member)('security', $this->zoneB))
        ->assertJsonPath('validation_result.valid', true);
});

it('follows the resident when they move to another zone', function () {
    $resident = ($this->member)('resident', $this->zoneA);
    ($this->passFor)($resident);
    $guardB = ($this->member)('security', $this->zoneB);

    $resident->estates()->updateExistingPivot($this->estate->id, ['zone_id' => $this->zoneB->id]);

    ($this->scan)($guardB)->assertJsonPath('validation_result.valid', true);
});

it('only applies to the estate that turned it on', function () {
    $other = Estate::factory()->create();
    EstateSettings::forEstate($other->id)->update(['access_codes_enabled' => true, 'zone_locked_passes' => false]);

    expect(app(ZonePassGuard::class)->isEnabled($other->id))->toBeFalse()
        ->and(app(ZonePassGuard::class)->isEnabled($this->estate->id))->toBeTrue();
});

// ---------- No way around it ----------

it('refuses a wrong-zone admit sent straight to the decision endpoint', function () {
    $pass = ($this->passFor)(($this->member)('resident', $this->zoneA));

    $this->actingAs(($this->member)('security', $this->zoneB))
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->postJson(route('security.verify.decision'), ['decision' => 'admit', 'code' => 'ZONE1234'])
        ->assertStatus(422);

    expect(AccessLog::where('access_code_id', $pass->id)->count())->toBe(0);
});

it('keeps wrong-zone passes out of the guard offline cache', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA), 'AAAA1111');
    ($this->passFor)(($this->member)('resident', $this->zoneB), 'BBBB2222');
    ($this->passFor)(($this->member)('resident', null), 'CCCC3333');

    $codes = $this->actingAs(($this->member)('security', $this->zoneA))
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->getJson(route('security.verify.sync'))
        ->assertOk()
        ->json('codes');

    expect($codes)->toHaveCount(2)
        ->and(collect($codes)->pluck('hash')->all())->not->toContain(hash('sha256', 'BBBB2222'));
});

it('does not admit a wrong-zone pass from replayed offline logs, and does not retry it forever', function () {
    $pass = ($this->passFor)(($this->member)('resident', $this->zoneA));

    $this->actingAs(($this->member)('security', $this->zoneB))
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true', 'Idempotency-Key' => 'zone-test-1'])
        ->postJson(route('security.verify.sync-logs'), ['logs' => [
            ['code' => 'ZONE1234', 'decision' => 'admit', 'created_at' => now()->toIso8601String()],
        ]])
        ->assertOk()
        ->assertJsonPath('failed_count', 0);

    expect(AccessLog::where('access_code_id', $pass->id)->count())->toBe(0);
});

// ---------- A trail for the admin ----------

it('records who scanned a wrong-zone pass and where it belonged', function () {
    ($this->passFor)(($this->member)('resident', $this->zoneA));
    $guard = ($this->member)('security', $this->zoneB);

    ($this->scan)($guard);

    $entry = Activity::query()->where('description', 'Security guard scanned a pass from another zone')->first();

    expect($entry)->not->toBeNull()
        ->and($entry->causer_id)->toBe($guard->id)
        ->and($entry->getExtraProperty('guard_zone_id'))->toBe($this->zoneB->id)
        ->and($entry->getExtraProperty('pass_zone_id'))->toBe($this->zoneA->id);
});
