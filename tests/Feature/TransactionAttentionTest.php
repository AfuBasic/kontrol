<?php

use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateTransaction;
use App\Models\User;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\TransactionOverviewService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

    $this->record = fn (string $key, array $attrs): EstateTransaction => app(LedgerService::class)->record(array_merge([
        'idempotency_key' => $key,
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 100000,
        'status' => TransactionStatus::Success,
        'paid_at' => now(),
    ], $attrs));

    $this->attention = fn () => app(TransactionOverviewService::class)->attention($this->estate);
});

it('counts a recent failed payment that was never made good', function () {
    ($this->record)('failed_unpaid', ['status' => TransactionStatus::Failed, 'type' => TransactionType::FailedPayment, 'paid_at' => null, 'failed_at' => now()->subDay(), 'amount' => 250000]);

    expect(($this->attention)()['failed'])->toBe(['count' => 1, 'amount' => 250000]);
});

it('stops counting a failure once the same resident later pays the same charge', function () {
    $collection = Collection::factory()->create(['estate_id' => $this->estate->id, 'created_by' => $this->admin->id]);
    $assignment = CollectionAssignment::factory()->create(['collection_id' => $collection->id, 'user_id' => $this->admin->id]);

    ($this->record)('failed_then_paid', [
        'status' => TransactionStatus::Failed, 'type' => TransactionType::FailedPayment, 'paid_at' => null,
        'failed_at' => now()->subHours(5), 'collection_assignment_id' => $assignment->id, 'collection_id' => $collection->id,
    ]);
    expect(($this->attention)()['failed']['count'])->toBe(1);

    ($this->record)('paid_after', ['collection_assignment_id' => $assignment->id, 'collection_id' => $collection->id, 'paid_at' => now()->subHour()]);

    expect(($this->attention)()['failed']['count'])->toBe(0);
});

it('ignores failures older than a week', function () {
    ($this->record)('old_failed', ['status' => TransactionStatus::Failed, 'type' => TransactionType::FailedPayment, 'paid_at' => null, 'failed_at' => now()->subDays(9)]);

    expect(($this->attention)()['failed']['count'])->toBe(0);
});

it('flags a payment that has sat pending for hours, not one that just started', function () {
    $stuck = ($this->record)('stuck', ['status' => TransactionStatus::Pending, 'type' => TransactionType::PendingPayment, 'paid_at' => null]);
    $stuck->forceFill(['created_at' => now()->subHours(3)])->save();
    ($this->record)('fresh', ['status' => TransactionStatus::Pending, 'type' => TransactionType::PendingPayment, 'paid_at' => null]);

    expect(($this->attention)()['stuck']['count'])->toBe(1);
});

it('lists exactly what the strip counts when opened as a filter', function () {
    ($this->record)('f1', ['status' => TransactionStatus::Failed, 'type' => TransactionType::FailedPayment, 'paid_at' => null, 'failed_at' => now()->subDay()]);
    ($this->record)('ok', []);

    $json = $this->actingAs($this->admin)->getJson(route('admin.transactions.timeline', ['attention' => 'failed']))->assertOk()->json();

    expect($json['entries'])->toHaveCount(1)->and($json['entries'][0]['status'])->toBe('failed');

    $this->actingAs($this->admin)->get(route('admin.transactions.index', ['attention' => 'failed']))
        ->assertInertia(fn ($page) => $page->where('transactions.total', 1));
});

it('shows nothing for an unknown attention filter instead of everything', function () {
    ($this->record)('any', []);

    $this->actingAs($this->admin)->getJson(route('admin.transactions.timeline', ['attention' => 'bogus']))
        ->assertOk()->assertJsonCount(0, 'entries');
});
