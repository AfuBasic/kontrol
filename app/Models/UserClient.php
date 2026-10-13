<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * What one person uses Kontrol on: the platform and, for the store apps, the version. Never the user agent or IP.
 *
 * @property int $id
 * @property int $user_id
 * @property 'native'|'pwa'|'mobile_web'|'desktop_web' $platform
 * @property string $os
 * @property string|null $device_type
 * @property string|null $browser
 * @property string|null $app_version
 * @property CarbonImmutable $first_seen_at
 * @property CarbonImmutable $last_seen_at
 * @property-read User $user
 */
class UserClient extends Model
{
    use Prunable;

    public const NATIVE = 'native';

    public const PWA = 'pwa';

    public const MOBILE_WEB = 'mobile_web';

    public const DESKTOP_WEB = 'desktop_web';

    /** A client not seen for this long no longer describes anyone's current phone. */
    public const KEEP_DAYS = 180;

    public $timestamps = false;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'first_seen_at' => 'immutable_datetime',
            'last_seen_at' => 'immutable_datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Cleared by the daily model:prune.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::query()->where('last_seen_at', '<', now()->subDays(self::KEEP_DAYS));
    }
}
