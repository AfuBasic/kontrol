<?php

namespace App\Actions\Zeus;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Support\Facades\DB;

class CreatePlanAction
{
    /**
     * @param  array{name: string, slug: string, description?: string, price: int, billing_interval: string, is_featured: bool, badge?: string|null, color: string, visibility: string, max_residents?: int|null, max_security?: int|null, max_admins?: int|null, features?: array}  $data
     */
    public function execute(array $data): Plan
    {
        return DB::transaction(function () use ($data) {
            // Extract features separately as it's not a plan attribute
            $features = $data['features'] ?? null;
            unset($data['features']);

            // Create plan with provided data
            $plan = Plan::create($data);

            // Attach features to plan
            if (! empty($features)) {
                $featureRecords = Feature::whereIn('id', $features)->get();
                
                // Ensure household-management is included if a limit is provided
                if (isset($data['household_member_limit'])) {
                    $householdFeature = Feature::where('slug', 'household-management')->first();
                    if ($householdFeature && ! $featureRecords->contains('id', $householdFeature->id)) {
                        $featureRecords->push($householdFeature);
                    }
                }

                foreach ($featureRecords as $feature) {
                    $limit = null;
                    if ($feature->slug === 'household-management') {
                        $limit = isset($data['household_member_limit']) ? (string) $data['household_member_limit'] : null;
                    }

                    $plan->features()->attach($feature->id, [
                        'is_enabled' => true,
                        'limit' => $limit,
                    ]);
                }
            }

            return $plan;
        });
    }
}
