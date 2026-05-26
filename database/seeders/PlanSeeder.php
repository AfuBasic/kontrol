<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            DB::table('plan_features')->truncate();
            Plan::truncate();
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('plan_features')->truncate();
            Plan::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $plans = [
            [
                'name' => 'Kontrol Quarterly',
                'slug' => 'pro-plan',
                'description' => 'Complete access control and premium features billed quarterly.',
                'price' => 1500000,
                'billing_interval' => 'quarterly',
                'is_featured' => false,
                'badge' => null,
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'sort_order' => 1,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            ],
            [
                'name' => 'Kontrol Semi-Annually',
                'slug' => 'pro-plan-semi',
                'description' => 'Complete access control and premium features billed semi-annually.',
                'price' => 2700000,
                'billing_interval' => 'semi-annually',
                'is_featured' => true,
                'badge' => 'Most Popular',
                'color' => 'blue',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'sort_order' => 2,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            ],
            [
                'name' => 'Kontrol Annually',
                'slug' => 'pro-plan-annual',
                'description' => 'Complete access control and premium features billed annually.',
                'price' => 4800000,
                'billing_interval' => 'annually',
                'is_featured' => false,
                'badge' => 'Best Value',
                'color' => 'green',
                'visibility' => 'public',
                'max_residents' => null,
                'max_security' => null,
                'max_admins' => null,
                'is_active' => true,
                'sort_order' => 3,
                'features' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            ],
        ];

        foreach ($plans as $planData) {
            $features = $planData['features'];
            unset($planData['features']);

            $plan = Plan::updateOrCreate(['slug' => $planData['slug']], $planData);

            if (! empty($features)) {
                $featureRecords = Feature::whereIn('id', $features)->get();
                $syncData = [];
                foreach ($featureRecords as $feature) {
                    $limit = null;

                    if ($feature->slug === 'household-management') {
                        $limit = '3';
                    }

                    $syncData[$feature->id] = [
                        'is_enabled' => true,
                        'limit' => $limit,
                    ];
                }
                $plan->features()->sync($syncData);
            }
        }
    }
}
