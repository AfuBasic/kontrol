<?php

use App\Enums\AssignmentScope;
use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\AdministrativeAssignment;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateTransaction;
use App\Models\EstateTransactionAudit;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\Zone;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\TransactionOverviewService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($this->estate->id);
});

it('renders the transactions ledger page for authorized admins', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Transactions/Index')
            ->has('transactions')
            ->has('filters')
            ->has('permissions')
            ->has('hasTransactions')
        );
});

it('denies access to users without transactions.view permission', function () {
    $user = User::factory()->create();
    setPermissionsTeamId($this->estate->id);

    $role = Role::firstOrCreate([
        'name' => 'estate-manager',
        'estate_id' => $this->estate->id,
        'guard_name' => 'web',
    ]);
    $role->syncPermissions(['residents.view']);

    $user->assignRole($role);
    $this->estate->users()->attach($user->id, ['status' => 'accepted']);

    $this->actingAs($user)
        ->get(route('admin.transactions.index'))
        ->assertForbidden();
});

it('records collection payments in the ledger via observer', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'amount_due' => 5000,
        'amount_paid' => 0,
    ]);

    Payment::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'collection_assignment_id' => $assignment->id,
        'amount' => 5000,
        'provider' => 'paystack',
        'reference' => 'COLL-TEST-001',
        'status' => 'success',
        'paid_at' => now(),
    ]);

    $transaction = EstateTransaction::query()->where('gateway_reference', 'COLL-TEST-001')->first();

    expect($transaction)->not->toBeNull()
        ->and($transaction->amount)->toBe(500000)
        ->and($transaction->type)->toBe(TransactionType::CollectionPayment)
        ->and($transaction->status)->toBe(TransactionStatus::Success)
        ->and($transaction->direction)->toBe(TransactionDirection::Credit);
});

it('creates audit entries when ledger records are created', function () {
    $ledger = app(LedgerService::class);

    $transaction = $ledger->record([
        'idempotency_key' => 'test_audit_1',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::ManualAdjustment,
        'direction' => TransactionDirection::Debit,
        'amount' => 100000,
        'status' => TransactionStatus::Success,
        'description' => 'Duplicate payment correction',
        'reason' => 'Duplicate Payment',
    ]);

    expect(EstateTransactionAudit::query()->where('estate_transaction_id', $transaction->id)->count())->toBe(1);
});

it('issues refunds and records related ledger entries', function () {
    $ledger = app(LedgerService::class);

    $parent = $ledger->record([
        'idempotency_key' => 'parent_refund_test',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 250000,
        'status' => TransactionStatus::Success,
    ]);

    $this->actingAs($this->admin);

    $refund = $ledger->issueRefund($parent, 250000, 'Approved by Estate Manager', $this->admin);

    expect($refund->type)->toBe(TransactionType::Refund)
        ->and($refund->parent_id)->toBe($parent->id)
        ->and($parent->fresh()->status)->toBe(TransactionStatus::Reversed);
});

it('rejects export when no transactions exist', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.transactions.export'))
        ->assertStatus(422);
});

it('auto-syncs legacy payments into the ledger on first visit', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
    ]);

    Payment::factory()->create([
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'collection_assignment_id' => $assignment->id,
        'amount' => 5000,
        'status' => 'success',
    ]);

    // Simulate legacy state: payments exist but the ledger table was never backfilled.
    EstateTransaction::query()->delete();

    expect(EstateTransaction::count())->toBe(0);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index'))
        ->assertOk();

    expect(EstateTransaction::count())->toBeGreaterThan(0);
});

it('orders activity timeline by payment date not ledger insert date', function () {
    $ledger = app(LedgerService::class);

    $older = $ledger->record([
        'idempotency_key' => 'timeline_older',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 100000,
        'status' => TransactionStatus::Success,
        'paid_at' => now()->subDays(10),
    ]);

    $newer = $ledger->record([
        'idempotency_key' => 'timeline_newer',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 200000,
        'status' => TransactionStatus::Success,
        'paid_at' => now()->subDay(),
    ]);

    $older->update(['created_at' => now()]);
    $newer->update(['created_at' => now()]);

    $timeline = app(TransactionOverviewService::class)->timeline($this->estate);

    expect($timeline->first()['id'])->toBe($newer->ulid)
        ->and($timeline->first()['occurred_at'])->toBe($newer->paid_at?->toIso8601String());
});

it('excludes pending payments from the activity timeline', function () {
    $ledger = app(LedgerService::class);

    $ledger->record([
        'idempotency_key' => 'pending_timeline',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::PendingPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 500000,
        'status' => TransactionStatus::Pending,
    ]);

    $completed = $ledger->record([
        'idempotency_key' => 'completed_timeline',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 500000,
        'status' => TransactionStatus::Success,
        'paid_at' => now()->subDays(3),
    ]);

    $timeline = app(TransactionOverviewService::class)->timeline($this->estate);

    expect($timeline)->toHaveCount(1)
        ->and($timeline->first()['id'])->toBe($completed->ulid);
});

