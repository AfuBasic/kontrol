<?php

use App\Models\AccessLog;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\OrganizationPublicWindow;
use App\Models\User;
use App\Models\VisitorProfile;
use App\Models\Zone;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/*
| Quick entry: a stranger states a destination, the guard picks it, photographs their ID,
| and the system issues a tag. Closed destinations get no entry. With checkout enforced,
| the same tag is the exit tag.
*/

beforeEach(function () {
    Storage::fake('local');
    $this->travelTo(now()->startOfWeek()->setTime(12, 0)); // Monday noon
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->guard = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->guard->assignRole('security');
    $this->estate->users()->attach($this->guard->id, ['status' => 'accepted']);

    $this->assignment = AdministrativeAssignment::create([
        'user_id' => $this->guard->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->guard->roles->first()->id,
        'scope_type' => 'estate',
        'is_primary' => true,
        'is_active' => true,
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'quick_entry_enabled' => true,
        'visitor_checkout_enabled' => true,
    ]);

    $this->makeOrg = fn (string $policy, string $name = 'Org') => EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => $name,
        'type' => 'other',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'access_policy' => $policy,
    ]);

    // Church open Mondays 10:00 to 14:00.
    $this->church = ($this->makeOrg)('public_window', 'Grace Chapel');
    OrganizationPublicWindow::create([
        'organization_id' => $this->church->id,
        'name' => 'Midday service',
        'day_of_week' => now()->dayOfWeek,
        'start_time' => '10:00:00',
        'end_time' => '14:00:00',
        'is_active' => true,
    ]);

    $this->hospital = ($this->makeOrg)('unrestricted', 'City Hospital');
    $this->bar = ($this->makeOrg)('managed', 'Lounge Bar');

    $this->asGuard = fn () => $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id]);

    $this->idPhoto = fn (string $name = 'id.jpg') => UploadedFile::fake()->image($name, 600, 400);

    // Raw bytes of a fake ID image (read while the temp file still exists).
    $this->idPhotoBytes = function (): string {
        $file = UploadedFile::fake()->image('id.jpg', 600, 400);

        return file_get_contents($file->getRealPath());
    };

    $this->admit = fn (EstateOrganization $org, array $extra = []) => ($this->asGuard)()
        ->post(route('security.quick-entry.store'), [
            'organization_id' => $org->id,
            'id_photo' => ($this->idPhoto)(),
            ...$extra,
        ], ['Accept' => 'application/json']);
});

it('admits a walk-in with an ID photo and returns a tag', function () {
    $response = ($this->admit)($this->hospital, [
        'visitor_name' => 'Dele Okafor',
        'vehicle_plate_number' => 'ABC-123-XY',
    ])->assertOk();

    $tag = $response->json('tag');
    expect($tag)->toHaveLength(4)
        ->and($response->json('organization_name'))->toBe('City Hospital');

    $log = AccessLog::withoutGlobalScopes()->where('meta->tag', $tag)->firstOrFail();
    expect($log->meta['entry_type'])->toBe('quick_entry')
        ->and($log->meta['admission_basis'])->toBe('unrestricted')
        ->and($log->visitor_profile_id)->not->toBeNull()
        ->and($log->vehicle_plate_number)->toBe('ABC-123-XY');
});

it('admits to a public-window organization while a window is open', function () {
    ($this->admit)($this->church)->assertOk();
});

it('refuses entry to a public-window organization outside its windows', function () {
    $this->travelTo(now()->setTime(18, 0));

    ($this->admit)($this->church)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['organization_id']);

    expect(AccessLog::withoutGlobalScopes()->count())->toBe(0);
});

it('refuses walk-ins to a managed organization', function () {
    ($this->admit)($this->bar)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['organization_id']);
});

it('requires a photo of the visitor ID', function () {
    ($this->asGuard)()
        ->postJson(route('security.quick-entry.store'), ['organization_id' => $this->hospital->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['id_photo']);
});

it('recognises a returning visitor from the same ID photo', function () {
    $contents = ($this->idPhotoBytes)();

    $send = fn () => ($this->asGuard)()->post(route('security.quick-entry.store'), [
        'organization_id' => $this->hospital->id,
        'id_photo' => UploadedFile::fake()->createWithContent('id.jpg', $contents),
    ], ['Accept' => 'application/json']);

    $send()->assertOk()->assertJsonPath('is_returning_visitor', false);
    $send()->assertOk()->assertJsonPath('is_returning_visitor', true);

    expect(VisitorProfile::count())->toBe(1);
});

it('admits walk-ins and recognises returning visitors for a zone-assigned guard', function () {
    $zone = Zone::create(['estate_id' => $this->estate->id, 'name' => 'North Gate Zone']);
    $zoneAssignment = AdministrativeAssignment::create([
        'user_id' => $this->guard->id,
        'estate_id' => $this->estate->id,
        'zone_id' => $zone->id,
        'role_id' => $this->guard->roles->first()->id,
        'scope_type' => 'zone',
        'is_primary' => false,
        'is_active' => true,
    ]);
    $contents = ($this->idPhotoBytes)();

    $send = fn () => $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $zoneAssignment->id])
        ->post(route('security.quick-entry.store'), [
            'organization_id' => $this->hospital->id,
            'id_photo' => UploadedFile::fake()->createWithContent('id.jpg', $contents),
        ], ['Accept' => 'application/json']);

    $send()->assertOk()->assertJsonPath('is_returning_visitor', false);
    $send()->assertOk()->assertJsonPath('is_returning_visitor', true);
});

