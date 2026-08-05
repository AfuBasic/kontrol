<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenaltyRecord extends Model
{
    use HasFactory;

    protected $table = 'compliance_penalty_records';

    protected $fillable = [
        'violation_id',
        'policy_action_id',
        'penalty_type',
        'amount',
        'calculation_details',
        'applied_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'calculation_details' => 'array',
            'applied_at' => 'datetime',
        ];
    }

    public function violation(): BelongsTo
    {
        return $this->belongsTo(Violation::class);
    }

    public function action(): BelongsTo
    {
        return $this->belongsTo(PolicyAction::class, 'policy_action_id');
    }
}
