<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViolationTimeline extends Model
{
    use HasFactory;

    protected $table = 'compliance_timelines';

    public $timestamps = false;

    protected $fillable = [
        'violation_id',
        'event_type',
        'title',
        'description',
        'metadata',
        'actor_type',
        'actor_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function violation(): BelongsTo
    {
        return $this->belongsTo(Violation::class);
    }
}
