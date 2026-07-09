<?php

use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\Partner;
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
            ->has('summary.next_settlement_month')
            ->has('summary.settlement_progress')
            ->has('chart')
            ->has('timeline')
            ->has('topEstates')
            ->has('pipeline')
            ->has('attention')
            ->has('checklist')
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

    EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Palm Grove Estate',
        'contact_name' => 'Contact Person',
        'email' => 'contact@palmgrove.test',
        'phone' => '08012345678',
        'status' => 'received',
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
            ->has('referrals', 1)
            ->has('estates')
            ->has('portfolio')
            ->where('activeTab', 'estates')
            ->where('partnerRequests.0.estate_name', 'Palm Grove Estate')
            ->where('partnerRequests.0.status', 'submitted')
            ->where('partnerRequests.0.status_label', 'Submitted')
            ->where('partnerRequests.0.state', 'Lagos')
        );
});

it('renders connected estates for the partner estates tab', function () {
    [$partner, $affiliate] = partnerMember();

    $estate = Estate::factory()->create([
        'name' => 'Live Partner Estate',
        'partner_id' => $partner->id,
        'status' => 'active',
        'email' => 'live@estate.test',
        'address' => '12 Live Road',
    ]);

    $this->actingAs($affiliate)
        ->get(route('partner.partner-requests.index', ['tab' => 'estates']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/PartnerRequests/Index')
            ->where('activeTab', 'estates')
            ->has('estates', 1)
            ->has('portfolio.connected_estates')
            ->where('estates.0.id', $estate->id)
            ->where('estates.0.name', 'Live Partner Estate')
            ->has('estates.0.counts.residents')
            ->has('estates.0.counts.subscribed')
            ->has('estates.0.counts.security')
            ->has('estates.0.counts.admins')
            ->has('estates.0.commission.earned_kobo')
            ->has('estates.0.progress')
        );
});

it('renders partner estate detail workspace for connected estates', function () {
    [$partner, $affiliate] = partnerMember();

    $estate = Estate::factory()->create([
        'name' => 'Detail Estate',
        'partner_id' => $partner->id,
        'status' => 'active',
    ]);

    $this->actingAs($affiliate)
        ->get(route('partner.estates.show', $estate))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Estates/Show')
            ->where('estate.id', $estate->id)
            ->where('estate.name', 'Detail Estate')
            ->has('recentResidents')
            ->has('monthlySeries')
            ->has('timeline')
        );
});

it('forbids partners from viewing estates they do not own', function () {
    [, $affiliate] = partnerMember();
    $other = Estate::factory()->create(['status' => 'active']);

    $this->actingAs($affiliate)
        ->get(route('partner.estates.show', $other))
        ->assertNotFound();
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
