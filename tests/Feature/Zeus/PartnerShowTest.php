<?php

use App\Models\Estate;
use App\Models\Partner;
use App\Models\PartnerEarning;
use App\Models\PaymentTransaction;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to zeus login when viewing partner details', function () {
    $partner = Partner::factory()->create();

    $response = $this->get(route('zeus.partners.show', $partner));

    $response->assertRedirect(route('zeus.login'));
});

test('zeus admin can view partner details with referred estates and earnings breakdown', function () {
    $sessionKey = config('zeus.session_key');

    $partner = Partner::factory()->create([
        'name' => 'Apex Realty Partners',
        'commission_type' => 'percentage',
        'commission_rate' => 20.00,
        'status' => 'active',
    ]);

    $estate1 = Estate::factory()->create([
        'name' => 'Banana Island Estate',
        'partner_id' => $partner->id,
        'status' => 'active',
    ]);

    $estate2 = Estate::factory()->create([
        'name' => 'Ikoyi Horizon Estate',
        'partner_id' => $partner->id,
        'status' => 'active',
    ]);

    // Create a partner earning
    PartnerEarning::factory()->create([
        'partner_id' => $partner->id,
        'month' => now()->startOfMonth(),
        'total_amount' => 5000000,
        'revenue_amount' => 25000000,
        'settled_at' => now(),
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->get(route('zeus.partners.show', $partner));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Zeus/Partners/Show')
        ->has('partner', fn (Assert $p) => $p
            ->where('id', $partner->id)
            ->where('name', 'Apex Realty Partners')
            ->where('status', 'active')
            ->etc()
        )
        ->has('estates', 2)
        ->has('earnings', 1)
        ->has('stats', fn (Assert $s) => $s
            ->where('total_estates', 2)
            ->where('active_estates', 2)
            ->where('total_settled_earnings', 5000000)
            ->etc()
        )
    );
});
