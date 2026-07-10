<?php

use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\Partner;
use App\Models\User;
use App\Models\ZeusNotification;
use App\Notifications\Partner\EstateRequestAcceptedNotification;
use App\Notifications\Partner\EstateRequestRejectedNotification;
use App\Notifications\Zeus\PartnerEstateRequestSubmittedNotification;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\assertDatabaseHas;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
    $this->seed(PlanSeeder::class);
});

it('allows partner members to submit estate applications', function () {
    Notification::fake();

    $partner = Partner::factory()->create();
    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    $this->actingAs($affiliate)
        ->post(route('partner.partner-requests.store'), [
            'estate_name' => 'Palm Grove Estate',
            'estate_address' => '12 Palm Avenue',
            'chairman_name' => 'John Contact',
            'chairman_phone' => '08012345678',
            'chairman_email' => 'contact@palmgrove.test',
            'number_of_houses' => 120,
            'state' => 'Lagos',
            'lga' => 'Ikeja',
            'notes' => 'High potential estate',
        ])
        ->assertRedirect(route('partner.partner-requests.index', ['tab' => 'referrals']))
        ->assertSessionHas('success');

    assertDatabaseHas('estate_applications', [
        'estate_name' => 'Palm Grove Estate',
        'partner_id' => $partner->id,
        'source' => 'partner',
        'contact_name' => 'John Contact',
        'email' => 'contact@palmgrove.test',
        'status' => 'received',
    ]);

    expect(ZeusNotification::query()->where('type', 'partner_estate_request')->count())->toBe(1);

    Notification::assertSentOnDemand(
        PartnerEstateRequestSubmittedNotification::class,
        function (PartnerEstateRequestSubmittedNotification $notification, array $channels, object $notifiable) {
            return $notification->application->estate_name === 'Palm Grove Estate'
                && ($notifiable->routes['mail'] ?? null) === 'support@usekontrol.com';
        }
    );
});

it('approves partner applications and creates attributed estates', function () {
    Notification::fake();

    $partner = Partner::factory()->create(['commission_rate' => 15]);
    $member = User::factory()->create(['partner_id' => $partner->id]);
    $application = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Unique Partner Estate '.uniqid(),
        'contact_name' => 'Chair',
        'email' => 'unique-chairman@estate.test',
        'phone' => '08099998888',
        'status' => 'received',
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->post(route('zeus.applications.approve', $application))
        ->assertRedirect(route('zeus.applications.index'))
        ->assertSessionHas('success');

    $application->refresh();

    expect($application->status)->toBe('approved')
        ->and($application->estate_id)->not->toBeNull();

    $estate = Estate::find($application->estate_id);

    expect($estate)->not->toBeNull()
        ->and($estate->partner_id)->toBe($partner->id)
        ->and($estate->commission_plan_id)->not->toBeNull()
        ->and($estate->commission_status->value)->toBe('active');

    Notification::assertSentTo(
        $member,
        EstateRequestAcceptedNotification::class,
        function (EstateRequestAcceptedNotification $notification) use ($application, $estate, $member) {
            return $notification->application->id === $application->id
                && $notification->estate->id === $estate->id
                && $notification->via($member) === ['mail', 'database', 'broadcast'];
        }
    );
});

it('rejects partner applications with a reason', function () {
    Notification::fake();

    $partner = Partner::factory()->create();
    $member = User::factory()->create(['partner_id' => $partner->id]);

    $application = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Reject Me Estate',
        'contact_name' => 'Someone',
        'email' => 'reject@estate.test',
        'phone' => '08011112222',
        'status' => 'under_review',
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->post(route('zeus.applications.reject', $application), [
        'rejection_reason' => 'Insufficient documentation provided.',
    ])
        ->assertRedirect(route('zeus.applications.index'));

    assertDatabaseHas('estate_applications', [
        'id' => $application->id,
        'status' => 'rejected',
        'rejection_reason' => 'Insufficient documentation provided.',
    ]);

    Notification::assertSentTo(
        $member,
        EstateRequestRejectedNotification::class,
        function (EstateRequestRejectedNotification $notification) use ($application) {
            return $notification->application->id === $application->id
                && $notification->reason === 'Insufficient documentation provided.';
        }
    );
});

it('requests more information from partners', function () {
    $application = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => Partner::factory()->create()->id,
        'estate_name' => 'Info Needed Estate',
        'contact_name' => 'Someone',
        'email' => 'info@estate.test',
        'phone' => '08033334444',
        'status' => 'received',
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->post(route('zeus.applications.request-info', $application), [
        'info_request_message' => 'Please share gate access details.',
    ])
        ->assertRedirect(route('zeus.applications.index'));

    assertDatabaseHas('estate_applications', [
        'id' => $application->id,
        'status' => 'info_requested',
        'info_request_message' => 'Please share gate access details.',
    ]);
});

it('blocks duplicate open applications for the same estate name', function () {
    Notification::fake();

    $partner = Partner::factory()->create();
    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);
    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Duplicate Estate',
        'contact_name' => 'A',
        'email' => 'a@test.com',
        'phone' => '08000000001',
        'status' => 'received',
    ]);

    $this->actingAs($affiliate)
        ->post(route('partner.partner-requests.store'), [
            'estate_name' => 'Duplicate Estate',
            'chairman_name' => 'B',
            'chairman_phone' => '08000000002',
            'chairman_email' => 'b@test.com',
        ])
        ->assertSessionHasErrors('estate_name');
});
