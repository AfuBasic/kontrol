<?php

use App\Jobs\Admin\SendCollectionRemindersJob;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Notifications\Resident\CollectionReminderNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('sends collection reminders according to the scheduled intervals', function () {
    Notification::fake();

    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');

    $collection = Collection::create([
        'estate_id' => $estate->id,
        'name' => 'Utility Bill',
        'description' => 'Power and water bill',
        'amount' => 15000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $admin->id,
        'status' => 'active',
    ]);

    // Scenario 1: Due in exactly 3 days (Should send)
    $resident1 = User::factory()->create();
    $assignment1 = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident1->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'pending',
        'due_date' => now()->addDays(3),
    ]);

    // Scenario 2: Due today (Should send)
    $resident2 = User::factory()->create();
    $assignment2 = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident2->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'pending',
        'due_date' => now(),
    ]);

    // Scenario 3: Overdue by 3 days (Should send)
    $resident3 = User::factory()->create();
    $assignment3 = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident3->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'overdue',
        'due_date' => now()->subDays(3),
    ]);

    // Scenario 4: Overdue by 6 days (Should send)
    $resident4 = User::factory()->create();
    $assignment4 = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident4->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'overdue',
        'due_date' => now()->subDays(6),
    ]);

    // Scenario 5: Due in 2 days (Should NOT send)
    $resident5 = User::factory()->create();
    $assignment5 = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident5->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'pending',
        'due_date' => now()->addDays(2),
    ]);

    // Scenario 6: Overdue by 2 days (Should NOT send)
    $resident6 = User::factory()->create();
    $assignment6 = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident6->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'overdue',
        'due_date' => now()->subDays(2),
    ]);

    // Dispatch the job
    (new SendCollectionRemindersJob)->handle();

    // Assert notifications sent
    Notification::assertSentTo($resident1, CollectionReminderNotification::class, function ($notification) use ($assignment1) {
        return $notification->assignment->id === $assignment1->id;
    });

    Notification::assertSentTo($resident2, CollectionReminderNotification::class, function ($notification) use ($assignment2) {
        return $notification->assignment->id === $assignment2->id;
    });

    Notification::assertSentTo($resident3, CollectionReminderNotification::class, function ($notification) use ($assignment3) {
        return $notification->assignment->id === $assignment3->id;
    });

    Notification::assertSentTo($resident4, CollectionReminderNotification::class, function ($notification) use ($assignment4) {
        return $notification->assignment->id === $assignment4->id;
    });

    // Assert notifications NOT sent
    Notification::assertNotSentTo($resident5, CollectionReminderNotification::class);
    Notification::assertNotSentTo($resident6, CollectionReminderNotification::class);
});
