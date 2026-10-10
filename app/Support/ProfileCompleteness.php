<?php

namespace App\Support;

use App\Models\User;
use App\Models\UserProfile;

/**
 * What a resident still has to fill in, and whether it is time to remind them.
 *
 * Complete means: a name, a unit number and an address (that is what guards read at the gate).
 * The reminder is deliberately gentle: dismissing it hides it for a week, but it comes back for as long
 * as anything is still missing.
 */
final class ProfileCompleteness
{
    public const SNOOZE_DAYS = 7;

    /**
     * @return array<int, 'name'|'unit'|'address'>
     */
    public static function missing(User $user): array
    {
        $missing = [];

        $name = trim((string) $user->name);
        // An empty name, or an email address used as a stand-in, counts as not set.
        if ($name === '' || str_contains($name, '@')) {
            $missing[] = 'name';
        }

        $profile = $user->profile;
        if (blank($profile?->unit_number)) {
            $missing[] = 'unit';
        }

        if (blank($profile?->address)) {
            $missing[] = 'address';
        }

        return $missing;
    }

    /**
     * Household members live under someone else's address, so they are never asked.
     */
    public static function appliesTo(User $user): bool
    {
        return ! $user->isHouseholdMember();
    }

    /**
     * @return array{missing: array<int, string>, show: bool}
     */
    public static function nudge(User $user): array
    {
        if (! self::appliesTo($user)) {
            return ['missing' => [], 'show' => false];
        }

        $missing = self::missing($user);

        return ['missing' => $missing, 'show' => $missing !== [] && ! self::isQuiet($user)];
    }

    /**
     * Hide the dashboard reminder for a week.
     */
    public static function dismiss(User $user): void
    {
        // Read the stored row, not the user's possibly stale cached relation, so repeat dismissals always add up.
        $profile = UserProfile::firstOrNew(['user_id' => $user->id]);

        $metadata = (array) $profile->metadata;
        $state = (array) ($metadata['profile_nudge'] ?? []);
        $count = ((int) ($state['dismissed_count'] ?? 0)) + 1;

        $metadata['profile_nudge'] = [
            'dismissed_count' => $count,
            'snoozed_until' => now()->addDays(self::SNOOZE_DAYS)->toIso8601String(),
        ];

        $profile->metadata = $metadata;
        $profile->save();

        $user->unsetRelation('profile');
    }

    private static function isQuiet(User $user): bool
    {
        $state = (array) (($user->profile?->metadata ?? [])['profile_nudge'] ?? []);

        $until = $state['snoozed_until'] ?? null;

        return $until !== null && now()->lt($until);
    }
}
