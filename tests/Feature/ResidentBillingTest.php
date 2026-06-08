<?php

use App\Events\Billing\InvoiceGenerated;
use App\Events\Billing\PaymentReceived;
use App\Jobs\Admin\PublishCollectionJob;
use App\Mail\Admin\BillingInvoiceMail;
use App\Mail\SendInvoiceMail;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Property;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Models\UserProfile;
use App\Notifications\Admin\InvoiceGeneratedNotification;
use App\Notifications\Admin\PaymentReceivedNotification;
use App\Notifications\Resident\CollectionReminderNotification;
use App\Notifications\Resident\NewCollectionNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('a pending invoice is automatically generated when a resident subscription is expiring in 4 days', function () {
    // 1. Setup role and estate
    Role::create(['name' => 'resident']);
    $estate = Estate::factory()->create();

    // Set charge type to 'residents' to require individual billing
    $estate->settings()->update([
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 5,
    ]);

    // Create a plan and assign subscription record to the estate
    $plan = Plan::factory()->create(['price' => 15000]);
    $estateSub = EstateSubscription::create([
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
        'next_billing_date' => now()->addMonth(),
    ]);

    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    // Create a resident subscription expiring in 4 days
    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'trial',
        'trial_ends_at' => now()->addDays(4),
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->addDays(4),
    ]);

    // Ensure no invoice exists initially
    expect(Invoice::where('user_id', $resident->id)->count())->toBe(0);

    // 2. Act: visit the billing index
    $response = $this->actingAs($resident)
        ->get(route('resident.billing.index'));

    $response->assertOk();

    // 3. Assert: a pending invoice is created for the plan amount
    expect(Invoice::where('user_id', $resident->id)->count())->toBe(1);

    $invoice = Invoice::where('user_id', $resident->id)->first();
    expect($invoice->amount)->toBe(15000);
    expect($invoice->status)->toBe('pending');
});

test('resident invoice generation and payment notifications do not go to estate admins', function () {
    // 1. Setup roles, estate, admin, resident
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $estate = Estate::factory()->create();

    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole($adminRole);
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    $resident = User::factory()->create();
    $resident->assignRole($residentRole);
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 15000]);
    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-RES-123',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'due_date' => now()->addDays(7),
        'status' => 'pending',
    ]);

    Mail::fake();
    Notification::fake();

    // 2. Dispatch InvoiceGenerated event
    InvoiceGenerated::dispatch($invoice);

    // Assert that SendInvoiceMail and BillingInvoiceMail were not sent
    Mail::assertNotSent(SendInvoiceMail::class);
    Mail::assertNotSent(BillingInvoiceMail::class);

    // Assert that InvoiceGeneratedNotification was not sent to the admin
    Notification::assertNotSentTo($admin, InvoiceGeneratedNotification::class);

    // 3. Dispatch PaymentReceived event
    PaymentReceived::dispatch($invoice);

    // Assert that SendInvoiceMail and PaymentReceivedNotification were not sent to admin/estate
    Mail::assertNotSent(SendInvoiceMail::class);
    Notification::assertNotSentTo($admin, PaymentReceivedNotification::class);
});

test('estate-wide invoice generation and payment notifications go to estate admins', function () {
    // 1. Setup roles, estate, admin
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $estate = Estate::factory()->create(['email' => 'estate@example.com']);

    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole($adminRole);
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    $plan = Plan::factory()->create(['price' => 15000]);
    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => null,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-EST-123',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'due_date' => now()->addDays(7),
        'status' => 'pending',
    ]);

    Mail::fake();
    Notification::fake();

    // 2. Dispatch InvoiceGenerated event
    InvoiceGenerated::dispatch($invoice);

    // Assert that BillingInvoiceMail was sent to the admin, but SendInvoiceMail was not (since it's sent on payment)
    Mail::assertSent(BillingInvoiceMail::class, function ($mail) use ($admin) {
        return $mail->hasTo($admin->email);
    });
    Mail::assertNotSent(SendInvoiceMail::class);

    // Assert that InvoiceGeneratedNotification was sent to the admin
    Notification::assertSentTo($admin, InvoiceGeneratedNotification::class);

    // Reset fakes
    Mail::fake();
    Notification::fake();

    // 3. Dispatch PaymentReceived event
    PaymentReceived::dispatch($invoice);

    // Assert that SendInvoiceMail was queued to the estate email and PaymentReceivedNotification was sent
    Mail::assertQueued(SendInvoiceMail::class, function ($mail) use ($estate) {
        return $mail->hasTo($estate->email);
    });
    Notification::assertSentTo($admin, PaymentReceivedNotification::class);
});

test('property owners can create recurring collections successfully', function () {
    // 1. Setup role, estate, and property owner
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $ownerRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    $estate = Estate::factory()->create();
    $owner = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $owner->assignRole([$residentRole, $ownerRole]);
    $estate->users()->attach($owner->id, ['status' => 'accepted']);
    $owner->profile()->updateOrCreate([], [
        'paystack_subaccount_code' => 'ACCT_test123',
    ]);

    // Create resident managed by this property owner
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $resident = User::factory()->create();
    $resident->assignRole($residentRole);
    $estate->users()->attach($resident->id, ['status' => 'accepted']);
    UserProfile::create([
        'user_id' => $resident->id,
        'property_owner_id' => $owner->id,
    ]);

    // 2. Act: Post to the store route as the property owner
    $response = $this->actingAs($owner)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->post(route('resident.property-owner.collections.store'), [
            'name' => 'Monthly Rent Levy',
            'description' => 'Test monthly property rent collection',
            'amount' => 60000,
            'billing_type' => 'recurring',
            'recurring_interval' => 'monthly',
            'start_date' => now()->toDateString(),
            'due_day' => 5,
            'grace_days' => 2,
            'late_fee' => 1500,
            'applies_to' => 'all',
        ]);

    // 3. Assert redirect and database entry
    $response->assertRedirect(route('resident.property-owner.collections.index'));

    $this->assertDatabaseHas('collections', [
        'name' => 'Monthly Rent Levy',
        'amount' => 60000,
        'billing_type' => 'recurring',
        'recurring_interval' => 'monthly',
        'due_day' => 5,
        'grace_days' => 2,
        'late_fee' => 1500,
        'created_by' => $owner->id,
    ]);
});

