<?php

use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Collection;
use App\Models\EstateOrganization;
use App\Models\EstateTransaction;
use App\Models\Incident;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\SosEvent;
use App\Models\User;
use App\Models\VisitorProfile;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Artisan;

test('demo:seed populates the database with thousands of records', function () {
    // Verify key record counts after seeding
    $demoUsers = User::where('email', 'like', '%@'.DemoSeeder::DEMO_DOMAIN)->count();
    expect($demoUsers)->toBeGreaterThanOrEqual(3_000);

    expect(EstateOrganization::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(20);
    expect(OrganizationBulkInviteRecipient::count())->toBeGreaterThanOrEqual(1_000);
    expect(AccessCode::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(3_000);
    expect(AccessLog::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(5_000);
    expect(VisitorProfile::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(800);
    expect(EstateTransaction::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(2_000);
    expect(Incident::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(300);
    expect(SosEvent::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(40);
    expect(Collection::where('estate_id', 1)->count())->toBeGreaterThanOrEqual(10);
});

test('fixed loginable demo accounts exist with correct roles', function () {
    $accounts = [
        'security@demo.kontrol.test' => 'security',
        'resident@demo.kontrol.test' => 'resident',
        'landlord@demo.kontrol.test' => 'property_owner',
        'household@demo.kontrol.test' => 'household_member',
    ];

    foreach ($accounts as $email => $role) {
        $user = User::where('email', $email)->first();
        expect($user)->not->toBeNull("User {$email} should exist");
        expect($user->hasRole($role))->toBeTrue("User {$email} should have role {$role}");
    }
});

test('demo:wipe removes all tagged demo records', function () {
    Artisan::call('demo:wipe', ['--force' => true]);

    $remaining = User::where('email', 'like', '%@'.DemoSeeder::DEMO_DOMAIN)->count();
    expect($remaining)->toBe(0);
});
