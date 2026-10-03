<?php

use App\Actions\Organization\AddBulkInviteRecipientsAction;
use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Actions\Security\RecordCheckInAction;
use App\Actions\Security\ValidateAccessCodeAction;
use App\Enums\AccessCodeStatus;
use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use App\Services\Visitor\BulkInvitePdfService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    EstateSettings::forEstate($this->estate->id)->update(['access_codes_enabled' => true, 'visitor_checkout_enabled' => false]);

    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Metro College', 'type' => 'business', 'is_active' => true]);
    $this->host = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->host->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);
    $this->guard = User::factory()->create();

    $plan = Plan::create(['name' => 'Estate Pro', 'slug' => 'estate-pro', 'price_per_month' => 50000, 'price_per_year' => 500000, 'features' => ['access-code-generation'], 'is_active' => true]);
    EstateSubscription::create(['estate_id' => $this->estate->id, 'plan_id' => $plan->id, 'status' => 'active', 'billing_interval' => 'monthly']);

    $this->makeGroup = fn (bool $single, array $emails = ['one@example.com', 'two@example.com'], bool $autoRenew = false) => app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->host,
        emails: $emails,
        name: $single ? 'Single' : 'Repeat',
        autoRenew: $autoRenew,
        singleEntry: $single,
    );

    $this->passOf = fn ($group, string $email) => AccessCode::findOrFail($group->recipients()->where('email', $email)->value('last_access_code_id'));

    $this->enter = fn (AccessCode $pass) => app(RecordCheckInAction::class)->execute($pass->code, $this->estate->id, $this->guard, [], 'manual', null, 'Main Gate');
    $this->validate = fn (AccessCode $pass) => app(ValidateAccessCodeAction::class)->execute($pass->code, $this->estate->id);
});

it('lets a repeat-entry group\'s pass open the gate again and again', function () {
    $pass = ($this->passOf)(($this->makeGroup)(false), 'one@example.com');

    ($this->enter)($pass);
    ($this->enter)($pass);

    expect($pass->fresh()->status)->toBe(AccessCodeStatus::Active)
        ->and(($this->validate)($pass)['valid'])->toBeTrue();
});

it('uses up a single-entry pass on its first entry, so a forwarded copy fails', function () {
    $pass = ($this->passOf)(($this->makeGroup)(true), 'one@example.com');

    expect(($this->validate)($pass)['valid'])->toBeTrue();

    ($this->enter)($pass);

    $second = ($this->validate)($pass);

    expect($pass->fresh()->status)->toBe(AccessCodeStatus::Used)
        ->and($second['valid'])->toBeFalse()
        ->and($second['status'])->toBe('already_used');
});

it('uses up only the pass that was scanned, not the rest of the group', function () {
    $group = ($this->makeGroup)(true);
    $one = ($this->passOf)($group, 'one@example.com');
    $two = ($this->passOf)($group, 'two@example.com');

    ($this->enter)($one);

    expect($one->fresh()->status)->toBe(AccessCodeStatus::Used)
        ->and($two->fresh()->status)->toBe(AccessCodeStatus::Active)
        ->and(($this->validate)($two)['valid'])->toBeTrue();
});

it('still records the visit that used the pass up', function () {
    $pass = ($this->passOf)(($this->makeGroup)(true), 'one@example.com');

    $log = ($this->enter)($pass);

    expect($log->access_code_id)->toBe($pass->id)->and($pass->accessLogs()->withoutGlobalScopes()->count())->toBe(1);
});

it('is off unless asked for, so existing and new groups keep repeat entry', function () {
    $group = app(CreateBulkVisitorInviteAction::class)->execute(organization: $this->org, user: $this->host, emails: ['a@example.com']);

    expect($group->fresh()->single_entry)->toBeFalse();
});

it('can be chosen when the group is created from the form', function () {
    $this->actingAs($this->host)->post(route('org.bulk-invites.store'), [
        'name' => 'Guests',
        'emails' => ['g1@example.com', 'g2@example.com'],
        'valid_from' => now()->toDateString(),
        'valid_until' => now()->addDays(2)->toDateString(),
        'single_entry' => true,
    ])->assertSessionHasNoErrors();

    expect(OrganizationBulkInvite::where('name', 'Guests')->value('single_entry'))->toBeTrue();
});

it('gives people added later the same entry rule as the group', function () {
    $group = ($this->makeGroup)(true);

    app(AddBulkInviteRecipientsAction::class)->execute($group, $this->host, ['late@example.com']);
    $late = ($this->passOf)($group, 'late@example.com');

    ($this->enter)($late);

    expect(($this->validate)($late)['status'])->toBe('already_used');
});

it('gives everyone a fresh single-entry pass when a renewing group rolls over', function () {
    $group = ($this->makeGroup)(true, ['one@example.com'], true);
    $first = ($this->passOf)($group, 'one@example.com');
    ($this->enter)($first);

    $group->update(['valid_until' => now()->subDay()->toDateString(), 'next_renewal_at' => now()->subDays(2)->toDateString()]);
    (new RenewBulkVisitorInvitesJob($group->id))->handle();

    $second = ($this->passOf)($group->fresh(), 'one@example.com');

    expect($second->id)->not->toBe($first->id)
        ->and(($this->validate)($second)['valid'])->toBeTrue();

    ($this->enter)($second);

    expect(($this->validate)($second)['status'])->toBe('already_used');
});

it('says "Single entry" on the PDF only for a single-entry group', function () {
    $service = app(BulkInvitePdfService::class);

    expect($service->entryMode('bulk_visitor', true)['label'])->toBe('Single entry')
        ->and($service->entryMode('bulk_visitor', false)['label'])->toBe('Multiple entry');

    $group = ($this->makeGroup)(true);
    $pass = ($this->passOf)($group, 'one@example.com');
    $data = $service->passViewData($group->recipients()->where('email', 'one@example.com')->firstOrFail(), $pass);

    expect($data['entryMode']['label'])->toBe('Single entry');
});

it('tells the group page which entry rule applies and who has already used their pass', function () {
    $group = ($this->makeGroup)(true);
    ($this->enter)(($this->passOf)($group, 'one@example.com'));

    $props = $this->actingAs($this->host)->get(route('org.bulk-invites.show', $group))->inertiaPage()['props']['bulkInvite'];
    $byEmail = collect($props['recipients'])->keyBy('email');

    expect($props['single_entry'])->toBeTrue()
        ->and($byEmail['one@example.com']['pass_used'])->toBeTrue()
        ->and($byEmail['two@example.com']['pass_used'])->toBeFalse();
});
