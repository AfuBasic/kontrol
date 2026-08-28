<?php

use App\Actions\Zeus\UpdateEstateAction;
use App\Jobs\Billing\SyncEstateTrialSettingsJob;
use App\Models\Estate;
use App\Models\EstateSetting;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

test('it syncs existing resident trial periods when trial days are changed', function () {
    $estate = Estate::factory()->create();
    EstateSetting::create([
        'estate_id' => $estate->id,
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 30,
    ]);

    $oldUser = User::factory()->create();
    $newUser = User::factory()->create();

    // Resident registered 5 days ago (previously 30 days trial)
    $subOld = ResidentSubscription::create([
        'user_id' => $oldUser->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(25),
        'current_period_start' => now()->subDays(5),
        'current_period_end' => now()->addDays(25),
        'created_at' => now()->subDays(5),
    ]);

    // Resident registered 2 hours ago
    $subNew = ResidentSubscription::create([
        'user_id' => $newUser->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(30),
        'current_period_start' => now()->subHours(2),
        'current_period_end' => now()->addDays(30),
        'created_at' => now()->subHours(2),
    ]);

    // Change estate trial setting to 1 day
    $estate->settings->update(['free_trial_days' => 1]);

    // Execute job
    (new SyncEstateTrialSettingsJob($estate))->handle();

    // Old resident registered 5 days ago should now be past_due (1-day trial expired 4 days ago)
    $subOld->refresh();
    expect($subOld->status)->toBe('past_due');
    expect($subOld->trial_ends_at->toDateString())->toBe($subOld->created_at->addDay()->toDateString());

    // New resident registered 2 hours ago should remain in trial (1-day trial ends in 22 hours)
    $subNew->refresh();
    expect($subNew->status)->toBe('trial');
    expect($subNew->trial_ends_at->toDateString())->toBe($subNew->created_at->addDay()->toDateString());
});

test('it transitions unpaid trial residents to past_due when free trial is disabled', function () {
    $estate = Estate::factory()->create();
    EstateSetting::create([
        'estate_id' => $estate->id,
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 30,
    ]);

    $user = User::factory()->create();

    $sub = ResidentSubscription::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'plan_id' => null,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(30),
        'current_period_start' => now(),
        'current_period_end' => now()->addDays(30),
    ]);

    // Disable free trial
    $estate->settings->update(['free_trial_enabled' => false]);

    (new SyncEstateTrialSettingsJob($estate))->handle();

    $sub->refresh();
    expect($sub->status)->toBe('past_due');
    expect($sub->trial_ends_at)->toBeNull();
});

test('it does not modify active paid resident subscriptions', function () {
    $estate = Estate::factory()->create();
    EstateSetting::create([
        'estate_id' => $estate->id,
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 30,
    ]);

    $plan = Plan::factory()->create();
    $user = User::factory()->create();

    $paidSub = ResidentSubscription::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'trial_ends_at' => null,
        'current_period_start' => now(),
        'current_period_end' => now()->addMonth(),
        'last_paid_at' => now(),
    ]);

    // Change estate trial setting to 0 / disabled
    $estate->settings->update([
        'free_trial_enabled' => false,
        'free_trial_days' => 0,
    ]);

    (new SyncEstateTrialSettingsJob($estate))->handle();

    $paidSub->refresh();
    expect($paidSub->status)->toBe('active');
    expect($paidSub->plan_id)->toBe($plan->id);
    expect($paidSub->current_period_end->isFuture())->toBeTrue();
});

test('it dispatches SyncEstateTrialSettingsJob when estate trial settings are updated in Zeus', function () {
    Queue::fake();

    $estate = Estate::factory()->create();
    EstateSetting::create([
        'estate_id' => $estate->id,
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 30,
    ]);

    $action = app(UpdateEstateAction::class);
    $action->execute($estate, [
        'name' => 'Updated Estate Name',
        'free_trial_days' => 1,
    ]);

    Queue::assertPushed(SyncEstateTrialSettingsJob::class, function ($job) use ($estate) {
        return $job->estate->id === $estate->id;
    });
});
