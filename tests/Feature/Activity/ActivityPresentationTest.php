<?php

use App\Models\Activity;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use App\Presenters\ActivityPresenter;
use App\Services\Admin\ActivityService;
use App\Services\EstateContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    app(EstateContextService::class)->setEstateId($this->estate->id);
});

test('transforms raw activity into human-friendly headline and metadata', function () {
    $resident = User::factory()->create(['name' => 'Amara Okafor', 'email' => 'amara@example.com']);

    $activity = activity('people')
        ->performedOn($resident)
        ->causedBy($this->admin)
        ->withProperties(['estate_id' => $this->estate->id])
        ->log('invited resident '.$resident->email);

    $activity->load(['causer', 'subject']);

    $presented = ActivityPresenter::present($activity);

    expect($presented)->toHaveKeys([
        'id',
        'headline',
        'supporting_context',
        'module',
        'module_label',
        'icon_type',
        'semantic_tone',
        'actor',
        'subject',
        'timestamp',
        'relative_time',
        'destination_url',
        'is_system',
        'is_important',
    ])
        ->and($presented['headline'])->toContain($this->admin->name)
        ->and($presented['headline'])->toContain('Amara Okafor')
        ->and($presented['module'])->toBe('people')
        ->and($presented['module_label'])->toBe('People');
});

test('filters out noisy system events from activity feed', function () {
    // Noise event
    activity('system')
        ->causedBy($this->admin)
        ->withProperties(['estate_id' => $this->estate->id])
        ->log('logged in');

    // Valid action
    activity('announcements')
        ->causedBy($this->admin)
        ->withProperties(['estate_id' => $this->estate->id, 'post_title' => 'Estate AGM Meeting'])
        ->log('created board post: Estate AGM Meeting');

    $service = app(ActivityService::class);
    $paginator = $service->getCursorPaginatedActivities();

    expect($paginator->items())->toHaveCount(1)
        ->and($paginator->items()[0]->description)->toBe('created board post: Estate AGM Meeting');
});

test('filters activities by module channel', function () {
    activity('people')
        ->causedBy($this->admin)
        ->withProperties(['estate_id' => $this->estate->id])
        ->log('invited resident test@example.com');

    activity('security')
        ->causedBy($this->admin)
        ->withProperties(['estate_id' => $this->estate->id])
        ->log('invited security personnel guard@example.com');

    $service = app(ActivityService::class);

    $peopleActivities = $service->getCursorPaginatedActivities(null, 'people');
    expect($peopleActivities->items())->toHaveCount(1)
        ->and($peopleActivities->items()[0]->log_name)->toBe('people');

    $securityActivities = $service->getCursorPaginatedActivities(null, 'security');
    expect($securityActivities->items())->toHaveCount(1)
        ->and($securityActivities->items()[0]->log_name)->toBe('security');
});
