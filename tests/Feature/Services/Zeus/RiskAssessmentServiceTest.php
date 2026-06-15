<?php

use App\Models\Activity;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Services\Zeus\EstateHealthService;
use App\Services\Zeus\RiskAssessmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('identifies critical risk residents and estates', function () {
    $plan = Plan::factory()->create(['price' => 10000]);

    // Resident 1: Past Due (Critical)
    ResidentSubscription::factory()->create([
        'plan_id' => $plan->id,
        'status' => 'past_due',
    ]);

    // Resident 2: Trial expiring in 5 days with no card (High Risk)
    ResidentSubscription::factory()->create([
        'plan_id' => $plan->id,
        'status' => 'trial',
        'current_period_end' => Carbon::now()->addDays(5),
        'paystack_authorization_code' => null,
    ]);

    // Resident 3: Safe (Trial expires in 15 days)
    ResidentSubscription::factory()->create([
        'plan_id' => $plan->id,
        'status' => 'trial',
        'current_period_end' => Carbon::now()->addDays(15),
        'paystack_authorization_code' => null,
    ]);

    // Estate 1: Critical Health Score (<50)
    $estate = Estate::factory()->create();
    EstateSubscription::factory()->create([
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    $healthService = Mockery::mock(EstateHealthService::class);
    $healthService->shouldReceive('calculateHealthScore')
        ->with(Mockery::on(fn ($e) => $e->id === $estate->id))
        ->andReturn(40);
    $healthService->shouldReceive('calculateHealthScore')->andReturn(100);

    $service = new RiskAssessmentService($healthService);
    $riskList = $service->getChurnRiskList();

    // 1 Past Due Resident, 1 Expiring Trial Resident, 1 Critical Estate = 3 At Risk
    expect($riskList)->toHaveCount(3);

    // Sort logic should put Criticals first
    expect($riskList[0]['risk_level'])->toBe('critical');
    // Estate health < 50 is also critical, Resident past due is critical.
});

it('generates a platform activity stream', function () {
    $estate = Estate::factory()->create(['name' => 'Sunset Valley']);

    Activity::create([
        'subject_type' => Estate::class,
        'subject_id' => $estate->id,
        'event' => 'created',
        'description' => 'Estate created',
        'created_at' => Carbon::now()->subMinutes(5),
    ]);

    Activity::create([
        'subject_type' => ResidentSubscription::class,
        'subject_id' => 1,
        'event' => 'updated',
        'description' => 'updated',
        'properties' => [
            'old' => ['status' => 'active'],
            'attributes' => ['status' => 'past_due'],
        ],
        'created_at' => Carbon::now(),
    ]);

    $healthService = Mockery::mock(EstateHealthService::class);
    $service = new RiskAssessmentService($healthService);

    $stream = $service->getPlatformActivityStream(10);

    expect($stream)->toHaveCount(2);
    expect($stream[0]['type'])->toBe('warning'); // Past due
    expect($stream[0]['title'])->toBe('Subscription Past Due');

    expect($stream[1]['type'])->toBe('success'); // Estate created
    expect($stream[1]['title'])->toBe('New Estate Created');
});
