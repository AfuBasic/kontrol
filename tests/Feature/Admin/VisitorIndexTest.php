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

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($this->estate->id);
});

it('renders the visitors page for authorized admins', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.visitors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Visitors/Index')
            ->has('logs')
            ->has('filters')
            ->has('checkoutEnabled')
            ->has('currentlyInsideList')
            ->has('expectedTodayCount')
            ->missing('metrics')
            ->missing('liveFeed')
            ->missing('attentionItems')
        );
});

it('includes currently inside visitors with overstay flag when checkout is enabled', function () {
    EstateSettings::forEstate($this->estate->id)->update([
        'visitor_checkout_enabled' => true,
    ]);

    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $security = User::factory()->create();
    $security->assignRole('security');
    $this->estate->users()->attach($security->id, ['status' => 'accepted']);

    $activeCode = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'INSIDE01',
        'type' => 'single_use',
        'visitor_name' => 'Bruce Wayne',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
    ]);

    $overstayCode = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'OVERSTAY',
        'type' => 'single_use',
        'visitor_name' => 'Late Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->subHour(),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $activeCode->id,
        'verified_by' => $security->id,
        'verified_at' => now()->subMinutes(30),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $overstayCode->id,
        'verified_by' => $security->id,
        'verified_at' => now()->subHours(3),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.visitors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Visitors/Index')
            ->where('checkoutEnabled', true)
            ->has('currentlyInsideList', 2)
            ->where('currentlyInsideList.0.visitor.name', 'Bruce Wayne')
            ->where('currentlyInsideList.0.is_overstayed', false)
            ->where('currentlyInsideList.1.visitor.name', 'Late Guest')
            ->where('currentlyInsideList.1.is_overstayed', true)
        );
});

it('exposes chain of custody fields on each activity log', function () {
    $resident = User::factory()->create(['name' => 'Afuwape Tunde']);
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $security = User::factory()->create(['name' => 'Gate Officer']);
    $security->assignRole('security');
    $this->estate->users()->attach($security->id, ['status' => 'accepted']);

    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'CHAIN001',
        'type' => 'single_use',
        'visitor_name' => 'Bruce Wayne',
        'purpose' => 'Guest visit',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(4),
        'created_at' => now()->subHours(2),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $code->id,
        'verified_by' => $security->id,
        'verified_at' => now()->subHour(),
        'checked_out_at' => now()->subMinutes(10),
        'checked_out_by' => $security->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.visitors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Visitors/Index')
            ->has('logs.data', 1)
            ->where('logs.data.0.visitor.name', 'Bruce Wayne')
            ->where('logs.data.0.issued_by', 'Afuwape Tunde')
            ->where('logs.data.0.verifier_name', 'Gate Officer')
            ->where('logs.data.0.checkout_verifier_name', 'Gate Officer')
            ->has('logs.data.0.issued_at')
            ->has('logs.data.0.issued_at_iso')
            ->has('logs.data.0.verified_at_iso')
            ->has('logs.data.0.checked_out_at_iso')
            ->has('logs.data.0.verified_at_time')
            ->has('logs.data.0.checked_out_at_time')
        );
});

it('sorts visitor logs by visitor name ascending', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $zebra = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'ZEBRA001',
        'type' => 'single_use',
        'visitor_name' => 'Zebra Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHour(),
    ]);

    $alpha = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'ALPHA001',
        'type' => 'single_use',
        'visitor_name' => 'Alpha Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHour(),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $zebra->id,
        'verified_by' => $this->admin->id,
        'verified_at' => now()->subHour(),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $alpha->id,
        'verified_by' => $this->admin->id,
        'verified_at' => now()->subMinutes(30),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.visitors.index', ['sort' => 'visitor', 'direction' => 'asc', 'view' => 'table']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'visitor')
            ->where('filters.direction', 'asc')
            ->where('filters.view', 'table')
            ->where('logs.data.0.visitor.name', 'Alpha Guest')
            ->where('logs.data.1.visitor.name', 'Zebra Guest')
        );
});

