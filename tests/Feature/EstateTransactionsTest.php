<?php

use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateTransaction;
use App\Models\EstateTransactionAudit;
use App\Models\Payment;
use App\Models\User;
use App\Services\Ledger\LedgerService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

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
        );
});

it('denies access to users without transactions.view permission', function () {
    $user = User::factory()->create();
    setPermissionsTeamId($this->estate->id);

    $role = \Spatie\Permission\Models\Role::firstOrCreate([
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
