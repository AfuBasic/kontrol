<?php

namespace App\Services\Billing;

use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Models\User;
use Spatie\Permission\Models\Role;

class InvoiceGenerationService
{
    public function __construct(
        private GenerateInvoiceAction $generateInvoiceAction,
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
     * Get or create a pending invoice for a resident.
     */
    public function getOrCreatePendingInvoiceForResident(ResidentSubscription $subscription): ?Invoice
    {
        // Check if resident has an unpaid invoice (pending or overdue)
        $unpaidInvoice = Invoice::where('user_id', $subscription->user_id)
            ->where('estate_id', $subscription->estate_id)
            ->whereIn('status', ['pending', 'overdue'])
            ->latest('created_at')
            ->first();

        // If no unpaid invoice, generate one only if they are due or past due
        if (! $unpaidInvoice) {
            $isDue = $subscription->status === 'past_due' ||
                     ($subscription->current_period_end && $subscription->current_period_end->isPast()) ||
                     ($subscription->status === 'trial' && $subscription->trial_ends_at && $subscription->trial_ends_at->isPast());

            if ($isDue) {
                return $this->generateInvoiceAction->executeForResident($subscription);
            }

            return null;
        }

        // If unpaid invoice exists, ensure amount is updated to current estate plan price
        $estateSub = $subscription->estate->subscriptionRecord;
        if ($estateSub && $estateSub->plan) {
            $newAmount = $estateSub->plan->price;

            if ($unpaidInvoice->amount !== $newAmount) {
                $unpaidInvoice->update(['amount' => $newAmount]);
                $unpaidInvoice->refresh();
            }
        }

        return $unpaidInvoice;
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
