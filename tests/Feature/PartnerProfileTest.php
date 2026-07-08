<?php

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
});

it('allows partner members to view their profile', function () {
    $partner = Partner::factory()->create([
        'name' => 'Apex Referrals',
        'commission_type' => 'percentage',
        'commission_rate' => 12.5,
        'commission_length' => 12,
        'status' => 'active',
    ]);

    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    $this->actingAs($affiliate)
        ->get(route('partner.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Profile')
            ->where('partner.name', 'Apex Referrals')
            ->where('partner.commission_type', 'percentage')
            ->has('user.email')
        );
});

it('allows partner members to view support', function () {
    $partner = Partner::factory()->create();
    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    $this->actingAs($affiliate)
        ->get(route('partner.support'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Support')
            ->has('support.email')
            ->has('support.faq')
        );
});