it('keeps a tag issued by the gate device', function () {
    ($this->admit)($this->hospital, ['tag' => 'k7pq'])->assertOk()->assertJsonPath('tag', 'K7PQ');
});

it('refuses a tag held by a visitor who has not checked out', function () {
    ($this->admit)($this->hospital, ['tag' => 'AB23'])->assertOk();

    ($this->admit)($this->hospital, ['tag' => 'AB23'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tag']);
});

it('rejects a destination from another estate', function () {
    $otherOrg = EstateOrganization::factory()->create([
        'estate_id' => Estate::factory()->create()->id,
        'is_active' => true,
        'quick_entry_enabled' => true,
        'access_policy' => 'unrestricted',
    ]);

    ($this->admit)($otherOrg)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['organization_id']);
});

it('syncs offline entries with their device tags and photos, judged at admission time', function () {
    $photo = 'data:image/jpeg;base64,'.base64_encode(($this->idPhotoBytes)());
    $admittedAt = now()->setTime(13, 30); // inside the church window

    $this->travelTo(now()->setTime(19, 0)); // sync after the window has closed

    ($this->asGuard)()
        ->postJson(route('security.quick-entry.sync'), [
            'logs' => [
                ['tag' => 'QX7K', 'organization_id' => $this->church->id, 'verified_at' => $admittedAt->toISOString(), 'id_photo' => $photo],
                ['tag' => 'M4PZ', 'organization_id' => $this->hospital->id, 'verified_at' => $admittedAt->toISOString(), 'id_photo' => $photo],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('synced_count', 2);

    $tags = AccessLog::withoutGlobalScopes()->get()->pluck('meta.tag')->sort()->values()->all();
    expect($tags)->toBe(['M4PZ', 'QX7K']);
});

it('reports offline entries that were made to a closed destination', function () {
    $photo = 'data:image/jpeg;base64,'.base64_encode(($this->idPhotoBytes)());

    ($this->asGuard)()
        ->postJson(route('security.quick-entry.sync'), [
            'logs' => [['tag' => 'BR22', 'organization_id' => $this->bar->id, 'verified_at' => now()->toISOString(), 'id_photo' => $photo]],
        ])
        ->assertOk()
        ->assertJsonPath('synced_count', 0)
        ->assertJsonPath('errors.0.tag', 'BR22');
});

it('looks up a visitor inside by tag', function () {
    $tag = ($this->admit)($this->hospital, ['visitor_name' => 'Ada'])->json('tag');

    ($this->asGuard)()
        ->getJson(route('security.quick-entry.lookup', ['tag' => strtolower($tag)]))
        ->assertOk()
        ->assertJson(['found' => true, 'tag' => $tag, 'organization_name' => 'City Hospital']);

    ($this->asGuard)()
        ->getJson(route('security.quick-entry.lookup', ['tag' => 'ZZZZ']))
        ->assertOk()
        ->assertJson(['found' => false]);
});

it('checks a visitor out with the same tag', function () {
    $tag = ($this->admit)($this->hospital)->json('tag');

    ($this->asGuard)()
        ->postJson(route('security.quick-entry.checkout'), ['tag' => $tag])
        ->assertOk()
        ->assertJsonPath('tag', $tag);

    $log = AccessLog::withoutGlobalScopes()->where('meta->tag', $tag)->firstOrFail();
    expect($log->checked_out_at)->not->toBeNull()
        ->and($log->checked_out_by)->toBe($this->guard->id)
        ->and($log->meta)->toHaveKey('exit_time');
});

it('explains when no visitor inside holds the tag', function () {
    $tag = ($this->admit)($this->hospital)->json('tag');
    ($this->asGuard)()->postJson(route('security.quick-entry.checkout'), ['tag' => $tag])->assertOk();

    ($this->asGuard)()
        ->postJson(route('security.quick-entry.checkout'), ['tag' => $tag])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tag']);
});
