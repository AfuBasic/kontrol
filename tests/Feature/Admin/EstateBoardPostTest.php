<?php

use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->adminUser->assignRole('admin');
    $this->adminUser->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);
});

it('creates an estate board announcement for admins', function () {
    $this->actingAs($this->adminUser)
        ->post(route('admin.estate-board.store'), [
            'title' => 'Water Supply Maintenance',
            'body' => 'Water will be shut off tomorrow from 9am to 2pm for maintenance work.',
            'category' => 'maintenance',
            'priority' => 'important',
            'status' => 'published',
            'audience' => 'all',
        ])
        ->assertRedirect(route('admin.estate-board.manage'))
        ->assertSessionHas('success', 'Post created successfully.');

    $post = EstateBoardPost::query()->where('title', 'Water Supply Maintenance')->first();

    expect($post)->not->toBeNull()
        ->and($post->estate_id)->toBe($this->estate->id)
        ->and($post->user_id)->toBe($this->adminUser->id)
        ->and($post->category->value)->toBe('maintenance')
        ->and($post->priority->value)->toBe('important')
        ->and($post->status->value)->toBe('published')
        ->and($post->audience->value)->toBe('all');
});

it('requires category and priority when creating an estate board announcement', function () {
    $this->actingAs($this->adminUser)
        ->post(route('admin.estate-board.store'), [
            'title' => 'Missing Metadata',
            'body' => 'This announcement is missing category and priority fields.',
            'status' => 'published',
            'audience' => 'all',
        ])
        ->assertSessionHasErrors(['category', 'priority']);

    expect(EstateBoardPost::query()->where('title', 'Missing Metadata')->exists())->toBeFalse();
});
