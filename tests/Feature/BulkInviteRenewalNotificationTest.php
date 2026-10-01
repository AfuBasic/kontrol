<?php

use App\Jobs\NotifyBulkInviteDeliveryReportJob;
use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use App\Notifications\BulkInviteDeliveryFailedNotification;
use App\Notifications\BulkInviteRenewedNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

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
        'estate_id' => $this->estate->id,
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

test('auto renewal dispatches BulkInviteRenewedNotification to creator after extending passes', function () {
    Notification::fake();

    $bulkInvite = OrganizationBulkInvite::create([
        'estate_id' => $this->estate->id,
        'organization_id' => $this->org->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Weekly Contractors',
        'status' => 'active',
        'auto_renew' => true,
        'valid_from' => now()->subDays(7)->toDateString(),
        'valid_until' => now()->subDay()->toDateString(),
    ]);

    OrganizationBulkInviteRecipient::create([
        'bulk_invite_id' => $bulkInvite->id,
        'email' => 'worker1@example.com',
        'status' => 'active',
        'delivery_status' => 'sent',
    ]);

    OrganizationBulkInviteRecipient::create([
        'bulk_invite_id' => $bulkInvite->id,
        'email' => 'worker2@example.com',
        'status' => 'active',
        'delivery_status' => 'sent',
    ]);

    $job = new RenewBulkVisitorInvitesJob($bulkInvite->id);
    $job->handle();

    Notification::assertSentTo(
        $this->orgAdmin,
        BulkInviteRenewedNotification::class,
        function ($notification) use ($bulkInvite) {
            return $notification->bulkInvite->id === $bulkInvite->id
                && $notification->renewedCount === 2;
        }
    );
});

test('NotifyBulkInviteDeliveryReportJob notifies creator when delivery failures exist', function () {
    Notification::fake();

    $bulkInvite = OrganizationBulkInvite::create([
        'estate_id' => $this->estate->id,
        'organization_id' => $this->org->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Vendor Batch',
        'status' => 'active',
        'valid_from' => now()->toDateString(),
        'valid_until' => now()->addDays(7)->toDateString(),
    ]);

    OrganizationBulkInviteRecipient::create([
        'bulk_invite_id' => $bulkInvite->id,
        'email' => 'success@example.com',
        'status' => 'active',
        'delivery_status' => 'sent',
    ]);

    OrganizationBulkInviteRecipient::create([
        'bulk_invite_id' => $bulkInvite->id,
        'email' => 'bounce@example.com',
        'status' => 'active',
        'delivery_status' => 'failed',
        'delivery_error' => 'Mailbox unavailable',
    ]);

    $job = new NotifyBulkInviteDeliveryReportJob($bulkInvite->id);
    $job->handle();

    Notification::assertSentTo(
        $this->orgAdmin,
        BulkInviteDeliveryFailedNotification::class,
        function ($notification) use ($bulkInvite) {
            return $notification->bulkInvite->id === $bulkInvite->id
                && count($notification->failedRecipients) === 1
                && $notification->failedRecipients[0]['email'] === 'bounce@example.com';
        }
    );
});

test('NotifyBulkInviteDeliveryReportJob does not notify creator when no delivery failures exist', function () {
    Notification::fake();

    $bulkInvite = OrganizationBulkInvite::create([
        'estate_id' => $this->estate->id,
        'organization_id' => $this->org->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'All Good Batch',
        'status' => 'active',
        'valid_from' => now()->toDateString(),
        'valid_until' => now()->addDays(7)->toDateString(),
    ]);

    OrganizationBulkInviteRecipient::create([
        'bulk_invite_id' => $bulkInvite->id,
        'email' => 'success1@example.com',
        'status' => 'active',
        'delivery_status' => 'sent',
    ]);

    $job = new NotifyBulkInviteDeliveryReportJob($bulkInvite->id);
    $job->handle();

    Notification::assertNothingSent();
});
