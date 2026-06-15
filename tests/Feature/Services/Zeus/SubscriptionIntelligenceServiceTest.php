<?php

use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\Activity;
use App\Services\Zeus\SubscriptionIntelligenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('calculates plan analytics correctly', function () {
    $plan1 = Plan::factory()->create(['name' => 'Basic', 'price' => 10000, 'billing_interval' => 'quarterly']);
    $plan2 = Plan::factory()->create(['name' => 'Premium', 'price' => 50000, 'billing_interval' => 'annually']);

    EstateSubscription::factory()->count(2)->create(['plan_id' => $plan1->id, 'status' => 'active']);
    EstateSubscription::factory()->count(3)->create(['plan_id' => $plan2->id, 'status' => 'active']);

    $service = new SubscriptionIntelligenceService();
    $analytics = $service->getPlanAnalytics();

    expect($analytics)->toHaveCount(2);
    
    // Basic plan check
    $basicData = collect($analytics)->firstWhere('plan_name', 'Basic');
    expect($basicData['estates_count'])->toBe(2);
    // 10000 quarterly = 3333 MRR per sub * 2 = 6667
    expect($basicData['mrr'])->toBeGreaterThan(6666)->toBeLessThan(6668);

    // Premium plan check
    $premiumData = collect($analytics)->firstWhere('plan_name', 'Premium');
    expect($premiumData['estates_count'])->toBe(3);
    // 50000 annually = 4166.6 MRR per sub * 3 = 12500
    expect($premiumData['mrr'])->toBe(12500.0);
});

it('calculates renewal cohorts correctly', function () {
    $plan = Plan::factory()->create(['price' => 12000, 'billing_interval' => 'annually']); // 1000 MRR

    // 0-30 days
    EstateSubscription::factory()->count(2)->create([
        'plan_id' => $plan->id,
        'status' => 'active',
        'next_billing_date' => Carbon::now()->addDays(15),
    ]);

    // 31-60 days
    EstateSubscription::factory()->count(1)->create([
        'plan_id' => $plan->id,
        'status' => 'active',
        'next_billing_date' => Carbon::now()->addDays(45),
    ]);

    // 61-90 days
    EstateSubscription::factory()->count(3)->create([
        'plan_id' => $plan->id,
        'status' => 'active',
        'next_billing_date' => Carbon::now()->addDays(75),
    ]);

    $service = new SubscriptionIntelligenceService();
    $cohorts = $service->getRenewalCohort();

    expect($cohorts[0]['count'])->toBe(2)
        ->and($cohorts[0]['mrr'])->toBe(2000.0) // 2 * 1000
        ->and($cohorts[1]['count'])->toBe(1)
        ->and($cohorts[1]['mrr'])->toBe(1000.0)
        ->and($cohorts[2]['count'])->toBe(3)
        ->and($cohorts[2]['mrr'])->toBe(3000.0);
});

it('calculates upgrade downgrade matrix correctly', function () {
    $cheapPlan = Plan::factory()->create(['price' => 10000]);
    $expensivePlan = Plan::factory()->create(['price' => 20000]);

    $subscription = EstateSubscription::factory()->create(['plan_id' => $expensivePlan->id]);

    // Simulate Upgrade
    Activity::create([
        'subject_type' => EstateSubscription::class,
        'subject_id' => $subscription->id,
        'event' => 'updated',
        'description' => 'updated',
        'properties' => [
            'old' => ['plan_id' => $cheapPlan->id],
            'attributes' => ['plan_id' => $expensivePlan->id]
        ],
        'created_at' => Carbon::now(),
    ]);

    // Simulate Downgrade
    Activity::create([
        'subject_type' => EstateSubscription::class,
        'subject_id' => $subscription->id,
        'event' => 'updated',
        'description' => 'updated',
        'properties' => [
            'old' => ['plan_id' => $expensivePlan->id],
            'attributes' => ['plan_id' => $cheapPlan->id]
        ],
        'created_at' => Carbon::now(),
    ]);

    $service = new SubscriptionIntelligenceService();
    $matrix = $service->getUpgradeDowngradeMatrix();

    expect($matrix[0]['name'])->toBe('Upgrades')
        ->and($matrix[0]['value'])->toBe(1)
        ->and($matrix[1]['name'])->toBe('Downgrades')
        ->and($matrix[1]['value'])->toBe(1);
});
