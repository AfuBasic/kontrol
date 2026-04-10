<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'id' => 5,
                'name' => 'Starter',
                'slug' => 'starter-plan',
                'description' => 'Get started with our amazing offer on the starter plan',
                'price' => 500000,
                'billing_interval' => 'monthly',
                'is_featured' => false,
                'badge' => null,
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 50,
                'max_security' => 5,
                'max_admins' => 2,
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'id' => 6,
                'name' => 'Value',
                'slug' => 'value',
                'description' => 'Get the best value for money',
                'price' => 450000,
                'billing_interval' => 'monthly',
                'is_featured' => true,
                'badge' => null,
                'color' => 'green',
                'visibility' => 'public',
                'max_residents' => 250,
                'max_security' => 30,
                'max_admins' => 10,
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'id' => 7,
                'name' => 'Community',
                'slug' => 'community',
                'description' => 'This is suitable for a very large community',
                'price' => 350000,
                'billing_interval' => 'monthly',
                'is_featured' => false,
                'badge' => null,
                'color' => 'orange',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'id' => 8,
                'name' => 'Starter',
                'slug' => 'starter-annual',
                'description' => 'Get started with our amazing offer on the starter plan',
                'price' => 5000000,
                'billing_interval' => 'annual',
                'is_featured' => true,
                'badge' => 'Save 16%',
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 50,
                'max_security' => 5,
                'max_admins' => 2,
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'id' => 9,
                'name' => 'Value',
                'slug' => 'value-annual',
                'description' => 'Get the best value for money',
                'price' => 4860000,
                'billing_interval' => 'annual',
                'is_featured' => false,
                'badge' => 'Save 10% + 50 Extra Residents',
                'color' => 'teal',
                'visibility' => 'public',
                'max_residents' => 300,
                'max_security' => 30,
                'max_admins' => 10,
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'id' => 10,
                'name' => 'Community',
                'slug' => 'community-annual',
                'description' => 'This is suitable for a very large community',
                'price' => 4200000,
                'billing_interval' => 'annual',
                'is_featured' => false,
                'badge' => null,
                'color' => 'orange',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'sort_order' => 0,
            ],
        ];

        // Seed plans
        foreach ($plans as $plan) {
            Plan::create($plan);
        }

        // Seed plan features
        $planFeatures = [
            ['plan_id' => 7, 'feature_id' => 12],
            ['plan_id' => 7, 'feature_id' => 13],
            ['plan_id' => 7, 'feature_id' => 16],
            ['plan_id' => 7, 'feature_id' => 18],
            ['plan_id' => 7, 'feature_id' => 21],
            ['plan_id' => 7, 'feature_id' => 22],
            ['plan_id' => 7, 'feature_id' => 25],
            ['plan_id' => 7, 'feature_id' => 29],
            ['plan_id' => 7, 'feature_id' => 43],
            ['plan_id' => 7, 'feature_id' => 52],
            ['plan_id' => 10, 'feature_id' => 12],
            ['plan_id' => 10, 'feature_id' => 13],
            ['plan_id' => 10, 'feature_id' => 16],
            ['plan_id' => 10, 'feature_id' => 18],
            ['plan_id' => 10, 'feature_id' => 21],
            ['plan_id' => 10, 'feature_id' => 22],
            ['plan_id' => 10, 'feature_id' => 25],
            ['plan_id' => 10, 'feature_id' => 29],
            ['plan_id' => 10, 'feature_id' => 43],
            ['plan_id' => 10, 'feature_id' => 52],
        ];

        foreach ($planFeatures as $planFeature) {
            \DB::table('plan_features')->insert([
                'plan_id' => $planFeature['plan_id'],
                'feature_id' => $planFeature['feature_id'],
                'is_enabled' => true,
                'limit' => null,
            ]);
        }
    }
}
