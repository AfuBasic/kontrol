<?php

namespace App\Actions\Zeus;

use App\Models\Plan;
use Illuminate\Support\Facades\DB;

class DeletePlanAction
{
    public function execute(Plan $plan): bool
    {
        return DB::transaction(function () use ($plan) {
            // Detach all features
            $plan->features()->detach();

            // Delete the plan
            return $plan->delete();
        });
    }
}
