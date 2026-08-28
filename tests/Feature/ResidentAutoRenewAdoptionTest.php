<?php

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Notifications\Resident\AutoRenewAdoptionNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
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

function createResidentWithEstate(): array
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

    $plan = Plan::factory()->create(['price' => 15000, 'billing_interval' => 'monthly', 'is_active' => true]);

    return [$estate, $resident, $plan];
}

test('resident with saved card and auto_renew off is eligible for auto-renew suggestion', function () {
    [$estate, $resident, $plan] = createResidentWithEstate();

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
        'auto_renew_enabled' => false,
        'auto_renew_opted_out' => false,
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Index')
        ->where('subscription.has_saved_card', true)
        ->where('subscription.can_auto_renew', true)
        ->where('subscription.show_auto_renew_suggestion', true)
        ->where('subscription.auto_renew_enabled', false)
        ->where('subscription.payment_method.brand', 'visa')
        ->where('subscription.payment_method.last4', '4081')
    );
});

test('resident without saved card does not see auto-renew suggestion', function () {
    [$estate, $resident, $plan] = createResidentWithEstate();

    ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now()->startOfMonth(),
        'current_period_end' => now()->addDays(20),
        'paystack_authorization_code' => null,
        'auto_renew_enabled' => false,
        'auto_renew_opted_out' => false,
    ]);

    $response = $this->actingAs($resident)->get(route('resident.billing.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Index')
        ->where('subscription.has_saved_card', false)
        ->where('subscription.can_auto_renew', false)
        ->where('subscription.show_auto_renew_suggestion', false)
    );
});

test('resident with auto_renew enabled does not see auto-renew suggestion', function () {
    [$estate, $resident, $plan] = createResidentWithEstate();

    ResidentSubscription::create([
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

    $response = $this->actingAs($resident)->get(route('resident.billing.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Resident/Billing/Index')
        ->where('subscription.auto_renew_enabled', true)
        ->where('subscription.can_auto_renew', false)
        ->where('subscription.show_auto_renew_suggestion', false)
    );
});

test('dismissed auto-renew suggestion suppresses prompt for current billing period', function () {
    [$estate, $resident, $plan] = createResidentWithEstate();

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
        'auto_renew_enabled' => false,
        'auto_renew_opted_out' => false,
    ]);

    // Dismiss suggestion
    $dismissResponse = $this->actingAs($resident)->post(route('resident.billing.auto-renew.dismiss'));
    $dismissResponse->assertRedirect();

    $monthKey = $subscription->current_period_start->format('Y-m');
    expect(Cache::get("auto_renew_dismissed:{$subscription->id}:{$monthKey}"))->toBeTrue();

    // Check billing index
    $response = $this->actingAs($resident)->get(route('resident.billing.index'));
    $response->assertInertia(fn (Assert $page) => $page
        ->where('subscription.show_auto_renew_suggestion', false)
        ->where('subscription.can_auto_renew', true)
    );
});

test('resident can explicitly enable and disable auto-renew', function () {
    [$estate, $resident, $plan] = createResidentWithEstate();

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
        'auto_renew_enabled' => false,
        'auto_renew_opted_out' => false,
    ]);

    // Enable auto-renew
    $enableResponse = $this->actingAs($resident)->post(route('resident.billing.auto-renew.enable'));
    $enableResponse->assertRedirect();
    expect($subscription->fresh()->auto_renew_enabled)->toBeTrue();
    expect($subscription->fresh()->auto_renew_opted_out)->toBeFalse();

    // Disable auto-renew
    $disableResponse = $this->actingAs($resident)->post(route('resident.billing.auto-renew.disable'));
    $disableResponse->assertRedirect();
    expect($subscription->fresh()->auto_renew_enabled)->toBeFalse();
    expect($subscription->fresh()->auto_renew_opted_out)->toBeTrue();
});

test('send auto renew reminders command sends push only to eligible residents and deduplicates', function () {
    Notification::fake();

    [$estate, $resident, $plan] = createResidentWithEstate();

    // Eligible subscription (paid 4 days ago)
    $subscription = ResidentSubscription::create([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now()->subDays(4),
        'current_period_end' => now()->addDays(26),
        'last_paid_at' => now()->subDays(4),
        'paystack_authorization_code' => 'AUTH_test123',
        'card_brand' => 'visa',
        'card_last4' => '4081',
        'auto_renew_enabled' => false,
        'auto_renew_opted_out' => false,
    ]);

    $this->artisan('kontrol:send-auto-renew-reminders')
        ->assertSuccessful();

    Notification::assertSentTo($resident, AutoRenewAdoptionNotification::class);
});
