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
            ->has('estate.commission_plan'));
});
