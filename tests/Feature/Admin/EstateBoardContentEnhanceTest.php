<?php

use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Services\ContentEnhancerService;
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

it('enhances estate board content with contextual metadata', function () {
    $this->mock(ContentEnhancerService::class, function ($mock) {
        $mock->shouldReceive('enhanceEstateBoardPost')
            ->once()
            ->with(
                'Water outage tomorrow morning for maintenance.',
                'Water Notice',
                [
                    'category' => 'maintenance',
                    'priority' => 'important',
                    'audience' => 'all',
                ],
            )
            ->andReturn('**Water Notice** - Scheduled maintenance tomorrow morning.');
    });

    $this->actingAs($this->adminUser)
        ->postJson(route('admin.estate-board.enhance-content'), [
            'mode' => 'enhance',
            'content' => 'Water outage tomorrow morning for maintenance.',
            'title' => 'Water Notice',
            'category' => 'maintenance',
            'priority' => 'important',
            'audience' => 'all',
            'type' => 'estate_board',
        ])
        ->assertOk()
        ->assertJson([
            'success' => true,
            'enhanced' => '**Water Notice** - Scheduled maintenance tomorrow morning.',
        ]);
});

it('drafts estate board content from a brief', function () {
    $this->mock(ContentEnhancerService::class, function ($mock) {
        $mock->shouldReceive('draftEstateBoardPost')
            ->once()
            ->with(
                'Water will be shut off tomorrow from 9am to 2pm for pipe maintenance.',
                null,
                [
                    'category' => 'maintenance',
                    'priority' => 'important',
                    'audience' => 'residents',
                ],
            )
            ->andReturn([
                'title' => 'Scheduled Water Maintenance',
                'body' => 'Water supply will be interrupted tomorrow between 9am and 2pm.',
            ]);
    });

    $this->actingAs($this->adminUser)
        ->postJson(route('admin.estate-board.enhance-content'), [
            'mode' => 'draft',
            'brief' => 'Water will be shut off tomorrow from 9am to 2pm for pipe maintenance.',
            'category' => 'maintenance',
            'priority' => 'important',
            'audience' => 'residents',
            'type' => 'estate_board',
        ])
        ->assertOk()
        ->assertJson([
            'success' => true,
            'enhanced' => 'Water supply will be interrupted tomorrow between 9am and 2pm.',
            'suggested_title' => 'Scheduled Water Maintenance',
        ]);
});

it('requires authentication for content enhancement', function () {
    $this->postJson(route('admin.estate-board.enhance-content'), [
        'mode' => 'enhance',
        'content' => 'This is sample content for enhancement.',
    ])
        ->assertUnauthorized();
});

it('validates draft requests require a brief', function () {
    $this->actingAs($this->adminUser)
        ->postJson(route('admin.estate-board.enhance-content'), [
            'mode' => 'draft',
            'category' => 'general',
            'priority' => 'normal',
            'audience' => 'all',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['brief']);
});
