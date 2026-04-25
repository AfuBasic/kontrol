<?php

namespace App\Services\Billing;

use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Estate;
use App\Models\Invoice;
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

        \Log::info('InvoiceGenerationService::getOrCreatePendingInvoice', [
            'estate_id' => $estate->id,
            'active_residents_count' => $activeResidents,
        ]);

        // GUARD: Never generate or return invoices for estates with 0 residents
        if ($activeResidents < 1) {
            \Log::info('No residents, returning null');

            return null;
        }

        // Check if estate has a pending invoice
        $pendingInvoice = Invoice::where('estate_id', $estate->id)
            ->where('status', 'pending')
            ->latest('created_at')
            ->first();

        // If no pending invoice but residents exist, generate one
        if (! $pendingInvoice) {
            return $this->generateInvoiceAction->execute($estate, false);
        }

        // If pending invoice exists, refresh the resident count and amount
        if ($pendingInvoice && $pendingInvoice->status === 'pending') {
            // Don't generate if resident count drops to 0
            if ($activeResidents === 0) {
                return null;
            }

            $newAmount = ($pendingInvoice->plan->price ?? 0) * $activeResidents;

            $pendingInvoice->update([
                'resident_count' => $activeResidents,
                'amount' => $newAmount,
            ]);

            $pendingInvoice->refresh();

            return $pendingInvoice;
        }

        return null;
    }

    /**
     * Get or create a pending invoice for a resident.
     */
    public function getOrCreatePendingInvoiceForResident(\App\Models\ResidentSubscription $subscription): ?Invoice
    {
        // Check if resident has a pending invoice
        $pendingInvoice = Invoice::where('user_id', $subscription->user_id)
            ->where('estate_id', $subscription->estate_id)
            ->where('status', 'pending')
            ->latest('created_at')
            ->first();

        // If no pending invoice, generate one only if they are due or past due
        if (! $pendingInvoice) {
            $isDue = $subscription->status === 'past_due' || 
                     $subscription->status === 'expired' || 
                     ($subscription->current_period_end && $subscription->current_period_end->isPast()) ||
                     ($subscription->status === 'trial' && $subscription->trial_ends_at && $subscription->trial_ends_at->isPast());

            if ($isDue) {
                return $this->generateInvoiceAction->executeForResident($subscription);
            }
            
            return null;
        }

        // If pending invoice exists, ensure amount is updated to current estate plan price
        $estateSub = $subscription->estate->subscriptionRecord;
        if ($estateSub && $estateSub->plan) {
            $newAmount = $estateSub->plan->price;

            if ($pendingInvoice->amount !== $newAmount) {
                $pendingInvoice->update(['amount' => $newAmount]);
                $pendingInvoice->refresh();
            }
        }

        return $pendingInvoice;
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
