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
        );
});
