<?php

namespace App\Models;

use Database\Factories\ZeusNotificationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $type
 * @property string $title
 * @property string $body
 * @property string|null $action_url
 * @property array<string, mixed>|null $data
 * @property Carbon|null $read_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class ZeusNotification extends Model
{
    /** @use HasFactory<ZeusNotificationFactory> */
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'body',
        'action_url',
        'data',
        'read_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    public function markAsRead(): void
    {
        if ($this->read_at !== null) {
            return;
        }

        $this->forceFill(['read_at' => now()])->save();
    }

    public function isUnread(): bool
    {
        return $this->read_at === null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function notify(
        string $type,
        string $title,
        string $body,
        ?string $actionUrl = null,
        array $data = [],
    ): self {
        return self::create([
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'action_url' => $actionUrl,
            'data' => $data === [] ? null : $data,
        ]);
    }
}
