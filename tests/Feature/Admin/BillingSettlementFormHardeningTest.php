<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\PaystackService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();
    $this->adminRole = Role::where('name', 'admin')->whereNull('estate_id')->firstOrFail();

    EstateSettings::forEstate($this->estate->id)->update([
        'charge_type' => 'estate',
    ]);

    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->adminAssignment = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->admin,
        estate: $this->estate,
        role: $this->adminRole,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );
});

it('does not expose the stale admin billing preference submission route', function () {
    expect(Route::has('admin.billing.preference.update'))->toBeFalse()
        ->and(Route::has('resident.billing.preference.update'))->toBeFalse();
});

it('validates settlement account numbers as ten digits before resolving', function () {
    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldNotReceive('resolveAccountNumber');
    });

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->postJson(route('admin.settlement.resolve'), [
            'account_number' => '01234abcde',
            'bank_code' => '044',
        ])
        ->assertInvalid(['account_number']);
});

it('saves the Paystack-resolved settlement account name instead of the submitted name', function () {
    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('resolveAccountNumber')
            ->once()
            ->with('0123456789', '044')
            ->andReturn(['account_name' => 'Verified Estate Account']);

        $mock->shouldReceive('createSubaccount')
            ->once()
            ->andReturn(['subaccount_code' => 'SUB_123456']);
    });

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.settlement.update'), [
            'bank_name' => 'Access Bank',
            'bank_code' => '044',
            'account_number' => '0123456789',
            'account_name' => 'Spoofed Browser Name',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $settings = EstateSettings::query()->where('estate_id', $this->estate->id)->firstOrFail();

    expect($settings->bank_name)->toBe('Access Bank')
        ->and($settings->bank_code)->toBe('044')
        ->and($settings->account_number)->toBe('0123456789')
        ->and($settings->account_name)->toBe('Verified Estate Account')
        ->and($settings->paystack_subaccount_code)->toBe('SUB_123456');
});
