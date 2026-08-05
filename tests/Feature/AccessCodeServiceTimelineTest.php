<?php

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Resident\AccessCodeService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Carbon;

// ── Global seeds ──────────────────────────────────────────────────────────────

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    // Boot a resident + estate context used across all timeline tests.
    $this->estate = Estate::factory()->create();

    EstateSettings::updateOrCreate(
        ['estate_id' => $this->estate->id],
        [
            'access_code_min_lifespan_minutes' => 10,
            'access_code_max_lifespan_minutes' => 1440,
            'charge_type' => 'none',
        ],
    );

    $this->resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    session(['estate_id' => $this->estate->id]);

    $this->actingAs($this->resident);

    $this->service = app(AccessCodeService::class);
});

// ── Helper ────────────────────────────────────────────────────────────────────

function makeCode(array $attrs): AccessCode
{
    return AccessCode::create($attrs);
}

// ── effective_visit_at ────────────────────────────────────────────────────────

describe('AccessCode::effective_visit_at', function () {
    it('uses starts_at when present', function () {
        $startsAt = now()->addDay();

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Scheduled,
            'type' => 'single_use',
            'starts_at' => $startsAt,
            'expires_at' => $startsAt->copy()->addHour(),
            'code' => 'TST001',
        ]);

        expect($code->effective_visit_at->toDateString())
            ->toBe($startsAt->toDateString());
    });

    it('falls back to expires_at for single_use when starts_at is null', function () {
        $expiresAt = now()->addHours(3);

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'starts_at' => null,
            'expires_at' => $expiresAt,
            'code' => 'TST002',
        ]);

        expect($code->effective_visit_at->toDateString())
            ->toBe($expiresAt->toDateString());
    });

    it('falls back to expires_at for event passes when starts_at is null', function () {
        $expiresAt = now()->addHours(5);

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'event',
            'starts_at' => null,
            'expires_at' => $expiresAt,
            'guest_limit' => 10,
            'code' => 'TST003',
        ]);

        expect($code->effective_visit_at->toDateString())
            ->toBe($expiresAt->toDateString());
    });

    it('does NOT use expires_at for long_lived passes — falls back to created_at', function () {
        Carbon::setTestNow('2026-07-20 09:00:00');

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'long_lived',
            'starts_at' => null,
            'expires_at' => null,
            'code' => 'TST004',
        ]);

        Carbon::setTestNow();

        expect($code->effective_visit_at->toDateString())
            ->toBe('2026-07-20');
    });
});

// ── completion_at ─────────────────────────────────────────────────────────────

describe('AccessCode::completion_at', function () {
    it('returns null for active passes', function () {
        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'expires_at' => now()->addHour(),
            'code' => 'CMP001',
        ]);

        expect($code->completion_at)->toBeNull();
    });

    it('prefers used_at over revoked_at and expires_at', function () {
        $usedAt = now()->subHour();

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Used,
            'type' => 'single_use',
            'used_at' => $usedAt,
            'expires_at' => now()->subMinutes(30),
            'code' => 'CMP002',
        ]);
        $code->load('accessLogs');

        expect($code->completion_at?->toDateTimeString())
            ->toBe($usedAt->toDateTimeString());
    });

    it('uses revoked_at when pass is revoked and has no used_at', function () {
        $revokedAt = now()->subHours(2);

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Revoked,
            'type' => 'single_use',
            'used_at' => null,
            'revoked_at' => $revokedAt,
            'expires_at' => now()->subHour(),
            'code' => 'CMP003',
        ]);
        $code->load('accessLogs');

        expect($code->completion_at?->toDateTimeString())
            ->toBe($revokedAt->toDateTimeString());
    });

    it('falls back to expires_at for expired passes with no other signals', function () {
        $expiresAt = now()->subHours(3);

        $code = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Expired,
            'type' => 'single_use',
            'used_at' => null,
            'revoked_at' => null,
            'expires_at' => $expiresAt,
            'code' => 'CMP004',
        ]);
        $code->load('accessLogs');

        expect($code->completion_at?->toDateTimeString())
            ->toBe($expiresAt->toDateTimeString());
    });
});

// ── getUpcomingTimeline ───────────────────────────────────────────────────────

