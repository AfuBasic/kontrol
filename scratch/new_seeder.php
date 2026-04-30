<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plan = Plan::updateOrCreate(['slug' => 'basic-plan'], array (
  'name' => 'Basic Plan',
  'slug' => 'basic-plan',
  'description' => NULL,
  'price' => 600000,
  'billing_interval' => 'quarterly',
  'is_featured' => false,
  'badge' => NULL,
  'color' => 'blue',
  'visibility' => 'public',
  'max_residents' => 50,
  'max_security' => 5,
  'max_admins' => 2,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '0',
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'basic-plan-semi'], array (
  'name' => 'Basic Plan',
  'slug' => 'basic-plan-semi',
  'description' => NULL,
  'price' => 1080000,
  'billing_interval' => 'semi-annually',
  'is_featured' => false,
  'badge' => NULL,
  'color' => 'blue',
  'visibility' => 'public',
  'max_residents' => 50,
  'max_security' => 5,
  'max_admins' => 2,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '0',
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'basic-plan-annual'], array (
  'name' => 'Basic Plan',
  'slug' => 'basic-plan-annual',
  'description' => NULL,
  'price' => 1920000,
  'billing_interval' => 'annually',
  'is_featured' => false,
  'badge' => NULL,
  'color' => 'blue',
  'visibility' => 'public',
  'max_residents' => 50,
  'max_security' => 5,
  'max_admins' => 2,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '0',
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'growth-plan'], array (
  'name' => 'Growth Plan',
  'slug' => 'growth-plan',
  'description' => NULL,
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
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  5 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  6 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  7 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  8 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  9 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  10 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  11 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  15 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  16 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  17 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '3',
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  23 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'growth-plan-semi'], array (
  'name' => 'Growth Plan',
  'slug' => 'growth-plan-semi',
  'description' => NULL,
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
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  5 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  6 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  7 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  8 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  9 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  10 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  11 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  15 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  16 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  17 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '3',
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  23 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'growth-plan-annual'], array (
  'name' => 'Growth Plan',
  'slug' => 'growth-plan-annual',
  'description' => NULL,
  'price' => 2880000,
  'billing_interval' => 'annually',
  'is_featured' => false,
  'badge' => NULL,
  'color' => 'blue',
  'visibility' => 'public',
  'max_residents' => 250,
  'max_security' => 10,
  'max_admins' => 5,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  5 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  6 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  7 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  8 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  9 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  10 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  11 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  15 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  16 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  17 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '3',
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  23 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'pro-plan'], array (
  'name' => 'Pro Plan',
  'slug' => 'pro-plan',
  'description' => NULL,
  'price' => 1500000,
  'billing_interval' => 'quarterly',
  'is_featured' => false,
  'badge' => 'Best Value',
  'color' => 'green',
  'visibility' => 'public',
  'max_residents' => NULL,
  'max_security' => NULL,
  'max_admins' => NULL,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  5 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  6 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  7 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  8 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  9 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  10 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  11 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  12 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  13 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  15 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  16 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  17 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  18 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '10',
  ),
  20 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  23 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'pro-plan-semi'], array (
  'name' => 'Pro Plan',
  'slug' => 'pro-plan-semi',
  'description' => NULL,
  'price' => 2700000,
  'billing_interval' => 'semi-annually',
  'is_featured' => true,
  'badge' => 'Best Value',
  'color' => 'green',
  'visibility' => 'public',
  'max_residents' => NULL,
  'max_security' => NULL,
  'max_admins' => NULL,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  5 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  6 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  7 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  8 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  9 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  10 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  11 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  12 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  13 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  15 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  16 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  17 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  18 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '10',
  ),
  20 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  23 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

        $plan = Plan::updateOrCreate(['slug' => 'pro-plan-annual'], array (
  'name' => 'Pro Plan',
  'slug' => 'pro-plan-annual',
  'description' => NULL,
  'price' => 4800000,
  'billing_interval' => 'annually',
  'is_featured' => false,
  'badge' => NULL,
  'color' => 'green',
  'visibility' => 'public',
  'max_residents' => NULL,
  'max_security' => NULL,
  'max_admins' => NULL,
  'sort_order' => 0,
  'is_active' => true,
));

        $plan->features()->sync(array (
  1 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  2 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  3 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  4 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  5 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  6 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  7 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  8 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  9 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  10 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  11 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  12 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  13 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  14 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  15 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  16 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  17 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  18 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  19 => 
  array (
    'is_enabled' => true,
    'limit' => '10',
  ),
  20 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  21 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  22 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
  23 => 
  array (
    'is_enabled' => true,
    'limit' => NULL,
  ),
));

    }
}
