<?php

namespace App\Actions\Security;

use App\Models\QuickEntryAllocation;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

            // Generate unique 4-character uppercase alphanumeric tags
            $tags = [];
            // Characters excluding confusing glyphs like 0/O, 1/I/L if desired, or standard alphanumeric
            $characters = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
            $charLength = strlen($characters);

            while (count($tags) < $count) {
                $tag = '';
                for ($i = 0; $i < 4; $i++) {
                    $tag .= $characters[random_int(0, $charLength - 1)];
                }

                if (! in_array($tag, $tags, true)) {
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
