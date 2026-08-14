<?php

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostCategory;
use App\Enums\EstateBoardPostPriority;
use App\Enums\EstateBoardPostStatus;
use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use App\Services\Admin\EstateBoardService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);
});

it('stores zone targets when an admin creates a zone-scoped broadcast', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.estate-board.store'), [
            'title' => 'Zone A Water Notice',
            'body' => 'Water will be shut off tomorrow from 9am to 2pm in Zone A only.',
            'category' => EstateBoardPostCategory::Maintenance->value,
            'priority' => EstateBoardPostPriority::Important->value,
            'status' => EstateBoardPostStatus::Published->value,
            'audience' => EstateBoardPostAudience::All->value,
            'zone_ids' => [$this->zoneA->id],
        ])
        ->assertRedirect(route('admin.estate-board.manage'));

    $post = EstateBoardPost::query()->where('title', 'Zone A Water Notice')->first();

    expect($post)->not->toBeNull()
        ->and($post->applies_to)->toBe('custom');

    $this->assertDatabaseHas('estate_board_post_targets', [
        'estate_board_post_id' => $post->id,
        'target_type' => 'zone',
        'target_id' => $this->zoneA->id,
    ]);
});

it('hides zone-targeted broadcasts from residents outside the zone', function () {
    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'title' => 'Zone A Only',
        'body' => 'This announcement is only for Zone A residents and should stay hidden elsewhere.',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'applies_to' => 'custom',
        'published_at' => now(),
        'property_owner_id' => null,
    ]);

    $post->targets()->create([
        'target_type' => 'zone',
        'target_id' => $this->zoneA->id,
    ]);

    $residentA = User::factory()->create();
    $residentB = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $residentA->assignRole('resident');
    $residentB->assignRole('resident');
    $this->estate->users()->attach($residentA->id, ['status' => 'accepted', 'zone_id' => $this->zoneA->id, 'relationship_type' => 'resident']);
    $this->estate->users()->attach($residentB->id, ['status' => 'accepted', 'zone_id' => $this->zoneB->id, 'relationship_type' => 'resident']);

    $this->actingAs($residentA);
    $visibleToA = app(EstateBoardService::class)->getFeed($this->estate->id, 10)->pluck('id');

    $this->actingAs($residentB);
    $visibleToB = app(EstateBoardService::class)->getFeed($this->estate->id, 10)->pluck('id');

    expect($visibleToA)->toContain($post->id)
        ->and($visibleToB)->not->toContain($post->id);
});
