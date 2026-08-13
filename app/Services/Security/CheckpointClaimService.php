<?php

namespace App\Services\Security;

use App\Models\EstateSettings;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class CheckpointClaimService
{
    public const LOCK_TTL_SECONDS = 1800; // 30 minutes

    /**
     * Claim an entry point for a security user atomically.
     */
    public function claim(int $estateId, User $user, string $entryPoint): bool
    {
        $settings = EstateSettings::forEstate($estateId);
        $configured = $settings->entry_points ?: [];

        if (! in_array($entryPoint, $configured, true)) {
            throw ValidationException::withMessages([
                'entry_point' => ['The selected entry point is not configured for this estate.'],
            ]);
        }

        $lockKey = $this->getLockKey($estateId, $entryPoint);
        $userKey = $this->getUserKey($estateId, $user->id);

        // Check if user currently holds another checkpoint and release it
        $existing = $this->getCurrentCheckpoint($estateId, $user);
        if ($existing && $existing !== $entryPoint) {
            $this->release($estateId, $user);
        }

        $currentOccupant = Cache::get($lockKey);

        // If currently unoccupied or occupied by this exact user, claim/renew lock
        if ($currentOccupant === null || (int) $currentOccupant === $user->id) {
            Cache::put($lockKey, $user->id, self::LOCK_TTL_SECONDS);
            Cache::put($userKey, $entryPoint, self::LOCK_TTL_SECONDS);
            session(['active_checkpoint' => $entryPoint]);

            activity()
                ->causedBy($user)
                ->withProperties([
                    'estate_id' => $estateId,
                    'entry_point' => $entryPoint,
                ])
                ->log("Claimed checkpoint {$entryPoint}");

            return true;
        }

        // Try atomic add if lock key expired in between
        $acquired = Cache::add($lockKey, $user->id, self::LOCK_TTL_SECONDS);

        if ($acquired) {
            Cache::put($userKey, $entryPoint, self::LOCK_TTL_SECONDS);
            session(['active_checkpoint' => $entryPoint]);

            activity()
                ->causedBy($user)
                ->withProperties([
                    'estate_id' => $estateId,
                    'entry_point' => $entryPoint,
                ])
                ->log("Claimed checkpoint {$entryPoint}");

            return true;
        }

        return false;
    }

    /**
     * Release the checkpoint currently claimed by the user.
     */
    public function release(int $estateId, User $user): void
    {
        $userKey = $this->getUserKey($estateId, $user->id);
        $current = Cache::get($userKey) ?: session('active_checkpoint');

        if ($current) {
            $lockKey = $this->getLockKey($estateId, $current);
            $occupant = Cache::get($lockKey);

            if ($occupant !== null && (int) $occupant === $user->id) {
                Cache::forget($lockKey);
            }

            Cache::forget($userKey);
            session()->forget('active_checkpoint');

            activity()
                ->causedBy($user)
                ->withProperties([
                    'estate_id' => $estateId,
                    'entry_point' => $current,
                ])
                ->log("Released checkpoint {$current}");
        }
    }

    /**
     * Refresh the TTL for the active claim.
     */
    public function refresh(int $estateId, User $user): void
    {
        $current = $this->getCurrentCheckpoint($estateId, $user);

        if ($current) {
            $lockKey = $this->getLockKey($estateId, $current);
            $userKey = $this->getUserKey($estateId, $user->id);

            Cache::put($lockKey, $user->id, self::LOCK_TTL_SECONDS);
            Cache::put($userKey, $current, self::LOCK_TTL_SECONDS);
            session(['active_checkpoint' => $current]);
        }
    }

    /**
     * Get the active checkpoint claimed by the given user.
     */
    public function getCurrentCheckpoint(int $estateId, User $user): ?string
    {
        $userKey = $this->getUserKey($estateId, $user->id);
        $checkpoint = Cache::get($userKey) ?: session('active_checkpoint');

        if (! $checkpoint) {
            return null;
        }

        $lockKey = $this->getLockKey($estateId, $checkpoint);
        $occupant = Cache::get($lockKey);

        if ($occupant !== null && (int) $occupant === $user->id) {
            if (! session()->has('active_checkpoint')) {
                session(['active_checkpoint' => $checkpoint]);
            }

            return $checkpoint;
        }

        // Lock expired or taken by someone else
        Cache::forget($userKey);
        session()->forget('active_checkpoint');

        return null;
    }

    /**
     * Get status of all configured entry points for an estate.
     * Returns array of ['name' => string, 'is_available' => bool, 'occupied_by' => ?array]
     *
     * @param  array<int, string>  $configuredEntryPoints
     * @return array<int, array{name: string, is_available: bool, is_mine: bool, occupied_by_id: ?int, occupied_by_name: ?string}>
     */
    public function getCheckpointStatuses(int $estateId, array $configuredEntryPoints, User $currentUser): array
    {
        $statuses = [];

        // Preload occupant users if any
        $occupantIds = [];
        foreach ($configuredEntryPoints as $point) {
            $lockKey = $this->getLockKey($estateId, $point);
            $occupantId = Cache::get($lockKey);
            if ($occupantId) {
                $occupantIds[] = (int) $occupantId;
            }
        }

        $users = ! empty($occupantIds)
            ? User::whereIn('id', array_unique($occupantIds))->get()->keyBy('id')
            : collect();

        foreach ($configuredEntryPoints as $point) {
            $lockKey = $this->getLockKey($estateId, $point);
            $occupantId = Cache::get($lockKey) !== null ? (int) Cache::get($lockKey) : null;
            $isMine = $occupantId === $currentUser->id;
            $isAvailable = $occupantId === null || $isMine;
            $occupantUser = $occupantId ? $users->get($occupantId) : null;

            $statuses[] = [
                'name' => $point,
                'is_available' => $isAvailable,
                'is_mine' => $isMine,
                'occupied_by_id' => $occupantId,
                'occupied_by_name' => $occupantUser?->name,
            ];
        }

        return $statuses;
    }

    private function getLockKey(int $estateId, string $entryPoint): string
    {
        $slug = md5(strtolower(trim($entryPoint)));

        return "checkpoint_lock:{$estateId}:{$slug}";
    }

    private function getUserKey(int $estateId, int $userId): string
    {
        return "checkpoint_user:{$estateId}:{$userId}";
    }
}
