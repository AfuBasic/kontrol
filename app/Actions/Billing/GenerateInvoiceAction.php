<?php

namespace App\Actions\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Models\Estate;
use App\Models\Invoice;
use App\Services\BillingCycleService;
use Illuminate\Support\Facades\DB;

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
            $residentRole = \Spatie\Permission\Models\Role::where('name', 'resident')
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
                            ->where('model_has_roles.model_type', \App\Models\User::class)
                            ->where('model_has_roles.estate_id', $estate->id);
                    })
                    ->count();
            }

            // Compute amount: plan price × resident count
            $amount = ($subscription->plan->price ?? 0) * $activeResidents;

            // Calculate period dates
            // For first invoice, start from trial end date; otherwise from next_billing_date
            $periodStart = $isFirstInvoice
                ? $subscription->trial_ends_at->startOfDay()
                : ($subscription->next_billing_date ?? now()->startOfDay());

            $periodEnd = match ($subscription->billing_interval) {
                'quarterly' => $periodStart->copy()->addMonths(3)->subDay(),
                'semi-annually' => $periodStart->copy()->addMonths(6)->subDay(),
                'annually' => $periodStart->copy()->addYear()->subDay(),
                default => $periodStart->copy()->endOfDay(),
            };
            $dueDate = $periodStart->copy()->addDays(7);

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
            // Next billing date is the day after this period ends
            $nextDate = $periodEnd->addDay();

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
