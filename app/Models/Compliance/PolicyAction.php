<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_stage_id',
        'action_type',
        'configuration',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'configuration' => 'array',
            'is_enabled' => 'boolean',
        ];
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(PolicyStage::class, 'policy_stage_id');
    }
}
