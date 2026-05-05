<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plan = Plan::updateOrCreate(['slug' => 'basic-plan'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '0',
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'basic-plan-semi'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '0',
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'basic-plan-annual'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '0',
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'growth-plan'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            5 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            6 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            7 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            8 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            9 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            10 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            11 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            15 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            16 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            17 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '3',
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            23 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'growth-plan-semi'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            5 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            6 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            7 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            8 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            9 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            10 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            11 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            15 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            16 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            17 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '3',
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            23 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'growth-plan-annual'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            5 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            6 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            7 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            8 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            9 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            10 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            11 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            15 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            16 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            17 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '3',
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            23 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'pro-plan'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            5 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            6 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            7 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            8 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            9 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            10 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            11 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            12 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            13 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            15 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            16 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            17 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            18 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '10',
            ],
            20 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            23 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'pro-plan-semi'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            5 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            6 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            7 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            8 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            9 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            10 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            11 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            12 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            13 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            15 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            16 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            17 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            18 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '10',
            ],
            20 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            23 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

        $plan = Plan::updateOrCreate(['slug' => 'pro-plan-annual'], [
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
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $plan->features()->sync([
            1 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            2 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            3 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            4 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            5 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            6 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            7 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            8 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            9 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            10 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            11 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            12 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            13 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            14 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            15 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            16 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            17 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            18 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            19 => [
                'is_enabled' => true,
                'limit' => '10',
            ],
            20 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            21 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            22 => [
                'is_enabled' => true,
                'limit' => null,
            ],
            23 => [
                'is_enabled' => true,
                'limit' => null,
            ],
        ]);

    }
}
