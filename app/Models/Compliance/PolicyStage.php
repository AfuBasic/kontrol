<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'compliance_policy_id',
        'stage_name',
        'trigger_days',
        'order',
        'grace_period_days',
    ];

    protected function casts(): array
    {
        return [
            'trigger_days' => 'integer',
            'order' => 'integer',
            'grace_period_days' => 'integer',
        ];
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(CompliancePolicy::class, 'compliance_policy_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(PolicyAction::class);
    }
}
