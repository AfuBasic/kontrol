<?php

namespace App\Models\Compliance;

use App\Models\Estate;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Violation extends Model
{
    use HasFactory;

    protected $table = 'compliance_violations';

    protected $fillable = [
        'estate_id',
        'user_id',
        'property_id',
        'compliance_policy_id',
        'current_stage_id',
        'violatable_type',
        'violatable_id',
        'violation_type',
        'status',
        'due_at',
        'original_amount',
        'outstanding_amount',
        'total_penalties_applied',
        'resolved_at',
        'resolution_reason',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'resolved_at' => 'datetime',
            'original_amount' => 'decimal:2',
            'outstanding_amount' => 'decimal:2',
            'total_penalties_applied' => 'decimal:2',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(CompliancePolicy::class, 'compliance_policy_id');
    }

    public function currentStage(): BelongsTo
    {
        return $this->belongsTo(PolicyStage::class, 'current_stage_id');
    }

    public function violatable(): MorphTo
    {
        return $this->morphTo();
    }

    public function restrictions(): HasMany
    {
        return $this->hasMany(Restriction::class);
    }

    public function activeRestrictions(): HasMany
    {
        return $this->hasMany(Restriction::class)->where('status', 'active');
    }

    public function penaltyRecords(): HasMany
    {
        return $this->hasMany(PenaltyRecord::class);
    }

    public function paymentPlan(): HasOne
    {
        return $this->hasOne(PaymentPlan::class);
    }

    public function activePaymentPlan(): HasOne
    {
        return $this->hasOne(PaymentPlan::class)->where('status', 'active');
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(ViolationTimeline::class)->orderBy('created_at', 'desc');
    }
}
