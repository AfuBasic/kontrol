<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    // Relative labels ("3h ago", "Today") depend on the time of day; pin to mid-afternoon.
    $this->travelTo(now()->setTime(14, 0));
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Metro College',
        'type' => 'business',
        'is_active' => true,
    ]);

    $this->orgAdmin = User::factory()->create();
    OrganizationMembership::create([
        'user_id' => $this->orgAdmin->id,
        'organization_id' => $this->org->id,
        'role' => 'admin',
        'is_active' => true,
    ]);

    $plan = Plan::create([
        'name' => 'Estate Pro',
        'slug' => 'estate-pro',
        'price_per_month' => 50000,
        'price_per_year' => 500000,
        'features' => ['access-code-generation'],
        'is_active' => true,
    ]);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'billing_interval' => 'monthly',
    ]);

    $this->bulkInvite = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['ada@example.com', 'bayo@example.com', 'chi@example.com'],
        name: 'Staff',
    );

    $this->logVisit = function (string $email, $at, $checkedOutAt = null, ?string $gate = null): AccessLog {
        $recipient = $this->bulkInvite->recipients()->where('email', $email)->firstOrFail();

        return AccessLog::create([
            'estate_id' => $this->estate->id,
            'organization_id' => $this->org->id,
            'access_code_id' => $recipient->last_access_code_id,
            'verified_by' => $this->orgAdmin->id,
            'verified_at' => $at,
            'checked_out_at' => $checkedOutAt,
            'entry_point' => $gate,
        ]);
    };
});

test('group page summarises visits across the group and per person', function () {
    $this->actingAs($this->orgAdmin);

    ($this->logVisit)('ada@example.com', now()->subDays(2), now()->subDays(2)->addHours(8));
    ($this->logVisit)('ada@example.com', now()->subHours(3));
    ($this->logVisit)('bayo@example.com', now()->subDay(), now()->subDay()->addHours(4));

    $page = $this->get(route('org.bulk-invites.show', $this->bulkInvite))->assertOk()->inertiaPage()['props']['bulkInvite'];

    expect($page['visits'])->toBe([
        'total' => 3,
        'visited_count' => 2,
        'inside_now' => 1,
        'last_visit_label' => '3h ago',
    ]);

    $people = collect($page['recipients'])->keyBy('email');
    expect($people['ada@example.com']['visits_count'])->toBe(2)
        ->and($people['ada@example.com']['last_visit_label'])->toBe('3h ago')
        ->and($people['bayo@example.com']['last_visit_label'])->toBe('Yesterday')
        ->and($people['chi@example.com']['visits_count'])->toBe(0)
        ->and($people['chi@example.com']['last_visit_label'])->toBeNull();
});

test('an entry from a previous day without check-out does not count as inside now', function () {
    $this->actingAs($this->orgAdmin);

    ($this->logVisit)('ada@example.com', now()->subDays(2));

    $page = $this->get(route('org.bulk-invites.show', $this->bulkInvite))->inertiaPage()['props']['bulkInvite'];

    expect($page['visits']['inside_now'])->toBe(0);
});

test('person visit history is newest first with gate and times', function () {
    $this->actingAs($this->orgAdmin);

    ($this->logVisit)('ada@example.com', now()->subDays(3)->setTime(9, 15), now()->subDays(3)->setTime(17, 5), 'North Gate');
    ($this->logVisit)('ada@example.com', now()->setTime(0, 30), null, 'Main Gate');
    ($this->logVisit)('bayo@example.com', now()->subHour());

    $recipient = $this->bulkInvite->recipients()->where('email', 'ada@example.com')->firstOrFail();

    $json = $this->getJson(route('org.bulk-invites.recipients.visits', [$this->bulkInvite, $recipient]))
        ->assertOk()
        ->json();

    expect($json['data'])->toHaveCount(2)
        ->and($json['data'][0]['day_label'])->toBe('Today')
        ->and($json['data'][0]['entry_point'])->toBe('Main Gate')
        ->and($json['data'][0]['is_inside'])->toBeTrue()
        ->and($json['data'][1]['entered_at_label'])->toBe('9:15 AM')
        ->and($json['data'][1]['left_at_label'])->toBe('5:05 PM')
        ->and($json['data'][1]['is_inside'])->toBeFalse()
        ->and($json['next_cursor'])->toBeNull();
});

test('visit history cannot be read through another organization group', function () {
    $otherOrg = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'is_active' => true]);
    $outsider = User::factory()->create();
    OrganizationMembership::create([
        'user_id' => $outsider->id,
        'organization_id' => $otherOrg->id,
        'role' => 'admin',
        'is_active' => true,
    ]);

    $recipient = $this->bulkInvite->recipients()->firstOrFail();

    $this->actingAs($outsider)
        ->getJson(route('org.bulk-invites.recipients.visits', [$this->bulkInvite, $recipient]))
        ->assertNotFound();
});
