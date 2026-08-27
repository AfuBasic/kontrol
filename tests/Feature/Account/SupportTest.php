<?php

use App\Models\Estate;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
});

test('guests are redirected to login when accessing support', function () {
    $response = $this->get(route('account.support.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated resident can access help and support page', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->update(['current_estate_id' => $estate->id]);

    $response = $this->actingAs($user)->get(route('account.support.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Account/Support')
        ->has('support', fn (Assert $support) => $support
            ->where('email', 'support@usekontrol.com')
            ->where('phone', '+2347036481189')
            ->where('phone_formatted', '+234 703 648 1189')
            ->where('whatsapp', '2347036481189')
            ->where('whatsapp_formatted', '+234 703 648 1189')
        )
    );
});

test('authenticated admin can access help and support page', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('admin');
    $user->update(['current_estate_id' => $estate->id]);

    $response = $this->actingAs($user)->get(route('account.support.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Account/Support')
    );
});

test('authenticated security personnel can access help and support page', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('security');
    $user->update(['current_estate_id' => $estate->id]);

    $response = $this->actingAs($user)->get(route('account.support.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Account/Support')
    );
});

