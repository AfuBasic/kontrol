<?php

use App\Enums\PartnerRequestStatus;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\PartnerRequest;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\assertDatabaseHas;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
    $this->seed(PlanSeeder::class);
});

it('allows partner members to submit partner requests', function () {
    $partner = Partner::factory()->create();
    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    $this->actingAs($affiliate)
        ->post(route('affiliate.partner-requests.store'), [
            'estate_name' => 'Palm Grove Estate',
            'estate_address' => '12 Palm Avenue',
            'chairman_name' => 'John Chairman',
            'chairman_phone' => '08012345678',
            'chairman_email' => 'chairman@palmgrove.test',
            'number_of_houses' => 120,
            'state' => 'Lagos',
            'lga' => 'Ikeja',
            'notes' => 'High potential estate',
        ])
        ->assertRedirect(route('affiliate.partner-requests.index'))
        ->assertSessionHas('success');

    assertDatabaseHas('partner_requests', [
        'estate_name' => 'Palm Grove Estate',
        'partner_id' => $partner->id,
        'status' => PartnerRequestStatus::Submitted->value,
    ]);
});

it('approves partner requests and creates attributed estates', function () {
    $partner = Partner::factory()->create(['commission_rate' => 15]);
    $partnerRequest = PartnerRequest::factory()->create([
        'partner_id' => $partner->id,
        'chairman_email' => 'unique-chairman@estate.test',
        'status' => PartnerRequestStatus::Submitted,
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->post(route('zeus.partner-requests.approve', $partnerRequest))
        ->assertRedirect(route('zeus.partner-requests.index'))
        ->assertSessionHas('success');

    $partnerRequest->refresh();

    expect($partnerRequest->status)->toBe(PartnerRequestStatus::EstateCreated)
        ->and($partnerRequest->estate_id)->not->toBeNull();

    $estate = Estate::find($partnerRequest->estate_id);

    expect($estate)->not->toBeNull()
        ->and($estate->partner_id)->toBe($partner->id)
        ->and($estate->commission_plan_id)->not->toBeNull()
        ->and($estate->commission_status->value)->toBe('active');
});

it('rejects partner requests with a reason', function () {
    $partnerRequest = PartnerRequest::factory()->create([
        'status' => PartnerRequestStatus::Reviewing,
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->post(route('zeus.partner-requests.reject', $partnerRequest), [
        'rejection_reason' => 'Insufficient documentation provided.',
    ])
        ->assertRedirect(route('zeus.partner-requests.index'));

    assertDatabaseHas('partner_requests', [
        'id' => $partnerRequest->id,
        'status' => PartnerRequestStatus::Rejected->value,
        'rejection_reason' => 'Insufficient documentation provided.',
    ]);
});

it('requests more information from partners', function () {
    $partnerRequest = PartnerRequest::factory()->create([
        'status' => PartnerRequestStatus::Submitted,
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->post(route('zeus.partner-requests.request-info', $partnerRequest), [
        'info_request_message' => 'Please provide the estate layout plan.',
    ])
        ->assertRedirect(route('zeus.partner-requests.index'));

    assertDatabaseHas('partner_requests', [
        'id' => $partnerRequest->id,
        'status' => PartnerRequestStatus::InfoRequested->value,
        'info_request_message' => 'Please provide the estate layout plan.',
    ]);
});

it('lists partner requests for zeus admins', function () {
    PartnerRequest::factory()->count(2)->create();

    session()->put(config('zeus.session_key'), true);

    $this->get(route('zeus.partner-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/PartnerRequests/Index')
            ->has('partnerRequests.data', 2));
});
