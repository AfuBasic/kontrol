<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Enums\AccessCodeStatus;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
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
        emails: ['keep@example.com', 'remove@example.com'],
        name: 'Staff',
    );
});

test('admin can remove a recipient, which revokes their pass and hides them from the group', function () {
    $this->actingAs($this->orgAdmin);

    $recipient = $this->bulkInvite->recipients()->where('email', 'remove@example.com')->firstOrFail();
    $codeId = $recipient->last_access_code_id;

    $this->delete(route('org.bulk-invites.recipients.destroy', [$this->bulkInvite, $recipient]))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($recipient->fresh()->status)->toBe('revoked')
        ->and(AccessCode::find($codeId)->status)->toBe(AccessCodeStatus::Revoked);

    $show = $this->get(route('org.bulk-invites.show', $this->bulkInvite))->assertOk()->inertiaPage()['props']['bulkInvite'];
    expect(collect($show['recipients'])->pluck('email')->all())->toBe(['keep@example.com']);

    $index = collect($this->get(route('org.bulk-invites.index'))->inertiaPage()['props']['bulkInvites']['data'])->first();
    expect($index['recipients_count'])->toBe(1)
        ->and($index['recipient_preview'])->toBe(['keep@example.com']);
});

test('show page provides human date labels instead of raw timestamps', function () {
    $this->actingAs($this->orgAdmin);

    $show = $this->get(route('org.bulk-invites.show', $this->bulkInvite))->assertOk()->inertiaPage()['props']['bulkInvite'];
    $until = $this->bulkInvite->valid_until;
    $expected = $until->year === now()->year ? $until->isoFormat('D MMM') : $until->isoFormat('D MMM YYYY');

    expect($show['valid_until_label'])->toBe($expected)
        ->and($show)->not->toHaveKey('next_renewal_at');
});

test('non-admin staff cannot remove recipients', function () {
    $staff = User::factory()->create();
    OrganizationMembership::create([
        'user_id' => $staff->id,
        'organization_id' => $this->org->id,
        'role' => 'staff',
        'is_active' => true,
    ]);

    $recipient = $this->bulkInvite->recipients()->firstOrFail();

    $this->actingAs($staff)
        ->delete(route('org.bulk-invites.recipients.destroy', [$this->bulkInvite, $recipient]))
        ->assertForbidden();

    expect($recipient->fresh()->status)->toBe('active');
});

test('a recipient from another group cannot be removed through this group', function () {
    $this->actingAs($this->orgAdmin);

    $other = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['other@example.com'],
        name: 'Other',
    );
    $otherRecipient = $other->recipients()->firstOrFail();

    $this->delete(route('org.bulk-invites.recipients.destroy', [$this->bulkInvite, $otherRecipient]))
        ->assertNotFound();

    expect($otherRecipient->fresh()->status)->toBe('active');
});

test('admin can resend a pass, which re-dispatches delivery with the same code', function () {
    $this->actingAs($this->orgAdmin);
    Queue::fake();

    $recipient = $this->bulkInvite->recipients()->where('email', 'keep@example.com')->firstOrFail();
    $recipient->update(['delivery_status' => 'sent']);

    $this->post(route('org.bulk-invites.recipients.resend', [$this->bulkInvite, $recipient]))
        ->assertRedirect()
        ->assertSessionHas('success');

    Queue::assertPushed(DeliverBulkVisitorPassJob::class, fn ($job) => $job->accessCodeId === $recipient->last_access_code_id
        && $job->recipientId === $recipient->id);
    expect($recipient->fresh()->delivery_status)->toBe('queued');

    $show = $this->get(route('org.bulk-invites.show', $this->bulkInvite))->inertiaPage()['props']['bulkInvite'];
    expect(collect($show['recipients'])->firstWhere('email', 'keep@example.com')['can_resend'])->toBeTrue();
});

test('resend is refused once the pass is no longer valid', function () {
    $this->actingAs($this->orgAdmin);
    Queue::fake();

    $recipient = $this->bulkInvite->recipients()->firstOrFail();
    $recipient->lastAccessCode->revoke();

    $this->post(route('org.bulk-invites.recipients.resend', [$this->bulkInvite, $recipient]))
        ->assertRedirect()
        ->assertSessionHas('error');

    Queue::assertNotPushed(DeliverBulkVisitorPassJob::class);
});

test('resend is rate limited per person', function () {
    $this->actingAs($this->orgAdmin);
    Queue::fake();

    $recipient = $this->bulkInvite->recipients()->firstOrFail();
    RateLimiter::clear("bulk-pass-resend:{$recipient->id}");

    foreach (range(1, 3) as $attempt) {
        $this->post(route('org.bulk-invites.recipients.resend', [$this->bulkInvite, $recipient]))->assertSessionHas('success');
    }

    $this->post(route('org.bulk-invites.recipients.resend', [$this->bulkInvite, $recipient]))->assertSessionHas('error');

    Queue::assertPushed(DeliverBulkVisitorPassJob::class, 3);
});

test('non-admin staff cannot resend passes', function () {
    Queue::fake();
    $staff = User::factory()->create();
    OrganizationMembership::create([
        'user_id' => $staff->id,
        'organization_id' => $this->org->id,
        'role' => 'staff',
        'is_active' => true,
    ]);

    $recipient = $this->bulkInvite->recipients()->firstOrFail();

    $this->actingAs($staff)
        ->post(route('org.bulk-invites.recipients.resend', [$this->bulkInvite, $recipient]))
        ->assertForbidden();

    Queue::assertNotPushed(DeliverBulkVisitorPassJob::class);
});
