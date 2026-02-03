<?php

namespace App\Services\Resident;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class AccessCodeService
{
    /**
     * Get the current user's active estate.
     */
    public function getCurrentEstate(): Estate
    {
        /** @var User $user */
        $user = Auth::user();

        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->firstOrFail();
    }

    /**
     * Create a new access code for a visitor.
     *
     * @param  array{visitor_name?: string, visitor_phone?: string, purpose?: string, duration_minutes: int, notes?: string}  $data
     */
    public function createCode(array $data): AccessCode
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        $type = $data['type'] ?? 'single_use';
        $expiresAt = null;

        if ($type === 'single_use') {
             $minutes = $data['duration_minutes'] ?? 60; // Default fallback
             
             // Enforce Estate Settings Constraints
             $settings = EstateSettings::forEstate($estate->id);
             $min = $settings->access_code_min_lifespan_minutes;
             $max = $settings->access_code_max_lifespan_minutes;
             
             if ($minutes < $min) $minutes = $min;
             if ($minutes > $max) $minutes = $max;

             $expiresAt = now()->addMinutes($minutes);
        }

        return AccessCode::create([
            'estate_id' => $estate->id,
            'user_id' => $user->id,
            'code' => AccessCode::generateCode(),
            'type' => $type,
            'visitor_name' => $data['visitor_name'] ?? null,
            'visitor_phone' => $data['visitor_phone'] ?? null,
            'purpose' => $data['purpose'] ?? null,
            'status' => AccessCodeStatus::Active,
            'expires_at' => $expiresAt,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * Get active access codes for the current user.
     *
     * @return Collection<int, AccessCode>
     */
    public function getActiveCodes(): Collection
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->active()
            ->orderBy('expires_at')
            ->get();
    }

    /**
     * Get access code history for the current user.
     *
     * @return Collection<int, AccessCode>
     */
    public function getCodeHistory(int $limit = 20): Collection
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->whereIn('status', [AccessCodeStatus::Used, AccessCodeStatus::Expired, AccessCodeStatus::Revoked])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get all access codes for the current user (paginated).
     *
     * @return Collection<int, AccessCode>
     */
    public function getAllCodes(): Collection
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get a single access code by ID for the current user.
     */
    public function getCode(int $id): ?AccessCode
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->find($id);
    }

    /**
     * Revoke an access code.
     */
    public function revokeCode(AccessCode $accessCode): void
    {
        $accessCode->revoke();
    }

    /**
     * Get recent activity for the current user.
     *
     * @return Collection<int, array{type: string, message: string, time: string, time_full: string, code?: string, visitor?: string}>
     */
    public function getRecentActivity(int $limit = 10): Collection
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        $codes = AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();

        return $codes->map(function (AccessCode $code) {
            $type = match ($code->status) {
                AccessCodeStatus::Active => 'created',
                AccessCodeStatus::Used => 'used',
                AccessCodeStatus::Expired => 'expired',
                AccessCodeStatus::Revoked => 'revoked',
            };

            $message = match ($code->status) {
                AccessCodeStatus::Active => 'Access code created',
                AccessCodeStatus::Used => 'Visitor arrived',
                AccessCodeStatus::Expired => 'Access code expired',
                AccessCodeStatus::Revoked => 'Access code revoked',
            };

            if ($code->visitor_name) {
                $message = match ($code->status) {
                    AccessCodeStatus::Active => "Code created for {$code->visitor_name}",
                    AccessCodeStatus::Used => "{$code->visitor_name} arrived",
                    AccessCodeStatus::Expired => "Code for {$code->visitor_name} expired",
                    AccessCodeStatus::Revoked => "Code for {$code->visitor_name} revoked",
                };
            }

            $timestamp = match ($code->status) {
                AccessCodeStatus::Used => $code->used_at,
                AccessCodeStatus::Revoked => $code->revoked_at,
                default => $code->created_at,
            };

            return [
                'type' => $type,
                'message' => $message,
                'time' => $timestamp?->diffForHumans() ?? '',
                'time_full' => $timestamp?->format('M j, Y g:i A') ?? '',
                'code' => $code->code,
                'visitor' => $code->visitor_name,
            ];
        });
    }

    /**
     * Get stats for the current user's home screen.
     *
     * @return array{active_codes: int, codes_today: int, visitors_today: int}
     */
    public function getHomeStats(): array
    {
        /** @var User $user */
        $user = Auth::user();
        $estate = $this->getCurrentEstate();

        $today = Carbon::today();

        $activeCodes = AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->active()
            ->count();

        $codesToday = AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->whereDate('created_at', $today)
            ->count();

        $visitorsToday = AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->where('status', AccessCodeStatus::Used)
            ->whereDate('used_at', $today)
            ->count();

        return [
            'active_codes' => $activeCodes,
            'codes_today' => $codesToday,
            'visitors_today' => $visitorsToday,
        ];
    }

    /**
     * Get available duration options based on estate settings.
     *
     * @return array<int, array{minutes: int, label: string}>
     */
    public function getDurationOptions(): array
    {
        $estate = $this->getCurrentEstate();
        $settings = EstateSettings::forEstate($estate->id);

        $min = $settings->access_code_min_lifespan_minutes;
        $max = $settings->access_code_max_lifespan_minutes;

        // Base options to consider (sensible defaults)
        $standardDurations = [30, 60, 120, 240, 480, 720, 1440, 2880, 4320, 10080];
        
        $options = [];

        // 1. First option: Minimum
        $options[] = $min;

        // 2. Middle options: Filter standard durations that are > min and < max
        $middleOptions = array_filter($standardDurations, fn($d) => $d > $min && $d < $max);
        
        // Pick a few representative ones if too many, or just use them
        // For simplicity and randomness as requested, let's pick up to 3 random ones if there are many,
        // but sorting them makes more UX sense than random.
        // User asked for "randomly choose other options", lets pick 3 random ones from the valid range if available.
        if (count($middleOptions) > 3) {
             $middleKeys = array_rand($middleOptions, 3);
             $middleOptions = array_intersect_key($middleOptions, array_flip((array)$middleKeys));
        }
        
        $options = array_merge($options, $middleOptions);

        // 3. Last option: Maximum (if different from min)
        if ($max > $min && !in_array($max, $options)) {
             $options[] = $max;
        }

        // Sort unique values
        $options = array_values(array_unique($options));
        sort($options);

        // Format for frontend
        return array_map(fn($minutes) => [
            'minutes' => $minutes,
            'label' => $this->formatDuration($minutes),
        ], $options);
    }
    
    private function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes} minutes";
        }
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        if ($hours < 24) {
             return $remainingMinutes > 0 
                ? "{$hours} hr {$remainingMinutes} min" 
                : "{$hours} " . ($hours == 1 ? "hour" : "hours");
        }
        
        $days = floor($hours / 24);
        return "{$days} " . ($days == 1 ? "day" : "days");
    }

    /**
     * Get duration constraints for custom input.
     */
    public function getDurationConstraints(): array
    {
        $estate = $this->getCurrentEstate();
        $settings = EstateSettings::forEstate($estate->id);

        return [
            'min' => $settings->access_code_min_lifespan_minutes,
            'max' => $settings->access_code_max_lifespan_minutes,
        ];
    }
}
