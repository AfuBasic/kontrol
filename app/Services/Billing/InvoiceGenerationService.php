<?php

namespace App\Services\Billing;

use App\Actions\Billing\CalculateInvoicePricingAction;
use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\BillingCycleService;
use Spatie\Permission\Models\Role;

class InvoiceGenerationService
{
    public function __construct(
        private GenerateInvoiceAction $generateInvoiceAction,
        private CalculateInvoicePricingAction $pricingAction,
        private BillingCycleService $billingCycleService,
    ) {}

    /**
     * Get or create a pending invoice for an estate.
     * Updates resident count if invoice exists.
     */
    public function getOrCreatePendingInvoice(Estate $estate): ?Invoice
    {
        // Count active residents first
        $activeResidents = $this->countActiveResidents($estate);

        // GUARD: Never generate or return invoices for estates with 0 residents
        if ($activeResidents < 1) {
            return null;
        }

        // Check if estate has an unpaid invoice (pending or overdue)
        $unpaidInvoice = Invoice::where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue'])
            ->latest('created_at')
            ->first();

        // If no unpaid invoice but residents exist, generate one
        if (! $unpaidInvoice) {
            return $this->generateInvoiceAction->execute($estate, false);
        }

        // If unpaid invoice exists, refresh the resident count and amount
        if ($unpaidInvoice) {
            // Don't generate if resident count drops to 0
            if ($activeResidents === 0) {
                return null;
            }

            $newAmount = ($unpaidInvoice->plan->price ?? 0) * $activeResidents;

            $unpaidInvoice->update([
                'resident_count' => $activeResidents,
                'amount' => $newAmount,
            ]);

            $unpaidInvoice->refresh();

            return $unpaidInvoice;
        }

        return null;
    }

    /**
     * Get or create a pending invoice for a resident subscription.
     */
    public function getOrCreatePendingInvoiceForResident(ResidentSubscription $subscription): ?Invoice
    {
        if (! $subscription->plan) {
            return null;
        }

        // ONE OUTSTANDING INVOICE INVARIANT
        $existingInvoice = Invoice::where('user_id', $subscription->user_id)
            ->where('estate_id', $subscription->estate_id)
            ->whereIn('status', ['pending', 'overdue'])
            ->latest('created_at')
            ->first();

        if ($existingInvoice) {
            return $existingInvoice;
        }

        $estate = $subscription->estate;
        $plan = $subscription->plan;

        $periodStart = (in_array($subscription->status, ['active', 'trial']) && $subscription->current_period_end && $subscription->current_period_end->isFuture())
            ? $subscription->current_period_end
            : now()->startOfDay();

        $periodEnd = $this->billingCycleService->calculatePeriodEnd($periodStart, $plan->billing_interval);
        $dueDate = $periodStart->copy()->addDays(7);

        $pricing = $this->pricingAction->execute(
            $plan->price ?? 0,
            $subscription->coupon,
            $subscription->user,
            $estate,
            $subscription,
            true // Automated recurring cycle generation
        );

        $invoiceNumber = $this->billingCycleService->generateInvoiceNumber($estate->id, $subscription->user_id);

        $metadata = $pricing['metadata'] ?? [];
        if ($subscription->auto_renew_enabled) {
            $metadata['auto_renew_consent'] = true;
            $metadata['is_recurring'] = true;
        }

        return Invoice::create([
            'estate_id' => $estate->id,
            'user_id' => $subscription->user_id,
            'plan_id' => $plan->id,
            'estate_subscription_id' => null,
            'invoice_number' => $invoiceNumber,
            'amount' => $pricing['amount'],
            'resident_count' => 1,
            'billing_period_start' => $periodStart,
            'billing_period_end' => $periodEnd,
            'due_date' => $dueDate,
            'status' => 'pending',
            'metadata' => $metadata,
        ]);
    }

    /**
     * Count active residents for an estate (accepted members with resident role).
     */
    private function countActiveResidents(Estate $estate): int
    {
        $residentRole = Role::where('name', 'resident')
            ->where('guard_name', 'web')
            ->whereNull('estate_id')
            ->first();

        if (! $residentRole) {
            return 0;
        }

        return $estate->users()
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
}
