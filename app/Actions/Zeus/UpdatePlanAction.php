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
            $plan->update([
                'name' => $data['name'] ?? $plan->name,
                'slug' => $data['slug'] ?? $plan->slug,
                'description' => $data['description'] ?? $plan->description,
                'price' => $data['price'] ?? $plan->price,
                'billing_interval' => $data['billing_interval'] ?? $plan->billing_interval,
                'is_featured' => $data['is_featured'] ?? $plan->is_featured,
                'badge' => $data['badge'] ?? $plan->badge,
                'color' => $data['color'] ?? $plan->color,
                'visibility' => $data['visibility'] ?? $plan->visibility,
                'max_residents' => $data['max_residents'] ?? $plan->max_residents,
                'max_security' => $data['max_security'] ?? $plan->max_security,
                'max_admins' => $data['max_admins'] ?? $plan->max_admins,
            ]);

            // Update features if provided
            if (isset($data['features'])) {
                $plan->features()->detach();
                if (! empty($data['features'])) {
                    $features = Feature::whereIn('id', $data['features'])->get();
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
