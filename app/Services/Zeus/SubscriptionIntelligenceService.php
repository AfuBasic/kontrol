<?php

namespace App\Services\Zeus;

use App\Models\Activity;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use Illuminate\Support\Carbon;

class SubscriptionIntelligenceService
{
    /**
     * Get summary KPIs for subscriptions (Strictly Residents).
     */
    public function getKpis(): array
    {
        $activeSubs = ResidentSubscription::whereIn('status', ['active', 'trial'])->count();
        $pastDueSubs = ResidentSubscription::where('status', 'past_due')->count();

        $cancelledSubs = ResidentSubscription::where('status', 'cancelled')
            ->where('updated_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        // Calculate total MRR
        $plans = Plan::withCount([
            'residentSubscriptions' => function ($query) {
                $query->whereIn('status', ['active', 'trial', 'past_due']);
            },
        ])->get();

        $totalMrr = 0;
        foreach ($plans as $plan) {
            $mrrMultiplier = match ($plan->billing_interval) {
                'annually' => 1 / 12,
                'semi-annually' => 1 / 6,
                'quarterly' => 1 / 3,
                default => 1,
            };
            $totalMrr += ($plan->price * $mrrMultiplier) * $plan->resident_subscriptions_count;
        }

        return [
            'active_subscriptions' => $activeSubs,
            'past_due_subscriptions' => $pastDueSubs,
            'churned_this_month' => $cancelledSubs,
            'total_mrr' => round($totalMrr),
        ];
    }

    /**
     * Get distribution of residents across different plans and their MRR.
     */
    public function getPlanAnalytics(): array
    {
        $plans = Plan::withCount([
            'residentSubscriptions' => function ($query) {
                $query->whereIn('status', ['active', 'trial', 'past_due']);
            },
        ])->get();

        return $plans->map(function ($plan) {
            $mrrMultiplier = match ($plan->billing_interval) {
                'annually' => 1 / 12,
                'semi-annually' => 1 / 6,
                'quarterly' => 1 / 3,
                default => 1,
            };

            $mrr = ($plan->price * $mrrMultiplier) * $plan->resident_subscriptions_count;

            return [
                'plan_name' => $plan->name,
                'residents_count' => $plan->resident_subscriptions_count,
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

        $residentSubscriptions = ResidentSubscription::with('plan')
            ->whereIn('status', ['active', 'trial'])
            ->whereNotNull('current_period_end')
            ->whereBetween('current_period_end', [$now, $now->copy()->addDays(90)])
            ->get();

        $cohorts = [
            '0-30 days' => ['count' => 0, 'mrr_at_risk' => 0],
            '31-60 days' => ['count' => 0, 'mrr_at_risk' => 0],
            '61-90 days' => ['count' => 0, 'mrr_at_risk' => 0],
        ];

        foreach ($residentSubscriptions as $sub) {
            if (! $sub->plan || ! $sub->current_period_end) {
                continue;
            }

            $daysUntilRenewal = $now->diffInDays($sub->current_period_end);

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
        $activities = Activity::where('subject_type', ResidentSubscription::class)
            ->where('event', 'updated')
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->get();

        $upgrades = 0;
        $downgrades = 0;

        $plans = Plan::all()->keyBy('id');

        foreach ($activities as $activity) {
            $properties = $activity->properties;

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

        return [
            ['name' => 'Upgrades', 'value' => $upgrades, 'fill' => '#34d399'], // Emerald
            ['name' => 'Downgrades', 'value' => $downgrades, 'fill' => '#fb7185'], // Rose
        ];
    }

    /**
     * Get recent plan changes (upgrades/downgrades).
     */
    public function getRecentPlanChanges(): array
    {
        $activities = Activity::where('subject_type', ResidentSubscription::class)
            ->where('event', 'updated')
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->latest()
            ->limit(20)
            ->get();

        $plans = Plan::all()->keyBy('id');
        $changes = [];

        foreach ($activities as $activity) {
            $properties = $activity->properties;

            if (isset($properties['old']['plan_id']) && isset($properties['attributes']['plan_id'])) {
                $oldPlanId = $properties['old']['plan_id'];
                $newPlanId = $properties['attributes']['plan_id'];

                if ($oldPlanId != $newPlanId) {
                    $oldPlan = $plans->get($oldPlanId);
                    $newPlan = $plans->get($newPlanId);

                    $subscription = ResidentSubscription::with('user:id,name')->find($activity->subject_id);
                    $entityName = $subscription?->user ? trim($subscription->user->name) : null;
                    $entityId = $subscription?->user?->id;

                    if ($oldPlan && $newPlan && $entityName) {
                        $type = $newPlan->price > $oldPlan->price ? 'upgrade' : 'downgrade';

                        $changes[] = [
                            'id' => $activity->id,
                            'entity_name' => $entityName,
                            'entity_id' => $entityId,
                            'old_plan' => $oldPlan->name,
                            'new_plan' => $newPlan->name,
                            'type' => $type,
                            'date' => $activity->created_at->toIso8601String(),
                        ];

                        if (count($changes) >= 10) {
                            break;
                        }
                    }
                }
            }
        }

        return $changes;
    }

    /**
     * Get past due subscriptions
     */
    public function getPastDueSubscriptions(): array
    {
        return ResidentSubscription::with(['user:id,name', 'plan:id,name,price'])
            ->where('status', 'past_due')
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => 'resident_'.$sub->id,
                    'entity_name' => $sub->user ? trim($sub->user->name) : 'Unknown Resident',
                    'plan_name' => $sub->plan->name ?? 'Unknown',
                    'amount_due' => $sub->plan->price ?? 0,
                    'past_due_since' => clone $sub->updated_at,
                    'days_past_due' => Carbon::now()->diffInDays($sub->updated_at),
                ];
            })
            ->toArray();
    }
}