test('property owners can create collections and include themselves in the assignments', function () {
    // 1. Setup role, estate, and property owner
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $ownerRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    $estate = Estate::factory()->create();
    $owner = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $owner->assignRole([$residentRole, $ownerRole]);
    $estate->users()->attach($owner->id, ['status' => 'accepted']);
    $owner->profile()->updateOrCreate([], [
        'paystack_subaccount_code' => 'ACCT_test123',
    ]);

    // Create resident managed by this property owner
    $resident = User::factory()->create();
    $resident->assignRole($residentRole);
    $estate->users()->attach($resident->id, ['status' => 'accepted']);
    UserProfile::create([
        'user_id' => $resident->id,
        'property_owner_id' => $owner->id,
    ]);

    // 2. Act: Post to the store route with include_creator = true
    $response = $this->actingAs($owner)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->post(route('resident.property-owner.collections.store'), [
            'name' => 'Estate Security Levy',
            'description' => 'Levy for securing estate gates',
            'amount' => 25000,
            'billing_type' => 'one_time',
            'due_at' => now()->addDays(10)->toDateString(),
            'applies_to' => 'all',
            'include_creator' => true,
        ]);

    $response->assertRedirect(route('resident.property-owner.collections.index'));

    $this->assertDatabaseHas('collections', [
        'name' => 'Estate Security Levy',
        'include_creator' => true,
        'created_by' => $owner->id,
    ]);

    // Retrieve created collection
    $collection = Collection::where('name', 'Estate Security Levy')->firstOrFail();

    // 3. Dispatch the publishing job
    PublishCollectionJob::dispatchSync($collection->id);

    // 4. Assert: BOTH the resident and the property owner (creator) get assigned the bill
    $this->assertDatabaseHas('collection_assignments', [
        'collection_id' => $collection->id,
        'user_id' => $resident->id,
        'amount_due' => 25000,
    ]);

    $this->assertDatabaseHas('collection_assignments', [
        'collection_id' => $collection->id,
        'user_id' => $owner->id,
        'amount_due' => 25000,
    ]);
});

test('collection notifications and emails reflect property owner and house name details', function () {
    // 1. Setup role, estate, property, owner, resident
    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $ownerRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    $estate = Estate::factory()->create(['name' => 'Sunset Valley']);
    $owner = User::factory()->create(['name' => 'Mr. Landlord']);

    setPermissionsTeamId($estate->id);
    $owner->assignRole([$residentRole, $ownerRole]);
    $estate->users()->attach($owner->id, ['status' => 'accepted']);

    $property = Property::create([
        'estate_id' => $estate->id,
        'property_owner_id' => $owner->id,
        'name' => 'Villa 45',
    ]);

    $resident = User::factory()->create(['name' => 'Alice Resident']);
    $resident->assignRole($residentRole);
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    UserProfile::create([
        'user_id' => $resident->id,
        'property_owner_id' => $owner->id,
        'property_id' => $property->id,
    ]);

    $collection = Collection::create([
        'estate_id' => $estate->id,
        'name' => 'Utility Bill',
        'description' => 'Power and water bill',
        'amount' => 15000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'created_by' => $owner->id,
    ]);

    $assignment = CollectionAssignment::create([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 15000,
        'amount_paid' => 0,
        'status' => 'pending',
        'due_date' => now()->addDays(5),
    ]);

    // Test NewCollectionNotification
    $notification = new NewCollectionNotification($assignment);

    // Test toArray (database/broadcast/fcm array payload)
    $arrayData = $notification->toArray($resident);
    expect($arrayData['title'])->toBe('New House Bill');
    expect($arrayData['message'])->toContain('Utility Bill');
    expect($arrayData['message'])->toContain('by your property owner (Mr. Landlord)');
    expect($arrayData['message'])->toContain('for your house (Villa 45)');
    expect($arrayData['message'])->toContain('not the estate');
    expect($arrayData['action_url'])->toBe(route('resident.collections.show', $assignment, false));

    // Test toMail
    $mailMessage = $notification->toMail($resident);
    expect($mailMessage->subject)->toBe('New House Bill: Utility Bill');

    $viewData = $mailMessage->viewData;
    expect($viewData['isPropertyOwner'])->toBeTrue();
    expect($viewData['ownerName'])->toBe('Mr. Landlord');
    expect($viewData['propertyName'])->toBe('Villa 45');

    // Test CollectionReminderNotification
    $reminder = new CollectionReminderNotification($assignment);

    // Test toArray
    $reminderArray = $reminder->toArray($resident);
    expect($reminderArray['title'])->toBe('House Bill Reminder');
    expect($reminderArray['message'])->toContain('due to your property owner (Mr. Landlord)');
    expect($reminderArray['message'])->toContain('for your house (Villa 45)');
    expect($reminderArray['message'])->toContain('not the estate');

    // Test toMail
    $reminderMail = $reminder->toMail($resident);
    expect($reminderMail->subject)->toBe('House Bill Reminder: Utility Bill');
});
