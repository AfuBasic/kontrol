<?php

namespace App\Services\Zeus;

use App\Models\Activity;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\ResidentSubscription;
use Illuminate\Support\Carbon;

class RiskAssessmentService
{
    protected EstateHealthService $estateHealthService;

    public function __construct(EstateHealthService $estateHealthService)
    {
        $this->estateHealthService = $estateHealthService;
    }

    /**
     * Identifies estates and residents at high risk of churning.
     * Risk factors:
     * - Past Due status
     * - Expiring Trial within 7 days without a saved card
     * - Dropping Health Score (< 70) for estates
     */
    public function getChurnRiskList(): array
    {
        $riskList = [];

        // 1. Process Estates
        $estates = Estate::with(['subscriptionRecord' => function ($q) {
            $q->whereIn('status', ['active', 'trial', 'past_due'])->latest();
        }])->get();

        foreach ($estates as $estate) {
            $healthScore = $this->estateHealthService->calculateHealthScore($estate);
            $subscription = $estate->subscriptionRecord;

            $riskFactors = [];
            $riskLevel = 'low';
            $mrrAtRisk = 0;

            if ($subscription && $subscription->plan) {
                $mrrAtRisk = $subscription->plan->price; // simplified MRR calc

                if ($subscription->status === 'past_due') {
                    $riskFactors[] = 'Payment Past Due';
                    $riskLevel = 'critical';
                }

                if ($subscription->status === 'trial' && $subscription->next_billing_date) {
                    $daysToExpiry = (int) ceil(Carbon::now()->floatDiffInDays($subscription->next_billing_date, false));
                    if ($daysToExpiry > 0 && $daysToExpiry <= 7 && empty($subscription->paystack_authorization_code)) {
                        $riskFactors[] = "Trial expires in {$daysToExpiry} days (No card)";
                        $riskLevel = $riskLevel === 'critical' ? 'critical' : 'high';
                    }
                }
            }

            if ($healthScore < 50) {
                $riskFactors[] = "Critical Health Score ({$healthScore}/100)";
                $riskLevel = 'critical';
            } elseif ($healthScore < 70) {
                $riskFactors[] = "Poor Health Score ({$healthScore}/100)";
                $riskLevel = $riskLevel === 'critical' ? 'critical' : 'high';
            }

            if (! empty($riskFactors)) {
                $riskList[] = [
                    'id' => 'estate_'.$estate->id,
                    'entity_type' => 'estate',
                    'entity_name' => $estate->name,
                    'entity_id' => $estate->id,
                    'health_score' => $healthScore,
                    'risk_level' => $riskLevel,
                    'risk_factors' => $riskFactors,
                    'mrr_at_risk' => $mrrAtRisk,
                    'last_active' => clone $estate->updated_at,
                ];
            }
        }

        // 2. Process Residents
        $now = Carbon::now();
        $residentSubscriptions = ResidentSubscription::with(['user:id,name', 'plan'])
            ->whereIn('status', ['active', 'trial', 'past_due'])
            ->get();

        foreach ($residentSubscriptions as $sub) {
            $riskFactors = [];
            $riskLevel = 'low';
            $mrrAtRisk = $sub->plan ? $sub->plan->price : 0; // Simplified MRR

            if ($sub->status === 'past_due') {
                $riskFactors[] = 'Payment Past Due';
                $riskLevel = 'critical';
            }

            if ($sub->status === 'trial' && $sub->current_period_end) {
                $daysToExpiry = (int) ceil(Carbon::now()->floatDiffInDays($sub->current_period_end, false));
                if ($daysToExpiry > 0 && $daysToExpiry <= 7 && empty($sub->paystack_authorization_code)) {
                    $riskFactors[] = "Trial expires in {$daysToExpiry} days (No card)";
                    $riskLevel = $riskLevel === 'critical' ? 'critical' : 'high';
                }
            }

            if (! empty($riskFactors)) {
                $entityName = $sub->user ? trim($sub->user->name) : 'Unknown Resident';
                $riskList[] = [
                    'id' => 'resident_'.$sub->id,
                    'entity_type' => 'resident',
                    'entity_name' => $entityName,
                    'entity_id' => $sub->user_id,
                    'health_score' => null, // Residents don't have individual health scores yet
                    'risk_level' => $riskLevel,
                    'risk_factors' => $riskFactors,
                    'mrr_at_risk' => $mrrAtRisk,
                    'last_active' => clone $sub->updated_at,
                ];
            }
        }

        // Sort by risk level (critical first, then high)
        usort($riskList, function ($a, $b) {
            if ($a['risk_level'] === $b['risk_level']) {
                return $b['mrr_at_risk'] <=> $a['mrr_at_risk'];
            }

            return $a['risk_level'] === 'critical' ? -1 : 1;
        });

        return $riskList;
    }

    /**
     * Retrieves a formatted stream of major platform events.
     */
    public function getPlatformActivityStream(int $limit = 30): array
    {
        $activities = Activity::with(['subject', 'causer'])
            ->latest()
            ->limit($limit)
            ->get();

        return $activities->map(function ($activity) {
            $eventTitle = 'Unknown Event';
            $description = $activity->description;
            $type = 'info';

            // Event categorization logic
            if ($activity->event === 'created') {
                if ($activity->subject_type === Estate::class) {
                    $eventTitle = 'New Estate Created';
                    $description = "Estate '{$activity->subject?->name}' has joined the platform.";
                    $type = 'success';
                } elseif ($activity->subject_type === ResidentSubscription::class) {
                    $eventTitle = 'New Resident Subscription';
                    $description = 'A new resident subscribed to a plan.';
                    $type = 'success';
                }
            } elseif ($activity->event === 'updated') {
                if (in_array($activity->subject_type, [EstateSubscription::class, ResidentSubscription::class])) {
                    $props = $activity->properties;
                    if (isset($props['attributes']['status']) && isset($props['old']['status'])) {
                        if ($props['attributes']['status'] === 'past_due') {
                            $eventTitle = 'Subscription Past Due';
                            $description = 'A subscription has moved to past due.';
                            $type = 'warning';
                        } elseif ($props['attributes']['status'] === 'cancelled') {
                            $eventTitle = 'Subscription Cancelled';
                            $description = 'A subscription was cancelled.';
                            $type = 'danger';
                        }
                    } elseif (isset($props['attributes']['plan_id']) && isset($props['old']['plan_id'])) {
                        $eventTitle = 'Plan Changed';
                        $description = 'A subscription plan was modified.';
                        $type = 'info';
                    }
                }
            }

            return [
                'id' => $activity->id,
                'title' => $eventTitle,
                'description' => $description,
                'type' => $type,
                'created_at' => $activity->created_at->toISOString(),
                'time_ago' => $activity->created_at->diffForHumans(),
            ];
        })->toArray();
    }
}
