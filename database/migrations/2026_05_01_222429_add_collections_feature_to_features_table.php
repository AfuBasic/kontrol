<?php

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $feature = Feature::firstOrCreate(
            ['slug' => 'collections'],
            [
                'name' => 'Collections',
                'description' => 'Manage estate dues, levies, and recurring bills for residents.',
                'group' => 'admin',
                'suggested_plan' => 'growth',
                'is_global' => true,
                'is_active' => true,
            ]
        );

        // Attach to Growth and Pro plans
        $plans = Plan::whereIn('name', ['Growth Plan', 'Pro Plan'])->get();
        foreach ($plans as $plan) {
            if (! $plan->features()->where('slug', 'collections')->exists()) {
                $plan->features()->attach($feature->id, ['is_enabled' => true]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $feature = Feature::where('slug', 'collections')->first();
        if ($feature) {
            foreach (Plan::all() as $plan) {
                $plan->features()->detach($feature->id);
            }
            $feature->delete();
        }
    }
};
