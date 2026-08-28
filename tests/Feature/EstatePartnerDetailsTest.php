<?php

use App\Enums\CommissionStatus;
use App\Enums\PartnerStatus;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Partner;

it('renders partner section with correct attribution data on estate details page', function () {
    $partner = Partner::factory()->create([
        'name' => 'Acme Partners',
        'commission_rate' => 12.5,
    ]);

    $commissionPlan = CommissionPlan::factory()->create([
        'source_partner_id' => $partner->id,
        'commission_rate' => 12.5,
        'name' => 'Acme Partners Commission Plan',
    ]);

    $estate = Estate::factory()->create([
        'partner_id' => $partner->id,
        'commission_plan_id' => $commissionPlan->id,
        'partner_source' => 'partner_portal',
        'partner_status' => PartnerStatus::CommissionActive,
        'commission_status' => CommissionStatus::Active,
        'partner_date' => now()->subDays(10)->toDateString(),
        'activation_date' => now()->subDays(5)->toDateString(),
        'commission_starts_at' => now()->subDays(5)->toDateString(),
        'commission_ends_at' => now()->addDays(25)->toDateString(),
    ]);

    session()->put(config('zeus.session_key'), true);

    $this->get(route('zeus.estates.show', $estate))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/Estates/Show')
            ->where('estate.partner.name', 'Acme Partners')
            ->where('estate.partner_status', PartnerStatus::CommissionActive->value)
            ->where('estate.commission_status', CommissionStatus::Active->value)
            ->where('estate.commission_days_remaining', 25)
            ->has('estate.commission_plan')
            ->has('partners'));
});

it('allows zeus admin to assign a partner to an unassigned estate', function () {
    $partner = Partner::factory()->create([
        'name' => 'Prime Channel Partners',
        'commission_rate' => 15.0,
    ]);

    $estate = Estate::factory()->create([
        'partner_id' => null,
    ]);

    session()->put(config('zeus.session_key'), true);

    $response = $this->patch(route('zeus.estates.partner-assignment.update', $estate), [
        'partner_id' => $partner->id,
        'reason' => 'Assigned from zeus estate show page',
    ]);

    $response->assertRedirect(route('zeus.estates.show', $estate));
    $response->assertSessionHas('success', 'Partner assignment updated successfully.');

    $estate->refresh();
    expect($estate->partner_id)->toBe($partner->id)
        ->and($estate->commission_plan_id)->not->toBeNull()
        ->and($estate->commission_status)->toBe(CommissionStatus::Active);
});

it('allows zeus admin to change partner assignment with a reason', function () {
    $oldPartner = Partner::factory()->create(['name' => 'Old Partner']);
    $newPartner = Partner::factory()->create(['name' => 'New Partner', 'commission_rate' => 10.0]);

    $estate = Estate::factory()->create([
        'partner_id' => $oldPartner->id,
    ]);

    session()->put(config('zeus.session_key'), true);

    $response = $this->patch(route('zeus.estates.partner-assignment.update', $estate), [
        'partner_id' => $newPartner->id,
        'reason' => 'Reassigned to correct partner',
    ]);

    $response->assertRedirect(route('zeus.estates.show', $estate));

    $estate->refresh();
    expect($estate->partner_id)->toBe($newPartner->id);
});

it('allows zeus admin to remove partner assignment from an estate', function () {
    $partner = Partner::factory()->create(['name' => 'Assigned Partner']);

    $estate = Estate::factory()->create([
        'partner_id' => $partner->id,
    ]);

    session()->put(config('zeus.session_key'), true);

    $response = $this->patch(route('zeus.estates.partner-assignment.update', $estate), [
        'partner_id' => null,
        'reason' => 'Removed partner attribution',
    ]);

    $response->assertRedirect(route('zeus.estates.show', $estate));

    $estate->refresh();
    expect($estate->partner_id)->toBeNull()
        ->and($estate->commission_status)->toBe(CommissionStatus::Inactive);
});
