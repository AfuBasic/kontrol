<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationTimeline extends Model
{
    protected $fillable = [
        'estate_application_id',
        'event_type',
        'description',
        'metadata',
        'creator_name',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * @return BelongsTo<EstateApplication, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(EstateApplication::class, 'estate_application_id');
    }
}
