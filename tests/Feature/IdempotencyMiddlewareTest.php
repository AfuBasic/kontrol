<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    $this->hits = 0;

    Route::middleware(['web', 'auth', 'idempotent'])->post('/_test/idempotent', function () {
        $this->hits++;

        return response()->json(['created' => $this->hits]);
    });

    Route::middleware(['web', 'auth', 'idempotent'])->post('/_test/idempotent-fails-first', function () {
        $this->hits++;

        return $this->hits === 1 ? response()->json(['error' => 'nope'], 422) : response()->json(['created' => $this->hits]);
    });

    $this->user = User::factory()->create();
    $this->send = fn (string $key = 'op_11111111-aaaa-bbbb-cccc-000000000001', string $uri = '/_test/idempotent', ?User $as = null) => $this
        ->actingAs($as ?? $this->user)
        ->postJson($uri, [], ['X-Idempotency-Key' => $key]);
});

it('answers a replay of something already done without doing it again', function () {
    ($this->send)()->assertOk()->assertJson(['created' => 1]);

    ($this->send)()->assertOk()->assertJson(['success' => true, 'duplicate' => true]);

    expect($this->hits)->toBe(1);
});

it('treats different stamps as different actions', function () {
    ($this->send)('op_11111111-aaaa-bbbb-cccc-000000000001');
    ($this->send)('op_11111111-aaaa-bbbb-cccc-000000000002');

    expect($this->hits)->toBe(2);
});

it('leaves requests without a stamp alone', function () {
    $this->actingAs($this->user)->postJson('/_test/idempotent');
    $this->actingAs($this->user)->postJson('/_test/idempotent');

    expect($this->hits)->toBe(2);
});

it('ignores a stamp that is not in the expected shape', function () {
    ($this->send)('short');
    ($this->send)('short');
    ($this->send)('has spaces and symbols !!!!!!!!!!');

    expect($this->hits)->toBe(3);
});

it('does not remember an attempt that failed, so the retry can still go through', function () {
    ($this->send)('op_11111111-aaaa-bbbb-cccc-000000000003', '/_test/idempotent-fails-first')->assertStatus(422);
    ($this->send)('op_11111111-aaaa-bbbb-cccc-000000000003', '/_test/idempotent-fails-first')->assertOk()->assertJson(['created' => 2]);
    ($this->send)('op_11111111-aaaa-bbbb-cccc-000000000003', '/_test/idempotent-fails-first')->assertJson(['duplicate' => true]);

    expect($this->hits)->toBe(2);
});

it('never lets one person\'s stamp answer for another person', function () {
    ($this->send)();
    ($this->send)('op_11111111-aaaa-bbbb-cccc-000000000001', '/_test/idempotent', User::factory()->create());

    expect($this->hits)->toBe(2);
});

it('asks the queue to come back while the first attempt is still running', function () {
    $key = 'op_11111111-aaaa-bbbb-cccc-000000000009';
    $fingerprint = hash('sha256', $this->user->id.'|POST|_test/idempotent|'.$key);
    Cache::put("idempotency:lock:{$fingerprint}", 1, 60);

    ($this->send)($key)->assertStatus(503)->assertJson(['retryable' => true]);

    expect($this->hits)->toBe(0);
});

it('is on every endpoint the offline queue replays', function () {
    foreach (['resident.visitors.store', 'resident.incidents.store', 'security.verify.sync-logs', 'security.quick-entry.sync'] as $name) {
        expect(Route::getRoutes()->getByName($name)->gatherMiddleware())->toContain('idempotent');
    }
});
