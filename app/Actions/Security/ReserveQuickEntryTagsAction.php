<?php

namespace App\Actions\Security;

use App\Models\AccessLog;
use App\Models\QuickEntryAllocation;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Illuminate\Support\Facades\DB;

class ReserveQuickEntryTagsAction
{
    /**
     * Reserve a block of 4-character tags for a guard at an estate gate.
     *
     * @return array{allocation_id: int, tags: list<string>, expires_at: string}
     */
    public function execute(
        int $estateId,
        User $guard,
        ?string $deviceFingerprint = null,
        int $count = 50,
        int $validForHours = 12
    ): array {
        return DB::transaction(function () use ($estateId, $guard, $deviceFingerprint, $count, $validForHours) {
            $checkpoint = app(CheckpointClaimService::class)->getCurrentCheckpoint($estateId, $guard);

            // Fetch any tags currently in circulation (unexpired allocations or visitors currently inside)
            $activeAllocations = QuickEntryAllocation::where('estate_id', $estateId)
                ->where('expires_at', '>', now())
                ->pluck('allocated_tags')
                ->flatten()
                ->filter()
                ->all();

            $activeInsideTags = AccessLog::withoutGlobalScopes()
                ->where('estate_id', $estateId)
                ->whereNull('access_code_id')
                ->where('meta->entry_type', 'quick_entry')
                ->whereNull('checked_out_at')
                ->where('verified_at', '>=', now()->subHours(24))
                ->get()
                ->pluck('meta.tag')
                ->filter()
                ->map(fn ($t) => strtoupper((string) $t))
                ->all();

            $unavailableTags = array_flip(array_merge($activeAllocations, $activeInsideTags));

            // Generate unique 4-character uppercase alphanumeric tags
            $tags = [];
            // Characters excluding confusing glyphs like 0/O, 1/I/L
            $characters = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
            $charLength = strlen($characters);

            $attempts = 0;
            $maxAttempts = $count * 50;

            while (count($tags) < $count && $attempts < $maxAttempts) {
                $attempts++;
                $tag = '';
                for ($i = 0; $i < 4; $i++) {
                    $tag .= $characters[random_int(0, $charLength - 1)];
                }

                if (! isset($unavailableTags[$tag]) && ! in_array($tag, $tags, true)) {
                    $tags[] = $tag;
                }
            }

            $expiresAt = now()->addHours($validForHours);

            $allocation = QuickEntryAllocation::create([
                'estate_id' => $estateId,
                'user_id' => $guard->id,
                'checkpoint_id' => $checkpoint,
                'device_fingerprint' => $deviceFingerprint,
                'allocated_tags' => $tags,
                'allocated_count' => count($tags),
                'used_count' => 0,
                'expires_at' => $expiresAt,
            ]);

            return [
                'allocation_id' => $allocation->id,
                'tags' => $tags,
                'expires_at' => $expiresAt->toIso8601String(),
            ];
        });
    }
}
