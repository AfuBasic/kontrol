<?php

use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\TransactionOverviewService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(now()->startOfWeek()->addDays(2)->setTime(14, 30)); // Wednesday 14:30

    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($this->estate->id);

    $this->pay = fn (string $key, int $amount, $when, array $extra = []) => app(LedgerService::class)->record(array_merge([
        'idempotency_key' => $key,
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => $amount,
        'status' => TransactionStatus::Success,
        'paid_at' => $when,
    ], $extra));

    $this->insights = fn () => app(TransactionOverviewService::class)->insights($this->estate);
});

it('compares the last 30 days of collections with the 30 before', function () {
    ($this->pay)('now_1', 300000, now()->subDays(2));
    ($this->pay)('now_2', 100000, now()->subDays(20));
    ($this->pay)('prev_1', 200000, now()->subDays(40));
    ($this->pay)('too_old', 900000, now()->subDays(75));

    $collected = ($this->insights)()['pulse']['collected'];

    expect($collected['value'])->toBe(400000)
        ->and($collected['previous'])->toBe(200000)
        ->and($collected['delta_pct'])->toBe(100.0)
        ->and($collected['spark'])->toHaveCount(30)
        ->and(array_sum($collected['spark']))->toBe(400000);
});

it('has no percentage change when there was nothing to compare against', function () {
    ($this->pay)('only_now', 100000, now()->subDay());

    expect(($this->insights)()['pulse']['collected']['delta_pct'])->toBeNull();
});

it('works out refunds and the success rate', function () {
    ($this->pay)('in_a', 500000, now()->subDay());
    ($this->pay)('in_b', 500000, now()->subDays(2));
    ($this->pay)('refund', 100000, now()->subDay(), ['type' => TransactionType::Refund, 'direction' => TransactionDirection::Debit]);
    ($this->pay)('failed', 500000, null, ['status' => TransactionStatus::Failed, 'type' => TransactionType::FailedPayment, 'failed_at' => now()->subDay()]);

    $pulse = ($this->insights)()['pulse'];

    expect($pulse['refunded']['value'])->toBe(100000)
        ->and($pulse['refunded']['rate_pct'])->toBe(10.0)
        ->and($pulse['success_rate']['succeeded'])->toBe(2)
        ->and($pulse['success_rate']['failed'])->toBe(1)
        ->and($pulse['success_rate']['pct'])->toBe(66.7);
});

it('reports what is still owed and how much of it is late, ranked by outstanding', function () {
    $big = Collection::factory()->create(['estate_id' => $this->estate->id, 'created_by' => $this->admin->id, 'name' => 'Service charge']);
    $small = Collection::factory()->create(['estate_id' => $this->estate->id, 'created_by' => $this->admin->id, 'name' => 'Security levy']);

    $assign = fn (Collection $c, int $due, int $paid, string $status, string $dueDate) => CollectionAssignment::factory()->create([
        'collection_id' => $c->id, 'estate_id' => $this->estate->id, 'user_id' => $this->admin->id,
        'amount_due' => $due, 'amount_paid' => $paid, 'status' => $status, 'due_date' => $dueDate,
    ]);

    $assign($big, 1000000, 250000, 'overdue', now()->subDays(10)->toDateString());
    $assign($big, 1000000, 0, 'pending', now()->addDays(10)->toDateString());
    $assign($small, 100000, 100000, 'paid', now()->subDays(5)->toDateString());
    $assign($small, 100000, 20000, 'pending', now()->addDays(3)->toDateString());

    $insights = ($this->insights)();

    expect($insights['pulse']['outstanding'])->toBe(['value' => 750000 + 1000000 + 80000, 'overdue' => 750000])
        ->and(array_column($insights['collections'], 'name'))->toBe(['Service charge', 'Security levy'])
        ->and($insights['collections'][0])->toMatchArray(['due' => 2000000, 'paid' => 250000]);
});

it('shows when residents pay by weekday and time of day', function () {
    ($this->pay)('wed_1', 100000, now()->setTime(14, 5));  // Wednesday, 12:00-16:00 block
    ($this->pay)('wed_2', 100000, now()->setTime(15, 59)); // same block
    ($this->pay)('mon', 100000, now()->startOfWeek()->setTime(7, 0)); // Monday 04:00-08:00 block

    $rhythm = ($this->insights)()['rhythm'];

    expect($rhythm['matrix'][2][3])->toBe(2)
        ->and($rhythm['matrix'][0][1])->toBe(1)
        ->and($rhythm['max'])->toBe(2);
});

it('returns every section the page needs, and the page still renders', function () {
    ($this->pay)('visible', 100000, now()->subDay());

    $this->actingAs($this->admin)->get(route('admin.transactions.index'))->assertOk();

    expect(($this->insights)())->toHaveKeys(['pulse', 'flow', 'collections', 'methods', 'rhythm']);
});

it('copes with an estate that has no activity at all', function () {
    $insights = ($this->insights)();

    expect($insights['pulse']['collected']['value'])->toBe(0)
        ->and($insights['pulse']['success_rate']['pct'])->toBeNull()
        ->and($insights['collections'])->toBe([])
        ->and($insights['rhythm']['max'])->toBe(0)
        ->and($insights['flow'])->toHaveCount(30);
});