describe('AccessCodeService::getUpcomingTimeline', function () {
    it('returns only active and scheduled passes', function () {
        $active = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'expires_at' => now()->addHour(),
            'code' => 'UP001',
        ]);

        $scheduled = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Scheduled,
            'type' => 'long_lived',
            'starts_at' => now()->addDay(),
            'code' => 'UP002',
        ]);

        // Should NOT appear in upcoming
        $expired = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Expired,
            'type' => 'single_use',
            'expires_at' => now()->subHour(),
            'code' => 'UP003',
        ]);

        $result = $this->service->getUpcomingTimeline();

        expect($result->pluck('id'))
            ->toContain($active->id)
            ->toContain($scheduled->id)
            ->not->toContain($expired->id);
    });

    it('orders passes by effective_visit_at ascending', function () {
        Carbon::setTestNow('2026-07-22 10:00:00');

        $later = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'starts_at' => now()->addDays(3),
            'expires_at' => now()->addDays(3)->addHour(),
            'code' => 'ORD001',
        ]);

        $sooner = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'starts_at' => now()->addHour(),
            'expires_at' => now()->addHours(2),
            'code' => 'ORD002',
        ]);

        // Keep clock frozen so both passes remain active during the query.
        $result = $this->service->getUpcomingTimeline();

        Carbon::setTestNow();

        $ids = $result->pluck('id')->values();

        expect($ids->search($sooner->id))->toBeLessThan($ids->search($later->id));
    });
});

// ── getHistoryTimeline ────────────────────────────────────────────────────────

describe('AccessCodeService::getHistoryTimeline', function () {
    it('returns only completed passes', function () {
        $active = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'expires_at' => now()->addHour(),
            'code' => 'HIS000',
        ]);

        $used = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Used,
            'type' => 'single_use',
            'used_at' => now()->subHour(),
            'expires_at' => now()->subMinutes(30),
            'code' => 'HIS001',
        ]);

        $revoked = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Revoked,
            'type' => 'single_use',
            'revoked_at' => now()->subHours(2),
            'code' => 'HIS002',
        ]);

        $result = $this->service->getHistoryTimeline();

        expect($result->pluck('id'))
            ->toContain($used->id)
            ->toContain($revoked->id)
            ->not->toContain($active->id);
    });

    it('orders history by completion timestamp descending', function () {
        $older = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Used,
            'type' => 'single_use',
            'used_at' => now()->subDays(3),
            'expires_at' => now()->subDays(3)->addHour(),
            'code' => 'HIST01',
        ]);

        $newer = makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Used,
            'type' => 'single_use',
            'used_at' => now()->subHour(),
            'expires_at' => now()->addHour(),
            'code' => 'HIST02',
        ]);

        $result = $this->service->getHistoryTimeline();
        $ids = $result->pluck('id')->values();

        expect($ids->search($newer->id))->toBeLessThan($ids->search($older->id));
    });
});

// ── Controller: Inertia prop shape ────────────────────────────────────────────

describe('GET /resident/visitors (timeline)', function () {
    it('exposes upcomingTimeline and historyTimeline — not activeCodes or historyCodes', function () {
        makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'expires_at' => now()->addHour(),
            'code' => 'CTL001',
        ]);

        $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
            ->get(route('resident.visitors.index'))
            ->assertInertia(
                fn ($page) => $page
                    ->component('Resident/Visitors/Index')
                    ->has('upcomingTimeline')
                    ->has('historyTimeline')
                    ->missing('activeCodes')
                    ->missing('historyCodes'),
            );
    });

    it('exposes effective_visit_at, arrival_date, and arrival_time on upcoming items', function () {
        Carbon::setTestNow('2026-07-22 14:00:00');

        makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Active,
            'type' => 'single_use',
            'starts_at' => now()->addHours(2),
            'expires_at' => now()->addHours(3),
            'code' => 'TF001',
        ]);

        // Keep clock frozen so the pass remains active when the controller queries it.
        $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
            ->get(route('resident.visitors.index'));

        Carbon::setTestNow();

        $response->assertInertia(
            fn ($page) => $page
                ->component('Resident/Visitors/Index')
                ->has('upcomingTimeline.0.effective_visit_at')
                ->has('upcomingTimeline.0.arrival_date')
                ->has('upcomingTimeline.0.arrival_time'),
        );
    });

    it('exposes completion_at, completion_date, and completion_time on history items', function () {
        makeCode([
            'estate_id' => $this->estate->id,
            'user_id' => $this->resident->id,
            'status' => AccessCodeStatus::Used,
            'type' => 'single_use',
            'used_at' => now()->subHour(),
            'expires_at' => now()->subMinutes(30),
            'code' => 'TF002',
        ]);

        $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
            ->get(route('resident.visitors.index'))
            ->assertInertia(
                fn ($page) => $page
                    ->component('Resident/Visitors/Index')
                    ->has('historyTimeline.0.completion_at')
                    ->has('historyTimeline.0.completion_date')
                    ->has('historyTimeline.0.completion_time'),
            );
    });
});