it('records offline payments from the transactions page', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'amount_due' => 10000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.transactions.offline-payment'), [
            'assignment_id' => $assignment->id,
            'amount' => 2500,
            'method' => 'bank_transfer',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(EstateTransaction::query()->where('estate_id', $this->estate->id)->count())->toBe(1)
        ->and($assignment->fresh()->amount_paid)->toBe(2500)
        ->and($assignment->fresh()->status)->toBe('partial');
});

it('rejects offline payments above the assignment remaining balance', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
    ]);

    $assignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'amount_due' => 10000,
        'amount_paid' => 2500,
        'status' => 'partial',
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.transactions.offline-payment'), [
            'assignment_id' => $assignment->id,
            'amount' => 8000,
            'method' => 'bank_transfer',
        ])
        ->assertSessionHasErrors('amount');

    expect($assignment->fresh()->amount_paid)->toBe(2500);
});

it('scopes offline payment assignment options and submission to the active zone', function () {
    $northZone = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $southZone = Zone::factory()->create(['estate_id' => $this->estate->id]);

    $northResident = User::factory()->create(['name' => 'North Resident']);
    $southResident = User::factory()->create(['name' => 'South Resident']);

    setPermissionsTeamId($this->estate->id);
    $northResident->assignRole('resident');
    $southResident->assignRole('resident');
    $this->estate->users()->attach($northResident->id, ['status' => 'accepted', 'zone_id' => $northZone->id]);
    $this->estate->users()->attach($southResident->id, ['status' => 'accepted', 'zone_id' => $southZone->id]);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
    ]);

    $northAssignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $northResident->id,
        'amount_due' => 10000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $southAssignment = CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $southResident->id,
        'amount_due' => 10000,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $zoneAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => Role::where('name', 'admin')->firstOrFail()->id,
        'scope_type' => AssignmentScope::Zone,
        'zone_id' => $northZone->id,
        'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $zoneAssignment->id])
        ->get(route('admin.transactions.index'))
        ->assertOk()
        ->assertInertia(function ($page) use ($northAssignment, $southAssignment) {
            $page->component('Admin/Transactions/Index')
                ->where('recordableAssignments', function ($assignments) use ($northAssignment, $southAssignment): bool {
                    $ids = collect($assignments)->pluck('id');

                    return $ids->contains($northAssignment->id)
                        && ! $ids->contains($southAssignment->id);
                });
        });

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $zoneAssignment->id])
        ->post(route('admin.transactions.offline-payment'), [
            'assignment_id' => $southAssignment->id,
            'amount' => 2500,
            'method' => 'bank_transfer',
        ])
        ->assertSessionHasErrors('assignment_id');

    expect($southAssignment->fresh()->amount_paid)->toBe(0);
});

it('exports transactions for users with export permission', function () {
    EstateTransaction::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
    ]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.transactions.export'));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
});

it('denies export without permission', function () {
    $user = User::factory()->create();
    setPermissionsTeamId($this->estate->id);

    Permission::findOrCreate('transactions.view', 'web');
    Permission::findOrCreate('transactions.export', 'web');

    $user->givePermissionTo('transactions.view');
    $this->estate->users()->attach($user->id, ['status' => 'accepted']);

    $this->actingAs($user)
        ->get(route('admin.transactions.export'))
        ->assertForbidden();
});

it('returns transaction detail as json for drawer requests', function () {
    $transaction = EstateTransaction::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.transactions.show', $transaction))
        ->assertOk()
        ->assertJsonPath('transaction.ulid', $transaction->ulid)
        ->assertJsonPath('transaction.reference_number', $transaction->reference_number);
});

it('excludes subscription transactions from the admin ledger', function () {
    $ledger = app(LedgerService::class);

    $collectionPayment = $ledger->record([
        'idempotency_key' => 'sub_exclude_collection',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 100000,
        'status' => TransactionStatus::Success,
    ]);

    $subscriptionPayment = $ledger->record([
        'idempotency_key' => 'sub_exclude_subscription',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::SubscriptionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 500000,
        'status' => TransactionStatus::Success,
    ]);

    $invoice = Invoice::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
    ]);

    $invoicePayment = $ledger->record([
        'idempotency_key' => 'sub_exclude_invoice',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'invoice_id' => $invoice->id,
        'type' => TransactionType::CardPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 300000,
        'status' => TransactionStatus::Success,
    ]);

    $overview = app(TransactionOverviewService::class);
    $results = $overview->query($this->estate)->get();

    expect($results)->toHaveCount(1)
        ->and($results->first()->id)->toBe($collectionPayment->id)
        ->and($results->pluck('type')->contains(TransactionType::SubscriptionPayment))->toBeFalse()
        ->and($results->pluck('id')->contains($invoicePayment->id))->toBeFalse();

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('filterOptions.types')
            ->where('filterOptions.types', fn ($types) => ! collect($types)->contains('value', TransactionType::SubscriptionPayment->value))
        );
});
