<?php

namespace App\Services\Telegram;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class TelegramAccessCodeService
{
    /**
     * Create an access code for a Telegram user.
     *
     * @param  array{duration_minutes: int, visitor_name?: string}  $data
     */
    public function createCode(User $user, Estate $estate, array $data): AccessCode
    {
        $minutes = $data['duration_minutes'];

        // Enforce Estate Settings Constraints
        $settings = EstateSettings::forEstate($estate->id);
        $min = $settings->access_code_min_lifespan_minutes;
        $max = $settings->access_code_max_lifespan_minutes;

        if ($minutes < $min) {
            $minutes = $min;
        }
        if ($minutes > $max) {
            $minutes = $max;
        }

        // Enforce Daily Limit
        $usage = $this->getDailyUsageAndLimit($user, $estate);
        if ($usage['limit'] !== null && $usage['used'] >= $usage['limit']) {
            throw ValidationException::withMessages([
                'daily_limit' => ['You have reached your daily limit of '.$usage['limit'].' codes.'],
            ]);
        }

        return AccessCode::create([
            'estate_id' => $estate->id,
            'user_id' => $user->id,
            'code' => AccessCode::generateCode(),
            'type' => 'single_use',
            'visitor_name' => $data['visitor_name'] ?? null,
            'status' => AccessCodeStatus::Active,
            'expires_at' => now()->addMinutes($minutes),
        ]);
    }

    /**
     * Get active codes for a user in an estate.
     *
     * @return Collection<int, AccessCode>
     */
    public function getActiveCodes(User $user, Estate $estate): Collection
    {
        return AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->active()
            ->orderBy('expires_at')
            ->get();
    }

    /**
     * Get a single access code by ID for a user.
     */
    public function getCode(User $user, Estate $estate, int $codeId): ?AccessCode
    {
        return AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->where('id', $codeId)
            ->first();
    }

    /**
     * Revoke an access code.
     */
    public function revokeCode(User $user, Estate $estate, int $codeId): bool
    {
        $code = $this->getCode($user, $estate, $codeId);

        if (! $code) {
            return false;
        }

        $code->revoke();

        return true;
    }

    /**
     * Get duration options for an estate.
     *
     * @return array<int, array{minutes: int, label: string}>
     */
    public function getDurationOptions(Estate $estate): array
    {
        $settings = EstateSettings::forEstate($estate->id);
        $min = $settings->access_code_min_lifespan_minutes;
        $max = $settings->access_code_max_lifespan_minutes;

        $standardDurations = [30, 60, 120, 240, 480, 720, 1440];
        $options = [$min];

        $middleOptions = array_filter($standardDurations, fn ($d) => $d > $min && $d < $max);
        if (count($middleOptions) > 3) {
            $middleKeys = array_rand(array_flip($middleOptions), 3);
            $middleOptions = is_array($middleKeys) ? $middleKeys : [$middleKeys];
        } else {
            $middleOptions = array_values($middleOptions);
        }

        $options = array_merge($options, $middleOptions);

        if ($max > $min && ! in_array($max, $options)) {
            $options[] = $max;
        }

        $options = array_values(array_unique($options));
        sort($options);

        return array_map(fn ($minutes) => [
            'minutes' => $minutes,
            'label' => $this->formatDuration($minutes),
        ], $options);
    }

    /**
     * Get daily usage and limit for a user.
     *
     * @return array{used: int, limit: int|null}
     */
    public function getDailyUsageAndLimit(User $user, Estate $estate): array
    {
        $settings = EstateSettings::forEstate($estate->id);

        $used = AccessCode::query()
            ->forEstate($estate->id)
            ->forUser($user->id)
            ->whereDate('created_at', today())
            ->count();

        return [
            'used' => $used,
            'limit' => $settings->access_code_daily_limit_per_resident,
        ];
    }

    /**
     * Format duration in human-readable form.
     */
    private function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes} min";
        }

        $hours = floor($minutes / 60);
        if ($hours < 24) {
            return "{$hours}h";
        }

        $days = floor($hours / 24);

        return "{$days}d";
    }
}
