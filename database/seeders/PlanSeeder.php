<?php

namespace Database\Seeders;

use App\Models\Feature;
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
                'name' => 'Basic Plan',
                'slug' => 'basic-plan',
                'description' => null,
                'price' => 600000,
                'billing_interval' => 'quarterly',
                'is_featured' => false,
                'badge' => null,
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 50,
                'max_security' => 5,
                'max_admins' => 2,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 14, 21, 22],
            ],
            [
                'name' => 'Basic Plan',
                'slug' => 'basic-plan-semi',
                'description' => null,
                'price' => 1080000,
                'billing_interval' => 'semi-annually',
                'is_featured' => false,
                'badge' => null,
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 50,
                'max_security' => 5,
                'max_admins' => 2,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 14, 21, 22],
            ],
            [
                'name' => 'Basic Plan',
                'slug' => 'basic-plan-annual',
                'description' => null,
                'price' => 1920000,
                'billing_interval' => 'annually',
                'is_featured' => false,
                'badge' => null,
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 50,
                'max_security' => 5,
                'max_admins' => 2,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 14, 21, 22],
            ],
            [
                'name' => 'Growth Plan',
                'slug' => 'growth-plan',
                'description' => null,
                'price' => 900000,
                'billing_interval' => 'quarterly',
                'is_featured' => true,
                'badge' => 'Most Popular',
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 250,
                'max_security' => 10,
                'max_admins' => 5,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 21, 22, 23],
            ],
            [
                'name' => 'Growth Plan',
                'slug' => 'growth-plan-semi',
                'description' => null,
                'price' => 1620000,
                'billing_interval' => 'semi-annually',
                'is_featured' => true,
                'badge' => 'Most Popular',
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 250,
                'max_security' => 10,
                'max_admins' => 5,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 21, 22, 23],
            ],
            [
                'name' => 'Growth Plan',
                'slug' => 'growth-plan-annual',
                'description' => null,
                'price' => 2880000,
                'billing_interval' => 'annually',
                'is_featured' => false,
                'badge' => null,
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => 250,
                'max_security' => 10,
                'max_admins' => 5,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 21, 22, 23],
            ],
            [
                'name' => 'Pro Plan',
                'slug' => 'pro-plan',
                'description' => null,
                'price' => 1500000,
                'billing_interval' => 'quarterly',
                'is_featured' => false,
                'badge' => 'Best Value',
                'color' => 'green',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            ],
            [
                'name' => 'Pro Plan',
                'slug' => 'pro-plan-semi',
                'description' => null,
                'price' => 2700000,
                'billing_interval' => 'semi-annually',
                'is_featured' => true,
                'badge' => 'Best Value',
                'color' => 'green',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            ],
            [
                'name' => 'Pro Plan',
                'slug' => 'pro-plan-annual',
                'description' => null,
                'price' => 4800000,
                'billing_interval' => 'annually',
                'is_featured' => false,
                'badge' => null,
                'color' => 'green',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            ],
        ];

        foreach ($plans as $planData) {
            $features = $planData['features'];
            unset($planData['features']);

            $plan = Plan::create($planData);

            if (! empty($features)) {
                $featureRecords = Feature::whereIn('id', $features)->get();
                foreach ($featureRecords as $feature) {
                    $plan->features()->attach($feature->id, [
                        'is_enabled' => true,
                        'limit' => null,
                    ]);
                }
            }
        }
    }
}
