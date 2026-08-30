<?php

use App\Enums\EstateBoardPostStatus;
use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateBoardPostRead;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\UserProfile;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();
    $this->resident = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->adminUser->assignRole('admin');
    $this->resident->assignRole('resident');

    $this->adminUser->estates()->attach($this->estate->id, ['status' => 'accepted']);
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $this->resident->id]);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    $this->post = EstateBoardPost::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->adminUser->id,
        'title' => 'Water Maintenance Notice',
        'body' => 'Water will be shut off tomorrow morning.',
        'category' => 'maintenance',
        'priority' => 'important',
        'audience' => 'residents',
        'status' => EstateBoardPostStatus::Published,
        'published_at' => now(),
    ]);
});

it('records a read when a resident opens a published post', function () {
    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.show', $this->post))
        ->assertOk();

    expect(EstateBoardPostRead::query()->count())->toBe(1);

    $read = EstateBoardPostRead::query()->first();

    expect($read->estate_board_post_id)->toBe($this->post->id)
        ->and($read->user_id)->toBe($this->resident->id);
});

it('does not duplicate reads when the same resident opens a post again', function () {
    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.show', $this->post))
        ->assertOk();

    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.show', $this->post))
        ->assertOk();

    expect(EstateBoardPostRead::query()->count())->toBe(1);
});

it('does not record reads for draft posts', function () {
    $this->post->update([
        'status' => EstateBoardPostStatus::Draft,
        'published_at' => null,
    ]);

    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.show', $this->post))
        ->assertOk();

    expect(EstateBoardPostRead::query()->count())->toBe(0);
});

it('does not record reads when an admin previews a post', function () {
    $this->actingAs($this->adminUser)
        ->get(route('admin.estate-board.show', $this->post))
        ->assertOk();

    expect(EstateBoardPostRead::query()->count())->toBe(0);
});

it('shows read metrics to admins on the post detail page', function () {
    EstateBoardPostRead::create([
        'estate_board_post_id' => $this->post->id,
        'user_id' => $this->resident->id,
    ]);

    $this->actingAs($this->adminUser)
        ->get(route('admin.estate-board.show', $this->post))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/EstateBoard/Show')
            ->where('metrics.reads_count', 1)
        );
});

it('redirects the admin manage page to the unified estate board index', function () {
    EstateBoardPostRead::create([
        'estate_board_post_id' => $this->post->id,
        'user_id' => $this->resident->id,
    ]);

    $this->actingAs($this->adminUser)
        ->get(route('admin.estate-board.manage'))
        ->assertRedirect(route('admin.estate-board.index'));
});

it('exposes resident-specific is_read and unread_count on the resident feed', function () {
    $residentB = User::factory()->create();
    $residentB->assignRole('resident');
    $residentB->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $residentB->id]);

    // Unread initially
    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/EstateBoard/Index')
            ->where('unread_count', 1)
            ->where('posts.data.0.is_read', false)
        );

    // Resident A reads the post
    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.show', $this->post))
        ->assertOk();

    // Resident A sees is_read=true and unread_count=0
    $this->actingAs($this->resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/EstateBoard/Index')
            ->where('unread_count', 0)
            ->where('posts.data.0.is_read', true)
        );

    // Resident B still sees unread_count=1 and is_read=false
    $this->actingAs($residentB)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/EstateBoard/Index')
            ->where('unread_count', 1)
            ->where('posts.data.0.is_read', false)
        );
});

