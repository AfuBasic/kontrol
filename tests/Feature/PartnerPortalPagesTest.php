<?php

use App\Enums\PartnerRequestStatus;
use App\Models\Partner;
use App\Models\PartnerRequest;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
});

function partnerMember(): array
{
    $partner = Partner::factory()->create([
        'status' => 'active',
        'commission_type' => 'percentage',
        'commission_rate' => 10,
    ]);

    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    return [$partner, $affiliate];
}

it('renders partner workspace with extended stats', function () {
    [, $affiliate] = partnerMember();

    $this->actingAs($affiliate)
        ->get(route('partner.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Dashboard')
            ->has('stats.total_earned')
            ->has('stats.current_month_earnings')
            ->has('stats.days_until_settlement')
            ->has('stats.conversion_rate')
            ->has('monthlyEarnings')
            ->has('recentActivity')
            ->has('actions')
        );
});

it('renders partner earnings with chart and pagination props', function () {
    [, $affiliate] = partnerMember();

    $this->actingAs($affiliate)
        ->get(route('partner.earnings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Earnings')
            ->has('summary.total_earned')
            ->has('summary.current_month_earnings')
            ->has('summary.days_until_settlement')
            ->has('summary.projected_settlement')
            ->has('chart')
            ->has('timeline')
            ->has('earnings.data')
            ->has('earnings.current_page')
        );
});

it('renders partner notifications index', function () {
    [, $affiliate] = partnerMember();

    $this->actingAs($affiliate)
        ->get(route('partner.notifications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Notifications/Index')
            ->has('notifications.data')
            ->has('filters')
            ->has('unreadCount')
        );
});

it('renders estate pipeline with columns and transformed requests', function () {
    [$partner, $affiliate] = partnerMember();

    PartnerRequest::factory()->create([
        'partner_id' => $partner->id,
        'estate_name' => 'Palm Grove Estate',
        'status' => PartnerRequestStatus::Submitted,
        'state' => 'Lagos',
        'lga' => 'Ikeja',
        'number_of_houses' => 80,
    ]);

    $this->actingAs($affiliate)
        ->get(route('partner.partner-requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/PartnerRequests/Index')
            ->has('columns')
            ->has('partnerRequests', 1)
            ->where('partnerRequests.0.estate_name', 'Palm Grove Estate')
            ->where('partnerRequests.0.status', 'submitted')
            ->where('partnerRequests.0.status_label', 'Submitted')
            ->where('partnerRequests.0.state', 'Lagos')
        );
});

it('shares partnerContext on partner pages', function () {
    $partner = Partner::factory()->create([
        'name' => 'Shared Context Partner',
        'status' => 'active',
    ]);

    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    $this->actingAs($affiliate)
        ->get(route('partner.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('partnerContext.name', 'Shared Context Partner')
            ->where('partnerContext.status', 'active')
        );
});
