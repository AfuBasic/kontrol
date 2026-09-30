<?php

namespace App\Actions\Security;

use App\Models\AccessLog;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Illuminate\Support\Facades\DB;

class CheckoutQuickEntryAction
{
    /**
     * Check out a visitor by their tag.
     */
    public function execute(string $tag, int $estateId, User $checkoutBy): AccessLog
    {
        return DB::transaction(function () use ($tag, $estateId, $checkoutBy) {
            $log = AccessLog::withoutGlobalScopes()
                ->where('estate_id', $estateId)
                ->where('meta->entry_type', 'quick_entry')
                ->where('meta->tag', strtoupper($tag))
                ->whereNull('checked_out_at')
                ->firstOrFail();

            $updatedMeta = $log->meta;
            $updatedMeta['exit_point'] = app(CheckpointClaimService::class)
                ->getCurrentCheckpoint($estateId, $checkoutBy);
            $updatedMeta['exit_time'] = now()->toIso8601String();

            $log->update([
                'checked_out_at' => now(),
                'checked_out_by' => $checkoutBy->id,
                'exit_point' => $updatedMeta['exit_point'],
                'meta' => $updatedMeta,
            ]);

            activity('access')
                ->causedBy($checkoutBy)
                ->withProperties(['tag' => $tag])
                ->log("Visitor checked out (tag: {$tag})");

            return $log->fresh();
        });
    }
}
