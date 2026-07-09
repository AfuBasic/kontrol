<?php

use App\Models\Partner;
use App\Models\User;
use App\Services\PaystackService;
use Database\Seeders\PermissionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
});

function bankingPartnerMember(array $partnerAttrs = []): array
{
    $partner = Partner::factory()->create(array_merge([
        'name' => 'Ayo Ademola',
        'status' => 'active',
    ], $partnerAttrs));

    $affiliate = User::factory()->create([
        'name' => 'Ayo Ademola',
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    return [$partner, $affiliate];
}

it('resolves a bank account and returns match metadata', function () {
    [$partner, $affiliate] = bankingPartnerMember();

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('resolveAccountNumber')
            ->once()
            ->with('0123456789', '058')
            ->andReturn([
                'account_name' => 'Ademola Ayo',
                'account_number' => '0123456789',
            ]);
    });

    $this->actingAs($affiliate)
        ->postJson(route('partner.banking.resolve'), [
            'account_number' => '0123456789',
            'bank_code' => '058',
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('account_name', 'Ademola Ayo')
        ->assertJsonPath('match.accepted', true);
});

it('rejects resolve when account name does not match partner identity', function () {
    [, $affiliate] = bankingPartnerMember(['name' => 'Apex Partners Ltd']);

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('resolveAccountNumber')
            ->once()
            ->andReturn([
                'account_name' => 'Unrelated Person',
                'account_number' => '0123456789',
            ]);
    });

    $this->actingAs($affiliate)
        ->postJson(route('partner.banking.resolve'), [
            'account_number' => '0123456789',
            'bank_code' => '058',
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('match.accepted', false);
});

it('saves verified banking details when the name matches', function () {
    [$partner, $affiliate] = bankingPartnerMember();

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('resolveAccountNumber')
            ->once()
            ->andReturn([
                'account_name' => 'Ayo Olawale Ademola',
                'account_number' => '0123456789',
            ]);
    });

    $this->actingAs($affiliate)
        ->put(route('partner.banking.update'), [
            'bank_code' => '058',
            'bank_name' => 'Guaranty Trust Bank',
            'account_number' => '0123456789',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $partner->refresh();

    expect($partner->bank_code)->toBe('058')
        ->and($partner->bank_name)->toBe('Guaranty Trust Bank')
        ->and($partner->account_number)->toBe('0123456789')
        ->and($partner->account_name)->toBe('Ayo Olawale Ademola')
        ->and($partner->account_verified_at)->not->toBeNull()
        ->and($partner->hasVerifiedBankAccount())->toBeTrue()
        ->and($partner->maskedAccountNumber())->toBe('******6789');
});

it('does not save banking details when the name does not match', function () {
    [$partner, $affiliate] = bankingPartnerMember(['name' => 'Delta Holdings']);

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('resolveAccountNumber')
            ->once()
            ->andReturn([
                'account_name' => 'Someone Else Entirely',
                'account_number' => '0123456789',
            ]);
    });

    $this->actingAs($affiliate)
        ->from(route('partner.profile', ['tab' => 'banking']))
        ->put(route('partner.banking.update'), [
            'bank_code' => '058',
            'bank_name' => 'Guaranty Trust Bank',
            'account_number' => '0123456789',
        ])
        ->assertRedirect(route('partner.profile', ['tab' => 'banking']))
        ->assertSessionHasErrors('account_number');

    expect($partner->fresh()->account_number)->toBeNull();
});

it('includes banking props when profile banking tab is opened', function () {
    [, $affiliate] = bankingPartnerMember();

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('getBanks')->once()->andReturn([
            ['name' => 'Guaranty Trust Bank', 'code' => '058'],
            ['name' => 'Access Bank', 'code' => '044'],
        ]);
    });

    $this->actingAs($affiliate)
        ->get(route('partner.profile', ['tab' => 'banking']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Profile')
            ->where('tab', 'banking')
            ->has('banks', 2)
            ->has('partner.banking')
            ->where('partner.banking.is_verified', false)
        );
});
