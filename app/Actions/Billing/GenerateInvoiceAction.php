<?php

namespace App\Actions\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingCycleService;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class GenerateInvoiceAction
{
    public function __construct(
        private BillingCycleService $billingCycleService,
    ) {}

    /**
     * Generate an invoice for an estate's subscription.
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
            // Count active residents (billed) - only accepted members with resident role
            // Get resident role first, then count users with that role and accepted status
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

            // Calculate period dates
            // For first invoice, start from trial end date; otherwise from next_billing_date
            $periodStart = $isFirstInvoice && $subscription->trial_ends_at
                ? $subscription->trial_ends_at->startOfDay()
                : ($subscription->next_billing_date ?? now()->startOfDay());

            $periodEnd = match ($subscription->billing_interval) {
                'quarterly' => $periodStart->copy()->addMonths(3)->subDay(),
                'semi-annually' => $periodStart->copy()->addMonths(6)->subDay(),
                'annually' => $periodStart->copy()->addYear()->subDay(),
                default => $periodStart->copy()->endOfDay(),
            };

            $dueDate = $periodStart->copy()->addDays(7);
            $nextDate = $periodEnd->copy()->addDay();

            // Handle Zero Residents Case: Skip Invoice Generation
            if ($activeResidents === 0) {
                // Advance subscription state even if no invoice is generated
                if ($subscription->billing_anchor_day === null) {
                    $subscription->update(['billing_anchor_day' => $periodStart->day]);
                }

                $subscription->update([
                    'status' => 'active',
                    'trial_ends_at' => null,
                    'next_billing_date' => $nextDate,
                ]);

                // Log activity for clarity
                activity()
                    ->on($estate)
                    ->withProperties(['reason' => 'zero_residents', 'period_start' => $periodStart->toDateString()])
                    ->log('Invoice skipped due to zero residents');

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
                'invoice_number' => $invoiceNumber,
                'amount' => $amount,
                'resident_count' => $activeResidents,
                'billing_period_start' => $periodStart,
                'billing_period_end' => $periodEnd,
                'due_date' => $dueDate,
                'status' => 'pending',
            ]);

            // Set billing anchor if first invoice (use the trial end day as anchor)
            if ($subscription->billing_anchor_day === null) {
                $subscription->update([
                    'billing_anchor_day' => $periodStart->day,
                ]);
            }

            // Update subscription: clear trial, set next billing date
            $subscription->update([
                'status' => 'active',
                'trial_ends_at' => null,
                'next_billing_date' => $nextDate,
            ]);

            // Log activity
            activity()
                ->on($estate)
                ->withProperties(['invoice_id' => $invoice->id, 'amount' => $amount])
                ->log('Invoice generated');

            // Dispatch event
            InvoiceGenerated::dispatch($invoice);

            return $invoice;
        });
    }
}
