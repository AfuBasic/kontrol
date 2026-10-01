<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Mail\BulkVisitorPassMail;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRenewal;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\Visitor\BulkInvitePdfService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Metro College',
        'type' => 'business',
        'is_active' => true,
    ]);

    $this->orgAdmin = User::factory()->create();
    $this->membership = OrganizationMembership::create([
        'user_id' => $this->orgAdmin->id,
        'organization_id' => $this->org->id,
        'role' => 'admin',
        'is_active' => true,
    ]);

    $this->plan = Plan::create([
        'name' => 'Estate Pro',
        'slug' => 'estate-pro',
        'price_per_month' => 50000,
        'price_per_year' => 500000,
        'features' => ['access-code-generation'],
        'is_active' => true,
    ]);

    $this->subscription = EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => $this->plan->id,
        'status' => 'active',
        'billing_interval' => 'monthly',
    ]);
});

test('admin can create bulk visitor invite with email normalization and passes generated', function () {
    Queue::fake([DeliverBulkVisitorPassJob::class]);

    $this->actingAs($this->orgAdmin);

    $response = $this->post(route('org.bulk-invites.store'), [
        'name' => 'VIP Guests',
        'purpose' => 'Annual Gala',
        'emails' => [
            'Alice@Example.com ',
            'bob@example.com',
            'ALICE@example.com', // duplicate
        ],
        'auto_renew' => false,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $bulkInvite = OrganizationBulkInvite::where('name', 'VIP Guests')->first();
    expect($bulkInvite)->not->toBeNull()
        ->and($bulkInvite->organization_id)->toBe($this->org->id)
        ->and($bulkInvite->recipients()->count())->toBe(2);

    $passes = AccessCode::where('bulk_invite_recipient_id', '!=', null)->get();
    expect($passes)->toHaveCount(2);

    foreach ($passes as $pass) {
        expect($pass->type)->toBe('bulk_visitor')
            ->and($pass->source)->toBe(AccessCodeSource::BulkInvite)
            ->and($pass->status)->toBe(AccessCodeStatus::Active)
            ->and($pass->code)->not->toBeEmpty()
            ->and($pass->pass_uuid)->not->toBeEmpty()
            ->and($pass->qr_token)->not->toBeEmpty();
    }

    Queue::assertPushed(DeliverBulkVisitorPassJob::class, 2);
});

test('bulk invite enforces 30 recipients maximum cap', function () {
    $this->actingAs($this->orgAdmin);

    $tooManyEmails = array_map(fn ($i) => "visitor{$i}@example.com", range(1, 31));

    $response = $this->post(route('org.bulk-invites.store'), [
        'name' => 'Too Many Guests',
        'emails' => $tooManyEmails,
    ]);

    $response->assertSessionHasErrors('emails');
    expect(OrganizationBulkInvite::count())->toBe(0);
});

test('bulk invite enforces 30 days validity cap', function () {
    $this->actingAs($this->orgAdmin);

    $response = $this->post(route('org.bulk-invites.store'), [
        'name' => 'Over 30 days',
        'emails' => ['guest@example.com'],
        'valid_from' => now()->toDateString(),
        'valid_until' => now()->addDays(35)->toDateString(),
    ]);

    $response->assertSessionHasErrors('valid_until');
    expect(OrganizationBulkInvite::count())->toBe(0);
});

test('auto-renew fails if organization does not have active subscription', function () {
    $this->subscription->update(['status' => 'cancelled']);

    $this->actingAs($this->orgAdmin);

    $response = $this->post(route('org.bulk-invites.store'), [
        'name' => 'Unsubscribed Auto-renew',
        'emails' => ['vip@example.com'],
        'auto_renew' => true,
    ]);

    $response->assertSessionHasErrors('auto_renew');
    expect(OrganizationBulkInvite::count())->toBe(0);
});

test('auto-renew succeeds if organization member has active resident subscription', function () {
    $this->subscription->update(['status' => 'cancelled']);

    ResidentSubscription::create([
        'user_id' => $this->orgAdmin->id,
        'estate_id' => $this->estate->id,
        'status' => 'active',
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->addMonth(),
    ]);

    $this->actingAs($this->orgAdmin);

    $response = $this->post(route('org.bulk-invites.store'), [
        'name' => 'Subscribed Member Auto-renew',
        'emails' => ['vip@example.com'],
        'auto_renew' => true,
    ]);

    $response->assertSessionHasNoErrors();
    expect(OrganizationBulkInvite::count())->toBe(1);
});

test('renewal job auto-renews eligible bulk invites idempotently', function () {
    Queue::fake([DeliverBulkVisitorPassJob::class]);

    $action = app(CreateBulkVisitorInviteAction::class);
    $bulkInvite = $action->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['alice@example.com', 'bob@example.com'],
        name: 'Auto-renew Batch',
        validFrom: now()->subDays(29),
        validUntil: now(),
        autoRenew: true,
    );

    // Initial cycle created 2 passes
    expect(AccessCode::count())->toBe(2);

    // Set next_renewal_at to today so eligible query picks it up
    $bulkInvite->update(['next_renewal_at' => now()->toDateString()]);

    // Run renewal job
    $job = new RenewBulkVisitorInvitesJob($bulkInvite->id);
    $job->handle();

    // Now 2 new passes were created, total 4
    expect(AccessCode::count())->toBe(4);

    $renewals = OrganizationBulkInviteRenewal::where('bulk_invite_id', $bulkInvite->id)->get();
    expect($renewals)->toHaveCount(1)
        ->and($renewals->first()->status)->toBe('completed')
        ->and($renewals->first()->recipients_renewed)->toBe(2);

    // Running again for same cycle is idempotent and does not create additional passes
    $job->handle();
    expect(AccessCode::count())->toBe(4);
});

test('renewal job marks invite blocked when estate subscription lapses', function () {
    $action = app(CreateBulkVisitorInviteAction::class);
    $bulkInvite = $action->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['client@example.com'],
        validFrom: now()->subDays(29),
        validUntil: now(),
        autoRenew: true,
    );

    // Subscription lapses
    $this->subscription->update(['status' => 'cancelled']);

    $job = new RenewBulkVisitorInvitesJob($bulkInvite->id);
    $job->handle();

    $bulkInvite->refresh();
    expect($bulkInvite->renewal_blocked_reason)->toBe('subscription_required');

    $blockedRecord = OrganizationBulkInviteRenewal::where('bulk_invite_id', $bulkInvite->id)
        ->where('status', 'blocked')
        ->first();
    expect($blockedRecord)->not->toBeNull();
});