it('defaults to latest-first verified_at ordering', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $older = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'OLDER001',
        'type' => 'single_use',
        'visitor_name' => 'Older Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHour(),
    ]);

    $newer = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'NEWER001',
        'type' => 'single_use',
        'visitor_name' => 'Newer Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHour(),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $older->id,
        'verified_by' => $this->admin->id,
        'verified_at' => now()->subHours(2),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $newer->id,
        'verified_by' => $this->admin->id,
        'verified_at' => now()->subMinutes(5),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.visitors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'verified_at')
            ->where('filters.direction', 'desc')
            ->where('logs.data.0.visitor.name', 'Newer Guest')
            ->where('logs.data.1.visitor.name', 'Older Guest')
        );
});

it('returns an empty currently inside list when checkout is disabled', function () {
    EstateSettings::forEstate($this->estate->id)->update([
        'visitor_checkout_enabled' => false,
    ]);

    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'NOCHKOUT',
        'type' => 'single_use',
        'visitor_name' => 'Walk-in Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHour(),
    ]);

    AccessLog::create([
        'estate_id' => $this->estate->id,
        'access_code_id' => $code->id,
        'verified_by' => $this->admin->id,
        'verified_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.visitors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('checkoutEnabled', false)
            ->has('currentlyInsideList', 0)
            ->has('logs.data', 1)
            // Presence cannot be derived without check-out tracking.
            ->has('currentlyInsideList')
        );
});

