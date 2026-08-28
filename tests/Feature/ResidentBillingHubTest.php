<?php

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident'], [
        'display_name' => 'Resident',
        'guard_name' => 'web',
        'is_system' => true,
    ]);
});

function createBillingResident(): array
{
    $estate = Estate::factory()->create();
    $estate->settings()->updateOrCreate([], ['charge_type' => 'residents']);

    $resident = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $role = Role::where('name', 'resident')->first();
    AdministrativeAssignment::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'scope_type' => 'estate',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create(['price' => 15000, 'billing_interval' => 'monthly', 'is_active' => true, 'visibility' => 'public']);

    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now()->startOfMonth(),
        'current_period_end' => now()->addDays(20),
        'paystack_authorization_code' => 'AUTH_test123',
        'card_brand' => 'visa',
        'card_last4' => '4081',
        'auto_renew_enabled' => true,
        'auto_renew_opted_out' => false,
    ]);

    return [$estate, $resident, $plan, $subscription];
}

test('billing hub page renders concise 3-destination dashboard without raw plans or invoice lists', function () {
    [$estate, $resident, $plan, $subscription] = createBillingResident();

    // Create a paid invoice
    Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-RES-101',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'status' => 'paid',
        'due_date' => now()->addDays(7),
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Index')
        ->has('subscription')
        ->where('subscription.has_saved_card', true)
        ->where('subscription.auto_renew_enabled', true)
        ->where('subscription.card_brand', 'visa')
        ->where('subscription.card_last4', '4081')
        ->where('subscription.plan_name', $plan->name)
        ->has('receiptSummary')
        ->where('receiptSummary.total_count', 1)
        ->where('receiptSummary.paid_count', 1)
        ->missing('plans')
        ->missing('recentInvoices')
    );
});

test('legacy query param section=renewal redirects to payment destination', function () {
    [$estate, $resident] = createBillingResident();

    $response = $this->actingAs($resident)->get(route('resident.billing.index', ['section' => 'renewal']));

    $response->assertRedirect(route('resident.billing.payment'));
});

test('legacy query param coupon redirects to subscription destination with coupon param', function () {
    [$estate, $resident] = createBillingResident();

    $response = $this->actingAs($resident)->get(route('resident.billing.index', ['coupon' => 'SAVE50']));

    $response->assertRedirect(route('resident.billing.subscription', ['coupon' => 'SAVE50']));
});

test('subscription sub-page renders subscription management and available plans', function () {
    [$estate, $resident, $plan] = createBillingResident();

    $response = $this->actingAs($resident)->get(route('resident.billing.subscription'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Subscription')
        ->has('subscription')
        ->has('plans')
        ->where('plans.0.id', $plan->id)
    );
});

test('payment sub-page renders saved payment methods and auto renewal controls', function () {
    [$estate, $resident, $plan, $subscription] = createBillingResident();

    $response = $this->actingAs($resident)->get(route('resident.billing.payment'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Payment')
        ->has('subscription')
        ->where('subscription.has_saved_card', true)
        ->where('subscription.auto_renew_enabled', true)
        ->where('subscription.card_brand', 'visa')
        ->where('subscription.card_last4', '4081')
    );
});

test('receipts sub-page renders paginated invoice history', function () {
    [$estate, $resident, $plan] = createBillingResident();

    Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-RES-202',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'status' => 'paid',
        'due_date' => now()->addDays(7),
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.receipts'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Receipts')
        ->has('recentInvoices.data', 1)
        ->where('recentInvoices.data.0.invoice_number', 'KTRL-RES-202')
    );
});

test('magic url generation supports specific destinations', function () {
    [$estate, $resident] = createBillingResident();

    // Default destination
    $defaultResponse = $this->actingAs($resident)->getJson(route('resident.billing.magic-url'));
    $defaultResponse->assertOk();
    expect($defaultResponse->json('magic_url'))->toContain('/auth/magic-login/');

    // Payment destination
    $paymentResponse = $this->actingAs($resident)->getJson(route('resident.billing.magic-url', ['destination' => 'payment']));
    $paymentResponse->assertOk();
    expect($paymentResponse->json('magic_url'))->toContain('/auth/magic-login/');

    // Subscription destination
    $subResponse = $this->actingAs($resident)->getJson(route('resident.billing.magic-url', ['destination' => 'subscription']));
    $subResponse->assertOk();
    expect($subResponse->json('magic_url'))->toContain('/auth/magic-login/');
});

test('resident can download receipt for paid invoice repeatedly', function () {
    [$estate, $resident, $plan] = createBillingResident();

    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-RES-999',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'status' => 'paid',
        'paid_at' => now(),
        'due_date' => now()->addDays(7),
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.receipts.download', $invoice));

    $response->assertOk();
    $response->assertHeader('content-disposition', 'attachment; filename="receipt-KTRL-RES-999.pdf"');
});

test('resident cannot download receipt for unpaid invoice', function () {
    [$estate, $resident, $plan] = createBillingResident();

    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-RES-998',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'status' => 'pending',
        'due_date' => now()->addDays(7),
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.receipts.download', $invoice));

    $response->assertForbidden();
});

test('resident cannot download another residents receipt', function () {
    [$estate, $resident, $plan] = createBillingResident();
    $otherResident = User::factory()->create();

    $invoice = Invoice::create([
        'estate_id' => $estate->id,
        'user_id' => $otherResident->id,
        'plan_id' => $plan->id,
        'invoice_number' => 'KTRL-RES-997',
        'amount' => 15000,
        'resident_count' => 1,
        'billing_period_start' => now(),
        'billing_period_end' => now()->addMonth(),
        'status' => 'paid',
        'due_date' => now()->addDays(7),
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.receipts.download', $invoice));

    $response->assertNotFound();
});
