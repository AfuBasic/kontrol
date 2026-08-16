<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Notifications\Resident\CollectionReminderNotification;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_test',
        'collection_maximum_reminder_attempts' => 3,
    ]);
});

it('sends reminders to unpaid assignments and increments reminder_count', function () {
    Notification::fake();

    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
        'status' => 'active',
        'amount' => 10000,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'amount_due' => 10000,
        'amount_paid' => 0,
        'status' => 'pending',
        'reminder_count' => 0,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.collections.remind', $collection->ulid))
        ->assertRedirect();

    Notification::assertSentTo($resident, CollectionReminderNotification::class);

    expect($assignment->fresh()->reminder_count)->toBe(1);
});
