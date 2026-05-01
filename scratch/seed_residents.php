<?php

use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\ResidentSubscriptionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

// Set memory limit for bulk operation
ini_set('memory_limit', '512M');

$estate = Estate::find(3);
if (! $estate) {
    echo "Error: Estate 3 not found.\n";
    exit(1);
}

$subscriptionService = app(ResidentSubscriptionService::class);
$password = Hash::make('password');
$role = Role::where('name', 'resident')->whereNull('estate_id')->first();

if (! $role) {
    echo "Error: Resident role not found.\n";
    exit(1);
}

// Scoping Spatie permissions to this estate
setPermissionsTeamId($estate->id);

echo 'Starting seeding 200 residents for: '.$estate->name."\n";

DB::transaction(function () use ($estate, $password, $role, $subscriptionService) {
    for ($i = 1; $i <= 200; $i++) {
        $suffix = str_pad($i, 3, '0', STR_PAD_LEFT);

        // 1. Create User
        $user = User::create([
            'name' => 'Resident '.$suffix,
            'email' => 'resident'.$i.'@example.com',
            'password' => $password,
            'email_verified_at' => now(),
            'user_type' => 'user',
        ]);

        // 2. Attach to Estate
        $estate->users()->attach($user->id, ['status' => 'accepted']);

        // 3. Assign Role (Scoped to estate via setPermissionsTeamId)
        $user->assignRole($role);

        // 4. Create Profile
        UserProfile::create([
            'user_id' => $user->id,
            'phone' => '080'.str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT),
            'unit_number' => 'UNIT-'.$suffix,
            'address' => $estate->address,
        ]);

        // 5. Create Subscription (Uses estate configuration)
        $subscriptionService->createForUser($user, $estate);

        if ($i % 20 === 0) {
            echo "Processed $i residents...\n";
        }
    }
});

echo "Success: 200 residents added with password 'password'.\n";
echo 'Trial duration applied: '.($estate->settings->free_trial_days ?? 0)." days.\n";
