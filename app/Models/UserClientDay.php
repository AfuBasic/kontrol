<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

/**
 * A day on which a person was active on one kind of client. The raw material for the Audience charts.
 *
 * @property int $id
 * @property int $user_id
 * @property string $platform
 * @property string $os
 * @property CarbonImmutable $day
 */
class UserClientDay extends Model
{
    use Prunable;

    /** Long enough for a year-on-year look, short enough that the table stays small. */
    public const KEEP_DAYS = 400;

    public $timestamps = false;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['day' => 'immutable_date'];
    }

    /**
     * Cleared by the daily model:prune.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::query()->where('day', '<', now()->subDays(self::KEEP_DAYS)->toDateString());
    }
}