describe('walk-ins and access codes in the visitor log', function () {
    beforeEach(function () {
        $this->resident = User::factory()->create(['name' => 'Host Resident']);
        $this->resident->assignRole('resident');
        $this->estate->users()->attach($this->resident->id, ['status' => 'accepted']);

        $this->security = User::factory()->create(['name' => 'Gate Officer']);
        $this->security->assignRole('security');
        $this->estate->users()->attach($this->security->id, ['status' => 'accepted']);

        $code = AccessCode::create([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'code' => 'CODE0001',
            'type' => 'single_use',
            'visitor_name' => 'Pass Holder',
            'status' => AccessCodeStatus::Active,
            'expires_at' => now()->addHours(2),
        ]);

        $this->codeLog = AccessLog::create([
            'estate_id' => $this->estate->id,
            'access_code_id' => $code->id,
            'verified_by' => $this->security->id,
            'verified_at' => now()->subHours(2),
        ]);

        $this->walkInLog = AccessLog::create([
            'estate_id' => $this->estate->id,
            'access_code_id' => null,
            'verified_by' => $this->security->id,
            'verified_at' => now()->subHour(),
            'meta' => [
                'entry_type' => 'quick_entry',
                'tag' => 'K7PQ',
                'visitor_name' => 'Dele Okafor',
                'organization_name' => 'OSBA',
            ],
        ]);
    });

    it('labels each entry as a walk-in or an access code and shows the walk-in as its own record', function () {
        $logs = collect($this->actingAs($this->admin)->get(route('admin.visitors.index'))->inertiaPage()['props']['logs']['data'])->keyBy('id');

        expect($logs[$this->walkInLog->id])->toMatchArray([
            'entry_type' => 'walk_in',
            'tag' => 'K7PQ',
            'code' => null,
            'issued_by' => null,
            'visitor' => ['name' => 'Dele Okafor', 'phone' => null, 'type' => 'walk_in'],
        ])->and($logs[$this->walkInLog->id]['host']['name'])->toBe('OSBA')
            ->and($logs[$this->codeLog->id])->toMatchArray(['entry_type' => 'access_code', 'tag' => null, 'code' => 'CODE0001'])
            ->and($logs[$this->codeLog->id]['host']['name'])->toBe('Host Resident');
    });

    it('filters by entry type', function () {
        $ids = fn (?string $type) => collect(
            $this->actingAs($this->admin)->get(route('admin.visitors.index', array_filter(['entry_type' => $type])))->inertiaPage()['props']['logs']['data']
        )->pluck('id')->all();

        expect($ids('walk_in'))->toBe([$this->walkInLog->id])
            ->and($ids('access_code'))->toBe([$this->codeLog->id])
            ->and($ids(null))->toEqualCanonicalizing([$this->walkInLog->id, $this->codeLog->id])
            ->and($ids('anything_else'))->toEqualCanonicalizing([$this->walkInLog->id, $this->codeLog->id]);
    });

    it('finds walk-ins by tag, name, or destination', function () {
        $found = fn (string $search) => collect(
            $this->actingAs($this->admin)->get(route('admin.visitors.index', ['search' => $search]))->inertiaPage()['props']['logs']['data']
        )->pluck('id')->all();

        expect($found('k7pq'))->toBe([$this->walkInLog->id])
            ->and($found('Dele'))->toBe([$this->walkInLog->id])
            ->and($found('OSBA'))->toBe([$this->walkInLog->id])
            ->and($found('CODE0001'))->toBe([$this->codeLog->id]);
    });

    it('keeps walk-in and access-code filters combinable with stay status', function () {
        EstateSettings::forEstate($this->estate->id)->update(['visitor_checkout_enabled' => true]);
        $this->walkInLog->update(['checked_out_at' => now()->subMinutes(5), 'checked_out_by' => $this->security->id]);

        $ids = fn (array $query) => collect(
            $this->actingAs($this->admin)->get(route('admin.visitors.index', $query))->inertiaPage()['props']['logs']['data']
        )->pluck('id')->all();

        expect($ids(['entry_type' => 'walk_in', 'status' => 'checked_out']))->toBe([$this->walkInLog->id])
            ->and($ids(['entry_type' => 'walk_in', 'status' => 'inside']))->toBe([])
            ->and($ids(['entry_type' => 'access_code', 'status' => 'inside']))->toBe([$this->codeLog->id]);
    });

    it('lists walk-ins inside alongside access-code visitors', function () {
        EstateSettings::forEstate($this->estate->id)->update(['visitor_checkout_enabled' => true]);

        $inside = collect($this->actingAs($this->admin)->get(route('admin.visitors.index'))->inertiaPage()['props']['currentlyInsideList']);

        expect($inside->pluck('entry_type')->sort()->values()->all())->toBe(['access_code', 'walk_in'])
            ->and($inside->firstWhere('entry_type', 'walk_in')['tag'])->toBe('K7PQ');
    });
});

it('reports the real stay for a visitor who has checked out, and elapsed time for one still inside', function () {
    $this->travelTo(now()->setTime(13, 0));
    $guard = User::factory()->create();

    $base = ['estate_id' => $this->estate->id, 'verified_by' => $guard->id];

    // Admitted 12:02, left 13:18 (the screenshot case): 76 minutes.
    AccessLog::create($base + [
        'verified_at' => now()->setTime(12, 2),
        'checked_out_at' => now()->setTime(13, 18),
        'meta' => ['entry_type' => 'quick_entry', 'tag' => 'AB12', 'visitor_name' => 'Gone Visitor'],
    ]);
    AccessLog::create($base + [
        'verified_at' => now()->subMinutes(45),
        'meta' => ['entry_type' => 'quick_entry', 'tag' => 'CD34', 'visitor_name' => 'Still Inside'],
    ]);

    $this->actingAs($this->admin)->get(route('admin.visitors.index'))
        ->assertInertia(fn ($page) => $page->where('logs.data', function ($rows) {
            $byName = collect($rows)->keyBy(fn ($r) => $r['visitor']['name']);

            return $byName['Gone Visitor']['duration_minutes'] === 76 && $byName['Still Inside']['duration_minutes'] === 45;
        }));
});
