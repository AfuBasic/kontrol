<?php

use App\Events\Admin\CollectionPublished;
use App\Jobs\Admin\PublishCollectionJob;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Notifications\Admin\CollectionPublishedNotification;
use App\Services\Admin\CollectionService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'collections.view']);
    Permission::firstOrCreate(['name' => 'collections.create']);
    Permission::firstOrCreate(['name' => 'collections.edit']);
    $adminRole->givePermissionTo(['collections.view', 'collections.create', 'collections.edit']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted', 'relationship_type' => 'admin']);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_test',
    ]);

    // Create a resident
    $this->resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->estate->users()->attach($this->resident->id, ['status' => 'accepted', 'relationship_type' => 'resident']);
});

it('dispatches the CollectionPublished event and CollectionPublishedNotification upon completion', function () {
    Event::fake();
    Notification::fake();

    $this->actingAs($this->admin);

    $collection = app(CollectionService::class)->createCollection($this->estate, [
        'name' => 'Test Collection Notification',
        'amount' => 10000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'applies_to' => 'all',
    ]);

    // Set the created_by explicitly since we didn't use the web route to create it
    $collection->created_by = $this->admin->id;
    $collection->save();

    (new PublishCollectionJob($collection->id))->handle();

    // Verify assignments were created
    expect(CollectionAssignment::withoutGlobalScopes()->where('collection_id', $collection->id)->count())->toBe(1);

    // Verify the Notification was sent to the admin who created it
    Notification::assertSentTo(
        [$this->admin],
        CollectionPublishedNotification::class,
        function ($notification, $channels) use ($collection) {
            return $notification->collection->id === $collection->id;
        }
    );

    // Verify the Broadcast event was dispatched
    Event::assertDispatched(CollectionPublished::class, function ($event) use ($collection) {
        return $event->collection->id === $collection->id;
    });
});
