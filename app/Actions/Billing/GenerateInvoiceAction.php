<?php

namespace App\Actions\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\BillingCycleService;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class GenerateInvoiceAction
{
    public function __construct(
        private BillingCycleService $billingCycleService,
    ) {}

    /**
     * Generate an invoice for an estate's subscription (bulk billing).
     *
     * @param  bool  $isFirstInvoice  Whether this is the first invoice (after trial ends)
     */
    public function execute(Estate $estate, bool $isFirstInvoice = false): ?Invoice
    {
        $subscription = $estate->subscriptionRecord;

        if (! $subscription || ! $subscription->plan) {
            return null;
        }

        return DB::transaction(function () use ($estate, $subscription, $isFirstInvoice) {
            $activeResidents = $this->countActiveResidents($estate);

            // Calculate period dates
            $periodStart = $isFirstInvoice && $subscription->trial_ends_at
                ? $subscription->trial_ends_at->startOfDay()
                : ($subscription->next_billing_date ?? now()->startOfDay());

            $periodEnd = $this->billingCycleService->calculatePeriodEnd($periodStart, $subscription->billing_interval);
            $dueDate = $periodStart->copy()->addDays(7);
            $nextDate = $periodEnd->copy()->addDay();

            // Handle Zero Residents Case: Skip Invoice Generation
            if ($activeResidents === 0) {
                $this->advanceSubscription($subscription, $periodStart, $nextDate);

                return null;
            }

            // Compute amount: plan price × resident count
            $amount = ($subscription->plan->price ?? 0) * $activeResidents;

            // Generate unique invoice number
            $invoiceNumber = $this->billingCycleService->generateInvoiceNumber($estate->id);

            // Create invoice
            $invoice = Invoice::create([
                'estate_id' => $estate->id,
                'plan_id' => $subscription->plan_id,
                'estate_subscription_id' => $subscription->id,
                'invoice_number' => $invoiceNumber,
                'amount' => $amount,
                'resident_count' => $activeResidents,
                'billing_period_start' => $periodStart,
                'billing_period_end' => $periodEnd,
                'due_date' => $dueDate,
                'status' => 'pending',
            ]);

            $this->advanceSubscription($subscription, $periodStart, $nextDate);

            // Log activity
            activity()
                ->on($estate)
                ->withProperties(['invoice_id' => $invoice->id, 'amount' => $amount])
                ->log('Estate bulk invoice generated');

            // Dispatch event
            InvoiceGenerated::dispatch($invoice);

            return $invoice;
        });
    }

    /**
     * Generate an individual invoice for a resident.
     */
    public function executeForResident(ResidentSubscription $subscription): ?Invoice
    {
        $estate = $subscription->estate;
        $estateSub = $estate->subscriptionRecord;

        if (! $estateSub || ! $estateSub->plan) {
            return null;
        }

        return DB::transaction(function () use ($estate, $estateSub, $subscription) {
            // Period dates for the resident
            $periodStart = $subscription->current_period_end ?? now()->startOfDay();
            $periodEnd = $this->billingCycleService->calculatePeriodEnd($periodStart, $estateSub->billing_interval);
            $dueDate = $periodStart->copy()->addDays(7);

            // Amount is simply the estate plan price (individual resident payment)
            $amount = $estateSub->plan->price;

            // Generate unique invoice number
            $invoiceNumber = $this->billingCycleService->generateInvoiceNumber($estate->id, $subscription->user_id);

            // Create invoice
            $invoice = Invoice::create([
                'estate_id' => $estate->id,
                'user_id' => $subscription->user_id,
                'plan_id' => $estateSub->plan_id,
                'estate_subscription_id' => $estateSub->id,
                'invoice_number' => $invoiceNumber,
                'amount' => $amount,
                'resident_count' => 1,
                'billing_period_start' => $periodStart,
                'billing_period_end' => $periodEnd,
                'due_date' => $dueDate,
                'status' => 'pending',
            ]);

            // Log activity
            activity()
                ->on($subscription->user)
                ->withProperties(['invoice_id' => $invoice->id, 'amount' => $amount])
                ->log('Individual resident invoice generated');

            // Dispatch event
            InvoiceGenerated::dispatch($invoice);

            return $invoice;
        });
    }


    private function advanceSubscription($subscription, $periodStart, $nextDate): void
    {
        if ($subscription->billing_anchor_day === null) {
            $subscription->update(['billing_anchor_day' => $periodStart->day]);
        }

        $subscription->update([
            'status' => 'active',
            'trial_ends_at' => null,
            'next_billing_date' => $nextDate,
        ]);
    }

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
