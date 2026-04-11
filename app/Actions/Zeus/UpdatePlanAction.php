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
                    $features = Feature::whereIn('id', $features)->get();
                    foreach ($features as $feature) {
                        $plan->features()->attach($feature->id, [
                            'is_enabled' => true,
                            'limit' => null,
                        ]);
                    }
                }
            }

            return $plan->fresh();
        });
    }
}
