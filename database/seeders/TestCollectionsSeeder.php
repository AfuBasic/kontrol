<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class TestCollectionsSeeder extends Seeder
{
    public function run(): void
    {
        // Cleanup previously seeded collections, assignments, and payments
        $seededCollectionNames = [];
        for ($i = 1; $i <= 4; $i++) {
            $seededCollectionNames[] = "Estate Levy {$i}";
        }
        for ($j = 1; $j <= 3; $j++) {
            $seededCollectionNames[] = "Rent/Utility Levy {$j}";
        }

        $collectionsToDelete = Collection::whereIn('name', $seededCollectionNames)->get();
        foreach ($collectionsToDelete as $collection) {
            $assignments = CollectionAssignment::where('collection_id', $collection->id)->get();
            foreach ($assignments as $assignment) {
                Payment::where('collection_assignment_id', $assignment->id)->delete();
                $assignment->delete();
            }
            $collection->delete();
        }

        // Clean up bulk payments for the test resident
        $testResident = User::where('email', 'resident@kontrol.test')->first();
        if ($testResident) {
            Payment::where('user_id', $testResident->id)->delete();
        }

        // 1. Ensure Roles Exist
        $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
        $ownerRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // 2. Find or Create Estate
        $estate = Estate::first() ?? Estate::factory()->create(['name' => 'Test Estate']);

        // Ensure estate settings have a paystack subaccount code
        $settings = EstateSettings::forEstate($estate->id);
        if (empty($settings->paystack_subaccount_code)) {
            $settings->update(['paystack_subaccount_code' => 'ACCT_estate123']);
        }

        // Set team context for role assignments
        setPermissionsTeamId($estate->id);

        // 3. Find or Create Admin
        $admin = User::role('admin')->first();
        if (! $admin) {
            $admin = User::where('email', 'admin@kontrol.test')->first();
            if (! $admin) {
                $admin = User::factory()->create([
                    'name' => 'Estate Admin',
                    'email' => 'admin@kontrol.test',
                ]);
            }
            $admin->assignRole($adminRole);
            $estate->users()->syncWithoutDetaching([$admin->id => ['status' => 'accepted']]);
        }

        // 4. Find or Create Property Owner
        $owner = User::role('property_owner')->first();
        if (! $owner) {
            $owner = User::where('email', 'landlord@kontrol.test')->first();
            if (! $owner) {
                $owner = User::factory()->create([
                    'name' => 'Mr. Landlord',
                    'email' => 'landlord@kontrol.test',
                ]);
            }
            $owner->assignRole([$residentRole, $ownerRole]);
            $estate->users()->syncWithoutDetaching([$owner->id => ['status' => 'accepted']]);
        }

        // Ensure landlord has a subaccount set
        $owner->profile()->updateOrCreate([], [
            'paystack_subaccount_code' => 'ACCT_landlord123',
        ]);

        // 5. Find or Create Resident
        $resident = User::role('resident')->where('id', '!=', $owner->id)->where('id', '!=', $admin->id)->first();
        if (! $resident) {
            $resident = User::where('email', 'resident@kontrol.test')->first();
            if (! $resident) {
                $resident = User::factory()->create([
                    'name' => 'Alice Resident',
                    'email' => 'resident@kontrol.test',
                ]);
            }
            $resident->assignRole($residentRole);
            $estate->users()->syncWithoutDetaching([$resident->id => ['status' => 'accepted']]);
        }

        // Setup Property and Associate Resident with Property Owner
        $property = Property::where('estate_id', $estate->id)->where('property_owner_id', $owner->id)->first();
        if (! $property) {
            $property = Property::create([
                'estate_id' => $estate->id,
                'property_owner_id' => $owner->id,
                'name' => 'Villa 45',
            ]);
        }

        $resident->profile()->updateOrCreate([], [
            'property_owner_id' => $owner->id,
            'property_id' => $property->id,
        ]);

        // 6. Create 4 Estate Collections & Assignments
        for ($i = 1; $i <= 4; $i++) {
            $estateCollection = Collection::create([
                'estate_id' => $estate->id,
                'name' => "Estate Levy {$i}",
                'amount' => 5000 * $i,
                'billing_type' => 'one_time',
                'start_date' => now()->toDateString(),
                'due_at' => now()->addDays(5 + $i)->toDateString(),
                'status' => 'active',
                'created_by' => $admin->id,
            ]);

            CollectionAssignment::create([
                'collection_id' => $estateCollection->id,
                'estate_id' => $estate->id,
                'user_id' => $resident->id,
                'amount_due' => 5000 * $i,
                'status' => 'pending',
                'due_date' => now()->addDays(5 + $i)->toDateString(),
            ]);
        }

        // 7. Create 3 Property Owner Collections & Assignments
        for ($j = 1; $j <= 3; $j++) {
            $ownerCollection = Collection::create([
                'estate_id' => $estate->id,
                'name' => "Rent/Utility Levy {$j}",
                'amount' => 15000 * $j,
                'billing_type' => 'one_time',
                'start_date' => now()->toDateString(),
                'due_at' => now()->addDays(10 + $j)->toDateString(),
                'status' => 'active',
                'created_by' => $owner->id,
            ]);

            CollectionAssignment::create([
                'collection_id' => $ownerCollection->id,
                'estate_id' => $estate->id,
                'user_id' => $resident->id,
                'amount_due' => 15000 * $j,
                'status' => 'pending',
                'due_date' => now()->addDays(10 + $j)->toDateString(),
            ]);
        }
    }
}
