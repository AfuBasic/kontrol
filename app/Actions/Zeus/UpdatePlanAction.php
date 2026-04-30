<?php

namespace App\Actions\Zeus;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Support\Facades\DB;

class UpdatePlanAction
{
    /**
     * @param  array{name?: string, slug?: string, description?: string, price?: int, billing_interval?: string, is_featured?: bool, badge?: string|null, color?: string, visibility?: string, max_residents?: int|null, max_security?: int|null, max_admins?: int|null, features?: array}  $data
     */
    public function execute(Plan $plan, array $data): Plan
    {
        return DB::transaction(function () use ($plan, $data) {
            // Extract features separately as it's not a plan attribute
            $features = $data['features'] ?? null;
            unset($data['features']);

            // Update plan with all provided data
            $plan->update($data);

            // Update features if provided
            if ($features !== null) {
                $plan->features()->detach();
                if (! empty($features)) {
                    $featuresList = Feature::whereIn('id', $features)->get();

                    // Ensure household-management is included if a limit is provided
                    if (isset($data['household_member_limit'])) {
                        $householdFeature = Feature::where('slug', 'household-management')->first();
                        if ($householdFeature && ! $featuresList->contains('id', $householdFeature->id)) {
                            $featuresList->push($householdFeature);
                        }
                    }

                    foreach ($featuresList as $feature) {
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
            }

            return $plan->fresh();
        });
    }
}
