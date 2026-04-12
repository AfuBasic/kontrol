<?php

namespace App\Services\Admin;

use App\Models\Invoice;
use App\Models\User;
use App\Services\Billing\InitializeTrialService;
use App\Services\BillingCycleService;
use App\Services\EstateContextService;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Permission\Models\Role;

class BillingService
{
    public function __construct(
        private EstateContextService $estateContext,
        private BillingCycleService $billingCycleService,
        private InitializeTrialService $initializeTrialService,
    ) {}

    /**
     * Get billing overview data.
     */
    public function getOverview(): array
    {
        $estate = $this->estateContext->getEstate();

        // Auto-correct subscription trial if needed (based on estate creation date)
        if ($estate->subscriptionRecord && (! $estate->subscriptionRecord->trial_ends_at || ! $estate->subscriptionRecord->status)) {
            $this->initializeTrialService->initializeForEstate($estate);
        }

        $subscription = $estate->subscriptionRecord;

        if (! $subscription) {
            return [
                'plan_name' => null,
                'next_billing_date' => null,
                'trial_status' => null,
                'trial_ends_at' => null,
                'outstanding_invoices' => 0,
                'active_residents' => 0,
                'upcoming_amount' => 0,
                'has_overdue' => false,
            ];
        }

        $residentRole = Role::where('name', 'resident')
            ->where('guard_name', 'web')
            ->whereNull('estate_id')
            ->first();

        $activeResidents = 0;
        if ($residentRole) {
            $activeResidents = $estate->users()
                ->wherePivot('status', 'accepted')
                ->whereIn('users.id', function ($q) use ($residentRole, $estate) {
                    $q->select('model_has_roles.model_id')
                        ->from('model_has_roles')
                        ->where('model_has_roles.role_id', $residentRole->id)
                        ->where('model_has_roles.model_type', User::class)
                        ->where('model_has_roles.estate_id', $estate->id);
                })
                ->count();
        }
        $upcomingAmount = ($subscription->plan->price ?? 0) * $activeResidents;

        $outstandingInvoices = Invoice::where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->count();

        $hasOverdue = Invoice::where('estate_id', $estate->id)
            ->where('status', 'overdue')
            ->exists();

        // Handle trial vs active subscription
        if ($subscription->status === 'trial' && $subscription->trial_ends_at) {
            return [
                'plan_name' => $subscription->plan->name,
                'trial_status' => 'active',
                'trial_ends_at' => $subscription->trial_ends_at->toDateString(),
                'next_billing_date' => $subscription->trial_ends_at->toDateString(),
                'outstanding_invoices' => $outstandingInvoices,
                'active_residents' => $activeResidents,
                'upcoming_amount' => $upcomingAmount,
                'has_overdue' => $hasOverdue,
            ];
        }

        // Compute next billing date if not set
        $nextBillingDate = $subscription->next_billing_date;
        if (! $nextBillingDate && $subscription->billing_anchor_day) {
            $nextBillingDate = $this->billingCycleService->computeNextBillingDate(
                $subscription->billing_anchor_day,
                $subscription->billing_interval ?? 'monthly'
            );
        } elseif (! $nextBillingDate) {
            // If no anchor day set, use 15th as default
            $nextBillingDate = $this->billingCycleService->computeNextBillingDate(15, $subscription->billing_interval ?? 'monthly');
        }

        return [
            'plan_name' => $subscription->plan->name,
            'next_billing_date' => $nextBillingDate?->toDateString(),
            'trial_status' => null,
            'trial_ends_at' => null,
            'outstanding_invoices' => $outstandingInvoices,
            'active_residents' => $activeResidents,
            'upcoming_amount' => $upcomingAmount,
            'has_overdue' => $hasOverdue,
        ];
    }

    /**
     * Get paginated invoices with filters.
     */
    public function getInvoices(array $filters = []): LengthAwarePaginator
    {
        $estate = $this->estateContext->getEstate();

        $query = Invoice::where('estate_id', $estate->id)
            ->with('plan')
            ->orderBy('created_at', 'desc');

        if (isset($filters['status']) && in_array($filters['status'], ['pending', 'paid', 'overdue'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(10);
    }

    /**
     * Get payment history (paid invoices only).
     */
    public function getPaymentHistory(array $filters = []): LengthAwarePaginator
    {
        $estate = $this->estateContext->getEstate();

        $query = Invoice::where('estate_id', $estate->id)
            ->where('status', 'paid')
            ->with('plan')
            ->orderBy('paid_at', 'desc');

        return $query->paginate(10);
    }

    /**
     * Check if billing is restricted (overdue without grace).
     */
    public function isRestricted(): bool
    {
        $estate = $this->estateContext->getEstate();

        return Invoice::where('estate_id', $estate->id)
            ->where('status', 'overdue')
            ->exists();
    }
}
