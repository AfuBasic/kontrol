<?php

use App\Events\Billing\InvoiceGenerated;
use App\Events\Billing\PaymentReceived;
use App\Mail\Admin\BillingInvoiceMail;
use App\Mail\SendInvoiceMail;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Notifications\Admin\InvoiceGeneratedNotification;
use App\Notifications\Admin\PaymentReceivedNotification;
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
