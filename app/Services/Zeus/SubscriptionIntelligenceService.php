<?php

namespace App\Services\Zeus;

use App\Models\Activity;
use App\Models\EstateSubscription;
use App\Models\Plan;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SubscriptionIntelligenceService
{
    /**
     * Get distribution of estates across different plans and their MRR.
     */
    public function getPlanAnalytics(): array
    {
        $plans = Plan::withCount(['subscriptions' => function ($query) {
            $query->whereIn('status', ['active', 'trial', 'past_due']);
        }])->get();

        return $plans->map(function ($plan) {
            // Calculate MRR per plan based on price and billing interval
            $mrrMultiplier = match ($plan->billing_interval) {
                'annually' => 1 / 12,
                'semi-annually' => 1 / 6,
                'quarterly' => 1 / 3,
                default => 1, // Assume monthly if not specified, though Plan enum says quarterly, semi-annually, annually. Wait, we should check enum.
            };

            // Calculate MRR based on active subscriptions
            $mrr = ($plan->price * $mrrMultiplier) * $plan->subscriptions_count;

            return [
                'plan_name' => $plan->name,
                'estates_count' => $plan->subscriptions_count,
                'mrr' => round($mrr),
                'color' => $plan->color ?? '#818cf8',
            ];
        })->values()->toArray();
    }

    /**
     * Get upcoming renewals grouped by 30, 60, and 90-day cohorts.
     */
    public function getRenewalCohort(): array
    {
        $now = Carbon::now();
        
        $subscriptions = EstateSubscription::with('plan')
            ->whereIn('status', ['active', 'trial'])
            ->whereNotNull('next_billing_date')
            ->whereBetween('next_billing_date', [$now, $now->copy()->addDays(90)])
            ->get();

        $cohorts = [
            '0-30 days' => ['count' => 0, 'mrr_at_risk' => 0],
            '31-60 days' => ['count' => 0, 'mrr_at_risk' => 0],
            '61-90 days' => ['count' => 0, 'mrr_at_risk' => 0],
        ];

        foreach ($subscriptions as $sub) {
            if (!$sub->plan) continue;

            $daysUntilRenewal = $now->diffInDays($sub->next_billing_date);
            
            $mrrMultiplier = match ($sub->plan->billing_interval) {
                'annually' => 1 / 12,
                'semi-annually' => 1 / 6,
                'quarterly' => 1 / 3,
                default => 1,
            };

            $mrr = $sub->plan->price * $mrrMultiplier;

            if ($daysUntilRenewal <= 30) {
                $cohorts['0-30 days']['count']++;
                $cohorts['0-30 days']['mrr_at_risk'] += $mrr;
            } elseif ($daysUntilRenewal <= 60) {
                $cohorts['31-60 days']['count']++;
                $cohorts['31-60 days']['mrr_at_risk'] += $mrr;
            } else {
                $cohorts['61-90 days']['count']++;
                $cohorts['61-90 days']['mrr_at_risk'] += $mrr;
            }
        }

        return [
            ['cohort' => 'Next 30 Days', 'count' => $cohorts['0-30 days']['count'], 'mrr' => round($cohorts['0-30 days']['mrr_at_risk'])],
            ['cohort' => '31-60 Days', 'count' => $cohorts['31-60 days']['count'], 'mrr' => round($cohorts['31-60 days']['mrr_at_risk'])],
            ['cohort' => '61-90 Days', 'count' => $cohorts['61-90 days']['count'], 'mrr' => round($cohorts['61-90 days']['mrr_at_risk'])],
        ];
    }

    /**
     * Get matrix of plan upgrades and downgrades for the current month.
     */
    public function getUpgradeDowngradeMatrix(): array
    {
        // Using Spatie Activitylog to track plan_id changes
        $activities = Activity::where('subject_type', EstateSubscription::class)
            ->where('event', 'updated')
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->get();

        $upgrades = 0;
        $downgrades = 0;

        // Load all plans for price comparison
        $plans = Plan::all()->keyBy('id');

        foreach ($activities as $activity) {
            $properties = $activity->properties;
            
            // Check if plan_id was changed
            if (isset($properties['old']['plan_id']) && isset($properties['attributes']['plan_id'])) {
                $oldPlanId = $properties['old']['plan_id'];
                $newPlanId = $properties['attributes']['plan_id'];

                if ($oldPlanId != $newPlanId) {
                    $oldPlan = $plans->get($oldPlanId);
                    $newPlan = $plans->get($newPlanId);

                    if ($oldPlan && $newPlan) {
                        if ($newPlan->price > $oldPlan->price) {
                            $upgrades++;
                        } elseif ($newPlan->price < $oldPlan->price) {
                            $downgrades++;
                        }
                    }
                }
            }
        }

        // Return formatted data for Recharts
        return [
            ['name' => 'Upgrades', 'value' => $upgrades, 'fill' => '#34d399'], // Emerald
            ['name' => 'Downgrades', 'value' => $downgrades, 'fill' => '#fb7185'], // Rose
        ];
    }
}
