<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Enums\AccessCodeStatus;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Metro College', 'type' => 'business', 'is_active' => true]);

    $this->orgAdmin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->orgAdmin->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $this->member = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->member->id, 'organization_id' => $this->org->id, 'role' => 'member', 'is_active' => true]);

    $plan = Plan::create(['name' => 'Estate Pro', 'slug' => 'estate-pro', 'price_per_month' => 50000, 'price_per_year' => 500000, 'features' => ['access-code-generation'], 'is_active' => true]);
    EstateSubscription::create(['estate_id' => $this->estate->id, 'plan_id' => $plan->id, 'status' => 'active', 'billing_interval' => 'monthly']);

    $this->group = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['one@example.com', 'two@example.com'],
        name: 'Staff',
        autoRenew: true,
    );

    // Start each test with an empty queue, so it only counts what it caused itself.
    Queue::fake();

    $this->add = fn (array $emails, ?User $as = null) => $this->actingAs($as ?? $this->orgAdmin)->post(route('org.bulk-invites.recipients.store', $this->group), ['emails' => $emails]);
});

// ---------- Delete ----------

test('deleting a group revokes every pass at once and removes the group from the organization', function () {
    $codeIds = $this->group->recipients()->pluck('last_access_code_id');

    $this->actingAs($this->orgAdmin)->delete(route('org.bulk-invites.destroy', $this->group))
        ->assertRedirect(route('org.bulk-invites.index'))
        ->assertSessionHas('success');

    expect(AccessCode::whereIn('id', $codeIds)->get()->every(fn ($c) => $c->status === AccessCodeStatus::Revoked))->toBeTrue()
        ->and(OrganizationBulkInvite::find($this->group->id))->toBeNull()
        ->and(OrganizationBulkInvite::withTrashed()->find($this->group->id))->not->toBeNull();

    $this->actingAs($this->orgAdmin)->get(route('org.bulk-invites.show', $this->group->id))->assertNotFound();

    $listed = collect($this->actingAs($this->orgAdmin)->get(route('org.bulk-invites.index'))->inertiaPage()['props']['bulkInvites']['data'])->pluck('id');
    expect($listed)->not->toContain($this->group->id);
});

test('a deleted group is never renewed, and its history is kept', function () {
    $this->actingAs($this->orgAdmin)->delete(route('org.bulk-invites.destroy', $this->group));

    (new RenewBulkVisitorInvitesJob)->handle();

    expect(AccessCode::where('bulk_invite_recipient_id', $this->group->recipients()->value('id'))->where('status', AccessCodeStatus::Active)->count())->toBe(0)
        ->and($this->group->recipients()->count())->toBe(2)
        ->and(OrganizationBulkInvite::withTrashed()->find($this->group->id)->auto_renew)->toBeFalse();
});

test('only an organization admin can delete a group, and only their own', function () {
    $this->actingAs($this->member)->delete(route('org.bulk-invites.destroy', $this->group))->assertForbidden();

    $otherOrg = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'is_active' => true]);
    $stranger = User::factory()->create();
    OrganizationMembership::create(['user_id' => $stranger->id, 'organization_id' => $otherOrg->id, 'role' => 'admin', 'is_active' => true]);
    $this->actingAs($stranger)->delete(route('org.bulk-invites.destroy', $this->group))->assertForbidden();

    expect(OrganizationBulkInvite::find($this->group->id))->not->toBeNull();
});

test('the old cancel route is gone', function () {
    expect(Route::has('org.bulk-invites.cancel'))->toBeFalse();
});

// ---------- Add people ----------

test('adding people gives each a pass for the current period and sends it', function () {
    ($this->add)(['three@example.com', 'Four@Example.com'])->assertRedirect()->assertSessionHas('success');

    $added = $this->group->recipients()->whereIn('email', ['three@example.com', 'four@example.com'])->get();
    expect($added)->toHaveCount(2);

    foreach ($added as $recipient) {
        $pass = AccessCode::find($recipient->last_access_code_id);
        expect($pass->status)->toBe(AccessCodeStatus::Active)
            ->and($pass->expires_at->toDateString())->toBe($this->group->fresh()->valid_until->toDateString())
            ->and($recipient->delivery_status)->toBe('queued');
    }

    Queue::assertPushed(DeliverBulkVisitorPassJob::class, 2);
});

test('someone already in the group is skipped, not given a second pass', function () {
    ($this->add)(['one@example.com', 'five@example.com'])->assertSessionHas('success');

    expect($this->group->recipients()->count())->toBe(3)
        ->and(AccessCode::where('bulk_invite_recipient_id', $this->group->recipients()->where('email', 'one@example.com')->value('id'))->count())->toBe(1);
    Queue::assertPushed(DeliverBulkVisitorPassJob::class, 1);
});

test('someone removed earlier can be added back with a fresh pass', function () {
    $recipient = $this->group->recipients()->where('email', 'two@example.com')->firstOrFail();
    $this->actingAs($this->orgAdmin)->delete(route('org.bulk-invites.recipients.destroy', [$this->group, $recipient]));
    expect($recipient->fresh()->status)->toBe('revoked');

    ($this->add)(['two@example.com'])->assertSessionHas('success');

    $fresh = $recipient->fresh();
    expect($fresh->status)->toBe('active')
        ->and(AccessCode::find($fresh->last_access_code_id)->status)->toBe(AccessCodeStatus::Active)
        ->and($this->group->recipients()->where('email', 'two@example.com')->count())->toBe(1);
});

test('someone who opted out is left alone', function () {
    $this->group->recipients()->where('email', 'two@example.com')->update(['status' => 'opted_out']);

    ($this->add)(['two@example.com'])->assertSessionHas('success');

    expect($this->group->recipients()->where('email', 'two@example.com')->value('status'))->toBe('opted_out');
    Queue::assertNothingPushed();
});

test('a group never holds more than thirty people', function () {
    ($this->add)(collect(range(1, 28))->map(fn ($i) => "p{$i}@example.com")->all())->assertSessionHasNoErrors(); // 2 + 28 = 30

    ($this->add)(['one-too-many@example.com'])->assertSessionHasErrors('emails');

    expect($this->group->recipients()->where('status', 'active')->count())->toBe(30);
});

test('a group that has ended or been deleted cannot take new people', function () {
    $this->group->update(['valid_until' => now()->subDay()->toDateString()]);
    ($this->add)(['late@example.com'])->assertSessionHasErrors('emails');

    $this->group->update(['valid_until' => now()->addDays(10)->toDateString()]);
    $this->actingAs($this->orgAdmin)->delete(route('org.bulk-invites.destroy', $this->group));
    ($this->add)(['gone@example.com'])->assertNotFound();
});

test('only an organization admin can add people, and the addresses must be valid', function () {
    ($this->add)(['x@example.com'], $this->member)->assertForbidden();
    ($this->add)(['not-an-email'])->assertSessionHasErrors('emails.0');
    ($this->add)([])->assertSessionHasErrors('emails');

    expect($this->group->recipients()->count())->toBe(2);
});

test('the group page tells the screen how many spots are left', function () {
    $props = $this->actingAs($this->orgAdmin)->get(route('org.bulk-invites.show', $this->group))->inertiaPage()['props']['bulkInvite'];

    expect($props['capacity'])->toBe(['max' => 30, 'used' => 2, 'remaining' => 28]);
});
