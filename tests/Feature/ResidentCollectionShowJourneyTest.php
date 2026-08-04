<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);
});

function makeResidentBillContext(array $assignmentOverrides = [], array $collectionOverrides = []): array
{
    $estate = Estate::factory()->create();
    setPermissionsTeamId($estate->id);

    EstateSubscription::create([
        'estate_id' => $estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create(array_merge([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'name' => 'Service Charge',
        'description' => 'Monthly service charge',
        'amount' => 100000,
        'billing_type' => 'one_time',
        'late_fee' => 0,
    ], $collectionOverrides));

    $assignment = CollectionAssignment::factory()->create(array_merge([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 100000,
        'amount_paid' => 0,
        'status' => 'pending',
        'due_date' => now()->addDays(14)->toDateString(),
    ], $assignmentOverrides));

    return compact('estate', 'resident', 'admin', 'collection', 'assignment');
}

function asResidentWithEstate(User $resident, Estate $estate): mixed
{
    session(['estate_id' => $estate->id]);

    return test()->actingAs($resident)->withHeaders(['X-Bypass-Mobile-Restrict' => 'true']);
}

it('renders the payment journey for an unpaid bill', function () {
    ['resident' => $resident, 'estate' => $estate, 'assignment' => $assignment] = makeResidentBillContext();

    asResidentWithEstate($resident, $estate)
        ->get(route('resident.collections.show', $assignment))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Resident/Collections/Show')
            ->has('assignment')
            ->has('journey')
            ->where('journey.status_label', 'Outstanding')
            ->where('journey.payment_count', 0)
            ->where('journey.total_paid', 0)
            ->where('journey.remaining_balance', 100000)
            ->where('journey.percentage_paid', 0)
            ->where('journey.original_amount', 100000)
            ->where('journey.total_outstanding', 100000)
            ->where('journey.contextual_insight', 'No payments have been made yet.')
            ->where('journey.cta_label', 'Pay ₦100,000')
            ->where('journey.payment_activity', [])
            ->has('journey.timeline', 2)
            ->where('journey.timeline.0.type', 'invoice_created')
            ->where('journey.timeline.1.type', 'balance_outstanding')
        );
});

it('builds partial payment journey with activity remaining balances and pay remaining cta', function () {
    ['resident' => $resident, 'estate' => $estate, 'assignment' => $assignment] = makeResidentBillContext([
        'amount_due' => 100000,
        'amount_paid' => 50000,
        'status' => 'partial',
    ]);

    Payment::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $assignment->estate_id,
        'collection_assignment_id' => $assignment->id,
        'amount' => 30000,
        'status' => 'success',
        'provider' => 'paystack',
        'reference' => 'COLL-TEST-1',
        'paid_at' => now()->subDays(2),
    ]);

    Payment::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $assignment->estate_id,
        'collection_assignment_id' => $assignment->id,
        'amount' => 20000,
        'status' => 'success',
        'provider' => 'paystack',
        'reference' => 'COLL-TEST-2',
        'paid_at' => now()->subDay(),
    ]);

    asResidentWithEstate($resident, $estate)
        ->get(route('resident.collections.show', $assignment))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Resident/Collections/Show')
            ->where('journey.status_label', 'Partially Paid')
            ->where('journey.payment_count', 2)
            ->where('journey.total_paid', 50000)
            ->where('journey.remaining_balance', 50000)
            ->where('journey.percentage_paid', 50)
            ->where('journey.cta_label', 'Pay Remaining ₦50,000')
            ->where('journey.contextual_insight', "You've settled 50% of this bill.")
            ->has('journey.payment_activity', 2)
            ->where('journey.payment_activity.0.sequence', 1)
            ->where('journey.payment_activity.0.amount', 30000)
            ->where('journey.payment_activity.0.remaining_balance_after', 70000)
            ->where('journey.payment_activity.1.sequence', 2)
            ->where('journey.payment_activity.1.amount', 20000)
            ->where('journey.payment_activity.1.remaining_balance_after', 50000)
            ->where('journey.timeline.0.type', 'invoice_created')
            ->where('journey.timeline.1.type', 'partial_payment')
            ->where('journey.timeline.2.type', 'partial_payment')
            ->where('journey.timeline.3.type', 'balance_outstanding')
        );
});

it('builds a fully settled journey with completion metadata', function () {
    ['resident' => $resident, 'estate' => $estate, 'assignment' => $assignment] = makeResidentBillContext([
        'amount_due' => 10000,
        'amount_paid' => 10000,
        'status' => 'paid',
        'paid_at' => now()->subHours(3),
    ]);

    Payment::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $assignment->estate_id,
        'collection_assignment_id' => $assignment->id,
        'amount' => 10000,
        'status' => 'success',
        'paid_at' => now()->subHours(3),
    ]);

    asResidentWithEstate($resident, $estate)
        ->get(route('resident.collections.show', $assignment))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Resident/Collections/Show')
            ->where('journey.status_label', 'Paid')
            ->where('journey.payment_count', 1)
            ->where('journey.remaining_balance', 0)
            ->where('journey.percentage_paid', 100)
            ->where('journey.cta_label', null)
            ->has('journey.completion_date')
            ->has('journey.timeline')
            ->where('journey.timeline.2.type', 'fully_settled')
        );
});

it('forbids other residents from viewing the bill journey', function () {
    ['estate' => $estate, 'assignment' => $assignment] = makeResidentBillContext();

    $intruder = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $intruder->assignRole('resident');
    $estate->users()->attach($intruder->id, ['status' => 'accepted']);

    asResidentWithEstate($intruder, $estate)
        ->get(route('resident.collections.show', $assignment))
        ->assertForbidden();
});
