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
            $plan = Plan::create([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'billing_interval' => $data['billing_interval'],
                'is_featured' => $data['is_featured'] ?? false,
                'badge' => $data['badge'] ?? null,
                'color' => $data['color'],
                'visibility' => $data['visibility'],
                'max_residents' => $data['max_residents'] ?? null,
                'max_security' => $data['max_security'] ?? null,
                'max_admins' => $data['max_admins'] ?? null,
            ]);

            // Attach features to plan
            if (! empty($data['features'])) {
                $features = Feature::whereIn('id', $data['features'])->get();
                foreach ($features as $feature) {
                    $plan->features()->attach($feature->id, [
                        'is_enabled' => true,
                        'limit' => null,
                    ]);
                }
            }

            return $plan;
        });
    }
}
