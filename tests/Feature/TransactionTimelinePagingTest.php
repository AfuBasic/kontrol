<?php

use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
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
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    EstateSettings::forEstate($this->estate->id);

    // Payment i happened i hours ago, so id order and time order agree; some share an instant.
    $this->payments = collect(range(1, 30))->map(fn (int $i) => app(LedgerService::class)->record([
        'idempotency_key' => "paging_{$i}",
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 100000 + $i,
        'status' => TransactionStatus::Success,
        'paid_at' => now()->startOfHour()->subHours((int) ceil($i / 2)),
    ]));
});

it('pages the timeline with no repeats and no gaps, even when payments share a timestamp', function () {
    $service = app(TransactionOverviewService::class);

    $first = $service->timelinePage($this->estate, [], null, 25);
    $second = $service->timelinePage($this->estate, [], $first['next_cursor'], 25);

    $ids = $first['entries']->pluck('id')->merge($second['entries']->pluck('id'));

    expect($first['entries'])->toHaveCount(25)
        ->and($first['next_cursor'])->not->toBeNull()
        ->and($second['entries'])->toHaveCount(5)
        ->and($second['next_cursor'])->toBeNull()
        ->and($ids->unique())->toHaveCount(30)
        ->and($ids->all())->toEqualCanonicalizing($this->payments->pluck('ulid')->all());
});

it('keeps the next page stable when a newer payment arrives mid-scroll', function () {
    $service = app(TransactionOverviewService::class);
    $first = $service->timelinePage($this->estate, [], null, 25);

    app(LedgerService::class)->record([
        'idempotency_key' => 'paging_late',
        'estate_id' => $this->estate->id,
        'user_id' => $this->admin->id,
        'type' => TransactionType::CollectionPayment,
        'direction' => TransactionDirection::Credit,
        'amount' => 999999,
        'status' => TransactionStatus::Success,
        'paid_at' => now(),
    ]);

    $second = $service->timelinePage($this->estate, [], $first['next_cursor'], 25);

    expect($second['entries'])->toHaveCount(5)
        ->and($second['entries']->pluck('id')->intersect($first['entries']->pluck('id')))->toBeEmpty();
});

it('serves the next page over JSON for infinite scroll and ignores a malformed cursor', function () {
    $first = $this->actingAs($this->admin)->getJson(route('admin.transactions.timeline'))->assertOk()->json();

    expect($first['entries'])->toHaveCount(25)->and($first['next_cursor'])->toBeString();

    $second = $this->actingAs($this->admin)->getJson(route('admin.transactions.timeline', ['cursor' => $first['next_cursor']]))->assertOk()->json();

    expect($second['entries'])->toHaveCount(5)->and($second['next_cursor'])->toBeNull();

    $this->actingAs($this->admin)->getJson(route('admin.transactions.timeline', ['cursor' => 'not-a-cursor']))
        ->assertOk()
        ->assertJsonCount(25, 'entries');
});

it('reports how many payments were received today for the summary line', function () {
    $today = app(TransactionOverviewService::class)->todaySummary($this->estate);

    expect($today)->toHaveKeys(['payments_today', 'failed_today'])->and($today)->not->toHaveKey('refunds_today');
});