test('delivery job sends pass email to recipient', function () {
    Mail::fake();

    $action = app(CreateBulkVisitorInviteAction::class);
    $bulkInvite = $action->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['attendee@example.com'],
        autoRenew: false,
    );

    $recipient = $bulkInvite->recipients->first();
    $pass = $recipient->lastAccessCode;

    $deliveryJob = new DeliverBulkVisitorPassJob($pass->id, $recipient->id);
    app()->call([$deliveryJob, 'handle']);

    Mail::assertNothingQueued();
    Mail::assertSent(BulkVisitorPassMail::class, function (BulkVisitorPassMail $mail) use ($recipient, $pass) {
        return $mail->hasTo($recipient->email)
            && str_starts_with((string) $mail->pdfContents, '%PDF')
            && count($mail->attachments()) === 1
            && $mail->attachments()[0]->as === "Visitor-Pass-{$pass->code}.pdf";
    });

    $recipient->refresh();
    expect($recipient->last_delivered_at)->not->toBeNull()
        ->and($recipient->delivery_status)->toBe('sent');
});

test('delivery job retries instead of sending without the PDF when generation fails', function () {
    Mail::fake();
    Queue::fake();

    $bulkInvite = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['attendee@example.com'],
        autoRenew: false,
    );
    $recipient = $bulkInvite->recipients->first();

    $this->mock(BulkInvitePdfService::class)
        ->shouldReceive('generatePassPdf')
        ->andThrow(new RuntimeException('QR library unavailable'));

    $job = (new DeliverBulkVisitorPassJob($recipient->last_access_code_id, $recipient->id))->withFakeQueueInteractions();
    app()->call([$job, 'handle']);

    $job->assertReleased();
    Mail::assertNothingSent();
    expect($recipient->fresh()->delivery_status)->toBe('queued');
});

test('delivery job sends the link-only email on the final attempt if the PDF still fails', function () {
    Mail::fake();
    Queue::fake();

    $bulkInvite = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['attendee@example.com'],
        autoRenew: false,
    );
    $recipient = $bulkInvite->recipients->first();

    $this->mock(BulkInvitePdfService::class)
        ->shouldReceive('generatePassPdf')
        ->andThrow(new RuntimeException('QR library unavailable'));

    $job = (new DeliverBulkVisitorPassJob($recipient->last_access_code_id, $recipient->id))->withFakeQueueInteractions();
    $job->job->attempts = $job->tries;
    app()->call([$job, 'handle']);

    $job->assertNotReleased();
    Mail::assertSent(BulkVisitorPassMail::class, fn (BulkVisitorPassMail $mail) => $mail->pdfContents === null);
    expect($recipient->fresh()->delivery_status)->toBe('sent');
});
